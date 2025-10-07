
import os from 'node:os'
import pkg from 'fs-extra'
import path from 'node:path'
import extract from 'extract-zip'
import { fileURLToPath } from 'node:url'
import { mkdtemp } from 'node:fs/promises'
import { logger } from '../utils/logger.js'
import { generate } from '../../generator.js'
import { validateSpec } from '../utils/validate.js'
import { sanitizeObjectId } from '../utils/stringUtils.js'

const { ensureDirSync, rm } = pkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const createPaths = dirname => ({
	uploads: path.join(dirname, '../uploads'),
	dist: path.join(dirname, '../../../dist')
})

const paths = createPaths(__dirname)
ensureDirSync(paths.uploads)
ensureDirSync(paths.dist)

const createCodePracticeSpec = formData => ({
	title: formData.practiceTitle,
	identifier: sanitizeObjectId(formData.objectId),
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
})

const createLegacySpec = formData => {
	if (!formData.specJson?.trim()) {
		throw new Error('Missing spec JSON')
	}
	
	const spec = JSON.parse(formData.specJson)
	return {
		...spec,
		scormVersion: spec.scormVersion || '1.2'
	}
}

const isZipFile = file => 
	file.mimetype === 'application/zip' || 
	file.originalname.toLowerCase().endsWith('.zip')

const validateFileType = file => {
	if (!isZipFile(file)) {
		throw new Error('Uploaded content must be a .zip')
	}
	return file
}

const createGenerationOptions = (spec, contentPath = null) => ({
	spec: contentPath ? { ...spec, contentPath } : spec,
	outdir: paths.dist,
	tmpDir: path.join(paths.uploads, '../temp'),
	zip: true
})

const withErrorHandling = fn => async (...args) => {
	try {
		return await fn(...args)
	} catch (error) {
		logger.error(`Error in ${fn.name}:`, error)
		throw error
	}
}

export const createScormSpec = formData => 
	formData.objectType === 'code-practice' 
		? createCodePracticeSpec(formData)
		: createLegacySpec(formData)

export const processContentZip = withErrorHandling(async file => {
	if (!file) return null
	
	const validatedFile = validateFileType(file)
	const temporaryExtractDirectory = await mkdtemp(path.join(os.tmpdir(), 'scorm-content-'))
	await extract(validatedFile.path, { dir: temporaryExtractDirectory })
	
	return temporaryExtractDirectory
})

export const generateScormPackage = withErrorHandling(async (spec, contentPath = null) => {
	// Validate specification
	const validation = validateSpec(spec)
	if (!validation.valid) {
		throw new Error(`Invalid spec: ${validation.errors.join(', ')}`)
	}

	// Generate package
	const options = createGenerationOptions(spec, contentPath)
	const buildInfo = await generate(options)

	logger.info('SCORM package generated successfully:', {
		title: spec.title,
		identifier: spec.identifier,
		zipPath: buildInfo.zipPath
	})

	return buildInfo
})

export const cleanupTempDir = withErrorHandling(async temporaryDirectory => {
	if (!temporaryDirectory) return
	
	await rm(temporaryDirectory, { recursive: true, force: true })
	logger.info('Cleaned up temporary directory:', temporaryDirectory)
})

export const cleanupTempProcessingDir = withErrorHandling(async tempDirectory => {
	const { emptyDir } = await import('fs-extra')
	await emptyDir(tempDirectory)
	logger.info('Cleaned up temp processing directory:', tempDirectory)
})