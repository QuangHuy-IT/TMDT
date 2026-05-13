import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const MilestoneItem = ({ year, text, icon }) => (
  <div className="flex items-start gap-4">
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-red-50">
      <span className="text-lg font-black text-red-600">{icon}</span>
    </div>
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-red-600">{year}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{text}</p>
    </div>
  </div>
);

const ValueCard = ({ icon, title, description }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
      {icon}
    </div>
    <h3 className="mb-2 text-base font-black text-slate-950">{title}</h3>
    <p className="text-sm leading-relaxed text-slate-500">{description}</p>
  </div>
);

const SectionTitle = ({ label, title }) => (
  <div className="mb-8 text-center">
    <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600">{label}</p>
    <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
  </div>
);

export const About = () => {
  useEffect(() => {
    document.title = 'Giới thiệu - HHShop';
    window.scrollTo(0, 0);
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-500" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-red-400">HHShop</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Về chúng tôi
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300">
            Điểm đến công nghệ tin cậy — nơi mang đến cho bạn những sản phẩm chính hãng với giá tốt nhất
            và dịch vụ hậu mãi tận tâm.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            {[
              { num: '100%', label: 'Chính hãng' },
              { num: '500+', label: 'Cửa hàng toàn quốc' },
              { num: '10+', label: 'Năm kinh nghiệm' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-3xl font-black text-white">{item.num}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/" className="transition-colors hover:text-red-600">Trang chủ</Link>
            <span>/</span>
            <span className="text-red-600">Giới thiệu</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 space-y-20">

        {/* Section 1: Về chúng tôi */}
        <section>
          <SectionTitle label="Giới thiệu" title="Về HHShop" />
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-base leading-relaxed text-slate-600">
                <strong className="font-black text-slate-900">HHShop</strong> là chuỗi chuyên bán lẻ các sản phẩm kỹ thuật số di động bao gồm điện thoại di động, máy tính bảng, laptop, phụ kiện và dịch vụ công nghệ… cùng các mặt hàng gia dụng, điện máy chính hãng, chất lượng cao đến từ các thương hiệu lớn, với mẫu mã đa dạng và mức giá tối ưu nhất cho khách hàng.
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                HHShop là hệ thống bán lẻ uy tín hàng đầu Việt Nam, cam kết mang đến trải nghiệm mua sắm tốt nhất thông qua việc cung cấp các sản phẩm chính hãng 100%, dịch vụ chuyên nghiệp cùng chính sách hậu mãi chu đáo.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {['Samsung', 'Apple', 'Xiaomi', 'OPPO', 'Vivo', 'Nokia'].map((brand) => (
                  <span key={brand} className="rounded-xl bg-slate-100 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-slate-600">
                    {brand}
                  </span>
                ))}
                <span className="rounded-xl bg-red-50 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-red-600">
                  + {currentYear - 2015} thương hiệu
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-10 shadow-2xl">
                <div className="space-y-8">
                  {[
                    { icon: '🏆', title: 'Chứng nhận ISO 9001:2000', desc: 'Quản lý chất lượng theo tiêu chuẩn quốc tế đầu tiên tại Việt Nam' },
                    { icon: '🏪', title: 'Hệ thống 500+ cửa hàng', desc: 'Phủ rộng khắp 63 tỉnh thành trên toàn quốc' },
                    { icon: '📱', title: 'Sản phẩm chính hãng 100%', desc: 'Cam kết authentic, bảo hành chính hãng đầy đủ' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-4">
                      <span className="text-3xl">{item.icon}</span>
                      <div>
                        <h4 className="font-black text-white">{item.title}</h4>
                        <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Sứ mệnh */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 py-16">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(220,38,38,0.8),transparent_70%)]" />
          </div>
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-2xl">🎯</div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-red-400">Sứ mệnh</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Tạo trải nghiệm xuất sắc cho khách hàng
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300">
              HHShop kỳ vọng mang đến cho khách hàng những trải nghiệm mua sắm tốt nhất thông qua việc cung cấp các sản phẩm chính hãng, dịch vụ chuyên nghiệp cùng chính sách hậu mãi chu đáo. HHShop không ngừng cải tiến và phát triển, hướng tới việc trở thành nhà bán lẻ công nghệ hàng đầu Việt Nam, đồng thời mang lại giá trị thiết thực cho cộng đồng.
            </p>
          </div>
        </section>

        {/* Section 3: Giá trị cốt lõi */}
        <section>
          <SectionTitle label="Giá trị" title="Giá trị cốt lõi của HHShop" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ValueCard
              icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              title="Chất lượng và Uy tín"
              description="Cam kết cung cấp sản phẩm chính hãng với chính sách bảo hành uy tín và dịch vụ chăm sóc khách hàng chu đáo, mang lại sự an tâm tuyệt đối khi mua sắm."
            />
            <ValueCard
              icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              title="Khách hàng là trọng tâm"
              description="Phục vụ khách hàng luôn là ưu tiên số 1. Đội ngũ nhân viên nhiệt tình, trung thực, mang lại lợi ích và sự hài lòng tối đa cho khách hàng."
            />
            <ValueCard
              icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              title="Đổi mới và phát triển"
              description="Luôn cập nhật và đổi mới sản phẩm, công nghệ cũng như dịch vụ để đáp ứng nhu cầu thay đổi liên tục của thị trường và khách hàng."
            />
            <ValueCard
              icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              title="Đồng hành cùng cộng đồng"
              description="Không chỉ tập trung vào phát triển kinh doanh mà còn chú trọng các hoạt động xã hội, đóng góp tích cực cho sự phát triển của cộng đồng."
            />
          </div>
        </section>

        {/* Section 4: Cột mốc phát triển */}
        <section>
          <SectionTitle label="Lịch sử" title="Cột mốc phát triển" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MilestoneItem year="2015" icon="📱" text="HHShop chính thức ra mắt thị trường Việt Nam" />
            <MilestoneItem year="2017" icon="🏪" text="Đạt mốc 100 cửa hàng trên toàn quốc" />
            <MilestoneItem year="2019" icon="💻" text="Mở rộng kinh doanh trực tuyến đa nền tảng" />
            <MilestoneItem year={currentYear} icon="🚀" text="Tiếp tục phát triển mạnh mẽ với hàng trăm sản phẩm công nghệ" />
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 to-orange-500 py-16 text-center">
          <div className="relative mx-auto max-w-2xl px-4">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Sẵn sàng trải nghiệm cùng HHShop?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-red-100">
              Khám phá hàng ngàn sản phẩm công nghệ chính hãng với giá tốt nhất thị trường ngay hôm nay.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/products"
                className="rounded-2xl bg-white px-8 py-4 text-sm font-black text-red-600 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                Mua sắm ngay
              </Link>
              <Link
                to="/"
                className="rounded-2xl border-2 border-white/40 px-8 py-4 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:border-white/60"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
