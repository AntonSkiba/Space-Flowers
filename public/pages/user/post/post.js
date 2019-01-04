let newPostImage = document.getElementById("newPostImage");

newPostImage.addEventListener("click", () => {
  let click = new MouseEvent("click");
  document.getElementById("postImage").dispatchEvent(click);
});

["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
  newPostImage.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

["dragenter", "dragover", "mouseenter"].forEach(eventName => {
  newPostImage.addEventListener(eventName, highlight.bind(newPostImage), false);
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
