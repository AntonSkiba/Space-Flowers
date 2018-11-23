let submit = document.getElementById("regSubmit");
let errorRegistration = document.getElementById("errorRegistration");

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
      errorRegistration.innerHTML = "Все поля должны быть заполнены.";
      isValidate = false;
    } else {
      form[item].style.borderColor = "#ced4da";
      errorRegistration.innerHTML = "";
    }
  }
  if (isValidate) emailTest(form);
}

function emailTest(form) {
  let email = form.email;
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (re.test(email.value.toLowerCase())) {
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
  console.log(newUser);
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
      let regForm = document.getElementById("regForm");
      regForm.innerHTML = message;
    });
}
