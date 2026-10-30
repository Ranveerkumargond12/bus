import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/Toast';

export function AdminDashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    total_revenue: 0,
    total_bookings: 0,
    total_buses: 0,
    total_users: 0
  });

  const [bookings, setBookings] = useState([]);
  const [buses, setBuses] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [operators, setOperators] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Add/Edit Bus Form State
  const [editingBusId, setEditingBusId] = useState(null);
  const [busForm, setBusForm] = useState({
    bus_name: '',
    bus_number: '',
    bus_type: 'AC Sleeper (2+1)',
    source: '',
    destination: '',
    departure_time: '09:00 PM',
    arrival_time: '07:30 AM',
    duration: '10h 30m',
    fare: '',
    seats_capacity: 24,
    amenities: 'WiFi, Charging Point, Blanket, Water Bottle',
    boarding_points: '',
    dropping_points: ''
  });

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      // 1. Stats & Bookings
      try {
        const statsRes = await api.admin.getStats();
        if (statsRes.success) {
          setStats(statsRes.stats);
          setBookings(statsRes.recent_bookings || []);
        }
      } catch (e) {
        console.warn('Stats fetch warning:', e);
      }

      // 2. Buses
      try {
        const busRes = await api.buses.search();
        setBuses(Array.isArray(busRes) ? busRes : []);
      } catch (e) {}

      // 3. Users
      try {
        const userRes = await api.admin.getUsers();
        setUsersList(Array.isArray(userRes) ? userRes : []);
      } catch (e) {}

      // 4. Operators
      try {
        const opRes = await api.operators.getAll();
        setOperators(Array.isArray(opRes) ? opRes : []);
      } catch (e) {}

      // 5. Agents
      try {
        const agRes = await api.agents.getAll();
        setAgents(Array.isArray(agRes) ? agRes : []);
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleStartEdit = (bus) => {
    setEditingBusId(bus.id);
    setBusForm({
      bus_name: bus.bus_name || '',
      bus_number: bus.bus_number || '',
      bus_type: bus.bus_type || 'AC Sleeper (2+1)',
      source: bus.source || '',
      destination: bus.destination || '',
      departure_time: bus.departure_time || '',
      arrival_time: bus.arrival_time || '',
      duration: bus.duration || '10h 30m',
      fare: bus.fare || '',
      seats_capacity: bus.seats_capacity || 24,
      amenities: bus.amenities || 'WiFi, Charging Point, Blanket, Water Bottle',
      boarding_points: bus.boarding_points || '',
      dropping_points: bus.dropping_points || ''
    });
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingBusId(null);
    setBusForm({
      bus_name: '',
      bus_number: '',
      bus_type: 'AC Sleeper (2+1)',
      source: '',
      destination: '',
      departure_time: '09:00 PM',
      arrival_time: '07:30 AM',
      duration: '10h 30m',
      fare: '',
      seats_capacity: 24,
      amenities: 'WiFi, Charging Point, Blanket, Water Bottle',
      boarding_points: '',
      dropping_points: ''
    });
  };

  const handleSaveBus = async (e) => {
    e.preventDefault();
    if (!busForm.bus_name || !busForm.source || !busForm.destination || !busForm.fare) {
      setToast({ type: 'error', message: 'Bus Name, Source, Destination, and Fare are required.' });
      return;
    }

    try {
      if (editingBusId) {
        const res = await api.admin.updateBus(editingBusId, busForm);
        if (res.success) {
          setToast({ type: 'success', message: '✅ Bus updated successfully in fleet!' });
          handleCancelEdit();
          loadAllAdminData();
        }
      } else {
        const res = await api.admin.addBus(busForm);
        if (res.success) {
          setToast({ type: 'success', message: '✅ New bus successfully added to fleet!' });
          handleCancelEdit();
          loadAllAdminData();
        }
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to save bus' });
    }
  };

  const handleDeleteBus = async (id) => {
    if (!window.confirm('Are you sure you want to remove this bus?')) return;
    try {
      await api.admin.deleteBus(id);
      setToast({ type: 'success', message: 'Bus deleted successfully' });
      loadAllAdminData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Delete failed' });
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.admin.deleteUser(id);
      setToast({ type: 'success', message: 'User deleted successfully' });
      loadAllAdminData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Delete failed' });
    }
  };

  const handleDeleteOperator = async (id) => {
    if (!window.confirm('Delete operator registration?')) return;
    try {
      await api.operators.delete(id);
      setToast({ type: 'success', message: 'Operator deleted' });
      loadAllAdminData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Delete failed' });
    }
  };

  const handleDeleteAgent = async (id) => {
    if (!window.confirm('Delete agent registration?')) return;
    try {
      await api.agents.delete(id);
      setToast({ type: 'success', message: 'Agent deleted' });
      loadAllAdminData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Delete failed' });
    }
  };

  return (
    <div className="admin-dashboard-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', color: '#1c2430' }}>Admin Operations & Fleet Portal</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Welcome, {user?.name || 'Administrator'} (Full System Access)</p>
        </div>
        <button
          onClick={loadAllAdminData}
          style={{ padding: '8px 16px', background: '#008cff', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🔄 Refresh Analytics
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '35px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Total Confirmed Revenue</div>
          <div style={{ fontSize: '1.9rem', fontWeight: '800', color: '#10b981', marginTop: '6px' }}>₹{stats.total_revenue}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Total Bookings</div>
          <div style={{ fontSize: '1.9rem', fontWeight: '800', color: '#008cff', marginTop: '6px' }}>{stats.total_bookings}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Active Fleet Buses</div>
          <div style={{ fontSize: '1.9rem', fontWeight: '800', color: '#8b5cf6', marginTop: '6px' }}>{buses.length || stats.total_buses}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Registered Customers</div>
          <div style={{ fontSize: '1.9rem', fontWeight: '800', color: '#f59e0b', marginTop: '6px' }}>{usersList.length || stats.total_users}</div>
        </div>
      </div>

      {/* Add / Edit Bus Section */}
      <div style={{ background: '#ffffff', border: editingBusId ? '2px solid #008cff' : '1px solid #e2e8f0', borderRadius: '16px', padding: '25px', marginBottom: '35px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#1c2430' }}>
            {editingBusId ? `✏️ Edit Bus Details (#${editingBusId})` : '+ Add New Bus to Schedule'}
          </h3>
          {editingBusId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
            >
              ✕ Cancel Editing
            </button>
          )}
        </div>

        <form onSubmit={handleSaveBus} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Bus Operator Name *</label>
            <input
              type="text"
              placeholder="e.g. IntrCity SmartBus / Zingbus"
              value={busForm.bus_name}
              onChange={(e) => setBusForm({ ...busForm, bus_name: e.target.value })}
              required
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Bus Registration Plate</label>
            <input
              type="text"
              placeholder="e.g. MH-01-AB-1234"
              value={busForm.bus_number}
              onChange={(e) => setBusForm({ ...busForm, bus_number: e.target.value })}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Bus Category / Type</label>
            <select
              value={busForm.bus_type}
              onChange={(e) => setBusForm({ ...busForm, bus_type: e.target.value })}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
            >
              <option value="AC Sleeper (2+1)">AC Sleeper (2+1)</option>
              <option value="Non-AC Seater (2+2)">Non-AC Seater (2+2)</option>
              <option value="AC Seater (2+2)">AC Seater (2+2)</option>
              <option value="Volvo Multi-Axle AC Sleeper">Volvo Multi-Axle AC Sleeper</option>
              <option value="Bharat Benz Luxury AC">Bharat Benz Luxury AC</option>
              <option value="Electric Luxury AC Sleeper">Electric Luxury AC Sleeper</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Origin (Source City) *</label>
            <input
              type="text"
              placeholder="e.g. Mumbai"
              value={busForm.source}
              onChange={(e) => setBusForm({ ...busForm, source: e.target.value })}
              required
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Destination City *</label>
            <input
              type="text"
              placeholder="e.g. Goa"
              value={busForm.destination}
              onChange={(e) => setBusForm({ ...busForm, destination: e.target.value })}
              required
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Departure Time</label>
            <input
              type="text"
              placeholder="e.g. 09:00 PM"
              value={busForm.departure_time}
              onChange={(e) => setBusForm({ ...busForm, departure_time: e.target.value })}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Arrival Time</label>
            <input
              type="text"
              placeholder="e.g. 07:30 AM"
              value={busForm.arrival_time}
              onChange={(e) => setBusForm({ ...busForm, arrival_time: e.target.value })}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Journey Duration</label>
            <input
              type="text"
              placeholder="e.g. 10h 30m"
              value={busForm.duration}
              onChange={(e) => setBusForm({ ...busForm, duration: e.target.value })}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Ticket Fare (₹) *</label>
            <input
              type="number"
              placeholder="e.g. 950"
              min="1"
              value={busForm.fare}
              onChange={(e) => setBusForm({ ...busForm, fare: e.target.value })}
              required
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Total Seats Capacity</label>
            <input
              type="number"
              min="10"
              max="60"
              value={busForm.seats_capacity}
              onChange={(e) => setBusForm({ ...busForm, seats_capacity: Number(e.target.value) })}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Boarding Points</label>
            <input
              type="text"
              placeholder="e.g. Bandra East - 20:30, Sion - 20:50, Vashi - 21:30"
              value={busForm.boarding_points}
              onChange={(e) => setBusForm({ ...busForm, boarding_points: e.target.value })}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Dropping Points</label>
            <input
              type="text"
              placeholder="e.g. Mapusa - 06:45, Panjim - 07:15, Madgaon - 08:00"
              value={busForm.dropping_points}
              onChange={(e) => setBusForm({ ...busForm, dropping_points: e.target.value })}
              style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '11px',
                background: editingBusId ? '#008cff' : '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            >
              {editingBusId ? '💾 Save Changes' : '+ Add Bus to Fleet'}
            </button>
            {editingBusId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  padding: '11px 16px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Fleet Buses Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '25px', marginBottom: '35px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#1c2430' }}>Fleet Buses ({buses.length})</h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Live Database Fleet</span>
        </div>

        {buses.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚌</div>
            <h4 style={{ margin: '0 0 6px 0', color: '#1c2430' }}>No Buses In Fleet</h4>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
              Hardcoded buses have been removed. Use the form above to add your first real bus to the live fleet!
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>ID</th>
                  <th style={{ padding: '10px' }}>Bus Operator</th>
                  <th style={{ padding: '10px' }}>Route</th>
                  <th style={{ padding: '10px' }}>Timing & Duration</th>
                  <th style={{ padding: '10px' }}>Fare</th>
                  <th style={{ padding: '10px' }}>Capacity</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {buses.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', color: '#64748b' }}>#{b.id}</td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1c2430' }}>{b.bus_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{b.bus_type} • {b.bus_number || 'No Plate'}</div>
                    </td>
                    <td style={{ padding: '10px', color: '#008cff', fontWeight: 'bold' }}>{b.source} ➔ {b.destination}</td>
                    <td style={{ padding: '10px' }}>
                      <div>{b.departure_time} - {b.arrival_time}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{b.duration}</div>
                    </td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#10b981' }}>₹{b.fare}</td>
                    <td style={{ padding: '10px' }}>{b.seats_capacity || 24} seats</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(b)}
                        style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', marginRight: '6px' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBus(b.id)}
                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Bookings Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '25px', marginBottom: '35px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#1c2430' }}>Recent Bookings ({bookings.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>PNR</th>
                <th style={{ padding: '10px' }}>Passenger</th>
                <th style={{ padding: '10px' }}>Route</th>
                <th style={{ padding: '10px' }}>Date</th>
                <th style={{ padding: '10px' }}>Seat(s)</th>
                <th style={{ padding: '10px' }}>Fare</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(bk => (
                <tr key={bk.id || bk.pnr} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#008cff' }}>{bk.pnr}</td>
                  <td style={{ padding: '10px' }}>{bk.passenger_name} ({bk.passenger_email})</td>
                  <td style={{ padding: '10px' }}>{bk.source} ➔ {bk.destination}</td>
                  <td style={{ padding: '10px' }}>{bk.travel_date}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{bk.seat_no}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#10b981' }}>₹{bk.total_fare}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', background: bk.status === 'Cancelled' ? '#fee2e2' : '#dcfce7', color: bk.status === 'Cancelled' ? '#dc2626' : '#16a34a' }}>
                      {bk.status || 'Confirmed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '25px', marginBottom: '35px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#1c2430' }}>Registered Users ({usersList.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>ID</th>
                <th style={{ padding: '10px' }}>Name</th>
                <th style={{ padding: '10px' }}>Email</th>
                <th style={{ padding: '10px' }}>Role</th>
                <th style={{ padding: '10px' }}>Wallet</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px' }}>#{u.id}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{u.name}</td>
                  <td style={{ padding: '10px' }}>{u.email}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', background: u.role === 'admin' ? '#fef3c7' : '#f1f5f9', color: u.role === 'admin' ? '#b45309' : '#475569' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>₹{u.wallet_balance || 0}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    {u.id !== 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id)}
                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operators & Agents Row */}
      <div className="admin-two-cols">
        {/* Operators */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#1c2430' }}>Bus Operators ({operators.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Agency</th>
                  <th style={{ padding: '8px' }}>Owner</th>
                  <th style={{ padding: '8px' }}>Phone</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {operators.map(op => (
                  <tr key={op.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{op.agency_name}</td>
                    <td style={{ padding: '8px' }}>{op.owner_name}</td>
                    <td style={{ padding: '8px' }}>{op.phone}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <button onClick={() => handleDeleteOperator(op.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agents */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#1c2430' }}>Travel Agents ({agents.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Name</th>
                  <th style={{ padding: '8px' }}>Shop</th>
                  <th style={{ padding: '8px' }}>City</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(ag => (
                  <tr key={ag.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{ag.full_name}</td>
                    <td style={{ padding: '8px' }}>{ag.agency_shop}</td>
                    <td style={{ padding: '8px' }}>{ag.city}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <button onClick={() => handleDeleteAgent(ag.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

