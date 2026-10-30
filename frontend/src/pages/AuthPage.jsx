import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/Toast';

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const redirectTarget = searchParams.get('redirect') || '/';

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      const user = await login({
        identifier: loginIdentifier.trim(),
        email: loginIdentifier.trim(),
        password: loginPassword
      });

      setToast({ type: 'success', message: `Welcome back, ${user.name}!` });
      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'conductor') {
          navigate(user.bus_id ? `/conductor?busId=${user.bus_id}` : '/conductor');
        } else {
          navigate(redirectTarget || '/');
        }
      }, 600);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Invalid Login ID or Password' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    if (signupPassword.length < 6) {
      setToast({ type: 'error', message: 'Password must be at least 6 characters long.' });
      setLoading(false);
      return;
    }

    try {
      const user = await register({
        name: signupName.trim(),
        email: signupEmail.trim(),
        phone: signupPhone.trim(),
        password: signupPassword
      });

      setToast({ type: 'success', message: `Account created successfully! You are now logged in.` });
      setTimeout(() => {
        navigate(redirectTarget);
      }, 1200);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '50px auto', padding: '0 20px' }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '32px 28px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🚌</div>
          <h2 style={{ margin: '0 0 6px 0', color: '#1c2430', fontSize: '1.5rem' }}>
            {isLoginTab ? 'Welcome Back' : 'Create User Account'}
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
            {isLoginTab ? 'Log in as User, Bus Conductor, or Admin' : 'Passenger Sign Up — Create your user account to book bus tickets'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setIsLoginTab(true)}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              background: isLoginTab ? '#ffffff' : 'transparent',
              color: isLoginTab ? '#008cff' : '#64748b',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: isLoginTab ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setIsLoginTab(false)}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              background: !isLoginTab ? '#ffffff' : 'transparent',
              color: !isLoginTab ? '#008cff' : '#64748b',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: !isLoginTab ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            User Sign Up
          </button>
        </div>

        {/* LOGIN FORM */}
        {isLoginTab ? (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ background: '#f0f9ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: '#0369a1' }}>
                🔑 Admin: <strong>admin@safarsathi.com</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoginIdentifier('admin@safarsathi.com');
                  setLoginPassword('amir2010khan');
                }}
                style={{ background: '#008cff', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Autofill
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                Email, Mobile Number, or Conductor ID
              </label>
              <input
                type="text"
                placeholder="Enter Email, Mobile or Conductor ID"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Password / PIN</label>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: '#008cff',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 4px 15px rgba(0, 140, 255, 0.3)'
              }}
            >
              {loading ? 'Authenticating...' : 'Log In'}
            </button>
          </form>
        ) : (
          /* SIGNUP FORM (USER / PASSENGER ONLY) */
          <form onSubmit={handleSignupSubmit}>
            <div style={{ background: '#ecfdf5', padding: '10px 14px', borderRadius: '8px', border: '1px solid #a7f3d0', marginBottom: '16px', fontSize: '12px', color: '#047857', fontWeight: '600' }}>
              👤 Passenger / Customer Account Only (Conductor IDs are created by Admin)
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                required
                style={{ width: '100%', padding: '11px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                Email Address *
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '11px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                Mobile Number
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={signupPhone}
                onChange={(e) => setSignupPhone(e.target.value)}
                style={{ width: '100%', padding: '11px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                Password (min 6 chars) *
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '11px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
              }}
            >
              {loading ? 'Creating User Account...' : 'Create User Account'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link to="/" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

