
import { join, resolve, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from 'fs-extra'
const { ensureDirSync, emptyDir, pathExists, copy, readFile, writeFile } = pkg
import ejs from 'ejs'
import { logger } from './server/utils/logger.js'
import { zipDir } from './server/utils/zipper.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Pure function for sanitizing strings
const sanitize = s => 
	String(s)
		.replace(/[^a-z0-9]+/gi, '-')
		.replace(/(^-|-$)/g, '')
		.toLowerCase()

// Pure function for determining SCORM version folder
const getVersionFolder = scormVersion => 
	scormVersion === '1.2' ? 'scorm12' : 'scorm2004'

// Pure function for generating timestamp
const createTimestamp = () => 
	new Date()
		.toISOString()
		.replace(/[:.]/g, '-')
		.replace('T', '_')
		.split('.')[0]

// Pure function for creating export data
const createExportData = settings => ({
	courseTitle: settings.courseTitle || '',
	practiceTitle: settings.practiceTitle || '',
	objectId: settings.identifier || '',
	language: settings.language || '',
	instructions: settings.instructionsMarkdown || settings.instructions || '',
	configCode: settings.configCode || '',
	startingCode: settings.startingCode || '',
	exportDate: new Date().toISOString(),
	version: '1.0'
})

// Pure function for creating lesson settings
const createLessonSettings = settings => ({
	pageUrl: settings.pageUrl || '',
	score: {
		scoreMethod: settings.scoreMethod || 'pageProgress',
		completionStatus: settings.completionStatus || 'pageProgress',
		videoCompletionPercent: settings.videoCompletionPercent || 95,
		maxScore: settings.maxScore || 100,
		minScore: settings.minScore || 0,
		passingScore: settings.passingScore || 70,
		roundScore: settings.roundScore !== false
	},
	tracking: {
		videoProgress: settings.trackVideoProgress !== false,
		pageProgress: settings.trackPageProgress !== false,
		hintOpenings: settings.trackHintOpenings !== false,
		solutionOpenings: settings.trackSolutionOpenings !== false
	},
	misc: {
		completionBar: settings.completionBar || 'pageProgress',
		disableContextMenu: settings.disableContextMenu !== false
	}
})

// Higher-order function for template processing
const processTemplate = templateContent => settings => 
	ejs.render(templateContent, { spec: settings, Buffer })

// Function for handling code practice generation
const generateCodePractice = async (settings, workingDirectory, templateDirectory) => {
	const codePracticeTemplate = join(__dirname, 'templates', 'code-practice')
	
	if (!(await pathExists(codePracticeTemplate))) {
		throw new Error(`Code practice template not found: ${codePracticeTemplate}`)
	}
	
	const indexTemplateContent = await readFile(join(codePracticeTemplate, 'index.html'), 'utf8')
	
	logger.info('Template loaded, processing with settings:', {
		courseTitle: settings.courseTitle,
		practiceTitle: settings.practiceTitle,
		language: settings.language,
		startingCodeLength: settings.startingCode ? settings.startingCode.length : 0
	})
	
	try {
		const processedIndexHtml = processTemplate(indexTemplateContent)(settings)
		await writeFile(join(workingDirectory, 'index.html'), processedIndexHtml)
	} catch (ejsError) {
		logger.error('EJS processing failed:', ejsError)
		throw new Error(`Failed to process code practice template: ${ejsError.message}`)
	}
	
	// Copy static assets
	await Promise.all([
		copy(join(codePracticeTemplate, 'styles'), join(workingDirectory, 'styles')),
		copy(join(codePracticeTemplate, 'scripts'), join(workingDirectory, 'scripts')),
		copy(join(templateDirectory, 'api-adapter-1.2.js'), join(workingDirectory, 'api-adapter-1.2.js'))
	])
}

// Function for handling lesson generation  
const generateLesson = async (settings, workingDirectory, templateDirectory) => {
	const lessonTemplate = join(__dirname, 'templates', 'lesson')
	
	if (!(await pathExists(lessonTemplate))) {
		throw new Error(`Lesson template not found: ${lessonTemplate}`)
	}
	
	const indexTemplateContent = await readFile(join(lessonTemplate, 'index.html'), 'utf8')
	
	logger.info('Template loaded, processing with settings:', {
		courseTitle: settings.courseTitle,
		lessonTitle: settings.lessonTitle,
		pageUrl: settings.pageUrl
	})
	
	try {
		const processedIndexHtml = processTemplate(indexTemplateContent)(settings)
		await writeFile(join(workingDirectory, 'index.html'), processedIndexHtml)
	} catch (ejsError) {
		logger.error('EJS processing failed:', ejsError)
		throw new Error(`Failed to process lesson template: ${ejsError.message}`)
	}
	
	// Generate settings.json
	const lessonSettings = createLessonSettings(settings)
	const settingsJson = JSON.stringify(lessonSettings, null, 2)
	await writeFile(join(workingDirectory, 'settings.json'), settingsJson)
	
	// Copy lesson assets
	await Promise.all([
		copy(join(lessonTemplate, 'scripts'), join(workingDirectory, 'scripts')),
		copy(join(templateDirectory, 'api-adapter-1.2.js'), join(workingDirectory, 'api-adapter-1.2.js'))
	])
}

// Function for handling standard content generation
const generateStandardContent = async (settings, workingDirectory, templateDirectory) => {
	const contentSourcePath = resolve(settings.contentPath || join(__dirname, '..', 'examples', 'content'))
	
	if (!(await pathExists(contentSourcePath))) {
		throw new Error(`contentPath not found: ${contentSourcePath}. Please provide a valid contentPath or upload a content ZIP file.`)
	}
	
	const contentDestinationPath = join(workingDirectory, 'content')
	ensureDirSync(contentDestinationPath)
	await copy(contentSourcePath, contentDestinationPath)
	
	// Process launch page template
	const launchTemplateContent = await readFile(join(templateDirectory, 'launch.ejs'), 'utf8')
	const launchFileName = settings.launch || 'index.html'
	const processedLaunchHtml = ejs.render(launchTemplateContent, { spec: settings })
	await writeFile(join(workingDirectory, launchFileName), processedLaunchHtml)
}

// Function for content generation based on object type
const generateContentByType = async (settings, workingDirectory, templateDirectory) => {
	const generators = {
		'code-practice': generateCodePractice,
		'lesson': generateLesson
	}
	
	const generator = generators[settings.objectType] || generateStandardContent
	await generator(settings, workingDirectory, templateDirectory)
}

// Function for creating export file
const createExportFile = async (settings, workingDirectory) => {
	if (settings.objectType !== 'code-practice') return
	
	const exportData = createExportData(settings)
	const exportFilename = `${sanitize(settings.practiceTitle || 'code-practice')}-export.json`
	const exportJson = JSON.stringify(exportData, null, 2)
	
	await writeFile(join(workingDirectory, exportFilename), exportJson)
	logger.info(`Created JSON export file: ${exportFilename}`)
}

// Function for asserting manifest assets
const assertManifestAssets = async ({ workingDirectory, settings }) => {
	const launchFileName = settings.launch || 'index.html'
	const launchFilePath = join(workingDirectory, launchFileName)
	
	if (!(await pathExists(launchFilePath))) {
		throw new Error(`Launch file missing: ${launchFileName} (looked for ${launchFilePath})`)
	}
	
	if (Array.isArray(settings.sco)) {
		const validationPromises = settings.sco
			.filter(item => item && item.href)
			.map(async item => {
				const hrefAbsolutePath = join(workingDirectory, item.href)
				if (!(await pathExists(hrefAbsolutePath))) {
					const relativePath = relative(workingDirectory, hrefAbsolutePath)
					throw new Error(`SCO href not found: ${item.href} (resolved ${relativePath}). Ensure it exists inside content/`)
				}
			})
		
		await Promise.all(validationPromises)
	}
}

// Main generator function
export const generate = async ({ spec: settings, outdir: outputDirectory, tmpDir: temporaryDirectory, zip = false }) => {
	const versionFolder = getVersionFolder(settings.scormVersion)
	const templateDirectory = join(__dirname, 'templates', versionFolder)
	const workingDirectory = resolve(temporaryDirectory)

	ensureDirSync(workingDirectory)
	await emptyDir(workingDirectory)

	// 1) Handle content based on object type
	await generateContentByType(settings, workingDirectory, templateDirectory)

	// 2) Process imsmanifest.xml template
	const manifestTemplateContent = await readFile(join(templateDirectory, 'imsmanifest.ejs'), 'utf8')
	const processedManifestXml = ejs.render(manifestTemplateContent, { spec: settings })
	await writeFile(join(workingDirectory, 'imsmanifest.xml'), processedManifestXml)

	// 3) Sanity checks
	await assertManifestAssets({ workingDirectory, settings })

	// 4) Create JSON export file for code practice objects
	await createExportFile(settings, workingDirectory)

	// 5) Zip or leave folder
	ensureDirSync(outputDirectory)
	const baseFileName = sanitize(settings.identifier || settings.title || 'scorm-package')
	const timestamp = createTimestamp()
	const packageName = `${baseFileName}_${timestamp}`
	const outputZipPath = join(outputDirectory, `${packageName}.zip`)

	if (zip) {
		await zipDir(workingDirectory, outputZipPath)
		logger.info(`Zipped -> ${outputZipPath}`)
		return { scormVersion: versionFolder, zipPath: outputZipPath, folder: workingDirectory }
	}

	logger.info(`Built folder at ${workingDirectory} (not zipped)`)
	return { scormVersion: versionFolder, zipPath: workingDirectory, folder: workingDirectory }
}