import React, { createContext, useReducer } from 'react';

export const ShopContext = createContext();

const initialState = {
  cart: JSON.parse(localStorage.getItem('cart')) || [],
  isAuthenticated: localStorage.getItem('token') ? true : false,
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  orders: JSON.parse(localStorage.getItem('orders')) || [
    { id: 'HD9421', date: '12/03/2026', total: 25900000, status: 'Đang giao', items: 2 },
  ],
  loading: false,
  error: null,
};

const shopReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItem = state.cart.find(item => item.id === action.payload.id);
      let updatedCart;
      if (existingItem) {
        updatedCart = state.cart.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
            : item
        );
      } else {
        updatedCart = [...state.cart, action.payload];
      }
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return { ...state, cart: updatedCart };
    }

    case 'UPDATE_CART_QUANTITY': {
      const cartAfterUpdate = state.cart.map(item =>
        item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
      );
      localStorage.setItem('cart', JSON.stringify(cartAfterUpdate));
      return { ...state, cart: cartAfterUpdate };
    }

    case 'REMOVE_FROM_CART': {
      const cartAfterRemove = state.cart.filter(item => item.id !== action.payload);
      localStorage.setItem('cart', JSON.stringify(cartAfterRemove));
      return { ...state, cart: cartAfterRemove };
    }

    case 'CLEAR_CART':
      localStorage.removeItem('cart');
      return { ...state, cart: [] };

    // Xử lý authentication actions
    case 'LOGIN_SUCCESS': {
      const { token, refreshToken, user } = action.payload;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      return {
        ...state,
        isAuthenticated: true,
        user,
        token,
        refreshToken,
        error: null,
        loading: false,
      };
    }

    case 'REGISTER_SUCCESS': {
      const { token, refreshToken, user } = action.payload;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      return {
        ...state,
        isAuthenticated: true,
        user,
        token,
        refreshToken,
        error: null,
        loading: false,
      };
    }

    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('cart');
      return {
        ...state,
        cart: [],
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        error: null,
      };

    case 'UPDATE_USER': {
      const updatedUser = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { ...state, user: updatedUser };
    }

    case 'AUTH_LOADING':
      return { ...state, loading: true, error: null };

    case 'AUTH_ERROR':
      return { ...state, loading: false, error: action.payload };

    case 'REFRESH_TOKEN_SUCCESS': {
      const { token } = action.payload;
      localStorage.setItem('token', token);
      return { ...state, token };
    }

    case 'PLACE_ORDER': {
      const newOrder = {
        id: `HD${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleDateString('vi-VN'),
        total: action.payload.total,
        status: 'Đang chờ xử lý',
        items: state.cart.length,
      };
      const updatedOrders = [newOrder, ...state.orders];
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      localStorage.removeItem('cart');
      return { ...state, orders: updatedOrders, cart: [] };
    }

    default:
      return state;
  }
};

export const ShopProvider = ({ children }) => {
  const [state, dispatch] = useReducer(shopReducer, initialState);

  return (
    <ShopContext.Provider value={{ state, dispatch }}>
      {children}
    </ShopContext.Provider>
  );
};