import { promises as fs } from 'fs'
import path from 'node:path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Pure function for creating directory paths
const createPaths = __dirname => ({
	dist: path.join(__dirname, '../../dist'),
	work: path.join(__dirname, '../uploads/work')
})

// Pure function for filtering zip files
const isZipFile = filename => filename.endsWith('.zip')

// Pure function for calculating file age in hours
const getFileAge = (now, mtime) => (now - mtime) / (1000 * 60 * 60)

// Pure function for determining if file should be deleted
const shouldDeleteFile = (maxAgeHours, maxFiles) => (file, index) =>
	getFileAge(new Date(), file.mtime) > maxAgeHours || index >= maxFiles

// Pure function for sorting files by modification time (newest first)
const sortByModTime = (a, b) => b.mtime - a.mtime

// Higher-order function for async file operations with error handling
const withErrorHandling = fn => async (...args) => {
	try {
		return await fn(...args)
	} catch (error) {
		if (error.code !== 'ENOENT') {
			throw error
		}
		return null
	}
}

// Function for getting file stats
const getFileStats = dirPath => async files => 
	Promise.all(
		files
			.filter(isZipFile)
			.map(async file => {
				const filePath = path.join(dirPath, file)
				const stats = await fs.stat(filePath)
				return { name: file, path: filePath, mtime: stats.mtime }
			})
	)

// Function for deleting a single file
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

// Function for processing file cleanup
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

export const cleanupWorkDirectory = async () => {
	const paths = createPaths(__dirname)
	const safeFsRm = withErrorHandling(fs.rm)
	
	try {
		await fs.access(paths.work)
		await safeFsRm(paths.work, { recursive: true, force: true })
		console.log('🧹 Cleaned up temporary work directory')
	} catch (error) {
		if (error.code !== 'ENOENT') {
			console.warn('⚠️  Failed to clean work directory:', error.message)
		}
	}
}