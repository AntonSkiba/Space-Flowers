let submit = document.getElementById("regSubmit");
let errorRegistration = document.getElementById("errorRegistration");

document.addEventListener("keydown", event => {
  if (event.keyCode === 13) {
    let click = new Event("click");
    submit.dispatchEvent(click);
  }
});

submit.addEventListener("click", () => {
  let form = {
    login: document.getElementById("newLogin"),
    password: document.getElementById("newPassword"),
    rePassword: document.getElementById("reNewPassword"),
    email: document.getElementById("newEmail")
  };
  filledTest(form);
});

function filledTest(form) {
  let isValidate = true;
  for (let item in form) {
    if (form[item].value === "") {
      form[item].style.borderColor = "#ff6161";
      isValidate = false;
    } else {
      form[item].style.borderColor = "#ced4da";
    }
  }
  if (isValidate) {
    errorRegistration.innerHTML = "";
    emailTest(form);
  } else {
    errorRegistration.innerHTML = "Все поля должны быть заполнены.";
  }
}

function emailTest(form) {
  let email = form.email;
  let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (re.test(email.value)) {
    fetch(`/emailTest/${email.value}`, {
      method: "GET"
    })
      .then(response => {
        return response.text();
      })
      .then(isNewEmail => {
        if (isNewEmail === "true") {
          errorRegistration.innerHTML = "";
          email.style.borderColor = "#ced4da";
          loginTest(form);
        } else {
          email.style.borderColor = "#ff6161";
          errorRegistration.innerHTML = `Пользователь с email: ${
            email.value
          } уже зарегистрирован.`;
        }
      });
  } else {
    email.style.borderColor = "#ff6161";
    errorRegistration.innerHTML = "Неверно введен Email";
  }
}

function loginTest(form) {
  let login = form.login;
  let loginReg = /^[a-zA-Z][a-zA-Z0-9-_\.]{4,20}$/;
  if (loginReg.test(form.login.value)) {
    fetch(`/loginTest/${login.value}`, {
      method: "GET"
    })
      .then(response => {
        return response.text();
      })
      .then(isNewLogin => {
        if (isNewLogin === "true") {
          errorRegistration.innerHTML = "";
          login.style.borderColor = "#ced4da";
          passwordTest(form);
        } else {
          login.style.borderColor = "#ff6161";
          errorRegistration.innerHTML = "Логин уже занят.";
        }
      });
  } else {
    login.style.borderColor = "#ff6161";
    errorRegistration.innerHTML =
      'Логин может содержать только латинские буквы и цифры, а также знаки "<b style="color: #bbe7ff">_ - .</b>" . ';
  }
}

function passwordTest(form) {
  let pass1 = form.password;
  let pass2 = form.rePassword;
  let passValidate = true;
  let errPassText = "Пароль должен иметь ";

  let lc = /[a-z]/g;
  if (!lc.test(pass1.value)) {
    passValidate = false;
    errPassText += "один маленький символ (a-z)$$";
  }

  let uc = /[A-Z]/g;
  if (!uc.test(pass1.value)) {
    passValidate = false;
    errPassText += "один большой символ (A-Z)$$";
  }

  let nc = /[0-9]/g;
  if (!nc.test(pass1.value)) {
    passValidate = false;
    errPassText += "одну цифру (0-9)$$";
  }

  if (pass1.value.length < 8) {
    passValidate = false;
    errPassText += "длину больше 8$$";
  }
  errPassText += "$";
  errPassText = errPassText.replace("$$$", ".");
  errPassText = errPassText.split("$$").join(", ");
  errorRegistration.innerHTML = errPassText;

  if (passValidate) {
    if (pass1.value !== pass2.value) {
      pass2.style.borderColor = "#ff6161";
      errorRegistration.innerHTML = "Пароли не совпадают.";
    } else {
      pass2.style.borderColor = "#ced4da";
      errorRegistration.innerHTML = "";
      sentPostRequest(form);
    }
  } else {
    pass1.style.borderColor = "#ff6161";
  }
}

function sentPostRequest(form) {
  let newUser = {
    login: form.login.value,
    password: form.password.value,
    email: form.email.value
  };
  fetch("/registration", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(newUser)
  })
    .then(response => {
      return response.text();
    })
    .then(message => {
      document.cookie = `auth=${message}`;
    });
}
