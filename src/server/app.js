import dotenv from 'dotenv'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'url'
import routes from './routes.js'
import { cleanupDistFiles, cleanupWorkDirectory } from './cleanup.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()
const app = express()

// view engine
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '../../views'))

// middleware
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use('/public', express.static(path.join(__dirname, '../../public')))

// routes
app.use('/', routes)
app.get('/monaco-test', (req, res) => {
  res.render('index');
});

const port = process.env.PORT || 3007
app.listen(port, async () => {
	console.log(`scorm-gen UI listening on http://localhost:${port}`)
	
	// Clean up old files on server start
	await cleanupDistFiles(24, 20) // Keep max 20 files, delete files older than 24 hours
	await cleanupWorkDirectory() // Clean temporary build files
})