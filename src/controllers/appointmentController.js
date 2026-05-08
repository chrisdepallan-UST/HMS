const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

const sendEmail = require("../utils/sendEmail");


// ─── Appointment ────────────────────────────────────────────────────────────────
exports.createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, timeSlot, reason } = req.body;

    // Generate a unique appointmentId
    const appointmentId = crypto.randomBytes(16).toString("hex");

    const appointment = await Appointment.create({
      appointmentId, // Add the unique appointmentId
      patientId,
      doctorId,
      appointmentDate,
      timeSlot,
      reason,
      status: "scheduled",
    });
const token = jwt.sign(
          { id: appointment._id},
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN },
        );
    res.status(201).json({ message: "Appointment created", token, appointment });
  } catch (err) {
    console.error("Create appointment error:", err);
    res.status(500).json({ message: "Server error during appointment creation" });
  }
};

exports.getAppointment = async (req, res) => {
  try{
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json({
      appointment: {
        id: appointment._id,
        patient_id: appointment.patientId,
        doctor_id: appointment.doctorId,
        date: appointment.date
      }
    });
  }
  catch (err){
    console.error("Create appointment error:", err);
    res.status(500).json({ message: "Server error during appointment retrieval" });
  }
}

exports.getAppointmentsForDoctoruser = async (req, res) => {
  try{
    // get current logged in doctor user id from me endpoint 
    const doctorId = req.params.id;
  
    const appointments=await Appointment.find({ doctorId: req.params.id });

    res.status(200).json({
      appointments: appointments.map(appointment => ({
        id: appointment._id,
        patient_id: appointment.patientId,
        doctor_id: appointment.doctorId,
        timeSlot: appointment.timeSlot,
        appointmentDate: appointment.appointmentDate,
        reason: appointment.reason,
        status: appointment.status
      }))
      
    });
  } catch (err){
    console.error("get appointment error:", err);
    res.status(500).json({ message: "Server error during appointment retrieval" });
  }
}
exports.getAppointmentsForPatientuser=async(req,res)=>{
  try{
    // get current logged in doctor user id from me endpoint 
    const patientId = req.params.id;
  
    const appointments=await Appointment.find({ patientId: patientId});

    res.status(200).json({
      appointments: appointments.map(appointment => ({
        id: appointment._id,
        patient_id: appointment.patientId,
        doctor_id: appointment.doctorId,
        timeSlot: appointment.timeSlot,
        appointmentDate: appointment.appointmentDate,
        reason: appointment.reason,
        status: appointment.status
      }))
      
    });
  } catch (err){
    console.error("get appointment error:", err);
    res.status(500).json({ message: "Server error during appointment retrieval" });
  }
}

exports.updateAppointment = async (req, res) => {
  try{
    const updatedAppointment = await Appointment.findOneAndUpdate(
    { appointmentId: req.params.appointmentId },
    {
      doctorId: req.body.doctorId,
      appointmentDate: req.body.appointmentDate,
      timeSlot: req.body.timeSlot,
      reason: req.body.reason
    },
    { new: true, runValidators: true }
    );
    if (!updatedAppointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json({ message: "Appointment updated", updatedAppointment });
  }
  catch(err){
    console.error("Update appointment error: ", err);
    res.status(500).json({message: "Server error during update"});
  }
}
 // delete an appointment
exports.deleteAppointment = async (req, res) => {
  try{
    const deletedAppointment = await Appointment.findOneAndDelete({
      appointmentId: req.params.appointmentId
    });
    if(!deletedAppointment){
      return res.status(404).json({message: "Appointment not found"});
    }
    res.status(200).json({ message: "Appointment deleted successfully" });
  }
  catch(err){
    console.error("Delete appointment error: ", err);
    res.status(500).json({message: "Server error during deletion"});
  }
}
