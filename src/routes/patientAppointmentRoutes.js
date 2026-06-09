const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate");
const patientAuth = require("../middlewares/patientAuthMiddleware");
const controller = require("../controllers/patientAppointmentController");

router.use(patientAuth);

const bookValidation = [
    body("doctorEmployeeId").notEmpty().withMessage("Doctor is required"),
    body("appointmentDate")
        .isISO8601()
        .toDate()
        .withMessage("Valid appointment date is required (YYYY-MM-DD)"),
    body("timeSlot")
        .matches(/^\d{2}:\d{2}-\d{2}:\d{2}$/)
        .withMessage("Time slot must be in HH:MM-HH:MM format"),
];

router.post("/book", bookValidation, validate, controller.bookAppointment);
router.get("/", controller.getMyAppointments);
router.get("/booked-slots", controller.getBookedSlots);
router.put(
    "/:appointmentId/cancel",
    param("appointmentId").notEmpty().withMessage("Appointment ID is required"),
    validate,
    controller.cancelMyAppointment
);

module.exports = router;
