import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Toast } from '../components/Toast';

export function MyBookingsPage() {
  const { user, updateWalletBalance } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [toast, setToast] = useState(null);

  // Modals
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancellingPNR, setCancellingPNR] = useState(null);
  const [reviewPNR, setReviewPNR] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const loadBookings = async () => {
    setLoading(true);
    try {
      let list = [];
      if (user?.role === 'admin') {
        try {
          const allData = await api.bookings.getAll();
          list = Array.isArray(allData) ? allData : (allData.bookings || []);
        } catch (e) {
          console.warn('Admin fetch all bookings error, trying personal:', e);
          const data = await api.bookings.getMyBookings(user?.email || '');
          list = Array.isArray(data) ? data : (data.bookings || []);
        }
      } else {
        const email = user?.email || '';
        const data = await api.bookings.getMyBookings(email);
        list = Array.isArray(data) ? data : (data.bookings || []);
      }

      // If backend returns empty, check localStorage fallback
      if (list.length === 0) {
        try {
          const local = JSON.parse(localStorage.getItem('myBookings') || '[]');
          if (local.length > 0) list = local;
        } catch (e) {}
      }

      setBookings(list);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      try {
        const local = JSON.parse(localStorage.getItem('myBookings') || '[]');
        setBookings(local);
      } catch (e) {
        setBookings([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user]);

  // Cancel Booking Handler
  const handleConfirmCancel = async () => {
    if (!cancellingPNR) return;

    try {
      const res = await api.bookings.cancel(cancellingPNR);
      if (res.success) {
        setToast({ type: 'success', message: res.message });
        if (res.refundAmount && user) {
          updateWalletBalance((Number(user.wallet_balance) || 0) + Number(res.refundAmount));
        }
        setCancellingPNR(null);
        loadBookings();
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to cancel booking' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Cancellation request failed' });
    }
  };

  // Review Submission Handler
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewPNR) return;

    try {
      const res = await api.reviews.submit({
        pnr: reviewPNR,
        rating: reviewRating,
        comment: reviewComment
      });
      if (res.success) {
        setToast({ type: 'success', message: '⭐ Thank you for your review and rating!' });
        setReviewPNR(null);
        setReviewComment('');
      } else {
        setToast({ type: 'error', message: res.message || 'Review failed' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Could not submit review' });
    }
  };

  // Filter Bookings by Tab
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredBookings = bookings.filter(b => {
    const status = (b.status || 'Confirmed').toUpperCase();
    const travelDate = b.travel_date || b.travelDate || '';

    if (activeFilter === 'CANCELLED') {
      return status === 'CANCELLED' || status === 'CANCEL';
    }
    if (activeFilter === 'COMPLETED') {
      return status !== 'CANCELLED' && travelDate && travelDate < todayStr;
    }
    if (activeFilter === 'UPCOMING') {
      return status !== 'CANCELLED' && (!travelDate || travelDate >= todayStr);
    }
    return true; // 'ALL'
  });

  return (
    <div className="my-bookings-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px' }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: '0 0 5px 0', color: '#1c2430' }}>
              {user?.role === 'admin' ? 'Customer Bookings & E-Tickets' : 'My Bookings & E-Tickets'}
            </h2>
            {user?.role === 'admin' && (
              <span style={{ background: '#dbeafe', color: '#0369a1', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                👑 Admin Master View
              </span>
            )}
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
            {user?.role === 'admin' 
              ? 'Showing all live bookings and tickets across all passengers & routes'
              : 'View, print, rate, or cancel your bus tickets'}
          </p>
        </div>
        <button
          onClick={loadBookings}
          style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
        >
          🔄 Refresh Bookings
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '25px', overflowX: 'auto' }}>
        {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              background: activeFilter === tab ? '#008cff' : '#f1f5f9',
              color: activeFilter === tab ? '#ffffff' : '#475569',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', borderRadius: '12px' }}>
          <h3>Loading your booked journeys...</h3>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎫</div>
          <h3 style={{ color: '#1c2430', marginBottom: '6px' }}>No Bookings Found</h3>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            {activeFilter === 'ALL'
              ? 'You have not booked any bus tickets yet. Search routes on home page to book your first trip!'
              : `No ${activeFilter.toLowerCase()} bookings found.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {filteredBookings.map((b) => {
            const isCancelled = (b.status || '').toUpperCase() === 'CANCELLED';
            const pnr = b.pnr || 'SS-XXXXXX';
            const source = b.source || b.from || 'Origin';
            const destination = b.destination || b.to || 'Destination';
            const travelDate = b.travel_date || b.travelDate || 'Date';
            const seatNo = b.seat_no || (Array.isArray(b.seats) ? b.seats.join(', ') : b.seats) || 'Seat';
            const fare = b.total_fare || b.totalAmount || b.fare || 0;
            const passenger = b.passenger_name || b.userName || 'Passenger';

            return (
              <div
                key={pnr}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '22px 25px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  opacity: isCancelled ? 0.75 : 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>PNR Number: </span>
                    <strong style={{ color: '#008cff', fontSize: '15px' }}>{pnr}</strong>
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: isCancelled ? '#fee2e2' : '#dcfce7',
                      color: isCancelled ? '#dc2626' : '#16a34a'
                    }}
                  >
                    {isCancelled ? 'CANCELLED' : 'CONFIRMED'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Route</div>
                    <strong style={{ color: '#1c2430', fontSize: '15px' }}>{source} ➔ {destination}</strong>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Travel Date</div>
                    <strong style={{ color: '#1c2430' }}>{travelDate}</strong>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Seat Number(s)</div>
                    <strong style={{ color: '#10b981' }}>{seatNo}</strong>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Passenger Name</div>
                    <div style={{ color: '#334155', fontWeight: '600' }}>{passenger}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Total Paid</div>
                    <strong style={{ fontSize: '1.2rem', color: isCancelled ? '#94a3b8' : '#10b981' }}>₹{fare}</strong>
                  </div>
                </div>

                {/* Actions Row */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #f8fafc', paddingTop: '15px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(b)}
                    style={{ padding: '8px 16px', background: '#008cff', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                  >
                    📄 View / Print Ticket
                  </button>

                  {!isCancelled && (
                    <>
                      <button
                        type="button"
                        onClick={() => setReviewPNR(pnr)}
                        style={{ padding: '8px 16px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                      >
                        ⭐ Rate Journey
                      </button>

                      <button
                        type="button"
                        onClick={() => setCancellingPNR(pnr)}
                        style={{ padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                      >
                        ✕ Cancel Ticket
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Preview & Print Modal */}
      {selectedTicket && (
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
              maxWidth: '480px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            {/* Printable Area */}
            <div id="printable-ticket" style={{ padding: '25px', background: '#ffffff' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px dashed #008cff', paddingBottom: '15px', marginBottom: '15px' }}>
                <h2 style={{ margin: '0 0 4px 0', color: '#008cff' }}>🚌 SafarSathi Bus E-Ticket</h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Authorized Passenger Travel Voucher</p>
              </div>

              {/* QR Code */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '15px 0' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=SAFARSATHI-PNR-${selectedTicket.pnr}`}
                  alt="Ticket QR Code"
                  style={{ border: '1px solid #cbd5e1', padding: '6px', borderRadius: '8px' }}
                />
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>PNR Number:</td>
                    <td style={{ padding: '6px 0', fontWeight: 'bold', textAlign: 'right', color: '#008cff' }}>{selectedTicket.pnr}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Passenger:</td>
                    <td style={{ padding: '6px 0', fontWeight: 'bold', textAlign: 'right' }}>{selectedTicket.passenger_name || selectedTicket.userName || 'Passenger'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Route:</td>
                    <td style={{ padding: '6px 0', fontWeight: 'bold', textAlign: 'right' }}>{selectedTicket.source || selectedTicket.from} ➔ {selectedTicket.destination || selectedTicket.to}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Travel Date:</td>
                    <td style={{ padding: '6px 0', fontWeight: 'bold', textAlign: 'right' }}>{selectedTicket.travel_date || selectedTicket.travelDate}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Seat Number(s):</td>
                    <td style={{ padding: '6px 0', fontWeight: 'bold', textAlign: 'right', color: '#10b981' }}>{selectedTicket.seat_no || selectedTicket.seats}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 0 0', fontWeight: 'bold' }}>Total Fare:</td>
                    <td style={{ padding: '10px 0 0', fontWeight: '800', textAlign: 'right', fontSize: '16px', color: '#10b981' }}>₹{selectedTicket.total_fare || selectedTicket.totalAmount}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div style={{ background: '#f8fafc', padding: '15px 25px', display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                style={{ padding: '8px 16px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ padding: '8px 18px', background: '#008cff', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🖨️ Print Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingPNR && (
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
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ width: '50px', height: '50px', background: '#fee2e2', color: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px' }}>
              ✕
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1c2430' }}>Cancel Ticket Confirmation</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              Are you sure you want to cancel ticket for PNR: <strong style={{ color: '#008cff' }}>{cancellingPNR}</strong>?
              The ticket fare will be automatically refunded back to your SafarSathi wallet.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setCancellingPNR(null)}
                style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                No, Keep It
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                style={{ flex: 1, padding: '10px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Yes, Cancel Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewPNR && (
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
              maxWidth: '440px',
              width: '100%',
              padding: '25px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <h3 style={{ margin: '0 0 15px 0', color: '#1c2430' }}>Rate Your Bus Journey</h3>
            <form onSubmit={handleSubmitReview}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                  Star Rating
                </label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 - Excellent)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 - Very Good)</option>
                  <option value={3}>⭐⭐⭐ (3 - Average)</option>
                  <option value={2}>⭐⭐ (2 - Below Average)</option>
                  <option value={1}>⭐ (1 - Poor)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                  Feedback / Comments
                </label>
                <textarea
                  rows="3"
                  placeholder="Share details about punctuality, cleanliness, bus staff..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setReviewPNR(null)}
                  style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', background: '#008cff', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

