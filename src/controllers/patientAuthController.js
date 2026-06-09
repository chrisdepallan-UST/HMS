const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Patient = require("../models/Patients");
require("dotenv").config();

// Self-registration for patients (creates a patient record)
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, gender, dob } = req.body;

        const existing = await Patient.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const patient = new Patient({
            name,
            email,
            phone,
            gender,
            dob,
            passwordHash,
            mustChangePassword: false,
        });

        await patient.save();

        return res.status(201).json({
            message: "Registration successful. You can now log in.",
            patient: {
                UHID: patient.UHID,
                name: patient.name,
                email: patient.email,
            },
        });
    } catch (err) {
        console.error("Patient registration error:", err);
        return res.status(500).json({ message: "Server error during registration" });
    }
};

// Authenticate a patient and return a JWT
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const patient = await Patient.findOne({ email });
        if (!patient) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, patient.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (patient.status !== "ACTIVE") {
            return res.status(403).json({ message: "Account is inactive" });
        }

        // type: "patient" distinguishes this token from employee tokens
        const token = jwt.sign(
            { type: "patient", patientId: patient.UHID },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            patient: {
                UHID: patient.UHID,
                name: patient.name,
                email: patient.email,
                gender: patient.gender,
                dob: patient.dob,
                phone: patient.phone,
                address: patient.address,
                emergencyContact: patient.emergencyContact,
            },
        });
    } catch (err) {
        console.error("Patient login error:", err);
        return res.status(500).json({ message: "Server error during login" });
    }
};

// Return the authenticated patient's profile
exports.me = async (req, res) => {
    try {
        const patient = await Patient.findOne({ UHID: req.patient.patientId })
            .select("-passwordHash -__v");

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        return res.status(200).json({
            message: "Patient retrieved successfully",
            patient,
        });
    } catch (err) {
        console.error("Patient me error:", err);
        return res.status(500).json({ message: "Server error while fetching profile" });
    }
};
