import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Toast } from '../components/Toast';

export function PaymentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bookingData, setBookingData] = useState(() => {
    try {
      const saved = localStorage.getItem('travelgo_booking_data');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // 10-Minute Timer
  const [timeLeft, setTimeLeft] = useState(() => {
    const savedExpiry = localStorage.getItem('travelgo_timer_expiry');
    const now = Date.now();
    if (savedExpiry) {
      const remaining = Math.floor((parseInt(savedExpiry) - now) / 1000);
      return remaining > 0 ? remaining : 600;
    }
    const expiry = now + (600 * 1000);
    localStorage.setItem('travelgo_timer_expiry', expiry);
    return 600;
  });

  const [activeTab, setActiveTab] = useState('skip');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Form Fields for Payment
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  useEffect(() => {
    if (!bookingData) {
      navigate('/');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.removeItem('travelgo_timer_expiry');
          localStorage.removeItem('travelgo_booking_data');
          setToast({ type: 'error', message: 'Session expired! Your temporary seat hold has been released.' });
          setTimeout(() => navigate('/'), 2500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [bookingData, navigate]);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');

  const totalAmount = bookingData?.totalAmount || 850;

  const handlePay = async (methodName) => {
    setIsProcessing(true);
    setToast(null);

    // Strictly enforce login requirement before ticket booking
    if (!user) {
      setToast({ type: 'error', message: '🔒 Login required! Please log in to your SafarSathi account to book this ticket.' });
      setTimeout(() => {
        navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      }, 1200);
      setIsProcessing(false);
      return;
    }

    const payload = {
      bus_id: bookingData.busId,
      travel_date: bookingData.travelDate,
      seat_no: Array.isArray(bookingData.seats) ? bookingData.seats.join(',') : bookingData.seats,
      passenger_name: bookingData.passengers?.[0]?.name || user?.name || 'Passenger',
      passenger_email: user?.email || bookingData.contact?.email || '',
      passenger_phone: bookingData.contact?.phone || user?.phone || '',
      payment_method: methodName,
      coupon_code: bookingData.promoCode || '',
      passengers: bookingData.passengers || [],
      addons: bookingData.addons || []
    };

    try {
      const res = await api.bookings.create(payload);
      if (res.success) {
        // Clear booking temporary items
        localStorage.removeItem('travelgo_timer_expiry');
        localStorage.removeItem('travelgo_booking_data');
        localStorage.removeItem('selectedSeats');

        setConfirmedBooking({
          pnr: res.pnr,
          busName: res.busName || bookingData.busName,
          source: res.source,
          destination: res.destination,
          travelDate: res.travelDate,
          seats: res.seats || bookingData.seats,
          totalFare: res.totalFare || totalAmount
        });
      } else {
        setToast({ type: 'error', message: res.message || 'Payment confirmation failed' });
      }
    } catch (err) {
      if (err.message && (err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('log in'))) {
        setToast({ type: 'error', message: '🔒 Authentication required! Please log in to complete your ticket booking.' });
        setTimeout(() => {
          navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        }, 1200);
      } else {
        setToast({ type: 'error', message: err.message || 'Payment verification failed' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="payment-page" style={{ maxWidth: '950px', margin: '0 auto', padding: '30px 20px' }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Confirmation Success Modal */}
      {confirmedBooking && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.6)',
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
              maxWidth: '480px',
              width: '100%',
              padding: '30px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ width: '64px', height: '64px', background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 15px' }}>
              ✓
            </div>
            <h2 style={{ color: '#1c2430', margin: '0 0 8px 0' }}>Booking Confirmed!</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px 0' }}>
              Your ticket has been booked and confirmed. An e-ticket has been sent to your email.
            </p>

            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '25px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Booking PNR:</span>
                <strong style={{ color: '#008cff', fontSize: '15px' }}>{confirmedBooking.pnr}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Route:</span>
                <strong>{confirmedBooking.source} ➔ {confirmedBooking.destination}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Travel Date:</span>
                <strong>{confirmedBooking.travelDate}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Seat(s):</span>
                <strong>{Array.isArray(confirmedBooking.seats) ? confirmedBooking.seats.join(', ') : confirmedBooking.seats}</strong>
              </div>
            </div>

            <button
              onClick={() => navigate('/my-bookings')}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#008cff',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              View My Bookings & Print Ticket ➔
            </button>
          </div>
        </div>
      )}

      {/* Timer Bar */}
      <div
        style={{
          background: '#fef3c7',
          border: '1px solid #fde68a',
          color: '#92400e',
          padding: '12px 20px',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px',
          fontWeight: 600
        }}
      >
        <span>⏳ Temporary Seat Hold Active</span>
        <span>Seats held for: <strong style={{ color: '#b45309', fontSize: '1.1rem' }}>{minutes}:{seconds}</strong></span>
      </div>

      <div className="payment-layout-grid">
        {/* Left: Payment Tabs */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          
          {/* Instant Skip-Payment Action Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              padding: '16px 20px',
              borderRadius: '12px',
              marginBottom: '22px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              boxShadow: '0 6px 18px rgba(16, 185, 129, 0.25)'
            }}
          >
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⚡ Instant Booking (Skip Payment)
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                Skip payment right now and confirm your ticket with official PNR instantly!
              </div>
            </div>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handlePay('Skip Payment / Pay Later')}
              style={{
                background: '#ffffff',
                color: '#059669',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '13px',
                cursor: isProcessing ? 'wait' : 'pointer',
                boxShadow: '0 3px 10px rgba(0,0,0,0.12)'
              }}
            >
              {isProcessing ? '⏳ Booking...' : '🎫 Skip Payment & Book Ticket'}
            </button>
          </div>

          <h2 style={{ margin: '0 0 15px 0', color: '#1c2430', fontSize: '1.25rem' }}>Select Payment Method</h2>

          {/* Payment Method Selector Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('skip')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'skip' ? '#10b981' : '#ecfdf5',
                color: activeTab === 'skip' ? '#ffffff' : '#047857',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: activeTab === 'skip' ? '0 3px 8px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              ⚡ Instant Booking (Skip Payment)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upi')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'upi' ? '#008cff' : '#f1f5f9',
                color: activeTab === 'upi' ? '#ffffff' : '#475569',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              ⚡ UPI / QR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('card')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'card' ? '#008cff' : '#f1f5f9',
                color: activeTab === 'card' ? '#ffffff' : '#475569',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              💳 Card
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('netbanking')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'netbanking' ? '#008cff' : '#f1f5f9',
                color: activeTab === 'netbanking' ? '#ffffff' : '#475569',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              🏦 Net Banking
            </button>
          </div>

          {/* TAB 0: SKIP PAYMENT DIRECT */}
          {activeTab === 'skip' && (
            <div style={{ background: '#f0fdf4', padding: '22px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#166534', fontSize: '1.15rem' }}>
                ⚡ Direct Booking Confirmation (Skip Payment)
              </h3>
              <p style={{ color: '#15803d', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Confirm your reservation instantly with verified PNR and seat allocation. No advance payment required right now.
              </p>
              <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '8px', border: '1px solid #dcfce7', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', color: '#374151', marginBottom: '6px' }}>✓ <strong>Guaranteed Seat Reservation:</strong> Locked in the database immediately</div>
                <div style={{ fontSize: '13px', color: '#374151', marginBottom: '6px' }}>✓ <strong>Instant E-Ticket:</strong> Ready to print or view in "My Bookings"</div>
                <div style={{ fontSize: '13px', color: '#374151' }}>✓ <strong>Pay Later:</strong> Settle the total fare (₹{totalAmount}) at boarding or later</div>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handlePay('Skip Payment / Pay on Boarding')}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: isProcessing ? 'wait' : 'pointer',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
                }}
              >
                {isProcessing ? '⏳ Confirming Booking...' : `Confirm Ticket Now (Skip ₹${totalAmount} Payment) ➔`}
              </button>
            </div>
          )}

          {/* TAB 2: UPI / QR */}
          {activeTab === 'upi' && (
            <div>
              <div style={{ textAlign: 'center', padding: '15px', background: '#f8fafc', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'inline-block', padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px' }}>
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=safarsathi@upi&pn=SafarSathi"
                    alt="Scan UPI QR"
                    style={{ display: 'block' }}
                  />
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Scan with GPay, PhonePe, Paytm, BHIM or any UPI app
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                  Or Enter UPI ID (VPA)
                </label>
                <input
                  type="text"
                  placeholder="e.g. mobile@upi or username@oksbi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handlePay('UPI')}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#008cff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: isProcessing ? 'wait' : 'pointer'
                }}
              >
                {isProcessing ? 'Verifying UPI...' : `Verify & Pay ₹${totalAmount}`}
              </button>
            </div>
          )}

          {/* TAB 3: CARD */}
          {activeTab === 'card' && (
            <div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="4532 •••• •••• 8892"
                  maxLength="19"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                    Valid Thru (MM/YY)
                  </label>
                  <input
                    type="text"
                    placeholder="12/28"
                    maxLength="5"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                    CVV
                  </label>
                  <input
                    type="password"
                    placeholder="•••"
                    maxLength="4"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handlePay('Card')}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#008cff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: isProcessing ? 'wait' : 'pointer'
                }}
              >
                {isProcessing ? 'Processing Card...' : `Pay ₹${totalAmount} Securely`}
              </button>
            </div>
          )}

          {/* TAB 4: NET BANKING */}
          {activeTab === 'netbanking' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>
                  Select Bank
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }}
                >
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="State Bank of India">State Bank of India (SBI)</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  <option value="Punjab National Bank">Punjab National Bank</option>
                </select>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handlePay(`Net Banking (${selectedBank})`)}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#008cff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: isProcessing ? 'wait' : 'pointer'
                }}
              >
                {isProcessing ? 'Redirecting...' : `Proceed with ${selectedBank}`}
              </button>
            </div>
          )}
        </div>

        {/* Right: Booking Summary Sidebar */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1c2430', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            Journey Summary
          </h3>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Route</div>
            <strong style={{ color: '#1c2430', fontSize: '15px' }}>{bookingData?.from} ➔ {bookingData?.to}</strong>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Bus Operator</div>
            <div style={{ fontWeight: '600', color: '#008cff' }}>{bookingData?.busName || 'Express Bus'}</div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Journey Date</div>
            <div style={{ fontWeight: '600', color: '#1c2430' }}>{bookingData?.travelDate}</div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Seat Numbers</div>
            <strong style={{ color: '#10b981' }}>{Array.isArray(bookingData?.seats) ? bookingData?.seats.join(', ') : bookingData?.seats}</strong>
          </div>

          <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '15px', marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1c2430' }}>Total Fare:</span>
            <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981' }}>₹{totalAmount}</span>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handlePay('Skip Payment / Pay on Boarding')}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '14px 16px',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '15px',
              cursor: isProcessing ? 'wait' : 'pointer',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isProcessing ? '⏳ Confirming Ticket...' : '🎫 Skip Payment & Book Ticket'}
          </button>
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
            ⚡ 1-Click Direct Booking (No Payment Required)
          </div>
        </div>
      </div>
    </div>
  );
}

