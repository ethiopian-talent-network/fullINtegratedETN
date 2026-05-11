const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const {
  securityHeaders,
  rateLimiter,
  sanitizeInput,
} = require("./middlewares/securityMiddleware");
const { connectRedis } = require("./config/redis");

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(sanitizeInput);

// Rate limiting for all routes - more lenient in development
const rateLimitOptions =
  process.env.NODE_ENV === "production"
    ? { windowMs: 15 * 60 * 1000, max: 100 } // 100 requests per 15 minutes in production
    : { windowMs: 1 * 60 * 1000, max: 1000 }; // 1000 requests per minute in development

app.use(rateLimiter(rateLimitOptions));

// CORS configuration - restrict to specific origins in production
const corsOptions = {
  origin: "*", // Temporarily allow all origins for debugging
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// API routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/internal", require("./routes/internalAuthRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/employer", require("./routes/employerRoutes"));
app.use("/api/talents", require("./routes/talentRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/contracts", require("./routes/contractRoutes"));
app.use("/api/billing", require("./routes/billingRoutes"));
app.use("/api/chat", require("./routes/openaiRoute"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use(
  "/api/payment-verification",
  require("./routes/paymentVerificationRoutes"),
);
app.use("/api/agreements", require("./routes/agreementRoutes"));
app.use("/api/hiring", require("./routes/hiringRoutes"));
app.use("/api/work-messages", require("./routes/employerTalentMessageRoutes"));
// Specific routes must come before general routes
app.use("/api/owner/payouts", require("./routes/payoutsRoutes"));
app.use("/api/owner", require("./routes/ownerRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    ...(process.env.NODE_ENV !== "production" && { error: err.stack }),
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

connectRedis().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
  });
});
