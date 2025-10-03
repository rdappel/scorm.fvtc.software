// src/server/routes/pageRoutes.js
import { Router } from 'express'
import { getHome, getCodePractice } from '../controllers/homeController.js'
import { getLesson } from '../controllers/lessonController.js'

const router = Router()

// Public page routes (no versioning needed)
router.get('/', getHome)
router.get('/code-practice', getCodePractice)
router.get('/lesson', getLesson)

export default router