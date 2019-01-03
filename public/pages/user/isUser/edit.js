let newBackground = document.getElementById("newBackground");
let newPhoto = document.getElementById("newPhoto");
let tempImages = ["", ""];

let saveEditBtn = document.getElementById("saveEditBtn");
let cancelBtn = document.getElementById("cancelBtn");

saveEditBtn.addEventListener("click", () => {
  let formData = new FormData();
  formData.append("background", tempImages[0]);
  formData.append("photo", tempImages[1]);
  formData.append("description", document.getElementById("descArea").value);
  fetch("/updateUserProfile", {
    method: "POST",
    body: formData
  })
    .then(res => {
      return res.text();
    })
    .then(mess => {
      window.location.href = `/user/${mess}`;
    });
});

cancelBtn.addEventListener("click", () => {
  document.getElementById("profileHeader").style.display = "block";
  document.querySelector(".user_content").style.display = "block";
  document.getElementById("edit").style.display = "none";
});

newBackground.addEventListener("click", () => {
  let click = new MouseEvent("click");
  document.getElementById("backImage").dispatchEvent(click);
});

newPhoto.addEventListener("click", () => {
  let click = new MouseEvent("click");
  document.getElementById("userImage").dispatchEvent(click);
});

["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
  newBackground.addEventListener(eventName, preventDefaults, false);
  newPhoto.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

["dragenter", "dragover", "mouseenter"].forEach(eventName => {
  newBackground.addEventListener(
    eventName,
    highlight.bind(newBackground),
    false
  );
  newPhoto.addEventListener(eventName, highlight.bind(newPhoto), false);
});
["dragleave", "drop", "mouseleave"].forEach(eventName => {
  newBackground.addEventListener(
    eventName,
    unhighlight.bind(newBackground),
    false
  );
  newPhoto.addEventListener(eventName, unhighlight.bind(newPhoto), false);
});

function highlight(e) {
  this.classList.add("highlight");
}
function unhighlight(e) {
  this.classList.remove("highlight");
}

newBackground.addEventListener("drop", dropBackgroundImage, false);
newPhoto.addEventListener("drop", dropUserImage, false);

function dropBackgroundImage(e) {
  let dt = e.dataTransfer;
  let file = dt.files[0];
  handleImages(file, 0);
}

function dropUserImage(e) {
  let dt = e.dataTransfer;
  let file = dt.files[0];
  handleImages(file, 1);
}

function handleImages(file, area) {
  console.log(file);
  if (
    typeof file == "object" &&
    (file.type == "image/jpeg" || file.type == "image/png")
  ) {
    tempImages[area] = file;
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function() {
      let img = reader.result;
      let imgArea = document.getElementsByClassName("dropImages")[area];
      imgArea.style.background = `url("${img}") center no-repeat`;
      imgArea.style.backgroundSize = "cover";
    };
  } else if (tempImages[area]) {
    let reader = new FileReader();
    reader.readAsDataURL(tempImages[area]);
    reader.onloadend = function() {
      let img = reader.result;
      let imgArea = document.getElementsByClassName("dropImages")[area];
      imgArea.style.background = `url("${img}") center no-repeat`;
      imgArea.style.backgroundSize = "cover";
    };
  }
}

function uploadFile(file, area) {
  let formData = new FormData();
  formData.append("file", file);
  fetch("/updateUserPhoto", {
    method: "POST",
    body: formData
  })
    .then(() => {
      /* Готово. Информируем пользователя */
    })
    .catch(() => {
      /* Ошибка. Информируем пользователя */
    });
}
