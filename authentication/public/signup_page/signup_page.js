


let navToggle = document.querySelector(".nav__toggle");
let navWrapper = document.querySelector(".nav__wrapper");

navToggle.addEventListener("click", function () {
  if (navWrapper.classList.contains("active")) {
    this.setAttribute("aria-expanded", "false");
    this.setAttribute("aria-label", "menu");
    navWrapper.classList.remove("active");
  } else {
    navWrapper.classList.add("active");
    this.setAttribute("aria-label", "close menu");
    this.setAttribute("aria-expanded", "true");
  }
});

const loginBtn = document.querySelector('body > header > div > a.button.button--icon > button');
const loginCard = document.querySelector('#loginpage');

loginBtn.addEventListener('click', () => {
  if (loginCard.style.visibility === 'visible' && loginCard.style.opacity === '1') {
    loginCard.style.visibility = 'hidden';
    loginCard.style.opacity = '0';
  } else {
    loginCard.style.visibility = 'visible';
    loginCard.style.opacity = '1';
  }
});


const signupForm = document.querySelector('#signuppage');
console.log(signupForm)
signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  console.log('signup form submitted')
  const formData = new FormData(signupForm);
  const username = formData.get('username');
  const email = formData.get('email');
  const dob = formData.get('dob');
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmpassword');
  console.log(password, confirmPassword)

  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  const response = await fetch('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, dob, password }),
  });

  if (response.ok) {
    window.location.href = '/dashboard';
  } else {
    alert('Signup failed');
  }
});
const loginForm = document.querySelector('#loginpage');
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    console.log('login form submitted')
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');

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
      alert('Incorrect email or password');
    }
  });

console.log("js working")