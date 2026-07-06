/**
 * CheckoutPage.jsx
 *
 * Full checkout flow:
 * 1. Order summary (items, pricing breakdown)
 * 2. Delivery address form
 * 3. Delivery date + time slot picker
 * 4. Special delivery toggles (Secret Surprise, Anonymous Gift)
 * 5. Razorpay payment integration
 */

'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiClock, FiShield, FiEyeOff, FiGift, FiCheck, FiSearch, FiNavigation } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// ── Time slots ────────────────────────────────────────────────────
const TIME_SLOTS = [
  '08:00-10:00', '10:00-12:00', '12:00-14:00',
  '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00',
];

// ── Sub-component: Pricing Row ────────────────────────────────────
const PriceRow = ({ label, value, highlight = false, muted = false }) => (
  <div className={`flex items-center justify-between py-2 ${highlight ? 'border-t border-white/10 mt-2 pt-4' : ''}`}>
    <span className={muted ? 'text-white/40 text-sm' : 'text-white/70 text-sm'}>{label}</span>
    <span className={`font-semibold ${highlight ? 'text-white text-lg' : muted ? 'text-white/40 text-sm' : 'text-white text-sm'}`}>
      {value}
    </span>
  </div>
);

// ── Sub-component: Toggle Row ────────────────────────────────────
const ToggleRow = ({ id, icon: Icon, label, description, value, onChange, accentColor = 'brand' }) => (
  <motion.div
    whileHover={{ borderColor: 'rgba(232, 93, 154, 0.3)' }}
    className={`p-4 rounded-2xl border transition-all duration-300 ${
      value
        ? `border-${accentColor}-500/40 bg-${accentColor}-500/6`
        : 'border-white/[0.08] bg-white/[0.03]'
    }`}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          value ? `bg-${accentColor}-500/25 text-${accentColor}-400` : 'bg-white/[0.08] text-white/40'
        }`}>
          <Icon size={17} />
        </div>
        <div>
          <p className="text-white font-medium text-sm">{label}</p>
          <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        id={id}
        onClick={onChange}
        className={`toggle shrink-0 mt-0.5 ${value ? `bg-${accentColor}-500` : 'bg-white/10'}`}
      >
        <span className={`toggle-thumb ${value ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  </motion.div>
);

// ── Main component ────────────────────────────────────────────────
const CheckoutPage = () => {
  const {
    items, packaging, handwrittenLetter, videoMessage,
    secretSurpriseMode, anonymousGift, scheduledDelivery,
    pricing, dispatch, relationId,
  } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [address, setAddress] = useState({
    recipientName: '', phone: '', line1: '', line2: '',
    city: '', state: '', pincode: '',
  });
  const [processing, setProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState(false);
  const [pinning, setPinning] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey.startsWith('your_')) {
      setMapsError(true);
      return;
    }

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setMapsLoaded(true);
        initAutocomplete();
        return;
      }
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        return;
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => {
        setMapsLoaded(true);
        initAutocomplete();
      };
      script.onerror = () => setMapsError(true);
      document.body.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  const initAutocomplete = () => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode', 'establishment'],
      componentRestrictions: { country: 'in' },
    });
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      let line1 = '', city = '', state = '', pincode = '';
      place.address_components.forEach((comp) => {
        const types = comp.types;
        if (types.includes('street_number') || types.includes('route') || types.includes('sublocality') || types.includes('premise')) {
          line1 = line1 ? `${line1}, ${comp.long_name}` : comp.long_name;
        }
        if (types.includes('locality') || types.includes('administrative_area_level_2')) {
          city = comp.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          state = comp.long_name;
        }
        if (types.includes('postal_code')) {
          pincode = comp.long_name;
        }
      });

      if (!line1) line1 = place.name || place.formatted_address || '';
      setAddress((prev) => ({
        ...prev,
        line1: line1 || prev.line1,
        city: city || prev.city,
        state: state || prev.state,
        pincode: pincode || prev.pincode,
      }));
      toast.success('📍 Address details auto-populated!');
    });
  };

  const handlePinLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setPinning(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          if (window.google && window.google.maps && window.google.maps.Geocoder) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
              if (status === 'OK' && results[0]) {
                const place = results[0];
                let line1 = '', city = '', state = '', pincode = '';
                place.address_components.forEach((comp) => {
                  const types = comp.types;
                  if (types.includes('street_number') || types.includes('route') || types.includes('sublocality') || types.includes('premise')) {
                    line1 = line1 ? `${line1}, ${comp.long_name}` : comp.long_name;
                  }
                  if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                    city = comp.long_name;
                  }
                  if (types.includes('administrative_area_level_1')) {
                    state = comp.long_name;
                  }
                  if (types.includes('postal_code')) {
                    pincode = comp.long_name;
                  }
                });
                setAddress((prev) => ({
                  ...prev,
                  line1: line1 || place.formatted_address || prev.line1,
                  city: city || prev.city,
                  state: state || prev.state,
                  pincode: pincode || prev.pincode,
                }));
                toast.success('📍 Pinned current GPS coordinates and populated address!');
              } else {
                toast.success(`📍 Pinned GPS coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Please enter street address.`);
              }
              setPinning(false);
            });
          } else {
            toast.success(`📍 Captured GPS coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Please enter street details below.`);
            setPinning(false);
          }
        } catch (e) {
          toast.success('📍 Captured GPS location!');
          setPinning(false);
        }
      },
      (err) => {
        toast.error('Could not retrieve your location. Please allow GPS permission.');
        setPinning(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const isFormValid = () => {
    const { recipientName, phone, line1, city, state, pincode } = address;
    return (
      recipientName && phone && line1 && city && state && pincode &&
      scheduledDelivery.date && scheduledDelivery.timeSlot &&
      items.length > 0
    );
  };

  // ── Razorpay Payment Flow ────────────────────────────────────────
  const handlePayment = async () => {
    if (!isFormValid()) {
      toast.error('Please fill all required fields and select a delivery slot');
      return;
    }

    setProcessing(true);

    try {
      // Step 0: Dynamically load Razorpay SDK
      const loadScript = (src) => {
        return new Promise((resolve) => {
          if (document.querySelector(`script[src="${src}"]`) && window.Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = src;
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const isLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!isLoaded || !window.Razorpay) {
        toast.error('Razorpay SDK failed to load. Please check your internet connection.');
        setProcessing(false);
        return;
      }

      // Step 1: Create Razorpay order
      const rzpRes = await axiosClient.post('/payments/order', {
        amount: pricing.total * 100, // Convert to paise
        currency: 'INR',
      });

      const { razorpayOrderId, amount, keyId } = rzpRes.data;

      // Step 2: Open Razorpay checkout modal
      const options = {
        key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency: 'INR',
        name: 'Emotion Delivery',
        description: `Gift for ${address.recipientName}`,
        order_id: razorpayOrderId,
        prefill: {
          name: user?.firstName + ' ' + user?.lastName,
          email: user?.email,
          contact: user?.phone,
        },
        theme: { color: '#E85D9A' },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled', { icon: '❌' });
            setProcessing(false);
          },
        },

        // Step 3: On payment success, call our checkout API
        handler: async (response) => {
          try {
            const checkoutRes = await axiosClient.post('/payments/verify', {
              razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              items: items.map((i) => ({
                productId: i.productId, name: i.name, image: i.image,
                price: i.price, quantity: i.quantity, subtotal: i.subtotal,
              })),
              packaging,
              handwrittenLetter,
              videoMessage,
              secretSurpriseMode,
              anonymousGift,
              deliveryAddress: address,
              scheduledDelivery,
              pricing,
              relationId,
            });

            setOrderSuccess(checkoutRes.data);
            dispatch({ type: 'CLEAR_CART' });
            toast.success('🎁 Order placed! Your gift is being crafted.', { duration: 5000 });
          } catch (err) {
            toast.error(err?.response?.data?.message || 'Payment received but order creation failed. Contact support.');
          } finally {
            setProcessing(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Payment initialisation failed');
      setProcessing(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────
  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120 }}
          className="glass-card p-10 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-6"
          >
            <FiCheck size={36} className="text-green-400" />
          </motion.div>
          <h2 className="font-display text-3xl font-bold text-white mb-2">Order Placed! 🎉</h2>
          <p className="text-white/50 mb-6">
            Your gift is being crafted with love. You'll receive a confirmation on WhatsApp & email.
          </p>
          <div className="glass-card p-4 text-left mb-6">
            <p className="text-white/40 text-xs mb-1">Order Number</p>
            <p className="text-brand-400 font-bold text-xl">{orderSuccess.orderNumber}</p>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-white/60">Payment Status:</span>
              <span className="text-green-400 font-bold bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">✅ Verified & Paid (MongoDB)</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/track/${orderSuccess.orderId}`)}
            className="btn-primary w-full mb-3"
            id="track-order-btn"
          >
            Track My Order 🗺
          </motion.button>
          <button onClick={() => router.push('/vault')} className="btn-ghost w-full">
            Back to Memory Vault
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Main checkout UI ──────────────────────────────────────────────
  return (
    <div className="min-h-screen py-12 px-4">

      {/* Load Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="section-title">Checkout</h1>
          <p className="section-subtitle">Almost there — just a few final details</p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">

          {/* ── LEFT: Forms ── */}
          <div className="space-y-6">

            {/* Delivery Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <h3 className="text-white font-bold text-lg mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FiMapPin className="text-brand-400" /> Delivery Address
                </span>
                <button
                  type="button"
                  onClick={handlePinLocation}
                  disabled={pinning}
                  className="text-xs bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Pin Current GPS Location"
                >
                  <FiNavigation className={pinning ? 'animate-spin' : ''} />
                  {pinning ? 'Pinning...' : 'Pin My Location'}
                </button>
              </h3>

              {/* Google Maps Autocomplete or Fallback Mode */}
              <div className="mb-5">
                {mapsError ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                    <span>📍 Manual Address Mode: Google Maps API key is not configured. Please enter your street details below.</span>
                  </div>
                ) : !mapsLoaded ? (
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-white/40 text-xs animate-pulse">
                    Loading Google Maps Address Autocomplete...
                  </div>
                ) : (
                  <div className="relative">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-400" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Search & Pin Address (Google Maps Autocomplete)..."
                      className="w-full bg-brand-500/10 border border-brand-500/40 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-brand-200/50 focus:border-brand-400 focus:bg-brand-500/15 transition-all outline-none font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Recipient Name *</label>
                  <input id="recipient-name" className="input-field" placeholder="Who receives this?" value={address.recipientName} onChange={(e) => setAddress({ ...address, recipientName: e.target.value })} />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Phone *</label>
                  <input id="recipient-phone" className="input-field" placeholder="+91 98765 43210" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="text-white/50 text-xs mb-1.5 block">Address Line 1 *</label>
                  <input id="address-line1" className="input-field" placeholder="House / Flat no., Street" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="text-white/50 text-xs mb-1.5 block">Address Line 2</label>
                  <input id="address-line2" className="input-field" placeholder="Landmark, Colony" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">City *</label>
                  <input id="city" className="input-field" placeholder="Mumbai" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">State *</label>
                  <input id="state" className="input-field" placeholder="Maharashtra" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Pincode *</label>
                  <input id="pincode" className="input-field" placeholder="400001" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
                </div>
              </div>
            </motion.div>

            {/* Delivery Scheduling */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                <FiClock className="text-brand-400" /> Schedule Delivery
              </h3>

              {/* Date picker */}
              <div className="mb-4">
                <label className="text-white/50 text-xs mb-1.5 block">Delivery Date *</label>
                <input
                  id="delivery-date"
                  type="date"
                  className="input-field"
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  value={scheduledDelivery.date || ''}
                  onChange={(e) => dispatch({ type: 'SET_DELIVERY', payload: { date: e.target.value } })}
                />
              </div>

              {/* Time slot grid */}
              <div>
                <label className="text-white/50 text-xs mb-2 block">Select Time Slot *</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <motion.button
                      key={slot}
                      id={`slot-${slot.replace(':', '-')}`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => dispatch({ type: 'SET_DELIVERY', payload: { timeSlot: slot } })}
                      className={`py-2 px-1 rounded-xl text-xs font-medium border transition-all duration-200 ${
                        scheduledDelivery.timeSlot === slot
                          ? 'bg-brand-500 border-brand-500 text-white shadow-[0_0_12px_rgba(232,93,154,0.4)]'
                          : 'bg-white/[0.03] border-white/10 text-white/60 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {slot}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Special Delivery Modes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                <FiGift className="text-brand-400" /> Special Delivery Options
              </h3>
              <div className="space-y-3">
                <ToggleRow
                  id="secret-surprise-toggle"
                  icon={FiShield}
                  label="Secret Surprise Mode"
                  description="Delivery agent will not reveal your identity. Perfect for surprise moments!"
                  value={secretSurpriseMode}
                  onChange={() => dispatch({ type: 'TOGGLE_SECRET_SURPRISE' })}
                />
                <ToggleRow
                  id="anonymous-gift-toggle"
                  icon={FiEyeOff}
                  label="Anonymous Gift"
                  description="Your name will not appear on the packing slip or any documents."
                  value={anonymousGift}
                  onChange={() => dispatch({ type: 'TOGGLE_ANONYMOUS' })}
                />
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT: Order summary + Pay ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-5"
          >
            {/* Order summary card */}
            <div className="glass-card p-6 sticky top-6">
              <h3 className="text-white font-bold text-lg mb-5">Order Summary</h3>

              {/* Items */}
              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center text-xl shrink-0">
                      🎁
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.name}</p>
                      <p className="text-white/40 text-xs">×{item.quantity}</p>
                    </div>
                    <p className="text-white text-sm font-semibold shrink-0">
                      ₹{item.subtotal.toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add-ons */}
              {packaging.tier !== 'standard' && (
                <div className="text-xs text-white/40 mb-2 flex justify-between">
                  <span>📦 {packaging.tier} packaging</span>
                  <span>+₹{packaging.packagingPrice}</span>
                </div>
              )}
              {handwrittenLetter.enabled && (
                <div className="text-xs text-white/40 mb-2 flex justify-between">
                  <span>✍️ Handwritten letter</span>
                  <span>+₹{handwrittenLetter.price}</span>
                </div>
              )}
              {videoMessage.enabled && (
                <div className="text-xs text-white/40 mb-2 flex justify-between">
                  <span>🎥 Video QR</span>
                  <span>+₹{videoMessage.price}</span>
                </div>
              )}

              {/* Pricing */}
              <div className="border-t border-white/8 mt-3 pt-3 space-y-0.5">
                <PriceRow label="Subtotal" value={`₹${pricing.subtotal.toLocaleString('en-IN')}`} />
                <PriceRow label="Packaging" value={pricing.packagingFee === 0 ? 'Free' : `₹${pricing.packagingFee}`} muted />
                <PriceRow label="Delivery" value={`₹${pricing.deliveryFee}`} muted />
                <PriceRow label="GST (18%)" value={`₹${pricing.tax.toLocaleString('en-IN')}`} muted />
                <PriceRow label="Total" value={`₹${pricing.total.toLocaleString('en-IN')}`} highlight />
              </div>

              {/* Special modes badges */}
              {(secretSurpriseMode || anonymousGift) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {secretSurpriseMode && <span className="badge-brand">🔒 Secret Surprise</span>}
                  {anonymousGift && <span className="badge-gold">👻 Anonymous</span>}
                </div>
              )}

              {/* Pay button */}
              <motion.button
                id="pay-now-btn"
                whileHover={{ scale: isFormValid() ? 1.02 : 1 }}
                whileTap={{ scale: isFormValid() ? 0.98 : 1 }}
                onClick={handlePayment}
                disabled={!isFormValid() || processing}
                className="btn-primary w-full mt-6 py-4 text-base disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Processing…
                  </>
                ) : (
                  <>
                    🔐 Pay ₹{pricing.total.toLocaleString('en-IN')} Securely
                  </>
                )}
              </motion.button>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-white/30 text-xs">
                  <FiShield size={12} />
                  <span>256-bit SSL</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="text-white/30 text-xs">Powered by Razorpay</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
