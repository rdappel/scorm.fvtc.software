import { lessonService } from '../services/lessonService.js'
import { logger } from '../utils/logger.js'

// Pure function for extracting filename from path
const extractFilename = zipPath => 
	zipPath.split('/').pop() || 'lesson-scorm.zip'

// Pure function for creating download headers
const createDownloadHeaders = filename => ({
	'Content-Disposition': `attachment; filename="${filename}"`,
	'Content-Type': 'application/zip'
})

// Function for setting response headers
const setHeaders = (res, headers) => 
	Object.entries(headers).forEach(([key, value]) => 
		res.setHeader(key, value)
	)

// Higher-order function for error handling
const withErrorHandling = fn => async (request, response) => {
	try {
		await fn(request, response)
	} catch (error) {
		logger.error(`Error in ${fn.name}:`, error)
		response.status(500).send(error.message)
	}
}

// Pure render function
export const getLesson = (_, response) => {
	response.render('lesson')
}

// Core lesson generation logic
const executeLessonGeneration = async (request, response) => {
	logger.info('Lesson generation request received:', request.body)
	
	const result = await lessonService.generateLessonScorm(request.body)
	
	logger.info('Lesson SCORM generated successfully:', {
		zipPath: result.zipPath,
		scormVersion: result.scormVersion
	})
	
	// Set headers and send file
	const filename = extractFilename(result.zipPath)
	const headers = createDownloadHeaders(filename)
	setHeaders(response, headers)
	
	// Send the file with error handling
	response.download(result.zipPath, (error) => {
		if (error) {
			logger.error('Error sending lesson SCORM file:', error)
			if (!response.headersSent) {
				response.status(500).send('Error downloading file')
			}
		}
	})
}

// Exported controller with error handling
export const generateLesson = withErrorHandling(executeLessonGeneration)