// src/server/controllers/scormController.js
import path from 'node:path'
import { logger } from '../utils/logger.js'
import { 
	createScormSpec, 
	processContentZip, 
	generateScormPackage, 
	cleanupTempDir,
	cleanupWorkDir
} from '../services/scormService.js'

export const generateScorm = async (req, res) => {
	let tempExtractDir = null
	
	try {
		// 1) Create SCORM specification from form data
		const spec = createScormSpec(req.body)
		
		logger.info('Processing SCORM generation request:', {
			objectType: spec.objectType,
			title: spec.title,
			identifier: spec.identifier,
			language: spec.language,
			hasUploadedContent: !!req.file
		})

		// 2) Process uploaded content zip if provided
		if (req.file) {
			tempExtractDir = await processContentZip(req.file)
		}

		// 3) Generate SCORM package
		const buildInfo = await generateScormPackage(spec, tempExtractDir)

		// 4) Send success response with download link
		const fileName = path.basename(buildInfo.zipPath)
		res.render('success', {
			buildInfo: {
				...buildInfo,
				fileName,
				downloadUrl: `/api/v1/download/${encodeURIComponent(fileName)}`
			}
		})

		logger.info('SCORM generation completed successfully:', {
			fileName,
			scormVersion: buildInfo.scormVersion
		})

	} catch (error) {
		logger.error('SCORM generation failed:', error)
		res.status(400).render('index', { 
			error: error.message || 'Failed to generate SCORM package'
		})
	} finally {
		// Cleanup temporary files
		await cleanupTempDir(tempExtractDir)
		
		// Also cleanup work directory to prevent git conflicts
		const workDir = path.join(__dirname, '../uploads/work')
		await cleanupWorkDir(workDir)
	}
}