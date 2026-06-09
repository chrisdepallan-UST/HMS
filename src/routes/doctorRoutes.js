const express = require("express");
const router = express.Router();
const patientAuth = require("../middlewares/patientAuthMiddleware");
const controller = require("../controllers/employeeController");

// Patients can browse the active doctors list
router.get("/", patientAuth, controller.getDoctors);

module.exports = router;
