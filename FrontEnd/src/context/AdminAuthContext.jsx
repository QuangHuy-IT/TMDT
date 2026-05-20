import React, { createContext, useReducer } from 'react';

export const AdminAuthContext = createContext();

const normalizeUserRole = (user) => {
  if (!user) return user;
  return {
    ...user,
    role: typeof user.role === 'string' ? user.role.toLowerCase() : user.role,
  };
};

const initialState = {
  isAuthenticated: localStorage.getItem('adminToken') ? true : false,
  admin: JSON.parse(localStorage.getItem('admin')) || null,
  token: localStorage.getItem('adminToken') || null,
  refreshToken: localStorage.getItem('adminRefreshToken') || null,
  loading: false,
  error: null,
};

const adminAuthReducer = (state, action) => {
  switch (action.type) {
    case 'ADMIN_LOGIN_SUCCESS': {
      const { token, refreshToken, admin } = action.payload;
      const normalizedAdmin = normalizeUserRole(admin);
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminRefreshToken', refreshToken);
      localStorage.setItem('admin', JSON.stringify(normalizedAdmin));
      return {
        ...state,
        isAuthenticated: true,
        admin: normalizedAdmin,
        token,
        refreshToken,
        error: null,
        loading: false,
      };
    }

    case 'ADMIN_LOGOUT':
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('admin');
      return {
        ...state,
        isAuthenticated: false,
        admin: null,
        token: null,
        refreshToken: null,
        error: null,
      };

    case 'UPDATE_ADMIN': {
      const updatedAdmin = { ...state.admin, ...action.payload };
      localStorage.setItem('admin', JSON.stringify(updatedAdmin));
      return { ...state, admin: updatedAdmin };
    }

    case 'ADMIN_AUTH_LOADING':
      return { ...state, loading: true, error: null };

    case 'ADMIN_AUTH_ERROR':
      return { ...state, loading: false, error: action.payload };

    case 'REFRESH_TOKEN_SUCCESS': {
      const { token } = action.payload;
      localStorage.setItem('adminToken', token);
      return { ...state, token };
    }

    default:
      return state;
  }
};

export const AdminAuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(adminAuthReducer, initialState);

  return (
    <AdminAuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
