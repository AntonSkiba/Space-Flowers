const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const mongoClient = require("mongodb").MongoClient;
const multer = require("multer");
const path = require("path");
const util = require("util");
const fs = require("fs");
const readFile = util.promisify(fs.readFile);
const pHash = require("./pHash.js");
const sharp = require("sharp");

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
    console.log("Успешное подключение к БД");
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
      console.log(`Новый пользователь ${newUser.login} зарегистрирован`);
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
          console.log(`Зашел ${user.login}`);
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

// app.get("/userPosts/:login", (req, res) => {
//   let login = req.params.login;
//   let files = [];
//   users.findOne({ login: login }, (err, user) => {
//     if (user.posts) {
//       let files = user.posts.map(function(post) {
//         return readFile(__dirname + post.url);
//       });
//       Promise.all(files)
//         .then(fileNames => {
//           console.log(fileNames);
//           res.send(fileNames);
//         })
//         .catch(err => {
//           console.log(err);
//         });
//     } else res.send([]);
//   });
// });

app.get("/userPosts/:login", (req, res) => {
  let login = req.params.login;
  users.findOne({ login: login }, (err, user) => {
    if (user.posts) {
      res.send(user.posts.map(item => item.url.split("/")[2].slice(5, -4)));
    } else res.send([]);
  });
});

app.get("/getPost/:login/:i", (req, res) => {
  let login = req.params.login;
  let i = req.params.i;
  users.findOne({ login: login }, (err, user) => {
    let index = user.posts.length - i - 1;
    fs.exists(__dirname + user.posts[index].url, exists => {
      if (exists) res.sendFile(__dirname + user.posts[index].url);
      else res.send("none");
    });
  });
});

// app.get("/userProfile/:login", (req, res) => {
//   let login = req.params.login;
//   let files = [];
//   users.findOne({ login: login }, (err, user) => {
//     files.push(readFile(__dirname + user.photo));
//     files.push(readFile(__dirname + user.background));
//
//     Promise.all(files).then(fileNames => {
//       console.log(fileNames);
//       res.send(fileNames);
//     });
//   });
// });

// edit profile

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
          if (desc !== profile.description) {
            updateObj.description = desc;
          }
          if (!isEmpty(updateObj)) {
            updateObj.updateDate = new Date();
            users.updateOne(
              { login: profile.login },
              {
                $set: updateObj
              },
              () => {
                res.send(profile.login);
              }
            );
            console.log(`Пользователь ${profile.login} загрузил`);
            console.log(updateObj);
          } else {
            res.send(profile.login);
          }
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

function returnPostStorage(login, count) {
  return multer.diskStorage({
    destination: "./posts",
    filename: function(req, file, cb) {
      cb(null, "post-" + count + "-" + login + path.extname(file.originalname));
    }
  });
}

app.post("/plagiarismTest", (req, res) => {
  let cookies = parseCookies(req);
  users.findOne({ authorization: cookies.auth }, (err, profile) => {
    if (err || profile === null) {
      res.send("Произошел троллинг :)))000))0");
    } else {
      let postId = new Date().getTime();
      let storage = returnPostStorage(profile.login, postId);
      let upload = multer({
        storage: storage
      }).fields([{ name: "post" }]);

      upload(req, res, err => {
        if (err) {
          res.send("Произошел троллинг с загрузкой картинок :)))000))0");
        } else {
          let posts = profile.posts ? profile.posts : [];
          let url = "/" + req.files.post[0].path.split("\\").join("/");
          sharp("." + url)
            .resize(128, 128, {
              fit: "fill"
            })
            .toFile(url.split("/")[2])
            .then(() => {
              pHash(url.split("/")[2]).then(pHash => {
                let message = "";
                fs.unlink(url.split("/")[2], () => {});
                hammingDistance(pHash).then(simObj => {
                  console.log(simObj);

                  if (isEmpty(simObj)) {
                    message = "original";
                  } else {
                    top: for (key in simObj) {
                      for (postIndex in simObj[key]) {
                        if (simObj[key][postIndex] > 90) {
                          message = key + "___" + postIndex + "___plagiarism";
                          break top;
                        } else {
                          message = key + "___" + postIndex + "___reproduction";
                          break top;
                        }
                      }
                    }
                  }
                  let post = {
                    url: url,
                    pHash: pHash,
                    status: message
                  };
                  posts.push(post);
                  users.updateOne(
                    { login: profile.login },
                    {
                      $set: {
                        posts: posts
                      }
                    },
                    () => {
                      console.log(message);
                      res.send(message);
                    }
                  );
                });
              });
            });
        }
      });
    }
  });
});

// other

function hammingDistance(hash) {
  return new Promise(function(resolve, reject) {
    users.find().toArray((err, result) => {
      if (err || result === null) {
        res.send({ users: "none" });
      } else {
        let simObj = {};
        result.forEach((user, userIndex) => {
          if (user.posts) {
            let userSim = {};
            user.posts.forEach((post, index) => {
              let similarity = hash.length;

              hash.forEach((val, key) => {
                if (hash[key] != post.pHash[key]) {
                  similarity--;
                }
              });
              similarity = ((similarity / hash.length) * 100).toFixed(2);
              if (similarity > 80) {
                userSim[`${index}`] = similarity;
                simObj[user.login] = userSim;
              }
            });
          }
          if (userIndex === result.length - 1) {
            resolve(simObj);
          }
        });
      }
    });
  });
}

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
