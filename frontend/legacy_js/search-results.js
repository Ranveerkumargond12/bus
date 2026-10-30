document.addEventListener('DOMContentLoaded', async () => {
  // 1. Read URL Query Parameters
  const urlParams = new URLSearchParams(window.location.search);
  const fromLocation = urlParams.get('from') ? urlParams.get('from').trim() : '';
  const toLocation = urlParams.get('to') ? urlParams.get('to').trim() : '';
  const travelDate = urlParams.get('date') || 'Today';

  // Dynamic API URL: Hostinger /api with Render fallback
  const API_URL = (typeof window !== 'undefined' && window.API_URL) ? window.API_URL : (function() {
    if (window.location.protocol.startsWith('http')) {
      if (window.location.pathname.includes('/frontend/')) {
        const base = window.location.pathname.split('/frontend/')[0];
        return window.location.origin + base + '/api';
      }
      return window.location.origin + '/api';
    }
    return 'https://bus-ticket-booking-5k6m.onrender.com/api';
  })();

  // Input Fields Sync
  const fromInput = document.querySelector('input[name="from"]') || document.getElementById('fromInput');
  const toInput = document.querySelector('input[name="to"]') || document.getElementById('toInput');
  const dateInput = document.querySelector('input[name="date"]') || document.getElementById('dateInput');

  if (fromInput && fromLocation) fromInput.value = fromLocation;
  if (toInput && toLocation) toInput.value = toLocation;
  if (dateInput && travelDate !== 'Today') dateInput.value = travelDate;

  // Header Title Update
  const routeHeaderEl = document.getElementById('searchRouteHeader');
  if (routeHeaderEl) {
    if (fromLocation || toLocation) {
      routeHeaderEl.textContent = `${fromLocation || 'Any'} ➔ ${toLocation || 'Any'} (${travelDate})`;
    } else {
      routeHeaderEl.textContent = `All Available Buses (${travelDate})`;
    }
  }

  // DOM Elements
  const busListContainer = document.querySelector('.bus-list') || document.getElementById('busListContainer') || document.getElementById('busResults');
  const checkboxes = document.querySelectorAll('.filter-group input[type="checkbox"]');
  const priceRange = document.getElementById('priceRange');
  const priceVal = document.getElementById('priceVal');

  let routeMatchedBuses = [];

  // 2. Fetch Data Directly From Render Live Backend API with Route Parameters
  try {
    const apiUrl = `${API_URL}/buses?from=${encodeURIComponent(fromLocation)}&to=${encodeURIComponent(toLocation)}`;
    const response = await fetch(apiUrl);
    const dbBuses = await response.json();

    // Map database columns to frontend structure
    const allBuses = (Array.isArray(dbBuses) ? dbBuses : []).map(bus => ({
      id: bus.id,
      name: bus.bus_name || 'Express Bus',
      number: bus.bus_number || '',
      type: bus.bus_type || 'AC Sleeper / Seater',
      from: bus.source || '',
      to: bus.destination || '',
      departureTime: bus.departure_time || '10:00 AM',
      arrivalTime: bus.arrival_time || '06:00 PM',
      duration: bus.duration || '',
      price: Number(bus.fare) || 1200,
      rating: bus.rating || '4.5',
      availableSeats: bus.available_seats || 20
    }));

    // Client-side Space & Case Insensitive Match
    const cleanFrom = fromLocation.toLowerCase().replace(/\s+/g, '');
    const cleanTo = toLocation.toLowerCase().replace(/\s+/g, '');

    if (cleanFrom || cleanTo) {
      routeMatchedBuses = allBuses.filter(bus => {
        const busFrom = (bus.from || '').toLowerCase().replace(/\s+/g, '');
        const busTo = (bus.to || '').toLowerCase().replace(/\s+/g, '');

        const matchFrom = !cleanFrom || busFrom.includes(cleanFrom) || cleanFrom.includes(busFrom);
        const matchTo = !cleanTo || busTo.includes(cleanTo) || cleanTo.includes(busTo);

        return matchFrom && matchTo;
      });
    } else {
      routeMatchedBuses = allBuses;
    }

    // Dynamic Price Range Slider Adjustment
    if (priceRange && routeMatchedBuses.length > 0) {
      const highestPrice = Math.max(...routeMatchedBuses.map(b => b.price), 2000);
      priceRange.max = highestPrice;
      priceRange.value = highestPrice;
      if (priceVal) priceVal.textContent = `₹${highestPrice}`;
    }

    // Run filters on load
    applyFilters();

  } catch (error) {
    console.error("Error fetching buses from backend database:", error);
    if (busListContainer) {
      busListContainer.innerHTML = `
        <div style="color: #ef4444; text-align: center; padding: 25px; background: rgba(239, 68, 68, 0.1); border-radius: 12px; margin-top: 20px;">
          <h3>Server Connection Error!</h3>
          <p style="margin-top: 5px; color: #f87171;">Failed to connect to the Render live server.</p>
        </div>
      `;
    }
  }

  // 3. Bus Cards Render Function
  function renderBuses(buses) {
    if (!busListContainer) return;

    if (!buses || buses.length === 0) {
      busListContainer.innerHTML = `
        <div class="no-buses" style="color: #94a3b8; text-align: center; padding: 40px; background: rgba(255, 255, 255, 0.05); border-radius: 12px; margin-top: 20px;">
          <h3 style="color: #1c2430; margin-bottom: 8px;">No Buses Available</h3>
          <p style="margin: 0;">No buses found matching ${fromLocation ? `"${fromLocation} ➔ ${toLocation}"` : 'your search criteria'}.</p>
          <p style="font-size: 0.85rem; color: #64748b; margin-top: 5px;">Please add a new bus from the Admin Panel or try changing the route.</p>
        </div>
      `;
      return;
    }

    busListContainer.innerHTML = buses.map((bus) => {
      return `
        <div class="bus-card" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
          
          <div class="bus-info">
            <h3 style="color: #1c2430; margin: 0 0 5px 0;">${bus.name} ${bus.number ? `(${bus.number})` : ''}</h3>
            <p style="color: #38bdf8; margin: 0 0 5px 0; font-weight: 600; font-size: 0.95rem;">${bus.from} ➔ ${bus.to}</p>
            <p style="color: #94a3b8; margin: 0; font-size: 0.85rem;">${bus.type}</p>
            <div style="margin-top: 8px; color: #e2e8f0; font-size: 0.85rem;">
              <span>⭐ ${bus.rating}</span> | <span style="color:#34d399;">${bus.availableSeats} Seats Left</span>
            </div>
          </div>

          <div class="bus-timing" style="text-align: center;">
            <div style="font-weight: bold; color: #1c2430; font-size: 1.1rem;">${bus.departureTime} ➔ ${bus.arrivalTime}</div>
            <div style="color: #64748b; font-size: 0.85rem; margin-top: 4px;">${bus.duration}</div>
          </div>

          <div class="bus-action" style="text-align: right;">
            <div style="font-size: 1.4rem; font-weight: bold; color: #34d399; margin-bottom: 8px;">₹${bus.price}</div>
            <button type="button" class="btn-select-bus" data-bus-id="${bus.id}" style="padding: 10px 20px; background: #38bdf8; border: none; color: #0f172a; font-weight: bold; border-radius: 6px; cursor: pointer; display: inline-block;">
              Select Seats
            </button>
          </div>

        </div>
      `;
    }).join('');

    // Click Handler for Seat Selection
    document.querySelectorAll('.btn-select-bus').forEach((button) => {
      button.addEventListener('click', (e) => {
        const busId = e.currentTarget.getAttribute('data-bus-id');
        const selectedBusObj = buses.find(b => String(b.id) === String(busId));
        if (selectedBusObj) {
          handleBusSelect(selectedBusObj);
        }
      });
    });
  }

  // 4. Apply Filters Logic
  function applyFilters() {
    const maxPrice = priceRange ? Number(priceRange.value) : 100000;
    if (priceVal) priceVal.textContent = `₹${maxPrice}`;

    let activeTypeFilters = [];
    checkboxes.forEach(cb => {
      if (cb.checked) {
        const labelText = cb.parentElement ? cb.parentElement.textContent.toLowerCase() : '';
        activeTypeFilters.push(labelText);
      }
    });

    const filteredBuses = routeMatchedBuses.filter(bus => {
      const matchesPrice = bus.price <= maxPrice;

      if (activeTypeFilters.length === 0) return matchesPrice;

      const busCategory = bus.type.toLowerCase();
      const matchesType = activeTypeFilters.some(filter => {
        if (filter.includes('ac') && busCategory.includes('ac')) return true;
        if (filter.includes('sleeper') && busCategory.includes('sleeper')) return true;
        if (filter.includes('seater') && busCategory.includes('seater')) return true;
        return false;
      });

      return matchesPrice && matchesType;
    });

    renderBuses(filteredBuses);
  }

  // Event Listeners for Filters
  if (priceRange) {
    priceRange.addEventListener('input', applyFilters);
  }
  checkboxes.forEach(cb => {
    cb.addEventListener('change', applyFilters);
  });

  // 5. Select Bus Redirect Handler
  function handleBusSelect(bus) {
    const fromParam = encodeURIComponent(fromLocation || bus.from);
    const toParam = encodeURIComponent(toLocation || bus.to);
    window.location.href = `seat-selection.html?from=${fromParam}&to=${toParam}&busId=${bus.id}`;
  }
});