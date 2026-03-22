import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShopContext } from '../../context/ShopContext';

const ProtectedRoute = ({ children, isAdmin = false }) => {
  const { state } = useContext(ShopContext);
  const location = useLocation();

  // Giả sử trong state của bạn có thông tin user
  const { user, isAuthenticated } = state;

  // 1. Kiểm tra xem đã đăng nhập chưa
  if (!isAuthenticated) {
    // Nếu chưa đăng nhập, điều hướng về trang Login
    // state={{ from: location }} giúp sau khi login xong có thể quay lại đúng trang đang định vào
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Nếu trang yêu cầu quyền Admin (dành cho các trang trong pages/admin)
  if (isAdmin && user?.role !== 'admin') {
    // Nếu không phải admin, đẩy về trang chủ hoặc trang báo lỗi 403
    return <Navigate to="/" replace />;
  }

  // 3. Nếu thỏa mãn mọi điều kiện, cho phép xem nội dung bên trong
  return children;
};

export default ProtectedRoute;