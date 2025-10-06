
import { logger } from '../utils/logger.js'
import { cleanupDistFiles, cleanupTempDirectory } from '../utils/cleanup.js'

export const performCleanup = async (_, response) => {
	try {
		logger.info('Manual cleanup initiated')
		
		const distCleanup = await cleanupDistFiles(24, 20)
		const tempCleanup = await cleanupTempDirectory()
		
		const result = {
			success: true,
			message: 'Cleanup completed successfully',
			details: {
				distFilesRemoved: distCleanup.filesRemoved || 0,
				tempDirectoryCleaned: tempCleanup.success || false
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