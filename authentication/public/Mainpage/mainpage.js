const loginForm = document.querySelector('#form');
loginForm.addEventListener('submit', async (event) => {
    console.log(loginForm)
    event.preventDefault();
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');
    console.log(email, password)

    // Validate the email and password fields
    if (!email || !password) {
      alert('Please enter an email and password');
      return;
    }

    // Send a request to the server to check if the email and password are valid
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      // Redirect the user to the dashboard page if the login was successful
      window.location.href = '/dashboard';
    } else {
      alert(response.statusText);
    }
  });


  // Get the reference to the "Sign Up" button
  const signupButton = document.querySelector('.sigin-btn');

  // Fetch the authentication status
  fetch('/authStatus')
    .then(response => response.json())
    .then(data => {
      if (data.isAuthenticated) {
        signupButton.textContent = 'Log Out';
      } else {
        signupButton.textContent = 'Sign Up';
      }
    })
    .catch(error => {
      console.error('Error fetching authentication status:', error);
    });
  