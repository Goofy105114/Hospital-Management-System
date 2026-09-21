export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Going Merry Hospital Management System (HMS) API",
    version: "1.0.0",
    description:
      "Enterprise healthcare API implementing 78 BRD features across 16 clinical, operational, and administrative modules.",
  },
  servers: [
    {
      url: "/api/v1",
      description: "Primary v1 API Server",
    },
  ],
  paths: {
    "/auth/login": {
      post: {
        summary: "User Authentication (IAM-01)",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  identifier: { type: "string", example: "dr.vance@goingmerry.hms" },
                  password: { type: "string", example: "SecurePass123!" },
                },
                required: ["identifier", "password"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Successful login with JWT tokens" },
          "401": { description: "Invalid credentials" },
          "403": { description: "Account locked or suspended" },
        },
      },
    },
    "/patients/search": {
      get: {
        summary: "Patient Search & Lookup (PAT-04)",
        tags: ["Patients"],
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "mrn", in: "query", schema: { type: "string" } },
          { name: "phone", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Matching patients list" },
        },
      },
    },
    "/appointments/availability": {
      get: {
        summary: "Search Available Appointment Slots (APT-02)",
        tags: ["Appointments"],
        parameters: [
          { name: "doctorId", in: "query", required: true, schema: { type: "string" } },
          { name: "date", in: "query", required: true, schema: { type: "string", format: "date" } },
        ],
        responses: {
          "200": { description: "List of discrete available slots" },
        },
      },
    },
    "/appointments": {
      post: {
        summary: "Book an Appointment (APT-03)",
        tags: ["Appointments"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  patientId: { type: "string" },
                  doctorId: { type: "string" },
                  slotStart: { type: "string", format: "date-time" },
                  slotEnd: { type: "string", format: "date-time" },
                  appointmentType: { type: "string", enum: ["NEW", "FOLLOW_UP", "EMERGENCY"] },
                },
                required: ["patientId", "doctorId", "slotStart", "slotEnd"],
              },
            },
          },
        },
        responses: {
          "201": { description: "Appointment confirmed with appointmentNumber" },
          "409": { description: "Slot already booked (APT_SLOT_ALREADY_BOOKED)" },
        },
      },
    },
    "/queue/check-in": {
      post: {
        summary: "Patient Check-in & Token Generation (QUE-01/02)",
        tags: ["Queue"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  appointmentId: { type: "string" },
                  patientId: { type: "string" },
                  doctorId: { type: "string" },
                  isWalkIn: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Queue token issued with position & wait estimate" },
        },
      },
    },
    "/pharmacy/prescriptions/{id}/safety-check": {
      get: {
        summary: "Clinical Safety Check (PHA-03 / EMR-05)",
        tags: ["Pharmacy"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Allergy conflicts & drug-drug interaction warnings" },
        },
      },
    },
    "/ai/wait-time-prediction": {
      post: {
        summary: "AI Wait-Time Prediction with Fallback (AI-01)",
        tags: ["AI"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  queuePosition: { type: "integer" },
                  avgConsultationMinutes: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Wait time estimate with source flag (ai_model or fallback)" },
        },
      },
    },
    "/admin/system-settings": {
      get: {
        summary: "Retrieve System Configuration (ADM-04)",
        tags: ["Administration"],
        responses: {
          "200": { description: "Current system settings and operational controls" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
      put: {
        summary: "Update System Configuration (ADM-04)",
        tags: ["Administration"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  sessionTimeoutMinutes: { type: "integer", example: 15 },
                  allowMultipleSessions: { type: "boolean", example: true },
                  maintenanceMode: { type: "boolean", example: false },
                  featureFlags: { type: "object" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "System settings updated and audited" },
          "400": { description: "Invalid payload" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/admin/integration-settings": {
      get: {
        summary: "Retrieve Integration Settings (ADM-04)",
        tags: ["Administration"],
        responses: {
          "200": { description: "Current integration provider settings" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
      put: {
        summary: "Update Integration Settings (ADM-04)",
        tags: ["Administration"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  smsProvider: { type: "string", example: "TWILIO" },
                  emailProvider: { type: "string", example: "SENDGRID" },
                  paymentProvider: { type: "string", example: "STRIPE" },
                  webhookUrl: { type: "string", example: "https://api.goingmerry.org/webhook" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Integration settings updated and audited" },
          "400": { description: "Invalid payload" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
  },
};
