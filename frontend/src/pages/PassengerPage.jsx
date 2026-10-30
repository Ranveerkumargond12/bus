import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PassengerPage() {
  const [searchParams] = useSearchParams();
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

  const seats = bookingData?.seats || ['S1'];
  const baseFare = bookingData?.baseFare || (seats.length * 850);
  const discount = bookingData?.discount || 0;

  // Travel Date State (User can choose/confirm journey date)
  const [travelDate, setTravelDate] = useState(() => {
    return searchParams.get('date') || bookingData?.travelDate || new Date().toISOString().split('T')[0];
  });

  // Passenger Forms State
  const [passengers, setPassengers] = useState(() => {
    return seats.map((seat, index) => ({
      seat,
      name: index === 0 && user?.name ? user.name : '',
      age: '',
      gender: 'Male'
    }));
  });

  // Contact State
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');

  // Add-ons State
  const [addons, setAddons] = useState({
    baggage: false,
    insurance: false,
    meal: false
  });

  const handlePassengerChange = (index, field, value) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddonToggle = (key) => {
    setAddons(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Calculate live add-ons total
  let addonsTotal = 0;
  if (addons.baggage) addonsTotal += 150;
  if (addons.insurance) addonsTotal += 49;
  if (addons.meal) addonsTotal += 99;

  const currentTotal = Math.max(0, (baseFare - discount) + addonsTotal);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!user) {
      alert('🔒 Please log in to your SafarSathi account to continue with ticket booking.');
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    // Validation
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].name.trim()) {
        alert(`Please enter full name for Passenger ${i + 1} (Seat ${passengers[i].seat})`);
        return;
      }
      if (!passengers[i].age || Number(passengers[i].age) < 1) {
        alert(`Please enter a valid age for Passenger ${i + 1}`);
        return;
      }
    }

    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      alert('Please enter a valid contact email for ticket delivery.');
      return;
    }

    if (!contactPhone.trim() || contactPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile number for SMS ticket updates.');
      return;
    }

    const selectedAddonsList = [];
    if (addons.baggage) selectedAddonsList.push({ name: 'Extra Baggage (+15kg)', price: 150 });
    if (addons.insurance) selectedAddonsList.push({ name: 'Travel Insurance', price: 49 });
    if (addons.meal) selectedAddonsList.push({ name: 'Snacks & Beverage Box', price: 99 });

    const updatedBooking = {
      ...(bookingData || {}),
      travelDate: travelDate,
      passengers,
      contact: {
        email: contactEmail.trim(),
        phone: contactPhone.trim()
      },
      addons: selectedAddonsList,
      addonsFare: addonsTotal,
      totalAmount: currentTotal
    };

    localStorage.setItem('travelgo_booking_data', JSON.stringify(updatedBooking));
    localStorage.setItem('passengerDetails', JSON.stringify(passengers));

    const params = new URLSearchParams({
      busId: updatedBooking.busId || '',
      date: updatedBooking.travelDate || ''
    });
    navigate(`/payment?${params.toString()}`);
  };

  return (
    <div className="passenger-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px' }}>
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ color: '#1c2430', margin: '0 0 6px 0' }}>Passenger & Contact Information</h2>
        <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
          Please provide passenger details as per Government ID for journey verification.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="passenger-layout-grid">
          {/* Left Form: Passenger Cards & Addons */}
          <div>
            {/* Travel & Journey Date Selector */}
            <div
              style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold', color: '#0369a1', fontSize: '15px' }}>
                  🚌 {bookingData?.from || 'Origin'} ➔ {bookingData?.to || 'Destination'}
                </div>
                <div style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
                  Bus: <strong>{bookingData?.busName || 'Express Bus'}</strong> | Selected Seats: <strong>{seats.join(', ')}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#0369a1' }}>
                  📅 Journey Date:
                </label>
                <input
                  type="date"
                  value={travelDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTravelDate(e.target.value)}
                  required
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1.5px solid #008cff',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    color: '#1e293b',
                    background: '#ffffff',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>

            {/* Passenger Cards */}
            {passengers.map((p, idx) => (
              <div
                key={p.seat}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '20px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ color: '#008cff', fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '18px' }}>
                  Passenger {idx + 1} (Seat {p.seat})
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                  {/* Name */}
                  <div>
                    <label style={{ display: 'block', color: '#475569', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={p.name}
                      onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <label style={{ display: 'block', color: '#475569', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                      Age *
                    </label>
                    <input
                      type="number"
                      placeholder="Age"
                      min="1"
                      max="100"
                      value={p.age}
                      onChange={(e) => handlePassengerChange(idx, 'age', e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label style={{ display: 'block', color: '#475569', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                      Gender *
                    </label>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '14px' }}>
                        <input
                          type="radio"
                          name={`gender_${p.seat}`}
                          value="Male"
                          checked={p.gender === 'Male'}
                          onChange={() => handlePassengerChange(idx, 'gender', 'Male')}
                        />
                        Male
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '14px' }}>
                        <input
                          type="radio"
                          name={`gender_${p.seat}`}
                          value="Female"
                          checked={p.gender === 'Female'}
                          onChange={() => handlePassengerChange(idx, 'gender', 'Female')}
                        />
                        Female
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Contact Details Card */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
              }}
            >
              <h3 style={{ margin: '0 0 15px 0', color: '#1c2430', fontSize: '1.1rem' }}>
                Contact Information (Ticket will be sent here)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', color: '#475569', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#475569', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
              </div>
            </div>

            {/* Travel Add-ons Card */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
              }}
            >
              <h3 style={{ margin: '0 0 15px 0', color: '#1c2430', fontSize: '1.1rem' }}>
                Optional Travel Add-ons
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={addons.baggage}
                      onChange={() => handleAddonToggle('baggage')}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1c2430', fontSize: '14px' }}>🧳 Extra Baggage Protection (+15kg)</div>
                      <div style={{ color: '#64748b', fontSize: '12px' }}>Careful baggage handling and excess weight allowance</div>
                    </div>
                  </div>
                  <strong style={{ color: '#008cff' }}>+₹150</strong>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={addons.insurance}
                      onChange={() => handleAddonToggle('insurance')}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1c2430', fontSize: '14px' }}>🛡️ Comprehensive Travel Insurance</div>
                      <div style={{ color: '#64748b', fontSize: '12px' }}>₹5,00,000 emergency medical and accidental cover</div>
                    </div>
                  </div>
                  <strong style={{ color: '#008cff' }}>+₹49</strong>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={addons.meal}
                      onChange={() => handleAddonToggle('meal')}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1c2430', fontSize: '14px' }}>🥪 Snacks & Mineral Water Box</div>
                      <div style={{ color: '#64748b', fontSize: '12px' }}>Packaged refreshments served during boarding</div>
                    </div>
                  </div>
                  <strong style={{ color: '#008cff' }}>+₹99</strong>
                </label>
              </div>
            </div>
          </div>

          {/* Right Summary Sidebar */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '25px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0',
              position: 'sticky',
              top: '20px'
            }}
          >
            <h3 style={{ margin: '0 0 15px 0', color: '#1c2430', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              Fare Breakdown
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#475569' }}>
              <span>Base Ticket Fare ({seats.length} seats):</span>
              <strong>₹{baseFare}</strong>
            </div>

            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#10b981' }}>
                <span>Promo Discount:</span>
                <strong>-₹{discount}</strong>
              </div>
            )}

            {addonsTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#008cff' }}>
                <span>Selected Add-ons:</span>
                <strong>+₹{addonsTotal}</strong>
              </div>
            )}

            <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1c2430' }}>Payable Amount:</span>
              <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981' }}>₹{currentTotal}</span>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#008cff',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0, 140, 255, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              Proceed to Payment ➔
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

