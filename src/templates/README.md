# Template Processing Architecture

## Overview
The SCORM generator uses an in-memory template processing approach that avoids modifying source template files, preventing git conflicts and version control issues.

## How It Works

### 1. Template Loading
Templates are loaded into memory from the `src/templates/` directory:
```
src/templates/
├── code-practice/
│   ├── index.html       # Main template with EJS placeholders
│   ├── scripts/         # Static JavaScript files
│   └── styles/          # Static CSS files
└── scorm12/
    ├── api-adapter-1.2.js  # Static SCORM API
    ├── imsmanifest.ejs     # Manifest template
    └── launch.ejs          # Launch page template
```

### 2. In-Memory Processing
- Templates are read into memory as strings
- EJS processes placeholders with dynamic data
- Processed content is written directly to work directory
- **Source templates remain unchanged**

### 3. Available Placeholders
Templates can use these EJS variables:

#### Spec Object Properties
```ejs
<%= spec.courseTitle %>      <!-- Course title -->
<%= spec.practiceTitle %>    <!-- Practice/assignment title -->
<%= spec.identifier %>       <!-- Unique object ID -->
<%= spec.language %>         <!-- Programming language -->
<%= spec.instructions %>     <!-- HTML instructions -->
<%= spec.startingCode %>     <!-- Student starting code -->
<%= spec.configCode %>       <!-- Configuration/test code -->
```

#### Helper Objects
```ejs
<%= Buffer %>                <!-- Node.js Buffer for binary data -->
```

### 4. Template Examples

#### Code Practice Index Template
```html
<!DOCTYPE html>
<html>
<head>
    <title><%= spec.practiceTitle %> - <%= spec.courseTitle %></title>
    <meta name="language" content="<%= spec.language %>">
</head>
<body>
    <h1><%= spec.practiceTitle %></h1>
    <div class="instructions">
        <%- spec.instructions %>
    </div>
    <div class="starting-code">
        <pre><code><%= spec.startingCode %></code></pre>
    </div>
</body>
</html>
```

#### SCORM Manifest Template
```xml
<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="<%= spec.identifier %>">
    <metadata>
        <schema>ADL SCORM</schema>
        <schemaversion><%= spec.scormVersion %></schemaversion>
    </metadata>
    <organizations default="<%= spec.identifier %>_org">
        <organization identifier="<%= spec.identifier %>_org">
            <title><%= spec.title %></title>
            <item identifier="<%= spec.identifier %>_item" 
                  identifierref="<%= spec.identifier %>_resource">
                <title><%= spec.title %></title>
            </item>
        </organization>
    </organizations>
</manifest>
```

## Benefits

### ✅ Version Control Friendly
- Source templates never modified
- No git conflicts from template changes
- Clean repository status

### ✅ Performance
- Templates loaded once per generation
- In-memory processing is fast
- No unnecessary file I/O

### ✅ Isolation
- Each generation gets fresh template processing
- No cross-contamination between requests
- Parallel generation support

### ✅ Maintainability
- Clear separation of templates and data
- Easy to add new placeholders
- Simple debugging with clear template files

## Work Directory Cleanup

After each generation:
1. **Temporary extraction directory** is cleaned up
2. **Work directory** is emptied to prevent conflicts
3. **Generated SCORM package** is moved to dist/
4. **Source templates** remain pristine

This ensures a clean state for every generation and prevents any git tracking of temporary files.