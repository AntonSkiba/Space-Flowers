const express = require("express");
const bodyParser = require("body-parser");

let jsonParser = bodyParser.json();
const app = express();

let testEmails = [
  "sao.skiba@gmail.com",
  "anton.skiba@mail.ru",
  "as.skiba@tensor.ru"
];

let testLogins = [
  "Antoha5381",
  "s41ba.meow",
  "apr.lw.tch",
  "login228",
  "sukablyat"
];

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/emailTest/:email", (req, res) => {
  let email = req.params.email;
  let isNewEmail = true;
  for (let i = 0; i < testEmails.length; i++) {
    if (email === testEmails[i]) {
      isNewEmail = false;
      break;
    }
  }
  res.send(isNewEmail.toString());
});

app.get("/loginTest/:login", (req, res) => {
  let login = req.params.login;
  let isNewLogin = true;
  for (let i = 0; i < testLogins.length; i++) {
    if (login === testLogins[i]) {
      isNewLogin = false;
      break;
    }
  }
  res.send(isNewLogin.toString());
});

app.post("/registration", jsonParser, (req, res) => {
  let newUser = req.body;
  console.log(newUser);
  res.send(
    `Пользователь ${newUser.login}
     с паролем ${newUser.password}
     и эмейлом ${newUser.email}
     зарегистрирован :3`
  );
});

app.listen(3000, function() {
  console.log("server started");
});
