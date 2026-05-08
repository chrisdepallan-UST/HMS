const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
// const { createAppointment,getAppointment,getAppointmentsForDoctoruser,getAppointmentsForPatientuser,deleteAppointment,updateAppointment } = require("../controllers/appointmentController");
const appointmentController= require("../controllers/appointmentController");
// const
const appointmentValidation = [
  body("patientId").notEmpty().withMessage("Id for patient is required"),
  body("doctorId").notEmpty().withMessage("Id for doctor is required"),
  body("appointmentDate").notEmpty().withMessage("Date is required"),
  body("timeSlot").notEmpty().withMessage("Time slot is required"),
  body("reason").notEmpty().withMessage("Reason is required")
];

router.post("/appointments", appointmentValidation, validate, appointmentController.createAppointment);
// router.get("/getappointments", appointmentValidation, validate,auth, getAppointment);
router.get('/appointments/doctor/:id', appointmentController.getAppointmentsForDoctoruser);
router.get('/appointments/patient/:id', appointmentController.getAppointmentsForPatientuser);

router.get('/appointments/:id', appointmentController.getAppointment);
router.delete("/appointments/delete", appointmentController.deleteAppointment);
router.put("/appointments/:appointmentId", appointmentController.updateAppointment);
router.delete("/appointments/:appointmentId", appointmentController.deleteAppointment);
module.exports = router;
