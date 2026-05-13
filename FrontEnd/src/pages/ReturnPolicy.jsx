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
      { icon: '🏆', text: 'Nhập khẩu, bảo hành chính hãng' },
      { icon: '🔄', text: 'Đổi trả dễ dàng' },
      { icon: '🚚', text: 'Giao hàng tận nơi' },
      { icon: '✅', text: 'Sản phẩm chất lượng' },
    ].map((item) => (
      <div key={item.text} className="flex items-center gap-2 rounded-xl bg-slate-100 p-3">
        <span className="text-lg">{item.icon}</span>
        <p className="text-xs font-semibold text-slate-700">{item.text}</p>
      </div>
    ))}
  </div>
);

const TableRow = ({ cols, isHeader = false }) => (
  <tr className={isHeader ? 'bg-slate-100' : 'border-b border-slate-100'}>
    {cols.map((col, i) => (
      <td key={i} className={`px-4 py-3 text-xs ${isHeader ? 'font-black text-slate-700 uppercase tracking-wide' : 'text-slate-600'} ${i === 0 ? 'text-left' : 'text-center'}`}>
        {col}
      </td>
    ))}
  </tr>
);

const PolicyCard = ({ title, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6">
    <h3 className="mb-4 text-base font-black text-slate-950">{title}</h3>
    {children}
  </div>
);

export const ReturnPolicy = () => {
  useEffect(() => {
    document.title = 'Chính sách đổi trả - HHShop';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-slate-950 py-16 text-center">
        <p className="text-xs font-black uppercase tracking-[0.4em] text-red-400">HHShop</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Chính sách đổi trả</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
          Quy định chi tiết về điều kiện, thời hạn và chính sách đổi trả sản phẩm tại HHShop.
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/" className="transition-colors hover:text-red-600">Trang chủ</Link>
            <span>/</span>
            <span className="text-red-600">Chính sách đổi trả</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 space-y-12">

        <BadgeRow />

        {/* I. Quy định chung */}
        <section>
          <SectionTitle label="Quy định chung" title="Điều kiện đổi trả sản phẩm" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: '✅', title: 'Đủ điều kiện đổi trả',
                desc: 'Sản phẩm chưa sử dụng hoặc đã sử dụng nhưng đảm bảo: Màn hình không trầy xước, đủ điều kiện bảo hành, đã đăng xuất khỏi tất cả tài khoản (iCloud, Google, Mi Account…).'
              },
              {
                icon: '🔧', title: 'Đủ điều kiện bảo hành',
                desc: 'Sản phẩm đủ điều kiện bảo hành theo chính sách của Hãng, được kết luận bởi nhà sản xuất hoặc trung tâm bảo hành chính hãng.'
              },
              {
                icon: '⚠️', title: 'Không đủ điều kiện bảo hành',
                desc: 'Sản phẩm nằm ngoài chính sách bảo hành, được Trung tâm bảo hành chính hãng kiểm tra và kết luận.'
              },
              {
                icon: '💰', title: 'Phí phát sinh',
                desc: 'Phí khấu hao, phí vỏ hộp, phí phụ kiện, phí trầy xước, phí hóa đơn công ty, giá trị quà tặng khuyến mãi đi kèm.'
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-lg">{item.icon}</div>
                <div>
                  <h4 className="text-sm font-black text-slate-950">{item.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-5">
            <h4 className="text-sm font-black text-orange-700">Lưu ý quan trọng</h4>
            <ul className="mt-3 space-y-2">
              {[
                'Sản phẩm có hạn bảo hành trên 365 ngày: Từ ngày 366 trở đi, HHShop hỗ trợ gửi máy đi bảo hành, không áp dụng đổi trả theo nhu cầu.',
                'Sản phẩm trả góp: Khách hàng phải Hủy/Tất toán hợp đồng trả góp trước khi đổi trả.',
                'Phụ kiện ốp lưng, bao da mua kèm máy: Hỗ trợ nhập trả lại phụ kiện trong trường hợp khách hàng trả hàng do lỗi NSX.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-orange-700">
                  <span className="mt-0.5 font-black">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* II. Chính sách đổi trả ICT */}
        <section>
          <SectionTitle label="ICT" title="Điện thoại, Máy tính bảng, Laptop, PC, Đồng hồ thông minh" />

          {/* Sản phẩm mới */}
          <PolicyCard title="📱 Sản phẩm mới (Điện thoại, MTBT, Laptop, PC, Đồng hồ)">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <TableRow cols={['Trường hợp', 'Thời gian', 'Chính sách', 'Phí khấu hao']} isHeader />
                </thead>
                <tbody>
                  <TableRow cols={['Lỗi nhà sản xuất', '0 – 30 ngày', '1 ĐỔI 1 sản phẩm cùng model, cùng màu, cùng dung lượng', '0%']} />
                  <TableRow cols={['Khách muốn trả sản phẩm', '0 – 30 ngày', 'HHShop kiểm tra và thông báo giá trị thu lại', '30% tháng đầu, +5%/tháng']} />
                  <TableRow cols={['Lỗi NSX', '31 – 365 ngày', 'Gửi bảo hành theo quy định hãng', 'N/A']} />
                  <TableRow cols={['Đổi trả theo nhu cầu', '0 – 365 ngày', 'Kiểm tra tình trạng, thông báo giá trị thu lại', '30% tháng đầu, +5%/tháng']} />
                  <TableRow cols={['Lỗi do người dùng', '0 – 365 ngày', 'Hỗ trợ gửi đi sửa chữa, khách trả phí', 'Phụ phí đổi trả khác']} />
                </tbody>
              </table>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-600">Phụ phí đổi trả khác</p>
              <ul className="mt-2 space-y-1">
                {[
                  'Trầy xước mức 1 (≤2 điểm, ≤0,5cm, vị trí khuất): 0%',
                  'Trầy xước mức 2 (vị trí dễ thấy): 10%',
                  'Trầy xước mức 3 (xước màn hình): Không áp dụng đổi trả',
                  'Phí vỏ hộp: 2% | Phí phụ kiện: 5%/món',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                    <span className="font-black text-slate-400">•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          </PolicyCard>

          {/* Sản phẩm cũ */}
          <PolicyCard title="📱 Sản phẩm cũ" className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <TableRow cols={['Trường hợp', 'Thời gian', 'Chính sách']} isHeader />
                </thead>
                <tbody>
                  <TableRow cols={['Lỗi nhà sản xuất', '0 – 30 ngày', '1 ĐỔI 1 sản phẩm tương đương (cùng model, cùng dung lượng, cùng thời gian BH). Không có sản phẩm tương đương → hoàn 100% tiền.']} />
                  <TableRow cols={['Thời gian bảo hành còn lại', 'Sau 30 ngày', 'Hỗ trợ gửi máy đi bảo hành theo chính sách hãng/HHShop.']} />
                  <TableRow cols={['Đổi trả theo nhu cầu', 'Mọi thời gian', 'Không áp dụng đổi trả hàng.']} />
                  <TableRow cols={['Lỗi do người dùng', 'Mọi thời gian', 'Hỗ trợ gửi đi sửa chữa, khách trả phí sửa.']} />
                </tbody>
              </table>
            </div>
          </PolicyCard>
        </section>

        {/* Phụ kiện */}
        <section>
          <SectionTitle label="Phụ kiện" title="Chính sách đổi trả phụ kiện" />
          <div className="space-y-4">
            {[
              {
                title: 'Thiết bị mạng, Ổ cứng di động, USB, Thẻ nhớ, Sạc, Cáp, Sạc dự phòng, Chuột, Tai nghe, Loa',
                time: '0 - 365 ngày',
                warranty: '1 ĐỔI 1 đối với lỗi NSX (cùng mã hoặc cùng nhóm hàng)',
                demand: 'Không áp dụng đổi trả theo nhu cầu',
              },
              {
                title: 'Tai nghe Bluetooth Buds2, Buds2 Pro, Buds Live',
                time: 'Đến khi hết hạn bảo hành',
                warranty: 'Không đổi trả, gửi bảo hành hãng',
                demand: 'Không áp dụng đổi trả',
              },
              {
                title: 'Phụ kiện cũ Apple, Samsung',
                time: '0 - 180 ngày',
                warranty: 'Không đổi trả, gửi bảo hành hãng',
                demand: 'Không áp dụng đổi trả',
              },
              {
                title: 'Ốp lưng, Bao da, balo, túi xách, gậy chụp hình, tay cầm chơi game, dây đồng hồ, Miếng dán màn hình lẻ',
                time: 'Mọi thời gian',
                warranty: 'Không bảo hành, đổi trả',
                demand: 'Không áp dụng',
              },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-sm font-black text-slate-950">{item.title}</h4>
                  <span className="flex-shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-wide">{item.time}</span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3">
                    <span className="mt-0.5 text-green-500">✅</span>
                    <p className="text-xs text-green-700">{item.warranty}</p>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
                    <span className="mt-0.5 text-red-500">❌</span>
                    <p className="text-xs text-red-700">{item.demand}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl bg-gradient-to-r from-red-600 to-orange-500 py-12 text-center">
          <h3 className="text-2xl font-black text-white">Bạn có thắc mắc về chính sách đổi trả?</h3>
          <p className="mx-auto mt-3 max-w-md text-sm text-red-100">
            Liên hệ đội ngũ HHShop để được giải đáp và hỗ trợ nhanh chóng.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link to="/products" className="rounded-2xl bg-white px-8 py-3 text-sm font-black text-red-600 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              Mua sắm ngay
            </Link>
            <Link to="/gioi-thieu" className="rounded-2xl border border-white/30 px-8 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:border-white/50">
              Tìm hiểu về HHShop
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};
