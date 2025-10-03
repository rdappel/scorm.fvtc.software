// src/server/controllers/downloadController.js
import path from 'node:path'
import { logger } from '../utils/logger.js'
import { getDownloadPath } from '../services/fileService.js'

export const downloadFile = async (req, res) => {
	try {
		const filename = req.params.file
		const filePath = await getDownloadPath(filename)
		const safeFilename = path.basename(filePath)
		
		res.download(filePath, safeFilename, (err) => {
			if (err) {
				logger.error('Download failed:', err)
				if (!res.headersSent) {
					res.status(500).send('Download failed')
				}
			} else {
				logger.info(`File downloaded successfully: ${safeFilename}`)
			}
		})
	} catch (error) {
		logger.error('Download controller error:', error)
		
		if (error.message === 'File not found') {
			res.status(404).send('File not found')
		} else {
			res.status(400).send(error.message || 'Invalid request')
		}
	}
}