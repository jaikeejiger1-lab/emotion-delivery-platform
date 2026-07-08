/**
 * productRoutes.js — Product Catalog & Inventory API Routes
 *
 * Public endpoints for retrieving products;
 * Admin-protected endpoints for creating, updating, and deleting products.
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const globalAuditMiddleware = require('../middleware/auditMiddleware');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// Public catalog routes
router.get('/', getProducts);
router.get('/:idOrSlug', getProductById);

// Protected Admin mutations
const adminOnly = [protect, requireRole('admin', 'superadmin'), globalAuditMiddleware];

router.post('/', ...adminOnly, createProduct);
router.put('/:id', ...adminOnly, updateProduct);
router.patch('/:id', ...adminOnly, updateProduct);
router.delete('/:id', ...adminOnly, deleteProduct);

module.exports = router;
