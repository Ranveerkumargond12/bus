/* ==========================================
   SafarSathi (TravelGo) - Central Mock Database & Config
   ========================================== */

const TRAVELGO_DB = {
  // 1. Available Bus Routes & Operator Data
  buses: [
    {
      id: "BUS-101",
      name: "IntrCity SmartBus",
      type: "AC Sleeper (2+1)",
      category: "ac",
      from: "Mumbai",
      to: "Goa",
      departureTime: "21:00",
      arrivalTime: "07:30",
      duration: "10h 30m",
      price: 1200,
      rating: 4.8,
      totalSeats: 30,
      amenities: ["WiFi", "Charging Point", "Blanket", "Water Bottle"],
      boardingPoints: ["Bandra East - 20:30", "Sion Circle - 20:50", "Vashi - 21:30"],
      droppingPoints: ["Mapusa - 06:45", "Panjim - 07:15", "Madgaon - 08:00"],
      seats: [
        { id: "L1", type: "sleeper", deck: "lower", price: 1200, status: "available", gender: null },
        { id: "L2", type: "sleeper", deck: "lower", price: 1200, status: "booked", gender: "male" },
        { id: "L3", type: "sleeper", deck: "lower", price: 1200, status: "booked", gender: "female" },
        { id: "L4", type: "sleeper", deck: "lower", price: 1200, status: "available", gender: null }
      ]
    },
    {
      id: "BUS-102",
      name: "Zingbus Express",
      type: "Non-AC Seater (2+2)",
      category: "seater",
      from: "Mumbai",
      to: "Goa",
      departureTime: "22:15",
      arrivalTime: "09:00",
      duration: "10h 45m",
      price: 850,
      rating: 4.3,
      totalSeats: 36,
      amenities: ["Charging Point", "Reading Light"],
      boardingPoints: ["Borivali West - 21:30", "Andheri East - 22:00"],
      droppingPoints: ["Panjim - 08:30", "Madgaon - 09:15"],
      seats: [
        { id: "S1", type: "seater", deck: "lower", price: 850, status: "available", gender: null },
        { id: "S2", type: "seater", deck: "lower", price: 850, status: "booked", gender: "male" }
      ]
    },
    {
      id: "BUS-201",
      name: "Himalayan Travels",
      type: "AC Sleeper (2+1)",
      category: "ac",
      from: "Delhi",
      to: "Manali",
      departureTime: "18:30",
      arrivalTime: "08:00",
      duration: "13h 30m",
      price: 1200,
      rating: 4.7,
      totalSeats: 30,
      amenities: ["WiFi", "Blanket", "Personal TV", "Charging Point"],
      boardingPoints: ["Kashmere Gate - 18:00", "Majnu Ka Tilla - 18:30"],
      droppingPoints: ["Private Bus Stand Manali - 08:00"],
      seats: [
        { id: "DL1", type: "sleeper", deck: "lower", price: 1200, status: "available", gender: null },
        { id: "DL2", type: "sleeper", deck: "lower", price: 1200, status: "available", gender: null }
      ]
    },
    {
      id: "BUS-301",
      name: "Southern Express",
      type: "AC Sleeper (2+1)",
      category: "ac",
      from: "Bangalore",
      to: "Chennai",
      departureTime: "22:00",
      arrivalTime: "05:30",
      duration: "07h 30m",
      price: 1200,
      rating: 4.6,
      totalSeats: 30,
      amenities: ["WiFi", "Charging Point", "Water Bottle"],
      boardingPoints: ["Majestic - 21:30", "Silk Board - 22:00"],
      droppingPoints: ["Koyambedu - 05:30"],
      seats: [
        { id: "BC1", type: "sleeper", deck: "lower", price: 1200, status: "available", gender: null }
      ]
    },
    {
      id: "BUS-401",
      name: "Lucknow Express Comfort",
      type: "AC Sleeper (2+1)",
      category: "ac",
      from: "Lucknow",
      to: "Goa",
      departureTime: "20:00",
      arrivalTime: "14:30",
      duration: "18h 30m",
      price: 1850,
      rating: 4.6,
      totalSeats: 28,
      amenities: ["WiFi", "Charging Point", "Blanket", "Snacks"],
      boardingPoints: ["Alambagh Bus Stand - 19:30", "Charbagh - 20:00"],
      droppingPoints: ["Panjim - 14:00", "Madgaon - 14:30"],
      seats: [
        { id: "LK1", type: "sleeper", deck: "lower", price: 1850, status: "available", gender: null },
        { id: "LK2", type: "sleeper", deck: "lower", price: 1850, status: "available", gender: null }
      ]
    }
  ],

  // 2. Active Special Promo Offers
  offers: [
    { code: "FIRST50", discount: 200, title: "FLAT ₹200 OFF", desc: "Valid on first bus booking" },
    { code: "TRAVELGO", discount: 150, title: "NEW USER", desc: "Get ₹150 instant discount" }
  ]
};

// Dynamic API Base URL Configuration for Hostinger
const RENDER_API_URL = (typeof window !== 'undefined' && window.API_URL) ? window.API_URL : (function() {
  if (window.location.protocol.startsWith('http')) {
    if (window.location.pathname.includes('/frontend/')) {
      const base = window.location.pathname.split('/frontend/')[0];
      return window.location.origin + base + '/api';
    }
    return window.location.origin + '/api';
  }
  return 'https://bus-ticket-booking-5k6m.onrender.com/api';
})();

// LocalStorage Initialization System (Fixed Non-Overwriting)
function initMockData() {
  localStorage.setItem("travelgo_buses", JSON.stringify(TRAVELGO_DB.buses));
  if (!localStorage.getItem("travelgo_offers")) {
    localStorage.setItem("travelgo_offers", JSON.stringify(TRAVELGO_DB.offers));
  }
}

// Global Getter Function for Active Bus List
function getStoredBuses() {
  initMockData();
  const data = localStorage.getItem("travelgo_buses");
  return data ? JSON.parse(data) : TRAVELGO_DB.buses;
}

// Get Bus By ID with correct Base Price Sync
function getBusById(busId) {
  const buses = getStoredBuses();
  return buses.find(b => String(b.id) === String(busId)) || buses[0];
}

// Global Price Synchronization Getter & Setter
function getBookingData() {
  const raw = localStorage.getItem('travelgo_booking_data');
  return raw ? JSON.parse(raw) : null;
}

function saveBookingData(data) {
  if (data && data.totalAmount) {
    localStorage.setItem('booking_total_fare', data.totalAmount);
  }
  localStorage.setItem('travelgo_booking_data', JSON.stringify(data));
}

// Dynamic Price Calculation Helper Function
function calculateBookingPrice(seatCount, pricePerSeat) {
  const basePrice = parseInt(pricePerSeat) || 750;
  const count = parseInt(seatCount) || 1;
  const total = basePrice * count;
  
  const baseFare = Math.round(total * 0.95);
  const taxFare = total - baseFare;
  
  return {
    totalAmount: total,
    baseFare: baseFare,
    taxFare: taxFare
  };
}

// Auto Initialize Data on load
initMockData();

// ==========================================
// SEARCH FORM & ROUTE HANDLERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('searchForm');
  const fromInput = document.getElementById('fromInput');
  const toInput = document.getElementById('toInput');
  const swapBtn = document.getElementById('btn-swap');

  // Swap From & To values
  if (swapBtn && fromInput && toInput) {
    swapBtn.addEventListener('click', () => {
      const temp = fromInput.value;
      fromInput.value = toInput.value;
      toInput.value = temp;
    });
  }

  // Handle Form Submit
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const fromVal = fromInput ? fromInput.value.trim() : '';
      const toVal = toInput ? toInput.value.trim() : '';
      const dateInput = document.getElementById('dateInput');
      const dateVal = dateInput ? dateInput.value : '';

      const searchQuery = {
        from: fromVal,
        to: toVal,
        date: dateVal
      };

      localStorage.setItem('searchQuery', JSON.stringify(searchQuery));
      window.location.href = `search-results.html?from=${encodeURIComponent(fromVal)}&to=${encodeURIComponent(toVal)}&date=${encodeURIComponent(dateVal)}`;
    });
  }
});