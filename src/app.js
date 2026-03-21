const express = require("express");
const swaggerUi = require("swagger-ui-express");

const app = express();

// Middleware
app.use(express.json());
app.set("trust proxy", true); // Essential for capturing system IP

// Swagger documentation
const swaggerDocument = {
  openapi: "3.0.0",
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  info: {
    title: "Akademia CBT API",
    version: "1.0.0",
    description: "API documentation for Akademia CBT backend",
  },
  servers: [
    { url: process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`, description: process.env.RENDER_EXTERNAL_URL ? 'Production server' : 'Local development server', },
  ],
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with username, password and role",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string" },
                  password: { type: "string" },
                  role: { type: "string" },
                  ip: { type: "string" },
                },
                required: ["username", "password", "role"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Successful login",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    token: { type: "string" },
                    role: { type: "string" },
                    ip: { type: "string" },
                  },
                },
              },
            },
          },
          401: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/logout": {
      get: {
        tags: ["Auth"],
        summary: "Logout a user",
        description:
          "Logs out a user by invalidating the session using the user ID",
        parameters: [
          {
            name: "userid",
            in: "query",
            required: true,
            schema: {
              type: "string",
            },
            description: "The ID of the user logging out",
          },
        ],
        responses: {
          200: {
            description: "User logged out successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          400: {
            description: "User ID missing",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          404: {
            description: "User not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/User/new-admin": {
      post: {
        tags: ["User"],
        summary: "Create a new Admin user",
        description: "Creates a new Admin account in the system",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userType: { type: "string" },
                  password: { type: "string" },
                  surname: { type: "string" },
                  firstname: { type: "string" },
                  gender: { type: "string" },
                  phoneNo: { type: "string" },
                  email: { type: "string" },
                  birthday: {
                    type: "string",
                    format: "date",
                    example: "1995-05-20",
                  },
                  passport: { type: "string" },
                  address: { type: "string" },
                  otherName: { type: "string" },
                  physicalChallenge: { type: "string" },
                  tenant: { type: "string" },
                  imagePhoto: {
                    type: "string",
                    description: "Base64 encoded image",
                  },
                },
                required: [
                  "userType",
                  "password",
                  "surname",
                  "firstname",
                  "gender",
                  "phoneNo",
                  "email",
                ],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Admin created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    userId: { type: "string" },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid request data",
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
    "/api/User/change-password": {
      post: {
        tags: ["User"],
        summary: "Change user password",
        description:
          "Allows a user to change their password by providing old and new password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userType: {
                    type: "string",
                    example: "Admin",
                  },
                  userId: {
                    type: "string",
                    example: "67d1f42e7e9bce23a9c10c51",
                  },
                  oldPassword: {
                    type: "string",
                    example: "OldPassword123!",
                  },
                  newPassword: {
                    type: "string",
                    example: "NewPassword456!",
                  },
                },
                required: ["userType", "userId", "oldPassword", "newPassword"],
              },
              example: {
                userType: "Admin",
                userId: "67d1f42e7e9bce23a9c10c51",
                oldPassword: "OldPassword123!",
                newPassword: "NewPassword456!",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Password changed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          400: {
            description: "Bad request (missing fields or invalid input)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          401: {
            description: "Old password is incorrect",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          403: {
            description: "Unauthorized operation (userType mismatch)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          404: {
            description: "User not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
    "/api/User/delete-user": {
      post: {
        tags: ["User"],
        summary: "Delete a user",
        description: "Deletes a user by userType and userId",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userType: {
                    type: "string",
                  },
                  userId: {
                    type: "string",
                  },
                },
                required: ["userType", "userId"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "User deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing required fields",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          403: {
            description: "User type mismatch",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          404: {
            description: "User not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
    "/api/User/edit-admin-user": {
      post: {
        tags: ["User"],
        summary: "Edit Admin user",
        description: "Updates details of an Admin user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: {
                    type: "string",
                    example: "67d1f42e7e9bce23a9c10c51",
                  },
                  surname: {
                    type: "string",
                    example: "Adeyemi",
                  },
                  firstname: {
                    type: "string",
                    example: "Tunji",
                  },
                  gender: {
                    type: "string",
                    example: "Male",
                  },
                  phoneNo: {
                    type: "string",
                    example: "08012345678",
                  },
                  birthday: {
                    type: "string",
                    format: "date",
                    example: "1995-05-20",
                  },
                  passport: {
                    type: "string",
                    example: "A12345678",
                  },
                  tenant: {
                    type: "string",
                    example: "AkademiaCBT",
                  },
                  imagePhoto: {
                    type: "string",
                    description: "Base64 encoded image",
                  },
                },
                required: ["userId"],
              },
              example: {
                userId: "67d1f42e7e9bce23a9c10c51",
                surname: "Adeyemi",
                firstname: "Tunji",
                gender: "Male",
                phoneNo: "08012345678",
                birthday: "1995-05-20",
                passport: "A12345678",
                tenant: "AkademiaCBT",
                imagePhoto: "base64string",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Admin updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing userId",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          403: {
            description: "Not an Admin user",
          },
          404: {
            description: "User not found",
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
    "/api/User/admin-details-by-id": {
      get: {
        tags: ["User"],
        summary: "Get Admin details by ID",
        description:
          "Fetch details of an Admin user using UserId and optional UserType",
        parameters: [
          {
            name: "UserId",
            in: "query",
            required: true,
            schema: {
              type: "string",
            },
            description: "The ID of the user",
            example: "67d1f42e7e9bce23a9c10c51",
          },
          {
            name: "UserType",
            in: "query",
            required: false,
            schema: {
              type: "string",
            },
            description: "Type of user (Admin)",
            example: "Admin",
          },
        ],
        responses: {
          200: {
            description: "Admin details retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        _id: { type: "string" },
                        surname: { type: "string" },
                        firstname: { type: "string" },
                        gender: { type: "string" },
                        phoneNo: { type: "string" },
                        email: { type: "string" },
                        birthday: { type: "string", format: "date" },
                        passport: { type: "string" },
                        tenant: { type: "string" },
                        imagePhoto: { type: "string" },
                        role: { type: "string" },
                        userType: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing UserId",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          403: {
            description: "Unauthorized or UserType mismatch",
          },
          404: {
            description: "User not found",
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
    "/api/User/new-tutor": {
      post: {
        tags: ["User"],
        summary: "Create a new Tutor",
        description: "Creates a Tutor account with assigned subjects",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userType: {
                    type: "string",
                    
                  },
                  password: {
                    type: "string",
                    
                  },
                  surname: {
                    type: "string",
                    
                  },
                  firstname: {
                    type: "string",
                    
                  },
                  gender: {
                    type: "string",
                    
                  },
                  phoneNo: {
                    type: "string",
                    
                  },
                  email: {
                    type: "string",
                    
                  },
                  birthday: {
                    type: "string",
                    format: "date",
                    
                  },
                  tenant: {
                    type: "string",
                    
                  },
                  address: {
                    type: "string",
                    
                  },
                  passport: {
                    type: "string",
                    
                  },
                  selectedSubjects: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    
                  },
                },
                required: [
                  "userType",
                  "password",
                  "surname",
                  "firstname",
                  "gender",
                  "phoneNo",
                  "email",
                  "selectedSubjects",
                ],
              },
             
            },
          },
        },
        responses: {
          201: {
            description: "Tutor created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    userId: { type: "string" },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error or duplicate email",
          },
          403: {
            description: "Invalid userType (must be Tutor)",
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
    "/api/User/edit-tutor-user": {
      post: {
        tags: ["User"],
        summary: "Edit Tutor user",
        description: "Updates tutor details including assigned subjects",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: {
                    type: "string",
                    example: "67d1f42e7e9bce23a9c10c51",
                  },
                  surname: {
                    type: "string",
                    example: "Adeyemi",
                  },
                  firstname: {
                    type: "string",
                    example: "Tunji",
                  },
                  gender: {
                    type: "string",
                    example: "Male",
                  },
                  phoneNo: {
                    type: "string",
                    example: "08012345678",
                  },
                  email: {
                    type: "string",
                    example: "tutor@akademia.com",
                  },
                  tenant: {
                    type: "string",
                    example: "AkademiaCBT",
                  },
                  address: {
                    type: "string",
                    example: "Lagos, Nigeria",
                  },
                  passport: {
                    type: "string",
                    example: "A12345678",
                  },
                  selectedSubjects: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    example: ["Mathematics", "Physics"],
                  },
                },
                required: ["userId"],
              },
              example: {
                userId: "67d1f42e7e9bce23a9c10c51",
                surname: "Adeyemi",
                firstname: "Tunji",
                gender: "Male",
                phoneNo: "08012345678",
                email: "tutor@akademia.com",
                tenant: "AkademiaCBT",
                address: "Lagos, Nigeria",
                passport: "A12345678",
                selectedSubjects: ["Mathematics", "Physics"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Tutor updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: { type: "object" },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing userId or validation error",
          },
          403: {
            description: "Not a Tutor user",
          },
          404: {
            description: "User not found",
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
    "/api/User/tutor-details-by-id": {
      get: {
        tags: ["User"],
        summary: "Get Tutor details by ID",
        description: "Fetch a tutor’s full profile using UserId",
        parameters: [
          {
            name: "UserType",
            in: "query",
            required: true,
            schema: {
              type: "string",
            },
            example: "Tutor",
          },
          {
            name: "UserId",
            in: "query",
            required: true,
            schema: {
              type: "string",
            },
            example: "67d1f42e7e9bce23a9c10c51",
          },
        ],
        responses: {
          200: {
            description: "Tutor details fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        _id: { type: "string" },
                        surname: { type: "string" },
                        firstname: { type: "string" },
                        email: { type: "string" },
                        phoneNo: { type: "string" },
                        gender: { type: "string" },
                        address: { type: "string" },
                        tenant: { type: "string" },
                        passport: { type: "string" },
                        selectedSubjects: {
                          type: "array",
                          items: { type: "string" },
                        },
                        createdAt: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing query parameters",
          },
          403: {
            description: "Invalid UserType or not a Tutor",
          },
          404: {
            description: "Tutor not found",
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
    "/api/User/new-candidate": {
      post: {
        tags: ["User"],
        summary: "Create a new Candidate",
        description: "Creates a Candidate account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userType: {
                    type: "string",
                  },
                  password: {
                    type: "string",
                  },
                  surname: {
                    type: "string",
                  },
                  firstname: {
                    type: "string",
                  },
                  gender: {
                    type: "string",
                  },
                  phoneNo: {
                    type: "string",
                  },
                  email: {
                    type: "string",
                  },
                  birthday: {
                    type: "string",
                    format: "date",
                  },
                  tenant: {
                    type: "string",
                  },
                  address: {
                    type: "string",
                  },
                  passport: {
                    type: "string",
                  },
                  selectedSubjects: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                required: [
                  "userType",
                  "password",
                  "surname",
                  "firstname",
                  "gender",
                  "phoneNo",
                  "email",
                  "selectedSubjects",
                ],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Tutor created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    userId: { type: "string" },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error or duplicate email",
          },
          403: {
            description: "Invalid userType (must be Tutor)",
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
    "/api/User/edit-candidate-user": {
      post: {
        tags: ["User"],
        summary: "Edit Candidate user",
        description: "Updates an existing Candidate user record",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: {
                    type: "string",
                    example: "67d1f42e7e9bce23a9c10c51",
                  },
                  password: {
                    type: "string",
                    example: "NewPassword123!",
                  },
                  surname: {
                    type: "string",
                    example: "Adeyemi",
                  },
                  firstname: {
                    type: "string",
                    example: "Tunji",
                  },
                  gender: {
                    type: "string",
                    example: "Male",
                  },
                  phoneNo: {
                    type: "string",
                    example: "08012345678",
                  },
                  email: {
                    type: "string",
                    example: "candidate@akademia.com",
                  },
                  birthday: {
                    type: "string",
                    format: "date",
                    example: "2002-05-20",
                  },
                  passport: {
                    type: "string",
                    example: "A12345678",
                  },
                  otherName: {
                    type: "string",
                    example: "Oluwaseun",
                  },
                  physicalChallenge: {
                    type: "string",
                    example: "None",
                  },
                  tenant: {
                    type: "string",
                    example: "AkademiaCBT",
                  },
                  selectedSubjs: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    example: ["Mathematics", "English Language", "Physics"],
                  },
                },
                required: ["userId"],
              },
              example: {
                userId: "67d1f42e7e9bce23a9c10c51",
                password: "NewPassword123!",
                surname: "Adeyemi",
                firstname: "Tunji",
                gender: "Male",
                phoneNo: "08012345678",
                email: "candidate@akademia.com",
                birthday: "2002-05-20",
                passport: "A12345678",
                otherName: "Oluwaseun",
                physicalChallenge: "None",
                tenant: "AkademiaCBT",
                selectedSubjs: ["Mathematics", "English Language", "Physics"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Candidate updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing userId or validation error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          403: {
            description: "Not a Candidate user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          404: {
            description: "User not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
    "/api/User/candidate-details-by-id": {
      get: {
        tags: ["User"],
        summary: "Get Candidate details by ID",
        description:
          "Fetch details of a Candidate user using UserId and optional UserType",
        parameters: [
          {
            name: "UserType",
            in: "query",
            required: false,
            schema: {
              type: "string",
            },
            description: "Type of user",
            example: "Candidate",
          },
          {
            name: "UserId",
            in: "query",
            required: true,
            schema: {
              type: "string",
            },
            description: "The ID of the candidate",
            example: "67d1f42e7e9bce23a9c10c51",
          },
        ],
        responses: {
          200: {
            description: "Candidate details retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        _id: { type: "string" },
                        surname: { type: "string" },
                        firstname: { type: "string" },
                        otherName: { type: "string" },
                        gender: { type: "string" },
                        phoneNo: { type: "string" },
                        email: { type: "string" },
                        birthday: { type: "string", format: "date" },
                        passport: { type: "string" },
                        physicalChallenge: { type: "string" },
                        tenant: { type: "string" },
                        selectedSubjs: {
                          type: "array",
                          items: { type: "string" },
                        },
                        role: { type: "string" },
                        userType: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing UserId",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          403: {
            description: "Not a Candidate user or UserType mismatch",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          404: {
            description: "Candidate not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
    "/api/Subject/add-subject": {
      post: {
        tags: ["Subject"],
        summary: "Add a new subject",
        description: "Creates a new subject in the system",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                  },
                  tenant: {
                    type: "string",
                  },
                  shortCode: {
                    type: "string",
                  },
                  description: {
                    type: "string",
                  },
                },
                required: ["name", "tenant", "shortCode"],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Subject added successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        _id: { type: "string" },
                        name: { type: "string" },
                        tenant: { type: "string" },
                        shortCode: { type: "string" },
                        description: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error or duplicate subject",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
    "/api/Subject/edit-subject": {
      post: {
        tags: ["Subject"],
        summary: "Edit subject",
        description: "Updates an existing subject",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                  },
                  name: {
                    type: "string",
                  },
                  description: {
                    type: "string",
                  },
                  shortCode: {
                    type: "string",
                  },
                },
                required: ["id"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Subject updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error or duplicate subject",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          404: {
            description: "Subject not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
    "/api/Subject/subject-list": {
      get: {
        tags: ["Subject"],
        summary: "Get subject list",
        description:
          "Fetches a paginated list of subjects with optional filtering by tenant and name",
        parameters: [
          {
            name: "PageNo",
            in: "query",
            required: false,
            schema: {
              type: "integer",
              format: "int32",
            },
            description: "Page number",
          },
          {
            name: "PageSize",
            in: "query",
            required: false,
            schema: {
              type: "integer",
              format: "int32",
            },
            description: "Number of records per page",
          },
          {
            name: "Tenant",
            in: "query",
            required: false,
            schema: {
              type: "string",
            },
            description: "Tenant name",
          },
          {
            name: "Name",
            in: "query",
            required: false,
            schema: {
              type: "string",
            },
            description: "Subject name filter",
          },
        ],
        responses: {
          200: {
            description: "Subjects fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    message: {
                      type: "string",
                    },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          _id: {
                            type: "string",
                          },
                          name: {
                            type: "string",
                          },
                          tenant: {
                            type: "string",
                          },
                          shortCode: {
                            type: "string",
                          },
                          description: {
                            type: "string",
                          },
                          createdAt: {
                            type: "string",
                          },
                          updatedAt: {
                            type: "string",
                          },
                        },
                      },
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        pageNo: {
                          type: "integer",
                        },
                        pageSize: {
                          type: "integer",
                        },
                        totalRecords: {
                          type: "integer",
                        },
                        totalPages: {
                          type: "integer",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid pagination parameters",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    message: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
    "/api/Subject/fetch-subject": {
      get: {
        tags: ["Subject"],
        summary: "Fetch all subjects",
        description: "Retrieves a list of all subjects",
        responses: {
          200: {
            description: "Subjects fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    message: {
                      type: "string",
                    },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          _id: {
                            type: "string",
                          },
                          name: {
                            type: "string",
                          },
                          shortCode: {
                            type: "string",
                          },
                          tenant: {
                            type: "string",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
    "/api/Subject/delete-subject": {
      delete: {
        tags: ["Subject"],
        summary: "Delete subject",
        description:
          "Deletes a subject using subjectId. Only Admin users can perform this action.",
        parameters: [
          {
            name: "subjectId",
            in: "query",
            required: true,
            schema: {
              type: "string",
            },
            description: "ID of the subject to delete",
          },
        ],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: "Subject deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    message: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing subjectId",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    message: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    message: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
          403: {
            description: "Forbidden - Admins only",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    message: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "Subject not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    message: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
    "/api/Question/new-question": {
      post: {
        tags: ["Question"],
        summary: "Create new question",
        description:
          "Creates a new exam question. Only Admin users can perform this action.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  subject: {
                    type: "string",
                  },
                  examYear: {
                    type: "string",
                  },
                  orderId: {
                    type: "integer",
                  },
                  ask: {
                    type: "string",
                  },
                  option1: {
                    type: "string",
                  },
                  option2: {
                    type: "string",
                  },
                  option3: {
                    type: "string",
                  },
                  option4: {
                    type: "string",
                  },
                  answer: {
                    type: "string",
                  },
                  score: {
                    type: "integer",
                  },
                },
                required: [
                  "subject",
                  "examYear",
                  "orderId",
                  "ask",
                  "option1",
                  "option2",
                  "option3",
                  "option4",
                  "answer",
                  "score",
                ],
              },
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          201: {
            description: "Question created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    message: {
                      type: "string",
                    },
                    data: {
                      type: "object",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    message: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
          },
          403: {
            description: "Forbidden - Admins only",
          },
          404: {
            description: "Subject not found",
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
    "/api/Question/update-question": {
      post: {
        tags: ["Question"],
        summary: "Update question",
        description:
          "Updates an existing exam question. Only Tutor users can perform this action.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  questionId: {
                    type: "string",
                  },
                  subject: {
                    type: "string",
                  },
                  examYear: {
                    type: "string",
                  },
                  orderId: {
                    type: "integer",
                  },
                  ask: {
                    type: "string",
                  },
                  option1: {
                    type: "string",
                  },
                  option2: {
                    type: "string",
                  },
                  option3: {
                    type: "string",
                  },
                  option4: {
                    type: "string",
                  },
                  answer: {
                    type: "string",
                  },
                  score: {
                    type: "integer",
                  },
                },
                required: ["questionId"],
              },
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          200: {
            description: "Question updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    message: {
                      type: "string",
                    },
                    data: {
                      type: "object",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    message: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
          },
          403: {
            description: "Forbidden - Tutors only",
          },
          404: {
            description: "Question or subject not found",
          },
          500: {
            description: "Server error",
          },
        },
      },
    },
  },
};

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API routes
const authRoutes = require("./routes/authRoutes");

app.use("/api/auth", authRoutes);

// Basic route to test
app.get("/", (req, res) => {
  res.send("Akademia CBT API is running");
});

module.exports = app;
