// src/server/services/scormService.js
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from 'fs-extra'
const { ensureDirSync, rm } = pkg
import { mkdtemp } from 'node:fs/promises'
import os from 'node:os'
import extract from 'extract-zip'
import { generate } from '../../generator.js'
import { validateSpec } from '../utils/validate.js'
import { logger } from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Pure function for creating directory paths
const createPaths = __dirname => ({
	uploads: path.join(__dirname, '../uploads'),
	dist: path.join(__dirname, '../../../dist')
})

// Initialize directories
const paths = createPaths(__dirname)
ensureDirSync(paths.uploads)
ensureDirSync(paths.dist)

// Pure function for creating code practice spec
const createCodePracticeSpec = formData => ({
	title: formData.practiceTitle,
	identifier: formData.objectId,
	scormVersion: '1.2',
	launch: 'index.html',
	objectType: 'code-practice',
	courseTitle: formData.courseTitle,
	practiceTitle: formData.practiceTitle,
	language: formData.language,
	instructions: formData.instructions,
	instructionsMarkdown: formData.instructionsMarkdown || '',
	startingCode: formData.startingCode || '',
	configCode: formData.configCode || '',
	metadata: {
		author: 'SCORM Generator',
		description: formData.practiceTitle
	}
})

// Pure function for creating legacy spec from JSON
const createLegacySpec = formData => {
	if (!formData.specJson?.trim()) {
		throw new Error('Missing spec JSON')
	}
	
	const spec = JSON.parse(formData.specJson)
	return {
		...spec,
		scormVersion: spec.scormVersion || '1.2'
	}
}

// Pure function for determining file type
const isZipFile = file => 
	file.mimetype === 'application/zip' || 
	file.originalname.toLowerCase().endsWith('.zip')

// Function for validating file type
const validateFileType = file => {
	if (!isZipFile(file)) {
		throw new Error('Uploaded content must be a .zip')
	}
	return file
}

// Function for creating generation options
const createGenerationOptions = (spec, contentPath = null) => ({
	spec: contentPath ? { ...spec, contentPath } : spec,
	outdir: paths.dist,
	tmpDir: path.join(paths.uploads, 'work'),
	zip: true
})

// Higher-order function for error handling
const withErrorHandling = fn => async (...args) => {
	try {
		return await fn(...args)
	} catch (error) {
		logger.error(`Error in ${fn.name}:`, error)
		throw error
	}
}

/**
 * Create a SCORM specification object from form data
 * @param {Object} formData - The form data from the request
 * @returns {Object} SCORM specification object
 */
export const createScormSpec = formData => 
	formData.objectType === 'code-practice' 
		? createCodePracticeSpec(formData)
		: createLegacySpec(formData)

/**
 * Process uploaded content zip file
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} Path to extracted content
 */
export const processContentZip = withErrorHandling(async file => {
	if (!file) return null
	
	const validatedFile = validateFileType(file)
	const temporaryExtractDirectory = await mkdtemp(path.join(os.tmpdir(), 'scorm-content-'))
	await extract(validatedFile.path, { dir: temporaryExtractDirectory })
	
	return temporaryExtractDirectory
})

/**
 * Generate SCORM package
 * @param {Object} spec - SCORM specification object
 * @param {string} contentPath - Optional path to extracted content
 * @returns {Promise<Object>} Build information
 */
export const generateScormPackage = withErrorHandling(async (spec, contentPath = null) => {
	// Validate specification
	const validation = validateSpec(spec)
	if (!validation.valid) {
		throw new Error(`Invalid spec: ${validation.errors.join(', ')}`)
	}

	// Generate package
	const options = createGenerationOptions(spec, contentPath)
	const buildInfo = await generate(options)

	logger.info('SCORM package generated successfully:', {
		title: spec.title,
		identifier: spec.identifier,
		zipPath: buildInfo.zipPath
	})

	return buildInfo
})

/**
 * Clean up temporary directories and work files
 * @param {string} temporaryDirectory - Path to temporary directory to clean up
 * @returns {Promise<void>}
 */
export const cleanupTempDir = withErrorHandling(async temporaryDirectory => {
	if (!temporaryDirectory) return
	
	await rm(temporaryDirectory, { recursive: true, force: true })
	logger.info('Cleaned up temporary directory:', temporaryDirectory)
})

/**
 * Clean up work directory after SCORM generation
 * @param {string} workingDirectory - Path to work directory
 * @returns {Promise<void>}
 */
export const cleanupWorkDir = withErrorHandling(async workingDirectory => {
	const { emptyDir } = await import('fs-extra')
	await emptyDir(workingDirectory)
	logger.info('Cleaned up work directory:', workingDirectory)
})