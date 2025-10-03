
import { join, resolve, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from 'fs-extra'
const { ensureDirSync, emptyDir, pathExists, copy, readFile, writeFile } = pkg
import ejs from 'ejs'
import { logger } from './server/logger.js'
import { zipDir } from './server/zipper.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const generate = async ({ spec, outdir, tmpDir, zip = false }) => {
	// Determine SCORM version folder
	const versionFolder = spec.scormVersion === '1.2' ? 'scorm12' : 'scorm2004'
	const tdir = join(__dirname, 'templates', versionFolder)
	const work = resolve(tmpDir)

	ensureDirSync(work)
	await emptyDir(work)

	// 1) Handle content based on object type
	if (spec.objectType === 'code-practice') {
		// For code practice objects, process the template with EJS
		const codePracticeTemplate = join(__dirname, 'templates', 'code-practice')
		if (!(await pathExists(codePracticeTemplate))) {
			throw new Error(`Code practice template not found: ${codePracticeTemplate}`)
		}
		
		// Process index.html with EJS
		const indexTemplate = await readFile(join(codePracticeTemplate, 'index.html'), 'utf8')
		logger.info('Template loaded, processing with spec:', {
			courseTitle: spec.courseTitle,
			practiceTitle: spec.practiceTitle,
			language: spec.language,
			startingCodeLength: spec.startingCode ? spec.startingCode.length : 0
		})
		
		try {
			const indexHtml = ejs.render(indexTemplate, { spec, Buffer })
			await writeFile(join(work, 'index.html'), indexHtml)
		} catch (ejsError) {
			logger.error('EJS processing failed:', ejsError)
			throw new Error(`Failed to process code practice template: ${ejsError.message}`)
		}
		
		// Copy CSS and JS files as-is (they don't need EJS processing)
		await copy(join(codePracticeTemplate, 'styles'), join(work, 'styles'))
		await copy(join(codePracticeTemplate, 'scripts'), join(work, 'scripts'))
	} else {
		// Standard content handling for other object types
		const contentSrc = resolve(spec.contentPath || join(__dirname, '..', 'examples', 'content'))
		if (!(await pathExists(contentSrc))) {
			throw new Error(`contentPath not found: ${contentSrc}. Please provide a valid contentPath or upload a content ZIP file.`)
		}
		const contentDst = join(work, 'content')
		ensureDirSync(contentDst)
		await copy(contentSrc, contentDst)
	}

	// 2) render launch page (skip for code practice - template handles this)
	if (spec.objectType !== 'code-practice') {
		const launchTemplate = await readFile(join(tdir, 'launch.ejs'), 'utf8')
		const launchFile = spec.launch || 'index.html'
		const launchHtml = ejs.render(launchTemplate, { spec })
		await writeFile(join(work, launchFile), launchHtml)
	}

	// 3) render imsmanifest.xml
	const manifestTpl = await readFile(join(tdir, 'imsmanifest.ejs'), 'utf8')
	const manifestXml = ejs.render(manifestTpl, { spec })
	await writeFile(join(work, 'imsmanifest.xml'), manifestXml)

	// 4) sanity checks
	await assertManifestAssets({ work, spec })

	// 5) Create JSON export file for code practice objects
	if (spec.objectType === 'code-practice') {
		const exportData = {
			courseTitle: spec.courseTitle || '',
			practiceTitle: spec.practiceTitle || '',
			objectId: spec.identifier || '',
			language: spec.language || '',
			instructions: spec.instructionsMarkdown || spec.instructions || '', // Use markdown if available, fallback to HTML
			configCode: spec.configCode || '',
			startingCode: spec.startingCode || '',
			exportDate: new Date().toISOString(),
			version: '1.0'
		}
		
		const exportFilename = `${sanitize(spec.practiceTitle || 'code-practice')}-export.json`
		const exportJson = JSON.stringify(exportData, null, 2)
		await writeFile(join(work, exportFilename), exportJson)
		logger.info(`Created JSON export file: ${exportFilename}`)
	}

	// 6) zip or leave folder
	ensureDirSync(outdir)
	const baseFileName = sanitize(spec.identifier || spec.title || 'scorm-package')
	
	// Add timestamp to prevent filename conflicts when multiple users generate packages
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0]
	const fileBase = `${baseFileName}_${timestamp}`
	const outZipPath = join(outdir, `${fileBase}.zip`)


	if (zip) {
		await zipDir(work, outZipPath)
		logger.info(`Zipped -> ${outZipPath}`)
		return { scormVersion: versionFolder, zipPath: outZipPath, folder: work }
	}


	logger.info(`Built folder at ${work} (not zipped)`)
	return { scormVersion: versionFolder, zipPath: work, folder: work }
}


const sanitize = (s) => {
	return String(s).replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '').toLowerCase()
}


const assertManifestAssets = async ({ work, spec }) => {
	// Ensure launch exists (single SCO mode)
	const launchFile = spec.launch || 'index.html'
	const launchPath = join(work, launchFile)
	if (!(await pathExists(launchPath))) {
		throw new Error(`Launch file missing: ${launchFile} (looked for ${launchPath})`)
	}


	// If multi-SCO defined, verify each href exists under /content
	if (Array.isArray(spec.sco)) {
		for (const item of spec.sco) {
			if (!item || !item.href) continue
			const hrefPath = join(work, item.href)
			if (!(await pathExists(hrefPath))) {
				const rel = relative(work, hrefPath)
				throw new Error(`SCO href not found: ${item.href} (resolved ${rel}). Ensure it exists inside content/`)
			}
		}
	}
}