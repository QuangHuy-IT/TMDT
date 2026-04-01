import React, { createContext, useReducer } from 'react';

export const ShopContext = createContext();

const initialState = {
  cart: JSON.parse(localStorage.getItem('cart')) || [],
  isAuthenticated: localStorage.getItem('token') ? true : false,
  user: JSON.parse(localStorage.getItem('user')) || null,
  orders: JSON.parse(localStorage.getItem('orders')) || [
    { id: 'HD9421', date: '12/03/2026', total: 25900000, status: 'Đang giao', items: 2 },
  ],
};

const shopReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const actionId = action.payload.id || action.payload._id;
      const existingItem = state.cart.find(item => (item.id || item._id) === actionId);

      let updatedCart;
      if (existingItem) {
        updatedCart = state.cart.map(item =>
          (item.id || item._id) === actionId
            ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
            : item
        );
      } else {
        updatedCart = [...state.cart, { ...action.payload, quantity: action.payload.quantity || 1 }];
      }

      localStorage.setItem('cart', JSON.stringify(updatedCart)); // ← thiếu dòng này
      return { ...state, cart: updatedCart };                    // ← thiếu dòng này
    }

    case 'UPDATE_CART_QUANTITY': {
      const cartAfterUpdate = state.cart.map(item =>
        (item.id || item._id) === action.payload.id   // ← thêm fallback
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      localStorage.setItem('cart', JSON.stringify(cartAfterUpdate));
      return { ...state, cart: cartAfterUpdate };
    }

    case 'REMOVE_FROM_CART': {
      const cartAfterRemove = state.cart.filter(
        item => (item.id || item._id) !== action.payload  // ← thêm fallback
      );
      localStorage.setItem('cart', JSON.stringify(cartAfterRemove));
      return { ...state, cart: cartAfterRemove };
    }

    case 'CLEAR_CART':
      localStorage.removeItem('cart');
      return { ...state, cart: [] };

    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem('user', JSON.stringify(action.payload));
      return { ...state, isAuthenticated: true, user: action.payload };

    case 'LOGOUT':
      localStorage.clear();
      return { ...initialState, cart: [], isAuthenticated: false, user: null };

    case 'PLACE_ORDER': {
      // Sửa: Tạo đơn hàng mới từ cart hiện tại và lưu vào orders, sau đó xóa cart
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