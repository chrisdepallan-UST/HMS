const { body } = require("express-validator");
const signupValidation = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("role")
    .isIn(["patient", "doctor"])
    .withMessage("Role must be patient or doctor"),
  body("first_name").notEmpty().withMessage("First name is required"),
  body("last_name").notEmpty().withMessage("Last name is required"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const forgotValidation = [
  body("email").isEmail().withMessage("Valid email required"),
];

const resetValidation = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

const resendValidation = [
  body("email").isEmail().withMessage("Valid email required"),
];
module.exports= {
  signupValidation,
  loginValidation,
  forgotValidation,
  resetValidation,
  resendValidation,
};