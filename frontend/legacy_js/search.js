/* ==========================================
   TravelGo - Search & Filter Logic (Render Live API)
   ========================================== */

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Get query params from URL (from, to, date)
  const urlParams = new URLSearchParams(window.location.search);
  const from = urlParams.get("from") || "Mumbai";
  const to = urlParams.get("to") || "Goa";
  const date = urlParams.get("date") || "2026-08-15";

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

  // Update Header text
  const routeTitle = document.getElementById("routeTitle");
  const travelDate = document.getElementById("travelDate");
  if (routeTitle) routeTitle.textContent = `${from} ➔ ${to}`;
  if (travelDate) travelDate.textContent = date;

  const container = document.getElementById("busResultsList");
  let allBuses = [];

  // 2. Fetch Buses from Render Backend API
  try {
    const response = await fetch(`${API_URL}/buses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    const dbBuses = await response.json();

    // Map database columns to frontend structure
    allBuses = (Array.isArray(dbBuses) ? dbBuses : []).map(bus => ({
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
  } catch (error) {
    console.error("Error fetching buses from Render API:", error);
    if (container) {
      container.innerHTML = `<div style="text-align:center; padding:40px; color:#ef4444;"><h3>Server Connection Error!</h3><p>Could not load live buses from Render server.</p></div>`;
    }
    return;
  }

  function renderBuses(busList) {
    if (!container) return;
    container.innerHTML = "";

    if (busList.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:40px;"><h3>No buses found for this route.</h3></div>`;
      return;
    }

    busList.forEach(bus => {
      const card = document.createElement("div");
      card.className = "bus-card";

      const seatSelectionUrl = `seat-selection.html?busId=${encodeURIComponent(bus.id)}&date=${encodeURIComponent(date)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

      card.innerHTML = `
        <div class="bus-info">
          <h3>${bus.name}</h3>
          <div class="bus-type">${bus.type} • ⭐ ${bus.rating}</div>
          <div class="bus-timing">
            <span>${bus.departureTime}</span>
            <span class="duration-badge">${bus.duration}</span>
            <span>${bus.arrivalTime}</span>
          </div>
        </div>
        <div class="bus-pricing">
          <div class="bus-price">₹${bus.price}</div>
          <a href="${seatSelectionUrl}" class="btn-select-seats">Select Seats</a>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // Filter matching route buses (Case-insensitive check)
  const filtered = allBuses.filter(
    b => b.from && b.to && b.from.toLowerCase().includes(from.toLowerCase()) && b.to.toLowerCase().includes(to.toLowerCase())
  );

  // Initial Render (Fallback to all fetched buses if exact route match filter is empty)
  renderBuses(filtered.length > 0 ? filtered : allBuses);

  // Price Slider Event
  const priceRange = document.getElementById("priceRange");
  const priceValue = document.getElementById("priceValue");
  if (priceRange) {
    // Set max range dynamically based on buses
    if (allBuses.length > 0) {
      const maxFare = Math.max(...allBuses.map(b => b.price), 2000);
      priceRange.max = maxFare;
      priceRange.value = maxFare;
      if (priceValue) priceValue.textContent = maxFare;
    }

    priceRange.addEventListener("input", (e) => {
      if (priceValue) priceValue.textContent = e.target.value;
      const filteredByPrice = (filtered.length > 0 ? filtered : allBuses).filter(b => b.price <= e.target.value);
      renderBuses(filteredByPrice);
    });
  }
});