
import path from 'node:path'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Pure function for creating directory paths
const createPaths = dirname => ({
	dist: path.join(dirname, '../../dist'),
	temp: path.join(dirname, '../temp')
})

// Helper functions
const isZipFile = filename => filename.endsWith('.zip')
const getFileAge = (now, mtime) => (now - mtime) / (1000 * 60 * 60)
const shouldDeleteFile = (maxAgeHours, maxFiles) => (file, index) =>
	getFileAge(new Date(), file.mtime) > maxAgeHours || index >= maxFiles
const sortByModTime = (a, b) => b.mtime - a.mtime

const withErrorHandling = fn => async (...args) => {
	try {
		return await fn(...args)
	} catch (error) {
		if (error.code !== 'ENOENT') throw error
		return null
	}
}

const getFileStats = dirPath => async files => {
	Promise.all(
		files.filter(isZipFile)
			.map(async file => {
				const filePath = path.join(dirPath, file)
				const stats = await fs.stat(filePath)
				return { name: file, path: filePath, mtime: stats.mtime }
			})
	)
}

const deleteFile = async file => {
	try {
		await fs.unlink(file.path)
		const ageHours = getFileAge(new Date(), file.mtime)
		console.log(`🗑️  Cleaned up old SCORM package: ${file.name} (${ageHours.toFixed(1)} hours old)`)
		return true
	} catch (error) {
		console.warn(`⚠️  Failed to delete ${file.name}:`, error.message)
		return false
	}
}

const processCleanup = (maxAgeHours, maxFiles) => async fileStats => {
	const sortedFiles = fileStats.sort(sortByModTime)
	const shouldDelete = shouldDeleteFile(maxAgeHours, maxFiles)
	
	const deletionResults = await Promise.all(
		sortedFiles.map(async (file, index) => 
			shouldDelete(file, index) ? await deleteFile(file) : false
		)
	)
	
	const deletedCount = deletionResults.filter(Boolean).length
	const keptCount = fileStats.length - deletedCount
	
	return { deletedCount, keptCount, totalFiles: fileStats.length }
}

// Function for logging cleanup results
const logCleanupResults = ({ deletedCount, keptCount, totalFiles }) => {
	if (deletedCount > 0) {
		console.log(`✅ Cleanup complete: ${deletedCount} files removed, ${keptCount} files kept`)
	} else {
		console.log(`✅ No cleanup needed: ${totalFiles} files within limits`)
	}
}

export const cleanupDistFiles = async (maxAgeHours = 24, maxFiles = 10) => {
	const paths = createPaths(__dirname)
	
	try {
		// Check if dist directory exists
		await fs.access(paths.dist)
		const files = await fs.readdir(paths.dist)
		
		if (files.length === 0) {
			console.log('📁 Dist directory is empty - no cleanup needed')
			return
		}
		
		// Process cleanup
		const getStats = getFileStats(paths.dist)
		const fileStats = await getStats(files)
		const cleanup = processCleanup(maxAgeHours, maxFiles)
		const results = await cleanup(fileStats)
		
		logCleanupResults(results)
		
	} catch (error) {
		if (error.code === 'ENOENT') {
			console.log('📁 Dist directory does not exist - no cleanup needed')
		} else {
			console.error('❌ Error during cleanup:', error.message)
		}
	}
}

export const cleanupTempDirectory = async () => {
	const paths = createPaths(__dirname)
	const safeFsRm = withErrorHandling(fs.rm)
	
	try {
		await fs.access(paths.temp)
		await safeFsRm(paths.temp, { recursive: true, force: true })
		console.log('🧹 Cleaned up temporary processing directory')
	} catch (error) {
		if (error.code !== 'ENOENT') {
			console.warn('⚠️  Failed to clean temp directory:', error.message)
		}
	}
}