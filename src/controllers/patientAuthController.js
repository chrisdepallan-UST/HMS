const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Patient = require("../models/Patients");
const sendEmail = require("../utils/sendEmail");
const emailTemplates = require("../utils/emailTemplates");
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

// Update the authenticated patient's own profile
exports.updateMe = async (req, res) => {
    try {
        const { name, phone, address, emergencyContact } = req.body;
        const patient = await Patient.findOne({ UHID: req.patient.patientId });
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }
        if (name !== undefined) patient.name = name;
        if (phone !== undefined) patient.phone = phone;
        if (address !== undefined) patient.address = { ...patient.address?.toObject?.() ?? patient.address ?? {}, ...address };
        if (emergencyContact !== undefined) patient.emergencyContact = { ...patient.emergencyContact?.toObject?.() ?? patient.emergencyContact ?? {}, ...emergencyContact };
        await patient.save();
        return res.status(200).json({ message: "Profile updated successfully", patient });
    } catch (err) {
        console.error("Patient updateMe error:", err);
        return res.status(500).json({ message: "Server error while updating profile" });
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

// Send a 6-digit OTP to the patient's email for password reset
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const patient = await Patient.findOne({ email });
        // Return 200 regardless to prevent email enumeration
        if (!patient) {
            return res.status(200).json({ message: "If an account with that email exists, an OTP has been sent." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        patient.passwordResetOtp = await bcrypt.hash(otp, 10);
        patient.passwordResetExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await patient.save();

        try {
            await sendEmail({ to: patient.email, ...emailTemplates.patientPasswordOtp({ patientName: patient.name, otp }) });
        } catch (emailErr) {
            console.error("OTP email error:", emailErr);
        }

        return res.status(200).json({ message: "OTP sent to your email." });
    } catch (err) {
        console.error("Forgot password error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Verify OTP and set a new password
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP and new password are required" });
        }

        const patient = await Patient.findOne({ email });
        if (!patient || !patient.passwordResetOtp || !patient.passwordResetExpiry) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
        if (patient.passwordResetExpiry < new Date()) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }
        const otpMatch = await bcrypt.compare(otp, patient.passwordResetOtp);
        if (!otpMatch) return res.status(400).json({ message: "Incorrect OTP" });

        patient.passwordHash = await bcrypt.hash(newPassword, 10);
        patient.passwordResetOtp = undefined;
        patient.passwordResetExpiry = undefined;
        patient.mustChangePassword = false;
        await patient.save();

        return res.status(200).json({ message: "Password reset successfully. You can now log in." });
    } catch (err) {
        console.error("Reset password error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Change password using current password (no OTP required)
exports.changePassword = async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;
        if (!email || !currentPassword || !newPassword) {
            return res.status(400).json({ message: "Email, current password and new password are required" });
        }

        const patient = await Patient.findOne({ email });
        if (!patient) return res.status(401).json({ message: "Invalid email or password" });

        const isMatch = await bcrypt.compare(currentPassword, patient.passwordHash);
        if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });

        patient.passwordHash = await bcrypt.hash(newPassword, 10);
        patient.mustChangePassword = false;
        await patient.save();

        return res.status(200).json({ message: "Password changed successfully." });
    } catch (err) {
        console.error("Change password error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
