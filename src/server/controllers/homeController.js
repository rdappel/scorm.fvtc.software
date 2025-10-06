
import { logger } from '../utils/logger.js'

export const getHome = (_, response) => {
	try {
		response.redirect('/public/index.html')
	} catch (error) {
		logger.error('Error serving home page:', error)
		response.status(500).send('Internal server error')
	}
}

export const getCodePractice = (_, response) => {
	try {
		response.redirect('/public/code-practice.html')
	} catch (error) {
		logger.error('Error serving code practice page:', error)
		response.status(500).send('Internal server error')
	}
}