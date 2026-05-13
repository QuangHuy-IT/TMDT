import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const SectionTitle = ({ label, title }) => (
  <div className="mb-6">
    <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600">{label}</p>
    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
  </div>
);

const BadgeRow = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
    {[
      { icon: '🚚', text: 'Giao hàng tận nơi' },
      { icon: '⚡', text: 'Giao nhanh 1-2 giờ' },
      { icon: '💳', text: 'Thanh toán đa dạng' },
      { icon: '🔄', text: 'Đổi trả dễ dàng' },
    ].map((item) => (
      <div key={item.text} className="flex items-center gap-2 rounded-xl bg-slate-100 p-3">
        <span className="text-lg">{item.icon}</span>
        <p className="text-xs font-semibold text-slate-700">{item.text}</p>
      </div>
    ))}
  </div>
);

const InfoBox = ({ icon, title, children }) => (
  <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-lg">{icon}</div>
    <div>
      <h4 className="text-sm font-black text-slate-950">{title}</h4>
      <div className="mt-2 space-y-1 text-sm text-slate-500">{children}</div>
    </div>
  </div>
);

const TableRow = ({ cols, isHeader = false }) => (
  <tr className={isHeader ? 'bg-slate-100' : 'border-b border-slate-100'}>
    {cols.map((col, i) => (
      <td
        key={i}
        className={`px-4 py-3 text-xs ${
          isHeader ? 'font-black text-slate-700 uppercase tracking-wide' : 'text-slate-600'
        } ${i === 0 ? 'text-left' : 'text-center'}`}
      >
        {col}
      </td>
    ))}
  </tr>
);

export const ShippingPolicy = () => {
  useEffect(() => {
    document.title = 'Chính sách giao hàng - HHShop';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-slate-950 py-16 text-center">
        <p className="text-xs font-black uppercase tracking-[0.4em] text-red-400">HHShop</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Chính sách giao hàng</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
          Hướng dẫn mua hàng từ xa, thông tin giao nhận và thời gian vận chuyển trên toàn quốc.
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/" className="transition-colors hover:text-red-600">Trang chủ</Link>
            <span>/</span>
            <span className="text-red-600">Chính sách giao hàng</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 space-y-12">

        <BadgeRow />

        {/* I. Mua hàng từ xa */}
        <section>
          <SectionTitle label="Hướng dẫn" title="Mua hàng từ xa" />
          <p className="mb-6 text-base leading-relaxed text-slate-600">
            Khách hàng có thể đặt hàng online qua nhiều kênh: Website, Hotline, Chat trực tiếp trên Website, Facebook, Email. Đội ngũ tư vấn HHShop luôn sẵn sàng hỗ trợ 24/7.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: '🌐',
                title: 'Website',
                desc: 'Đặt hàng trực tiếp tại hhshop.vn mọi lúc mọi nơi.',
              },
              {
                icon: '📞',
                title: 'Hotline miễn phí',
                desc: 'Gọi 1800 6789 để được tư vấn và đặt hàng nhanh chóng.',
              },
              {
                icon: '💬',
                title: 'Chat trực tiếp',
                desc: 'Chat với tư vấn viên ngay trên Website để được hỗ trợ real-time.',
              },
              {
                icon: '📧',
                title: 'Email',
                desc: 'Gửi yêu cầu qua email để được phản hồi trong giờ làm việc.',
              },
            ].map((item) => (
              <InfoBox key={item.title} icon={item.icon} title={item.title}>
                <p>{item.desc}</p>
              </InfoBox>
            ))}
          </div>
        </section>

        {/* II. Phương thức thanh toán */}
        <section>
          <SectionTitle label="Thanh toán" title="Các hình thức thanh toán" />
          <div className="space-y-4">
            {[
              {
                icon: '🏠',
                title: 'Giao hàng & thanh toán tại nhà (COD)',
                desc: 'Nhận hàng rồi thanh toán trực tiếp cho nhân viên giao hàng. Áp dụng toàn quốc.',
              },
              {
                icon: '🏦',
                title: 'Chuyển khoản ngân hàng',
                desc: 'Thanh toán qua Internet Banking, ATM, hoặc quét mã VietQR — miễn phí, nhanh chóng, đối soát tự động.',
              },
              {
                icon: '💳',
                title: 'Thanh toán online qua cổng',
                desc: 'Hỗ trợ thẻ tín dụng, thẻ ghi nợ, ZaloPay, MoMo, VNPay, Kredivo, ShopeePay, Fundiin.',
              },
              {
                icon: '🏢',
                title: 'Mua hàng xuất hóa đơn VAT (công ty)',
                desc: 'Đơn hàng từ 5.000.000đ trở lên cần thanh toán không dùng tiền mặt: chuyển khoản từ tài khoản công ty hoặc thẻ tín dụng công ty.',
              },
              {
                icon: '📊',
                title: 'Mua hàng trả góp',
                desc: 'Trả góp online qua Alepay hoặc Onepay với hơn 20+ thẻ tín dụng. Trả góp trực tiếp tại cửa hàng qua các ngân hàng: VP Bank, VIB, VCB, MSB, BIDV, Shinhan, OCB, Home Credit...',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-950">{item.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* III. Phí vận chuyển */}
        <section>
          <SectionTitle label="Vận chuyển" title="Phí giao hàng" />
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  badge: 'Miễn phí',
                  title: 'Thành viên HHShop (Smember/SVip)',
                  desc: 'Miễn phí vận chuyển mọi đơn hàng.',
                },
                {
                  badge: 'Miễn phí',
                  title: 'Đơn hàng từ 300.000đ',
                  desc: 'Miễn phí giao hàng đối với khách lẻ.',
                },
                {
                  badge: '15.000đ',
                  title: 'Đơn hàng dưới 300.000đ',
                  desc: 'Phí giao hàng áp dụng cho khách chưa là thành viên.',
                },
                {
                  badge: 'Phụ thu',
                  title: 'Hàng cồng kềnh',
                  desc: 'Phụ thu phí cồng kềnh đối với đơn hàng vận chuyển bởi HHShop và đối tác 3PLs.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div>
                    <h4 className="text-sm font-black text-slate-950">{item.title}</h4>
                    <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-lg px-2 py-1 text-xs font-black ${
                      item.badge === 'Miễn phí'
                        ? 'bg-green-100 text-green-700'
                        : item.badge === '15.000đ'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-xs font-black uppercase tracking-wide text-slate-600">
                Hàng cồng kềnh — Xác định theo một trong các điều kiện sau:
              </h4>
              <ul className="mt-2 space-y-1">
                {[
                  'Khối lượng thực tế > 8kg',
                  'Khối lượng quy đổi > 10kg (D x R x C / 5000)',
                  'Cả 3 chiều có kích thước lớn hơn 35cm',
                  'Cả 2 chiều có kích thước lớn hơn 45cm',
                  'Chỉ cần một chiều có kích thước lớn hơn 50cm',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                    <span className="mt-0.5 font-black text-slate-400">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* IV. Thời gian giao nhận */}
        <section>
          <SectionTitle label="Thời gian" title="Dự kiến giao hàng theo khu vực" />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px]">
              <thead>
                <TableRow
                  cols={['Khu vực', 'Nội thành / Khoảng cách gần', 'Ngoại thành / Khoảng cách xa']}
                  isHeader
                />
              </thead>
              <tbody>
                <TableRow
                  cols={[
                    'TP. Hồ Chí Minh',
                    'Giao nhanh 1-2 giờ (bán kính ≤10km từ cửa hàng gần nhất)',
                    'Trong vòng 24-48 giờ',
                  ]}
                />
                <TableRow
                  cols={[
                    'Hà Nội',
                    'Giao nhanh 1-2 giờ (bán kính ≤10km, trừ huyện xa)',
                    'Trong vòng 24-48 giờ',
                  ]}
                />
                <TableRow
                  cols={[
                    'Tỉnh có cửa hàng HHShop',
                    'Trong vòng 24 giờ (khoảng cách ≤10km)',
                    'Trong vòng 1-2 ngày',
                  ]}
                />
                <TableRow
                  cols={[
                    'Các tỉnh thành còn lại',
                    'Trong vòng 2-5 ngày',
                    '—',
                  ]}
                />
                <TableRow
                  cols={[
                    'Hàng điện máy / Cồng kềnh',
                    'Giao & lắp đặt tận nơi (liên hệ xác nhận trước)',
                    '2-7 ngày tùy khu vực',
                  ]}
                />
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <h4 className="text-sm font-black text-blue-700">Lưu ý về thời gian giao hàng</h4>
            <ul className="mt-2 space-y-1">
              {[
                'Đơn hàng xác nhận trước 14h được giao trong ngày. Đơn hàng sau 14h tính sang ngày kế tiếp.',
                'Giờ giao nội thành HCM và Hà Nội: 8:00 - 20:00 hàng ngày.',
                'Ngoại thành và tỉnh thành khác: không giao vào Chủ nhật và ngày Lễ, Tết.',
                'Giao liên tỉnh qua đối tác 3PLs sẽ được liên hệ xác nhận trước khi giao.',
                'Hàng điện máy / cồng kềnh: thời gian lắp đặt sẽ được sắp xếp riêng.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-blue-700">
                  <span className="mt-0.5 font-black">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* V. Quy định khi nhận hàng */}
        <section>
          <SectionTitle label="Nhận hàng" title="Quy định khi giao & nhận hàng" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: '📦',
                title: 'Kiểm tra niêm phong',
                desc: 'Hộp hàng được niêm phong trước khi giao. Nếu hộp không còn nguyên vẹn, ẩm ướt, móp méo hoặc mất tem niêm phong — vui lòng từ chối nhận và liên hệ HHShop ngay.',
              },
              {
                icon: '🧾',
                title: 'Đơn hàng trên 10 triệu',
                desc: 'HHShop yêu cầu kiểm tra thẻ thanh toán và CCCD của chủ thẻ trước khi giao hàng nhằm hạn chế rủi ro gian lận.',
              },
              {
                icon: '🔐',
                title: 'Xác nhận OTP khi nhận',
                desc: 'Khách hàng nhận mã OTP qua tin nhắn cho đơn hàng thanh toán trước từ 2 triệu trở lên. Vui lòng cung cấp mã cho nhân viên giao hàng.',
              },
              {
                icon: '🎥',
                title: 'Quay video khi khui hàng',
                desc: 'Sau khi thanh toán, nên quay video quá trình khui hàng. Nếu phát hiện hỏng hóc hoặc bất thường, liên hệ hotline 1800 6789 ngay.',
              },
            ].map((item) => (
              <InfoBox key={item.title} icon={item.icon} title={item.title}>
                <p>{item.desc}</p>
              </InfoBox>
            ))}
          </div>
        </section>

        {/* VI. Hủy đơn & Hoàn tiền */}
        <section>
          <SectionTitle label="Hoàn tiền" title="Hủy đơn hàng & Thời gian hoàn tiền" />
          <div className="space-y-4">
            {[
              {
                method: '💵',
                title: 'Thanh toán tiền mặt',
                time: 'Hoàn ngay tại cửa hàng',
                color: 'bg-green-50',
                badgeColor: 'text-green-700',
              },
              {
                method: '🏦',
                title: 'Chuyển khoản ngân hàng',
                time: 'Trong vòng 03 ngày làm việc',
                color: 'bg-blue-50',
                badgeColor: 'text-blue-700',
              },
              {
                method: '💳',
                title: 'Thẻ ATM nội địa',
                time: '7 - 10 ngày làm việc',
                color: 'bg-orange-50',
                badgeColor: 'text-orange-700',
              },
              {
                method: '💳',
                title: 'Thẻ Visa / Mastercard / JCB',
                time: '7 - 15 ngày làm việc',
                color: 'bg-orange-50',
                badgeColor: 'text-orange-700',
              },
              {
                method: '📱',
                title: 'VNPay / Kredivo / MoMo / ShopeePay / ZaloPay / Fundiin',
                time: '3 - 8 ngày làm việc',
                color: 'bg-purple-50',
                badgeColor: 'text-purple-700',
              },
              {
                method: '🏪',
                title: 'Cổng thanh toán MPOS / Alepay / Onepay',
                time: '7 - 14 ngày làm việc',
                color: 'bg-slate-50',
                badgeColor: 'text-slate-700',
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`flex items-center justify-between gap-4 rounded-xl border border-slate-100 ${item.color} p-4`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.method}</span>
                  <span className="text-sm font-black text-slate-950">{item.title}</span>
                </div>
                <span className={`flex-shrink-0 rounded-lg px-3 py-1 text-xs font-black ${item.badgeColor}`}>
                  {item.time}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <h4 className="text-sm font-black text-amber-700">Lưu ý</h4>
            <ul className="mt-2 space-y-1">
              {[
                'Ngày làm việc = thứ 2 đến thứ 6 hàng tuần, không tính thứ 7, Chủ nhật và ngày Lễ, Tết.',
                'HHShop hoàn lại giá trị sản phẩm đã thanh toán. Phí vận chuyển, phụ phí và phí chuyển đổi trả góp (nếu có) không được hoàn lại.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                  <span className="mt-0.5 font-black">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* VII. Đổi mới */}
        <section>
          <SectionTitle label="Đổi mới" title="Chính sách đổi mới sản phẩm" />
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            {[
              {
                icon: '🔄',
                title: 'Đổi mới như tại cửa hàng',
                desc: 'Áp dụng chính sách đổi mới tương tự như khi mua trực tiếp tại cửa hàng HHShop.',
              },
              {
                icon: '📅',
                title: 'Thời hạn đổi mới',
                desc: 'Tính từ ngày khách hàng nhận máy, không quá 35 ngày kể từ ngày xuất bán.',
              },
              {
                icon: '📦',
                title: 'Đóng gói khi gửi đổi',
                desc: 'Khách hàng gửi máy đổi mới vui lòng đóng gói cẩn thận và liên hệ HHShop để được hỗ trợ xử lý.',
              },
              {
                icon: '🚫',
                title: 'Hàng hóa hỏng trong vận chuyển',
                desc: 'Các trường hợp thất thoát, hư hỏng sản phẩm trong quá trình vận chuyển sẽ không được hưởng chế độ đổi trả và bảo hành.',
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-950">{item.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* VIII. Liên hệ */}
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-center">
          <h3 className="text-xl font-black text-white">Cần hỗ trợ về giao hàng?</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Đội ngũ chăm sóc khách hàng HHShop luôn sẵn sàng hỗ trợ bạn 24/7.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/products"
              className="rounded-2xl bg-red-600 px-8 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-red-700"
            >
              Mua sắm ngay
            </Link>
            <Link
              to="/gioi-thieu"
              className="rounded-2xl border border-white/20 px-8 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:border-white/40"
            >
              Về HHShop
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};
