let userPhotoUrl;
let isUserLogin = document
  .getElementById("navbarDropdown")
  .innerHTML.split(" ")
  .join("");

function openPost(image, login, id) {
  let postImg = document.getElementById("postImg");
  postImg.setAttribute("postid", id);
  let img = postImg.querySelector(".postImage");
  document.getElementById("justPost").style.display = "block";
  document.getElementById("hiddenComments").style.display = "block";
  document.getElementById("postDate").style.display = "block";
  document.getElementById("offsetDivider").style.marginTop = "15px";
  if (document.getElementById("newPost"))
    document.getElementById("newPost").style.display = "none";
  if (document.getElementById("deletePost")) {
    document.getElementById("areYouSure").style.display = "none";
    document.getElementById("deletePost").style.display = "block";
  }
  document.getElementById("likes").style.visibility = "visible";
  document.getElementById("likes").style.height = "40px";

  if (img) postImg.removeChild(img);

  let namePost = document.getElementById("userNamePost");
  namePost.innerHTML = login;
  namePost.setAttribute("href", `/user/${login}`);
  namePost.setAttribute("class", "userLinkPost");
  postImg.appendChild(resizeToPost(image, 500));

  let getheight = setInterval(() => {
    if (postImg.offsetHeight > 0) {
      let imgHeight = postImg.offsetHeight;

      let comments = document.getElementById("comments");
      let delBtn = document.getElementById("deletePost");
      let offset = delBtn ? 220 : 175;
      comments.style.height = `${imgHeight - offset}px`;
      clearInterval(getheight);
    }
  }, 60);

  if (isUserLogin.split(/[A-Za-z]/g).length == 1) isUserLogin = "guest";
  fetch(`/postContent/${login}/${id}/${isUserLogin}`, {
    method: "GET"
  })
    .then(response => {
      return response.json();
    })
    .then(postContent => {
      let likesNum = document.getElementById("likesNum");
      let date = document.getElementById("date");
      date.innerHTML = postContent.date;
      likesNum.innerHTML = postContent.likes.length;
      document.getElementById("comments").innerHTML = "";
      let status = document.getElementById("postStatus");
      status.innerHTML = "";
      showStatus(postContent.status, status);
      let comments = document.getElementById("comments");
      if (postContent.comments.length == 0) {
        let noComments = document.createElement("div");
        noComments.setAttribute("class", "noComments");
        noComments.innerHTML = "Комментариев нет";
        comments.appendChild(noComments);
      } else {
        postContent.comments.forEach((item, index) => {
          showComment(item.name, item.text, item.date, index, comments);
        });
      }
      if (!postContent.userLikes) {
        likeToggler(true);
      } else {
        likeToggler(false);
      }
    });
}

let userPhotoInterval = setInterval(() => {
  if (userPhotoUrl) {
    document.getElementById(
      "userPhotoPost"
    ).style.background = `url(${userPhotoUrl}) center no-repeat`;
    document.getElementById("userPhotoPost").style.backgroundSize = "cover";
    clearInterval(userPhotoInterval);
  }
}, 100);

function loadHeader(login, element, type, indexPost) {
  fetch(`/userProfile/${login}/${type}`, {
    method: "GET"
  })
    .then(response => {
      if (response.headers.get("content-type").includes("text/html")) {
        return response.text();
      } else {
        return response.blob();
      }
    })
    .then(backImg => {
      if (backImg === "none") {
        let randomImage = Trianglify({
          width: 1000,
          height: 500
        });
        let image = randomImage.png();
        if (!indexPost && type == "photo") userPhotoUrl = image;
        if (element.style) {
          element.style.background = `url(${image}) center no-repeat`;
          element.style.backgroundSize = "cover";
        }
      } else {
        let image = URL.createObjectURL(backImg);
        if (!indexPost && type == "photo") userPhotoUrl = image;
        if (element.style) {
          element.style.background = `url(${image}) center no-repeat`;
          element.style.backgroundSize = "cover";
        }
      }
    });
}

function showStatus(message, elem) {
  let status = document.createElement("span");
  status.setAttribute("class", "status");
  let statusLink = document.createElement("a");
  statusLink.setAttribute("class", "nav-link statusLink");
  let similarity = document.createElement("span");
  similarity.setAttribute("class", "similarity");
  if (message === "original") {
    status.innerHTML = "Оригинал";
    statusLink.style.visibility = "hidden";
    similarity.innerHTML = "";
  } else {
    let user = message.split("___")[0];
    let post = message.split("___")[1];
    let sim = parseFloat(message.split("___")[2]);
    status.innerHTML = "Сходтво с ";
    statusLink.setAttribute("href", `/post/${post}`);
    statusLink.innerHTML = "постом " + user;
    statusLink.style.visibility = "visible";
    let persColor = (-80 + sim) / 20;
    similarity.innerHTML = `: <span style="color: ${getColor(
      persColor
    )}">${sim}%</span>`;
  }
  elem.appendChild(status);
  elem.appendChild(statusLink);
  elem.appendChild(similarity);
}

function getColor(value) {
  var hue = ((1 - value) * 80).toString(10);
  return ["hsl(", hue, ",50%,50%)"].join("");
}

function showComment(user, text, date, index, comments) {
  let comBlock = document.createElement("div");
  comBlock.setAttribute("id", "commentId_" + index);
  comBlock.setAttribute("class", "comment");
  let comInfo = document.createElement("div");
  comInfo.setAttribute("class", "comInfo");
  let userLink = document.createElement("a");
  userLink.setAttribute("class", "nav-link comLink");
  userLink.setAttribute("href", `/user/${user}`);
  userLink.innerHTML = user;
  comInfo.appendChild(userLink);
  let userDate = document.createElement("span");
  userDate.setAttribute("class", "comDate");
  userDate.innerHTML = date;
  comInfo.appendChild(userDate);

  let comText = document.createElement("span");
  comText.setAttribute("class", "comText");
  let comValue = text
    .split("<")
    .join("&lt;")
    .split(">")
    .join("&gt;");
  let linkRegular = /(https?:\/\/|ftp:\/\/|www\.)((?![.,?!;:()]*(\s|$))[^\s]){2,}/gim;
  comValue = getTextWithTags(comValue);
  comValue = getTextWithUsers(comValue);
  comValue = comValue.replace(linkRegular, '<a href="$&">$&</a>');
  // comValue = comValue
  //   .split(" ")
  //   .map(word => {
  //     for (let i = 1; i < Math.floor(word.length / 30) + 1; i++) {
  //       word = word.split("");
  //       word.splice(i * 30, 0, " ");
  //       word = word.join("");
  //     }
  //     return word;
  //   })
  //   .join(" ");

  comText.innerHTML = comValue;
  let noComs = comments.getElementsByClassName("noComments");
  if (noComs.length > 0) {
    comments.innerHTML = "";
  }
  comBlock.appendChild(comInfo);
  comBlock.appendChild(comText);
  comments.appendChild(comBlock);
  comments.scrollTop = 9999;
}

let likeBtn = document.getElementById("like");
let unlikeBtn = document.getElementById("unlike");

if (likeBtn) {
  likeBtn.addEventListener("click", () => {
    let postId = document.getElementById("postImg").getAttribute("postid");
    setLike(postId);
  });
}

if (unlikeBtn) {
  unlikeBtn.addEventListener("click", () => {
    let postId = document.getElementById("postImg").getAttribute("postid");
    setUnlike(postId);
  });
}

function likeToggler(type) {
  if (type) {
    if (likeBtn) likeBtn.style.display = "block";
    if (unlikeBtn) unlikeBtn.style.display = "none";
  } else {
    if (likeBtn) likeBtn.style.display = "none";
    if (unlikeBtn) unlikeBtn.style.display = "block";
  }
}

function setLike(postId) {
  let login = document
    .getElementById("userNamePost")
    .innerHTML.split(" ")
    .join("");
  console.log(isUserLogin + " лайкнул " + postId);
  if (isUserLogin != "guest") {
    likeToggler(false);
    let numCont = document.getElementById("likesNum");
    let likesNum = parseInt(numCont.innerHTML);
    numCont.innerHTML = likesNum + 1;
    console.log(likesNum);
    fetch(`/like/${isUserLogin}/${login}/${postId}`, {
      method: "GET"
    })
      .then(response => response.text())
      .then(message => {
        console.log(message);
      });
  } else {
    console.log("Войдите или зарегистрируйтесь, чтобы поставить лайк");
  }
}

function setUnlike(postId) {
  let login = document
    .getElementById("userNamePost")
    .innerHTML.split(" ")
    .join("");
  console.log(isUserLogin + " снял лайк с " + postId);
  if (isUserLogin != "guest") {
    likeToggler(true);
    let numCont = document.getElementById("likesNum");
    let likesNum = parseInt(numCont.innerHTML);
    numCont.innerHTML = likesNum - 1;
    fetch(`/unlike/${isUserLogin}/${login}/${postId}`, {
      method: "GET"
    })
      .then(response => response.text())
      .then(message => {
        console.log(message);
      });
  } else {
    console.log("Войдите или зарегистрируйтесь, чтобы снять лайк???");
  }
}

function resizeToPost(image, size) {
  let postImage = document.createElement("img");
  postImage.style.display = "none";
  postImage.setAttribute("class", "postImage");
  postImage.src = image;

  postImage.width = `${size}`;
  postImage.style.display = "block";
  return postImage;
}
