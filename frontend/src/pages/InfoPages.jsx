import React from 'react';
import { Link } from 'react-router-dom';

export function CareersPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '30px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h1 style={{ color: '#1c2430', margin: '0 0 10px 0' }}>Careers at SafarSathi</h1>
        <p style={{ color: '#64748b', marginBottom: '25px' }}>Build the Future of Smart Mobility across India.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ padding: '18px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0284c7', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>ENGINEERING</span>
            <h3 style={{ margin: '8px 0 4px 0', color: '#1c2430' }}>Full-Stack Developer (PHP, React, MySQL)</h3>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 12px 0' }}>Location: Remote / Bangalore | Experience: 2+ Years</p>
            <Link to="/support" style={{ color: '#008cff', fontWeight: 'bold', fontSize: '13px' }}>Apply via Support ➔</Link>
          </div>

          <div style={{ padding: '18px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '11px', background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>OPERATIONS</span>
            <h3 style={{ margin: '8px 0 4px 0', color: '#1c2430' }}>Bus Operator Relations Manager</h3>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 12px 0' }}>Location: Mumbai / Delhi | Experience: 1+ Years</p>
            <Link to="/support" style={{ color: '#008cff', fontWeight: 'bold', fontSize: '13px' }}>Apply via Support ➔</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdvertisePage() {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '30px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h1 style={{ color: '#1c2430', margin: '0 0 10px 0' }}>Advertise Your Bus Route</h1>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>Reach millions of travelers searching for your specific highway corridors daily.</p>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
          Promote your bus fleet with featured listings, top search placements, and targeted banners for travelers booking between key metro hubs.
        </p>
        <Link to="/register-operator" style={{ display: 'inline-block', marginTop: '15px', padding: '10px 20px', background: '#008cff', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          Register Your Fleet Now
        </Link>
      </div>
    </div>
  );
}

export function AffiliatePage() {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '30px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h1 style={{ color: '#1c2430', margin: '0 0 10px 0' }}>SafarSathi Affiliate Program</h1>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>Earn generous referral commissions by promoting bus tickets on your website or blog.</p>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
          Integrate our booking widget or affiliate tracking links and receive up to 6% commission on every confirmed passenger seat booking.
        </p>
        <Link to="/register-agent" style={{ display: 'inline-block', marginTop: '15px', padding: '10px 20px', background: '#008cff', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          Join Partner Program
        </Link>
      </div>
    </div>
  );
}

export function PressPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '30px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h1 style={{ color: '#1c2430', margin: '0 0 10px 0' }}>Press & Media Releases</h1>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>Latest announcements, milestones, and news from SafarSathi.</p>
        <div style={{ borderLeft: '3px solid #008cff', paddingLeft: '15px', marginBottom: '15px' }}>
          <strong style={{ display: 'block', color: '#1c2430' }}>SafarSathi Launches Next-Gen React & PHP Booking Architecture</strong>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>October 2026</span>
          <p style={{ color: '#475569', fontSize: '13px', margin: '5px 0 0 0' }}>Featuring sub-second seat holding, instant cancellation wallet refunds, and multi-language support.</p>
        </div>
      </div>
    </div>
  );
}

export function SciencePage() {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '30px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h1 style={{ color: '#1c2430', margin: '0 0 10px 0' }}>SafarSathi Science & Optimization</h1>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>Route Optimization, Predictive Fleet Scheduling, and Demand Forecasting.</p>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
          We leverage intelligent graph routing algorithms and traffic pattern analytics to dynamically schedule bus departures, minimize layovers, and keep intercity ticket prices ultra-competitive.
        </p>
      </div>
    </div>
  );
}

