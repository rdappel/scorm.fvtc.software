# API Documentation

## Base URL
All API endpoints are prefixed with `/api/v1`

## Authentication
Currently, no authentication is required for public APIs. Admin endpoints may require authentication in future versions.

## Endpoints

### 📄 Page Routes (No versioning)
These routes serve HTML pages and don't require API versioning.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Home page |
| `GET` | `/code-practice` | Code practice form |

### 🔧 SCORM API (v1)

#### Generate SCORM Package
```http
POST /api/v1/generate
```

**Content-Type**: `multipart/form-data`

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `objectType` | string | Yes | Must be `"code-practice"` |
| `courseTitle` | string | Yes | Course title |
| `practiceTitle` | string | Yes | Practice/assignment title |
| `objectId` | string | Yes | Unique identifier |
| `language` | string | Yes | Programming language |
| `instructions` | string | Yes | Instructions (HTML) |
| `instructionsMarkdown` | string | No | Instructions (Markdown) |
| `configCode` | string | No | Configuration code |
| `startingCode` | string | No | Starting code template |
| `contentZip` | file | No | Optional content ZIP file |

**Response**:
- **Success**: Renders success page with download link
- **Error**: Renders error page with error message

**Example**:
```javascript
const formData = new FormData()
formData.append('objectType', 'code-practice')
formData.append('courseTitle', 'JavaScript Programming')
formData.append('practiceTitle', 'Arrays and Functions')
formData.append('objectId', 'js-arrays-1')
formData.append('language', 'javascript')
formData.append('instructions', 'Complete the exercises...')

fetch('/api/v1/generate', {
  method: 'POST',
  body: formData
})
```

#### Download SCORM Package
```http
GET /api/v1/download/:filename
```

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filename` | string | Yes | Name of the file to download |

**Response**:
- **Success**: File download
- **404**: File not found
- **400**: Invalid filename

**Example**:
```
GET /api/v1/download/my-scorm-package_2025-10-03_14-30-45.zip
```

### 🛠 Admin API (v1)

#### System Cleanup
```http
POST /api/v1/admin/cleanup
```

**Description**: Performs system cleanup by removing old files and temporary directories.

**Response**:
```json
{
  "success": true,
  "message": "Cleanup completed successfully",
  "details": {
    "distFilesRemoved": 5,
    "workDirectoryCleaned": true
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Cleanup operation failed",
  "message": "Detailed error message"
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (file or endpoint)
- `500` - Internal Server Error

## Rate Limiting
Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## Future Versions

### Planned v2 Features
- Authentication and authorization
- User management
- Template management
- Batch operations
- Webhooks for generation completion

### Migration Guide
When v2 is released:
- v1 will remain available at `/api/v1/*`
- v2 will be available at `/api/v2/*`
- Deprecation notices will be provided 6 months before v1 retirement

## Examples

### Complete SCORM Generation Workflow
```javascript
// 1. Generate SCORM package
const generateResponse = await fetch('/api/v1/generate', {
  method: 'POST',
  body: formData
})

// 2. Extract download URL from response
// (URL is provided in the success page HTML)

// 3. Download the package
window.location.href = '/api/v1/download/package-name.zip'
```