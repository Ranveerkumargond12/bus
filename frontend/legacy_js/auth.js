document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const redirectTarget = urlParams.get('redirect') || 'index.html';

  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const title = document.getElementById('auth-title');
  const subtitle = document.getElementById('auth-subtitle');

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

  function showToast(message, heading = "Notification", callback = null) {
    const toast = document.getElementById('custom-toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMsg = document.getElementById('toast-message');

    if (toast && toastTitle && toastMsg) {
      toastTitle.innerText = heading;
      toastMsg.innerText = message;
      toast.classList.add('show');

      setTimeout(() => {
        toast.classList.remove('show');
        if (typeof callback === 'function') callback();
      }, 1800);
    } else {
      alert(`${heading}: ${message}`);
      if (typeof callback === 'function') callback();
    }
  }

  // Switch Tabs Logic
  if (tabLogin && tabSignup) {
    tabLogin.addEventListener('click', (e) => {
      e.preventDefault();
      tabLogin.classList.add('active');
      tabSignup.classList.remove('active');
      loginForm.classList.add('active-form');
      signupForm.classList.remove('active-form');
      if (title) title.innerText = 'Welcome Back';
      if (subtitle) subtitle.innerText = 'Log in to manage your bus bookings & fast checkout.';
    });

    tabSignup.addEventListener('click', (e) => {
      e.preventDefault();
      tabSignup.classList.add('active');
      tabLogin.classList.remove('active');
      signupForm.classList.add('active-form');
      loginForm.classList.remove('active-form');
      if (title) title.innerText = 'Create Account';
      if (subtitle) subtitle.innerText = 'Sign up once to book buses with zero hassle.';
    });
  }

  // Handle Login Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const identifierInput = document.getElementById('login-identifier');
      const passwordInput = document.getElementById('login-password');

      if (!identifierInput || !passwordInput) {
        showToast("Form fields missing in HTML!", "Error");
        return;
      }

      const identifier = identifierInput.value.trim();
      const password = passwordInput.value.trim();

      if (!identifier || !password) {
        showToast("Please enter both Email/Mobile and Password!", "Warning"); // Converted to English
        return;
      }

      console.log('Sending login payload:', { identifier, password });

      try {
        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifier, mobile: identifier, identifier: identifier, password: password })
        });

        const data = await response.json();
        console.log('Login server response:', data);

        if (response.ok && data.success) {
          localStorage.setItem('safarsathi_user', JSON.stringify(data.user));
          localStorage.setItem('travelgo_user', JSON.stringify(data.user));

          const destination = data.user.role === 'admin' ? 'admin.html' : redirectTarget;

          showToast(`Welcome back, ${data.user.name}!`, "Login Successful", () => {
            window.location.href = destination;
          });
        } else {
          showToast(data.message || data.error || "Invalid Credentials!", "Login Failed");
        }
      } catch (err) {
        console.error("Login Error:", err);
        showToast("Unable to connect to the server. Please check your backend connection!", "Connection Error"); // Converted to English
      }
    });
  }

  // Handle Signup Form Submission
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value.trim();

      try {
        const response = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showToast(`Account created successfully! Please log in now.`, "Account Created", () => { // Converted to English
            if (tabLogin) tabLogin.click();
          });
        } else {
          showToast(data.message || data.error || "Registration failed!", "Error");
        }
      } catch (err) {
        console.error("Signup Error:", err);
        showToast("Unable to connect to the server. Please check your backend connection!", "Connection Error"); // Converted to English
        showToast("Unable to connect to the server. Please check your backend connection!", "Connection Error"); // Converted to English
      }
    });
  }
});