const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const patientAuth = require("../middlewares/patientAuthMiddleware");
const controller = require("../controllers/patientAuthController");
const { passwordStrengthValidator } = require("../validators/passwordValidator");

const PHONE_REGEX = /^(\+\d{1,3} )?\d{10}$/;

const registerValidation = [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    passwordStrengthValidator("password"),
    body("phone")
        .matches(PHONE_REGEX)
        .withMessage("Phone must be 10 digits, optionally prefixed with a country code"),
    body("gender")
        .isIn(["Male", "Female"])
        .withMessage("Gender must be Male or Female"),
    body("dob")
        .isISO8601()
        .toDate()
        .withMessage("Valid date of birth is required (YYYY-MM-DD)"),
];

const loginValidation = [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
];

router.post("/register", registerValidation, validate, controller.register);
router.post("/login", loginValidation, validate, controller.login);
router.get("/me", patientAuth, controller.me);
router.patch("/me", patientAuth, controller.updateMe);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);
router.post("/change-password", controller.changePassword);

module.exports = router;
