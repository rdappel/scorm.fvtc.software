// src/server/routes/index.js
// src/server/routes/router.js
// src/server/routes/router.js
// Main router coordinator - combines all route modules and sets up routing structure

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