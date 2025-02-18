// script.js
document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
  
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
  
    // Simulate a login check
    if (username === 'admin' && password === 'password') {
      alert('Login successful! Redirecting...');
      // Redirect or perform further actions
    } else {
      errorMessage.classList.remove('hidden');
    }
  });