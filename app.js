const express = require("express");
const bodyParser = require("body-parser");
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

app.get("/", (req, res) => {
  res.render("index");
});

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

app.listen(3000, function() {
  console.log("server started");
});
