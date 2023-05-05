const loginButton = document.getElementById("login-button");
const loginPopup = document.getElementById("login-popup");
const closeButton = document.getElementById("close-button");
const forgotPasswordLink = document.querySelector('.forgot-password-link');
const signUpLink = document.querySelector('.signup-link');
const getHelpLink = document.querySelector('.get-help-link');
const rememberMeCheckbox = document.querySelector('#remember-me');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');

loginButton.addEventListener("click", () => {
  loginPopup.style.display = "block";
});

closeButton.addEventListener("click", () => {
  loginPopup.style.display = "none";
});

forgotPasswordLink.addEventListener('click', (event) => {
    event.preventDefault(); // prevent the link from navigating to a new page
    // display a new popup or redirect the user to a new page to reset their password
});

signUpLink.addEventListener('click', (event) => {
    event.preventDefault(); // prevent the link from navigating to a new page
    // redirect the user to a new page where they can sign up
});

getHelpLink.addEventListener('click', (event) => {
    event.preventDefault(); // prevent the link from navigating to a new page
    // display a new popup or redirect the user to a new page for help
});

const storedEmail = localStorage.getItem('email');
const storedPassword = localStorage.getItem('password');
if (storedEmail && storedPassword) {
    emailInput.value = storedEmail;
    passwordInput.value = storedPassword;
    rememberMeCheckbox.checked = true;
}

const form = document.querySelector('form');

form.addEventListener('submit', (event) => {
    if (rememberMeCheckbox.checked) {
        localStorage.setItem('email', emailInput.value);
        localStorage.setItem('password', passwordInput.value);
    } else {
        localStorage.removeItem('email');
        localStorage.removeItem('password');
    }
});
