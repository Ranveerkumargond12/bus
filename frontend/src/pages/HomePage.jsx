import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

export function HomePage() {
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(todayStr);
  const [busType, setBusType] = useState('All');
  const [isSwapped, setIsSwapped] = useState(false);
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  useEffect(() => {
    async function loadRoutes() {
      try {
        const res = await api.buses.getPopularRoutes();
        if (res && res.data) {
          setPopularRoutes(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch routes:', err);
      } finally {
        setLoadingRoutes(false);
      }
    }
    loadRoutes();
  }, []);

  const handleSwap = () => {
    setIsSwapped(!isSwapped);
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSearch = (e) => {
    e.preventDefault();

    const cleanFrom = from.trim();
    const cleanTo = to.trim();

    if (!cleanFrom || !cleanTo) {
      alert('Please enter both Departure (From) and Destination (To) cities!');
      return;
    }

    if (cleanFrom.toLowerCase() === cleanTo.toLowerCase()) {
      alert('Origin and Destination cities cannot be the same!');
      return;
    }

    const params = new URLSearchParams({
      from: cleanFrom,
      to: cleanTo,
      date: date || todayStr,
      busType: busType !== 'All' ? busType : ''
    });

    navigate(`/search?${params.toString()}`);
  };

  const handlePopularRoute = (fromCity, toCity) => {
    const params = new URLSearchParams({
      from: fromCity,
      to: toCity,
      date: date || todayStr
    });
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="home-page">
      {/* Hero Banner */}
      <header className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">⚡ Instant Confirmation</div>
          <h1 className="hero-title">SAFE, FAST & COMFORTABLE BUS BOOKING</h1>
          <p className="hero-subtitle">Book tickets for 1000+ routes with real-time seat tracking</p>
        </div>
      </header>

      {/* Floating Search Widget */}
      <div className="search-widget-container">
        <form onSubmit={handleSearch} className="search-widget-form">
          {/* FROM */}
          <div className="form-group">
            <label htmlFor="fromInput">FROM</label>
            <input
              type="text"
              id="fromInput"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Departure City (e.g. Mumbai)"
              required
            />
          </div>

          {/* SWAP BUTTON */}
          <button
            type="button"
            className="btn-swap"
            title="Swap Locations"
            onClick={handleSwap}
            style={{
              transition: 'transform 0.3s ease',
              transform: isSwapped ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            ⇄
          </button>

          {/* TO */}
          <div className="form-group">
            <label htmlFor="toInput">TO</label>
            <input
              type="text"
              id="toInput"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Destination City (e.g. Goa)"
              required
            />
          </div>

          {/* DATE */}
          <div className="form-group">
            <label htmlFor="dateInput">DATE</label>
            <input
              type="date"
              id="dateInput"
              value={date}
              min={todayStr}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* BUS TYPE */}
          <div className="form-group">
            <label htmlFor="busTypeSelect">BUS TYPE</label>
            <select
              id="busTypeSelect"
              value={busType}
              onChange={(e) => setBusType(e.target.value)}
              className="glass-select"
            >
              <option value="All">All Types</option>
              <option value="ac">AC Sleeper</option>
              <option value="seater">Non-AC Seater</option>
            </select>
          </div>

          <button type="submit" className="btn-search">
            Search Buses
          </button>
        </form>
      </div>

      {/* Main Content Blocks */}
      <main className="content-section">
        {/* Popular Bus Routes */}
        <div className="content-block">
          <h2 className="block-title">Popular Bus Routes</h2>
          {loadingRoutes ? (
            <div style={{ textAlign: 'center', padding: '25px', color: '#64748b' }}>
              Loading scheduled routes...
            </div>
          ) : popularRoutes.length > 0 ? (
            <div className="routes-grid">
              {popularRoutes.map((route, idx) => (
                <div
                  key={idx}
                  className="route-card popular-route-link"
                  onClick={() => handlePopularRoute(route.from, route.to)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="route-info">
                    <h3>{route.from} ➔ {route.to}</h3>
                    <p>Starts from ₹{route.minPrice} {route.frequency ? `• ${route.frequency}` : ''}</p>
                  </div>
                  <span className="card-arrow">→</span>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                background: '#ffffff',
                border: '2px dashed #e2e8f0',
                borderRadius: '16px',
                padding: '36px 20px',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚌</div>
              <h3 style={{ color: '#1c2430', margin: '0 0 6px 0', fontSize: '1.15rem' }}>No Bus Routes Scheduled Yet</h3>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px 0' }}>
                All bus routes are managed directly by the administrator. Log in to the Admin Dashboard to add fleet buses and live routes.
              </p>
              <Link
                to="/admin"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 20px',
                  background: '#008cff',
                  color: '#ffffff',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  boxShadow: '0 3px 10px rgba(0, 140, 255, 0.25)'
                }}
              >
                ⚙️ Open Admin Dashboard to Add Bus
              </Link>
            </div>
          )}
        </div>

        {/* Special Offers */}
        <div className="content-block">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 className="block-title" style={{ margin: 0 }}>Special Offers & Promo Codes</h2>
            <Link to="/offers" style={{ color: '#008cff', fontWeight: 'bold', fontSize: '0.9rem', textDecoration: 'none' }}>
              View All Offers ➔
            </Link>
          </div>
          <div className="offers-grid">
            <div className="offer-card pink-card">
              <span className="offer-tag">FLAT ₹200 OFF</span>
              <h3>Code: FIRST50</h3>
              <p>Valid on first bus booking for new users</p>
            </div>
            <div className="offer-card blue-card">
              <span className="offer-tag">NEW USER</span>
              <h3>Code: TRAVELGO</h3>
              <p>Get ₹150 instant discount on any bus journey</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

