window.API_URL = window.API_URL || (function() {
  if (window.location.protocol.startsWith('http')) {
    if (window.location.pathname.includes('/frontend/')) {
      const base = window.location.pathname.split('/frontend/')[0];
      return window.location.origin + base + '/api';
    }
    return window.location.origin + '/api';
  }
  return 'https://bus-ticket-booking-5k6m.onrender.com/api';
})();

document.addEventListener('DOMContentLoaded', () => {
  const API_URL = window.API_URL;

  // Check Admin Security
  const savedUser = JSON.parse(localStorage.getItem('safarsathi_user') || '{}');
  if (savedUser.role !== 'admin') {
    alert('Access Denied! Admin Login Required.');
    window.location.href = 'auth.html';
    return;
  }

  const adminNameElement = document.getElementById('admin-name');
  if (adminNameElement && savedUser.name) {
    adminNameElement.innerText = `Welcome, ${savedUser.name}`;
  }

  // Fetch Dashboard Analytics, Fleet, Operators, Agents & Users Data
  loadDashboardData();
  loadOperatorsData();
  loadAgentsData();
  loadUsersData(); // ✅ Added here

  // Add New Bus Form Handler
  const addBusForm = document.getElementById('add-bus-form');
  if (addBusForm) {
    addBusForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const busPayload = {
        bus_name: document.getElementById('bus_name').value.trim(),
        bus_number: document.getElementById('bus_number').value.trim(),
        source: document.getElementById('source').value.trim(),
        destination: document.getElementById('destination').value.trim(),
        departure_time: document.getElementById('departure_time').value.trim(),
        arrival_time: document.getElementById('arrival_time').value.trim(),
        fare: parseFloat(document.getElementById('fare').value)
      };

      try {
        const response = await fetch(`${API_URL}/admin/add-bus`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(busPayload)
        });

        const result = await response.json();

        if (result.success) {
          alert('✅ Bus successfully added to the system!');
          addBusForm.reset();
          loadDashboardData();
        } else {
          alert('❌ Bus add karne me issue aaya: ' + (result.error || result.message));
        }
      } catch (err) {
        console.error('Add Bus Error:', err);
        alert('Server connection error!');
      }
    });
  }
});

// Load Dashboard Analytics & Dynamic Tables
async function loadDashboardData() {
  const API_URL = window.API_URL;

  let bookingsList = [];
  let busesList = [];
  let totalRevenue = 0;
  let totalBookingsCount = 0;

  // 1. Fetch All Bookings from Backend
  try {
    const res = await fetch(`${API_URL}/bookings`);
    if (res.ok) {
      bookingsList = await res.json();
    }
  } catch (err) {
    console.warn('Backend bookings API unavailable, falling back to LocalStorage...', err);
  }

  // Fallback to LocalStorage if backend data is empty
  if (!Array.isArray(bookingsList) || bookingsList.length === 0) {
    try {
      bookingsList = JSON.parse(localStorage.getItem('myBookings')) || [];
    } catch (e) {
      bookingsList = [];
    }
  }

  totalBookingsCount = bookingsList.length;

  // Total Revenue Calculation (excluding cancelled tickets)
  totalRevenue = bookingsList.reduce((sum, b) => {
    const status = (b.status || '').toUpperCase();
    if (status === 'CANCELLED' || status === 'CANCEL') return sum;
    const fare = Number(b.total_fare || b.totalAmount || b.fare || 0);
    return sum + (isNaN(fare) ? 0 : fare);
  }, 0);

  // Update Stats Cards on Admin Panel
  const revEl = document.getElementById('total-revenue');
  const bookEl = document.getElementById('total-bookings');
  const busEl = document.getElementById('total-buses');

  if (revEl) revEl.innerText = `₹${totalRevenue}`;
  if (bookEl) bookEl.innerText = totalBookingsCount;

  // Render Recent Bookings Table
  const bookingsTable = document.getElementById('bookings-table-body');
  if (bookingsTable) {
    bookingsTable.innerHTML = '';
    if (Array.isArray(bookingsList) && bookingsList.length > 0) {
      bookingsList.forEach(b => {
        const pnr = b.pnr || b.id || 'PNR';
        const passenger = b.passenger_name || b.passengerName || 'Passenger';
        const src = b.source || b.from || '-';
        const dest = b.destination || b.to || '-';
        let seat = b.seat_no || b.seat_number || b.seats || 'A1';
        if (Array.isArray(seat)) seat = seat.join(', ');
        const fare = b.total_fare || b.totalAmount || b.fare || 0;
        const date = b.created_at || b.travel_date || b.travelDate || b.date;

        bookingsTable.innerHTML += `
          <tr>
            <td>#${pnr}</td>
            <td>${passenger}</td>
            <td>${src} to ${dest}</td>
            <td>${seat}</td>
            <td>₹${fare}</td>
            <td>${date ? new Date(date).toLocaleDateString() : 'Today'}</td>
          </tr>
        `;
      });
    } else {
      bookingsTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#a9a9b3;">No passenger bookings yet.</td></tr>`;
    }
  }

  // 2. Fetch Active Buses List
  try {
    const busesRes = await fetch(`${API_URL}/buses`);
    if (busesRes.ok) {
      busesList = await busesRes.json();
    }
  } catch (err) {
    console.warn('Backend buses API unavailable...', err);
  }

  if (!Array.isArray(busesList) || busesList.length === 0) {
    try {
      busesList = JSON.parse(localStorage.getItem('availableBuses')) || [];
    } catch (e) {
      busesList = [];
    }
  }

  if (busEl) busEl.innerText = busesList.length;

  const busesTable = document.getElementById('buses-table-body');
  if (busesTable) {
    busesTable.innerHTML = '';
    if (Array.isArray(busesList) && busesList.length > 0) {
      busesList.forEach(bus => {
        busesTable.innerHTML += `
          <tr>
            <td>${bus.id || '-'}</td>
            <td><strong>${bus.bus_name || bus.name || 'Express Bus'}</strong></td>
            <td>${bus.bus_number || bus.number || 'N/A'}</td>
            <td>${bus.source || bus.from} ➔ ${bus.destination || bus.to}</td>
            <td>${bus.departure_time || 'N/A'} - ${bus.arrival_time || 'N/A'}</td>
            <td>₹${bus.fare || bus.price || 0}</td>
            <td>
              <button class="btn-delete" onclick="deleteBus(${bus.id})">
                <i class="fa-solid fa-trash"></i> Delete
              </button>
            </td>
          </tr>
        `;
      });
    } else {
      busesTable.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#a9a9b3;">No active buses found.</td></tr>`;
    }
  }
}

// -----------------------------------------------------------
// OPERATORS DATA LOADER
// -----------------------------------------------------------
async function loadOperatorsData() {
  const API_URL = window.API_URL;
  try {
    const res = await fetch(`${API_URL}/operators`);
    if (res.ok) {
      const operators = await res.json();
      renderOperators(operators);
    }
  } catch (err) {
    console.error('Failed to load operators:', err);
  }
}

function renderOperators(operators) {
  const operatorsTable = document.getElementById('operators-table-body');
  if (!operatorsTable) return;

  operatorsTable.innerHTML = '';
  if (Array.isArray(operators) && operators.length > 0) {
    operators.forEach((op, index) => {
      operatorsTable.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${op.agency_name || 'N/A'}</strong></td>
          <td>${op.owner_name || 'N/A'}</td>
          <td><a href="tel:${op.phone}">${op.phone || 'N/A'}</a></td>
          <td>${op.fleet_size || '1'}</td>
          <td>${op.created_at ? new Date(op.created_at).toLocaleDateString() : 'Today'}</td>
          <td>
            <button class="btn-delete" onclick="deleteOperator(${op.id})">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </td>
        </tr>
      `;
    });
  } else {
    operatorsTable.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#a9a9b3;">No registered operators found.</td></tr>`;
  }
}

// -----------------------------------------------------------
// AGENTS DATA LOADER
// -----------------------------------------------------------
async function loadAgentsData() {
  const API_URL = window.API_URL;
  try {
    const res = await fetch(`${API_URL}/agents`);
    if (res.ok) {
      const agents = await res.json();
      renderAgents(agents);
    }
  } catch (err) {
    console.error('Failed to load agents:', err);
  }
}

function renderAgents(agents) {
  const agentsTable = document.getElementById('agents-table-body');
  if (!agentsTable) return;

  agentsTable.innerHTML = '';
  if (Array.isArray(agents) && agents.length > 0) {
    agents.forEach((ag, index) => {
      agentsTable.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${ag.full_name || 'N/A'}</strong></td>
          <td>${ag.agency_shop || 'N/A'}</td>
          <td><a href="tel:${ag.phone}">${ag.phone || 'N/A'}</a></td>
          <td>${ag.city || 'N/A'}</td>
          <td>${ag.created_at ? new Date(ag.created_at).toLocaleDateString() : 'Today'}</td>
          <td>
            <button class="btn-delete" onclick="deleteAgent(${ag.id})">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </td>
        </tr>
      `;
    });
  } else {
    agentsTable.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#a9a9b3;">No agent applications found.</td></tr>`;
  }
}

// -----------------------------------------------------------
// ✅ ADDED: REGISTERED USERS DATA LOADER
// -----------------------------------------------------------
async function loadUsersData() {
  const API_URL = window.API_URL;
  const usersTable = document.getElementById('users-table-body');
  if (!usersTable) return;

  try {
    const res = await fetch(`${API_URL}/admin/users`);
    if (res.ok) {
      const usersList = await res.json();
      renderUsers(usersList);
    }
  } catch (err) {
    console.error('Failed to load users:', err);
    usersTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Failed to load users from server.</td></tr>`;
  }
}

function renderUsers(users) {
  const usersTable = document.getElementById('users-table-body');
  if (!usersTable) return;

  usersTable.innerHTML = '';
  if (Array.isArray(users) && users.length > 0) {
    users.forEach((user, index) => {
      const joinedDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Today';
      const roleBadge = user.role === 'admin' 
        ? '<span style="background: #ffebee; color: #c62828; padding: 3px 8px; border-radius: 4px; font-size: 0.85em;">Admin</span>' 
        : '<span style="background: #e3f2fd; color: #0d47a1; padding: 3px 8px; border-radius: 4px; font-size: 0.85em;">User</span>';

      usersTable.innerHTML += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${user.id || index + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>${user.name || 'N/A'}</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${user.email || 'N/A'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${roleBadge}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${joinedDate}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${user.role !== 'admin' ? `
              <button class="btn-delete" onclick="deleteUser(${user.id})" style="padding: 5px 10px; background: #ff4d4d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                <i class="fa-solid fa-trash"></i> Delete
              </button>` : 'N/A'}
          </td>
        </tr>
      `;
    });
  } else {
    usersTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#a9a9b3; padding: 15px;">No registered users found.</td></tr>`;
  }
}

// Delete User Function
async function deleteUser(userId) {
  if (!confirm('Kya aap is user ko delete karna chahte hain?')) return;

  const API_URL = window.API_URL;
  try {
    const res = await fetch(`${API_URL}/admin/delete-user/${userId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      alert('🗑️ User deleted successfully!');
      loadUsersData();
    } else {
      alert('Delete error: ' + data.message);
    }
  } catch (err) {
    console.error('Delete user error:', err);
  }
}

// Delete Operator
async function deleteOperator(id) {
  if (!confirm('Kya aap is Bus Operator ko remove karna chahte hain?')) return;

  const API_URL = window.API_URL;
  try {
    const res = await fetch(`${API_URL}/operators/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      alert('🗑️ Operator deleted successfully!');
      loadOperatorsData();
    }
  } catch (err) {
    console.error('Delete Operator Error:', err);
  }
}

// Delete Agent
async function deleteAgent(id) {
  if (!confirm('Kya aap is Agent Application ko remove karna chahte hain?')) return;

  const API_URL = window.API_URL;
  try {
    const res = await fetch(`${API_URL}/agents/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      alert('🗑️ Agent deleted successfully!');
      loadAgentsData();
    }
  } catch (err) {
    console.error('Delete Agent Error:', err);
  }
}

// Delete Bus Function
async function deleteBus(busId) {
  if (!confirm('Kya aap sachme is bus ko delete karna chahte hain?')) return;

  const API_URL = window.API_URL;
  try {
    const res = await fetch(`${API_URL}/admin/delete-bus/${busId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      alert('🗑️ Bus deleted successfully!');
      loadDashboardData();
    } else {
      alert('Delete error: ' + data.error);
    }
  } catch (err) {
    console.error('Delete error:', err);
  }
}

// Admin Logout Function
function logoutAdmin() {
  localStorage.removeItem('safarsathi_user');
  localStorage.removeItem('travelgo_user');
  window.location.href = 'auth.html';
}