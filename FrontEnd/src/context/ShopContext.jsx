import React, { createContext, useReducer } from 'react';

export const ShopContext = createContext();

const normalizeUserRole = (user) => {
  if (!user) return user;
  return {
    ...user,
    role: typeof user.role === 'string' ? user.role.toLowerCase() : user.role,
  };
};

const initialState = {
  cart: (JSON.parse(localStorage.getItem('cart')) || []).map((item) => ({
    ...item,
    cartKey: String(item.cartKey || item.variantId || item.variantSlug || item.slug || item.id || item._id),
  })),
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
      const actionCartId = String(
        action.payload.cartKey
        || action.payload.variantId
        || action.payload.variantSlug
        || action.payload.slug
        || action.payload.id
        || action.payload._id
      );
      const existingItem = state.cart.find(item => String(
        item.cartKey
        || item.variantId
        || item.variantSlug
        || item.slug
        || item.id
        || item._id
      ) === actionCartId);

      let updatedCart;
      if (existingItem) {
        updatedCart = state.cart.map(item =>
          String(item.cartKey || item.variantId || item.variantSlug || item.slug || item.id || item._id) === actionCartId
            ? {
              ...item,
              ...action.payload,
              cartKey: actionCartId,
              quantity: item.quantity + (action.payload.quantity || 1),
            }
            : item
        );
      } else {
        updatedCart = [...state.cart, { ...action.payload, cartKey: actionCartId, quantity: action.payload.quantity || 1 }];
      }

      localStorage.setItem('cart', JSON.stringify(updatedCart)); // ← thiếu dòng này
      return { ...state, cart: updatedCart };                    // ← thiếu dòng này
    }

    case 'UPDATE_CART_QUANTITY': {
      const targetCartId = String(action.payload.cartKey || action.payload.id || action.payload._id);
      const cartAfterUpdate = state.cart.map(item =>
        String(item.cartKey || item.variantId || item.variantSlug || item.slug || item.id || item._id) === targetCartId
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      localStorage.setItem('cart', JSON.stringify(cartAfterUpdate));
      return { ...state, cart: cartAfterUpdate };
    }

    case 'REMOVE_FROM_CART': {
      const targetCartId = String(action.payload.cartKey || action.payload.id || action.payload._id || action.payload);
      const cartAfterRemove = state.cart.filter(
        item => String(item.cartKey || item.variantId || item.variantSlug || item.slug || item.id || item._id) !== targetCartId
      );
      localStorage.setItem('cart', JSON.stringify(cartAfterRemove));
      return { ...state, cart: cartAfterRemove };
    }

    case 'CLEAR_CART':
      localStorage.removeItem('cart');
      return { ...state, cart: [] };

    // Xử lý authentication actions
    case 'LOGIN_SUCCESS': {
      const { token, refreshToken, user } = action.payload;
      const normalizedUser = normalizeUserRole(user);
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      return {
        ...state,
        isAuthenticated: true,
        user: normalizedUser,
        token,
        refreshToken,
        error: null,
        loading: false,
      };
    }

    case 'REGISTER_SUCCESS': {
      const { token, refreshToken, user } = action.payload;
      const normalizedUser = normalizeUserRole(user);
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      return {
        ...state,
        isAuthenticated: true,
        user: normalizedUser,
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
      const nextUser = { ...state.user, ...action.payload };
      const updatedUser = {
        ...nextUser,
        avatarUrl: action.payload?.avatarUrl || state.user?.avatarUrl || nextUser.avatarUrl || null,
      };
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