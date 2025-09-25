// src/server/routes.js
import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from 'fs-extra'
const { ensureDirSync, rm } = pkg
import { mkdtemp } from 'node:fs/promises'
import os from 'node:os'
import { generate } from '../generator.js'
import { validateSpec } from './validate.js'
import { logger } from './logger.js'
import sanitize from 'sanitize-filename'
import extract from 'extract-zip' // add: npm i extract-zip
import { cleanupDistFiles, cleanupWorkDirectory } from './cleanup.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

// Directories
const uploadsDir = path.join(__dirname, 'uploads')
const distDir = path.join(__dirname, '../../dist')
ensureDirSync(uploadsDir)
ensureDirSync(distDir)

// Multer for uploads (accept optional .zip with course content)
const upload = multer({
	dest: uploadsDir,
	limits: { fileSize: 200 * 1024 * 1024 } // 200MB
})

// Home
router.get('/', (req, res) => {
	res.render('index')
})

// Code Practice Form
router.get('/code-practice', (req, res) => {
	res.render('code-practice')
})

// Build handler
router.post('/generate', upload.single('contentZip'), async (req, res) => {
	let tempExtractDir = null
	try {
		let spec

		// Handle new wizard form data
		if (req.body.objectType === 'code-practice') {
			spec = {
				title: req.body.practiceTitle, // Use practice title as main title
				identifier: req.body.objectId,
				scormVersion: '1.2',
				launch: 'index.html',
				objectType: 'code-practice',
				courseTitle: req.body.courseTitle,
				practiceTitle: req.body.practiceTitle,
				language: req.body.language,
				instructions: req.body.instructions,
				startingCode: req.body.startingCode || '',
				configCode: req.body.configCode || '',
				metadata: {
					author: 'SCORM Generator',
					description: req.body.practiceTitle
				}
			}
			logger.info('Processing code practice object with spec:', {
				title: spec.title,
				courseTitle: spec.courseTitle,
				practiceTitle: spec.practiceTitle,
				language: spec.language,
				startingCodeExists: !!spec.startingCode,
				configCodeExists: !!spec.configCode
			})
		} else {
			// Handle legacy JSON format
			const specRaw = req.body.specJson?.trim()
			if (!specRaw) throw new Error('Missing spec JSON')
			spec = JSON.parse(specRaw)
		}

		validateSpec(spec)

		// 2) If a ZIP was uploaded, extract to a temp dir and point contentPath there
		if (req.file) {
			const isZip =
				(req.file.mimetype && req.file.mimetype.includes('zip')) ||
				req.file.originalname.toLowerCase().endsWith('.zip')

			if (!isZip) {
				throw new Error('Uploaded content must be a .zip')
			}

			tempExtractDir = await mkdtemp(path.join(os.tmpdir(), 'scorm-content-'))
			await extract(req.file.path, { dir: tempExtractDir })
			spec.contentPath = tempExtractDir
		}

		// 3) Generate package into dist/
		const buildInfo = await generate({
			spec,
			outdir: distDir,
			tmpDir: path.join(uploadsDir, 'work'),
			zip: true
		})

		// 4) Success view with download link
		const fileName = path.basename(buildInfo.zipPath)
		res.render('success', {
			buildInfo: {
				...buildInfo,
				fileName,
				downloadUrl: `/download/${encodeURIComponent(fileName)}`
			}
		})
	} catch (err) {
		logger.error(err)
		res.status(400).render('index', { error: err.message })
	} finally {
		// cleanup extracted temp dir, if used
		if (tempExtractDir) {
			await rm(tempExtractDir, { recursive: true, force: true })
		}
	}
})

// Download endpoint (serves from dist/)
router.get('/download/:file', (req, res) => {
	const safe = sanitize(req.params.file)
	const zipPath = path.join(distDir, safe)
	res.download(zipPath, safe, (err) => {
		if (err) {
			logger.error(err)
			res.status(404).send('File not found')
		}
	})
})

// Manual cleanup endpoint (optional - for admin use)
router.post('/cleanup', async (_, res) => {
	try {
		await cleanupDistFiles(24, 20)
		await cleanupWorkDirectory()
		res.json({ success: true, message: 'Cleanup completed successfully' })
	} catch (error) {
		logger.error('Cleanup failed:', error)
		res.status(500).json({ success: false, error: error.message })
	}
})

export default router
