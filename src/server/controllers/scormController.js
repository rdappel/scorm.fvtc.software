// src/server/controllers/scormController.js
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { logger } from '../utils/logger.js'
import { 
	createScormSpec, 
	processContentZip, 
	generateScormPackage, 
	cleanupTempDir,
	cleanupWorkDir
} from '../services/scormService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Pure function for creating work directory path
const getWorkDir = __dirname => path.join(__dirname, '../uploads/work')

// Pure function for creating log data
const createLogData = (settings, hasFile) => ({
	objectType: settings.objectType,
	title: settings.title,
	identifier: settings.identifier,
	language: settings.language,
	hasUploadedContent: hasFile
})

// Pure function for creating build info response
const createBuildResponse = buildInfo => {
	const fileName = path.basename(buildInfo.zipPath)
	return {
		...buildInfo,
		fileName,
		downloadUrl: `/api/v1/download/${encodeURIComponent(fileName)}`
	}
}

// Higher-order function for async error handling with cleanup
const withCleanup = cleanupFn => fn => async (...args) => {
	let resources = null
	try {
		const result = await fn(...args)
		resources = result.resources
		return result.value
	} finally {
		if (resources) {
			await cleanupFn(resources)
		}
	}
}

// Function for cleaning up SCORM generation resources
const cleanupScormResources = async ({ temporaryExtractDirectory, workingDirectory }) => {
	await Promise.all([
		cleanupTempDir(temporaryExtractDirectory),
		cleanupWorkDir(workingDirectory)
	])
}

// Core SCORM generation logic
const executeScormGeneration = async (request, response) => {
	// 1) Create SCORM specification from form data
	const settings = createScormSpec(request.body)
	
	logger.info('Processing SCORM generation request:', 
		createLogData(settings, !!request.file)
	)

	// 2) Process uploaded content zip if provided
	const temporaryExtractDirectory = request.file ? await processContentZip(request.file) : null

	// 3) Generate SCORM package
	const buildInformation = await generateScormPackage(settings, temporaryExtractDirectory)

	// 4) Send success response with download link
	const responseData = createBuildResponse(buildInformation)
	response.render('success', { buildInfo: responseData })

	logger.info('SCORM generation completed successfully:', {
		fileName: responseData.fileName,
		scormVersion: buildInformation.scormVersion
	})

	// Return resources for cleanup
	return {
		value: buildInformation,
		resources: {
			temporaryExtractDirectory,
			workingDirectory: getWorkDir(__dirname)
		}
	}
}

// Main controller function with error handling and cleanup
export const generateScorm = async (request, response) => {
	const handleGenerationWithCleanup = withCleanup(cleanupScormResources)(executeScormGeneration)
	
	try {
		await handleGenerationWithCleanup(request, response)
	} catch (error) {
		logger.error('SCORM generation failed:', error)
		if (!response.headersSent) {
			response.status(400).render('index', { 
				error: error.message || 'Failed to generate SCORM package'
			})
		}
	}
}