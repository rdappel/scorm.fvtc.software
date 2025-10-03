# API Migration Guide

## URL Changes

### Old vs New Endpoints

| Old URL | New URL | Notes |
|---------|---------|-------|
| `POST /generate` | `POST /api/v1/generate` | SCORM generation |
| `GET /download/:file` | `GET /api/v1/download/:file` | File downloads |
| `POST /cleanup` | `POST /api/v1/admin/cleanup` | Admin cleanup |
| `GET /` | `GET /` | No change (public page) |
| `GET /code-practice` | `GET /code-practice` | No change (public page) |

## Form Updates

### Code Practice Form
The form action has been updated automatically:
```html
<!-- Old -->
<form action="/generate" method="post">

<!-- New -->
<form action="/api/v1/generate" method="post">
```

## JavaScript/Fetch Updates

If you have any custom JavaScript making API calls:

```javascript
// Old
fetch('/generate', { method: 'POST', body: formData })
fetch('/download/file.zip')
fetch('/cleanup', { method: 'POST' })

// New  
fetch('/api/v1/generate', { method: 'POST', body: formData })
fetch('/api/v1/download/file.zip')
fetch('/api/v1/admin/cleanup', { method: 'POST' })
```

## Benefits of New Structure

1. **Clear API Versioning**: Future versions won't break existing code
2. **Organized Routes**: Related functionality grouped together
3. **Admin Separation**: Admin functions clearly separated under `/admin/`
4. **Documentation**: Clear API docs available at `src/server/API.md`
5. **Future-Proof**: Easy to add authentication, rate limiting, etc.

## Backward Compatibility

Currently, the old endpoints are **not** supported. All references have been updated to use the new versioned URLs.

If you need backward compatibility, you can add redirect routes:
```javascript
// In routes/index.js
router.post('/generate', (req, res) => {
  res.redirect(308, '/api/v1/generate')
})
```