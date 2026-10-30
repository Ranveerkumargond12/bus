import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const fromLocation = searchParams.get('from') || '';
  const toLocation = searchParams.get('to') || '';
  const travelDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [maxPrice, setMaxPrice] = useState(2500);
  const [highestFoundPrice, setHighestFoundPrice] = useState(2500);
  const [selectedTypes, setSelectedTypes] = useState({
    ac: false,
    sleeper: false,
    seater: false
  });

  // Search input state for top search bar
  const [inputFrom, setInputFrom] = useState(fromLocation);
  const [inputTo, setInputTo] = useState(toLocation);
  const [inputDate, setInputDate] = useState(travelDate);

  useEffect(() => {
    async function fetchBuses() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.buses.search({
          from: fromLocation,
          to: toLocation,
          date: travelDate
        });
        const busList = Array.isArray(data) ? data : (data.buses || []);
        setBuses(busList);

        if (busList.length > 0) {
          const maxP = Math.max(...busList.map(b => Number(b.fare) || 0), 2000);
          setHighestFoundPrice(maxP);
          setMaxPrice(maxP);
        }
      } catch (err) {
        console.error('Error fetching buses:', err);
        setError('Failed to load buses from server. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }

    fetchBuses();
  }, [fromLocation, toLocation, travelDate]);

  const handleTopSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({
      from: inputFrom.trim(),
      to: inputTo.trim(),
      date: inputDate
    });
  };

  const handleTypeFilterChange = (type) => {
    setSelectedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Filter logic
  const filteredBuses = buses.filter(bus => {
    const fare = Number(bus.fare) || 0;
    if (fare > maxPrice) return false;

    const hasTypeFilters = Object.values(selectedTypes).some(Boolean);
    if (!hasTypeFilters) return true;

    const busTypeStr = (bus.bus_type || '').toLowerCase();
    if (selectedTypes.ac && busTypeStr.includes('ac')) return true;
    if (selectedTypes.sleeper && busTypeStr.includes('sleeper')) return true;
    if (selectedTypes.seater && busTypeStr.includes('seater')) return true;

    return false;
  });

  const handleSelectSeats = (bus) => {
    const params = new URLSearchParams({
      busId: bus.id,
      from: fromLocation || bus.source,
      to: toLocation || bus.destination,
      date: travelDate
    });
    navigate(`/seat-selection?${params.toString()}`);
  };

  return (
    <div className="search-results-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '25px 20px' }}>
      {/* Search Header Strip */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '18px 24px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          marginBottom: '25px'
        }}
      >
        <form onSubmit={handleTopSearchSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>From</label>
            <input
              type="text"
              value={inputFrom}
              onChange={(e) => setInputFrom(e.target.value)}
              placeholder="Departure City"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '600' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>To</label>
            <input
              type="text"
              value={inputTo}
              onChange={(e) => setInputTo(e.target.value)}
              placeholder="Destination City"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '600' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '140px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Journey Date</label>
            <input
              type="date"
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '600' }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '10px 24px',
              backgroundColor: '#008cff',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            Modify Search
          </button>
        </form>
      </div>

      {/* Route Headline Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', color: '#1c2430', fontSize: '1.4rem' }}>
            {fromLocation || toLocation ? `${fromLocation || 'Any'} ➔ ${toLocation || 'Any'}` : 'All Available Buses'}
          </h2>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Travel Date: <strong>{travelDate}</strong> ({filteredBuses.length} buses found)
          </span>
        </div>
      </div>

      {/* Main Grid: Filters Sidebar + Bus Cards List */}
      <div className="search-results-grid">
        {/* Filters Sidebar */}
        <aside
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1c2430' }}>Filters</h3>
            <button
              onClick={() => {
                setMaxPrice(highestFoundPrice);
                setSelectedTypes({ ac: false, sleeper: false, seater: false });
              }}
              style={{ background: 'none', border: 'none', color: '#008cff', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Reset
            </button>
          </div>

          {/* Price Range */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Max Price</label>
              <span style={{ fontWeight: 'bold', color: '#008cff' }}>₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="500"
              max={highestFoundPrice}
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
              <span>₹500</span>
              <span>₹{highestFoundPrice}</span>
            </div>
          </div>

          {/* Bus Types */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '10px' }}>
              Bus Type
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={selectedTypes.ac}
                  onChange={() => handleTypeFilterChange('ac')}
                />
                AC Buses
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={selectedTypes.sleeper}
                  onChange={() => handleTypeFilterChange('sleeper')}
                />
                Sleeper Berths
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={selectedTypes.seater}
                  onChange={() => handleTypeFilterChange('seater')}
                />
                Seater Buses
              </label>
            </div>
          </div>
        </aside>

        {/* Bus List */}
        <div>
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>🚌</div>
              <h3 style={{ color: '#1c2430', margin: '0 0 5px 0' }}>Searching Available Buses...</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Finding real-time routes and verified seats</p>
            </div>
          )}

          {error && (
            <div style={{ padding: '25px', background: '#fee2e2', borderRadius: '12px', border: '1px solid #f87171', color: '#991b1b', textAlign: 'center' }}>
              <h3>Connection Notice</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && filteredBuses.length === 0 && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '50px 30px',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '15px' }}>🔍</div>
              <h3 style={{ color: '#1c2430', marginBottom: '8px' }}>No Buses Available</h3>
              <p style={{ color: '#64748b', margin: '0 0 15px 0' }}>
                No active buses found matching "{fromLocation || 'Any'} ➔ {toLocation || 'Any'}" on {travelDate}.
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
                All bus routes in SafarSathi are added and managed by the administrator.
              </p>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                style={{
                  padding: '9px 20px',
                  background: '#008cff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                ⚙️ Admin Panel: Add Bus to Fleet
              </button>
            </div>
          )}

          {!loading && filteredBuses.map((bus) => (
            <div
              key={bus.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '22px 24px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              {/* Bus Name & Type */}
              <div style={{ flex: '2', minWidth: '220px' }}>
                <h3 style={{ margin: '0 0 6px 0', color: '#1c2430', fontSize: '1.15rem' }}>
                  {bus.bus_name} {bus.bus_number && <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 'normal' }}>({bus.bus_number})</span>}
                </h3>
                <div style={{ color: '#008cff', fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>
                  {bus.source} ➔ {bus.destination}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  {bus.bus_type}
                </div>
                <div style={{ marginTop: '10px', fontSize: '0.85rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    ⭐ {bus.rating || '4.5'}
                  </span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                    {bus.available_seats !== undefined ? `${bus.available_seats} Seats Left` : 'Available'}
                  </span>
                </div>
              </div>

              {/* Timing & Duration */}
              <div style={{ flex: '1', minWidth: '150px', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', color: '#1c2430', fontSize: '1.1rem' }}>
                  {bus.departure_time} ➔ {bus.arrival_time}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                  {bus.duration || 'Approx. 10 hrs'}
                </div>
              </div>

              {/* Price & Action */}
              <div style={{ textAlign: 'right', minWidth: '140px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981', marginBottom: '8px' }}>
                  ₹{bus.fare}
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectSeats(bus)}
                  style={{
                    padding: '10px 22px',
                    backgroundColor: '#008cff',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 10px rgba(0, 140, 255, 0.25)',
                    transition: 'background 0.2s'
                  }}
                >
                  Select Seats
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

