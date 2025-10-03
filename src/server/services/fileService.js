// src/server/services/fileService.js
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { access, constants } from 'node:fs/promises'
import sanitize from 'sanitize-filename'
import { logger } from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Directories
const distDir = path.join(__dirname, '../../../dist')

/**
 * Validate and get safe file path for download
 * @param {string} filename - The requested filename
 * @returns {Promise<string>} Safe file path
 * @throws {Error} If file doesn't exist or is invalid
 */
export const getDownloadPath = async (filename) => {
	// Sanitize filename to prevent directory traversal
	const safeFilename = sanitize(filename)
	
	if (!safeFilename || safeFilename !== filename) {
		throw new Error('Invalid filename')
	}
	
	const filePath = path.join(distDir, safeFilename)
	
	// Ensure file exists and is accessible
	try {
		await access(filePath, constants.F_OK | constants.R_OK)
	} catch (error) {
		logger.warn(`File access denied or not found: ${safeFilename}`)
		throw new Error('File not found')
	}
	
	// Ensure the file is within the dist directory (security check)
	const resolvedPath = path.resolve(filePath)
	const resolvedDistDir = path.resolve(distDir)
	
	if (!resolvedPath.startsWith(resolvedDistDir)) {
		logger.warn(`Directory traversal attempt detected: ${filename}`)
		throw new Error('Invalid file path')
	}
	
	logger.info(`File download requested: ${safeFilename}`)
	return filePath
}