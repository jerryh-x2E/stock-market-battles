const btn = document.getElementById("submit");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("login-error");

btn.addEventListener("click", event => {
    fetch("/api/sessions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: usernameInput.value,
            password: passwordInput.value           
        })
    }).then(response => {
        if (!response.ok) {
            response.json().then(body => {
                loginError.textContent = body.msg;
            });
        }
    }).catch(error => {
        loginError.textContent = "Something went wrong";
    });
});