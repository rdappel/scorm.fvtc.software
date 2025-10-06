
import { logger } from '../utils/logger.js'
import { lessonService } from '../services/lessonService.js'

const extractFilename = zipPath => 
	zipPath.split('/').pop() || 'lesson-scorm.zip'

const createDownloadHeaders = filename => ({
	'Content-Disposition': `attachment; filename="${filename}"`,
	'Content-Type': 'application/zip'
})

const setHeaders = (res, headers) => {
	Object.entries(headers).forEach(([key, value]) => 
		res.setHeader(key, value)
	)
}

const withErrorHandling = fn => async (request, response) => {
	try {
		await fn(request, response)
	} catch (error) {
		logger.error(`Error in ${fn.name}:`, error)
		response.status(500).send(error.message)
	}
}

export const getLesson = (_, response) => {
	response.redirect('/public/lesson.html')
}

const executeLessonGeneration = async (request, response) => {
	logger.info('Lesson generation request received:', request.body)
	
	const result = await lessonService.generateLessonScorm(request.body)
	
	logger.info('Lesson SCORM generated successfully:', {
		zipPath: result.zipPath,
		scormVersion: result.scormVersion
	})
	
	const filename = extractFilename(result.zipPath)
	const headers = createDownloadHeaders(filename)
	setHeaders(response, headers)
	
	response.download(result.zipPath, (error) => {
		if (error) {
			logger.error('Error sending lesson SCORM file:', error)
			if (!response.headersSent) {
				response.status(500).send('Error downloading file')
			}
		}
	})
}

export const generateLesson = withErrorHandling(executeLessonGeneration)