# Server Architecture

This directory contains the server-side code organized following MVC (Model-View-Controller) patterns and clean architecture principles.

## Directory Structure

```
src/server/
├── controllers/          # Request handlers (thin layer)
│   ├── adminController.js    # Admin operations (cleanup)
│   ├── downloadController.js # File download handling
│   ├── homeController.js     # Page rendering
│   └── scormController.js    # SCORM generation
├── middleware/           # Express middleware
│   └── upload.js            # File upload configuration
├── routes/               # Route definitions by feature
│   ├── adminRoutes.js       # Admin API routes (/api/v1/admin/*)
│   ├── apiRoutes.js         # Core API routes (/api/v1/*)
│   ├── pageRoutes.js        # Page routes (/)
│   └── index.js             # Route aggregation with versioning
├── services/             # Business logic layer
│   ├── fileService.js       # File operations and security
│   └── scormService.js      # SCORM generation logic
├── utils/                # Utility functions and helpers
│   ├── cleanup.js           # File cleanup utilities
│   ├── logger.js            # Logging configuration
│   ├── validate.js          # Input validation
│   └── zipper.js            # ZIP file utilities
├── config/               # Configuration files and schemas
│   └── schema/
│       └── course.schema.json # JSON validation schema
├── docs/                 # Documentation
│   ├── API.md               # API documentation
│   └── README.md            # Architecture documentation
├── uploads/              # File upload directory (gitignored)
│   └── work/                # Temporary processing directory
├── app.js               # Express application setup
└── routes.js            # Main routes entry point
```

## Architecture Principles

### API Versioning
- **Public Pages**: No versioning (/, /code-practice)
- **API Endpoints**: Versioned with `/api/v1/` prefix
- **Admin Endpoints**: Nested under `/api/v1/admin/`
- **Future-Proof**: Easy to add v2, v3 without breaking existing clients

### Controllers
- **Responsibility**: Handle HTTP requests and responses
- **Keep thin**: Minimal logic, delegate to services
- **Error handling**: Consistent error responses
- **Validation**: Basic request validation

### Services
- **Responsibility**: Business logic and data processing
- **Stateless**: Pure functions where possible
- **Reusable**: Can be used by multiple controllers
- **Testable**: Easy to unit test

### Utils
- **Responsibility**: Helper functions and utilities
- **Pure Functions**: No side effects, deterministic
- **Cross-cutting**: Used across multiple layers
- **Examples**: Logging, validation, file operations

### Config
- **Responsibility**: Configuration files and schemas
- **Environment**: Settings for different environments
- **Validation**: JSON schemas for data validation
- **Constants**: Application-wide constants

### Middleware
- **Responsibility**: Cross-cutting concerns
- **Examples**: Authentication, file upload, logging
- **Reusable**: Applied across multiple routes

## Usage Examples

### Adding a New Feature

1. **Service Layer** (business logic):
```javascript
// src/server/services/newFeatureService.js
export const processNewFeature = async (data) => {
  // Business logic here
  return result
}
```

2. **Controller** (request handling):
```javascript
// src/server/controllers/newFeatureController.js
import { processNewFeature } from '../services/newFeatureService.js'

export const handleNewFeature = async (req, res) => {
  try {
    const result = await processNewFeature(req.body)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
```

3. **Routes** (endpoint definition):
```javascript
// src/server/routes.js
import { handleNewFeature } from './controllers/newFeatureController.js'

router.post('/new-feature', handleNewFeature)
```

## Benefits

- **Separation of Concerns**: Each layer has a specific responsibility
- **Testability**: Services can be tested independently
- **Maintainability**: Changes are isolated to specific layers
- **Reusability**: Services can be shared across controllers
- **Security**: Centralized validation and sanitization