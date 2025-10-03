// src/server/services/scormService.js
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from 'fs-extra'
const { ensureDirSync, rm } = pkg
import { mkdtemp } from 'node:fs/promises'
import os from 'node:os'
import extract from 'extract-zip'
import { generate } from '../../generator.js'
import { validateSpec } from '../utils/validate.js'
import { logger } from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Directories
const uploadsDir = path.join(__dirname, '../uploads')
const distDir = path.join(__dirname, '../../../dist')
ensureDirSync(uploadsDir)
ensureDirSync(distDir)

/**
 * Create a SCORM specification object from form data
 * @param {Object} formData - The form data from the request
 * @returns {Object} SCORM specification object
 */
export const createScormSpec = (formData) => {
	if (formData.objectType === 'code-practice') {
		return {
			title: formData.practiceTitle,
			identifier: formData.objectId,
			scormVersion: '1.2',
			launch: 'index.html',
			objectType: 'code-practice',
			courseTitle: formData.courseTitle,
			practiceTitle: formData.practiceTitle,
			language: formData.language,
			instructions: formData.instructions,
			instructionsMarkdown: formData.instructionsMarkdown || '',
			startingCode: formData.startingCode || '',
			configCode: formData.configCode || '',
			metadata: {
				author: 'SCORM Generator',
				description: formData.practiceTitle
			}
		}
	} else {
		// Handle legacy JSON format
		if (!formData.specJson?.trim()) {
			throw new Error('Missing spec JSON')
		}

		const spec = JSON.parse(formData.specJson)
		spec.scormVersion = spec.scormVersion || '1.2'
		return spec
	}
}

/**
 * Process uploaded content zip file
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} Path to extracted content
 */
export const processContentZip = async (file) => {
	if (!file) return null

	const isZip = file.mimetype === 'application/zip' ||
		file.originalname.toLowerCase().endsWith('.zip')

	if (!isZip) {
		throw new Error('Uploaded content must be a .zip')
	}

	const tempExtractDir = await mkdtemp(path.join(os.tmpdir(), 'scorm-content-'))
	await extract(file.path, { dir: tempExtractDir })
	
	return tempExtractDir
}

/**
 * Generate SCORM package
 * @param {Object} spec - SCORM specification object
 * @param {string} contentPath - Optional path to extracted content
 * @returns {Promise<Object>} Build information
 */
export const generateScormPackage = async (spec, contentPath = null) => {
	// Validate specification
	const validation = validateSpec(spec)
	if (!validation.valid) {
		throw new Error(`Invalid spec: ${validation.errors.join(', ')}`)
	}

	// Set content path if provided
	if (contentPath) {
		spec.contentPath = contentPath
	}

	// Generate package
	const buildInfo = await generate({
		spec,
		outdir: distDir,
		tmpDir: path.join(uploadsDir, 'work'),
		zip: true
	})

	logger.info('SCORM package generated successfully:', {
		title: spec.title,
		identifier: spec.identifier,
		zipPath: buildInfo.zipPath
	})

	return buildInfo
}

/**
 * Clean up temporary directories
 * @param {string} tempDir - Path to temporary directory to clean up
 * @returns {Promise<void>}
 */
export const cleanupTempDir = async (tempDir) => {
	if (tempDir) {
		try {
			await rm(tempDir, { recursive: true, force: true })
			logger.info('Cleaned up temporary directory:', tempDir)
		} catch (error) {
			logger.error('Failed to clean up temporary directory:', error)
		}
	}
}