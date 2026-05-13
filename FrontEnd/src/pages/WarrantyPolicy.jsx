import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const SectionTitle = ({ label, title }) => (
  <div className="mb-8">
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

const InfoBox = ({ icon, title, children }) => (
  <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-lg">{icon}</div>
    <div>
      <h4 className="text-sm font-black text-slate-950">{title}</h4>
      <div className="mt-2 space-y-1 text-sm text-slate-500">{children}</div>
    </div>
  </div>
);

export const WarrantyPolicy = () => {
  useEffect(() => {
    document.title = 'Chính sách bảo hành - HHShop';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-slate-950 py-16 text-center">
        <p className="text-xs font-black uppercase tracking-[0.4em] text-red-400">HHShop</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Chính sách bảo hành</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
          Cam kết bảo hành chính hãng, hỗ trợ khách hàng tận tâm trên toàn quốc.
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/" className="transition-colors hover:text-red-600">Trang chủ</Link>
            <span>/</span>
            <span className="text-red-600">Chính sách bảo hành</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 space-y-12">

        <BadgeRow />

        {/* Quyền lợi bảo hành */}
        <section>
          <SectionTitle label="Quyền lợi" title="Đặc quyền khi mua hàng tại HHShop" />
          <p className="mb-6 text-base leading-relaxed text-slate-600">
            Tất cả sản phẩm tại <strong className="font-black text-slate-900">HHShop</strong> kinh doanh đều là sản phẩm chính hãng và được bảo hành theo đúng chính sách của nhà sản xuất. Ngoài ra HHShop cũng hỗ trợ gửi bảo hành miễn phí giúp khách hàng đối với cả sản phẩm do HHShop bán ra và sản phẩm Quý khách mua tại các chuỗi bán lẻ khác.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: '🔁', title: 'Đổi sản phẩm mới ngay tại shop', desc: 'Trong 30 ngày nếu có lỗi nhà sản xuất (NSX).' },
              { icon: '📦', title: 'Gửi bảo hành chính hãng không mất phí', desc: 'Không mất phí vận chuyển (trừ sản phẩm bảo hành tại nhà).' },
              { icon: '📋', title: 'Theo dõi tiến độ bảo hành', desc: 'Nhanh chóng qua kênh hotline hoặc tự tra cứu trực tuyến.' },
              { icon: '🤝', title: 'Hỗ trợ làm việc với hãng', desc: 'Xử lý phát sinh trong quá trình bảo hành.' },
            ].map((item) => (
              <InfoBox key={item.title} icon={item.icon} title={item.title}>
                <p>{item.desc}</p>
              </InfoBox>
            ))}
          </div>
        </section>

        {/* Trường hợp ngoài bảo hành */}
        <section>
          <SectionTitle label="Lưu ý" title="Các trường hợp ngoài chính sách bảo hành" />
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <ul className="space-y-3">
              {[
                'Sản phẩm hết hạn bảo hành.',
                'Sản phẩm đã bị thay đổi, sửa chữa không thuộc Trung Tâm Bảo Hành Ủy Quyền của Hãng.',
                'Sản phẩm lắp đặt, bảo trì, sử dụng không đúng theo hướng dẫn của Nhà sản xuất gây ra hư hỏng.',
                'Sản phẩm lỗi do ngấm nước, chất lỏng và bụi bẩn (kể cả thiết bị đạt chứng nhận IP68).',
                'Sản phẩm bị biến dạng, nứt vỡ, cấn móp, trầy xước nặng do tác động nhiệt, tác động bên ngoài.',
                'Sản phẩm có vết mốc, rỉ sét hoặc bị ăn mòn, oxy hóa bởi hóa chất.',
                'Sản phẩm bị hư hại do thiên tai, hỏa hoạn, lụt lội, sét đánh, côn trùng, động vật.',
                'Sản phẩm bị khóa tài khoản cá nhân (iCloud, Samsung Cloud, iCloud, Gmail…).',
                'Khách hàng sử dụng phần mềm, ứng dụng không chính hãng, không bản quyền.',
                'Màn hình có bốn (04) điểm chết trở xuống.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-black text-red-500">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Lưu ý chung */}
        <section>
          <SectionTitle label="Thông tin khác" title="Lưu ý khi sử dụng dịch vụ bảo hành" />
          <div className="space-y-4">
            {[
              { icon: '📅', text: 'Chương trình bảo hành bắt đầu có hiệu lực từ thời điểm HHShop xuất hóa đơn cho Quý khách.' },
              { icon: '🏭', text: 'Với mỗi dòng sản phẩm khác nhau sẽ có chính sách bảo hành khác nhau tùy theo chính sách của Hãng/Nhà cung cấp.' },
              { icon: '💾', text: 'Trong quá trình bảo hành, dữ liệu trên sản phẩm sẽ bị xóa và định dạng lại. Quý khách vui lòng tự sao lưu dữ liệu trước khi gửi bảo hành.' },
              { icon: '🔒', text: 'Vui lòng tắt tất cả các mật khẩu bảo vệ. HHShop sẽ từ chối tiếp nhận bảo hành nếu thiết bị bị khóa.' },
              { icon: '📞', text: 'Liên hệ bộ phận Chăm sóc Khách hàng HHShop: 1800 6789 để được hỗ trợ chi tiết.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4">
                <span className="text-lg">{item.icon}</span>
                <p className="text-sm leading-relaxed text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Thông tin liên hệ bảo hành */}
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-center">
          <h3 className="text-xl font-black text-white">Cần hỗ trợ về bảo hành?</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Đội ngũ chăm sóc khách hàng HHShop luôn sẵn sàng hỗ trợ bạn 24/7.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link to="/products" className="rounded-2xl bg-red-600 px-8 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-red-700">
              Mua sắm ngay
            </Link>
            <Link to="/gioi-thieu" className="rounded-2xl border border-white/20 px-8 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:border-white/40">
              Về HHShop
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
