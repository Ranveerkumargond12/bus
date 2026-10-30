document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('nav-login-btn') || document.querySelector('.btn-login');
  
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('safarsathi_user') || localStorage.getItem('travelgo_user'));
  } catch(e) {}

  if (user) {
    if (user.wallet_balance === undefined) {
      user.wallet_balance = 150;
      localStorage.setItem('safarsathi_user', JSON.stringify(user));
      localStorage.setItem('travelgo_user', JSON.stringify(user));
    }
  } else {
    user = { wallet_balance: 150 };
  }

  if (loginBtn) {
    if (user && (user.name || user.email)) {
      const displayName = user.name || user.email.split('@')[0];
      const userWallet = user.wallet_balance !== undefined ? user.wallet_balance : 150;

      loginBtn.style.display = 'inline-flex';
      loginBtn.style.alignItems = 'center';
      loginBtn.style.gap = '8px';
      loginBtn.style.padding = '4px 10px';
      loginBtn.style.borderRadius = '8px';
      loginBtn.style.background = '#ffffff';
      loginBtn.style.border = '1px solid #dcdfe6';
      loginBtn.style.color = '#1c2430';
      loginBtn.style.fontSize = '13px';
      loginBtn.style.fontWeight = '600';
      loginBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';

      loginBtn.innerHTML = `
        <a href="wallet.html" style="text-decoration: none; display: inline-flex; align-items: center; gap: 4px; background: rgba(0, 140, 255, 0.1); padding: 3px 8px; border-radius: 6px; color: #008cff; font-weight: 700;">
          💰 ₹<span id="navWalletBalance">${userWallet}</span>
        </a>
        <span style="white-space: nowrap;">👤 ${displayName}</span>
        <span id="logout-btn" style="
          background: #fee2e2;
          color: #dc2626;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        " title="Click to Logout">Logout</span>
      `;
      loginBtn.href = "javascript:void(0);";

      // Logout logic wahi rahega...
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('safarsathi_user');
          localStorage.removeItem('travelgo_user');
          window.location.reload();
        });
      }
    } else {
      loginBtn.innerHTML = `
        <a href="wallet.html" style="text-decoration: none; margin-right: 6px; background: rgba(0, 140, 255, 0.08); padding: 3px 6px; border-radius: 6px; color: #008cff; font-weight: 700; font-size: 12px;">💰 ₹150</a>
        Login / Sign Up
      `;
      loginBtn.href = "auth.html";
    }
  }
});