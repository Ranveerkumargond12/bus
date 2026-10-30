document.addEventListener('DOMContentLoaded', () => {

  // 1. Set Default Date to Today & Set Minimum Date Constraint
  const dateInput = document.querySelector('input[type="date"]');
  const todayStr = new Date().toISOString().split('T')[0];
  
  if (dateInput) {
    dateInput.min = todayStr; // Past dates select nahi hone dega
    if (!dateInput.value) {
      dateInput.value = todayStr;
    }
  }

  // 2. Swap Button Functionality
  const swapBtn = document.querySelector('.btn-swap');
  if (swapBtn) {
    swapBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const fromInput = document.getElementById('fromInput') || document.querySelectorAll('.search-group input, form input')[0];
      const toInput = document.getElementById('toInput') || document.querySelectorAll('.search-group input, form input')[1];

      if (fromInput && toInput) {
        const tempValue = fromInput.value;
        fromInput.value = toInput.value;
        toInput.value = tempValue;

        swapBtn.style.transition = 'transform 0.3s ease';
        swapBtn.style.transform = swapBtn.style.transform === 'rotate(180deg)' ? 'rotate(0deg)' : 'rotate(180deg)';
      }
    });
  }

  // 3. Search Form Submit
  const searchForm = document.querySelector('.search-widget-form') || document.querySelector('form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const inputs = searchForm.querySelectorAll('input');
      const select = searchForm.querySelector('select');

      const fromVal = inputs[0] ? inputs[0].value.trim() : 'Mumbai';
      const toVal = inputs[1] ? inputs[1].value.trim() : 'Goa';
      const dateVal = searchForm.querySelector('input[type="date"]')?.value || todayStr;
      const busTypeVal = select ? select.value : 'All Types';

      if (!fromVal || !toVal) {
        alert('Kripya From aur To cities select karein!');
        return;
      }

      if (fromVal.toLowerCase() === toVal.toLowerCase()) {
        alert('Source aur Destination city same nahi ho sakti!');
        return;
      }

      const searchQuery = {
        from: fromVal,
        to: toVal,
        date: dateVal,
        busType: busTypeVal
      };

      localStorage.setItem('searchQuery', JSON.stringify(searchQuery));
      window.location.href = `search-results.html?from=${encodeURIComponent(fromVal)}&to=${encodeURIComponent(toVal)}&date=${dateVal}`;
    });
  }

  // 4. Popular Bus Routes Click Handler (Auto-attaches current date parameter)
  const popularRouteLinks = document.querySelectorAll('.popular-route-link');
  popularRouteLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const from = link.getAttribute('data-from');
      const to = link.getAttribute('data-to');
      const selectedDate = (dateInput && dateInput.value) ? dateInput.value : todayStr;
      
      const searchQuery = {
        from: from,
        to: to,
        date: selectedDate,
        busType: 'All Types'
      };

      localStorage.setItem('searchQuery', JSON.stringify(searchQuery));
      window.location.href = `search-results.html?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${selectedDate}`;
    });
  });

});

function changeLanguage(langCode) {
  // Google Translate ke native iframe select element ko access karke instantly value change karta hai
  const googleCombo = document.querySelector('.goog-te-combo');
  
  if (googleCombo) {
    googleCombo.value = langCode;
    // Trigger change event directly without reloading the page
    googleCombo.dispatchEvent(new Event('change'));
  } else {
    // Agar Google engine slow load hua ho toh cookie fallback
    document.cookie = "googtrans=/auto/" + langCode + "; path=/;";
    window.location.reload();
  }
}