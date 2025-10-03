import { generate } from '../../generator.js'
import { validateSpec } from '../utils/validator.js'
import { logger } from '../utils/logger.js'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..', '..', '..')

const generateObjectId = (courseTitle, lessonTitle) => {
	const sanitize = (str) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
	const course = sanitize(courseTitle).substring(0, 10)
	const lesson = sanitize(lessonTitle).substring(0, 15)
	const timestamp = Date.now().toString().slice(-6)
	return `${course}_${lesson}_${timestamp}`
}

export const lessonService = {
	generateLessonScorm: async (formData) => {
		logger.info('Processing lesson SCORM generation request')
		
		// Generate object ID
		const objectId = generateObjectId(formData.courseTitle, formData.title)
		
		// Build the spec object
		const spec = {
			objectType: 'lesson',
			scormVersion: '1.2',
			identifier: objectId,
			title: formData.title,
			courseTitle: formData.courseTitle,
			lessonTitle: formData.title,
			pageUrl: formData.pageUrl,
			
			// Scoring configuration
			scoreMethod: formData.scoreMethod || 'pageProgress',
			completionStatus: formData.completionStatus || 'pageProgress',
			passingScore: parseInt(formData.passingScore) || 70,
			maxScore: 100,
			minScore: 0,
			roundScore: true,
			
			// Video configuration
			videoCompletionPercent: 95,
			
			// Tracking configuration
			trackVideoProgress: true,
			trackPageProgress: true,
			trackHintOpenings: true,
			trackSolutionOpenings: true,
			
			// Misc configuration
			completionBar: formData.completionBar || 'pageProgress',
			disableContextMenu: formData.disableContextMenu === 'on'
		}
		
		logger.info('Generated lesson spec:', spec)
		
		// Validate the spec
		const validation = validateSpec(spec)
		if (!validation.valid) {
			throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
		}
		
		// Generate the SCORM package
		const outdir = join(__dirname, 'server', 'uploads')
		const tmpDir = join(__dirname, 'server', 'uploads', 'work')
		
		const result = await generate({
			spec,
			outdir,
			tmpDir,
			zip: true
		})
		
		logger.info('Lesson SCORM generation completed:', result)
		return result
	}
}