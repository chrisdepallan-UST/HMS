# HMS Project — Complete README.md

```markdown
# HMS — Hospital Management System
## Complete Project Documentation & Learning Guide

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Environment Setup](#environment-setup)
5. [Database Layer](#database-layer)
6. [Models](#models)
7. [Middleware](#middleware)
8. [Routes](#routes)
9. [Controllers](#controllers)
10. [Utilities](#utilities)
11. [App & Server Setup](#app--server-setup)
12. [Complete Request Flow](#complete-request-flow)
13. [API Endpoints](#api-endpoints)
14. [Build Order Guide](#build-order-guide)
15. [Testing with Postman](#testing-with-postman)
16. [Git Workflow](#git-workflow)
17. [Key Concepts Reference](#key-concepts-reference)

---

## Project Overview

HMS (Hospital Management System) is a RESTful backend API built with
Node.js, Express and MongoDB. It handles authentication for patients
and doctors in a healthcare environment.

### What It Does Right Now
- Doctor and Patient registration
- Email verification on signup
- Secure login with JWT tokens
- View own profile (protected route)
- Forgot password and reset password via email
- Logout

### The Big Picture

```
  POSTMAN/BROWSER          HMS SERVER              MONGODB
  (sends requests)    (Node.js + Express)        (stores data)
       |                      |                      |
       |  POST /api/auth/login |                      |
       |--------------------->|                      |
       |                      |  find user by email  |
       |                      |--------------------->|
       |                      |  return user data    |
       |                      |<---------------------|
       |  { token, user }     |                      |
       |<---------------------|                      |
```

---

## Tech Stack

| Layer          | Technology              | Purpose                            |
|----------------|-------------------------|------------------------------------|
| Runtime        | Node.js                 | JavaScript on the server           |
| Framework      | Express.js              | HTTP server and routing            |
| Database       | MongoDB                 | NoSQL document storage             |
| ODM            | Mongoose                | Schema definition and DB queries   |
| Authentication | JWT (jsonwebtoken)      | Stateless token-based auth         |
| Passwords      | bcryptjs                | Password hashing                   |
| Email          | Nodemailer              | Send verification/reset emails     |
| Validation     | express-validator       | Request body validation            |
| Security       | helmet                  | HTTP security headers              |
| CORS           | cors                    | Cross-origin request control       |
| Logging        | morgan                  | HTTP request logging               |
| API Docs       | swagger-ui-express      | Interactive API documentation      |
| Config         | dotenv                  | Environment variable management    |
| Dev Tool       | nodemon                 | Auto-restart on file changes       |

---

## Project Structure

```
HMS/
|
|-- src/
|   |
|   |-- app.js                    # Creates Express app, adds middleware, mounts routes
|   |-- server.js                 # Starts server on port, connects database
|   |
|   |-- api/
|   |   `-- index.js              # Alternative entry point (currently unused)
|   |
|   |-- config/
|   |   |-- db.js                 # MongoDB connection logic
|   |   `-- swagger.js            # Swagger config (commented out - using swagger/)
|   |
|   |-- controllers/
|   |   `-- authController.js     # Business logic for all auth operations
|   |
|   |-- middleware/
|   |   |-- authMiddleware.js     # JWT token verification for protected routes
|   |   `-- validate.js           # express-validator error checking
|   |
|   |-- models/
|   |   |-- User.js               # User schema (login credentials + role)
|   |   |-- Patient.js            # Patient profile schema
|   |   `-- Doctor.js             # Doctor profile schema
|   |
|   |-- routes/
|   |   `-- authRoutes.js         # URL to controller mapping for auth
|   |
|   `-- utils/
|       `-- sendEmail.js          # Reusable email sending function
|
|-- swagger/
|   `-- swagger.js                # OpenAPI 3.0 documentation
|
|-- .env                          # Secret config (NEVER commit to Git)
|-- .gitignore                    # Files Git should ignore
`-- package.json                  # Dependencies and scripts
```

### Why Each File Exists

| File                        | Responsibility                                      |
|-----------------------------|-----------------------------------------------------|
| `app.js`                    | Configure Express — middleware, routes, error handlers |
| `server.js`                 | Start the server — separated for easier testing     |
| `config/db.js`              | One place to manage database connection             |
| `controllers/authController.js` | What happens when each auth route is hit        |
| `middleware/authMiddleware.js`  | Protect routes that require login               |
| `middleware/validate.js`    | Catch and return validation errors cleanly          |
| `models/User.js`            | Authentication data structure                       |
| `models/Patient.js`         | Patient profile data structure                      |
| `models/Doctor.js`          | Doctor profile data structure                       |
| `routes/authRoutes.js`      | Which controller runs for which URL                 |
| `utils/sendEmail.js`        | DRY email sending — used in multiple controllers    |

---

## Environment Setup

### Step 1 — Install Dependencies

```bash
npm install express mongoose dotenv bcryptjs jsonwebtoken \
  nodemailer express-validator cors helmet morgan swagger-ui-express

npm install nodemon --save-dev
```

### Step 2 — package.json Scripts

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev":   "nodemon src/server.js"
  }
}
```

### Step 3 — Create .env File

```bash
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/hms

# JWT
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Email (Gmail)
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Frontend
FRONTEND_URL=http://localhost:3000
```

> IMPORTANT: Never commit .env to Git.
> Add it to .gitignore immediately.

### Step 4 — Create .gitignore

```
node_modules/
.env
*.log
```

### Step 5 — Gmail App Password Setup

For Nodemailer with Gmail:
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account Settings > Security > App Passwords
3. Generate an App Password
4. Use that App Password as EMAIL_PASS in .env
5. Do NOT use your actual Gmail login password

---

## Database Layer

### File: src/config/db.js

**Purpose:** Manage the MongoDB connection in one place.

**Why async?** Connecting to a database takes time. 
We use async/await so Node.js does not block while connecting.

**Why the readyState check?**
- readyState 0 = disconnected
- readyState 1 = connected
- readyState 2 = connecting
- readyState 3 = disconnecting

If already connected, we return early to prevent duplicate connections.
This is important during testing when the function might be called multiple times.

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1); // Exit if DB fails — app cannot work without database
  }
};

module.exports = connectDB;
```

**Why process.exit(1)?**
If the database fails to connect, the entire application cannot function.
Exit with code 1 (failure) so the process manager (PM2, Docker etc.)
knows the app failed and can restart it or alert the team.

---

## Models

### What is a Mongoose Schema?

A schema defines the structure and rules for your data.

Without schema — MongoDB accepts anything:
```
{ name: "John" }           OK
{ randomField: 123 }       OK
{ anything: "goes" }       OK  <- Dangerous, no consistency
```

With schema — you define rules:
- Required fields (cannot be empty)
- Data types (String, Number, Date, Boolean)
- Validation (enum, min, max, unique)
- Default values

---

### File: src/models/User.js

**Purpose:** Store authentication data — login credentials, role, tokens.

**Why separate from Patient and Doctor?**
Single Responsibility Principle:
- User model = WHO the person is for LOGIN purposes
- Patient/Doctor model = WHAT their profile looks like

This separation means if you want to add OAuth login later,
you only change the User model, not Patient or Doctor.

**Key Design Decisions:**

| Field                      | Why It Exists                                    |
|----------------------------|--------------------------------------------------|
| `email`                    | Unique login identifier                          |
| `password_hash`            | Hashed password — never store plain text         |
| `role`                     | Controls what user can access                    |
| `ref_id`                   | Links to Patient or Doctor profile document      |
| `ref_type`                 | Tells Mongoose which model ref_id points to      |
| `is_verified`              | Blocks login until email is confirmed            |
| `verification_token`       | One-time token sent in verification email        |
| `verification_token_expiry`| Token becomes invalid after 24 hours            |
| `reset_token`              | One-time token sent in password reset email      |
| `reset_token_expiry`       | Reset link becomes invalid after 1 hour          |
| `last_login`               | Audit trail — track user activity               |

**Dynamic Reference (refPath):**
```
ref_id points to a document
ref_type tells Mongoose WHICH collection to look in

Example:
  ref_id:   "507f1f77bcf86cd799439011"
  ref_type: "Patient"
  -> Mongoose looks in the patients collection

  ref_id:   "607f1f77bcf86cd799439022"
  ref_type: "Doctor"
  -> Mongoose looks in the doctors collection
```

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: { type: String, required: true },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      required: true,
    },
    ref_id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'ref_type',
    },
    ref_type: {
      type: String,
      enum: ['Patient', 'Doctor'],
      required: true,
    },
    last_login:                  { type: Date,    default: null },
    reset_token:                 { type: String,  default: null },
    reset_token_expiry:          { type: Date,    default: null },
    is_verified:                 { type: Boolean, default: false },
    verification_token:          { type: String,  default: null },
    verification_token_expiry:   { type: Date,    default: null },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

module.exports = mongoose.model('User', userSchema);
```

---

### File: src/models/Patient.js

**Purpose:** Store patient-specific profile data.

**Why not put this in the User model?**
- Doctors don't have NHS numbers or date of birth in a professional context
- Patients don't have specialisation or license numbers
- Keeping them separate allows each to evolve independently
- Clean queries — fetching patient data does not include irrelevant doctor fields

```javascript
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    first_name:    { type: String, required: true, trim: true },
    last_name:     { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:         { type: String, trim: true },
    date_of_birth: { type: Date },
    gender:        { type: String, enum: ['male', 'female', 'other'] },
    nhs_number:    { type: String, trim: true },
    address: {
      line1:    { type: String },
      city:     { type: String },
      postcode: { type: String },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('Patient', patientSchema);
```

---

### File: src/models/Doctor.js

**Purpose:** Store doctor-specific profile data.

```javascript
const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    first_name:     { type: String, required: true, trim: true },
    last_name:      { type: String, required: true, trim: true },
    email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:          { type: String, trim: true },
    specialisation: { type: String, required: true },
    license_number: { type: String, required: true, unique: true },
    is_active:      { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('Doctor', doctorSchema);
```

---

## Middleware

### What is Middleware?

Middleware is a function that runs BETWEEN the incoming request
and the final route handler. Every middleware receives (req, res, next).

```
Request arrives
      |
      v
  helmet()          <- adds security headers
      |
      v
  cors()            <- checks if origin is allowed
      |
      v
  morgan()          <- logs the request
      |
      v
  express.json()    <- parses JSON body into req.body
      |
      v
  authMiddleware    <- checks JWT token (on protected routes only)
      |
      v
  validate          <- checks for validation errors
      |
      v
  Route Controller  <- your actual business logic
      |
      v
  Response sent
```

Each middleware either:
- Calls `next()` to pass to the next middleware
- Sends a response (stops the chain)
- Modifies `req` or `res` and calls `next()`

---

### File: src/middleware/authMiddleware.js

**Purpose:** Protect routes that require the user to be logged in.
Checks for a valid JWT token in the Authorization header.

**How JWT works:**
1. User logs in with email + password
2. Server creates a token: jwt.sign({ id, role }, secret, { expiresIn })
3. Token is sent to client
4. Client stores token (memory, localStorage, or cookie)
5. Client sends token with every protected request: Authorization: Bearer <token>
6. Server verifies token: jwt.verify(token, secret)
7. If valid — decoded payload is attached to req.user
8. If invalid/expired — 401 Unauthorized is returned

**Token format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2Yi...
                      ^---------- this part is the token ----------^
```

```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check header exists and has Bearer format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.split(' ')[1];

  try {
    // Verify signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id: "507f...", role: "patient", iat: ..., exp: ... }

    req.user = decoded; // Attach user info to request
    next();             // Continue to route handler

  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

---

### File: src/middleware/validate.js

**Purpose:** Read errors stored by express-validator and send them back
as a clean 422 response. Sits between validation rules and the controller.

**How it fits in the chain:**
```
router.post('/signup',
  signupValidation,   <- express-validator rules run, errors stored
  validate,          <- THIS reads those stored errors
  signup             <- only runs if no errors found
);
```

```javascript
const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
    // errors.array() example:
    // [
    //   { field: 'email', message: 'Valid email required' },
    //   { field: 'password', message: 'Must be at least 8 characters' }
    // ]
  }

  next();
};
```

**Why 422 and not 400?**
- 400 Bad Request = malformed request (e.g. invalid JSON syntax)
- 422 Unprocessable Entity = request is valid JSON but content fails validation
  (e.g. email field is present but not a valid email address format)

---

## Routes

### File: src/routes/authRoutes.js

**Purpose:** Map URLs to controller functions. 
Routes are the switchboard of your application.

**Pattern:**
```
router.METHOD(path, ...middleware, controller)
```

**Validation Rules Explained:**

| Rule                        | What It Checks                               |
|-----------------------------|----------------------------------------------|
| `body('email').isEmail()`   | Must be valid email format                   |
| `body('password').isLength({ min: 8 })` | Password at least 8 characters   |
| `body('role').isIn([...])` | Role must be one of the allowed values       |
| `body('field').notEmpty()`  | Field must not be empty string               |

**Public vs Protected Routes:**

```
PUBLIC (no token needed):
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/verify-email
POST /api/auth/resend-verification
POST /api/auth/forgot-password
POST /api/auth/reset-password

PROTECTED (token required — auth middleware runs first):
POST /api/auth/logout
GET  /api/auth/me
```

---

## Controllers

### File: src/controllers/authController.js

**Purpose:** Contains the business logic for each auth operation.
Controllers receive the request, process it, and send a response.

**Standard controller pattern:**
```javascript
exports.controllerName = async (req, res) => {
  try {
    // 1. Extract data from req.body or req.params or req.query
    // 2. Validate business rules (not covered by express-validator)
    // 3. Interact with database (models)
    // 4. Send success response
  } catch (err) {
    console.error('Error context:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
```

---

### SIGNUP — Step by Step

```
POST /api/auth/signup

STEP 1: Extract fields from req.body
STEP 2: Check if email already exists in User collection
         -> 409 Conflict if it does
STEP 3: Hash the password with bcrypt (12 salt rounds)
STEP 4: Create Patient or Doctor profile document
         -> Profile is created BEFORE User
         -> Because User needs profile._id as ref_id
STEP 5: Generate email verification token
         -> crypto.randomBytes(32).toString('hex')
         -> 64 character random hex string
         -> Set expiry to 24 hours from now
STEP 6: Create User document linking to profile
STEP 7: Send verification email with tokenised link
STEP 8: Generate JWT token for immediate API access
STEP 9: Return 201 with token and user data
```

**Why hash passwords?**
```
Plain text storage (NEVER do this):
  Database breach -> attacker gets all passwords
  Users reuse passwords -> all their accounts compromised

bcrypt hashing (correct approach):
  Database breach -> attacker gets hash strings
  Hash is one-way -> cannot reverse to get password
  bcrypt.compare() verifies without needing the original
  Salt rounds = 12 means 2^12 hashing iterations = very slow to brute force
```

**Why create Profile before User?**
```
User document needs ref_id (the MongoDB _id of the profile)
Profile._id is only available AFTER profile is created
Therefore: create profile first -> get _id -> create user with that _id
```

---

### LOGIN — Step by Step

```
POST /api/auth/login

STEP 1: Find user by email
         -> Return 401 if not found
         -> SECURITY: Same message as wrong password
            "Invalid email or password"
            Do NOT say "email not found" - email enumeration attack
STEP 2: Compare password with stored hash
         -> bcrypt.compare(plainPassword, storedHash)
         -> Return 401 if no match (same message as above)
STEP 3: Check if email is verified
         -> Return 403 if not verified
STEP 4: Update last_login timestamp
STEP 5: Fetch full profile (Patient or Doctor)
STEP 6: Generate new JWT token
STEP 7: Return 200 with token and user + profile data
```

**What is an email enumeration attack?**
```
If your API returns:
  "Email not found"     -> attacker knows which emails DON'T exist
  "Wrong password"      -> attacker knows which emails DO exist

They can then target verified emails for phishing or brute force.

CORRECT approach:
  Always return "Invalid email or password" for both cases.
  The attacker learns nothing.
```

---

### ME — Get Current User Profile

```
GET /api/auth/me
Headers: Authorization: Bearer <token>

authMiddleware runs first:
  -> Verifies JWT
  -> Sets req.user = { id, role }

me controller:
STEP 1: Find User by req.user.id
         -> .select('-password_hash -__v') excludes sensitive fields
STEP 2: Determine which model to query (Patient or Doctor)
         -> Based on user.ref_type
STEP 3: Fetch the profile
STEP 4: Return user + profile
```

**Why .select('-password_hash')?**
```
.select('-fieldName') excludes that field from query result
We NEVER send password_hash back to the client
Even though it's hashed, there is no reason to expose it
Principle of least exposure — only send what the client needs
```

---

### VERIFY EMAIL — Step by Step

```
GET /api/auth/verify-email?token=abc123

STEP 1: Extract token from req.query
STEP 2: Find user where:
         verification_token = token
         verification_token_expiry > now  ($gt: new Date())
         -> $gt = MongoDB "greater than" operator
         -> If expiry is in the future, token is still valid
STEP 3: Check if already verified (idempotent response)
STEP 4: Set is_verified = true
STEP 5: Clear verification_token and expiry (one-time use)
STEP 6: Save user
STEP 7: Return 200 success
```

---

### FORGOT PASSWORD — Step by Step

```
POST /api/auth/forgot-password
Body: { email }

STEP 1: Find user by email
STEP 2: If no user found -> return 200 (same message either way)
         SECURITY: Prevents email enumeration
STEP 3: Generate reset token (crypto.randomBytes)
STEP 4: Set expiry to 1 hour from now
STEP 5: Save token and expiry to user document
STEP 6: Send email with reset link containing token
STEP 7: Return 200 with generic message
```

---

### RESET PASSWORD — Step by Step

```
POST /api/auth/reset-password
Body: { token, password }

STEP 1: Find user where reset_token matches AND not expired
STEP 2: Hash the new password
STEP 3: Update password_hash
STEP 4: Clear reset_token and reset_token_expiry (one-time use)
STEP 5: Save user
STEP 6: Return 200 success
```

---

## Utilities

### File: src/utils/sendEmail.js

**Purpose:** Centralised email sending function used across multiple controllers.

**Why a separate utility?**
DRY Principle — Don't Repeat Yourself.
Email is sent from:
- signup (verification email)
- resendVerification (new verification email)
- forgotPassword (reset link email)

Without a utility, Nodemailer setup code would be repeated 3 times.
With a utility, it is written once and imported where needed.

**How Nodemailer works:**
```
1. Create a transporter (like setting up an email client)
2. Call transporter.sendMail() with from, to, subject, html
3. Nodemailer connects to Gmail SMTP and sends the email
```

```javascript
const nodemailer = require('nodemailer');

// Transporter is created once when file is first imported
// Reused for all email sends
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,  // Gmail App Password, NOT your Gmail login
  },
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
```

---

## App & Server Setup

### File: src/app.js

**Purpose:** Create and configure the Express application.
Does NOT start the server — that is server.js responsibility.

**Why separate app.js from server.js?**
```
Testing — import app without starting the server
           Supertest can inject requests directly into app
           No port conflicts during testing

Separation of concerns:
  app.js    = what the app IS (middleware, routes)
  server.js = how the app STARTS (port, db connection)
```

**Middleware order matters:**
```
helmet()         FIRST  - security headers on every response
cors()                  - cross-origin before any processing
morgan()                - log before processing (captures all requests)
express.json()          - parse body before routes need it
routes            LAST  - after all middleware is ready
```

```javascript
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// Swagger docs
const { swaggerUi, swaggerDocument } = require('../swagger/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Health check
app.get('/', (req, res) => res.json({ message: 'HMS API is running' }));

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// Global error handler - must have 4 parameters
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

module.exports = app;
```

---

### File: src/server.js

**Purpose:** Entry point that starts the HTTP server.

```javascript
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
```

---

## Complete Request Flow

### What Happens When POST /api/auth/signup Is Called

```
1.  Request arrives at Express server

2.  helmet()
    Adds security headers to response:
    X-Content-Type-Options, X-Frame-Options etc.

3.  cors()
    Checks if request origin matches FRONTEND_URL
    Rejects if origin is not allowed

4.  morgan()
    Logs: POST /api/auth/signup 201 145ms

5.  express.json()
    Parses raw JSON body
    Sets req.body = { email, password, role, first_name, ... }

6.  Router matches /api/auth/signup
    Hands off to authRoutes

7.  signupValidation array runs
    Checks each field against rules
    Stores any errors internally

8.  validate middleware runs
    Reads stored errors
    If errors exist -> return 422 with error list
    If no errors   -> call next()

9.  signup controller runs
    -> User.findOne({ email })          check duplicate
    -> bcrypt.hash(password, 12)        hash password
    -> Patient.create({...})            create profile
    -> crypto.randomBytes(32)           generate token
    -> User.create({...})               create user
    -> sendEmail({...})                 send verification
    -> jwt.sign({...})                  create JWT
    -> res.status(201).json({...})      send response

10. Response received by client
    { message, token, user }
```

---

## API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Auth Endpoints

| Method | Endpoint                       | Auth Required | Description                        |
|--------|--------------------------------|---------------|------------------------------------|
| POST   | /auth/signup                   | No            | Register patient or doctor         |
| POST   | /auth/login                    | No            | Login and receive JWT token        |
| POST   | /auth/logout                   | Yes           | Logout (client deletes token)      |
| GET    | /auth/me                       | Yes           | Get current user and profile       |
| GET    | /auth/verify-email?token=xxx   | No            | Verify email from link             |
| POST   | /auth/resend-verification      | No            | Request new verification email     |
| POST   | /auth/forgot-password          | No            | Request password reset email       |
| POST   | /auth/reset-password           | No            | Reset password using token         |

### HTTP Status Codes Used

| Code | Meaning               | When Used                                     |
|------|-----------------------|-----------------------------------------------|
| 200  | OK                    | Successful GET, login, logout                 |
| 201  | Created               | Successful signup (new resource created)      |
| 400  | Bad Request           | Missing required token in query/body          |
| 401  | Unauthorized          | Invalid credentials or missing JWT            |
| 403  | Forbidden             | Authenticated but email not verified          |
| 404  | Not Found             | User not found                                |
| 409  | Conflict              | Email already registered                      |
| 422  | Unprocessable Entity  | Validation errors (invalid email format etc.) |
| 500  | Internal Server Error | Unexpected server error                       |

---

## Build Order Guide

Follow this order when building from scratch:

### Day 1 — Foundation

```bash
mkdir HMS && cd HMS
npm init -y
npm install express mongoose dotenv bcryptjs jsonwebtoken \
  nodemailer express-validator cors helmet morgan swagger-ui-express
npm install nodemon --save-dev

# Create structure
mkdir -p src/{config,controllers,middleware,models,routes,utils}
mkdir swagger
touch src/app.js src/server.js
touch src/config/db.js
touch src/models/User.js src/models/Patient.js src/models/Doctor.js
touch src/utils/sendEmail.js
touch src/middleware/authMiddleware.js src/middleware/validate.js
touch src/routes/authRoutes.js src/controllers/authController.js
touch swagger/swagger.js
touch .env .gitignore
```

### Build Order Within Files

```
1.  .env                          <- Config first, everything reads from here
2.  .gitignore                    <- Protect secrets immediately
3.  src/config/db.js              <- Database connection
4.  src/models/User.js            <- Data structure
5.  src/models/Patient.js         <- Data structure
6.  src/models/Doctor.js          <- Data structure
7.  src/utils/sendEmail.js        <- Utility (used by controller)
8.  src/middleware/authMiddleware  <- Guard (used by routes)
9.  src/middleware/validate.js    <- Guard (used by routes)
10. src/controllers/authController <- Business logic
11. src/routes/authRoutes.js      <- Wire URLs to controllers
12. swagger/swagger.js            <- API documentation
13. src/app.js                    <- Wire middleware and routes
14. src/server.js                 <- Start the server
```

---

## Testing with Postman

### Setup
1. Download Postman from postman.com
2. Create a new Collection called "HMS API"
3. Set base URL variable: `http://localhost:5000/api`

### Signup — Patient

```
Method:  POST
URL:     http://localhost:5000/api/auth/signup
Headers: Content-Type: application/json
Body (raw JSON):
{
  "email": "john.smith@example.com",
  "password": "Password123",
  "role": "patient",
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+44 7700 900001",
  "date_of_birth": "1990-01-15",
  "gender": "male",
  "nhs_number": "485 777 3456",
  "address": {
    "line1": "123 Main Street",
    "city": "London",
    "postcode": "SW1A 1AA"
  }
}
Expected Response: 201 Created
```

### Signup — Doctor

```
Method:  POST
URL:     http://localhost:5000/api/auth/signup
Body (raw JSON):
{
  "email": "dr.jones@example.com",
  "password": "Password123",
  "role": "doctor",
  "first_name": "Sarah",
  "last_name": "Jones",
  "phone": "+44 7700 900002",
  "specialisation": "General Practitioner",
  "license_number": "GMC-1234567"
}
Expected Response: 201 Created
```

### Verify Email

```
After signup, check your email for verification link.
The token will be in the URL: /verify-email?token=abc123

Method:  GET
URL:     http://localhost:5000/api/auth/verify-email?token=<paste token here>
Expected Response: 200 - Email verified successfully
```

### Login

```
Method:  POST
URL:     http://localhost:5000/api/auth/login
Body (raw JSON):
{
  "email": "john.smith@example.com",
  "password": "Password123"
}
Expected Response: 200 with token
IMPORTANT: Copy the token from the response for next requests
```

### Get My Profile (Protected)

```
Method:  GET
URL:     http://localhost:5000/api/auth/me
Headers:
  Authorization: Bearer <paste your token here>
Expected Response: 200 with user and profile
```

### Forgot Password

```
Method:  POST
URL:     http://localhost:5000/api/auth/forgot-password
Body (raw JSON):
{
  "email": "john.smith@example.com"
}
Expected Response: 200 (same message whether email exists or not)
```

### Reset Password

```
Method:  POST
URL:     http://localhost:5000/api/auth/reset-password
Body (raw JSON):
{
  "token": "<paste token from reset email>",
  "password": "NewPassword123"
}
Expected Response: 200 - Password reset successful
```

---

## Git Workflow

```bash
# Initial setup
git init
git checkout -b dev

# Feature workflow
git checkout dev
git checkout -b feature/auth-signup

# Work on feature, then commit
git add .
git commit -m "feat: signup controller with patient and doctor registration"

# Merge back to dev
git checkout dev
git merge feature/auth-signup

# Sprint complete - merge to main
git checkout main
git merge dev
```

### Commit Message Convention

```
feat:     New feature
fix:      Bug fix
chore:    Setup, config, no production code change
refactor: Code restructure, no feature or fix
docs:     Documentation only
test:     Adding or updating tests
```

### Example Commits for This Project

```
chore: project setup and dependencies
feat: mongoose models for User, Patient and Doctor
feat: database connection config
feat: sendEmail utility with nodemailer
feat: auth middleware for JWT verification
feat: validate middleware for express-validator
feat: signup controller with email verification
feat: login controller with bcrypt comparison
feat: me controller for current user profile
feat: verify email controller
feat: forgot and reset password controllers
feat: auth routes wiring all controllers
feat: swagger documentation for auth endpoints
chore: app.js middleware and route setup
chore: server.js entry point
```

---

## Key Concepts Reference

### bcrypt Password Hashing

```javascript
// Hashing (during signup)
const hash = await bcrypt.hash(plainPassword, 12);
// 12 = salt rounds = 2^12 iterations = very secure

// Comparing (during login)
const isMatch = await bcrypt.compare(plainPassword, storedHash);
// Returns true or false
// NEVER hash again to compare - bcrypt.compare handles it
```

### JWT Token

```javascript
// Creating a token (during login/signup)
const token = jwt.sign(
  { id: user._id, role: user.role },  // payload
  process.env.JWT_SECRET,              // secret
  { expiresIn: '7d' }                  // options
);

// Verifying a token (in authMiddleware)
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// decoded = { id: '507f...', role: 'patient', iat: ..., exp: ... }
// Throws error if invalid or expired
```

### crypto Random Token

```javascript
// Generate a secure random token for email verification / password reset
const token = crypto.randomBytes(32).toString('hex');
// 32 bytes -> 64 character hex string
// Cryptographically secure random -> cannot be guessed

// Set expiry
const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
const expiry1hr = new Date(Date.now() + 60 * 60 * 1000);   // 1 hour
```

### MongoDB Query Operators

```javascript
// $gt = greater than
User.findOne({ reset_token_expiry: { $gt: new Date() } })
// Finds documents where expiry > now (i.e. not yet expired)

// $lt = less than
// $gte = greater than or equal
// $lte = less than or equal
// $in = value is in array
// $ne = not equal
```

### Mongoose Model Methods

```javascript
// Create
const user = await User.create({ email, password_hash, role });

// Find one
const user = await User.findOne({ email });
const user = await User.findById(id);

// Find many
const users = await User.find({ role: 'patient' });

// Update via save
user.is_verified = true;
await user.save();

// Select fields (- to exclude)
const user = await User.findById(id).select('-password_hash -__v');

// Populate reference (get full document from ref_id)
const user = await User.findById(id).populate('ref_id');
```

### Express Router Methods

```javascript
router.get(path, ...middleware, handler)     // GET request
router.post(path, ...middleware, handler)    // POST request
router.put(path, ...middleware, handler)     // PUT request
router.patch(path, ...middleware, handler)   // PATCH request
router.delete(path, ...middleware, handler)  // DELETE request
```

### Request Object Properties

```javascript
req.body        // Parsed JSON body (needs express.json() middleware)
req.params      // URL parameters  e.g. /users/:id -> req.params.id
req.query       // Query string    e.g. ?token=abc -> req.query.token
req.headers     // Request headers e.g. req.headers.authorization
req.user        // Set by authMiddleware after JWT verification
req.method      // HTTP method: GET, POST, PUT, DELETE
req.url         // Request URL path
```

---

## Common Errors and Solutions

| Error                              | Cause                                  | Solution                                    |
|------------------------------------|----------------------------------------|---------------------------------------------|
| MongoServerError: E11000           | Duplicate unique field (email)         | Check if email exists before creating       |
| JsonWebTokenError: invalid token   | Malformed or wrong token               | Check Authorization header format           |
| TokenExpiredError                  | JWT has expired                        | User needs to login again                   |
| ValidationError: Path required     | Required field missing in schema       | Check request body includes all required fields |
| Cannot read property of undefined  | Variable is null/undefined             | Add null checks before accessing properties |
| CORS error in browser              | Origin not in allowed list             | Check FRONTEND_URL in .env matches exactly  |
| connect ECONNREFUSED 127.0.0.1:27017 | MongoDB not running                  | Start MongoDB service locally               |

---

## Next Steps — Upcoming Features

Based on the sprint plan, these files will be added soon:

```
src/models/Appointment.js           <- Appointment schema
src/controllers/appointmentController.js  <- Booking logic
src/routes/appointmentRoutes.js     <- Appointment endpoints
src/controllers/patientController.js      <- Patient CRUD
src/routes/patientRoutes.js         <- Patient endpoints
src/controllers/doctorController.js       <- Doctor CRUD
src/routes/doctorRoutes.js          <- Doctor endpoints
src/middleware/roleMiddleware.js    <- Role-based access control
```

Follow the same pattern for each:
1. Create the Model (schema)
2. Create the Controller (business logic)
3. Create the Route (URL mapping)
4. Mount the Route in app.js
5. Document in swagger.js
6. Test in Postman

---

*HMS Project — UST Global Training Sprint 1*
*Node.js + Express + MongoDB + JWT Authentication*
```

---

## How to Download This README

### Option 1 — Copy and Save Manually

```
1. Select ALL the text inside the code block above
2. Copy it (Ctrl+C or Cmd+C)
3. Open VS Code
4. Create new file: README.md in your HMS project root
5. Paste (Ctrl+V or Cmd+V)
6. Save the file
```

### Option 2 — Create It From Terminal

```bash
# Navigate to your HMS project root
cd HMS

# Create the README.md file
touch README.md

# Open in VS Code
code README.md

# Paste the content and save
```

### Option 3 — Add to Git Immediately After

```bash
cd HMS
git add README.md
git commit -m "docs: complete project documentation and learning guide"
```

> The README is written in **Markdown format** — it will render beautifully on GitHub, GitLab, or in VS Code's Markdown preview (Ctrl+Shift+V or Cmd+Shift+V to preview).