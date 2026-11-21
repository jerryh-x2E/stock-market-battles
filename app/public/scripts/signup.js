const submitBtn = document.getElementById("submit");

const usernameInput = document.getElementById("username");
const usernameError = document.getElementById("username-error")
const passwordInput = document.getElementById("password");
const passwordError = document.getElementById("password-error");
const confirmInput = document.getElementById("confirm-password");
const confirmError = document.getElementById("confirm-error");

const signUpError = document.getElementById("signup-error");

function checkPasswords() {
    if (confirmInput.value !== passwordInput.value) {
        confirmError.textContent = "Passwords do not match";
    } else {
        confirmError.textContent = "";
    }
}

submitBtn.disabled = true;

usernameInput.addEventListener("input", event => {
    const usernameLength = usernameInput.value.length;
    if (usernameLength < 3) {
        usernameError.textContent = "Username must be at least 3 characters long";
    } else if (usernameLength > 24) {
        usernameError.textContent = "Username must be at most 24 characters long"
    } else {
        usernameError.textContent = "";
    }
    submitBtn.disabled = (
        usernameError.textContent || 
        passwordError.textContent || 
        confirmError.textContent
    );
});

passwordInput.addEventListener("input", event => {
    if (passwordInput.value.length < 6) {
        passwordError.textContent = "Password must be at least 6 characters long"
    } else {
        passwordError.textContent = "";
    }
    checkPasswords();
    submitBtn.disabled = (
        usernameError.textContent || 
        passwordError.textContent ||
        confirmError.textContent
    );
});

confirmInput.addEventListener("input", event => {
    checkPasswords();
    submitBtn.disabled = (
        usernameError.textContent || 
        passwordError.textContent ||
        confirmError.textContent
    );
});

submitBtn.addEventListener("click", event => {
    fetch("/api/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: usernameInput.value,
            password: passwordInput.value,
            confirmPassword: confirmInput.value
        })
    }).then(response => {
        if (!response.ok) {
            response.json().then(body => {
                loginError.textContent = body.msg;
            });
        } else {
            window.location.href = "login.html";
        }
    }).catch(error => {
        loginError.textContent = "Something went wrong";
    });
});