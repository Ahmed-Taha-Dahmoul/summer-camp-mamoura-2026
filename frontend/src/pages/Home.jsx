import React, { useEffect, useRef } from 'react';
import { MapPin, Calendar, Coins, Tent, Zap, Navigation, Smile, Phone, Star, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Home.css';

const activities = [
  {
    icon: <Tent size={36} />,
    title: 'مغامرات وأنشطة كشفية',
    desc: 'أنشطة في الطبيعة تبني الشخصية وتعزز روح الفريق',
    color: 'green',
  },
  {
    icon: <Zap size={36} />,
    title: 'ألعاب ومسابقات',
    desc: 'مسابقات ممتعة ومثيرة بين المجموعات تنمي روح التنافس',
    color: 'amber',
  },
  {
    icon: <Navigation size={36} />,
    title: 'رحلة الوطن القبلي',
    desc: 'استكشاف المناطق الساحرة في الوطن القبلي',
    color: 'blue',
  },
  {
    icon: <Smile size={36} />,
    title: 'زيارة Carthage Land',
    desc: 'يوم مليء بالمرح والفرح في أشهر مدينة ترفيهية',
    color: 'purple',
  },
];

const stats = [
  { value: '7', label: 'أيام' },
  { value: '270', label: 'دينار' },
  { value: '4+', label: 'أنشطة' },
  { value: '2026', label: 'صيف' },
];

function Home() {
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrollY = window.scrollY;
        heroRef.current.style.setProperty('--parallax-y', `${scrollY * 0.4}px`);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToDetails = () => {
    document.getElementById('details')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home animate-fade-in">

      {/* ── Hero ── */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg-overlay" />
        <div className="hero-particles">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`particle particle-${i + 1}`} />
          ))}
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <Star size={14} />
            <span>الكشافة التونسية · فوج التربية بمساكن</span>
          </div>

          <h1 className="hero-title">
            <span className="hero-title-main">المخيم الصيفي</span>
          </h1>
          <h2 className="hero-subtitle">دروب السعادة</h2>

          <p className="hero-desc">
            أسبوع استثنائي من المغامرات والأنشطة الكشفية في مدينة المعمورة
          </p>

          <div className="hero-dates">
            <span className="date-badge">
              <Calendar size={16} />
              13 – 19 جويلية 2026
            </span>
            <span className="date-badge">
              <MapPin size={16} />
              المعمورة، نابل
            </span>
          </div>

          <div className="hero-cta">
            <Link to="/login" className="btn btn-secondary btn-large hero-btn-primary" id="hero-register-btn">
              سجّل الآن
            </Link>
            <button className="btn btn-outline-hero btn-large" onClick={scrollToDetails} id="hero-details-btn">
              اكتشف أكثر
            </button>
          </div>
        </div>

        <button className="scroll-indicator" onClick={scrollToDetails} aria-label="اسحب للأسفل">
          <ArrowDown size={20} />
        </button>
      </section>

      {/* ── Stats Banner ── */}
      <section className="stats-banner">
        {stats.map((s, i) => (
          <div key={i} className="stat-item">
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── Info Cards ── */}
      <section className="details-section container" id="details">
        <div className="section-header">
          <h2 className="section-title">معلومات المخيم</h2>
          <p className="section-desc">كل ما تحتاج معرفته لتكون جزءاً من هذه التجربة الرائعة</p>
        </div>

        <div className="info-cards">
          <div className="info-card glass" id="card-date">
            <div className="info-card-icon green">
              <Calendar size={32} />
            </div>
            <div className="info-card-body">
              <h3>التاريخ</h3>
              <p className="info-main">13 إلى 19 جويلية 2026</p>
              <p className="info-sub">7 أيام متواصلة من المرح</p>
            </div>
          </div>

          <div className="info-card glass" id="card-location">
            <div className="info-card-icon blue">
              <MapPin size={32} />
            </div>
            <div className="info-card-body">
              <h3>المكان</h3>
              <p className="info-main">مدينة المعمورة</p>
              <p className="info-sub">نابل، تونس</p>
            </div>
          </div>

          <div className="info-card highlight-card" id="card-price">
            <div className="info-card-icon white">
              <Coins size={32} />
            </div>
            <div className="info-card-body">
              <h3>معلوم المشاركة</h3>
              <p className="price">270 <span>د</span></p>
              <p className="discount">
                ✦ تخفيض 50 د للناشطين خلال السنة الكشفية
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Activities ── */}
      <section className="activities-section" id="activities">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">برنامج ثري وممتع</h2>
            <p className="section-desc">أنشطة متنوعة مصممة لتنمية مهاراتك وبناء ذكريات لا تُنسى</p>
          </div>

          <div className="activities-grid">
            {activities.map((act, i) => (
              <div key={i} className={`activity-card activity-${act.color}`} id={`activity-${i}`}>
                <div className="activity-icon">
                  {act.icon}
                </div>
                <h4>{act.title}</h4>
                <p>{act.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-section" id="cta">
        <div className="container">
          <div className="cta-card">
            <div className="cta-text">
              <h2>عش التجربة... كن مستعداً!</h2>
              <p>لا تفوّت فرصة الانضمام إلى أجمل مخيم صيفي لعام 2026</p>
            </div>
            <Link to="/login" className="btn btn-secondary btn-large" id="cta-register-btn">
              احجز مكانك الآن
            </Link>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="contact-section" id="contact">
        <div className="container">
          <h2>للحجز والاستفسار</h2>
          <div className="contact-numbers">
            <a href="tel:+21697523274" className="contact-link" id="contact-phone-1">
              <Phone size={20} />
              <span>97523274</span>
            </a>
            <span className="contact-divider" />
            <a href="tel:+21622098701" className="contact-link" id="contact-phone-2">
              <span>22098701</span>
            </a>
            <span className="contact-divider" />
            <a href="tel:+21698480936" className="contact-link" id="contact-phone-3">
              <span>98480936</span>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;
