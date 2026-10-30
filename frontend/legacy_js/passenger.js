document.addEventListener('DOMContentLoaded', () => {
  const rawBookingData = localStorage.getItem('travelgo_booking_data');
  const bookingData = rawBookingData ? JSON.parse(rawBookingData) : null;

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

  // URL Query Params Read
  const urlParams = new URLSearchParams(window.location.search);
  let travelDate = urlParams.get('date') || urlParams.get('travelDate');
  let busId = urlParams.get('busId') || (bookingData ? bookingData.busId : '');

  if (!travelDate && bookingData && bookingData.travelDate) {
    travelDate = bookingData.travelDate;
  }
  if (!travelDate) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    travelDate = `${year}-${month}-${day}`;
  }

  const loggedInUser = JSON.parse(
    localStorage.getItem('safarsathi_user') || 
    localStorage.getItem('travelgo_user') || 
    '{}'
  );

  const savedSeats = (bookingData && bookingData.seats && bookingData.seats.length > 0)
    ? bookingData.seats
    : (JSON.parse(localStorage.getItem('selectedSeats')) || ['S1']);

  // Base Fare Calculation
  const baseFare = bookingData ? (bookingData.baseFare || (savedSeats.length * 850)) : (savedSeats.length * 850);
  const taxFare = 0;

  const displaySeats = document.getElementById('displaySeats');
  const displayFare = document.getElementById('displayFare');

  if (displaySeats) displaySeats.textContent = savedSeats.join(', ');

  // Function to calculate Total Amount including Add-ons
  function updateTotalPrice() {
    let currentTotal = baseFare;

    const baggageCheckbox = document.getElementById('addBaggage');
    const insuranceCheckbox = document.getElementById('addInsurance');
    const mealCheckbox = document.getElementById('addMeal');

    if (baggageCheckbox && baggageCheckbox.checked) currentTotal += parseInt(baggageCheckbox.value);
    if (insuranceCheckbox && insuranceCheckbox.checked) currentTotal += parseInt(insuranceCheckbox.value);
    if (mealCheckbox && mealCheckbox.checked) currentTotal += parseInt(mealCheckbox.value);

    if (displayFare) displayFare.textContent = `₹${currentTotal}`;
    return currentTotal;
  }

  // Event Listeners for Add-ons Checkboxes to update fare dynamically
  ['addBaggage', 'addInsurance', 'addMeal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', updateTotalPrice);
    }
  });

  // Initial Fare Display
  updateTotalPrice();

  // Contact Inputs Autofill
  const emailElem = document.getElementById('contactEmail');
  const phoneElem = document.getElementById('contactPhone');

  if (emailElem && loggedInUser.email) emailElem.value = loggedInUser.email;
  if (phoneElem && loggedInUser.phone) phoneElem.value = loggedInUser.phone;

  // Passenger Cards Render
  const cardsContainer = document.getElementById('passengerCardsContainer');
  if (cardsContainer && savedSeats.length > 0) {
    cardsContainer.innerHTML = savedSeats.map((seat, index) => `
      <div class="passenger-card" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 15px;">
        <div class="passenger-title" style="color: #38bdf8; font-weight: bold; margin-bottom: 15px;">Passenger ${index + 1} (Seat ${seat})</div>
        <div class="form-grid" style="display: flex; gap: 15px; flex-wrap: wrap;">
          <div class="form-group" style="flex: 2; min-width: 200px;">
            <label style="display: block; color: #94a3b8; font-size: 0.85rem; margin-bottom: 5px;">Full Name</label>
            <input type="text" class="glass-input" name="name_${seat}" placeholder="Enter full name" value="${index === 0 && loggedInUser.name ? loggedInUser.name : ''}" required style="width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 6px;">
          </div>
          <div class="form-group sm" style="flex: 1; min-width: 80px;">
            <label style="display: block; color: #94a3b8; font-size: 0.85rem; margin-bottom: 5px;">Age</label>
            <input type="number" class="glass-input" name="age_${seat}" placeholder="Age" min="1" max="100" required style="width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 6px;">
          </div>
          <div class="form-group" style="flex: 1; min-width: 150px;">
            <label style="display: block; color: #94a3b8; font-size: 0.85rem; margin-bottom: 5px;">Gender</label>
            <div class="gender-selector" style="display: flex; gap: 10px; margin-top: 5px;">
              <label class="gender-pill" style="color: #fff; cursor: pointer;">
                <input type="radio" name="gender_${seat}" value="Male" checked>
                <span>Male</span>
              </label>
              <label class="gender-pill" style="color: #fff; cursor: pointer;">
                <input type="radio" name="gender_${seat}" value="Female">
                <span>Female</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Form Submit Handler
  const form = document.getElementById('passengerForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const passengerData = savedSeats.map(seat => ({
        seat: seat,
        name: form[`name_${seat}`] ? form[`name_${seat}`].value : `Passenger`,
        age: form[`age_${seat}`] ? form[`age_${seat}`].value : '25',
        gender: form[`gender_${seat}`] ? form[`gender_${seat}`].value : 'Male'
      }));

      // Gather Selected Add-ons
      const selectedAddons = [];
      if (document.getElementById('addBaggage')?.checked) selectedAddons.push({ name: 'Extra Baggage (+15kg)', price: 150 });
      if (document.getElementById('addInsurance')?.checked) selectedAddons.push({ name: 'Travel Insurance', price: 49 });
      if (document.getElementById('addMeal')?.checked) selectedAddons.push({ name: 'Snacks & Beverage Box', price: 99 });

      const finalTotalAmount = updateTotalPrice();
      const contactEmail = emailElem ? emailElem.value : (loggedInUser.email || '');
      const contactPhone = phoneElem ? phoneElem.value : (loggedInUser.phone || '');

      const updatedBookingData = {
        ...(bookingData || {}),
        busId: busId,
        travelDate: travelDate,
        seats: savedSeats,
        seatCount: savedSeats.length,
        baseFare: baseFare,
        addons: selectedAddons,
        taxFare: 0,
        totalAmount: finalTotalAmount,
        passengers: passengerData,
        contact: {
          email: contactEmail,
          phone: contactPhone
        }
      };

      // 1. LocalStorage update
      localStorage.setItem('travelgo_booking_data', JSON.stringify(updatedBookingData));
      localStorage.setItem('passengerDetails', JSON.stringify(passengerData));

      // 2. Database API call to save booked seats immediately in Backend using Render URL
      try {
        const response = await fetch(`${API_URL}/book-ticket`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: loggedInUser.id || null,
            userEmail: contactEmail,
            busId: busId,
            source: (bookingData && bookingData.from) || 'Mumbai',
            destination: (bookingData && bookingData.to) || 'Goa',
            seatNumbers: savedSeats,
            passengerCount: savedSeats.length,
            travelDate: travelDate,
            totalFare: finalTotalAmount,
            addons: selectedAddons
          })
        });

        const resData = await response.json();
        if (resData.success) {
          updatedBookingData.pnr = resData.pnr;
          localStorage.setItem('travelgo_booking_data', JSON.stringify(updatedBookingData));
        }
      } catch (err) {
        console.warn("Backend save failed, booking stored in LocalStorage fallback:", err);
      }

      // Also save in LocalStorage myBookings array for offline support
      try {
        const existingMyBookings = JSON.parse(localStorage.getItem('myBookings')) || [];
        existingMyBookings.push({
          busId: busId,
          travelDate: travelDate,
          seats: savedSeats,
          from: (bookingData && bookingData.from) || 'Mumbai',
          to: (bookingData && bookingData.to) || 'Goa',
          totalAmount: finalTotalAmount,
          addons: selectedAddons,
          status: 'Confirmed'
        });
        localStorage.setItem('myBookings', JSON.stringify(existingMyBookings));
      } catch(e) {}

      // 3. Redirect to Payment Page
      window.location.href = `payment.html?date=${encodeURIComponent(travelDate)}&busId=${encodeURIComponent(busId)}`;
    });
  }
});