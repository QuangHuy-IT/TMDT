// src/data/users.js
// File lưu trữ tài khoản người dùng mẫu
// Trong production sẽ được thay bằng API call đến backend

export const users = [
  {
    _id: "65f1a2b3c4d5e6f7a8b9u001",
    name: "Admin HHShop",
    email: "admin@hhshop.vn",
    password: "admin123",
    role: "admin",
    status: "active",
    phone: "0901234567",
    avatar: null,
    address: {
      street: "Số 1, Hoàng Diệu",
      city: "Hà Nội",
      zipCode: "100000",
    },
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    _id: "65f1a2b3c4d5e6f7a8b9u002",
    name: "Nguyễn Văn Hoàng",
    email: "hoang@gmail.com",
    password: "123456",
    role: "user",
    status: "active",
    phone: "0987654321",
    avatar: null,
    address: {
      street: "Số 12, Cầu Giấy",
      city: "Hà Nội",
      zipCode: "100000",
    },
    createdAt: "2026-01-15T08:00:00.000Z",
  },
  {
    _id: "65f1a2b3c4d5e6f7a8b9u003",
    name: "Trần Thị Mai",
    email: "mai@gmail.com",
    password: "123456",
    role: "user",
    status: "active",
    phone: "0912345678",
    avatar: null,
    address: {
      street: "Số 34, Hoàn Kiếm",
      city: "Hà Nội",
      zipCode: "100000",
    },
    createdAt: "2026-02-01T08:00:00.000Z",
  },
  {
    _id: "65f1a2b3c4d5e6f7a8b9u004",
    name: "Lê Minh Tuấn",
    email: "tuan@gmail.com",
    password: "123456",
    role: "user",
    status: "active",
    phone: "0901234567",
    avatar: null,
    address: {
      street: "Số 56, Đống Đa",
      city: "Hà Nội",
      zipCode: "100000",
    },
    createdAt: "2026-02-10T08:00:00.000Z",
  },
  {
    _id: "65f1a2b3c4d5e6f7a8b9u005",
    name: "Phạm Thu Hà",
    email: "ha@gmail.com",
    password: "123456",
    role: "user",
    status: "blocked",
    phone: "0978654321",
    avatar: null,
    address: {
      street: "Số 78, Ba Đình",
      city: "Hà Nội",
      zipCode: "100000",
    },
    createdAt: "2026-02-15T08:00:00.000Z",
  },
];

// Hàm tìm user theo email + password (dùng cho Login mock)
export const findUserByCredentials = (email, password) => {
  return users.find(
    (u) => u.email === email && u.password === password && u.status === 'active'
  ) || null;
};