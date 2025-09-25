import archiver from 'archiver'
import { createWriteStream } from 'node:fs'

export const zipDir = async (sourceDir, outputPath) => {
	return new Promise((resolve, reject) => {
		const output = createWriteStream(outputPath)
		const archive = archiver('zip', { zlib: { level: 9 } })

		output.on('close', () => resolve(outputPath))
		archive.on('error', reject)

		archive.pipe(output)
		archive.directory(sourceDir, false)
		archive.finalize()
	})
}