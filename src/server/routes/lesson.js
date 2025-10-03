import express from 'express'
import { showLessonForm, generateLesson } from '../controllers/lessonController.js'

const router = express.Router()

router.get('/', showLessonForm)
router.post('/', generateLesson)

export { router as lessonRoutes }