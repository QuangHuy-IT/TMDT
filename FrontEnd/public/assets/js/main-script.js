const quickMenuRight = document.getElementById("quickMenuRight");
const quickMenuLeft = document.getElementById("quickMenuLeft");
const quickMenu = document.getElementById("quickMenu");

const qm_fullWidth = quickMenu ? quickMenu.scrollWidth : 0;
const qm_viewWidth = quickMenu ? quickMenu.offsetWidth : 0;

var count1 = 0;
var count2 = 0;
var qm_worker1 = 0;
var qm_worker2 = 0;
var n1 = 6;
var n2 = 4;

function scrollToLeft() {
    var quickMenu = document.getElementById("quickMenu");
    if (!quickMenu) {
        return;
    }
    // quickMenu.scrollLeft -= 100;
    qm_worker1 = setInterval(() => {
        if (count1 < 150) {
            quickMenu.scrollLeft -= n1;
            count1 = count1 + n2;
        } else {
            count1 = 0;
            clearInterval(qm_worker1);

            var qm_scrollPosition = quickMenu.scrollLeft;

            if (qm_scrollPosition == 0) {
                quickMenuLeft.classList.add("arrow-hidden");
            }

            if (qm_scrollPosition < qm_fullWidth - qm_viewWidth) {
                quickMenuRight.classList.remove("arrow-hidden");
            }
        }
    }, 10);
}

function scrollToRight() {
    var quickMenu = document.getElementById("quickMenu");
    if (!quickMenu) {
        return;
    }
    // quickMenu.scrollLeft += 100;
    qm_worker2 = setInterval(() => {
        if (count2 < 100) {
            quickMenu.scrollLeft += n1;
            count2 = count2 + n2;
        } else {
            count2 = 0;
            clearInterval(qm_worker2);

            var qm_scrollPosition = quickMenu.scrollLeft;

            if (qm_scrollPosition > 0) {
                quickMenuLeft.classList.remove("arrow-hidden");
            }

            if (qm_scrollPosition > qm_fullWidth - qm_viewWidth - 10) {
                quickMenuRight.classList.add("arrow-hidden");
            }
        }
    }, 10);
}

// login page ------------------------------------------------------------------------------------

// const login_errorMsg = document.getElementById("login-error-msg");
// const register_errorMsg = document.getElementById("register-error-msg");

var loginBtn_clicked;
var registerBtn_clicked;

const AUTH_API_BASE_URL = "http://localhost:8080/api/auth";

function getErrorMessage(error, fallbackMessage) {
    if (error && error.message) {
        return error.message;
    }
    return fallbackMessage;
}

async function requestAuth(endpoint, payload) {
    const response = await fetch(`${AUTH_API_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    let data;
    try {
        data = await response.json();
    } catch (e) {
        data = null;
    }

    if (!response.ok) {
        throw new Error(data?.message || "Request failed");
    }

    return data;
}

function initAuthForms() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (!loginForm || !registerForm) {
        return;
    }

    loginBtn_clicked = 1;
    registerBtn_clicked = 0;

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = loginForm.querySelector('input[type="email"]').value.trim();
        const password = loginForm.querySelector("#inputPassword1").value;

        try {
            const result = await requestAuth("login", { email, password });
            localStorage.setItem("authToken", result.token);
            localStorage.setItem("currentUser", JSON.stringify(result));
            alert("Dang nhap thanh cong.");
            window.location.href = "profile.html";
        } catch (error) {
            alert(getErrorMessage(error, "Dang nhap that bai."));
        }
    });

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const firstName = registerForm.querySelector("#inputFirstName").value.trim();
        const lastName = registerForm.querySelector("#inputLastName").value.trim();
        const phoneNumber = registerForm.querySelector("#inputPhoneNo").value.trim();
        const address = registerForm.querySelector("#InputAddress").value.trim();
        const email = registerForm.querySelector('input[type="email"]').value.trim();
        const password = registerForm.querySelector("#inputPassword2").value;

        try {
            await requestAuth("register", {
                firstName,
                lastName,
                phoneNumber,
                address,
                email,
                password
            });

            alert("Dang ky thanh cong. Vui long dang nhap.");
            registerForm.reset();
            showLoginForm();
        } catch (error) {
            alert(getErrorMessage(error, "Dang ky that bai."));
        }
    });
}

document.addEventListener("DOMContentLoaded", initAuthForms);

function showLoginForm() {
    if (loginBtn_clicked == 0) {
        var loginForm = document.getElementById("loginForm");
        var registerForm = document.getElementById("registerForm");

        var loginBtn = document.getElementById("loginBtn");
        var registerBtn = document.getElementById("registerBtn");

        var loginBtn_bg = document.getElementById("loginBtn_bg");
        var registerBtn_bg = document.getElementById("registerBtn_bg");

        loginBtn.classList.add("br-custom-1");
        loginBtn.classList.remove("br-custom-3");

        registerBtn.classList.remove("br-custom-1");
        registerBtn.classList.add("br-custom-2");

        loginBtn_bg.classList.remove("br-custom-bg");
        registerBtn_bg.classList.add("br-custom-bg");

        loginForm.classList.remove("d-none");
        registerForm.classList.add("d-none");

        loginBtn_clicked = 1;
        registerBtn_clicked = 0;
    }
}

function showRegisterForm() {
    if (registerBtn_clicked != 1) {
        var loginForm = document.getElementById("loginForm");
        var registerForm = document.getElementById("registerForm");

        var loginBtn = document.getElementById("loginBtn");
        var registerBtn = document.getElementById("registerBtn");

        var loginBtn_bg = document.getElementById("loginBtn_bg");
        var registerBtn_bg = document.getElementById("registerBtn_bg");

        loginBtn.classList.remove("br-custom-1");
        loginBtn.classList.add("br-custom-3");

        registerBtn.classList.add("br-custom-1");
        registerBtn.classList.remove("br-custom-2");

        loginBtn_bg.classList.add("br-custom-bg");
        registerBtn_bg.classList.remove("br-custom-bg");

        loginForm.classList.add("d-none");
        registerForm.classList.remove("d-none");

        loginBtn_clicked = 0;
        registerBtn_clicked = 1;
    }
}

// login page pw-btn -----------------------------------------------------------------------------
var showPW_btn_clicked;

function showPW() {
    var showPW_btn = document.getElementById("showPW_btn");
    var pw = document.getElementById("inputPassword1");


    if (showPW_btn_clicked != 0) {
        showPW_btn.classList.remove("bi-eye-slash-fill");
        showPW_btn.classList.add("bi-eye-fill");
        pw.type = 'text';
        showPW_btn_clicked = 0;
    } else {
        showPW_btn.classList.remove("bi-eye-fill");
        showPW_btn.classList.add("bi-eye-slash-fill");
        pw.type = 'password';
        showPW_btn_clicked = 1;
    }
}

var showPW_btn2_clicked;

function showPW2() {
    var showPW_btn2 = document.getElementById("showPW_btn2");
    var pw = document.getElementById("inputPassword2");


    if (showPW_btn2_clicked != 0) {
        showPW_btn2.classList.remove("bi-eye-slash-fill");
        showPW_btn2.classList.add("bi-eye-fill");
        pw.type = 'text';
        showPW_btn2_clicked = 0;
    } else {
        showPW_btn2.classList.remove("bi-eye-fill");
        showPW_btn2.classList.add("bi-eye-slash-fill");
        pw.type = 'password';
        showPW_btn2_clicked = 1;
    }
}

// single product page ---------------------------------------------------------------------------
function singleProductView() {
    window.location.href = "pages/single-product-view.html";
}
