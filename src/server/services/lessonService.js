import { generate } from '../../generator.js'
import { validateSpec } from '../utils/validate.js'
import { logger } from '../utils/logger.js'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..', '..', '..')

// Pure function for sanitizing strings
const sanitizeString = str => 
	str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()

// Pure function for generating object IDs
const generateObjectId = (courseTitle, lessonTitle) => {
	const course = sanitizeString(courseTitle).substring(0, 10)
	const lesson = sanitizeString(lessonTitle).substring(0, 15)
	const timestamp = Date.now().toString().slice(-6)
	return `${course}_${lesson}_${timestamp}`
}

// Pure function for creating base spec
const createBaseSpec = (formData, objectId) => ({
	objectType: 'lesson',
	scormVersion: '1.2',
	identifier: objectId,
	title: formData.title,
	courseTitle: formData.courseTitle,
	lessonTitle: formData.title,
	pageUrl: formData.pageUrl
})

// Pure function for creating scoring configuration
const createScoringConfig = formData => ({
	scoreMethod: formData.scoreMethod || 'pageProgress',
	completionStatus: formData.completionStatus || 'pageProgress',
	passingScore: parseInt(formData.passingScore) || 70,
	maxScore: 100,
	minScore: 0,
	roundScore: true
})

// Pure function for creating tracking configuration  
const createTrackingConfig = () => ({
	trackVideoProgress: true,
	trackPageProgress: true,
	trackHintOpenings: true,
	trackSolutionOpenings: true
})

// Pure function for creating misc configuration
const createMiscConfig = formData => ({
	completionBar: formData.completionBar || 'pageProgress',
	disableContextMenu: formData.disableContextMenu === 'on',
	videoCompletionPercent: 95
})

// Pure function for building complete spec
const buildSpec = formData => {
	const objectId = generateObjectId(formData.courseTitle, formData.title)
	
	return {
		...createBaseSpec(formData, objectId),
		...createScoringConfig(formData),
		...createTrackingConfig(),
		...createMiscConfig(formData)
	}
}

// Pure function for creating generation options
const createGenerationOptions = spec => ({
	spec,
	outdir: join(__dirname, 'server', 'uploads'),
	tmpDir: join(__dirname, 'server', 'uploads', 'work'),
	zip: true
})

// Function for validating spec
const validateAndThrow = spec => {
	const validation = validateSpec(spec)
	if (!validation.valid) {
		throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
	}
	return spec
}

// Main lesson generation function
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

export const lessonService = {
	generateLessonScorm
}