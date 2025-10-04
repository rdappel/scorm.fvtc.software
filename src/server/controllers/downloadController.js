// src/server/controllers/downloadController.js
import path from 'node:path'
import { logger } from '../utils/logger.js'
import { getDownloadPath } from '../services/fileService.js'

// Pure function for creating safe filename
const createSafeFilename = filePath => path.basename(filePath)

// Function for handling download errors
const handleDownloadError = (error, response) => {
	logger.error('Download controller error:', error)
	
	const statusCode = error.message === 'File not found' ? 404 : 400
	const message = error.message === 'File not found' 
		? 'File not found' 
		: error.message || 'Invalid request'
	
	response.status(statusCode).send(message)
}

// Function for handling file download with callback
const handleFileDownload = (response, filePath, safeFilename) => {
	response.download(filePath, safeFilename, (error) => {
		if (error) {
			logger.error('Download failed:', error)
			if (!response.headersSent) {
				response.status(500).send('Download failed')
			}
		} else {
			logger.info(`File downloaded successfully: ${safeFilename}`)
		}
	})
}

// Core download logic
const executeFileDownload = async (request, response) => {
	const filename = request.params.file
	const filePath = await getDownloadPath(filename)
	const safeFilename = createSafeFilename(filePath)
	
	handleFileDownload(response, filePath, safeFilename)
}

// Main controller function with error handling
export const downloadFile = async (request, response) => {
	try {
		await executeFileDownload(request, response)
	} catch (error) {
		handleDownloadError(error, response)
	}
}