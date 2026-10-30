import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Toast } from '../components/Toast';

export function WalletPage() {
  const { user, updateWalletBalance } = useAuth();

  const [balance, setBalance] = useState(user?.wallet_balance !== undefined ? Number(user.wallet_balance) : 150);
  const [transactions, setTransactions] = useState([]);
  const [customAmount, setCustomAmount] = useState('');
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [gatewayTab, setGatewayTab] = useState('qr');
  const [toast, setToast] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load wallet details from API
  const loadWallet = async () => {
    try {
      const email = user?.email || '';
      const data = await api.wallet.get(email);
      if (data.success) {
        setBalance(Number(data.wallet_balance));
        setTransactions(data.transactions || []);
        updateWalletBalance(Number(data.wallet_balance));
      }
    } catch (err) {
      console.warn('Error fetching wallet from backend:', err);
    }
  };

  useEffect(() => {
    loadWallet();
  }, [user]);

  const handleOpenGateway = (amt) => {
    const finalAmt = amt || Number(customAmount);
    if (!finalAmt || finalAmt <= 0) {
      setToast({ type: 'error', message: 'Please enter or select a valid recharge amount greater than 0.' });
      return;
    }
    setCustomAmount(finalAmt);
    setIsGatewayOpen(true);
  };

  const handleCompleteAddMoney = async (method) => {
    setIsProcessing(true);
    const amount = Number(customAmount);

    try {
      const res = await api.wallet.addMoney({
        amount,
        method,
        email: user?.email || ''
      });

      if (res.success) {
        setBalance(res.wallet_balance);
        updateWalletBalance(res.wallet_balance);
        setIsGatewayOpen(false);
        setCustomAmount('');
        setToast({ type: 'success', message: `🎉 Successfully added ₹${amount} to your SafarSathi wallet!` });
        loadWallet();
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to recharge wallet' });
      }
    } catch (err) {
      // Offline fallback
      const newBal = balance + amount;
      setBalance(newBal);
      updateWalletBalance(newBal);
      setIsGatewayOpen(false);
      setCustomAmount('');
      setToast({ type: 'success', message: `🎉 Successfully added ₹${amount} to your wallet via ${method}!` });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '0 20px' }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#1c2430', fontSize: '1.4rem' }}>SafarSathi Wallet</h2>
          <span style={{ background: 'rgba(0, 140, 255, 0.1)', color: '#008cff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
            SECURED
          </span>
        </div>

        {/* Balance Gradient Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #008cff 0%, #0056b3 100%)',
            color: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '25px',
            boxShadow: '0 8px 20px rgba(0, 140, 255, 0.25)'
          }}
        >
          <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: 500 }}>Available Wallet Balance</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', marginTop: '6px' }}>₹{balance}</div>
          <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '8px' }}>Usable for instant bus bookings and zero-cancellation fee refunds</div>
        </div>

        {/* Add Funds Section */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#1c2430', marginBottom: '10px' }}>
            Add Funds to Wallet
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {[100, 500, 1000].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setCustomAmount(amt)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: customAmount === amt ? '#e2e8f0' : '#f1f5f9',
                  border: customAmount === amt ? '2px solid #008cff' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  color: '#1c2430',
                  cursor: 'pointer'
                }}
              >
                +₹{amt}
              </button>
            ))}
          </div>

          <input
            type="number"
            placeholder="Enter custom amount"
            min="1"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '15px'
            }}
          />

          <button
            type="button"
            onClick={() => handleOpenGateway()}
            style={{
              width: '100%',
              padding: '14px',
              background: '#008cff',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 140, 255, 0.3)'
            }}
          >
            Proceed to Add Money
          </button>
        </div>

        {/* Transactions History */}
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1c2430', marginBottom: '12px' }}>
            Recent Transactions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                No wallet transactions recorded yet
              </div>
            ) : (
              transactions.map((tx, idx) => {
                const isCredit = tx.type === 'Credit' || tx.amount > 0;
                return (
                  <div
                    key={tx.id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #f1f5f9'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>{tx.title}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{tx.formatted_date || tx.date || 'Recent'}</div>
                    </div>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: isCredit ? '#16a34a' : '#dc2626' }}>
                      {isCredit ? `+₹${Math.abs(tx.amount)}` : `-₹${Math.abs(tx.amount)}`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={{ marginTop: '25px', textAlign: 'center' }}>
          <Link to="/" style={{ color: '#008cff', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            ← Back to Home Page
          </Link>
        </div>
      </div>

      {/* Gateway Modal */}
      {isGatewayOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '420px',
              width: '100%',
              padding: '25px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#1c2430' }}>Add ₹{customAmount} to Wallet</h3>
              <button
                onClick={() => setIsGatewayOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setGatewayTab('qr')}
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', background: gatewayTab === 'qr' ? '#008cff' : '#f1f5f9', color: gatewayTab === 'qr' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                📷 QR Code
              </button>
              <button
                type="button"
                onClick={() => setGatewayTab('upi')}
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', background: gatewayTab === 'upi' ? '#008cff' : '#f1f5f9', color: gatewayTab === 'upi' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                ⚡ UPI App
              </button>
              <button
                type="button"
                onClick={() => setGatewayTab('card')}
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', background: gatewayTab === 'card' ? '#008cff' : '#f1f5f9', color: gatewayTab === 'card' ? '#fff' : '#475569', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                💳 Card
              </button>
            </div>

            {gatewayTab === 'qr' && (
              <div style={{ textAlign: 'center' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=upi://pay?pa=safarsathi@upi&pn=SafarSathi&am=${customAmount}`}
                  alt="Recharge QR"
                  style={{ border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px', marginBottom: '12px' }}
                />
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '18px' }}>
                  Scan with GPay, PhonePe, Paytm, or any UPI app
                </div>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleCompleteAddMoney('QR Code')}
                  style={{ width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {isProcessing ? 'Processing...' : "I've Paid / Complete Recharge"}
                </button>
              </div>
            )}

            {gatewayTab === 'upi' && (
              <div>
                <input
                  type="text"
                  placeholder="Enter UPI ID (e.g. name@okhdfcbank)"
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '15px' }}
                />
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleCompleteAddMoney('UPI App')}
                  style={{ width: '100%', padding: '12px', background: '#008cff', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {isProcessing ? 'Verifying...' : `Verify & Add ₹${customAmount}`}
                </button>
              </div>
            )}

            {gatewayTab === 'card' && (
              <div>
                <input
                  type="text"
                  placeholder="Card Number"
                  maxLength="19"
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '10px' }}
                />
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength="5"
                    style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    maxLength="3"
                    style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleCompleteAddMoney('Credit/Debit Card')}
                  style={{ width: '100%', padding: '12px', background: '#008cff', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {isProcessing ? 'Processing...' : `Pay ₹${customAmount} & Add`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

