/**
 * productController.js — Product Catalog & Inventory Management Controller
 *
 * Provides public catalog retrieval (filtering, search, pagination)
 * and role-protected admin inventory mutations (create, update, delete)
 * with automated compliance tracking in AuditLog.
 */
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');

// Helper to record audit logs
const createAuditLog = async ({ performedBy, action, targetCollection, targetId, oldState, newState, req, description }) => {
  try {
    await AuditLog.create({
      performedBy,
      action,
      targetCollection,
      targetId,
      oldState: oldState || null,
      newState: newState || null,
      ipAddress: req ? req.ip : '',
      userAgent: req ? req.get('user-agent') || '' : '',
      description: description || `${action} on ${targetCollection} (${targetId})`,
    });
  } catch (err) {
    console.error('Failed to write AuditLog in productController:', err);
  }
};

/**
 * GET /api/products
 * Retrieve products with search, category filtering, and sorting.
 */
exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, featured, inStock, minPrice, maxPrice, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };

    if (category && category !== 'all') {
      filter.category = category.toLowerCase();
    }
    if (featured === 'true') {
      filter.isFeatured = true;
    }
    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { description: regex }, { tags: regex }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: products,
      meta: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:idOrSlug
 * Retrieve single product by MongoDB ID or unique slug.
 */
exports.getProductById = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    let product;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(idOrSlug);
    }
    if (!product) {
      product = await Product.findOne({ slug: idOrSlug.toLowerCase() });
    }

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products
 * Create new inventory item (Admin only).
 */
exports.createProduct = async (req, res, next) => {
  try {
    const { name, slug, description, category, price, discountPrice, image, stock, sku, isFeatured, tags } = req.body;

    if (!name || !description || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name, description, and price are required' });
    }

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const product = await Product.create({
      name,
      slug: generatedSlug,
      description,
      category: category || 'other',
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      image: image || '🎁',
      stock: stock !== undefined ? Number(stock) : 100,
      sku: sku || `SKU-${Date.now()}`,
      isFeatured: Boolean(isFeatured),
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : [],
    });

    await createAuditLog({
      performedBy: req.user._id,
      action: 'CREATE_PRODUCT',
      targetCollection: 'Products',
      targetId: product._id,
      newState: product.toObject(),
      req,
      description: `Admin ${req.user.email} created product "${product.name}" (SKU: ${product.sku})`,
    });

    res.status(201).json({
      success: true,
      message: 'Product added to catalog successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/products/:id
 * Update existing inventory item (Admin only).
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const oldState = product.toObject();

    const allowedFields = ['name', 'slug', 'description', 'category', 'price', 'discountPrice', 'image', 'stock', 'sku', 'isActive', 'isFeatured', 'tags'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    await createAuditLog({
      performedBy: req.user._id,
      action: 'UPDATE_PRODUCT',
      targetCollection: 'Products',
      targetId: product._id,
      oldState,
      newState: product.toObject(),
      req,
      description: `Admin ${req.user.email} updated inventory item "${product.name}"`,
    });

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/products/:id
 * Delete product or mark inactive (Admin only).
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const oldState = product.toObject();
    await Product.findByIdAndDelete(req.params.id);

    await createAuditLog({
      performedBy: req.user._id,
      action: 'DELETE_PRODUCT',
      targetCollection: 'Products',
      targetId: product._id,
      oldState,
      req,
      description: `Admin ${req.user.email} deleted product "${product.name}"`,
    });

    res.json({
      success: true,
      message: 'Product removed from inventory',
    });
  } catch (error) {
    next(error);
  }
};
