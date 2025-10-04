
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Pure function for creating schema path
const createSchemaPath = __dirname => 
	join(__dirname, '../config/schema', 'course.schema.json')

// Pure function for loading schema
const loadSchema = filePath => 
	JSON.parse(readFileSync(filePath, 'utf8'))

// Pure function for creating validator
const createValidator = schema => {
	const ajv = new Ajv({ allErrors: true, strict: false })
	addFormats(ajv)
	return ajv.compile(schema)
}

// Pure function for formatting validation errors
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