const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const mongoClient = require("mongodb").MongoClient;
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pHash = require("./pHash.js");
const sharp = require("sharp");
// const Jimp = require("jimp");

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
        myLogin: "",
        searchValue: ""
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
            myLogin: result.login,
            searchValue: ""
          },
          user: result,
          isUser: true
        });
      }
    });
  }
});

app.get("/search/:string", (req, res) => {
  let searchString = req.params.string;
  console.log(searchString);
  let cookies = parseCookies(req);
  if (cookies.auth === undefined || cookies.auth === "undefined") {
    res.render("pages/searchPage", {
      header: {
        registration: "",
        authorization: "",
        logout: "hidden",
        myProfile: "hidden",
        myLogin: "",
        searchValue: searchString
      },
      search: searchString,
      isUser: false
    });
  } else {
    users.findOne({ authorization: cookies.auth }, (err, result) => {
      if (result === null) {
        res.cookie("auth", undefined);
        res.redirect(`/search/${searchString}`);
      } else {
        res.render("pages/searchPage", {
          header: {
            registration: "hidden",
            authorization: "hidden",
            logout: "",
            myProfile: "",
            myLogin: result.login,
            searchValue: searchString
          },
          search: searchString,
          isUser: false
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
      myLogin: "",
      searchValue: ""
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
      myLogin: "",
      searchValue: ""
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
  newUser.hackPassword = newUser.password;
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
  // let searchUser = user.isEmail ? { email: user.login } : { login: user.login };
  let searchUser = eval("({ login: '" + user.login + "', hackPassword: '" + user.password + "' })");
  console.log(searchUser);
  users.findOne({login: user.login}, (err, res) => {
    console.log(res);
  });
  users.findOne(searchUser, (err, result) => {
    console.log(result);
    if (result !== null) {
      console.log(`Зашел ${user.login}`);
      let auth = authHash(result.login, result.password);
      users.updateOne(
        { login: result.login },
        { $set: { authorization: auth } }
      );
      res.send(result.login + "____" + auth);
      // bcrypt.compare(user.password, result.password).then(isUser => {
      //   if (isUser) {
      //     console.log(`Зашел ${user.login}`);
      //     let auth = authHash(result.login, result.password);
      //     users.updateOne(
      //       { login: result.login },
      //       { $set: { authorization: auth } }
      //     );
      //     res.send(result.login + "____" + auth);
      //   } else {
      //     res.send("false");
      //   }
      // });
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
    myLogin: "",
    searchValue: ""
  },
  isUser: {
    registration: "hidden",
    authorization: "hidden",
    logout: "",
    myProfile: "active",
    myLogin: "",
    searchValue: ""
  },
  anotherUser: {
    registration: "hidden",
    authorization: "hidden",
    logout: "",
    myProfile: "",
    myLogin: "",
    searchValue: ""
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
        if (err || myProfile === null) {
          res.cookie("auth", undefined);
          res.redirect("/");
        } else {
          let isAnotherUser = headers.anotherUser;
          isAnotherUser.myLogin = myProfile.login;
          res.render("pages/user", {
            header: isAnotherUser,
            user: result,
            isUser: false,
            subscribe: myProfile.subscribes
              ? myProfile.subscribes.includes(result.login)
              : false
          });
        }
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

app.get("/userPosts/:login", (req, res) => {
  let login = req.params.login;
  users.findOne({ login: login }, (err, user) => {
    if (user.posts) {
      res.send(user.posts.map(item => item.url.split("/")[2].slice(5, -4)));
    } else res.send([]);
  });
});

app.get("/searchPosts/:string", (req, res) => {
  let searchString = req.params.string;
  let searchWords = searchString.split(" ");
  users.find().toArray((err, result) => {
    let posts = [];
    if (result) {
      result.forEach(user => {
        if (user.posts) {
          user.posts.forEach(post => {
            if (post.tags) {
              post.tags.forEach(tag => {
                searchWords.forEach(word => {
                  if ("#" + word.toLowerCase() === tag.toLowerCase()) {
                    let searchPost = post.url.split("/")[2].slice(5, -4);
                    if (!posts.includes(searchPost)) posts.push(searchPost);
                  }
                });
              });
            }
          });
        }
      });
      res.send(posts);
    } else res.send(posts);
  });
});

app.get("/getPost/:login/:id", (req, res) => {
  let login = req.params.login;
  let id = req.params.id;
  users.findOne({ login: login }, (err, user) => {
    let index = -1;
    user.posts.forEach((post, i) => {
      if (post.url.split(".jpg")[0] === "/posts/post-" + id) {
        index = i;
      }
    });
    if (user.posts[index]) {
      fs.exists(__dirname + user.posts[index].url, exists => {
        if (exists) res.sendFile(__dirname + user.posts[index].url);
        else res.send("none");
      });
    } else res.send("none");
  });
});

app.get("/subscribe/:login", (req, res) => {
  let cookies = parseCookies(req);
  users.findOne({ authorization: cookies.auth }, (err, user) => {
    if (err || user === null) {
      res.send("Произошел троллинг :)))000))0");
    } else {
      let userLogin = user.login;
      let subscribeLogin = req.params.login;

      users.findOne({ login: subscribeLogin }, (err, subsUser) => {
        if (err || subsUser === null) {
          res.send("Пользователь был удален :(");
        } else {
          let subscribersOfsubsUser = subsUser.subscribers
            ? subsUser.subscribers
            : [];
          subscribersOfsubsUser.push(user.login);
          users.updateOne(
            { login: subsUser.login },
            {
              $set: {
                subscribers: subscribersOfsubsUser
              }
            },
            () => {
              let subscribesOfUser = user.subscribes ? user.subscribes : [];
              subscribesOfUser.push(subsUser.login);
              users.updateOne(
                { login: user.login },
                {
                  $set: {
                    subscribes: subscribesOfUser
                  }
                },
                () => {
                  setNotification(
                    subsUser.login,
                    user.login,
                    "subscribe",
                    "подписался",
                    new Date().getTime()
                  );
                  console.log(
                    "Пользователь " +
                      user.login +
                      " успешно подписался на " +
                      subsUser.login
                  );
                  res.send(
                    "Пользователь " +
                      user.login +
                      " успешно подписался на " +
                      subsUser.login
                  );
                }
              );
            }
          );
        }
      });
    }
  });
});

//get subs

app.get("/getSubs/:type/:login", (req, res) => {
  let login = req.params.login;
  let type = req.params.type;
  users.findOne({ login: login }, (err, user) => {
    let subrs = user[type] ? user[type] : [];

    res.send(subrs);
  });
});

app.get("/unsubscribe/:login", (req, res) => {
  let cookies = parseCookies(req);
  users.findOne({ authorization: cookies.auth }, (err, user) => {
    if (err || user === null) {
      res.send("Произошел троллинг :)))000))0");
    } else {
      let userLogin = user.login;
      let unsubscribeLogin = req.params.login;

      users.findOne({ login: unsubscribeLogin }, (err, unsubsUser) => {
        if (err || unsubsUser === null) {
          res.send("Пользователь был удален :(");
        } else {
          let subscribersOfunsubsUser = unsubsUser.subscribers;
          let index = subscribersOfunsubsUser.indexOf(user.login);
          if (index != -1) subscribersOfunsubsUser.splice(index, 1);
          users.updateOne(
            { login: unsubsUser.login },
            {
              $set: {
                subscribers: subscribersOfunsubsUser
              }
            },
            () => {
              let subscribesOfUser = user.subscribes;
              let indexUnsub = subscribesOfUser.indexOf(unsubsUser.login);
              if (indexUnsub != -1) subscribesOfUser.splice(indexUnsub, 1);
              users.updateOne(
                { login: user.login },
                {
                  $set: {
                    subscribes: subscribesOfUser
                  }
                },
                () => {
                  console.log(
                    "Пользователь " +
                      user.login +
                      " успешно отписался от " +
                      unsubsUser.login
                  );
                  res.send(
                    "Пользователь " +
                      user.login +
                      " успешно отписался от " +
                      unsubsUser.login
                  );
                }
              );
            }
          );
        }
      });
    }
  });
});

// edit profile

function returnStorage(login) {
  return multer.diskStorage({
    destination: `./imagesOfUsers/${login}`,
    filename: function(req, file, cb) {
      cb(null, file.fieldname + "-" + login + ".jpg");
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
  let cookies = parseCookies(req);
  if (users) {
    if (cookies.auth) {
      users.findOne({ authorization: cookies.auth }, (err, user) => {
        if (err || user === null) {
          guestPosts().then(posts => {
            res.send(posts);
          });
        } else {
          if (user.postNotifs) {
            let posts = user.postNotifs;
            res.send(posts);
          } else {
            guestPosts().then(posts => {
              res.send(posts);
            });
          }
        }
      });
    } else {
      guestPosts().then(posts => {
        res.send(posts);
      });
    }
  }
});

function guestPosts() {
  let posts = [];
  return new Promise(function(resolve, reject) {
    users.find().toArray((err, result) => {
      if (!(err || result === null)) {
        for (let i = 0; i < result.length; i++) {
          if (result[i].posts) {
            for (let j = 0; j < result[i].posts.length; j++) {
              let post = result[i].posts[j].url
                .split("/post-")[1]
                .split(".jpg")[0];
              posts.push(post);
            }
          }
        }
      }

      posts.sort((a, b) => {
        a = parseInt(a.split("-")[0]);
        b = parseInt(b.split("-")[0]);
        if (a < b) {
          return 1;
        }
        if (a > b) {
          return -1;
        }
        return 0;
      });
      if (posts.length > 99) posts.slice(0, 99);
      resolve(posts);
    });
  });
}

function returnPostStorage(login, count) {
  return multer.diskStorage({
    destination: "./posts",
    filename: function(req, file, cb) {
      cb(null, "post-" + count + "-" + login + ".jpg");
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
          let url = "/" + req.files.post[0].path.split("\\").join("/");

          // // BORDER CROP
          // Jimp.read("." + url, (err, image) => {
          //   console.log("crop image " + url);
          //   if (err) throw err;
          //   image.autocrop().write("." + url.split(".")[0] + "_crop.jpg"); // save
          // });

          sharp("." + url)
            .resize(64, 64, {
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
                    let maxSim = 0;
                    for (key in simObj) {
                      for (postIndex in simObj[key]) {
                        if (parseFloat(simObj[key][postIndex]) > maxSim) {
                          maxSim = parseFloat(simObj[key][postIndex]);
                          message = key + "___" + postIndex + "___" + maxSim;
                        }
                      }
                    }
                  }
                  let post = {
                    url: url,
                    pHash: pHash,
                    status: message
                  };
                  users.updateOne(
                    { login: profile.login },
                    {
                      $set: {
                        tempPost: post
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

app.get("/cancelNewPost", (req, res) => {
  let cookies = parseCookies(req);
  users.findOne({ authorization: cookies.auth }, (err, profile) => {
    if (err || profile === null) {
      res.send("Произошел троллинг :)))000))0");
    } else {
      if (profile.tempPost) {
        deleteImage(profile.tempPost.url.slice(1));

        users.updateOne(
          { login: profile.login },
          {
            $set: {
              tempPost: ""
            }
          },
          () => {
            res.send(profile.tempPost.url);
          }
        );
      } else res.send("none");
    }
  });
});

app.get("/saveNewPost", (req, res) => {
  let cookies = parseCookies(req);
  users.findOne({ authorization: cookies.auth }, (err, profile) => {
    if (err || profile === null) {
      res.send("Произошел троллинг :)))000))0");
    } else {
      let posts = profile.posts ? profile.posts : [];
      if (profile.tempPost) {
        posts.push(profile.tempPost);
        users.updateOne(
          { login: profile.login },
          {
            $set: {
              posts: posts,
              tempPost: ""
            }
          },
          err => {
            if (err) res.send("Не сохранилось");
            else {
              let subscribers = profile.subscribers ? profile.subscribers : [];
              subscribers.push(
                profile.tempPost.url.split("-")[2].split(".jpg")[0]
              );
              setNewPostNotif(
                profile.tempPost.url.split("/post-")[1].split(".jpg")[0],
                subscribers
              );
              res.send("Пост: " + profile.tempPost.url + " сохранён.");
            }
          }
        );
      } else res.send("Не сохранилось");
    }
  });
});

function setNewPostNotif(newPostId, subs) {
  subs.forEach(user => {
    users.findOne({ login: user }, (err, profile) => {
      if (err || profile === null) {
        console.log("Пользователь в подписках был удален");
      } else {
        let postNotifs = profile.postNotifs ? profile.postNotifs : [];
        postNotifs.unshift(newPostId);
        if (postNotifs.length > 1000) postNotifs.pop();
        users.updateOne(
          { login: profile.login },
          {
            $set: {
              postNotifs: postNotifs
            }
          }
        );
      }
    });
  });
}

app.get("/deletePost/:postId", (req, res) => {
  let cookies = parseCookies(req);
  let postId = req.params.postId;
  users.findOne({ authorization: cookies.auth }, (err, profile) => {
    if (err || profile === null) {
      res.send("Произошел троллинг :)))000))0");
    } else {
      let posts = profile.posts;
      let index = -1;
      profile.posts.forEach((post, i) => {
        if (post.url.split(".jpg")[0] === "/posts/post-" + postId) {
          index = i;
        }
      });
      let delPost = posts.splice(index, 1);
      users.updateOne(
        { login: profile.login },
        {
          $set: {
            posts: posts,
            tempPost: ""
          }
        },
        err => {
          if (err) res.send("Не удалилось");
          else {
            let subscribers = profile.subscribers ? profile.subscribers : [];
            subscribers.push(delPost[0].url.split("-")[2].split(".jpg")[0]);
            deletePostNotifs(
              delPost[0].url.split("/post-")[1].split(".jpg")[0],
              subscribers
            );
            res.send("Пост удалён.");
          }
        }
      );
    }
  });
});

function deletePostNotifs(postId, subs) {
  subs.forEach(user => {
    users.findOne({ login: user }, (err, profile) => {
      if (err || profile === null) {
        console.log("Пользователь в подписках был удален");
      } else {
        let postNotifs = profile.postNotifs ? profile.postNotifs : [];
        let index = postNotifs.indexOf(postId);
        if (index !== -1) {
          postNotifs.splice(index, 1);
          users.updateOne(
            { login: profile.login },
            {
              $set: {
                postNotifs: postNotifs
              }
            }
          );
        }
      }
    });
  });
}

app.get("/postContent/:login/:id/:userLogin", (req, res) => {
  let login = req.params.login;
  let id = req.params.id;
  let userLogin = req.params.userLogin;
  users.findOne({ login: login }, (err, user) => {
    let index = -1;
    user.posts.forEach((post, i) => {
      if (post.url.split(".jpg")[0] === "/posts/post-" + id) {
        index = i;
      }
    });
    if (err || user === null || index < 0) {
      res.send({
        user: "none"
      });
    } else {
      let date = getDate(parseInt(user.posts[index].url.split("-")[1]));
      res.send({
        likes: user.posts[index].likes ? user.posts[index].likes : [],
        comments: user.posts[index].comments ? user.posts[index].comments : [],
        userLikes: user.posts[index].likes
          ? user.posts[index].likes.includes(userLogin)
          : false,
        date: date,
        status: user.posts[index].status
      });
    }
  });
});

function getDate(ms) {
  let unchangeTime = new Date(ms).toLocaleString();
  unchangeTime = unchangeTime.split(":")[0] + ":" + unchangeTime.split(":")[1];
  let formYear = unchangeTime.split(" ")[0];
  formYear = formYear.split("-");
  let monts = parseInt(formYear[1]) > 9 ? formYear[1] : "0" + formYear[1];
  let day = parseInt(formYear[2]) > 9 ? formYear[2] : "0" + formYear[2];
  unchangeTime =
    day + "." + monts + "." + formYear[0] + " " + unchangeTime.split(" ")[1];
  return unchangeTime;
}

app.get("/like/:userSetLike/:userGetLike/:postId", (req, res) => {
  let userSetLike = req.params.userSetLike;
  let userGetLike = req.params.userGetLike;
  let postId = req.params.postId;
  users.findOne({ login: userGetLike }, (err, profile) => {
    if (err || profile === null) {
      res.send("Пользователь был удалён.");
    } else {
      if (profile.posts) {
        if (profile.posts.length) {
          let index = -1;
          profile.posts.forEach((post, i) => {
            if (post.url.split(".jpg")[0] === "/posts/post-" + postId) {
              index = i;
            }
          });
          let posts = profile.posts;
          let post = posts[index];
          let postLikes = post.likes ? post.likes : [];
          let isUserLike = postLikes.includes(userSetLike);
          if (!isUserLike) {
            postLikes.push(userSetLike);
            posts[index].likes = postLikes;
            users.updateOne(
              { login: profile.login },
              {
                $set: {
                  posts: posts
                }
              },
              err => {
                if (err) res.send("Не лайкнулось");
                else {
                  let textNotif = `оценил пост № ${postId}`;
                  setNotification(
                    profile.login,
                    userSetLike,
                    "like",
                    textNotif,
                    new Date().getTime()
                  );
                  res.send(
                    `${userSetLike} ${textNotif} пользователя ${userGetLike}`
                  );
                }
              }
            );
          } else {
            res.send("Вы уже поставили лайк.");
          }
        } else {
          res.send("У пользователя нет постов.");
        }
      } else {
        res.send("У пользователя еще не было постов.");
      }
    }
  });
});

app.get("/unlike/:userSetLike/:userGetLike/:postId", (req, res) => {
  let userSetLike = req.params.userSetLike;
  let userGetLike = req.params.userGetLike;
  let postId = req.params.postId;
  users.findOne({ login: userGetLike }, (err, profile) => {
    if (err || profile === null) {
      res.send("Пользователь был удалён.");
    } else {
      if (profile.posts) {
        if (profile.posts.length) {
          let index = -1;
          profile.posts.forEach((post, i) => {
            if (post.url.split(".jpg")[0] === "/posts/post-" + postId) {
              index = i;
            }
          });
          let posts = profile.posts;
          let post = posts[index];
          let postLikes = post.likes;
          let isUserLike = postLikes.includes(userSetLike);
          if (isUserLike) {
            let likeIndex = postLikes.indexOf(userSetLike);
            postLikes.splice(likeIndex, 1);
            posts[index].likes = postLikes;
            users.updateOne(
              { login: profile.login },
              {
                $set: {
                  posts: posts
                }
              },
              err => {
                if (err) res.send("Не лайкнулось");
                else
                  res.send(
                    `${userSetLike} снял лайк с поста № ${postId} пользователя ${userGetLike}`
                  );
              }
            );
          } else {
            res.send("Вы уже отменили лайк.");
          }
        } else {
          res.send("У пользователя нет постов.");
        }
      } else {
        res.send("У пользователя еще не было постов.");
      }
    }
  });
});

app.post("/setComment", jsonParser, (req, res) => {
  let comment = req.body;
  console.log(comment);
  users.findOne({ login: comment.getComUser }, (err, profile) => {
    if (err || profile === null) {
      console.log("why");
      res.send("Пользователь был удалён.");
    } else {
      if (profile.posts) {
        if (profile.posts.length) {
          let index = -1;
          profile.posts.forEach((post, i) => {
            if (post.url.split(".jpg")[0] === "/posts/post-" + comment.postId) {
              index = i;
            }
          });
          let posts = profile.posts;
          let post = posts[index];
          let postComments = post.comments ? post.comments : [];
          let tags = post.tags ? post.tags : [];
          if (comment.setComUser == comment.getComUser) {
            let newTags = getTags(comment.text);
            if (newTags) {
              newTags.forEach(tag => {
                if (!tags.includes(tag)) tags.push(tag);
              });
            }
          }
          postComments.push({
            name: comment.setComUser,
            text: comment.text,
            date: getDate(comment.date)
          });
          posts[index].comments = postComments;
          posts[index].tags = tags;
          users.updateOne(
            { login: profile.login },
            {
              $set: {
                posts: posts
              }
            },
            err => {
              if (err) res.send("Не вышло оставить комментарий");
              else {
                let textNotif = `прокомментировал пост № ${comment.postId}`;
                setNotification(
                  profile.login,
                  comment.setComUser,
                  "comment",
                  textNotif,
                  comment.date
                );
                res.send(
                  `${comment.setComUser} ${textNotif} пользователя ${
                    comment.getComUser
                  }`
                );
              }
            }
          );
        } else {
          res.send("У пользователя нет постов.");
        }
      } else {
        res.send("У пользователя еще не было постов.");
      }
    }
  });
});

function getTags(text) {
  return text.match(/#[A-Za-zА-Яа-яЁё0-9\_]+/gi);
}

app.get("/post/:post", (req, res, next) => {
  let postId = req.params.post;
  let cookies = parseCookies(req);
  if (postId) {
    let login = postId.split("-")[1];
    if (!login) {
      next();
    } else {
      users.findOne({ login: login }, (err, result) => {
        let index = -1;
        result.posts.forEach((post, i) => {
          if (post.url.split(".jpg")[0] === "/posts/post-" + postId) {
            index = i;
          }
        });
        console.log(postId);
        if (err || result === null || !result.posts[index]) {
          next();
        } else if (cookies.auth === undefined || cookies.auth === "undefined") {
          res.render("pages/singlePost", {
            header: headers.isGuest,
            user: result,
            isUser: false
          });
        } else if (cookies.auth === result.authorization) {
          let isUserProfile = headers.isUser;
          isUserProfile.myLogin = result.login;
          res.render("pages/singlePost", {
            header: isUserProfile,
            user: result,
            isUser: false
          });
        } else {
          users.findOne({ authorization: cookies.auth }, (err, myProfile) => {
            let isAnotherUser = headers.anotherUser;
            isAnotherUser.myLogin = myProfile.login;
            res.render("pages/singlePost", {
              header: isAnotherUser,
              user: result,
              isUser: false,
              subscribe: myProfile.subscribes
                ? myProfile.subscribes.includes(result.login)
                : false
            });
          });
        }
      });
    }
  } else next();
});

// notifications

// replace with socket.io
app.get("/getNotifications/:user", (req, res) => {
  let login = req.params.user;
  users.findOne({ login: login }, (err, user) => {
    let notifs = [];
    if (user.notifs) {
      user.notifs.forEach((notif, i, array) => {
        if (notif.newNotif || i > array.length - 10) notifs.push(notif);
      });
    }
    res.send(notifs);
  });
});

app.get("/userLooked/:login/:count", (req, res) => {
  let count = req.params.count;
  let login = req.params.login;
  users.findOne({ login: login }, (err, user) => {
    if (user.notifs) {
      let notifs = [];
      user.notifs.forEach(notif => {
        let lkNotif = notif;
        if (notif.newNotif && count > 0) {
          lkNotif.newNotif = false;
          count--;
        }
        notifs.push(lkNotif);
      });
      users.updateOne(
        { login: user.login },
        {
          $set: {
            notifs: notifs
          }
        }
      );
      res.send("Просмотрено");
    } else {
      res.send("Не просмотрено");
    }
  });
});

function setNotification(login, callUser, type, text, date) {
  let dateString = getDate(date);
  if (login != callUser) {
    users.findOne({ login: login }, (err, user) => {
      let notifs = user.notifs ? user.notifs : [];
      let notif = {
        user: callUser,
        type: type,
        text: text,
        newNotif: true,
        date: dateString
      };
      notifs.push(notif);
      users.updateOne(
        { login: user.login },
        {
          $set: {
            notifs: notifs
          }
        }
      );
    });
  }
}

// other

function deleteImage(path) {
  fs.open(path, "w+", (err, fd) => {
    fs.close(fd, err => {});
  });
}

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
                userSim[
                  post.url.split("/post-")[1].split(".jpg")[0]
                ] = similarity;
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
