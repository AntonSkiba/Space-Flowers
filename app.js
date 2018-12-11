const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const mongoClient = require("mongodb").MongoClient;
const multer = require("multer");
const path = require("path");
const fs = require("fs");

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

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
  let cookies = parseCookies(req);
  if (cookies.auth === undefined || cookies.auth === "undefined") {
    res.render("index", {
      header: {
        registration: "",
        authorization: "",
        logout: "hidden",
        myProfile: "hidden",
        myLogin: ""
      }
    });
  } else {
    users.findOne({ authorization: cookies.auth }, (err, result) => {
      if (result === null) {
        res.cookie("auth", undefined);
        res.redirect("/");
      } else {
        res.render("index", {
          header: {
            registration: "hidden",
            authorization: "hidden",
            logout: "",
            myProfile: "",
            myLogin: result.login
          },
          user: result,
          isUser: true
        });
      }
    });
  }
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
  newUser.updateDate = new Date();

  let message;
  users.insertOne(newUser, (err, result) => {
    if (err) {
      res.send("Произошла ошибка :(\n повторите попытку позже...");
    } else {
      res.send(newUser.login + "____" + newUser.authorization);
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
    myProfile: "active",
    myLogin: ""
  },
  anotherUser: {
    registration: "hidden",
    authorization: "hidden",
    logout: "",
    myProfile: "",
    myLogin: ""
  }
};

app.get("/user/:login", (req, res, next) => {
  let cookies = parseCookies(req);
  users.findOne({ login: req.params.login }, (err, result) => {
    if (result === null) {
      next();
    } else if (cookies.auth === undefined || cookies.auth === "undefined") {
      res.render("pages/user", {
        header: headers.isGuest,
        user: result,
        isUser: false
      });
    } else if (cookies.auth === result.authorization) {
      let isUserProfile = headers.isUser;
      isUserProfile.myLogin = result.login;
      res.render("pages/user", {
        header: isUserProfile,
        user: result,
        isUser: true
      });
    } else {
      users.findOne({ authorization: cookies.auth }, (err, myProfile) => {
        let isAnotherUser = headers.anotherUser;
        isAnotherUser.myLogin = myProfile.login;
        res.render("pages/user", {
          header: isAnotherUser,
          user: result,
          isUser: false
        });
      });
    }
  });
});

app.get("/userProfile/:login/:type", (req, res) => {
  let login = req.params.login;
  let type = req.params.type;
  users.findOne({ login: login }, (err, user) => {
    if (user[type]) {
      fs.exists(__dirname + user[type], exists => {
        if (exists) res.sendFile(__dirname + user[type]);
        else res.send("none");
      });
    } else {
      res.send("none");
    }
  });
});

// edit profile

let storage = multer.diskStorage({
  destination: __dirname + "/imagesOfUsers",
  filename: function(req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  }
});

function returnStorage(login) {
  return multer.diskStorage({
    destination: `./imagesOfUsers/${login}`,
    filename: function(req, file, cb) {
      cb(null, file.fieldname + "-" + login + path.extname(file.originalname));
    }
  });
}

app.post("/updateUserProfile", (req, res) => {
  let cookies = parseCookies(req);
  users.findOne({ authorization: cookies.auth }, (err, profile) => {
    if (err || profile === null) {
      res.send("Произошел троллинг :)))000))0");
    } else {
      let storage = returnStorage(profile.login);
      let upload = multer({
        storage: storage
      }).fields([{ name: "background" }, { name: "photo" }]);

      upload(req, res, err => {
        if (err) {
          res.send("Произошел троллинг с загрузкой картинок :)))000))0");
        } else {
          let updateObj = {};
          for (let key in req.files) {
            updateObj[key] = "/" + req.files[key][0].path.split("\\").join("/");
          }
          let linkRegular = /(https?:\/\/|ftp:\/\/|www\.)((?![.,?!;:()]*(\s|$))[^\s]){2,}/gim;
          let desc = req.body.description.replace(
            linkRegular,
            '<a href="$&">$&</a>'
          );
          if (req.body.description !== desc) {
            updateObj.description = desc;
            updateObj.updateDate = new Date();
          }
          if (!isEmpty(updateObj)) {
            users.updateOne(
              { login: profile.login },
              {
                $set: updateObj
              }
            );
          }
          res.send(profile.login);
        }
      });
    }
  });
});

// d
function isEmpty(obj) {
  for (let key in obj) {
    return false;
  }
  return true;
}

//posts
app.get("/posts", (req, res) => {
  if (users) {
    users
      .find()
      .sort({ updateDate: -1 })
      .toArray((err, result) => {
        if (err || result === null) res.send({ users: "none" });
        else
          res.send({
            users: result.map(item => {
              return {
                login: item.login,
                description: item.description ? item.description : ""
              };
            })
          });
      });
  }
});

// other
function parseCookies(request) {
  let list = {};
  let rc = request.headers.cookie;
  rc &&
    rc.split(";").forEach(function(cookie) {
      let parts = cookie.split("=");
      list[parts.shift().trim()] = decodeURI(parts.join("="));
    });

  return list;
}

app.use(function(req, res, next) {
  let cookies = parseCookies(req);
  res.status(404);
  users.findOne({ authorization: cookies.auth }, (err, myProfile) => {
    if (myProfile === null) {
      res.render("errors/error404", {
        header: headers.isGuest
      });
    } else {
      let isUser = headers.anotherUser;
      isUser.myLogin = myProfile.login;
      res.render("errors/error404", {
        header: isUser
      });
    }
  });
});

app.listen(port, function() {
  console.log("server started");
});
