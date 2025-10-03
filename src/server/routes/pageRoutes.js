// src/server/routes/pageRoutes.js
import { Router } from 'express'
import { getHome, getCodePractice } from '../controllers/homeController.js'

const router = Router()

// Public page routes (no versioning needed)
router.get('/', getHome)
router.get('/code-practice', getCodePractice)

export default router