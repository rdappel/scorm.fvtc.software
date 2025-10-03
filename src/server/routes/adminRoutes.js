// src/server/routes/adminRoutes.js
import { Router } from 'express'
import { performCleanup } from '../controllers/adminController.js'

const router = Router()

// Administrative operations
router.post('/cleanup', performCleanup)

// Future admin routes can be added here:
// router.get('/stats', getSystemStats)
// router.get('/logs', getSystemLogs)

export default router