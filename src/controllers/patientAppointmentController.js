const Appointment = require("../models/Appointments");
const Patient = require("../models/Patients");
const Employee = require("../models/Employees");
const checkAppointmentValidity = require("../validators/checkAppointmentValidity");
const enrichAppointments = require("../utils/enrichAppointments");
const parsePagination = require("../utils/parsePagination");
const sendEmail = require("../utils/sendEmail");
const emailTemplates = require("../utils/emailTemplates");

// Book a new appointment (patient books for themselves)
exports.bookAppointment = async (req, res) => {
    try {
        const patientId = req.patient.patientId;
        const { doctorEmployeeId, appointmentDate, timeSlot } = req.body;

        const valid = await checkAppointmentValidity({
            patientId,
            doctorId: doctorEmployeeId,
            appointmentDate,
            timeSlot,
        });

        if (!valid.success) {
            return res.status(valid.status).json({ message: valid.message });
        }

        const appointment = await Appointment.create({
            patientId,
            doctorEmployeeId,
            appointmentDate,
            timeSlot,
        });

        try {
            await sendEmail({
                to: valid.patient.email,
                ...emailTemplates.appointmentScheduled({
                    patientName: valid.patient.name,
                    doctorName: valid.doctor.name,
                    appointmentDate,
                    timeSlot,
                }),
            });
        } catch (emailErr) {
            console.error("Email error:", emailErr);
        }

        return res.status(201).json({
            message: "Appointment booked successfully",
            appointment,
        });
    } catch (err) {
        console.error("Patient booking error:", err);
        return res.status(500).json({ message: "Server error during appointment booking" });
    }
};

// List the authenticated patient's own appointments (paginated)
exports.getMyAppointments = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const filter = { patientId: req.patient.patientId };

        if (req.query.status) {
            filter.status = req.query.status;
        }

        if (req.query.date) {
            const start = new Date(req.query.date);
            const end = new Date(req.query.date);
            end.setHours(23, 59, 59, 999);
            filter.appointmentDate = { $gte: start, $lte: end };
        }

        const [appointments, total] = await Promise.all([
            Appointment.find(filter)
                .select("-__v")
                .sort({ appointmentDate: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Appointment.countDocuments(filter),
        ]);

        const enriched = await enrichAppointments(appointments);

        return res.status(200).json({
            message: "Appointments retrieved successfully",
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            appointments: enriched,
        });
    } catch (err) {
        console.error("Patient appointments error:", err);
        return res.status(500).json({ message: "Server error while fetching appointments" });
    }
};

// Cancel one of the patient's own BOOKED appointments
exports.cancelMyAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const patientId = req.patient.patientId;

        const appointment = await Appointment.findOne({ appointmentId, patientId });

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.status === "CANCELED") {
            return res.status(400).json({ message: "Appointment is already cancelled" });
        }

        if (appointment.status === "COMPLETED") {
            return res.status(400).json({ message: "Completed appointments cannot be cancelled" });
        }

        appointment.status = "CANCELED";
        await appointment.save();

        // Notify patient by email
        try {
            const [patient, doctor] = await Promise.all([
                Patient.findOne({ UHID: patientId }).select("name email"),
                Employee.findOne({ employeeCode: appointment.doctorEmployeeId }).select("name"),
            ]);

            if (patient?.email) {
                await sendEmail({
                    to: patient.email,
                    ...emailTemplates.appointmentCanceled({
                        patientName: patient.name,
                        doctorName: doctor?.name,
                        appointmentDate: appointment.appointmentDate,
                        timeSlot: appointment.timeSlot,
                    }),
                });
            }
        } catch (emailErr) {
            console.error("Email error:", emailErr);
        }

        return res.status(200).json({
            message: "Appointment cancelled successfully",
            appointment,
        });
    } catch (err) {
        console.error("Patient cancel error:", err);
        return res.status(500).json({ message: "Server error during cancellation" });
    }
};

// Return booked slots for a doctor on a given date (used by booking form)
exports.getBookedSlots = async (req, res) => {
    try {
        const { doctorEmployeeId, date } = req.query;

        if (!doctorEmployeeId || !date) {
            return res.status(400).json({ message: "doctorEmployeeId and date are required" });
        }

        const start = new Date(date);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const appointments = await Appointment.find({
            doctorEmployeeId,
            appointmentDate: { $gte: start, $lte: end },
            status: "BOOKED",
        }).select("timeSlot -_id");

        return res.status(200).json({
            message: "Booked slots retrieved successfully",
            bookedSlots: appointments.map((a) => a.timeSlot),
        });
    } catch (err) {
        console.error("Booked slots error:", err);
        return res.status(500).json({ message: "Server error while fetching booked slots" });
    }
};
