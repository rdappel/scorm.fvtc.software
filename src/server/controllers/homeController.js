// src/server/controllers/homeController.js
import { logger } from '../utils/logger.js'

export const getHome = (_, response) => {
	try {
		response.render('index')
	} catch (error) {
		logger.error('Error rendering home page:', error)
		response.status(500).render('error', { error: 'Internal server error' })
	}
}

export const getCodePractice = (_, response) => {
	try {
		response.render('code-practice')
	} catch (error) {
		logger.error('Error rendering code practice page:', error)
		response.status(500).render('error', { error: 'Internal server error' })
	}
}