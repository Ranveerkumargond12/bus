document.addEventListener('DOMContentLoaded', async () => {
  const bookingsContainer = document.getElementById('bookingsContainer') || document.getElementById('bookingsList');

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

  // Multi-key User Check
  const currentUser = JSON.parse(
    localStorage.getItem('safarsathi_user') || 
    localStorage.getItem('travelgo_user') || 
    localStorage.getItem('user') || 
    localStorage.getItem('currentUser') || 
    'null'
  );

  let globalBookings = [];
  let currentFilter = 'ALL';
  let pendingCancelPNR = null;

  // Track Bus Variables
  let leafletMap = null;
  let busMarker = null;
  let trackingInterval = null;

  // External Script Loader Helper (For QRCode Library)
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Inject QRCode Library dynamically if not present
  if (typeof QRCode === 'undefined') {
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js').catch(err => console.error("QRCode Lib Load Failed:", err));
  }

  // 1. Custom Cancel Confirmation Modal Injection
  if (!document.getElementById('customCancelModal')) {
    const modalHTML = `
      <div id="customCancelModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); z-index: 9999; justify-content: center; align-items: center;">
        <div style="background: #ffffff; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
          <div style="width: 60px; height: 60px; background: #ffebee; color: #dc3545; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 28px; font-weight: bold;">✕</div>
          <h3 style="margin: 0 0 10px; color: #333;">Cancel Ticket?</h3>
          <p style="color: #666; font-size: 0.95rem; margin-bottom: 25px;">
            Are you sure you want to cancel the ticket for PNR: <strong id="cancelModalPNR" style="color: #007bff;"></strong>?
          </p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="cancelModalCloseBtn" style="flex: 1; padding: 10px; background: #f1f3f5; color: #495057; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">No, Keep It</button>
            <button id="cancelModalConfirmBtn" style="flex: 1; padding: 10px; background: #dc3545; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Yes, Cancel</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // 2. Ticket Preview & Download/Print Modal Injection
  if (!document.getElementById('ticketPreviewModal')) {
    const ticketModalHTML = `
      <div id="ticketPreviewModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); z-index: 99999; justify-content: center; align-items: center; padding: 20px; overflow-y: auto;">
        <div style="background: #fff; border-radius: 12px; max-width: 500px; width: 100%; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); position: relative;">
          
          <!-- Printable Ticket Container -->
          <div id="ticketPrintArea" style="padding: 25px; background: #ffffff;">
            <div style="text-align: center; border-bottom: 2px dashed #007bff; padding-bottom: 15px; margin-bottom: 15px;">
              <h2 style="margin: 0; color: #007bff; font-size: 1.5rem;">🚌 SafarSathi Bus Ticket</h2>
              <p style="margin: 5px 0 0; color: #666; font-size: 0.85rem;">Valid E-Ticket for Journey</p>
            </div>

            <!-- QR Code Section -->
            <div style="display: flex; justify-content: center; margin-bottom: 15px;">
              <div id="qrcode" style="padding: 10px; background: #fff; border: 1px solid #ddd; border-radius: 8px;"></div>
            </div>

            <!-- Ticket Details Table -->
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; color: #333;">
              <tr>
                <td style="padding: 6px 0; color: #666;">PNR Number:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;" id="modalPNR">-</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Passenger:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;" id="modalPassenger">-</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Route:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;" id="modalRoute">-</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Bus Name:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;" id="modalBus">-</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Travel Date:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;" id="modalDate">-</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Seat No(s):</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;" id="modalSeat">-</td>
              </tr>
              <tr style="border-top: 1px solid #eee;">
                <td style="padding: 10px 0 0; font-weight: bold; font-size: 1rem;">Total Paid:</td>
                <td style="padding: 10px 0 0; font-weight: bold; font-size: 1.1rem; color: #28a745; text-align: right;" id="modalFare">-</td>
              </tr>
            </table>
          </div>

          <!-- Modal Action Buttons -->
          <div style="background: #f8f9fa; padding: 15px 25px; display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid #eee;">
            <button onclick="closeTicketModal()" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Close</button>
            <button onclick="printCurrentTicket()" style="padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">🖨️ Print</button>
            <button id="downloadPdfBtn" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">📄 Save PDF</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', ticketModalHTML);
  }

  // 3. Review & Rating Modal Injection
  if (!document.getElementById('customReviewModal')) {
    const reviewModalHTML = `
      <div id="customReviewModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); z-index: 99999; justify-content: center; align-items: center; padding: 20px;">
        <div style="background: #fff; border-radius: 12px; max-width: 450px; width: 100%; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); position: relative;">
          <h3 style="margin-top: 0; color: #007bff; margin-bottom: 15px;">Rate Your Journey</h3>
          <form id="customReviewForm" onsubmit="submitUserReview(event)">
            <input type="hidden" id="reviewModalPNR">
            <div style="margin-bottom: 15px;">
              <label style="display: block; font-size: 0.9rem; color: #555; margin-bottom: 5px;">Select Rating</label>
              <select id="reviewRatingSelect" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; outline: none; font-size: 1rem;">
                <option value="5">⭐⭐⭐⭐⭐ (5 - Excellent)</option>
                <option value="4">⭐⭐⭐⭐ (4 - Good)</option>
                <option value="3">⭐⭐⭐ (3 - Average)</option>
                <option value="2">⭐⭐ (2 - Poor)</option>
                <option value="1">⭐ (1 - Terrible)</option>
              </select>
            </div>
            <div style="margin-bottom: 20px;">
              <label style="display: block; font-size: 0.9rem; color: #555; margin-bottom: 5px;">Your Feedback / Review</label>
              <textarea id="reviewCommentText" rows="3" placeholder="Bus cleanliness, staff behavior, punctuality..." required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; outline: none; resize: none; font-size: 0.95rem;"></textarea>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" onclick="closeReviewModal()" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
              <button type="submit" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Submit Review</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', reviewModalHTML);
  }

  const cancelModal = document.getElementById('customCancelModal');
  const cancelModalPNR = document.getElementById('cancelModalPNR');
  const cancelModalCloseBtn = document.getElementById('cancelModalCloseBtn');
  const cancelModalConfirmBtn = document.getElementById('cancelModalConfirmBtn');

  cancelModalCloseBtn.addEventListener('click', () => {
    cancelModal.style.display = 'none';
    pendingCancelPNR = null;
  });

  cancelModalConfirmBtn.addEventListener('click', async () => {
    if (pendingCancelPNR) {
      await executeCancellation(pendingCancelPNR);
      cancelModal.style.display = 'none';
      pendingCancelPNR = null;
    }
  });

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function getBookingCategory(booking) {
    const rawStatus = (booking.status || '').toUpperCase();
    if (rawStatus === 'CANCELLED' || rawStatus === 'CANCEL') {
      return 'CANCELLED';
    }

    const dateVal = booking.travel_date || booking.travelDate || booking.date;
    if (!dateVal) return 'UPCOMING';

    const travelDate = new Date(dateVal);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!isNaN(travelDate.getTime()) && travelDate < today) {
      return 'COMPLETED';
    }

    return 'UPCOMING';
  }

  function renderEmptyState(message = 'No Booked Tickets Found!') {
    if (!bookingsContainer) return;
    bookingsContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <h3>${message}</h3>
        ${!currentUser ? 
          '<p>Please login to view your booked tickets.</p><a href="auth.html" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background: #007bff; color: white; border-radius: 5px; text-decoration: none;">Login Now</a>' : 
          '<p>You have not booked any tickets yet.</p><a href="index.html" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background: #007bff; color: white; border-radius: 5px; text-decoration: none;">Book Ticket Now</a>'
        }
      </div>
    `;
  }

  window.cancelTicket = function(pnr) {
    pendingCancelPNR = pnr;
    cancelModalPNR.textContent = pnr;
    cancelModal.style.display = 'flex';
  };

  // --- REVIEW MODAL FUNCTIONS ---
  window.openReviewModal = function(pnr) {
    document.getElementById('reviewModalPNR').value = pnr;
    document.getElementById('customReviewModal').style.display = 'flex';
  };

  window.closeReviewModal = function() {
    document.getElementById('customReviewModal').style.display = 'none';
    document.getElementById('customReviewForm').reset();
  };

  // Custom Styled Success Toast Function
  function showSuccessToast(message) {
    let toast = document.getElementById('customSuccessToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'customSuccessToast';
      toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        font-family: Arial, sans-serif;
        font-weight: 600;
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 10px;
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      `;
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span style="font-size: 1.2rem;">✅</span> <span>${message}</span>`;
    
    // Animate In
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 100);

    // Animate Out after 3 seconds
    setTimeout(() => {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
    }, 3000);
  }

  window.submitUserReview = function(e) {
    e.preventDefault();
    const pnr = document.getElementById('reviewModalPNR').value;
    const rating = parseInt(document.getElementById('reviewRatingSelect').value, 10);
    const comment = document.getElementById('reviewCommentText').value.trim();

    // Update in memory array
    globalBookings = globalBookings.map(b => {
      if (String(b.pnr || b.id) === String(pnr)) {
        b.review = { rating, comment };
      }
      return b;
    });

    // Update in LocalStorage
    try {
      let localBookings = JSON.parse(localStorage.getItem('myBookings')) || [];
      localBookings = localBookings.map(b => {
        if (String(b.pnr || b.id) === String(pnr)) {
          b.review = { rating, comment };
        }
        return b;
      });
      localStorage.setItem('myBookings', JSON.stringify(localBookings));
    } catch (err) {
      console.error("Failed to update review in localStorage", err);
    }

    closeReviewModal();
    renderBookings();
    
    // Call the beautiful custom notification toast
    showSuccessToast('Thank you! Your review has been submitted successfully.');
  };

  // --- SHOW TICKET MODAL WITH QR & DETAILS ---
  let activePNRForDownload = null;

  window.downloadTicket = function(pnr) {
    const booking = globalBookings.find(b => String(b.pnr || b.id) === String(pnr));
    if (!booking) {
      alert("Ticket details not found!");
      return;
    }

    activePNRForDownload = pnr;

    const passengerName = booking.passenger_name || booking.passengerName || 'Passenger';
    const source = booking.source || booking.from || 'Source';
    const destination = booking.destination || booking.to || 'Destination';
    const busName = booking.bus_name || booking.busName || 'Express Bus';
    const travelDate = formatDate(booking.travel_date || booking.travelDate || booking.date);
    
    let seatNo = booking.seat_no || booking.seat_numbers || booking.seats || 'N/A';
    if (Array.isArray(seatNo)) seatNo = seatNo.join(', ');

    const totalFare = booking.total_fare || booking.totalAmount || booking.fare || 0;

    // Set Values in Modal
    document.getElementById('modalPNR').textContent = pnr;
    document.getElementById('modalPassenger').textContent = passengerName;
    document.getElementById('modalRoute').textContent = `${source} ➔ ${destination}`;
    document.getElementById('modalBus').textContent = busName;
    document.getElementById('modalDate').textContent = travelDate;
    document.getElementById('modalSeat').textContent = seatNo;
    document.getElementById('modalFare').textContent = `₹${totalFare}`;

    // Generate QR Code
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = ''; // Clear previous QR

    const qrData = `PNR: ${pnr} | Passenger: ${passengerName} | Route: ${source}-${destination} | Date: ${travelDate}`;

    if (typeof QRCode !== 'undefined') {
      new QRCode(qrContainer, {
        text: qrData,
        width: 120,
        height: 120,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      qrContainer.innerHTML = '<p style="font-size:0.8rem; color:#888;">[QR Code Loaded]</p>';
    }

    // Attach PDF Save Handler
    document.getElementById('downloadPdfBtn').onclick = () => saveTicketPDF(pnr);

    // Show Modal
    document.getElementById('ticketPreviewModal').style.display = 'flex';
  };

  window.closeTicketModal = function() {
    document.getElementById('ticketPreviewModal').style.display = 'none';
  };

  // Printable Handler
  window.printCurrentTicket = function() {
    const printContent = document.getElementById('ticketPrintArea').outerHTML;
    const win = window.open('', '', 'width=700,height=700');
    win.document.write(`
      <html>
        <head>
          <title>Print Ticket - ${activePNRForDownload}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 8px 0; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() { window.print(); window.close(); }
          <\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // PDF Generator Handler
  function saveTicketPDF(pnr) {
    const ticketElem = document.getElementById('ticketPrintArea');
    if (typeof html2pdf !== 'undefined') {
      const options = {
        margin: [10, 10, 10, 10],
        filename: `SafarSathi_Ticket_${pnr}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(options).from(ticketElem).save();
    } else {
      alert("PDF library loading! Please try again in 2 seconds.");
    }
  }

  // --- LIVE BUS TRACKING FUNCTION ---
  window.trackBus = function(busName, source, destination) {
    const modal = document.getElementById('trackingModal');
    const trackTitle = document.getElementById('trackBusTitle');
    
    if (trackTitle) {
      trackTitle.textContent = `Tracking: ${busName} (${source} ➔ ${destination})`;
    }
    if (modal) {
      modal.style.display = 'flex';
    }

    const routePoints = [
      [28.6139, 77.2090],
      [28.4089, 77.0378],
      [28.1487, 76.8143],
      [27.8189, 76.2808],
      [26.9124, 75.7873]
    ];

    if (typeof L !== 'undefined') {
      setTimeout(() => {
        if (!leafletMap) {
          leafletMap = L.map('map').setView(routePoints[0], 8);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(leafletMap);
        } else {
          leafletMap.invalidateSize();
        }

        L.polyline(routePoints, { color: '#007bff', weight: 4 }).addTo(leafletMap);

        if (busMarker) leafletMap.removeLayer(busMarker);
        
        busMarker = L.marker(routePoints[0]).addTo(leafletMap)
          .bindPopup(`<b>${busName}</b><br>On Route to ${destination}`).openPopup();

        let step = 0;
        if (trackingInterval) clearInterval(trackingInterval);

        trackingInterval = setInterval(() => {
          step = (step + 1) % routePoints.length;
          const newPos = routePoints[step];
          busMarker.setLatLng(newPos);
          leafletMap.panTo(newPos);
        }, 3000);
      }, 200);
    }
  };

  window.closeTrackingModal = function() {
    const modal = document.getElementById('trackingModal');
    if (modal) modal.style.display = 'none';
    if (trackingInterval) clearInterval(trackingInterval);
  };

  // Permanently Update Cancellation in Memory & Storage
  async function executeCancellation(pnr) {
    try {
      await fetch(`${API_URL}/cancel-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pnr: pnr, email: currentUser ? currentUser.email : '' })
      });
    } catch (err) {
      console.warn("Backend server not reachable, updating LocalStorage directly.");
    }

    try {
      let localBookings = JSON.parse(localStorage.getItem('myBookings')) || [];
      localBookings = localBookings.map(b => {
        if (String(b.pnr || b.id) === String(pnr)) {
          b.status = 'CANCELLED';
        }
        return b;
      });
      localStorage.setItem('myBookings', JSON.stringify(localBookings));
    } catch (e) {
      console.error("LocalStorage update failed:", e);
    }

    globalBookings = globalBookings.map(b => {
      if (String(b.pnr || b.id) === String(pnr)) {
        b.status = 'CANCELLED';
      }
      return b;
    });

    renderBookings();
  }

  if (!currentUser) {
    renderEmptyState('You are logged out!');
    return;
  }

  async function fetchUserBookings() {
    let allBookings = [];
    let localBookings = [];

    try {
      localBookings = JSON.parse(localStorage.getItem('myBookings')) || [];
    } catch (e) {
      localBookings = [];
    }

    try {
      const userEmail = currentUser.email;
      const res = await fetch(`${API_URL}/my-bookings?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        allBookings = await res.json();
      }
    } catch (error) {
      console.warn("Backend API unavailable, using local bookings.");
    }

    if (!Array.isArray(allBookings) || allBookings.length === 0) {
      allBookings = localBookings.filter(b => 
        (b.passengerEmail && b.passengerEmail === currentUser.email) ||
        (b.passenger_email && b.passenger_email === currentUser.email) ||
        (!b.passengerEmail && !b.passenger_email)
      );
    } else {
      allBookings = allBookings.map(b => {
        const pnrVal = String(b.pnr || b.id);
        const matchedLocal = localBookings.find(lb => String(lb.pnr || lb.id) === pnrVal);
        if (matchedLocal) {
          if (matchedLocal.status === 'CANCELLED' || matchedLocal.status === 'CANCEL') {
            b.status = 'CANCELLED';
          }
          if (matchedLocal.review) {
            b.review = matchedLocal.review;
          }
        }
        return b;
      });
    }

    globalBookings = allBookings;
    renderBookings();
  }

  window.filterBookings = function(type, btnElement) {
    currentFilter = type;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    renderBookings();
  };

  function renderBookings() {
    if (!bookingsContainer) return;

    if (!globalBookings || globalBookings.length === 0) {
      renderEmptyState();
      return;
    }

    const filteredBookings = globalBookings.filter(b => {
      const category = getBookingCategory(b);
      if (currentFilter === 'ALL') return true;
      return category === currentFilter;
    });

    if (filteredBookings.length === 0) {
      renderEmptyState(`No ${currentFilter.toLowerCase()} bookings found!`);
      return;
    }

    bookingsContainer.innerHTML = '';

    filteredBookings.forEach(booking => {
      const pnr = booking.pnr || booking.id || 'N/A';
      const passengerName = booking.passenger_name || booking.passengerName || 'Passenger';
      const source = booking.source || booking.from || 'Source';
      const destination = booking.destination || booking.to || 'Destination';
      const busName = booking.bus_name || booking.busName || 'Express Bus';
      const travelDate = formatDate(booking.travel_date || booking.travelDate || booking.date);
      
      let seatNo = booking.seat_no || booking.seat_numbers || booking.seats || 'N/A';
      if (Array.isArray(seatNo)) seatNo = seatNo.join(', ');

      const totalFare = booking.total_fare || booking.totalAmount || booking.fare || 0;
      
      const category = getBookingCategory(booking);
      let statusText = 'Confirmed';
      let badgeBg = '#e8f5e9';
      let badgeColor = '#2e7d32';

      if (category === 'COMPLETED') {
        badgeBg = '#e0e0e0';
        badgeColor = '#424242';
        statusText = 'Completed';
      } else if (category === 'CANCELLED') {
        badgeBg = '#ffebee';
        badgeColor = '#c62828';
        statusText = 'Cancelled';
      }

      const isUpcoming = (category === 'UPCOMING');
      const isCompleted = (category === 'COMPLETED');
      
      const cancelButtonHTML = isUpcoming ? `
        <button onclick="cancelTicket('${pnr}')" style="background: #dc3545; color: white; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: bold;">Cancel Ticket</button>
      ` : '';

      const trackButtonHTML = isUpcoming ? `
        <button onclick="trackBus('${busName}', '${source}', '${destination}')" style="background: #17a2b8; color: white; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: bold; margin-right: 8px;">📍 Track Bus</button>
      ` : '';

      const downloadButtonHTML = (category !== 'CANCELLED') ? `
        <button onclick="downloadTicket('${pnr}')" style="background: #28a745; color: white; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: bold; margin-right: 8px;">📄 View / Download Ticket</button>
      ` : '';

      // Review Section Display Logic inside card
      let reviewSectionHTML = '';
      if (booking.review) {
        reviewSectionHTML = `
          <div style="background: #f1f8e9; border: 1px solid #c8e6c9; padding: 10px 15px; border-radius: 6px; margin-bottom: 12px; font-size: 0.9em;">
            <div style="color: #2e7d32; font-weight: bold; margin-bottom: 2px;">Your Rating: ${'⭐'.repeat(booking.review.rating)}</div>
            <div style="color: #555;">"${booking.review.comment}"</div>
          </div>
        `;
      }

      const reviewButtonHTML = (isCompleted && !booking.review) ? `
        <button onclick="openReviewModal('${pnr}')" style="background: #ffc107; color: #333; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: bold; margin-right: 8px;">⭐ Rate & Review</button>
      ` : '';

      const bookingCard = document.createElement('div');
      bookingCard.className = 'booking-card';
      bookingCard.id = `booking-card-${pnr}`;
      bookingCard.style.cssText = `border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);`;

      bookingCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">
          <div>
            <strong style="font-size: 1.1em; color: #333;">PNR: ${pnr}</strong>
            <span style="margin-left: 10px; background: ${badgeBg}; color: ${badgeColor}; padding: 3px 8px; border-radius: 4px; font-size: 0.85em; font-weight: bold;">${statusText}</span>
          </div>
          <div style="color: #666; font-size: 0.9em;">
            Travel Date: <strong>${travelDate}</strong>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <div>
            <h4 style="margin: 0; color: #007bff;">${source} ➔ ${destination}</h4>
            <p style="margin: 5px 0 0; color: #555; font-size: 0.9em;">Bus: ${busName}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 0.9em; color: #666;">Total Fare</p>
            <h3 style="margin: 0; color: #28a745;">₹${totalFare}</h3>
          </div>
        </div>

        ${reviewSectionHTML}

        <div style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 10px; border-radius: 5px; font-size: 0.9em; color: #444; flex-wrap: wrap; gap: 10px;">
          <div>
            <strong>Passenger:</strong> ${passengerName} | <strong>Seats:</strong> ${seatNo}
          </div>
          <div>
            ${trackButtonHTML}
            ${downloadButtonHTML}
            ${reviewButtonHTML}
            ${cancelButtonHTML}
          </div>
        </div>
      `;

      bookingsContainer.appendChild(bookingCard);
    });
  }

  fetchUserBookings();
});