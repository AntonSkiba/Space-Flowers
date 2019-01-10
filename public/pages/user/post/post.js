let newPostImage = document.getElementById("newPostImage");

if (newPostImage) {
  newPostImage.addEventListener("click", () => {
    let click = new MouseEvent("click");
    document.getElementById("postImage").dispatchEvent(click);
  });
  ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    newPostImage.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });
  ["dragenter", "dragover", "mouseenter"].forEach(eventName => {
    newPostImage.addEventListener(
      eventName,
      highlight.bind(newPostImage),
      false
    );
  });
  ["dragleave", "drop", "mouseleave"].forEach(eventName => {
    newPostImage.addEventListener(
      eventName,
      unhighlight.bind(newPostImage),
      false
    );
  });

  function highlight(e) {
    this.classList.add("highlight");
  }
  function unhighlight(e) {
    this.classList.remove("highlight");
  }

  newPostImage.addEventListener("drop", dropImage, false);
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function dropImage(e) {
  let dt = e.dataTransfer;
  let file = dt.files[0];
  postImages(file);
}

function postImages(file) {
  if (
    typeof file == "object" &&
    (file.type == "image/jpeg" || file.type == "image/png")
  ) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function() {
      let img = reader.result;
      let loadBlock = document.getElementById("loadBlock");
      document.getElementById("newPostImage").style.display = "none";
      let imgArea = document.getElementById("loadedImg");
      let lastPost = imgArea.querySelector(".postImage");
      if (lastPost) imgArea.removeChild(lastPost);
      imgArea.appendChild(resizeToPost(img));
      loadBlock.style.display = "block";
      imgArea.style.filter = "opacity(50%)";
      document.getElementById("savePost").style.display = "none";
      document.getElementById("loadedImg").style.display = "block";
      console.log(file);
      let formData = new FormData();
      formData.append("post", file);
      fetch("/plagiarismTest", {
        method: "POST",
        body: formData
      })
        .then(res => {
          return res.text();
        })
        .then(mess => {
          console.log(mess);
          showStatus(mess);
          document.getElementById("savePost").style.display = "inline-block";
          loadBlock.style.display = "none";
          imgArea.style.filter = "none";
        });
    };
  }
}

let cancelButton = document.getElementById("cancelPost");

if (cancelButton) {
  cancelButton.addEventListener("click", () => {
    document.getElementById("newPostImage").style.display = "block";
    document.getElementById("loadedImg").style.display = "none";
    fetch("/cancelNewPost", {
      method: "GET"
    })
      .then(response => {
        return response.text();
      })
      .then(message => {
        console.log(message);
      });
  });
}

let savePost = document.getElementById("savePost");

if (savePost) {
  savePost.addEventListener("click", () => {
    let postReady =
      document.getElementById("loadedImg").style.display == "block"
        ? true
        : false;
    if (postReady) {
      document.getElementById("newPostImage").style.display = "block";
      document.getElementById("loadedImg").style.display = "none";
      fetch("/saveNewPost", {
        method: "GET"
      })
        .then(response => {
          return response.text();
        })
        .then(message => {
          document.querySelector(".postsContainer").innerHTML = "";
          loadPosts(login, 0, 0);
          let loadedImgSrc = document.querySelector("#loadedImg .postImage")
            .src;
          openPost(loadedImgSrc);
          let postsCount = document.getElementById("postsCount");
          let postsCountNum = parseInt(postsCount.innerHTML);
          postsCount.innerHTML = postsCountNum + 1;
        });
    } else {
      document.getElementById("newPostImage").style.border = "2px solid red";
    }
  });
}

let deletePost = document.getElementById("deletePost");

if (deletePost) {
  deletePost.addEventListener("click", () => {
    document.getElementById("hiddenComments").style.display = "none";
    deletePost.style.display = "none";
    document.getElementById("areYouSure").style.display = "block";
  });
}

let sureNo = document.getElementById("sureNo");
let sureYes = document.getElementById("sureYes");

if (sureYes) {
  sureNo.addEventListener("click", () => {
    document.getElementById("hiddenComments").style.display = "block";
    document.getElementById("areYouSure").style.display = "none";
    document.getElementById("deletePost").style.display = "block";
  });

  sureYes.addEventListener("click", () => {
    let postId = document.getElementById("postImg").getAttribute("postid");
    fetch(`/deletePost/${postId}`, {
      method: "GET"
    })
      .then(response => {
        return response.text();
      })
      .then(message => {
        console.log(message);
        document.querySelector(".postsContainer").innerHTML = "";
        loadPosts(login, 0, 0);
        let postsCount = document.getElementById("postsCount");
        let postsCountNum = parseInt(postsCount.innerHTML);
        postsCount.innerHTML = postsCountNum - 1;
        document.getElementById("areYouSure").style.display = "none";
        document.getElementById("deletePost").style.display = "block";
        document.getElementById("hiddenComments").style.display = "block";
      });
  });
}

let commArea = document.getElementById("setComment");

if (commArea) {
  commArea.addEventListener("input", () => {
    let sendBtn = document.getElementById("sendComment");
    let realValue = commArea.value
      .split("\n")
      .join("")
      .split(" ")
      .join("");
    if (realValue) {
      sendBtn.style.visibility = "visible";
      sendBtn.addEventListener("click", sendComment);
    } else {
      sendBtn.style.visibility = "hidden";
      sendBtn.removeEventListener("click", sendComment);
    }
  });
}

function sendComment() {
  let postId = document.getElementById("postImg").getAttribute("postid");
  let commentText = commArea.value.replace(/\s\s+/g, " ");
  let commentBody = {
    setComUser: isUserLogin.split("\n")[1],
    getComUser: login.split("\n")[1],
    postId: postId,
    text: commentText,
    date: new Date().getTime()
  };

  console.log(commentBody);
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
      document.getElementById("sendComment").style.visibility = "hidden";
      commArea.value = "";
      console.log(message);
      let countComments = document.getElementsByClassName("comment").length;
      showComment(
        commentBody.setComUser,
        commentBody.text,
        getDate(commentBody.date),
        countComments
      );
    });
}

function getDate(ms) {
  let unchangeTime = new Date(ms).toLocaleString();
  unchangeTime = unchangeTime.split(":")[0] + ":" + unchangeTime.split(":")[1];
  unchangeTime = unchangeTime.split(",").join("");

  return unchangeTime;
}
