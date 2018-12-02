let submit = document.getElementById("authSubmit");
let errorAuthorization = document.getElementById("errorAuthorization");
let errText = "Неверный логин или пароль";

document.addEventListener("keydown", event => {
  if (event.keyCode === 13) {
    let click = new Event("click");
    submit.dispatchEvent(click);
  }
});

submit.addEventListener("click", () => {
  let form = {
    login: document.getElementById("login"),
    password: document.getElementById("password")
  };
  filledTest(form);
});

function filledTest(form) {
  let isValidate = true;
  for (let item in form) {
    if (form[item].value === "") {
      isValidate = false;
    }
  }
  if (isValidate) {
    authorization(form);
  } else {
    form.login.style.borderColor = "#ff6161";
    form.password.style.borderColor = "#ff6161";
    errorAuthorization.innerHTML = errText;
  }
}

function authorization(form) {
  let emailReg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  let user = {
    login: form.login.value,
    password: form.password.value,
    isEmail: emailReg.test(form.login.value)
  };
  fetch("/authorization", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(user)
  })
    .then(response => {
      return response.text();
    })
    .then(message => {
      if (message === "false") {
        form.login.style.borderColor = "#ff6161";
        form.password.style.borderColor = "#ff6161";
        errorAuthorization.innerHTML = errText;
      } else {
        let auth = message.split("____")[1];
        let login = message.split("____")[0];
        document.cookie = `auth=${auth}`;
        window.location.href = `/user/${login}`;
      }
    });
}
