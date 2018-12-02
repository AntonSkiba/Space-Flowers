const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const mongoClient = require("mongodb").MongoClient;

let mongoURL = "mongodb://localhost:27017/";
let users;

mongoClient.connect(
  mongoURL,
  { useNewUrlParser: true },
  (err, client) => {
    if (err) return console.log(err);
    const db = client.db("spacecat");
    users = db.collection("users");
  }
);

let jsonParser = bodyParser.json();
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/public", express.static(__dirname + "/public"));

// pages
app.get("/", (req, res) => {
  res.render("pages/registration", {
    header: {
      registration: "active",
      authorization: "",
      logout: "hidden"
    }
  });
});

app.get("/registration", (req, res) => {
  res.render("pages/registration", {
    header: {
      registration: "active",
      authorization: "",
      logout: "hidden"
    }
  });
});

app.get("/authorization", (req, res) => {
  res.render("pages/authorization", {
    header: {
      registration: "",
      authorization: "active",
      logout: "hidden"
    }
  });
});

// registration
app.get("/emailTest/:email", (req, res) => {
  let email = req.params.email;
  let isNewEmail = true;
  users.findOne({ email: email }, (err, result) => {
    if (result !== null) isNewEmail = false;
    res.send(isNewEmail.toString());
  });
});

app.get("/loginTest/:login", (req, res) => {
  let login = req.params.login;
  let isNewLogin = true;
  users.findOne({ login: login }, (err, result) => {
    if (result !== null) isNewLogin = false;
    res.send(isNewLogin.toString());
  });
});

app.post("/registration", jsonParser, (req, res) => {
  let newUser = req.body;
  let hashPass = newUser.password;
  let salt = bcrypt.genSaltSync(10);
  newUser.password = bcrypt.hashSync(hashPass, salt);

  let message;
  users.insertOne(newUser, (err, result) => {
    if (err) {
      message = "Произошла ошибка :(\n повторите попытку позже...";
    } else {
      message = `Добро пожаловать ${newUser.login}`;
    }
    res.send(message);
  });
});

//authorization
app.post("/authorization", jsonParser, (req, res) => {
  let user = req.body;
  let searchUser = user.isEmail ? { email: user.login } : { login: user.login };
  console.log(searchUser);
  users.findOne(searchUser, (err, result) => {
    if (result !== null) {
      bcrypt.compare(user.password, result.password).then(isUser => {
        if (isUser) {
          res.send(result.login);
        } else {
          res.send("false");
        }
      });
    } else {
      res.send("false");
    }
  });
});

// profile
app.get("/user/:login", (req, res) => {
  users.findOne({ login: req.params.login }, (err, result) => {
    console.log(result);
    res.render("pages/profile", {
      header: {
        registration: "hidden",
        authorization: "hidden",
        logout: ""
      },
      user: result
    });
  });
});

app.listen(3000, function() {
  console.log("server started");
});
