const helmet = require("helmet");

// Security headers middleware
exports.securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "http://localhost:5000",
        "http://localhost:5173",
        "https://*",
      ],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
});

// Rate limiting middleware (simple in-memory implementation)
const rateLimit = new Map();

exports.rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const max = options.max || 100; // limit each IP to 100 requests per windowMs

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [key, value] of rateLimit.entries()) {
      if (value.timestamp < windowStart) {
        rateLimit.delete(key);
      }
    }

    const key = `${ip}-${req.path}`;
    const record = rateLimit.get(key);

    if (!record) {
      rateLimit.set(key, { count: 1, timestamp: now });
      return next();
    }

    if (record.count >= max) {
      return res.status(429).json({
        message: "Too many requests from this IP, please try again later.",
      });
    }

    record.count++;
    record.timestamp = now;
    next();
  };
};

// Input validation middleware
exports.validateInput = (schema) => {
  return (req, res, next) => {
    const errors = [];

    for (const field in schema) {
      const rules = schema[field];
      const value = req.body[field];

      if (
        rules.required &&
        (value === undefined || value === null || value === "")
      ) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value !== undefined) {
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
        }

        if (rules.minLength && value.length < rules.minLength) {
          errors.push(
            `${field} must be at least ${rules.minLength} characters`,
          );
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must not exceed ${rules.maxLength} characters`);
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation error",
        errors,
      });
    }

    next();
  };
};

// Sanitize input to prevent XSS
exports.sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== "object" || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    const sanitized = {};
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        sanitized[key] = obj[key]
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#x27;");
      } else {
        sanitized[key] = sanitize(obj[key]);
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// License verification security middleware
exports.validateLicenseSubmission = (req, res, next) => {
  const { license_name, license_number, issuing_authority } = req.body;
  const errors = [];

  if (!license_name || license_name.trim().length < 3) {
    errors.push("License name must be at least 3 characters");
  }
  if (!license_number || !/^[A-Z0-9-]{5,20}$/i.test(license_number)) {
    errors.push("License number must be 5-20 alphanumeric characters");
  }
  if (!issuing_authority || issuing_authority.trim().length < 3) {
    errors.push("Issuing authority must be at least 3 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }
  next();
};

// Admin action validation
exports.validateAdminAction = (req, res, next) => {
  const { action, admin_note } = req.body;

  if (!["approve", "reject"].includes(action)) {
    return res
      .status(400)
      .json({ message: "Invalid action. Must be approve or reject" });
  }

  if (action === "reject" && (!admin_note || admin_note.trim().length < 10)) {
    return res
      .status(400)
      .json({
        message: "Admin note required for rejection (min 10 characters)",
      });
  }

  next();
};

// File upload security
exports.validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "License document is required" });
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res
      .status(400)
      .json({ message: "Only JPEG, PNG, and PDF files allowed" });
  }

  if (req.file.size > maxSize) {
    return res.status(400).json({ message: "File size must be less than 5MB" });
  }

  next();
};

// Audit logging middleware
exports.auditLog = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
      // Log admin actions
      if (req.user && ["admin", "owner"].includes(req.user.role)) {
        console.log(
          `[AUDIT] ${new Date().toISOString()} - User ${req.user.id} (${req.user.role}) performed ${action} - IP: ${req.ip}`,
        );
      }
      originalSend.call(this, data);
    };
    next();
  };
};
