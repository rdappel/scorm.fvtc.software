// src/server/middleware/upload.js
import multer from 'multer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from 'fs-extra'
const { ensureDirSync } = pkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Pure function for creating uploads directory path
const createUploadsDir = __dirname => path.join(__dirname, '../uploads')

// Pure function for creating multer configuration
const createUploadConfig = destination => ({
	dest: destination,
	limits: { fileSize: 200 * 1024 * 1024 } // 200MB
})

// Initialize upload configuration
const uploadsDir = createUploadsDir(__dirname)
ensureDirSync(uploadsDir)

// Multer configuration for file uploads
export const upload = multer(createUploadConfig(uploadsDir))