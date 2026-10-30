import React, { useState } from 'react';
import { Toast } from '../components/Toast';

export function OffersPage() {
  const [copiedCode, setCopiedCode] = useState(null);
  const [toast, setToast] = useState(null);

  const offers = [
    {
      id: '1',
      tag: 'First Booking',
      title: 'Flat ₹200 OFF',
      description: 'Get instant ₹200 discount on your first bus booking with SafarSathi.',
      code: 'FIRST50'
    },
    {
      id: '2',
      tag: 'New User Special',
      title: 'Save ₹150 Instantly',
      description: 'Get ₹150 instant discount on any bus ticket across all routes.',
      code: 'TRAVELGO'
    },
    {
      id: '3',
      tag: 'Festive Special',
      title: 'Save up to ₹300',
      description: 'Applicable on bookings above ₹1200 across all bus operators.',
      code: 'FESTIVE300'
    },
    {
      id: '4',
      tag: 'Weekend Gateway',
      title: '15% Instant Discount',
      description: 'Book Saturday or Sunday travels and enjoy instant fare deduction.',
      code: 'WEEKEND15'
    },
    {
      id: '5',
      tag: 'Group Travel',
      title: 'Flat ₹500 OFF',
      description: 'Valid when booking 4 or more seats in a single reservation.',
      code: 'GROUP500'
    }
  ];

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setToast({ type: 'success', message: `Promo code "${code}" copied to clipboard!` });
      setTimeout(() => setCopiedCode(null), 2500);
    });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div style={{ textAlign: 'center', marginBottom: '35px' }}>
        <h1 style={{ color: '#1c2430', margin: '0 0 8px 0' }}>SafarSathi Bus Booking Offers & Coupons</h1>
        <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
          Apply these verified promo codes during checkout to enjoy massive savings on your journey.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {offers.map(offer => (
          <div
            key={offer.id}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <span
                style={{
                  display: 'inline-block',
                  background: 'rgba(0, 140, 255, 0.1)',
                  color: '#008cff',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  marginBottom: '12px'
                }}
              >
                {offer.tag}
              </span>
              <h3 style={{ margin: '0 0 8px 0', color: '#1c2430', fontSize: '1.2rem' }}>{offer.title}</h3>
              <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                {offer.description}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
              <span style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', color: '#1c2430', fontSize: '14px', letterSpacing: '1px' }}>
                {offer.code}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(offer.code)}
                style={{
                  padding: '8px 16px',
                  background: copiedCode === offer.code ? '#10b981' : '#008cff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {copiedCode === offer.code ? 'Copied! ✓' : 'Copy Code'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

