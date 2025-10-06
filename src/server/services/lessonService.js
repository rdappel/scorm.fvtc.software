
import { generate } from '../../generator.js'
import { validateSpec } from '../utils/validate.js'
import { logger } from '../utils/logger.js'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..', '..', '..')

// Helper functions
const sanitizeString = str => 
	(str || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()

const generateObjectId = (courseTitle, lessonTitle) => {
	const course = sanitizeString(courseTitle).substring(0, 10)
	const lesson = sanitizeString(lessonTitle).substring(0, 15)
	const timestamp = Date.now().toString().slice(-6)
	return `${course}_${lesson}_${timestamp}`
}

const createBaseSpec = (formData, objectId) => ({
	objectType: 'lesson',
	scormVersion: '1.2',
	identifier: objectId,
	title: formData.title,
	courseTitle: formData.courseTitle,
	lessonTitle: formData.title,
	pageUrl: formData.pageUrl
})

const createScoringConfig = formData => ({
	scoreMethod: formData.scoreMethod || 'pageProgress',
	completionStatus: formData.completionStatus || 'pageProgress',
	passingScore: parseInt(formData.passingScore) || 70,
	maxScore: 100,
	minScore: 0,
	roundScore: true
})
 
const createTrackingConfig = () => ({
	trackVideoProgress: true,
	trackPageProgress: true,
	trackHintOpenings: true,
	trackSolutionOpenings: true
})

const createMiscConfig = formData => ({
	completionBar: formData.completionBar || 'pageProgress',
	disableContextMenu: formData.disableContextMenu === 'on',
	videoCompletionPercent: 95
})

const buildSpec = formData => {
	const objectId = generateObjectId(formData.courseTitle, formData.title)
	
	return {
		...createBaseSpec(formData, objectId),
		...createScoringConfig(formData),
		...createTrackingConfig(),
		...createMiscConfig(formData)
	}
}

const createGenerationOptions = spec => ({
	spec,
	outdir: join(__dirname, 'server', 'uploads'),
	tmpDir: join(__dirname, 'server', 'uploads', 'work'),
	zip: true
})

const validateAndThrow = spec => {
	const validation = validateSpec(spec)
	if (!validation.valid) {
		throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
	}
	return spec
}

const generateLessonScorm = async formData => {
	logger.info('Processing lesson SCORM generation request')
	
	const spec = buildSpec(formData)
	logger.info('Generated lesson spec:', spec)
	
	const validatedSpec = validateAndThrow(spec)
	const options = createGenerationOptions(validatedSpec)
	const result = await generate(options)
	
	logger.info('Lesson SCORM generation completed:', result)
	return result
}

export const lessonService = { generateLessonScorm }