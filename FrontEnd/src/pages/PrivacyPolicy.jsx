import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const SectionTitle = ({ label, title }) => (
  <div className="mb-6">
    <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600">{label}</p>
    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
  </div>
);

const NumberedSection = ({ num, title, children }) => (
  <div className="flex gap-5">
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">{num}</div>
    <div className="flex-1">
      <h3 className="text-base font-black text-slate-950">{title}</h3>
      <div className="mt-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
  </div>
);

const PolicyCard = ({ icon, title, description }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-lg">{icon}</div>
    <h4 className="text-sm font-black text-slate-950">{title}</h4>
    <p className="mt-2 text-xs leading-relaxed text-slate-500">{description}</p>
  </div>
);

export const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = 'Chính sách bảo mật - HHShop';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-slate-950 py-16 text-center">
        <p className="text-xs font-black uppercase tracking-[0.4em] text-red-400">HHShop</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Chính sách bảo mật</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
          Cam kết bảo mật thông tin cá nhân và quyền riêng tư của khách hàng.
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/" className="transition-colors hover:text-red-600">Trang chủ</Link>
            <span>/</span>
            <span className="text-red-600">Chính sách bảo mật</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 space-y-12">

        {/* Intro */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm leading-relaxed text-slate-600">
            <strong className="font-black text-slate-900">HHShop.com.vn</strong> cam kết sẽ bảo mật những thông tin mang tính riêng tư của bạn. Bạn vui lòng đọc bản "Chính sách bảo mật" dưới đây để hiểu hơn những cam kết mà chúng tôi thực hiện, nhằm tôn trọng và bảo vệ quyền lợi của người truy cập.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left column: numbered sections */}
          <div className="space-y-8">
            <NumberedSection num="1" title="Mục đích và phạm vi thu thập">
              <p>Để truy cập và sử dụng một số dịch vụ tại HHShop.com.vn, bạn có thể được yêu cầu đăng ký thông tin cá nhân (Email, Họ tên, Số ĐT liên lạc…). Mọi thông tin khai báo phải đảm bảo tính chính xác và hợp pháp.</p>
              <p className="mt-2">Chúng tôi cũng có thể thu thập thông tin về số lần viếng thăm, bao gồm: số trang bạn xem, số links bạn click, địa chỉ IP, loại Browser, ngôn ngữ sử dụng, thời gian truy cập.</p>
            </NumberedSection>

            <NumberedSection num="2" title="Phạm vi sử dụng thông tin">
              <p>HHShop.com.vn thu thập và sử dụng thông tin cá nhân bạn với mục đích phù hợp và hoàn toàn tuân thủ nội dung của "Chính sách bảo mật" này. Khi cần thiết, chúng tôi có thể liên hệ trực tiếp với bạn dưới các hình thức như: gởi thư ngỏ, đơn đặt hàng, thư cảm ơn, sms, thông tin về kỹ thuật và bảo mật…</p>
            </NumberedSection>

            <NumberedSection num="3" title="Thời gian lưu trữ thông tin">
              <p>Dữ liệu cá nhân của Thành viên sẽ được lưu trữ cho đến khi có yêu cầu hủy bỏ hoặc tự thành viên đăng nhập và thực hiện hủy bỏ. Còn lại trong mọi trường hợp, thông tin cá nhân thành viên sẽ được bảo mật trên máy chủ của HHShop.com.vn.</p>
            </NumberedSection>

            <NumberedSection num="4" title="Địa chỉ đơn vị thu thập và quản lý thông tin">
              <p className="font-semibold text-slate-700">Công Ty Cổ Phần Bán Lẻ Kỹ Thuật Số HHShop</p>
              <p className="mt-1">Địa chỉ đăng ký kinh doanh: 261 - 263 Khánh Hội, P. Vĩnh Hội, TP. Hồ Chí Minh</p>
              <p>Văn phòng: 261 - 263 Khánh Hội, P. Vĩnh Hội, TP. Hồ Chí Minh</p>
              <p>Điện thoại: 028.3834.5837</p>
            </NumberedSection>

            <NumberedSection num="5" title="Phương tiện tiếp cận và chỉnh sửa dữ liệu">
              <p>Để tiếp cận và chỉnh sửa dữ liệu cá nhân, khách hàng có thể:</p>
              <ul className="mt-2 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="font-black text-slate-400">•</span>
                  Gọi điện thoại đến tổng đài chăm sóc khách hàng <strong>1800 6789</strong>.
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-slate-400">•</span>
                  Gửi bình luận hoặc góp ý trực tiếp từ website HHShop.com.vn.
                </li>
              </ul>
            </NumberedSection>

            <NumberedSection num="6" title="Cam kết bảo mật thông tin cá nhân">
              <p>Thông tin cá nhân của thành viên trên HHShop.com.vn được cam kết bảo mật tuyệt đối. Việc thu thập và sử dụng thông tin chỉ được thực hiện khi có sự đồng ý của khách hàng, trừ các trường hợp pháp luật có quy định khác.</p>
              <p className="mt-2">Không sử dụng, không chuyển giao, cung cấp hay tiết lộ cho bên thứ 3 nào về thông tin cá nhân khi không có sự cho phép từ thành viên.</p>
              <p className="mt-2">Trong trường hợp máy chủ bị tấn công dẫn đến mất mát dữ liệu, HHShop sẽ thông báo vụ việc cho cơ quan chức năng và thông báo cho thành viên được biết.</p>
            </NumberedSection>

            <NumberedSection num="7" title="Quy định bảo mật thanh toán">
              <p className="font-semibold text-slate-700">Thông tin tài chính của Khách hàng được bảo vệ bằng:</p>
              <ul className="mt-2 space-y-1">
                {[
                  'Giao thức SSL 256-bit (Secure Sockets Layer) trong suốt quá trình giao dịch.',
                  'Mật khẩu OTP qua SMS để xác thực truy cập tài khoản.',
                  'Tuân thủ tiêu chuẩn bảo mật ngành tài chính ngân hàng theo quy định của Ngân hàng Nhà nước Việt Nam.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-black text-slate-400">•</span>{item}
                  </li>
                ))}
              </ul>
              <p className="mt-2">Thông tin thẻ thanh toán <strong>KHÔNG được lưu trữ</strong> trên hệ thống của HHShop. Đối Tác Cổng Thanh Toán sẽ lưu giữ và bảo mật theo tiêu chuẩn quốc tế PCI DSS.</p>
            </NumberedSection>

            <NumberedSection num="8" title="Yêu cầu xóa dữ liệu">
              <p>Bạn có thể gửi yêu cầu xóa dữ liệu qua email Trung tâm hỗ trợ: <strong>hhshop@fpt.com.vn</strong>. Vui lòng cung cấp càng nhiều thông tin càng tốt về dữ liệu nào bạn muốn xóa. Yêu cầu sẽ được chuyển đến nhóm thích hợp để đánh giá và xử lý.</p>
            </NumberedSection>
          </div>

          {/* Right column: summary cards */}
          <div className="space-y-5">
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
              <h3 className="text-base font-black">Cam kết của HHShop</h3>
              <div className="mt-4 space-y-3">
                {[
                  { icon: '🔒', text: 'Bảo mật tuyệt đối mọi thông tin giao dịch trực tuyến' },
                  { icon: '🛡️', text: 'Không chia sẻ thông tin cá nhân cho bên thứ 3 khi chưa có sự đồng ý' },
                  { icon: '⚡', text: 'Thông báo ngay khi có sự cố bảo mật dữ liệu' },
                  { icon: '💳', text: 'Tuân thủ tiêu chuẩn bảo mật PCI DSS quốc tế' },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <p className="text-xs leading-relaxed text-slate-300">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {[
                { icon: '🍪', title: 'Cookies', desc: 'Trang web sử dụng cookies để nâng cao trải nghiệm mua sắm, phân tích lưu lượng truy cập và hỗ trợ các hoạt động tiếp thị.' },
                { icon: '📱', title: 'Thông tin thu thập', desc: 'Địa chỉ IP, loại trình duyệt, ngôn ngữ sử dụng, thời gian truy cập, số trang xem và các liên kết đã click.' },
                { icon: '📋', title: 'Thông tin bắt buộc', desc: 'Họ và tên, địa chỉ liên lạc, email, số điện thoại. Khách hàng chịu trách nhiệm về tính pháp lý của thông tin cung cấp.' },
              ].map((item) => (
                <PolicyCard key={item.title} icon={item.icon} title={item.title} description={item.desc} />
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 py-12 text-center">
          <h3 className="text-2xl font-black text-white">Bạn có câu hỏi về bảo mật?</h3>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
            Đội ngũ hỗ trợ HHShop luôn sẵn sàng giải đáp mọi thắc mắc của bạn.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link to="/products" className="rounded-2xl bg-red-600 px-8 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-red-700">
              Mua sắm ngay
            </Link>
            <Link to="/gioi-thieu" className="rounded-2xl border border-white/20 px-8 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:border-white/40">
              Tìm hiểu về HHShop
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};
