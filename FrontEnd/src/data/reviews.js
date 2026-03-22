// src/data/reviews.js
// Lưu trữ đánh giá sản phẩm theo productId

export const reviews = [
  // ── iPhone 15 Pro Max ──────────────────────────────────────
  {
    _id: "rev001",
    productId: "65f1a2b3c4d5e6f7a8b9c001",
    userId: "65f1a2b3c4d5e6f7a8b9u002",
    userName: "Nguyễn Văn Hoàng",
    rating: 5,
    title: "Đỉnh của đỉnh!",
    comment: "Chip A17 Pro mượt mà không tưởng, camera chụp đêm cực nét. Thiết kế titan nhẹ hơn hẳn thế hệ trước. Rất xứng đáng với giá tiền.",
    helpful: 24,
    createdAt: "2026-03-15T08:00:00.000Z",
  },
  {
    _id: "rev002",
    productId: "65f1a2b3c4d5e6f7a8b9c001",
    userId: "65f1a2b3c4d5e6f7a8b9u003",
    userName: "Trần Thị Mai",
    rating: 5,
    title: "Ống kính telephoto 5x siêu đẳng",
    comment: "Mình đã dùng iPhone từ đời 12, lên 15 Pro Max thấy sự khác biệt rõ rệt. Zoom xa mà vẫn cực nét, chụp concert không cần đứng sát sân khấu nữa.",
    helpful: 18,
    createdAt: "2026-03-10T08:00:00.000Z",
  },
  {
    _id: "rev003",
    productId: "65f1a2b3c4d5e6f7a8b9c001",
    userId: "65f1a2b3c4d5e6f7a8b9u004",
    userName: "Lê Minh Tuấn",
    rating: 4,
    title: "Tốt nhưng pin hơi yếu",
    comment: "Sản phẩm tốt, giao hàng nhanh. Trừ 1 sao vì pin vẫn chưa cải thiện nhiều so với bản trước khi dùng nặng cả ngày.",
    helpful: 9,
    createdAt: "2026-03-05T08:00:00.000Z",
  },
  {
    _id: "rev004",
    productId: "65f1a2b3c4d5e6f7a8b9c001",
    userId: "65f1a2b3c4d5e6f7a8b9u005",
    userName: "Phạm Thu Hà",
    rating: 5,
    title: "Dynamic Island và USB-C quá tiện",
    comment: "Dynamic Island thực sự hữu ích hơn mình nghĩ. Cổng USB-C cuối cùng cũng có, chuyển file cực nhanh. Màu Natural Titanium rất sang.",
    helpful: 31,
    createdAt: "2026-02-28T08:00:00.000Z",
  },
  {
    _id: "rev005",
    productId: "65f1a2b3c4d5e6f7a8b9c001",
    userId: "65f1a2b3c4d5e6f7a8b9u002",
    userName: "Hoàng Đức Anh",
    rating: 5,
    title: "Xứng đáng flagship 2024",
    comment: "Mua cho vợ dùng, vợ mê luôn. Máy chụp ảnh đẹp, video quay ProRes cực đỉnh. Cả nhà đều hài lòng. Sẽ ủng hộ shop dài dài.",
    helpful: 14,
    createdAt: "2026-02-20T08:00:00.000Z",
  },

  // ── Samsung Galaxy S24 Ultra ────────────────────────────────
  {
    _id: "rev006",
    productId: "65f1a2b3c4d5e6f7a8b9c002",
    userId: "65f1a2b3c4d5e6f7a8b9u002",
    userName: "Hoàng Đức Anh",
    rating: 5,
    title: "Galaxy AI là tương lai",
    comment: "S Pen mới tích hợp Galaxy AI tóm tắt văn bản, dịch thời gian thực cực kỳ tiện cho công việc. Màn hình đẹp nhất từ trước đến nay.",
    helpful: 22,
    createdAt: "2026-03-16T08:00:00.000Z",
  },
  {
    _id: "rev007",
    productId: "65f1a2b3c4d5e6f7a8b9c002",
    userId: "65f1a2b3c4d5e6f7a8b9u003",
    userName: "Đỗ Minh Châu",
    rating: 4,
    title: "Camera khủng nhưng máy hơi nóng",
    comment: "Camera 200MP chụp rất chi tiết, zoom 100x ổn định hơn tưởng tượng. Máy hơi nóng khi chơi game nặng nhưng chấp nhận được.",
    helpful: 11,
    createdAt: "2026-03-12T08:00:00.000Z",
  },
  {
    _id: "rev008",
    productId: "65f1a2b3c4d5e6f7a8b9c002",
    userId: "65f1a2b3c4d5e6f7a8b9u004",
    userName: "Vũ Thùy Linh",
    rating: 5,
    title: "Pin trâu, sạc nhanh",
    comment: "Màn hình đẹp nhất từ trước đến nay mình từng dùng. Pin 5000mAh dùng cả ngày không lo hết, sạc 45W đầy trong 1 tiếng. Giá cao nhưng xứng đáng!",
    helpful: 17,
    createdAt: "2026-03-08T08:00:00.000Z",
  },

  // ── Xiaomi 14 Ultra ────────────────────────────────────────
  {
    _id: "rev009",
    productId: "65f1a2b3c4d5e6f7a8b9c003",
    userId: "65f1a2b3c4d5e6f7a8b9u002",
    userName: "Nguyễn Văn Hoàng",
    rating: 5,
    title: "Camera Leica đỉnh không kém gì máy ảnh",
    comment: "Cảm biến 1 inch chụp bokeh cực đẹp, màu sắc trung thực như Leica thật. Sạc 90W đầy pin trong 40 phút. Flagship killer thực sự.",
    helpful: 19,
    createdAt: "2026-03-14T08:00:00.000Z",
  },
  {
    _id: "rev010",
    productId: "65f1a2b3c4d5e6f7a8b9c003",
    userId: "65f1a2b3c4d5e6f7a8b9u003",
    userName: "Trần Thị Mai",
    rating: 4,
    title: "Hiệu năng tốt, HyperOS mượt",
    comment: "Snapdragon 8 Gen 3 mạnh không kém iPhone. HyperOS mới mượt hơn MIUI nhiều. Chỉ tiếc camera app hơi phức tạp với người mới dùng.",
    helpful: 8,
    createdAt: "2026-03-09T08:00:00.000Z",
  },

  // ── Google Pixel 8 Pro ─────────────────────────────────────
  {
    _id: "rev011",
    productId: "65f1a2b3c4d5e6f7a8b9c005",
    userId: "65f1a2b3c4d5e6f7a8b9u004",
    userName: "Lê Minh Tuấn",
    rating: 5,
    title: "Android thuần khiết, AI Gemini đỉnh",
    comment: "Dùng Pixel 8 Pro được 2 tháng, AI call screening chặn spam gọi rất hiệu quả. Camera Night Sight chụp đêm tốt nhất mình từng dùng trên Android.",
    helpful: 15,
    createdAt: "2026-03-13T08:00:00.000Z",
  },
  {
    _id: "rev012",
    productId: "65f1a2b3c4d5e6f7a8b9c005",
    userId: "65f1a2b3c4d5e6f7a8b9u002",
    userName: "Hoàng Đức Anh",
    rating: 4,
    title: "Cập nhật 7 năm là điểm cộng lớn",
    comment: "Google cam kết 7 năm update OS và bảo mật là lý do chính mình chọn Pixel. Chip Tensor G3 không phải nhanh nhất nhưng đủ dùng tốt.",
    helpful: 12,
    createdAt: "2026-03-07T08:00:00.000Z",
  },

  // ── Samsung Galaxy A54 ─────────────────────────────────────
  {
    _id: "rev013",
    productId: "65f1a2b3c4d5e6f7a8b9c013",
    userId: "65f1a2b3c4d5e6f7a8b9u003",
    userName: "Trần Thị Mai",
    rating: 4,
    title: "Tầm trung xuất sắc",
    comment: "Màn hình Super AMOLED 120Hz ở tầm giá này là quá ổn. Camera chụp ban ngày rất đẹp. Pin 5000mAh dùng 2 ngày thoải mái.",
    helpful: 26,
    createdAt: "2026-03-11T08:00:00.000Z",
  },
  {
    _id: "rev014",
    productId: "65f1a2b3c4d5e6f7a8b9c013",
    userId: "65f1a2b3c4d5e6f7a8b9u005",
    userName: "Phạm Thu Hà",
    rating: 5,
    title: "Mua cho mẹ dùng, mẹ rất thích",
    comment: "Giao diện One UI đơn giản, dễ dùng cho người lớn tuổi. Chữ to rõ, máy không lag, pin trâu. Sẽ giới thiệu cho bạn bè mua.",
    helpful: 33,
    createdAt: "2026-03-06T08:00:00.000Z",
  },
  {
    _id: "rev015",
    productId: "65f1a2b3c4d5e6f7a8b9c013",
    userId: "65f1a2b3c4d5e6f7a8b9u004",
    userName: "Lê Minh Tuấn",
    rating: 3,
    title: "Ổn nhưng sạc hơi chậm",
    comment: "Máy dùng ổn, thiết kế đẹp. Nhưng sạc 25W khá chậm so với đối thủ cùng giá. Ngoài ra không có gì đáng phàn nàn.",
    helpful: 7,
    createdAt: "2026-03-01T08:00:00.000Z",
  },

  // ── Redmi Note 13 Pro ──────────────────────────────────────
  {
    _id: "rev016",
    productId: "65f1a2b3c4d5e6f7a8b9c014",
    userId: "65f1a2b3c4d5e6f7a8b9u002",
    userName: "Nguyễn Văn Hoàng",
    rating: 5,
    title: "200MP ở giá 7 triệu là không tưởng",
    comment: "Camera 200MP chụp ban ngày siêu nét, crop ảnh mà vẫn rõ chi tiết. Màn hình AMOLED 120Hz mượt. Giá rẻ bất ngờ cho cấu hình này.",
    helpful: 41,
    createdAt: "2026-03-17T08:00:00.000Z",
  },
  {
    _id: "rev017",
    productId: "65f1a2b3c4d5e6f7a8b9c014",
    userId: "65f1a2b3c4d5e6f7a8b9u003",
    userName: "Trần Thị Mai",
    rating: 4,
    title: "Đáng mua nhất tầm 7 triệu",
    comment: "Dùng được 1 tháng, máy chạy mượt, không lag. MIUI hơi nhiều quảng cáo nhưng vô hiệu hóa được. Sạc 67W đầy pin trong 45 phút.",
    helpful: 28,
    createdAt: "2026-03-10T08:00:00.000Z",
  },
];

// Helper: lấy reviews theo productId
export const getReviewsByProductId = (productId) =>
  reviews.filter((r) => r.productId === productId);

// Helper: tính rating trung bình
export const getAvgRating = (productId) => {
  const list = getReviewsByProductId(productId);
  if (list.length === 0) return 0;
  return (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1);
};

// Helper: phân bổ sao [5,4,3,2,1]
export const getRatingDistribution = (productId) => {
  const list = getReviewsByProductId(productId);
  return [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: list.filter((r) => r.rating === star).length,
  }));
};