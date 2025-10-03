// src/server/routes/apiRoutes.js
import { Router } from 'express'
import { upload } from '../middleware/upload.js'
import { generateScorm } from '../controllers/scormController.js'
import { downloadFile } from '../controllers/downloadController.js'

const router = Router()

// SCORM generation API
router.post('/generate', upload.single('contentZip'), generateScorm)

// File download API  
router.get('/download/:file', downloadFile)

export default router