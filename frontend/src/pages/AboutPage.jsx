import React from 'react';
import { Link } from 'react-router-dom';

export function AboutPage() {
  return (
    <div className="about-page">
      <div className="about-hero" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: '#ffffff', textAlign: 'center', padding: '60px 20px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#ffffff' }}>About SafarSathi</h1>
        <p style={{ fontSize: '1.2rem', color: '#e0e0e0', margin: 0 }}>Pioneering seamless, affordable and secure bus journeys across India</p>
      </div>

      <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '30px', marginBottom: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
          <h2 style={{ color: '#1e3c72', marginTop: 0 }}>Our Mission</h2>
          <p style={{ color: '#475569', lineHeight: '1.7', fontSize: '15px' }}>
            SafarSathi (formerly TravelGo) is built to simplify bus travel for millions of commuters, tourists, and families.
            We provide verified live bus schedules, direct seat matrix selection, transparent zero-hidden-fee pricing, and instant wallet refunds upon cancellation.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
            <h3 style={{ color: '#1e3c72', marginTop: 0 }}>🛡️ 100% Booking Protection</h3>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
              Guaranteed confirmed seats with certified bus fleet operators. Real-time customer care standby 24/7.
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
            <h3 style={{ color: '#1e3c72', marginTop: 0 }}>⚡ Zero Delay Refunds</h3>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
              Cancelled your trip? Your refund is deposited instantly back to your SafarSathi wallet without bank waiting periods.
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '35px' }}>
          <Link to="/" style={{ color: '#008cff', textDecoration: 'none', fontWeight: 'bold' }}>
            ← Back to Bus Search
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SupportPage() {
  return (
    <div className="support-page" style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '35px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '15px', marginBottom: '20px' }}>
          <Link to="/" style={{ color: '#008cff', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>← Back to Home</Link>
          <h2 style={{ color: '#1c2430', margin: '10px 0 5px 0' }}>Help & Customer Support</h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Have questions or need assistance with your booking? We are here to help.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📞</div>
            <strong style={{ display: 'block', color: '#1c2430', marginBottom: '4px' }}>Call Support</strong>
            <span style={{ color: '#008cff', fontWeight: 'bold' }}>+91 98765 43210</span>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Mon - Sun, 24/7 Helpline</div>
          </div>

          <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>✉️</div>
            <strong style={{ display: 'block', color: '#1c2430', marginBottom: '4px' }}>Email Assistance</strong>
            <span style={{ color: '#008cff', fontWeight: 'bold' }}>support@safarsathi.com</span>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Average response in 1 hour</div>
          </div>
        </div>

        <div>
          <h3 style={{ color: '#1c2430', marginBottom: '15px' }}>Frequently Asked Questions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
              <strong style={{ color: '#1c2430', display: 'block', marginBottom: '4px' }}>How do I cancel my ticket?</strong>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Go to "My Bookings", click on "Cancel Ticket" next to your journey, and confirm. Your refund will be credited instantly to your wallet.</span>
            </div>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
              <strong style={{ color: '#1c2430', display: 'block', marginBottom: '4px' }}>Do I need to carry a printed ticket?</strong>
              <span style={{ color: '#64748b', fontSize: '13px' }}>No, an SMS/Email e-ticket with your PNR and QR code on your phone is completely valid for boarding.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

