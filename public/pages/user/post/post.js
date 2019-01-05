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
      document.getElementById("newPostImage").style.display = "none";
      let imgArea = document.getElementById("loadedImg");
      let lastPost = imgArea.querySelector(".postImage");
      if (lastPost) imgArea.removeChild(lastPost);
      imgArea.appendChild(resizeToPost(img));
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
        });
    } else {
      document.getElementById("newPostImage").style.border = "2px solid red";
    }
  });
}

let deletePost = document.getElementById("deletePost");

if (deletePost) {
  deletePost.addEventListener("click", () => {
    deletePost.style.display = "none";
    document.getElementById("areYouSure").style.display = "block";
  });
}

let sureNo = document.getElementById("sureNo");
let sureYes = document.getElementById("sureYes");

if (sureYes) {
  sureNo.addEventListener("click", () => {
    document.getElementById("areYouSure").style.display = "none";
    document.getElementById("deletePost").style.display = "block";
  });

  sureYes.addEventListener("click", () => {
    let postId = document.getElementById("postImg").getAttribute("postid");
    containerResize();
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
        document.getElementById("areYouSure").style.display = "none";
        document.getElementById("deletePost").style.display = "block";
      });
  });
}
