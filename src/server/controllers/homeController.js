// src/server/controllers/homeController.js
import { logger } from '../utils/logger.js'

export const getHome = (req, res) => {
	try {
		res.render('index')
	} catch (error) {
		logger.error('Error rendering home page:', error)
		res.status(500).render('error', { error: 'Internal server error' })
	}
}

export const getCodePractice = (req, res) => {
	try {
		res.render('code-practice')
	} catch (error) {
		logger.error('Error rendering code practice page:', error)
		res.status(500).render('error', { error: 'Internal server error' })
	}
}