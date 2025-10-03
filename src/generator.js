
import { join, resolve, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from 'fs-extra'
const { ensureDirSync, emptyDir, pathExists, copy, readFile, writeFile } = pkg
import ejs from 'ejs'
import { logger } from './server/utils/logger.js'
import { zipDir } from './server/utils/zipper.js'

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
		// For code practice objects, process templates in memory
		const codePracticeTemplate = join(__dirname, 'templates', 'code-practice')
		if (!(await pathExists(codePracticeTemplate))) {
			throw new Error(`Code practice template not found: ${codePracticeTemplate}`)
		}
		
		// Load and process index.html template in memory
		const indexTemplateContent = await readFile(join(codePracticeTemplate, 'index.html'), 'utf8')
		logger.info('Template loaded, processing with spec:', {
			courseTitle: spec.courseTitle,
			practiceTitle: spec.practiceTitle,
			language: spec.language,
			startingCodeLength: spec.startingCode ? spec.startingCode.length : 0
		})
		
		try {
			const processedIndexHtml = ejs.render(indexTemplateContent, { spec, Buffer })
			await writeFile(join(work, 'index.html'), processedIndexHtml)
		} catch (ejsError) {
			logger.error('EJS processing failed:', ejsError)
			throw new Error(`Failed to process code practice template: ${ejsError.message}`)
		}
		
		// Copy static assets (CSS and JS files) without modification
		await copy(join(codePracticeTemplate, 'styles'), join(work, 'styles'))
		await copy(join(codePracticeTemplate, 'scripts'), join(work, 'scripts'))
		
		// Copy SCORM API adapter (static file)
		await copy(join(tdir, 'api-adapter-1.2.js'), join(work, 'api-adapter-1.2.js'))
	} else if (spec.objectType === 'lesson') {
		// For lesson objects, process templates in memory and generate settings.json
		const lessonTemplate = join(__dirname, 'templates', 'lesson')
		if (!(await pathExists(lessonTemplate))) {
			throw new Error(`Lesson template not found: ${lessonTemplate}`)
		}
		
		// Load and process index.html template in memory
		const indexTemplateContent = await readFile(join(lessonTemplate, 'index.html'), 'utf8')
		logger.info('Template loaded, processing with spec:', {
			courseTitle: spec.courseTitle,
			lessonTitle: spec.lessonTitle,
			pageUrl: spec.pageUrl
		})
		
		try {
			const processedIndexHtml = ejs.render(indexTemplateContent, { spec, Buffer })
			await writeFile(join(work, 'index.html'), processedIndexHtml)
		} catch (ejsError) {
			logger.error('EJS processing failed:', ejsError)
			throw new Error(`Failed to process lesson template: ${ejsError.message}`)
		}
		
		// Generate settings.json for lesson configuration
		const settings = {
			pageUrl: spec.pageUrl || '',
			score: {
				scoreMethod: spec.scoreMethod || 'pageProgress',
				completionStatus: spec.completionStatus || 'pageProgress',
				videoCompletionPercent: spec.videoCompletionPercent || 95,
				maxScore: spec.maxScore || 100,
				minScore: spec.minScore || 0,
				passingScore: spec.passingScore || 70,
				roundScore: spec.roundScore !== false
			},
			tracking: {
				videoProgress: spec.trackVideoProgress !== false,
				pageProgress: spec.trackPageProgress !== false,
				hintOpenings: spec.trackHintOpenings !== false,
				solutionOpenings: spec.trackSolutionOpenings !== false
			},
			misc: {
				completionBar: spec.completionBar || 'pageProgress',
				disableContextMenu: spec.disableContextMenu !== false
			}
		}
		
		const settingsJson = JSON.stringify(settings, null, 2)
		await writeFile(join(work, 'settings.json'), settingsJson)
		
		// Copy lesson-specific scripts and styles
		await copy(join(lessonTemplate, 'scripts'), join(work, 'scripts'))
		await copy(join(lessonTemplate, 'styles'), join(work, 'styles'))
		
		// Copy SCORM API adapter (static file)
		await copy(join(tdir, 'api-adapter-1.2.js'), join(work, 'api-adapter-1.2.js'))
	} else {
		// Standard content handling for other object types
		const contentSrc = resolve(spec.contentPath || join(__dirname, '..', 'examples', 'content'))
		if (!(await pathExists(contentSrc))) {
			throw new Error(`contentPath not found: ${contentSrc}. Please provide a valid contentPath or upload a content ZIP file.`)
		}
		const contentDst = join(work, 'content')
		ensureDirSync(contentDst)
		await copy(contentSrc, contentDst)
		
		// Process launch page template in memory (for non-code-practice)
		const launchTemplateContent = await readFile(join(tdir, 'launch.ejs'), 'utf8')
		const launchFile = spec.launch || 'index.html'
		const processedLaunchHtml = ejs.render(launchTemplateContent, { spec })
		await writeFile(join(work, launchFile), processedLaunchHtml)
	}

	// 2) Process imsmanifest.xml template in memory
	const manifestTemplateContent = await readFile(join(tdir, 'imsmanifest.ejs'), 'utf8')
	const processedManifestXml = ejs.render(manifestTemplateContent, { spec })
	await writeFile(join(work, 'imsmanifest.xml'), processedManifestXml)

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