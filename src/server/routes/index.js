// src/server/routes/index.js
import { Router } from 'express'
import pageRoutes from './pageRoutes.js'
import apiRoutes from './apiRoutes.js'
import adminRoutes from './adminRoutes.js'

const router = Router()

// Page routes (no versioning - public pages)
router.use('/', pageRoutes)

// API routes with versioning
router.use('/api/v1', apiRoutes)

// Admin routes with versioning (could be protected with auth middleware)
router.use('/api/v1/admin', adminRoutes)

export default router