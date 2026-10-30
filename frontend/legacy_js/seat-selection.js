document.addEventListener('DOMContentLoaded', async () => {
  const TOTAL_SEATS = 24;

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

  // DOM Elements
  const busGrid = document.getElementById('busGrid');
  const selectedSeatsText = document.getElementById('selectedSeatsText');
  const seatCountText = document.getElementById('seatCountText');
  const basePriceText = document.getElementById('basePriceText');
  const totalPriceText = document.getElementById('totalPriceText');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const routeText = document.getElementById('routeText');
  const busNameText = document.getElementById('busNameText');

  // Promo Code Elements
  const promoCodeInput = document.getElementById('promoCodeInput');
  const applyPromoBtn = document.getElementById('applyPromoBtn');
  const promoMessage = document.getElementById('promoMessage');
  const discountRow = document.getElementById('discountRow');
  const discountText = document.getElementById('discountText');

  // State Variables
  let SEAT_PRICE = 850;
  let currentBusName = 'Express Bus';
  let selectedSeats = [];
  let appliedDiscount = 0;
  let activePromoCode = '';

  // URL Query Params Read
  const urlParams = new URLSearchParams(window.location.search);
  const busId = urlParams.get('busId');
  const fromLoc = urlParams.get('from') || 'Mumbai';
  const toLoc = urlParams.get('to') || 'Goa';

  function parseStandardDate(dateStr) {
    if (!dateStr) return '';
    const str = String(dateStr).trim();
    const ymdMatch = str.match(/^(\d{4}-\d{2}-\d{2})/);
    if (ymdMatch) return ymdMatch[1];

    const d = new Date(str);
    if (isNaN(d.getTime())) return str;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  let rawDate = urlParams.get('date') || urlParams.get('travelDate');
  let travelDate = parseStandardDate(rawDate);

  if (!travelDate) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    travelDate = `${year}-${month}-${day}`;
  }

  try {
    const prevData = JSON.parse(localStorage.getItem('travelgo_booking_data') || '{}');
    if (prevData.travelDate && (prevData.travelDate !== travelDate || String(prevData.busId) !== String(busId))) {
      localStorage.removeItem('selectedSeats');
      localStorage.removeItem('travelgo_booking_data');
    }
  } catch (e) {}

  if (routeText) routeText.textContent = `${fromLoc} ➔ ${toLoc} (${travelDate})`;

  function extractSeatNumber(seatStr) {
    if (seatStr === null || seatStr === undefined) return null;
    const num = parseInt(String(seatStr).replace(/\D/g, ''), 10);
    return isNaN(num) ? null : num;
  }

  // Fetch Occupied Seats from Render Live API
  async function fetchOccupiedSeats() {
    const occupiedSeatNumbers = new Set();
    if (busId && travelDate) {
      try {
        const res = await fetch(`${API_URL}/booked-seats?busId=${busId}&date=${travelDate}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            data.forEach(s => {
              const seatNum = extractSeatNumber(s);
              if (seatNum !== null) occupiedSeatNumbers.add(seatNum);
            });
            return Array.from(occupiedSeatNumbers);
          }
        }
      } catch (apiErr) {
        console.warn("API /booked-seats check failed, falling back...");
      }
    }

    try {
      const res = await fetch(`${API_URL}/my-bookings`);
      if (res.ok) {
        const allDbBookings = await res.json();
        if (Array.isArray(allDbBookings)) {
          allDbBookings.forEach(item => {
            const itemBusId = item.bus_id || item.busId || item.bus;
            const matchBus = busId ? String(itemBusId) === String(busId) : true;
            const rawItemDate = item.travel_date || item.travelDate || item.date || item.journey_date;
            const itemDate = parseStandardDate(rawItemDate);
            const matchDate = (itemDate === travelDate);

            if (matchBus && matchDate && item.status !== 'Cancelled') {
              let rawSeats = Array.isArray(item.seats) ? item.seats : String(item.seats || item.seat_numbers || '').split(',');
              rawSeats.forEach(s => {
                const seatNum = extractSeatNumber(s);
                if (seatNum !== null) occupiedSeatNumbers.add(seatNum);
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn("My-bookings API check failed:", e);
    }

    return Array.from(occupiedSeatNumbers);
  }

  // Fetch Selected Bus Details from Render Live API
  try {
    const response = await fetch(`${API_URL}/buses`);
    if (response.ok) {
      const buses = await response.json();
      const selectedBusObj = buses.find(b => String(b.id) === String(busId));

      if (selectedBusObj) {
        SEAT_PRICE = Number(selectedBusObj.fare) || 850;
        currentBusName = selectedBusObj.bus_name || 'Express Bus';
        if (selectedBusObj.bus_number) {
          currentBusName += ` (${selectedBusObj.bus_number})`;
        }
      }
    }
    if (busNameText) busNameText.textContent = `${currentBusName} (₹${SEAT_PRICE}/seat)`;
  } catch (error) {
    if (busNameText) busNameText.textContent = `Express Bus (₹${SEAT_PRICE}/seat)`;
  }

  // Render Bus Grid (Full Left Column Reserved for Women)
  function renderSeats(bookedSeats) {
    if (!busGrid) return;
    busGrid.innerHTML = '';

    for (let i = 1; i <= TOTAL_SEATS; i++) {
      const seat = document.createElement('div');
      seat.classList.add('seat');
      seat.textContent = `S${i}`;
      seat.dataset.seatNumber = `S${i}`;

      // Left Column Seats: S1, S5, S9, S13, S17, S21
      const isLeftColumnFemale = (i % 4 === 1);

      if (bookedSeats.includes(i)) {
        seat.classList.add('booked');
        seat.style.pointerEvents = 'none';
      } else {
        seat.classList.add('available');
        
        if (isLeftColumnFemale) {
          seat.classList.add('female-seat');
          seat.style.backgroundColor = '#fce7f3';
          seat.style.borderColor = '#ec4899';
          seat.style.color = '#be185d';
          seat.style.fontWeight = 'bold';
          seat.title = "Reserved for Female Passenger";
        }

        seat.addEventListener('click', () => toggleSeatSelection(seat, `S${i}`));
      }

      busGrid.appendChild(seat);

      if (i % 2 === 0 && i % 4 !== 0) {
        const aisle = document.createElement('div');
        aisle.classList.add('aisle-space');
        busGrid.appendChild(aisle);
      }
    }
  }

  // Toggle Seat Selection
  function toggleSeatSelection(seatElement, seatNum) {
    if (selectedSeats.includes(seatNum)) {
      selectedSeats = selectedSeats.filter(s => s !== seatNum);
      seatElement.classList.remove('selected');
      seatElement.classList.add('available');
    } else {
      selectedSeats.push(seatNum);
      seatElement.classList.remove('available');
      seatElement.classList.add('selected');
    }
    updateSummary();
  }

  // Promo Code Handler
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener('click', () => {
      const code = promoCodeInput.value.trim().toUpperCase();
      const count = selectedSeats.length;
      const baseTotal = count * SEAT_PRICE;

      if (count === 0) {
        showPromoMsg('Pehle seats select karein!', 'red');
        return;
      }

      if (code === 'SAFAR50') {
        appliedDiscount = Math.min(Math.round(baseTotal * 0.50), 150);
        activePromoCode = code;
        showPromoMsg(`Coupon 'SAFAR50' Applied! Saved ₹${appliedDiscount}`, 'green');
      } else if (code === 'FIRST100') {
        appliedDiscount = 100;
        activePromoCode = code;
        showPromoMsg(`Coupon 'FIRST100' Applied! Saved ₹100`, 'green');
      } else {
        appliedDiscount = 0;
        activePromoCode = '';
        showPromoMsg('Invalid Promo Code!', 'red');
      }

      updateSummary();
    });
  }

  function showPromoMsg(msg, color) {
    if (!promoMessage) return;
    promoMessage.textContent = msg;
    promoMessage.style.color = color === 'green' ? '#16a34a' : '#dc2626';
    promoMessage.style.display = 'block';
  }

  // Update Summary UI
  function updateSummary() {
    const count = selectedSeats.length;
    const originalBaseTotal = count * SEAT_PRICE;

    if (seatCountText) seatCountText.textContent = count;
    if (basePriceText) basePriceText.textContent = `₹${originalBaseTotal}`;

    if (activePromoCode === 'SAFAR50') {
      appliedDiscount = Math.min(Math.round(originalBaseTotal * 0.50), 150);
    } else if (activePromoCode === 'FIRST100' && count > 0) {
      appliedDiscount = 100;
    } else if (count === 0) {
      appliedDiscount = 0;
      activePromoCode = '';
      if (promoCodeInput) promoCodeInput.value = '';
      if (promoMessage) promoMessage.style.display = 'none';
    }

    if (appliedDiscount > 0 && discountRow && discountText) {
      discountRow.style.display = 'flex';
      discountText.textContent = `-₹${appliedDiscount}`;
    } else if (discountRow) {
      discountRow.style.display = 'none';
    }

    const finalFareDisplay = Math.max(0, originalBaseTotal - appliedDiscount);

    if (totalPriceText) totalPriceText.textContent = `₹${finalFareDisplay}`;

    if (count > 0) {
      if (selectedSeatsText) selectedSeatsText.textContent = selectedSeats.join(', ');
      if (checkoutBtn) checkoutBtn.disabled = false;
    } else {
      if (selectedSeatsText) selectedSeatsText.textContent = 'None';
      if (checkoutBtn) checkoutBtn.disabled = true;
    }
  }

  // Checkout Handler
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const count = selectedSeats.length;
      if (count === 0) return;

      const originalBase = count * SEAT_PRICE;
      const finalBaseFare = Math.max(0, originalBase - appliedDiscount);
      const calculatedTaxFare = Math.round(finalBaseFare * 0.05);

      const updatedData = {
        busId: busId,
        busName: currentBusName,
        seats: selectedSeats,
        seatCount: count,
        baseSeatPrice: SEAT_PRICE,
        baseFare: finalBaseFare,
        taxFare: calculatedTaxFare,
        from: fromLoc,
        to: toLoc,
        travelDate: travelDate
      };

      localStorage.setItem('travelgo_booking_data', JSON.stringify(updatedData));
      localStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));

      window.location.href = `./passenger.html?date=${encodeURIComponent(travelDate)}&busId=${encodeURIComponent(busId || '')}`;
    });
  }

  const currentlyBookedSeats = await fetchOccupiedSeats();
  renderSeats(currentlyBookedSeats);
  updateSummary();
});