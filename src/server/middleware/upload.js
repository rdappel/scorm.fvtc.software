// src/server/middleware/upload.js
import multer from 'multer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from 'fs-extra'
const { ensureDirSync } = pkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Directories
const uploadsDir = path.join(__dirname, '../uploads')
ensureDirSync(uploadsDir)

// Multer configuration for file uploads
export const upload = multer({
	dest: uploadsDir,
	limits: { fileSize: 200 * 1024 * 1024 } // 200MB
})