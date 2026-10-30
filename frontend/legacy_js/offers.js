document.addEventListener('DOMContentLoaded', () => {
  const offersListContainer = document.getElementById('offersList');

  const offers = [
    {
      id: '1',
      tag: 'First Booking',
      title: 'Flat 20% OFF',
      description: 'Get 20% discount on your first bus ticket booking with TravelGo.',
      code: 'FIRST20'
    },
    {
      id: '2',
      tag: 'Festive Special',
      title: 'Save up to ₹300',
      description: 'Applicable on bookings above ₹1200 across all routes.',
      code: 'FESTIVE300'
    },
    {
      id: '3',
      tag: 'Weekend Gateway',
      title: '15% Instant Cashback',
      description: 'Book Saturday or Sunday travels and enjoy instant wallet cashback.',
      code: 'WEEKEND15'
    },
    {
      id: '4',
      tag: 'Group Travel',
      title: 'Flat ₹500 OFF',
      description: 'Valid when you book 4 or more seats in a single booking.',
      code: 'GROUP500'
    }
  ];

  offersListContainer.innerHTML = offers.map(offer => `
    <div class="offer-card">
      <div>
        <span class="offer-tag">${offer.tag}</span>
        <h3 class="offer-title">${offer.title}</h3>
        <p class="offer-desc">${offer.description}</p>
      </div>
      <div class="offer-footer">
        <span class="code-box">${offer.code}</span>
        <button class="copy-btn" onclick="copyCode('${offer.code}', this)">Copy Code</button>
      </div>
    </div>
  `).join('');
});

function copyCode(code, buttonElement) {
  navigator.clipboard.writeText(code).then(() => {
    const originalText = buttonElement.innerText;
    buttonElement.innerText = 'Copied!';
    buttonElement.classList.add('copied');
    
    setTimeout(() => {
      buttonElement.innerText = originalText;
      buttonElement.classList.remove('copied');
    }, 2000);
  });
}