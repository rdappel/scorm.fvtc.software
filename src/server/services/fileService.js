// src/server/services/fileService.js
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { access, constants } from 'node:fs/promises'
import sanitize from 'sanitize-filename'
import { logger } from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Pure function for creating paths
const createDistDir = __dirname => path.join(__dirname, '../../../dist')

// Directories
const distDir = createDistDir(__dirname)

// Pure function for filename validation
const isValidFilename = (filename, safeFilename) => 
	safeFilename && safeFilename === filename

// Pure function for path security validation
const isSecurePath = (filePath, distDir) => {
	const resolvedPath = path.resolve(filePath)
	const resolvedDistDir = path.resolve(distDir)
	return resolvedPath.startsWith(resolvedDistDir)
}

// Higher-order function for file access checking
const withFileAccess = accessFn => async filePath => {
	try {
		await accessFn(filePath, constants.F_OK | constants.R_OK)
		return filePath
	} catch (error) {
		throw new Error('File not found')
	}
}

const checkFileAccess = withFileAccess(access)

/**
 * Validate and get safe file path for download
 * @param {string} filename - The requested filename
 * @returns {Promise<string>} Safe file path
 * @throws {Error} If file doesn't exist or is invalid
 */
export const getDownloadPath = async filename => {
	// Sanitize filename to prevent directory traversal
	const safeFilename = sanitize(filename)
	
	if (!isValidFilename(filename, safeFilename)) {
		throw new Error('Invalid filename')
	}
	
	const filePath = path.join(distDir, safeFilename)
	
	// Ensure file exists and is accessible
	try {
		await checkFileAccess(filePath)
	} catch (error) {
		logger.warn(`File access denied or not found: ${safeFilename}`)
		throw error
	}
	
	// Ensure the file is within the dist directory (security check)
	if (!isSecurePath(filePath, distDir)) {
		logger.warn(`Directory traversal attempt detected: ${filename}`)
		throw new Error('Invalid file path')
	}
	
	logger.info(`File download requested: ${safeFilename}`)
	return filePath
}