
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { logger } from '../utils/logger.js'
import { 
	createScormSpec, 
	processContentZip, 
	generateScormPackage, 
	cleanupTempDir,
	cleanupTempProcessingDir
} from '../services/scormService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const getTempDir = dirname => path.join(dirname, '../temp')

const createLogData = (settings, hasFile) => ({
	objectType: settings.objectType,
	title: settings.title,
	identifier: settings.identifier,
	language: settings.language,
	hasUploadedContent: hasFile
})

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

const cleanupScormResources = async ({ temporaryExtractDirectory, workingDirectory }) => {
	await Promise.all([
		cleanupTempDir(temporaryExtractDirectory),
		cleanupTempProcessingDir(workingDirectory)
	])
}

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

	// 4) Extract filename and set headers for download
	const fileName = path.basename(buildInformation.zipPath)
	const headers = {
		'Content-Disposition': `attachment; filename="${fileName}"`,
		'Content-Type': 'application/zip'
	}
	
	Object.entries(headers).forEach(([key, value]) => 
		response.setHeader(key, value)
	)

	// 5) Send file for download
	response.download(buildInformation.zipPath, error => {
		if (error) {
			logger.error('Error sending SCORM file:', error)
			if (!response.headersSent) {
				response.status(500).send('Error downloading file')
			}
		}
	})

	logger.info('SCORM generation completed successfully:', {
		fileName: fileName,
		scormVersion: buildInformation.scormVersion
	})

	// Return resources for cleanup
	return {
		value: buildInformation,
		resources: {
			temporaryExtractDirectory,
			workingDirectory: getTempDir(__dirname)
		}
	}
}

export const generateScorm = async (request, response) => {
	const handleGenerationWithCleanup = withCleanup(cleanupScormResources)(executeScormGeneration)
	
	try {
		await handleGenerationWithCleanup(request, response)
	} catch (error) {
		logger.error('SCORM generation failed:', error)
		if (!response.headersSent) {
			response.status(400).json({ 
				error: error.message || 'Failed to generate SCORM package'
			})
		}
	}
}