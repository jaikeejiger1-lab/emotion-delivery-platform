/**
 * shop.jsx — Product Catalog & Shop Page
 */
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import useDebounce from '../hooks/useDebounce';
import { FiSearch, FiFilter, FiPlus, FiHeart, FiCheck } from 'react-icons/fi';

const FALLBACK_PRODUCTS = [
  { _id: 'p1', id: 'p1', name: 'Artisan Dark Chocolate Truffles', category: 'birthday', price: 799, image: '🍫', description: 'Handcrafted single-origin dark chocolate truffles in premium box.', rating: { average: 4.9, count: 847 }, tag: 'Bestseller' },
  { _id: 'p2', id: 'p2', name: 'Aromatherapy Soy Candle Set', category: 'anniversary', price: 1299, image: '🕯️', description: 'Lavender and sandalwood calming premium soy candles set of 3.', rating: { average: 4.8, count: 623 }, tag: 'Top Rated' },
  { _id: 'p3', id: 'p3', name: 'Premium Full-Grain Leather Wallet', category: 'corporate', price: 1999, image: '👜', description: 'Slim leather wallet with RFID protection and gift engraving option.', rating: { average: 4.7, count: 412 } },
  { _id: 'p4', id: 'p4', name: 'Preserved Eternal Red Rose Box', category: 'proposal', price: 2499, image: '🌹', description: 'Natural rose preserved to last up to 3 years in luxury velvet box.', rating: { average: 4.9, count: 1203 }, tag: 'Most Loved' },
  { _id: 'p5', id: 'p5', name: 'Personalized Silver Pendant', category: 'anniversary', price: 3499, image: '💎', description: 'Sterling silver pendant custom engraved with your initials and date.', rating: { average: 5.0, count: 389 }, tag: 'Premium' },
  { _id: 'p6', id: 'p6', name: 'Gourmet Tea and Infuser Gift Set', category: 'birthday', price: 950, image: '🍵', description: 'Six organic loose leaf teas with a handcrafted steel infuser.', rating: { average: 4.6, count: 291 } },
  { _id: 'p7', id: 'p7', name: 'Luxury Spa and Wellness Hamper', category: 'wedding', price: 3299, image: '🛁', description: 'Premium body scrub bath bombs face mask and aromatic oil set.', rating: { average: 4.8, count: 567 }, tag: 'New' },
  { _id: 'p8', id: 'p8', name: 'Couple Photo Memory Book', category: 'anniversary', price: 1799, image: '📸', description: 'Handcrafted photo album with custom messages between pages.', rating: { average: 4.9, count: 445 }, tag: 'Trending' },
];

const CATEGORIES = [
  { id: 'all', name: 'All Gifts' },
  { id: 'birthday', name: 'Birthday' },
  { id: 'anniversary', name: 'Anniversary' },
  { id: 'proposal', name: 'Proposal' },
  { id: 'wedding', name: 'Wedding' },
  { id: 'corporate', name: 'Corporate' },
];

export default function Shop() {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [wishlist, setWishlist] = useState([]);
  const { dispatch, items } = useCart();
  const router = useRouter();

  useEffect(() => {
    // Fetch real products from backend API
    const fetchProducts = async () => {
      try {
        const res = await axiosClient.get('/products');
        if (res.data && res.data.length > 0) {
          setProducts(res.data);
        }
      } catch (err) {
        console.warn('API /products unreachable, using fallback catalog');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        productId: product._id || product.id,
        name: product.name,
        image: product.image,
        price: product.price,
      },
    });
    toast.success(`${product.name} added to your gift box! 🎁`);
  };

  const toggleWishlist = (id) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter((w) => w !== id));
      toast('Removed from wishlist', { icon: '🗑️' });
    } else {
      setWishlist([...wishlist, id]);
      toast.success('Saved to wishlist ❤️');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesQuery = p.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-[#0D0D1A] dark:text-white transition-colors duration-300">
      <Head>
        <title>Shop Gift Catalog — Emotion Delivery Platform</title>
        <meta name="description" content="Browse handcrafted chocolates, candles, preserved roses, and personalized keepsakes." />
      </Head>

      <Navbar />

      <main className="flex-grow py-12 px-4 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-white mb-3">
            Handcrafted Gift Catalog
          </h1>
          <p className="text-white/50 text-sm max-w-xl mx-auto">
            Choose individual gifts to build your custom box or order them standalone. Every gift undergoes a strict 10-point quality audit.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 bg-white/[0.03] p-4 rounded-2xl border border-white/10">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scroll-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input
              type="text"
              placeholder="Search gifts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-80 rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] border border-white/10 rounded-3xl">
            <span className="text-4xl block mb-3">🔍</span>
            <p className="text-white font-bold text-lg">No gifts found</p>
            <p className="text-white/40 text-xs mt-1">Try adjusting your search query or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => {
              const pid = p._id || p.id;
              const inCart = items.some((i) => i.productId === pid);
              const isWish = wishlist.includes(pid);

              return (
                <div
                  key={pid}
                  className="group relative bg-white/[0.03] border border-white/10 hover:border-white/20 rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50"
                >
                  {/* Top Bar: Tag & Wishlist */}
                  <div className="flex items-center justify-between mb-4">
                    {p.tag ? (
                      <span className="px-2.5 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-[10px] font-bold text-brand-300 uppercase tracking-wider">
                        {p.tag}
                      </span>
                    ) : (
                      <span />
                    )}
                    <button
                      onClick={() => toggleWishlist(pid)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        isWish ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-white/40 hover:text-white'
                      }`}
                    >
                      <FiHeart size={15} className={isWish ? 'fill-pink-400' : ''} />
                    </button>
                  </div>

                  {/* Product Visual */}
                  <div className="text-center py-6 my-2 bg-white/[0.02] rounded-2xl group-hover:scale-105 transition-transform duration-300 relative">
                    {p.image?.startsWith('http') || p.image?.startsWith('/') ? (
                      <div className="relative h-28 w-full">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 25vw"
                          className="object-contain"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <span className="text-6xl">{p.image || '🎁'}</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mt-2">
                    <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-brand-300 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span className="font-bold text-lg text-white">
                        ₹{p.price.toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => handleAddToCart(p)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          inCart
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-gradient-to-r from-brand-500 to-purple-600 text-white hover:scale-105 shadow-lg shadow-brand-500/20'
                        }`}
                      >
                        {inCart ? (
                          <>
                            <FiCheck size={14} /> Added
                          </>
                        ) : (
                          <>
                            <FiPlus size={14} /> Add to Box
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
