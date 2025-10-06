
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Helper functions
const createSchemaPath = dirname => 
	join(dirname, '../config/schema', 'course.schema.json')

const loadSchema = filePath => 
	JSON.parse(readFileSync(filePath, 'utf8'))

const createValidator = schema => {
	const ajv = new Ajv({ allErrors: true, strict: false })
	addFormats(ajv)
	return ajv.compile(schema)
}

const formatErrors = errors => 
	errors.map(e => `${e.instancePath} ${e.message}`)

// Initialize validator
const schema = loadSchema(createSchemaPath(__dirname))
const validate = createValidator(schema)

export const validateSpec = spec => {
	const isValid = validate(spec)
	
	return isValid 
		? { valid: true, errors: [] }
		: { valid: false, errors: formatErrors(validate.errors) }
}