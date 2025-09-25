# SCORM Generator

A powerful web-based tool for creating interactive SCORM-compliant learning objects, with a specialized focus on code practice exercises for programming education.

## Overview

This project provides an intuitive web interface for educators to quickly generate SCORM packages without needing technical expertise. The platform supports various types of learning content, with advanced features for creating interactive coding exercises with syntax highlighting, template variables, and automated testing frameworks.

## Features

### 🎯 **Interactive Code Practice Objects**
- **Multi-language Support**: JavaScript, Python, Java, C++, C#, PHP
- **Monaco Editor Integration**: Full-featured code editor with syntax highlighting
- **Template Variables**: Dynamic content replacement (`{{student_name}}`, `{{course_title}}`, etc.)
- **Dual Editor System**: Separate configuration and starting code editors
- **Language-Specific Examples**: Pre-built templates for each supported language

### 🔧 **SCORM Compliance**
- **SCORM 1.2 Compatible**: Full compliance with industry standards
- **LMS Integration**: Works with Moodle, Canvas, Blackboard, and other major LMS platforms
- **Progress Tracking**: Built-in completion and scoring mechanisms
- **Manifest Generation**: Automatic imsmanifest.xml creation

### 🎨 **User Experience**
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Form Persistence**: Automatic saving of work-in-progress
- **File Management**: Automatic cleanup of old generated packages
- **Example System**: Quick-load examples for different programming languages

### 🛠 **Technical Features**
- **Template Processing**: Advanced regex-based variable replacement
- **CSP Compliance**: Works within strict Content Security Policy environments
- **Zip Generation**: Automated SCORM package creation
- **Express.js Backend**: RESTful API for package generation
- **Static File Serving**: Integrated asset management

## Quick Start

### Prerequisites
- **Node.js** (v20.0.0 or higher)
- **npm** (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/rdappel/scorm.fvtc.software.git
cd scorm.fvtc.software

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Usage

1. **Navigate to the web interface** at `http://localhost:3000`
2. **Select "Code Practice Object"** from the main menu
3. **Fill in the course details**:
   - Course Title
   - Practice Title
   - Object ID
   - Programming Language
   - Instructions for students
4. **Configure the code editors**:
   - **Configuration Code**: Test runners, setup code, validation logic
   - **Starting Code**: Template code that students will modify
5. **Use template variables** like `{{student_name}}`, `{{id}}`, `{{course_title}}` for dynamic content
6. **Click "Generate Code Practice SCORM Object"** to download your package

### Template Variables

The system supports intelligent template variable replacement with language-aware comment processing:

| Variable | Description |
|----------|-------------|
| **Student Variables** |
| `{{id}}` | Student ID number |
| `{{name}}` | Student name (alias for full_name) |
| `{{first_name}}` | Student's first name |
| `{{last_name}}` | Student's last name |
| `{{full_name}}` | Student's full name (first + last) |
| **Context Variables** |
| `{{course_title}}` | Course title |
| `{{practice_title}}` | Assignment/practice title |
| `{{object_id}}` | SCORM object identifier |
| `{{language}}` | Programming language being used |
| **Date & Time Variables** |
| `{{date}}` | Current date (localized format) |
| `{{time}}` | Current time (localized format) |
| `{{datetime}}` | Current date and time (localized format) |
| `{{timestamp}}` | Unix timestamp |
| `{{year}}` | Current year |
| `{{month}}` | Current month name |
| `{{day}}` | Current day of week |
| **Dynamic Variables** |
| `{{random_number}}` | Random number (1-1000) |
| `{{random_word}}` | Random word from predefined list |
| `{{uuid}}` | Generated UUID |
| `{{attempt_count}}` | Number of code runs this session |
| `{{session_time}}` | Seconds since page load |
| **Code Insertion** |
| `{{student_code}}` | Placeholder where student code will be inserted |
| `{{code}}` | Alternative placeholder for code insertion |

**Comment Style Support**:
- **C-style**: `/*{{variable}}*/`  
- **Hash**: `#{{variable}}`
- **Double-slash**: `//{{variable}}`
- **PowerShell**: `<#{{variable}}#>`

**Examples by Language**:
```javascript
// Hello /*{{first_name}}*/! Welcome to your JavaScript assignment.
// Student ID: /*{{id}}*/ | Course: /*{{course_title}}*/
// Assignment: /*{{practice_title}}*/
// Generated on: /*{{date}}*/ at /*{{time}}*/

/*{{student_code}}*/
```

```python
# Hello #{{first_name}}! Welcome to your Python assignment.
# Student ID: #{{id}} | Course: #{{course_title}}
# Assignment: #{{practice_title}}
# Your attempt #: #{{attempt_count}}

#{{student_code}}
```

```powershell
# Welcome <#{{first_name}}#> <#{{last_name}}#>!
# Student ID: <#{{id}}#>
# Course: <#{{course_title}}#>
# Assignment: <#{{practice_title}}#>
# Session ID: <#{{uuid}}#>

<#{{student_code}}#>
```

## Project Structure

```
scorm.fvtc.software/
├── src/
│   ├── generator.js          # Main SCORM generation logic
│   ├── server/
│   │   ├── app.js           # Express.js server
│   │   ├── cleanup.js       # File cleanup utilities
│   │   ├── routes.js        # API routes
│   │   └── validate.js      # Input validation
│   └── templates/           # SCORM templates and assets
├── views/
│   ├── index.ejs           # Main menu
│   └── code-practice.ejs   # Code practice form
├── public/
│   └── css/
│       └── wizard.css      # Application styling
└── examples/               # Example configurations
```

## API Endpoints

### `POST /generate`
Generate a SCORM package from form data.

**Request Body**:
```json
{
  "type": "code-practice",
  "courseTitle": "JavaScript Programming",
  "practiceTitle": "Functions and Arrays",
  "objectId": "js-practice-1",
  "language": "javascript",
  "instructions": "Complete the functions below",
  "configCode": "// Test configuration code",
  "startingCode": "// Student starting code"
}
```

**Response**: SCORM zip file download

## Development

### Scripts

```bash
# Development server with auto-reload
npm run dev

# Build example SCORM package
npm run build

# Run linting
npm run lint

# Security audit
npm run audit
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
```

## Supported Programming Languages

| Language | Monaco Language ID | Comment Styles |
|----------|-------------------|----------------|
| JavaScript | `javascript` | `//`, `/*...*/` |
| Python | `python` | `#` |
| Java | `java` | `//`, `/*...*/` |
| C++ | `cpp` | `//`, `/*...*/` |
| C# | `csharp` | `//`, `/*...*/` |
| PHP | `php` | `//`, `/*...*/`, `#` |

## SCORM Compatibility

- **SCORM Version**: 1.2
- **Tested LMS Platforms**:
  - Moodle 3.x+
  - Canvas
  - Blackboard Learn
  - D2L Brightspace
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/rdappel/scorm.fvtc.software/issues)
- **Documentation**: This README and inline code comments

---

**Built with ❤️ for educators and students**