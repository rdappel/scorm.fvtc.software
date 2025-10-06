
import dotenv from 'dotenv'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'url'
import routes from './routes/router.js'
import { cleanupDistFiles, cleanupTempDirectory } from './utils/cleanup.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const createPaths = __dirname => ({
	public: path.join(__dirname, '../../public')
})

const createMiddleware = paths => app => {
	app.use(express.urlencoded({ extended: true }))
	app.use(express.json())
	app.use('/public', express.static(paths.public))
	return app
}

const createRoutes = routes => app => {
	app.use('/', routes)
	return app
}

const getPort = () => process.env.PORT || 3000

const performStartupCleanup = async () => {
	// Keep max 10 files, delete files older than 12 hours
	await cleanupDistFiles(12, 10)
	await cleanupTempDirectory()
}

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
	createMiddleware(paths),
	createRoutes(routes)
].reduce((app, configFn) => configFn(app))

createServer(app, port)