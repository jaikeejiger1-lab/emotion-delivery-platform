/**
 * StepProductSelect.jsx — Step 1
 *
 * Displays AI-recommended products (fetched from /api/recommendations).
 * User can add/remove items and adjust quantities.
 */

'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiMinus, FiStar, FiRefreshCw } from 'react-icons/fi';
import axiosClient from '../../api/axiosClient';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const StepProductSelect = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const { items, dispatch } = useCart();

  const categories = ['All', 'Food', 'Self-Care', 'Tech', 'Accessories', 'Memories', 'Decor'];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/recommendations', {
        params: { topN: 12 },
      });
      setProducts(res.data.recommendations || []);
    } catch {
      toast.error('Could not load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const filteredProducts = filter === 'All'
    ? products
    : products.filter((p) => p.category === filter);

  const getCartQty = (id) => items.find((i) => i.productId === id)?.quantity || 0;

  const handleAdd = (product) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { productId: product.id, name: product.name, image: product.image, price: product.price, category: product.category },
    });
    toast.success(`${product.name} added!`, { icon: '🎁', duration: 1500 });
  };

  const handleDecrement = (productId) => {
    const current = getCartQty(productId);
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity: current - 1 } });
  };

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white text-2xl font-bold font-display">Choose Your Gifts</h2>
          <p className="text-white/40 text-sm mt-1">
            {items.length > 0 ? `${items.length} selected` : 'AI-curated just for you'}
          </p>
        </div>
        <motion.button
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.4 }}
          onClick={fetchProducts}
          className="btn-ghost p-2"
          title="Refresh recommendations"
          id="refresh-recommendations"
        >
          <FiRefreshCw size={18} />
        </motion.button>
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            id={`filter-${cat}`}
            onClick={() => setFilter(cat)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              filter === cat
                ? 'bg-brand-500 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[480px] overflow-y-auto pr-1">
          <AnimatePresence>
            {filteredProducts.map((product, idx) => {
              const qty = getCartQty(product.id);
              const inCart = qty > 0;

              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  className={`relative rounded-2xl p-4 border transition-all duration-300 cursor-pointer group ${
                    inCart
                      ? 'border-brand-500/50 bg-brand-500/8'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  {/* In-cart indicator */}
                  {inCart && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center"
                    >
                      <span className="text-white text-xs font-bold">{qty}</span>
                    </motion.div>
                  )}

                  {/* Product image placeholder */}
                  <div className="w-full aspect-square rounded-xl mb-3 bg-gradient-to-br from-brand-500/15 to-purple-500/15 flex items-center justify-center text-4xl">
                    {product.category === 'Food' ? '🍫' :
                     product.category === 'Tech' ? '📱' :
                     product.category === 'Self-Care' ? '🧴' :
                     product.category === 'Jewellery' ? '💎' :
                     product.category === 'Memories' ? '📸' :
                     product.category === 'Decor' ? '🖼' :
                     product.category === 'Accessories' ? '👜' : '🎁'}
                  </div>

                  {/* Product info */}
                  <p className="text-white text-sm font-semibold leading-tight mb-1 line-clamp-2">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-1 mb-2">
                    <FiStar className="text-gold-400" size={11} fill="currentColor" />
                    <span className="text-gold-400 text-xs">{product.rating}</span>
                    <span className="text-white/30 text-xs ml-1">{product.category}</span>
                  </div>
                  <p className="text-white font-bold text-base mb-3">
                    ₹{product.price.toLocaleString('en-IN')}
                  </p>

                  {/* Add / Quantity controls */}
                  {!inCart ? (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAdd(product)}
                      id={`add-${product.id}`}
                      className="w-full py-2 rounded-xl bg-brand-500/20 text-brand-400 text-sm font-semibold
                                 hover:bg-brand-500 hover:text-white transition-all duration-200 flex items-center justify-center gap-1"
                    >
                      <FiPlus size={14} /> Add to Box
                    </motion.button>
                  ) : (
                    <div className="flex items-center justify-between bg-brand-500/20 rounded-xl overflow-hidden">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDecrement(product.id)}
                        id={`dec-${product.id}`}
                        className="px-3 py-2 text-brand-400 hover:bg-brand-500/30 transition-colors"
                      >
                        <FiMinus size={14} />
                      </motion.button>
                      <span className="text-white font-bold text-sm">{qty}</span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleAdd(product)}
                        id={`inc-${product.id}`}
                        className="px-3 py-2 text-brand-400 hover:bg-brand-500/30 transition-colors"
                      >
                        <FiPlus size={14} />
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Cart summary strip */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 pt-5 border-t border-white/8 flex items-center justify-between"
        >
          <div className="flex -space-x-2">
            {items.slice(0, 4).map((item, i) => (
              <div
                key={item.productId}
                className="w-8 h-8 rounded-full bg-gradient-brand border-2 border-dark-800 flex items-center justify-center text-xs"
                style={{ zIndex: 10 - i }}
              >
                🎁
              </div>
            ))}
            {items.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-dark-800 flex items-center justify-center text-white/60 text-xs">
                +{items.length - 4}
              </div>
            )}
          </div>
          <p className="text-white/60 text-sm">
            {items.length} gift{items.length > 1 ? 's' : ''} selected
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default StepProductSelect;
