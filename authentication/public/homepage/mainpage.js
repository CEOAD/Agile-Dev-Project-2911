const loginForm = document.querySelector('#form');
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const email = formData.get('email');
  const password = formData.get('password');

  // Validate the email and password fields
  if (!email || !password) {
    alert('Please enter an email and password');
    return;
  }

  // Send a request to the server to check if the email and password are valid
  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.redirected) {
      // Update the UI based on the user's authentication status
      const isAuthenticatedResponse = await fetch('/authStatus');
      const { isAuthenticated } = await isAuthenticatedResponse.json();

      const signupButton = document.querySelector('#loginbutt');
      const loginCard = document.querySelector('.login-card');
      console.log(isAuthenticated)
      if (isAuthenticated) {
        console.log('User is authenticated');
        signupButton.style.visibility = 'hidden';
        loginCard.classList.toggle('show');
      } else {
        console.log("User isn't authenticated");
        signupButton.style.visibility = 'hidden';
      }
    } else {
      // The login failed, handle the error response
      const errorMessage = await response.text();
      alert(errorMessage);
    }
  } catch (error) {
    console.error('Error occurred during login:', error);
    alert('An error occurred during login. Please try again later.');
  }
});
