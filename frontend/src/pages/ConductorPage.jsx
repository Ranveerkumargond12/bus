import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/Toast';

export function ConductorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isConductor = user?.role === 'conductor';

  const initialBusId = isConductor
    ? String(user?.bus_id || user?.id || '')
    : (searchParams.get('busId') || '');

  const [buses, setBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState(initialBusId);
  const [isUnlocked, setIsUnlocked] = useState(isConductor || isAdmin);

  const [filterDate, setFilterDate] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [busDetails, setBusDetails] = useState(null);
  const [seatPassengers, setSeatPassengers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Redirect unauthenticated or non-conductor/non-admin users to Login page
  useEffect(() => {
    if (!authLoading && (!user || (!isAdmin && !isConductor))) {
      navigate('/auth');
    }
  }, [authLoading, user, isAdmin, isConductor, navigate]);

  // Load bus manifest automatically for logged-in Conductor or Admin
  useEffect(() => {
    if (!user) return;

    if (isConductor) {
      const cBusId = String(user.bus_id || user.id || '');
      if (cBusId) {
        setSelectedBusId(cBusId);
        setIsUnlocked(true);
        fetchManifest(cBusId, filterDate);
      }
      return;
    }

    if (isAdmin) {
      async function loadBusesForAdmin() {
        try {
          const res = await api.conductor.getBuses();
          const list = res?.buses || (Array.isArray(res) ? res : []);
          setBuses(list);

          const targetId = searchParams.get('busId') || (list.length > 0 ? String(list[0].id) : '');
          if (targetId) {
            setSelectedBusId(String(targetId));
            setIsUnlocked(true);
            fetchManifest(targetId, filterDate);
          }
        } catch (err) {
          console.error('Error loading buses for admin:', err);
        }
      }
      loadBusesForAdmin();
    }
  }, [user, isAdmin, isConductor]);

  const fetchManifest = async (bId, dateVal = filterDate) => {
    if (!bId) return;
    setLoading(true);
    try {
      const res = await api.conductor.getManifest(bId, dateVal);
      if (res && res.success) {
        setBusDetails(res.bus);
        setSeatPassengers(res.seat_passengers || []);
        setBookings(res.bookings || []);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load bus ticket manifest' });
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (newDate) => {
    setFilterDate(newDate);
    if (isUnlocked && selectedBusId) {
      fetchManifest(selectedBusId, newDate);
    }
  };

  const handleToggleBoarding = async (pnr, currentStatus) => {
    const nextStatus = currentStatus === 'Boarded' ? 'Pending' : 'Boarded';
    try {
      const res = await api.conductor.updateBoarding(pnr, nextStatus);
      if (res && res.success) {
        setToast({ type: 'success', message: `PNR ${pnr} marked as ${nextStatus}` });
        fetchManifest(selectedBusId, filterDate);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update boarding status' });
    }
  };

  // Filtered passenger rows by search query (Name, Seat, PNR, Date)
  const filteredRows = seatPassengers.filter(row => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (row.passenger_name || '').toLowerCase().includes(q) ||
      (row.seat_no || '').toLowerCase().includes(q) ||
      (row.pnr || '').toLowerCase().includes(q) ||
      (row.travel_date || '').toLowerCase().includes(q)
    );
  });

  // Map seat number -> passenger info for visual seat chart
  const seatMap = {};
  seatPassengers.forEach(sp => {
    seatMap[sp.seat_no.toUpperCase()] = sp;
  });

  const totalCapacity = Number(busDetails?.seats_capacity) || 24;

  return (
    <div className="conductor-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, color: '#1c2430' }}>🧑‍✈️ Bus Conductor Ticket & Passenger Portal</h2>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
              Live Bus Sheet
            </span>
          </div>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            View booked tickets, passenger names, seat numbers, route distance, and journey dates
          </p>
        </div>

        {isUnlocked && (
          <div style={{ display: 'flex', gap: '10px' }}>
            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                style={{ padding: '9px 16px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ← Back to Admin Panel
              </button>
            )}
            <button
              type="button"
              onClick={() => fetchManifest(selectedBusId, filterDate)}
              style={{ padding: '9px 16px', background: '#008cff', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🔄 Refresh Tickets
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              style={{ padding: '9px 16px', background: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🖨️ Print Sheet
            </button>
          </div>
        )}
      </div>

      {/* Bus Selector (Only shown for Admin to inspect different buses) */}
      {isAdmin && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px', marginBottom: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
            🚌 Switch Bus Manifest (Admin View)
          </label>
          <select
            value={selectedBusId}
            onChange={(e) => {
              setSelectedBusId(e.target.value);
              setSearchParams({ busId: e.target.value });
              setIsUnlocked(true);
              fetchManifest(e.target.value, filterDate);
            }}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #008cff', fontWeight: 'bold', color: '#1e293b', background: '#f8fafc' }}
          >
            <option value="">-- Choose Bus --</option>
            {buses.map(b => (
              <option key={b.id} value={b.id}>
                #{b.id} {b.bus_name} ({b.bus_number || 'Bus'}) — {b.source} ➔ {b.destination} {b.conductor_name ? `[Conductor: ${b.conductor_name}]` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Conductor Manifest View */}
      {isUnlocked && busDetails && (
        <>
          {/* Bus & Conductor Info Banner */}
          <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '25px', boxShadow: '0 8px 25px rgba(15, 23, 42, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#93c5fd', fontWeight: 'bold' }}>
                  {busDetails.bus_type} • Plate: {busDetails.bus_number || 'N/A'}
                </div>
                <h3 style={{ margin: '4px 0 8px 0', fontSize: '1.6rem', color: '#ffffff' }}>
                  🚌 {busDetails.bus_name}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '14px', color: '#e2e8f0' }}>
                  <span>📍 <strong>Route:</strong> {busDetails.source} ➔ {busDetails.destination}</span>
                  <span>🛣️ <strong>Distance:</strong> <strong style={{ color: '#fde047' }}>{busDetails.distance || `${busDetails.source} - ${busDetails.destination}`}</strong></span>
                  <span>⏰ <strong>Timing:</strong> {busDetails.departure_time} - {busDetails.arrival_time} ({busDetails.duration})</span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', minWidth: '240px' }}>
                <div style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 'bold' }}>Assigned Bus Conductor</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '4px', color: '#ffffff' }}>
                  🧑‍✈️ {busDetails.conductor_name || 'Assigned Conductor'}
                </div>
                <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '2px' }}>
                  📞 {busDetails.conductor_phone || 'Contact Admin'}
                </div>
              </div>
            </div>

            {/* Filter by Journey Date & Search */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#93c5fd' }}>📅 Filter Journey Date:</span>
                <button
                  type="button"
                  onClick={() => handleDateFilterChange('ALL')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: filterDate === 'ALL' ? '#10b981' : 'rgba(255,255,255,0.15)',
                    color: '#ffffff'
                  }}
                >
                  All Dates ({seatPassengers.length})
                </button>
                <input
                  type="date"
                  value={filterDate === 'ALL' ? '' : filterDate}
                  onChange={(e) => handleDateFilterChange(e.target.value || 'ALL')}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', fontSize: '14px', fontWeight: 'bold' }}>
                <span style={{ background: 'rgba(16, 185, 129, 0.25)', padding: '6px 12px', borderRadius: '8px', color: '#6ee7b7' }}>
                  💺 Booked Seats: {seatPassengers.length} / {totalCapacity}
                </span>
                <span style={{ background: 'rgba(59, 130, 246, 0.25)', padding: '6px 12px', borderRadius: '8px', color: '#93c5fd' }}>
                  🟢 Vacant: {Math.max(0, totalCapacity - seatPassengers.length)}
                </span>
              </div>
            </div>
          </div>

          {/* Passenger Tickets Table (Name, Seat No, Distance Name, Date) */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ margin: 0, color: '#1c2430' }}>
                🎫 Booked Passenger List ({filteredRows.length} Seats)
              </h3>
              <input
                type="text"
                placeholder="🔍 Search Name, Seat (e.g. S1), PNR, Date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', minWidth: '280px', fontSize: '13px' }}
              />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading bus passenger chart...</div>
            ) : filteredRows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '45px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>💺</div>
                <h4 style={{ margin: '0 0 6px 0', color: '#1c2430' }}>No Booked Tickets Found for This Bus</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                  {filterDate !== 'ALL'
                    ? `No tickets booked on ${filterDate}. Click "All Dates" above to view all bookings for this bus.`
                    : 'Whenever a passenger books a seat on this bus, their Name, Seat No, Distance & Date will appear here immediately.'}
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#334155' }}>
                      <th style={{ padding: '12px 10px' }}>Seat No.</th>
                      <th style={{ padding: '12px 10px' }}>Passenger Name</th>
                      <th style={{ padding: '12px 10px' }}>Route & Distance Name</th>
                      <th style={{ padding: '12px 10px' }}>Journey Date</th>
                      <th style={{ padding: '12px 10px' }}>Ticket PNR</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>Boarding Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => (
                      <tr key={`${row.pnr}-${row.seat_no}-${idx}`} style={{ borderBottom: '1px solid #e2e8f0', background: row.boarding_status === 'Boarded' ? '#f0fdf4' : '#ffffff' }}>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ background: '#008cff', color: '#ffffff', padding: '5px 12px', borderRadius: '6px', fontWeight: '800', fontSize: '14px', display: 'inline-block' }}>
                            💺 {row.seat_no}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>👤 {row.passenger_name}</div>
                          {(row.passenger_age || row.passenger_gender) && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {row.passenger_gender} {row.passenger_age ? `• ${row.passenger_age} yrs` : ''}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: 'bold', color: '#0369a1' }}>
                            {row.source} ➔ {row.destination}
                          </div>
                          <div style={{ fontSize: '12px', color: '#0f766e', fontWeight: '600', marginTop: '2px' }}>
                            🛣️ Distance: {row.distance || `${row.source} to ${row.destination}`}
                          </div>
                          {(row.boarding_points || row.dropping_points) && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              📍 {row.boarding_points} ➔ {row.dropping_points}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', display: 'inline-block', fontSize: '13px' }}>
                            📅 {row.travel_date}
                          </div>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{row.pnr}</div>
                          <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold', marginTop: '2px' }}>
                            ✓ {row.status || 'Confirmed'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleBoarding(row.pnr, row.boarding_status)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              fontWeight: 'bold',
                              fontSize: '12px',
                              cursor: 'pointer',
                              background: row.boarding_status === 'Boarded' ? '#16a34a' : '#f59e0b',
                              color: '#ffffff'
                            }}
                          >
                            {row.boarding_status === 'Boarded' ? '✅ Boarded' : '⏳ Mark Boarded'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Visual Bus Seat Map with Passenger Names */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#1c2430' }}>
              🚌 Visual Seat Chart for {busDetails.bus_name} ({filterDate === 'ALL' ? 'All Active Dates' : filterDate})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
              {Array.from({ length: totalCapacity }, (_, i) => {
                const sId = `S${i + 1}`;
                const occupant = seatMap[sId];
                return (
                  <div
                    key={sId}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: occupant ? '2px solid #ef4444' : '1px dashed #cbd5e1',
                      background: occupant ? '#fef2f2' : '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '800', fontSize: '14px', color: occupant ? '#dc2626' : '#64748b' }}>
                        {occupant ? `🔒 ${sId}` : `🟢 ${sId}`}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', background: occupant ? '#fee2e2' : '#e2e8f0', color: occupant ? '#b91c1c' : '#475569' }}>
                        {occupant ? 'BOOKED' : 'VACANT'}
                      </span>
                    </div>

                    {occupant ? (
                      <div style={{ marginTop: '8px', fontSize: '12px' }}>
                        <div style={{ fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          👤 {occupant.passenger_name}
                        </div>
                        <div style={{ color: '#0369a1', fontSize: '11px', marginTop: '2px' }}>
                          📅 {occupant.travel_date}
                        </div>
                        <div style={{ color: '#0f766e', fontSize: '10px', marginTop: '2px' }}>
                          🛣️ {occupant.distance}
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>
                        Available Seat
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

