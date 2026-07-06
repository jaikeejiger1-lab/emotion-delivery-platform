/**
 * CartContext.jsx
 *
 * Manages the gift box cart state (products, packaging, extras).
 * Persists cart in sessionStorage so it survives page refreshes
 * within the same tab.
 */

'use client';
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// ── Initial state ─────────────────────────────────────────────────
const initialState = {
  items: [],       // [{ productId, name, image, price, quantity, subtotal }]
  packaging: { tier: 'standard', color: 'kraft', ribbon: false, packagingPrice: 0 },
  handwrittenLetter: { enabled: false, message: '', fontStyle: 'cursive', price: 0 },
  videoMessage: { enabled: false, videoUrl: '', qrCodeUrl: '', price: 0 },
  secretSurpriseMode: false,
  anonymousGift: false,
  scheduledDelivery: { date: null, timeSlot: '' },
  relationId: null,
};

// ── Reducer ───────────────────────────────────────────────────────
const cartReducer = (state, action) => {
  switch (action.type) {

    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.productId === action.payload.productId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.payload.productId
              ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          { ...action.payload, quantity: 1, subtotal: action.payload.price },
        ],
      };
    }

    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.productId !== action.payload) };

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.productId !== productId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, quantity, subtotal: quantity * i.price } : i
        ),
      };
    }

    case 'SET_PACKAGING':
      return { ...state, packaging: { ...state.packaging, ...action.payload } };

    case 'SET_LETTER':
      return {
        ...state,
        handwrittenLetter: {
          ...state.handwrittenLetter,
          ...action.payload,
          price: action.payload.enabled ? 99 : 0,
        },
      };

    case 'SET_VIDEO_MESSAGE':
      return {
        ...state,
        videoMessage: {
          ...state.videoMessage,
          ...action.payload,
          price: action.payload.enabled ? 149 : 0,
        },
      };

    case 'TOGGLE_SECRET_SURPRISE':
      return { ...state, secretSurpriseMode: !state.secretSurpriseMode };

    case 'TOGGLE_ANONYMOUS':
      return { ...state, anonymousGift: !state.anonymousGift };

    case 'SET_DELIVERY':
      return { ...state, scheduledDelivery: { ...state.scheduledDelivery, ...action.payload } };

    case 'SET_RELATION':
      return { ...state, relationId: action.payload };

    case 'CLEAR_CART':
      return initialState;

    case 'HYDRATE':
      return action.payload;

    default:
      return state;
  }
};

// ── Context ───────────────────────────────────────────────────────
const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Persist to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('edp_cart', JSON.stringify(state));
  }, [state]);

  // Rehydrate on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('edp_cart');
    if (saved) {
      try {
        dispatch({ type: 'HYDRATE', payload: JSON.parse(saved) });
      } catch {}
    }
  }, []);

  // ── Computed totals ─────────────────────────────────────────────
  const subtotal = state.items.reduce((sum, i) => sum + i.subtotal, 0);
  const packagingFee = state.packaging.packagingPrice;
  const letterFee = state.handwrittenLetter.price;
  const videoFee = state.videoMessage.price;
  const deliveryFee = 99; // Fixed for MVP
  const tax = Math.round((subtotal + packagingFee + letterFee + videoFee) * 0.18);
  const total = subtotal + packagingFee + letterFee + videoFee + deliveryFee + tax;

  const pricing = { subtotal, packagingFee, letterFee, videoFee, deliveryFee, tax, total };

  return (
    <CartContext.Provider value={{ ...state, dispatch, pricing, itemCount: state.items.length }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
