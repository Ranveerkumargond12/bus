// --- GLOBAL OVERRIDE: Block any default browser alerts ---
window.alert = function(msg) {
  console.log("Blocked default alert:", msg);
};

document.addEventListener('DOMContentLoaded', () => {
  let bookingData = null;
  try {
    const raw = localStorage.getItem('travelgo_booking_data');
    if (raw) bookingData = JSON.parse(raw);
  } catch (e) {
    console.error("Error parsing booking data:", e);
  }

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

  // --- Fetch Logged-in User Wallet Info ---
  let loggedInUser = null;
  try {
    loggedInUser = JSON.parse(localStorage.getItem('safarsathi_user')) || 
                   JSON.parse(localStorage.getItem('travelgo_user')) || 
                   JSON.parse(localStorage.getItem('user')) || 
                   JSON.parse(localStorage.getItem('loggedInUser'));
  } catch (err) {
    loggedInUser = null;
  }

  // Display Wallet Balance in Payment Form if element exists
  const checkoutWalletBalance = document.getElementById('checkoutWalletBalance');
  if (checkoutWalletBalance && loggedInUser) {
    checkoutWalletBalance.textContent = `₹${loggedInUser.wallet_balance || 150}`;
  }

  // --- MODERN CUSTOM NOTIFICATION FUNCTION ---
  function showCustomAlert(message, type = 'info') {
    let existingAlert = document.getElementById('customPaymentAlert');
    if (existingAlert) existingAlert.remove();

    const alertBox = document.createElement('div');
    alertBox.id = 'customPaymentAlert';
    alertBox.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      background: ${type === 'error' ? '#fee2e2' : '#ecfdf5'};
      color: ${type === 'error' ? '#991b1b' : '#065f46'};
      border: 1px solid ${type === 'error' ? '#f87171' : '#34d399'};
      padding: 16px 20px;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      font-family: inherit;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 380px;
    `;

    alertBox.innerHTML = `
      <span style="font-size: 18px;">${type === 'error' ? '⚠️' : '✨'}</span>
      <div style="flex: 1; line-height: 1.4;">${message}</div>
      <button onclick="this.parentElement.remove()" style="background:none; border:none; cursor:pointer; font-size:16px; color:inherit; font-weight:bold;">&times;</button>
    `;

    document.body.appendChild(alertBox);

    setTimeout(() => {
      if (alertBox) alertBox.remove();
    }, 5000);
  }

  // --- FEATURE 1: Seat Selection / Payment Timer Logic ---
  const timerDisplay = document.getElementById('paymentTimer');
  let TIMER_DURATION = 10 * 60; // 10 minutes in seconds

  const savedExpiryTime = localStorage.getItem('travelgo_timer_expiry');
  const currentTime = Date.now();

  if (savedExpiryTime) {
    let timeLeft = Math.floor((parseInt(savedExpiryTime) - currentTime) / 1000);
    if (timeLeft > 0) {
      TIMER_DURATION = timeLeft;
    } else {
      localStorage.removeItem('travelgo_timer_expiry');
    }
  } else {
    let expiryTime = currentTime + (TIMER_DURATION * 1000);
    localStorage.setItem('travelgo_timer_expiry', expiryTime);
  }

  const countdownInterval = setInterval(() => {
    let minutes = Math.floor(TIMER_DURATION / 60);
    let seconds = TIMER_DURATION % 60;

    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    if (timerDisplay) {
      timerDisplay.textContent = `${minutes}:${seconds}`;
    }

    if (--TIMER_DURATION < 0) {
      clearInterval(countdownInterval);
      localStorage.removeItem('travelgo_timer_expiry');
      localStorage.removeItem('travelgo_booking_data');
      
      showCustomAlert("Session expired! Your held seats have been released.", "error");
      setTimeout(() => { window.location.href = "index.html"; }, 2000);
    }
  }, 1000);

  // Extract Travel Date from URL query params or bookingData
  const urlParams = new URLSearchParams(window.location.search);
  let travelDate = urlParams.get('date') || urlParams.get('travelDate');
  if (!travelDate && bookingData && bookingData.travelDate) {
    travelDate = bookingData.travelDate;
  }
  if (!travelDate) {
    const today = new Date();
    travelDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Extract Bus ID
  const busId = (bookingData && bookingData.busId) ? bookingData.busId : (urlParams.get('busId') || '1');

  let savedSeats = (bookingData && bookingData.seats) ? bookingData.seats : ['S1'];
  let passengerDetails = (bookingData && bookingData.passengers) ? bookingData.passengers : [];

  // Base Fare Calculation
  let baseFare = bookingData && bookingData.baseFare ? Number(bookingData.baseFare) : (savedSeats.length * 1200);

  // Add-ons Total Calculation
  let addonsTotal = 0;
  if (bookingData && bookingData.addons && Array.isArray(bookingData.addons)) {
    addonsTotal = bookingData.addons.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }

  // Combined Subtotal (Base Fare + Add-ons)
  let subTotal = baseFare + addonsTotal;

  // --- GST FIX: Guaranteed 5% GST & Service Charge Calculation ---
  let taxFare = Math.round(subTotal * 0.05);

  // Final Total Payable Amount
  let totalAmount = subTotal + taxFare;

  // DOM Elements Selection based on payment.html
  const summarySeatsEl = document.getElementById('summarySeats');
  const summaryPassengersEl = document.getElementById('summaryPassengers');
  const baseFareEl = document.getElementById('display-base-fare');
  const taxFareEl = document.getElementById('display-tax-fare');
  const summaryAmountEl = document.getElementById('summaryAmount');
  const btnPayText = document.getElementById('btn-pay-text');

  // Injecting values into HTML elements
  if (summarySeatsEl) {
    summarySeatsEl.textContent = Array.isArray(savedSeats) ? savedSeats.join(', ') : savedSeats;
  }
  if (summaryPassengersEl) {
    summaryPassengersEl.textContent = passengerDetails.length || (Array.isArray(savedSeats) ? savedSeats.length : 1);
  }
  if (baseFareEl) {
    baseFareEl.textContent = `₹${subTotal}`;
  }
  if (taxFareEl) {
    taxFareEl.textContent = `₹${taxFare}`;
  }
  if (summaryAmountEl) {
    summaryAmountEl.textContent = `₹${totalAmount}`;
  }
  if (btnPayText) {
    btnPayText.textContent = `Pay ₹${totalAmount} Securely`;
  }

  // Payment Method Tabs Switching Logic
  const radios = document.querySelectorAll('input[name="paymentType"]');
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.form-panel').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.payment-method').forEach(el => el.classList.remove('active'));

      e.target.closest('.payment-method')?.classList.add('active');
      const targetPanel = document.getElementById(`${e.target.value}Form`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  function generateTicketId() {
    return 'TG-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  const paymentForm = document.getElementById('paymentForm');
  const payBtn = document.getElementById('payNowBtn');
  const successModal = document.getElementById('successModal');
  const ticketIdEl = document.getElementById('ticketId');
  const doneBtn = document.getElementById('doneBtn');

  if (paymentForm) {
    paymentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Check selected payment method
      const selectedMethodRadio = document.querySelector('input[name="paymentType"]:checked');
      const selectedMethod = selectedMethodRadio ? selectedMethodRadio.value : 'upi';

      // If user selected Wallet, handle partial or full deduction seamlessly
      if (selectedMethod === 'wallet') {
        let currentBalance = loggedInUser ? Number(loggedInUser.wallet_balance || 150) : 0;
        
        if (currentBalance <= 0) {
          showCustomAlert(`Your wallet balance is ₹0. Please choose another payment method or add money.`, "error");
          return;
        }

        let amountPaidFromWallet = 0;
        let remainingAmountToPay = 0;

        if (currentBalance >= totalAmount) {
          // Full payment from wallet
          amountPaidFromWallet = totalAmount;
          loggedInUser.wallet_balance = currentBalance - totalAmount;
        } else {
          // Partial payment: Jitna wallet mein hai wo minus ho jayega
          amountPaidFromWallet = currentBalance;
          remainingAmountToPay = totalAmount - currentBalance;
          loggedInUser.wallet_balance = 0; 
          totalAmount = remainingAmountToPay; // Update final total to remaining amount
          
          showCustomAlert(`Wallet balance of ₹${amountPaidFromWallet} applied successfully! Remaining balance of ₹${remainingAmountToPay} will be adjusted.`);
        }

        // Record transaction
        if (!loggedInUser.transactions) loggedInUser.transactions = [];
        loggedInUser.transactions.push({
          title: `Bus Booking (Wallet Payment)`,
          amount: -amountPaidFromWallet,
          date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
        });

        // Save back to localStorage immediately
        localStorage.setItem('safarsathi_user', JSON.stringify(loggedInUser));
        localStorage.setItem('travelgo_user', JSON.stringify(loggedInUser));
      }

      // Clear timer on successful payment submission
      localStorage.removeItem('travelgo_timer_expiry');
      clearInterval(countdownInterval);

      if (!loggedInUser) {
        try {
          loggedInUser = JSON.parse(localStorage.getItem('safarsathi_user')) || 
                         JSON.parse(localStorage.getItem('travelgo_user')) || 
                         JSON.parse(localStorage.getItem('user')) || 
                         JSON.parse(localStorage.getItem('loggedInUser'));
        } catch (err) {
          loggedInUser = null;
        }
      }

      const isUserValid = loggedInUser && (loggedInUser.id || loggedInUser.email || loggedInUser.name);

      if (!isUserValid) {
        showCustomAlert("Please log in or sign up to complete your ticket booking.", "error");
        setTimeout(() => { window.location.href = `auth.html?redirect=payment.html`; }, 1500);
        return;
      }

      if (payBtn) {
        payBtn.innerHTML = 'Processing...';
        payBtn.disabled = true;
      }

      const randomID = generateTicketId();

      const dbBookingPayload = {
        pnr: randomID,
        user_id: loggedInUser.id || null,
        bus_id: busId,
        passenger_name: passengerDetails[0]?.name || loggedInUser.name || 'Passenger',
        passenger_email: loggedInUser.email || 'user@example.com',
        source: (bookingData && bookingData.from) ? bookingData.from : 'Source',
        destination: (bookingData && bookingData.to) ? bookingData.to : 'Destination',
        seat_no: Array.isArray(savedSeats) ? savedSeats.join(',') : String(savedSeats),
        travel_date: travelDate,
        total_fare: totalAmount,
        addons: bookingData?.addons || [],
        tax_fare: taxFare
      };

      try {
        // Updated to Render Live API URL
        const response = await fetch(`${API_URL}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbBookingPayload)
        });

        const resData = await response.json();
        console.log("Database booking save response:", resData);

      } catch (apiError) {
        console.warn("Backend DB Save Error, falling back to LocalStorage:", apiError);
      }

      const newBooking = {
        pnr: randomID,
        busId: busId,
        travelDate: travelDate,
        userId: loggedInUser.id || '',
        userEmail: loggedInUser.email || '',
        passengerEmail: loggedInUser.email || '',
        passenger_email: loggedInUser.email || '',
        userPhone: loggedInUser.mobile || loggedInUser.phone || '',
        userName: loggedInUser.name || 'Passenger',
        from: dbBookingPayload.source,
        to: dbBookingPayload.destination,
        busName: (bookingData && bookingData.busName) ? bookingData.busName : 'Express Bus',
        status: 'Confirmed',
        seats: Array.isArray(savedSeats) ? savedSeats : [savedSeats],
        passengersCount: passengerDetails.length || (Array.isArray(savedSeats) ? savedSeats.length : 1),
        passengers: passengerDetails,
        addons: bookingData?.addons || [],
        taxFare: taxFare,
        bookingDate: new Date().toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric'
        }),
        totalFare: totalAmount
      };

      let existingBookings = JSON.parse(localStorage.getItem('myBookings')) || [];
      existingBookings.unshift(newBooking);
      localStorage.setItem('myBookings', JSON.stringify(existingBookings));

      if (ticketIdEl) ticketIdEl.textContent = randomID;

      if (successModal) {
        successModal.classList.add('show');
      } else {
        window.location.href = "my-bookings.html";
      }
    });
  }

  if (doneBtn) {
    doneBtn.addEventListener('click', () => {
      localStorage.removeItem('travelgo_booking_data');
      localStorage.removeItem('selectedSeats');
      localStorage.removeItem('passengerDetails');
      localStorage.removeItem('travelgo_timer_expiry');

      window.location.href = "my-bookings.html";
    });
  }
});