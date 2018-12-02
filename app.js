const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const mongoClient = require("mongodb").MongoClient;
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

let mongoURL = "mongodb://anton.skiba@mail.ru:Anton20teen@95.163.210.38/";
let users;

mongoClient.connect(
  mongoURL,
  { useNewUrlParser: true },
  (err, client) => {
    if (err) return console.log(err);
    const db = client.db("spaceflowers");
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
      logout: "hidden",
      myProfile: "hidden",
      myLogin: ""
    }
  });
});

app.get("/registration", (req, res) => {
  res.cookie("auth", undefined);
  res.render("pages/registration", {
    header: {
      registration: "active",
      authorization: "",
      logout: "hidden",
      myProfile: "hidden",
      myLogin: ""
    }
  });
});

app.get("/authorization", (req, res) => {
  res.cookie("auth", undefined);
  res.render("pages/authorization", {
    header: {
      registration: "",
      authorization: "active",
      logout: "hidden",
      myProfile: "hidden",
      myLogin: ""
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
  let salt = bcrypt.genSaltSync(10);
  newUser.password = bcrypt.hashSync(newUser.password, salt);
  newUser.authorization = authHash(newUser.login, newUser.password);

  let message;
  users.insertOne(newUser, (err, result) => {
    if (err) {
      res.send("Произошла ошибка :(\n повторите попытку позже...");
    } else {
      res.send(newUser.authorization);
    }
  });
});

//authorization
app.post("/authorization", jsonParser, (req, res) => {
  let user = req.body;
  let searchUser = user.isEmail ? { email: user.login } : { login: user.login };
  users.findOne(searchUser, (err, result) => {
    if (result !== null) {
      bcrypt.compare(user.password, result.password).then(isUser => {
        if (isUser) {
          let auth = authHash(result.login, result.password);
          users.updateOne(
            { login: result.login },
            { $set: { authorization: auth } }
          );
          res.send(result.login + "____" + auth);
        } else {
          res.send("false");
        }
      });
    } else {
      res.send("false");
    }
  });
});

function authHash(login, password) {
  let saltAuth = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(login + password, saltAuth);
}

// profile
app.get("/user/:login", (req, res) => {
  let cookies = parseCookies(req);
  let headers = {
    isGuest: {
      registration: "",
      authorization: "",
      logout: "hidden",
      myProfile: "hidden",
      myLogin: ""
    },
    isUser: {
      registration: "hidden",
      authorization: "hidden",
      logout: "",
      myProfile: "",
      myLogin: ""
    },
    anotherUser: {}
  };
  users.findOne({ login: req.params.login }, (err, result) => {
    if (result === null) {
      users.findOne({ authorization: cookies.auth }, (err, myProfile) => {
        if (myProfile === null) {
          res.render("errors/error404", {
            header: headers.isGuest
          });
        } else {
          let isUser = headers.isUser;
          isUser.myLogin = myProfile.login;
          res.render("errors/error404", {
            header: isUser
          });
        }
      });
    } else if (cookies.auth === undefined || cookies.auth === "undefined") {
      res.render("pages/profile", {
        header: headers.isGuest,
        user: result
      });
    } else if (cookies.auth === result.authorization) {
      let isUserProfile = headers.isUser;
      isUserProfile.myProfile = "active";
      isUserProfile.myLogin = result.login;
      res.render("pages/profile", {
        header: isUserProfile,
        user: result
      });
    } else {
      users.findOne({ authorization: cookies.auth }, (err, myProfile) => {
        let isAnotherUser = headers.isUser;
        isAnotherUser.myLogin = myProfile.login;
        res.render("pages/profile", {
          header: isAnotherUser,
          user: result
        });
      });
    }
  });
});

function parseCookies(request) {
  let list = {};
  let rc = request.headers.cookie;
  rc &&
    rc.split(";").forEach(function(cookie) {
      var parts = cookie.split("=");
      list[parts.shift().trim()] = decodeURI(parts.join("="));
    });

  return list;
}

app.listen(port, function() {
  console.log("server started");
});
