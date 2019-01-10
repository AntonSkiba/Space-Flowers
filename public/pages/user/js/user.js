let login = document
  .getElementById("username")
  .innerHTML.split(" ")
  .join("");

let isUserLogin = document
  .getElementById("navbarDropdown")
  .innerHTML.split(" ")
  .join("");

let userPhotoUrl;

window.addEventListener("load", () => {
  let desc = document.getElementById("userDesc");
  if (desc) {
    desc.innerHTML = desc.innerHTML
      .split("&lt;")
      .join("<")
      .split("&gt;")
      .join(">");
    desc.style.display = "block";
  }
  let background = document.getElementById("userBackground");
  let photo = document.getElementById("userPhoto");
  loadHeader(login, background, "background");
  loadHeader(login, photo, "photo");
  loadPosts(login, 0, 0);
});

let addNewPost = document.getElementById("addNewPost");
if (addNewPost) {
  addNewPost.addEventListener("click", () => {
    document.getElementById("likes").style.visibility = "hidden";
    document.getElementById("likes").style.height = "1px";
    console.log("click");
    document.getElementById("justPost").style.display = "none";
    document.getElementById("status").innerHTML = "Сходство";
    document.getElementById("statusLink").style.visibility = "hidden";
    document.getElementById("similarity").innerHTML = "";
    document.getElementById("hiddenComments").style.display = "none";
    document.getElementById("postDate").style.display = "none";
    document.getElementById("offsetDivider").style.marginTop = "85px";
    let newPost = document.getElementById("newPost");
    newPost.style.display = "block";
    document.getElementById("newPostImage").style.border = "2px solid #ccc";
    document.getElementById(
      "userPhotoPost"
    ).style.background = `url(${userPhotoUrl}) center no-repeat`;
    document.getElementById("userPhotoPost").style.backgroundSize = "cover";
    document.getElementById("userNamePost").innerHTML = login;
  });
}

function loadHeader(login, element, type) {
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
        if (type == "photo") userPhotoUrl = image;
        element.style.background = `url(${image}) center no-repeat`;
        element.style.backgroundSize = "cover";
      } else {
        let image = URL.createObjectURL(backImg);
        if (type == "photo") userPhotoUrl = image;
        element.style.background = `url(${image}) center no-repeat`;
        element.style.backgroundSize = "cover";
      }
    });
}
function fetchNow(login, i, start, length, postsContainer) {
  fetch(`/getPost/${login}/${i}`, {
    method: "GET"
  })
    .then(res => {
      return res.blob();
    })
    .then(postImg => {
      let image = URL.createObjectURL(postImg);
      let postElem = document.createElement("div");
      postElem.setAttribute("class", "postBlock animation");
      postElem.setAttribute("id", i);
      postElem.setAttribute("data-toggle", "modal");
      postElem.setAttribute("data-target", "#post");
      postElem.style.background = `url(${image}) center no-repeat`;
      postElem.style.backgroundSize = "cover";
      postElem.addEventListener("click", openPost.bind(postElem, image));
      postsContainer.appendChild(postElem);
      containerResize();
      if (length < 12 + start) {
        if (i < length - 1)
          fetchNow(login, i + 1, start, length, postsContainer);
      } else {
        if (i < 11 + start)
          fetchNow(login, i + 1, start, length, postsContainer);
      }
    });
}

function openPost(image) {
  let postImg = document.getElementById("postImg");
  let postId = this.id ? this.id : 0;
  postImg.setAttribute("postid", postId);
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

  document.getElementById(
    "userPhotoPost"
  ).style.background = `url(${userPhotoUrl}) center no-repeat`;
  document.getElementById("userPhotoPost").style.backgroundSize = "cover";
  document.getElementById("userNamePost").innerHTML = login;
  postImg.appendChild(resizeToPost(image));

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
  fetch(`/postContent/${login}/${postId}/${isUserLogin}`, {
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
      showStatus(postContent.status);
      postContent.comments.forEach((item, index) => {
        showComment(item.name, item.text, item.date, index);
      });
      if (!postContent.userLikes) {
        likeToggler(true);
      } else {
        likeToggler(false);
      }
    });
}

function showStatus(message) {
  let status = document.getElementById("status");
  let statusLink = document.getElementById("statusLink");
  let similarity = document.getElementById("similarity");
  if (message === "original") {
    status.innerHTML = "Оригинал";
    statusLink.style.visibility = "hidden";
    similarity.innerHTML = "";
  } else {
    let user = message.split("___")[0];
    let post = parseInt(message.split("___")[1]) + 1;
    let sim = parseFloat(message.split("___")[2]);
    status.innerHTML = "Сходтво с " + post + " постом ";
    statusLink.setAttribute("href", `/user/${user}`);
    statusLink.innerHTML = user;
    statusLink.style.visibility = "visible";
    let persColor = (-80 + sim) / 20;
    console.log(persColor);
    similarity.innerHTML = `: <span style="color: ${getColor(
      persColor
    )}">${sim}%</span>`;
  }
}

function getColor(value) {
  var hue = ((1 - value) * 80).toString(10);
  return ["hsl(", hue, ",50%,50%)"].join("");
}

function showComment(user, text, date, index) {
  let comments = document.getElementById("comments");

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
  comValue = comValue
    .split(" ")
    .map(word => {
      for (let i = 1; i < Math.floor(word.length / 25) + 1; i++) {
        word = word.split("");
        word.splice(i * 25, 0, "- ");
        word = word.join("");
      }
      return word;
    })
    .join(" ");

  comValue = comValue.replace(linkRegular, '<a href="$&">$&</a>');

  comText.innerHTML = comValue;

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

function resizeToPost(image) {
  let postImage = document.createElement("img");
  postImage.style.display = "none";
  postImage.setAttribute("class", "postImage");
  postImage.src = image;

  postImage.width = "500";
  postImage.style.display = "block";
  return postImage;
}

function loadPosts(login, i, start) {
  fetch(`/userPosts/${login}`, {
    method: "GET"
  })
    .then(response => {
      return response.json();
    })
    .then(posts => {
      let postsContainer = document.querySelector(".postsContainer");
      if (i < posts.length)
        fetchNow(login, i, start, posts.length, postsContainer);
    });
}

window.addEventListener("resize", containerResize);
let trigger = false;
setInterval(() => {
  let postsContainer = document.querySelector(".postsContainer");
  if (trigger !== isVisible(postsContainer.lastChild)) {
    trigger = !trigger;
  }
  if (trigger === true && !((parseInt(postsContainer.lastChild.id) + 1) % 12)) {
    loadPosts(
      login,
      parseInt(postsContainer.lastChild.id) + 1,
      parseInt(postsContainer.lastChild.id) + 1
    );
  }
}, 1000);

function containerResize() {
  let content = document.querySelector(".user_content");
  let width = content.offsetWidth;
  let container = document.querySelector(".postsContainer");
  let qtyPosts = container.getElementsByClassName("postBlock").length;
  if (qtyPosts) {
    let realWidth = qtyPosts * 200;
    let height = container.offsetHeight;
    let qtyBlocks = Math.floor(width / 200);
    let realHeight = Math.floor(qtyPosts / qtyBlocks + 0.999999) * 200;
    container.style.width = `${qtyBlocks * 200}px`;
    if (realHeight !== height) {
      content.style.height = `${realHeight + 40}px`;
      container.style.height = `${realHeight}px`;
    }
  }
}
