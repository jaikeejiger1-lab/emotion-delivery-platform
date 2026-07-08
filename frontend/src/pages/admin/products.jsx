/**
 * /admin/products.jsx — Master Shop Inventory Control Panel
 *
 * Full CRUD operations on gift catalog inventory items.
 * Integrates dynamic filtering, search, modal editors, and compliance audit trail notifications.
 */
import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import useDebounce from '../../hooks/useDebounce';
import {
  FiBox, FiPlus, FiSearch, FiEdit2, FiTrash2, FiRefreshCw,
  FiCheckCircle, FiAlertCircle, FiDollarSign, FiTag, FiX
} from 'react-icons/fi';

const CATEGORY_OPTIONS = [
  'birthday', 'anniversary', 'proposal', 'wedding', 'corporate',
  'chocolates', 'flowers', 'plushies', 'perfumes', 'personalized', 'experiences', 'other'
];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'birthday',
    price: '',
    discountPrice: '',
    stock: 100,
    sku: '',
    image: '🎁',
    description: '',
    isFeatured: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 24 };
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await axiosClient.get('/products', { params });
      if (res.success || Array.isArray(res.data)) {
        setProducts(res.data || []);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err) {
      toast.error('Failed to load shop inventory catalog');
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'birthday',
      price: '',
      discountPrice: '',
      stock: 100,
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      image: '🎁',
      description: '',
      isFeatured: false,
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category || 'other',
      price: product.price || '',
      discountPrice: product.discountPrice || '',
      stock: product.stock !== undefined ? product.stock : 100,
      sku: product.sku || '',
      image: product.image || '🎁',
      description: product.description || '',
      isFeatured: Boolean(product.isFeatured),
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.description) {
      toast.error('Please complete all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
        stock: Number(formData.stock),
      };

      if (editingProduct) {
        const res = await axiosClient.put(`/products/${editingProduct._id}`, payload);
        if (res.success) {
          toast.success('Product updated & recorded in Audit Log');
          setShowModal(false);
          fetchProducts();
        }
      } else {
        const res = await axiosClient.post('/products', payload);
        if (res.success) {
          toast.success('New gift item created & catalog updated');
          setShowModal(false);
          fetchProducts();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from inventory?`)) return;

    try {
      const res = await axiosClient.delete(`/products/${id}`);
      if (res.success) {
        toast.success(`Removed "${name}" from inventory`);
        setProducts((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Shop Inventory Control — Aurora Admin</title>
      </Head>

      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-bold mb-2">
              <FiBox size={13} />
              <span>Catalog & Inventory Management</span>
            </div>
            <h1 className="font-display text-3xl font-extrabold text-white">Gift Catalog</h1>
            <p className="text-white/50 text-xs mt-1">Add, edit, pricing control, and live stock management</p>
          </div>
          
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} size={14} />
              <span>Refresh</span>
            </button>
            <button
              onClick={openAddModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-pink-600 hover:from-brand-600 hover:to-pink-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-brand-500/25 transition-all transform hover:scale-105"
            >
              <FiPlus size={16} />
              <span>Add New Gift Item</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#14142B] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input
              type="text"
              placeholder="Search by product name or tag..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-brand-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider mr-1 shrink-0">Category:</span>
            {['all', ...CATEGORY_OPTIONS.slice(0, 5)].map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategoryFilter(cat); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 capitalize ${
                  categoryFilter === cat
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 shadow-sm'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid / Table */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 rounded-3xl bg-white/5 border border-white/10" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-[#14142B] border border-white/10 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 text-white/40 flex items-center justify-center mx-auto text-3xl">
              🎁
            </div>
            <h3 className="font-display text-lg font-bold text-white">No Inventory Items Found</h3>
            <p className="text-white/50 text-xs">Try adjusting your category filter or click Add New Gift Item to populate the database.</p>
            <button
              onClick={openAddModal}
              className="px-5 py-2.5 rounded-xl bg-brand-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-brand-500/20"
            >
              <FiPlus /> Create First Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-[#14142B] border border-white/10 rounded-3xl p-5 flex flex-col justify-between hover:border-brand-500/40 transition-all group relative overflow-hidden backdrop-blur-xl"
              >
                {/* Top badges */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-extrabold text-white/80 uppercase tracking-wider">
                    {product.category}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    product.stock > 0
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>

                {/* Emoji/Image & Info */}
                <div className="text-center my-3">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-4xl shadow-inner group-hover:scale-110 transition-transform">
                    {product.image?.startsWith('http') ? (
                      <img src={product.image} alt={product.name} className="w-16 h-16 object-contain rounded-xl" />
                    ) : (
                      product.image || '🎁'
                    )}
                  </div>
                  <h3 className="font-display font-bold text-base text-white mt-3 line-clamp-1 group-hover:text-brand-300 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-white/50 text-[11px] line-clamp-2 mt-1 min-h-[32px]">
                    {product.description}
                  </p>
                </div>

                {/* Pricing & Actions */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-white font-display font-black text-lg">
                      ₹{(product.discountPrice || product.price).toLocaleString('en-IN')}
                    </span>
                    {product.discountPrice > 0 && (
                      <span className="text-white/40 line-through text-xs ml-2">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all border border-white/5"
                      title="Edit Item"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(product._id, product.name)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/20"
                      title="Delete Item"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white disabled:opacity-40 hover:bg-white/10 transition-all"
            >
              Previous
            </button>
            <span className="text-xs text-white/60 font-semibold px-2">
              Page {page} of {meta.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
              disabled={page === meta.pages}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white disabled:opacity-40 hover:bg-white/10 transition-all"
            >
              Next
            </button>
          </div>
        )}

        {/* Modal Dialog */}
        {showModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#14142B] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FiBox className="text-brand-400" size={18} />
                  <h2 className="font-display text-lg font-bold text-white">
                    {editingProduct ? 'Edit Inventory Item' : 'Add New Gift Item'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">Gift Item Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g., Luxury Chocolate & Truffle Hamper"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      className="w-full bg-[#0A0A14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 capitalize"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1">Stock Count *</label>
                    <input
                      type="number"
                      name="stock"
                      min="0"
                      required
                      value={formData.stock}
                      onChange={handleFormChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1">Regular Price (₹) *</label>
                    <input
                      type="number"
                      name="price"
                      min="0"
                      required
                      value={formData.price}
                      onChange={handleFormChange}
                      placeholder="e.g., 1499"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1">Discount Price (₹)</label>
                    <input
                      type="number"
                      name="discountPrice"
                      min="0"
                      value={formData.discountPrice}
                      onChange={handleFormChange}
                      placeholder="Optional sale price"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1">SKU Code</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleFormChange}
                      placeholder="e.g., SKU-10928"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1">Image Emoji or URL *</label>
                    <input
                      type="text"
                      name="image"
                      required
                      value={formData.image}
                      onChange={handleFormChange}
                      placeholder="🎁 or https://..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">Product Description *</label>
                  <textarea
                    name="description"
                    required
                    rows="3"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Handcrafted details, dimensions, aroma notes..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-brand-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleFormChange}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-brand-500 focus:ring-brand-500"
                  />
                  <label htmlFor="isFeatured" className="text-xs text-white/80 font-semibold cursor-pointer">
                    Feature on Homepage & Top Picks Banner
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-pink-600 hover:from-brand-600 hover:to-pink-700 text-white font-bold text-xs shadow-lg shadow-brand-500/30 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
