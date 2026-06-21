import React from 'react';
import { MapPin, Calendar, Coins, Activity, Phone } from 'lucide-react';
import './Home.css';

function Home() {
  return (
    <div className="home animate-fade-in">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>المخيم الصيفي</h1>
          <h2 className="highlight">دروب السعادة</h2>
          <p className="subtitle">الكشافة التونسية - فوج التربية بمساكن</p>
          <div className="hero-cta">
            <button className="btn btn-secondary btn-large">للحجز والاستفسار</button>
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section className="container details-section">
        <div className="info-cards">
          <div className="info-card glass">
            <Calendar className="icon" size={40} />
            <h3>التاريخ</h3>
            <p>من 13 إلى 19 جويلية 2026</p>
          </div>
          <div className="info-card glass">
            <MapPin className="icon" size={40} />
            <h3>المكان</h3>
            <p>مدينة المعمورة، نابل</p>
          </div>
          <div className="info-card glass highlight-card">
            <Coins className="icon" size={40} />
            <h3>معلوم المشاركة</h3>
            <p className="price">270 <span>د</span></p>
            <p className="discount">تخفيض بـ 50 د للناشطين خلال السنة الكشفية</p>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="activities-section container">
        <h2 className="section-title">برنامج ثري وممتع</h2>
        <div className="activities-grid">
          <div className="activity-item">
            <Activity className="icon" size={32} />
            <h4>مغامرات وأنشطة كشفية</h4>
          </div>
          <div className="activity-item">
            <Activity className="icon" size={32} />
            <h4>ألعاب ومسابقات</h4>
          </div>
          <div className="activity-item">
            <Activity className="icon" size={32} />
            <h4>رحلة الوطن القبلي</h4>
          </div>
          <div className="activity-item">
            <Activity className="icon" size={32} />
            <h4>زيارة Carthage Land</h4>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="container">
          <h2>عش التجربة... كن مستعداً!</h2>
          <div className="contact-numbers">
            <Phone size={24} />
            <span>97523274</span> | 
            <span>22098701</span> | 
            <span>98480936</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
