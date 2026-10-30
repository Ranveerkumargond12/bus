import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Toast } from '../components/Toast';

export function OperatorRegisterPage() {
  const [agencyName, setAgencyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [fleetSize, setFleetSize] = useState('1');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.operators.register({
        agency_name: agencyName,
        owner_name: ownerName,
        phone,
        fleet_size: fleetSize
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
          <h2 style={{ margin: '0 0 8px 0', color: '#1c2430' }}>Register Bus Operator</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Partner with SafarSathi to list your fleet and routes</p>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎉</div>
            <h3 style={{ color: '#10b981', margin: '0 0 10px 0' }}>Registration Submitted!</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '25px' }}>
              Thank you for partnering with SafarSathi. Our fleet onboarding team will contact you within 24 hours.
            </p>
            <Link to="/" style={{ padding: '10px 24px', background: '#008cff', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
              Return to Home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Agency / Travels Name *</label>
              <input
                type="text"
                placeholder="e.g. Royal Travels Pvt Ltd"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Owner / Contact Person *</label>
              <input
                type="text"
                placeholder="Full Name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Phone Number *</label>
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
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Current Fleet Size</label>
              <select
                value={fleetSize}
                onChange={(e) => setFleetSize(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
              >
                <option value="1">1 - 2 Buses</option>
                <option value="5">3 - 10 Buses</option>
                <option value="20">11 - 50 Buses</option>
                <option value="50">50+ Buses</option>
              </select>
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
              {loading ? 'Submitting...' : 'Register Operator'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

