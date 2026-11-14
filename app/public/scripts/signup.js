const loginBtn = document.getElementById("nav-login");
const submitBtn = document.getElementById("submit");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const msg = document.getElementById("signup-error");

loginBtn.addEventListener("click", event => {
    window.location.href = "login.html"
});

submitBtn.addEventListener("click", event => {
    msg.classList.remove("error");
    fetch("/api/users", {
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
            msg.classList.add("error");
            response.json().then(body => {
                msg.textContent = body.msg;
            });
        }
    }).catch(error => {
        msg.classList.add("error");
        msg.textContent = "Something went wrong";
    });
});