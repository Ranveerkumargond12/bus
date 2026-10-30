import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Toast } from '../components/Toast';

export function AgentRegisterPage() {
  const [fullName, setFullName] = useState('');
  const [agencyShop, setAgencyShop] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.agents.register({
        full_name: fullName,
        agency_shop: agencyShop,
        phone,
        city
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        setToast({ type: 'error', message: res.message || 'Registration failed' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Server error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', padding: '0 20px' }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h2 style={{ margin: '0 0 8px 0', color: '#1c2430' }}>Become a Travel Agent</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Earn highest commissions by booking bus tickets for your clients</p>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🤝</div>
            <h3 style={{ color: '#10b981', margin: '0 0 10px 0' }}>Agent Application Submitted!</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '25px' }}>
              Your agent application is under review. Our partnership executive will contact you with API credentials.
            </p>
            <Link to="/" style={{ padding: '10px 24px', background: '#008cff', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
              Return to Home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Full Name *</label>
              <input
                type="text"
                placeholder="Agent Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Agency / Shop Name *</label>
              <input
                type="text"
                placeholder="Shop or Agency Name"
                value={agencyShop}
                onChange={(e) => setAgencyShop(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Mobile Number *</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>City / Town *</label>
              <input
                type="text"
                placeholder="Operating City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: '#008cff',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: loading ? 'wait' : 'pointer'
              }}
            >
              {loading ? 'Submitting...' : 'Register as Agent'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

