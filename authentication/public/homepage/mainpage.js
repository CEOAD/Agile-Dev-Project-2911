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

    if (response.ok) {
      fetch('/login-success')
        .then(response => response.json())
        .then(async data => {
          alert(data.response1.message); // Display the alert message
          const isAuthenticatedResponse = data.response2.data.user

          // Update the UI based on the user's authentication status
          console.log(isAuthenticatedResponse);
          const signupButton = document.querySelector('#loginbutt');
          const loginCard = document.querySelector('.login-card');
          const favoritesButton = document.querySelector('#favorites')
          if (isAuthenticatedResponse) {
            console.log('User is authenticated', isAuthenticatedResponse);
            signupButton.style.display = 'none'; // Hide the sign-in button
            favoritesButton.style.float = 'right'; // Push the favorites button to the right side
            loginCard.classList.toggle('show');
          } else {
            console.log("User isn't authenticated");
            signupButton.style.visibility = 'hidden';
          }
        })
        .catch(error => {
          console.error(error);
        });
    } else {
      fetch('/login-failure')
        .then(response => response.json())
        .then(data => {
          alert(data.message); // Display the alert message
          window.location.href = '/';
        })
        .catch(error => {
          console.error(error);
        });
    }
  } catch (error) {
    console.error('Error occurred during login:', error);
    alert('An error occurred during login. Please try again later.');
  }
});
