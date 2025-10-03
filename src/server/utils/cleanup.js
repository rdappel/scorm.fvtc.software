import { promises as fs } from 'fs'
import path from 'node:path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function cleanupDistFiles(maxAgeHours = 24, maxFiles = 10) {
    const distDir = path.join(__dirname, '../../dist')
    
    try {
        // Check if dist directory exists
        await fs.access(distDir)
        const files = await fs.readdir(distDir)
        
        if (files.length === 0) {
            console.log('📁 Dist directory is empty - no cleanup needed')
            return
        }
        
        // Get file stats and sort by modification time (newest first)
        const fileStats = await Promise.all(
            files
                .filter(file => file.endsWith('.zip'))
                .map(async file => {
                    const filePath = path.join(distDir, file)
                    const stats = await fs.stat(filePath)
                    return { name: file, path: filePath, mtime: stats.mtime }
                })
        )
        
        fileStats.sort((a, b) => b.mtime - a.mtime)
        
        let deletedCount = 0
        const now = new Date()
        
        for (let i = 0; i < fileStats.length; i++) {
            const file = fileStats[i]
            const ageHours = (now - file.mtime) / (1000 * 60 * 60)
            
            // Delete if file is too old OR if we have too many files
            const shouldDelete = ageHours > maxAgeHours || i >= maxFiles
            
            if (shouldDelete) {
                try {
                    await fs.unlink(file.path)
                    console.log(`🗑️  Cleaned up old SCORM package: ${file.name} (${ageHours.toFixed(1)} hours old)`)
                    deletedCount++
                } catch (error) {
                    console.warn(`⚠️  Failed to delete ${file.name}:`, error.message)
                }
            }
        }
        
        if (deletedCount > 0) {
            console.log(`✅ Cleanup complete: ${deletedCount} files removed, ${fileStats.length - deletedCount} files kept`)
        } else {
            console.log(`✅ No cleanup needed: ${fileStats.length} files within limits`)
        }
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('📁 Dist directory does not exist - no cleanup needed')
        } else {
            console.error('❌ Error during cleanup:', error.message)
        }
    }
}


export async function cleanupWorkDirectory() {
    const workDir = path.join(__dirname, '../uploads/work')
    
    try {
        await fs.access(workDir)
        await fs.rm(workDir, { recursive: true, force: true })
        console.log('🧹 Cleaned up temporary work directory')
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.warn('⚠️  Failed to clean work directory:', error.message)
        }
    }
}