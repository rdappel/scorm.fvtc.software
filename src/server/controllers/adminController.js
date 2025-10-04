// src/server/controllers/adminController.js
import { cleanupDistFiles, cleanupWorkDirectory } from '../utils/cleanup.js'
import { logger } from '../utils/logger.js'

export const performCleanup = async (_, response) => {
	try {
		logger.info('Manual cleanup initiated')
		
		const distCleanup = await cleanupDistFiles(24, 20)
		const workCleanup = await cleanupWorkDirectory()
		
		const result = {
			success: true,
			message: 'Cleanup completed successfully',
			details: {
				distFilesRemoved: distCleanup.filesRemoved || 0,
				workDirectoryCleaned: workCleanup.success || false
			}
		}
		
		logger.info('Cleanup completed:', result.details)
		response.json(result)
	} catch (error) {
		logger.error('Cleanup failed:', error)
		response.status(500).json({ 
			success: false, 
			error: error.message,
			message: 'Cleanup operation failed'
		})
	}
}