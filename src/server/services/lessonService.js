
import { generate } from '../../generator.js'
import { validateSpec } from '../utils/validate.js'
import { logger } from '../utils/logger.js'
import { sanitizeObjectId } from '../utils/stringUtils.js'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const createPaths = dirname => ({
	uploads: join(dirname, '../uploads'),
	dist: join(dirname, '../../../dist')
})

const paths = createPaths(__dirname)

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
	const objectId = sanitizeObjectId(formData.objectId)
	
	return {
		...createBaseSpec(formData, objectId),
		...createScoringConfig(formData),
		...createTrackingConfig(),
		...createMiscConfig(formData)
	}
}

const createGenerationOptions = spec => ({
	spec,
	outdir: paths.dist,
	tmpDir: join(paths.uploads, '../temp'),
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