
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const schema = JSON.parse(readFileSync(join(__dirname, 'schema', 'course.schema.json'), 'utf8'))

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(schema)


export const validateSpec = (spec) => {
	const ok = validate(spec)
	if (!ok) {
		const details = validate.errors.map(e => `${e.instancePath} ${e.message}`).join('\n')
		throw new Error(`Invalid course spec:\n${details}`)
	}
}