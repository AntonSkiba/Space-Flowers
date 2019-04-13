let realValue = "";
let cp = 5;
window.addEventListener("load", () => {
  loading(0);

  let trigger = false;
  setInterval(() => {
    let postsInPage = document.getElementsByClassName("index-post");
    if (
      isVisible(postsInPage[postsInPage.length - 1]) &&
      !(postsInPage.length % cp)
    ) {
      loading(postsInPage.length);
    }
  }, 1000);
});

let loadPosts = returnInfo(window.location.toString());

function loading(index) {
  loadPosts.then(posts => {
    loadIndexPosts(index, posts);
  });
}

function loadIndexPosts(index, posts) {
  let postsInPage = document.getElementsByClassName("index-post");
  if (postsInPage.length !== posts.length) {
    console.log(index);
    let length = index + cp > posts.length ? posts.length : index + cp;
    let postsContainer = document.getElementById("posts");
    for (let i = index; i < length; i++) {
      postsContainer.appendChild(createBlockToPost(posts[i]));
    }
  }
}

function createBlockToPost(postId) {
  let login = postId.split("-")[1];
  let dividers = [];
  for (let i = 0; i < 3; i++) {
    let blueDivider = document.createElement("div");
    blueDivider.setAttribute("class", "blueDivider");
    dividers.push(blueDivider);
  }

  //postsContainer->postBlock
  let postBlock = document.createElement("div");
  postBlock.setAttribute("class", "modal-post index-post");
  postBlock.setAttribute("id", `post_${postId}`);
  postBlock.setAttribute("role", "document");

  //postsContainer->postBlock->contentBlock
  let contentBlock = document.createElement("div");
  contentBlock.setAttribute("class", "modal-content");

  //postsContainer->postBlock->contentBlock->contentBody
  let contentBody = document.createElement("div");
  contentBody.setAttribute("class", "modal-body");

  //postsContainer->postBlock->contentBlock->contentBody->justPost
  let justPost = document.createElement("div");
  justPost.setAttribute("class", "justPost");

  //justPost->postInfo
  let postInfo = document.createElement("div");
  postInfo.setAttribute("class", "postInfo");

  //justPost->postInfo->userPhoto
  let userPhoto = document.createElement("div");
  userPhoto.setAttribute("class", "userPhoto");
  userPhoto.addEventListener("click", () => {
    redirectOnUser(login);
  });
  loadHeader(login, userPhoto, "photo", true);

  //justPost->postInfo->userPostInfo
  let userPostInfo = document.createElement("div");
  userPostInfo.setAttribute("class", "userPostInfo");

  //justPost->postInfo->userPostInfo->userLink
  let userLink = document.createElement("a");
  userLink.setAttribute("class", "nav-link userLink");
  userLink.setAttribute("href", `/user/${login}`);
  userLink.innerHTML = login;

  //justPost->postInfo->userPostInfo->postDate
  let postDate = document.createElement("span");
  postDate.setAttribute("class", "postDate");

  //justPost->postInfo->userPostInfo->postSim
  let postSim = document.createElement("span");
  postSim.setAttribute("class", "postSim");

  //justPost->postImg
  let postImg = document.createElement("div");
  postImg.setAttribute("class", "postImg");

  //justPost->postStatistic
  let postStat = document.createElement("div");
  postStat.setAttribute("class", "postStatistic");

  //justPost->postStatistic->countComs
  let countComs = document.createElement("div");
  countComs.setAttribute("class", "countComs");

  //justPost->postComments
  let postComments = document.createElement("div");
  postComments.setAttribute("class", "postComments");

  let meUser = document
    .getElementById("navbarDropdown")
    .innerHTML.split(" ")
    .join("")
    .split("\n")
    .join("");

  meUser = meUser ? meUser : "guest";
  //justPost->sendArea
  let area = document.createElement("textarea");
  let sendBtn = document.createElement("div");
  if (meUser !== "guest") {
    area.setAttribute("type", "text");
    area.setAttribute("class", "setComment");
    area.setAttribute("maxlength", "1000");
    area.setAttribute("rows", "3");
    area.setAttribute("placeholder", "Комментарий...");
    area.style.position = "relative";
    sendBtn.setAttribute("class", "likeIcons sendComment");
    let btnImg = document.createElement("img");
    btnImg.setAttribute("src", "/public/pages/user/icons/send.svg");
    btnImg.setAttribute("width", "25");
    sendBtn.appendChild(btnImg);

    area.addEventListener("input", () => {
      realValue = area.value;

      if (
        area.value
          .split("\n")
          .join("")
          .split(" ")
          .join("")
      ) {
        sendBtn.style.visibility = "visible";
      } else {
        sendBtn.style.visibility = "hidden";
      }
    });

    sendBtn.addEventListener("click", () => {
      let coms = countComs.innerHTML.split("(");
      if (coms[1]) {
        coms = coms[1].split(")")[0];
        coms = parseInt(coms);
        countComs.innerHTML = `Комментарии (${coms + 1}) :`;
      }
      console.log(coms);
      sendComment(meUser, login, postId, postComments, sendBtn, area);
    });
  }
  // let

  fetch(`/getPost/${login}/${postId}`, {
    method: "GET"
  })
    .then(res => {
      return res.blob();
    })
    .then(art => {
      let image = URL.createObjectURL(art);
      postImg.appendChild(resizeToPost(image, 616));
    });

  fetch(`/postContent/${login}/${postId}/${meUser}`, {
    method: "GET"
  })
    .then(response => {
      return response.json();
    })
    .then(postContent => {
      showStatus(postContent.status, postSim);
      postDate.innerHTML = postContent.date;
      if (postContent.comments.length == 0) {
        let noComments = document.createElement("div");
        noComments.setAttribute("class", "noComments");
        noComments.innerHTML = "Комментариев нет";
        postComments.appendChild(noComments);
        countComs.innerHTML = `Комментарии`;
      } else {
        countComs.innerHTML = `Комментарии (${postContent.comments.length}) :`;
        postContent.comments.forEach((item, index) => {
          showComment(item.name, item.text, item.date, index, postComments);
        });
      }
    });

  postStat.appendChild(countComs);
  userPostInfo.appendChild(userLink);
  userPostInfo.appendChild(postDate);
  userPostInfo.appendChild(postSim);
  postInfo.appendChild(userPhoto);
  postInfo.appendChild(userPostInfo);
  justPost.appendChild(postInfo);
  justPost.appendChild(postImg);
  justPost.appendChild(dividers[0]);
  justPost.appendChild(postStat);
  justPost.appendChild(dividers[1]);
  justPost.appendChild(postComments);
  if (meUser !== "guest") {
    justPost.appendChild(dividers[2]);
    justPost.appendChild(area);
    justPost.appendChild(sendBtn);
  }
  contentBody.appendChild(justPost);
  contentBlock.appendChild(contentBody);
  postBlock.appendChild(contentBlock);
  return postBlock;
}

function sendComment(myLogin, login, postId, postComments, btn, area) {
  if (realValue) {
    let commentText = realValue.replace(/\s\s+/g, " ");
    let commentBody = {
      setComUser: myLogin.split("\n").join(""),
      getComUser: login.split("\n").join(""),
      postId: postId,
      text: commentText,
      date: new Date().getTime()
    };

    fetch("/setComment", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(commentBody)
    })
      .then(response => {
        return response.text();
      })
      .then(message => {
        btn.style.visibility = "hidden";
        area.value = "";
        let countComments = postComments.getElementsByClassName("comment")
          .length;
        showComment(
          commentBody.setComUser,
          commentBody.text,
          getDate(commentBody.date),
          countComments,
          postComments
        );
      });
  }
}

function getDate(ms) {
  let unchangeTime = new Date(ms).toLocaleString();
  unchangeTime = unchangeTime.split(":")[0] + ":" + unchangeTime.split(":")[1];
  unchangeTime = unchangeTime.split(",").join("");

  return unchangeTime;
}

function redirectOnUser(login) {
  window.location.href = `/user/${login}`;
}

function returnInfo(searchString) {
  console.log(searchString);
  return new Promise(function(resolve, reject) {
    fetch("/posts", {
      method: "GET"
    })
      .then(res => {
        return res.json();
      })
      .then(posts => {
        resolve(posts);
      });
  });
}
