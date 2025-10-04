import dotenv from 'dotenv'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'url'
import routes from './routes.js'
import { cleanupDistFiles, cleanupWorkDirectory } from './utils/cleanup.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Pure function for creating paths
const createPaths = __dirname => ({
	views: path.join(__dirname, '../../views'),
	public: path.join(__dirname, '../../public')
})

// Pure function for creating app configuration
const createAppConfig = paths => app => {
	app.set('view engine', 'ejs')
	app.set('views', paths.views)
	return app
}

// Pure function for creating middleware configuration
const createMiddleware = paths => app => {
	app.use(express.urlencoded({ extended: true }))
	app.use(express.json())
	app.use('/public', express.static(paths.public))
	return app
}

// Pure function for creating routes configuration
const createRoutes = routes => app => {
	app.use('/', routes)
	app.get('/monaco-test', (_, response) => {
		response.render('index')
	})
	return app
}

// Pure function for getting port
const getPort = () => process.env.PORT || 3007

// Function for performing startup cleanup
const performStartupCleanup = async () => {
	// Keep max 10 files, delete files older than 12 hours
	await cleanupDistFiles(12, 10)
	// Clean temporary build files
	await cleanupWorkDirectory()
}

// Function for creating server
const createServer = (app, port) => {
	app.listen(port, async () => {
		console.log(`scorm-gen UI listening on http://localhost:${port}`)
		await performStartupCleanup()
	})
}

// Application composition
dotenv.config()
const paths = createPaths(__dirname)
const port = getPort()

const app = [
	express(),
	createAppConfig(paths),
	createMiddleware(paths),
	createRoutes(routes)
].reduce((app, configFn) => configFn(app))

createServer(app, port)