import { lessonService } from '../services/lessonService.js'
import { logger } from '../utils/logger.js'

export const getLesson = (req, res) => {
	res.render('lesson')
}

export const generateLesson = async (req, res) => {
	try {
		logger.info('Lesson generation request received:', req.body)
		
		const result = await lessonService.generateLessonScorm(req.body)
		
		logger.info('Lesson SCORM generated successfully:', {
			zipPath: result.zipPath,
			scormVersion: result.scormVersion
		})
		
		// Set headers for file download
		const filename = result.zipPath.split('/').pop() || 'lesson-scorm.zip'
		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
		res.setHeader('Content-Type', 'application/zip')
		
		// Send the file
		res.download(result.zipPath, (err) => {
			if (err) {
				logger.error('Error sending lesson SCORM file:', err)
				if (!res.headersSent) {
					res.status(500).send('Error downloading file')
				}
			}
		})
		
	} catch (error) {
		logger.error('Error generating lesson SCORM:', error)
		res.status(500).send(error.message)
	}
}