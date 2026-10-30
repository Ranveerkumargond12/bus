import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export function SeatSelectionPage() {
  const TOTAL_SEATS = 24;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const busId = searchParams.get('busId') || '1';
  const fromLoc = searchParams.get('from') || 'Mumbai';
  const toLoc = searchParams.get('to') || 'Goa';
  const [travelDate, setTravelDate] = useState(() => searchParams.get('date') || new Date().toISOString().split('T')[0]);

  const handleDateChange = (newDate) => {
    setTravelDate(newDate);
    setSelectedSeats([]); // reset seats when switching journey date
    const updated = new URLSearchParams(searchParams);
    updated.set('date', newDate);
    setSearchParams(updated);
  };

  const [bus, setBus] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stop-wise Boarding & Dropping Selection
  const [selectedBoardingStop, setSelectedBoardingStop] = useState(fromLoc);
  const [selectedDroppingStop, setSelectedDroppingStop] = useState(toLoc);

  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoStatus, setPromoStatus] = useState(null); // { type: 'success' | 'error', text: '' }

  // Load Bus details and Booked Seats from Backend
  useEffect(() => {
    async function loadSeatData() {
      setLoading(true);
      try {
        // Fetch Bus
        let loadedBus = null;
        const busRes = await api.buses.getById(busId);
        if (busRes && busRes.bus) {
          loadedBus = busRes.bus;
        } else {
          // Fallback if returned directly
          const allBuses = await api.buses.search();
          loadedBus = (Array.isArray(allBuses) ? allBuses : []).find(b => String(b.id) === String(busId)) || null;
        }

        if (loadedBus) {
          setBus(loadedBus);
          setSelectedBoardingStop(searchParams.get('from') || loadedBus.source || fromLoc);
          setSelectedDroppingStop(searchParams.get('to') || loadedBus.destination || toLoc);
        }

        // Fetch Booked Seats
        const occupied = await api.seats.getBookedSeats(busId, travelDate);
        if (Array.isArray(occupied)) {
          setBookedSeats(occupied.map(s => String(s).trim().toUpperCase()));
        }
      } catch (err) {
        console.error('Failed to load seats or bus data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSeatData();
  }, [busId, travelDate]);

  // Build ordered route stops list: [Origin, ...Intermediate Stops, Final Destination]
  const allRouteStops = React.useMemo(() => {
    if (!bus) return [];
    const list = [
      {
        stop_name: bus.source,
        fare: 0,
        distance: '0 KM',
        arrival_time: bus.departure_time || ''
      }
    ];
    const midStops = Array.isArray(bus.route_stops) ? bus.route_stops : [];
    midStops.forEach(st => {
      if (st && st.stop_name) {
        list.push({
          stop_name: st.stop_name,
          fare: Number(st.fare) || 0,
          distance: st.distance || '',
          arrival_time: st.arrival_time || ''
        });
      }
    });
    list.push({
      stop_name: bus.destination,
      fare: Number(bus.fare) || 850,
      distance: bus.distance || '',
      arrival_time: bus.arrival_time || ''
    });
    return list;
  }, [bus]);

  // Compute dynamic stop-to-stop fare & distance
  const { seatPrice, stopDistance } = React.useMemo(() => {
    const defaultPrice = bus ? Number(bus.fare) || 850 : 850;
    const defaultDist = bus?.distance || `${selectedBoardingStop} to ${selectedDroppingStop}`;
    if (allRouteStops.length <= 2) {
      return { seatPrice: defaultPrice, stopDistance: defaultDist };
    }
    const fromObj = allRouteStops.find(s => s.stop_name.toLowerCase() === (selectedBoardingStop || '').toLowerCase()) || allRouteStops[0];
    const toObj = allRouteStops.find(s => s.stop_name.toLowerCase() === (selectedDroppingStop || '').toLowerCase()) || allRouteStops[allRouteStops.length - 1];

    const diffFare = Number(toObj.fare) - Number(fromObj.fare);
    const computedPrice = diffFare > 0 ? diffFare : (Number(toObj.fare) > 0 ? Number(toObj.fare) : defaultPrice);
    const computedDist = toObj.distance ? `${selectedBoardingStop} ➔ ${selectedDroppingStop} (${toObj.distance})` : `${selectedBoardingStop} ➔ ${selectedDroppingStop}`;
    return { seatPrice: computedPrice, stopDistance: computedDist };
  }, [bus, allRouteStops, selectedBoardingStop, selectedDroppingStop]);

  const busName = bus ? bus.bus_name : 'Express Bus';

  const toggleSeat = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(prev => prev.filter(s => s !== seatId));
    } else {
      setSelectedSeats(prev => [...prev, seatId]);
    }
  };

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoStatus({ type: 'error', text: 'Please enter a promo code' });
      return;
    }

    const count = selectedSeats.length;
    if (count === 0) {
      setPromoStatus({ type: 'error', text: 'Please select seats first' });
      return;
    }

    const baseTotal = count * seatPrice;

    try {
      const res = await api.coupons.apply(code, baseTotal);
      if (res.success) {
        setAppliedDiscount(res.discount);
        setPromoStatus({ type: 'success', text: `✨ ${res.message} (-₹${res.discount})` });
      } else {
        setPromoStatus({ type: 'error', text: res.message || 'Invalid coupon' });
      }
    } catch (err) {
      // Local fallback for offline/instant coupons
      if (code === 'FIRST50') {
        const disc = Math.min(200, baseTotal);
        setAppliedDiscount(disc);
        setPromoStatus({ type: 'success', text: '✨ Code FIRST50 Applied! (₹200 Off)' });
      } else if (code === 'TRAVELGO') {
        const disc = Math.min(150, baseTotal);
        setAppliedDiscount(disc);
        setPromoStatus({ type: 'success', text: '✨ Code TRAVELGO Applied! (₹150 Off)' });
      } else {
        setPromoStatus({ type: 'error', text: err.message || 'Invalid coupon code' });
      }
    }
  };

  const seatCount = selectedSeats.length;
  const rawBaseFare = seatCount * seatPrice;
  const finalTotal = Math.max(0, rawBaseFare - appliedDiscount);

  const handleProceedToCheckout = async () => {
    if (seatCount === 0) return;

    // Temporary hold seats via API to reserve them for 10 minutes
    try {
      await api.seats.holdSeats({
        bus_id: busId,
        travel_date: travelDate,
        seats: selectedSeats
      });
    } catch (holdErr) {
      console.warn('Seat hold reservation warning:', holdErr);
    }

    const bookingPayload = {
      busId: busId,
      busName: busName,
      seats: selectedSeats,
      seatCount: seatCount,
      baseSeatPrice: seatPrice,
      baseFare: rawBaseFare,
      discount: appliedDiscount,
      promoCode: appliedDiscount > 0 ? promoCode : '',
      from: selectedBoardingStop || fromLoc,
      to: selectedDroppingStop || toLoc,
      stopDistance: stopDistance,
      travelDate: travelDate
    };

    localStorage.setItem('travelgo_booking_data', JSON.stringify(bookingPayload));
    localStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));

    const params = new URLSearchParams({
      busId: busId,
      from: selectedBoardingStop || fromLoc,
      to: selectedDroppingStop || toLoc,
      date: travelDate
    });
    navigate(`/passenger?${params.toString()}`);
  };

  return (
    <div className="seat-selection-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px 20px' }}>
      {/* Route Header with Interactive Date Picker & Stop-wise Fare Selector */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: '#1c2430' }}>
              {selectedBoardingStop || fromLoc} ➔ {selectedDroppingStop || toLoc}
            </h2>
            <div style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Bus: <strong style={{ color: '#008cff' }}>{busName}</strong> | Seat Fare: <strong style={{ color: '#10b981' }}>₹{seatPrice}</strong>
              {stopDistance && <span> | 🛣️ <strong>{stopDistance}</strong></span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f0f9ff', padding: '10px 16px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#0369a1' }}>
              📅 Select Journey Date:
            </label>
            <input
              type="date"
              value={travelDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => handleDateChange(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #008cff',
                fontWeight: 'bold',
                color: '#1e293b',
                background: '#ffffff',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>

        {/* Stop-wise Boarding & Dropping Selector (if bus has stops) */}
        {allRouteStops.length > 2 && (
          <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#0369a1', marginBottom: '5px' }}>
                🚏 Select Boarding Stop (Kahan se baithenge)
              </label>
              <select
                value={selectedBoardingStop}
                onChange={(e) => setSelectedBoardingStop(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #008cff', fontWeight: 'bold', color: '#1e293b', background: '#f8fafc' }}
              >
                {allRouteStops.slice(0, -1).map((st, i) => (
                  <option key={i} value={st.stop_name}>
                    📍 {st.stop_name} {st.arrival_time ? `(${st.arrival_time})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#15803d', marginBottom: '5px' }}>
                🏁 Select Dropping Stop (Kahan utrenge - Stop Price)
              </label>
              <select
                value={selectedDroppingStop}
                onChange={(e) => setSelectedDroppingStop(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #10b981', fontWeight: 'bold', color: '#1e293b', background: '#f0fdf4' }}
              >
                {allRouteStops.slice(1).map((st, i) => (
                  <option key={i} value={st.stop_name}>
                    🏁 {st.stop_name} — ₹{st.fare} {st.distance ? `(${st.distance})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ background: '#ecfdf5', padding: '10px 14px', borderRadius: '8px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#047857', fontWeight: 'bold' }}>Selected Stop Ticket Price</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>₹{seatPrice} / seat</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Layout + Summary */}
      <div className="seat-selection-grid">
        {/* Seat Layout Card */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <h3 style={{ margin: 0, color: '#1c2430' }}>Select Your Seats</h3>
            <div style={{ display: 'flex', gap: '15px', fontSize: '12px', fontWeight: 'bold' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '14px', height: '14px', background: '#f8fafc', border: '1px solid #94a3b8', borderRadius: '3px' }}></span> Available
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '14px', height: '14px', background: '#008cff', borderRadius: '3px' }}></span> Selected
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '14px', height: '14px', background: '#fce7f3', border: '1px solid #ec4899', borderRadius: '3px' }}></span> Female Only
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '14px', height: '14px', background: '#fee2e2', border: '1.5px solid #ef4444', borderRadius: '3px' }}></span> 🔒 Booked (Sold Out)
              </span>
            </div>
          </div>

          {/* Bus Front Indicator */}
          <div style={{ textAlign: 'center', margin: '15px 0 25px 0', padding: '8px', background: '#f1f5f9', borderRadius: '8px', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>
            🚍 FRONT (DRIVER CABIN)
          </div>

          {/* 24 Seat Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 54px) 32px repeat(2, 54px)',
              gap: '10px',
              justifyContent: 'center',
              padding: '20px 0',
              overflowX: 'auto',
              maxWidth: '100%'
            }}
          >
            {Array.from({ length: TOTAL_SEATS }, (_, idx) => {
              const seatNum = idx + 1;
              const seatId = `S${seatNum}`;
              const isFemaleReserved = (seatNum % 4 === 1);
              const isBooked = bookedSeats.some(s => String(s).trim().toUpperCase() === seatId.toUpperCase());
              const isSelected = selectedSeats.includes(seatId);

              // Check if aisle separator needed (after column 2)
              const isAisleColumn = (seatNum % 4 === 2);

              return (
                <React.Fragment key={seatId}>
                  <button
                    type="button"
                    disabled={isBooked}
                    onClick={() => {
                      if (isBooked) {
                        alert(`Seat ${seatId} has already been booked for ${travelDate}! Please select an available seat.`);
                        return;
                      }
                      toggleSeat(seatId);
                    }}
                    title={isBooked ? `🔒 Seat ${seatId} is already booked for ${travelDate}` : isFemaleReserved ? 'Reserved for Female Passengers' : `Seat ${seatId} (₹${seatPrice})`}
                    style={{
                      height: '55px',
                      borderRadius: '8px',
                      border: isBooked
                        ? '2px solid #ef4444'
                        : isSelected
                        ? '2px solid #0077d4'
                        : isFemaleReserved
                        ? '2px solid #ec4899'
                        : '1px solid #cbd5e1',
                      background: isBooked
                        ? '#fee2e2'
                        : isSelected
                        ? '#008cff'
                        : isFemaleReserved
                        ? '#fce7f3'
                        : '#ffffff',
                      color: isBooked
                        ? '#dc2626'
                        : isSelected
                        ? '#ffffff'
                        : isFemaleReserved
                        ? '#be185d'
                        : '#1c2430',
                      fontWeight: 'bold',
                      fontSize: isBooked ? '11px' : '13px',
                      cursor: isBooked ? 'not-allowed' : 'pointer',
                      boxShadow: isSelected ? '0 4px 10px rgba(0, 140, 255, 0.3)' : 'none',
                      transition: 'all 0.15s ease',
                      opacity: isBooked ? 0.9 : 1
                    }}
                  >
                    {isBooked ? `🔒 ${seatId}` : seatId}
                  </button>
                  {isAisleColumn && <div key={`aisle-${seatNum}`} style={{ width: '40px' }} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Fare Summary Sidebar */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1c2430', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            Booking Summary
          </h3>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#475569' }}>
            <span>Selected Seats:</span>
            <strong style={{ color: '#008cff' }}>{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#475569' }}>
            <span>Seat Count:</span>
            <strong>{seatCount}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px', color: '#475569' }}>
            <span>Base Fare:</span>
            <strong>₹{rawBaseFare}</strong>
          </div>

          {/* Promo Code Box */}
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>
              Have a Promo Code?
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="FIRST50 / TRAVELGO"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                style={{ background: '#1c2430', color: '#ffffff', border: 'none', padding: '0 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Apply
              </button>
            </div>
            {promoStatus && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: promoStatus.type === 'success' ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                {promoStatus.text}
              </div>
            )}
          </div>

          {appliedDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#10b981' }}>
              <span>Promo Discount:</span>
              <strong>-₹{appliedDiscount}</strong>
            </div>
          )}

          <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1c2430' }}>Total Amount:</span>
            <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981' }}>₹{finalTotal}</span>
          </div>

          <button
            type="button"
            disabled={seatCount === 0}
            onClick={handleProceedToCheckout}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: seatCount > 0 ? '#008cff' : '#cbd5e1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: seatCount > 0 ? 'pointer' : 'not-allowed',
              boxShadow: seatCount > 0 ? '0 4px 15px rgba(0, 140, 255, 0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {seatCount > 0 ? `Continue for ₹${finalTotal}` : 'Select At Least 1 Seat'}
          </button>
        </div>
      </div>
    </div>
  );
}

