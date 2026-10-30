document.addEventListener('DOMContentLoaded', () => {
  // Toggle interactive animation for FAQs if needed
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.borderColor = 'rgba(56, 189, 248, 0.3)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.borderColor = 'rgba(255, 255, 255, 0.08)';
    });
  });
});