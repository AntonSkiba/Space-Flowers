let login = document
  .getElementById("username")
  .innerHTML.split(" ")
  .join("");

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
      postElem.addEventListener("click", openPost.bind(postElem, image, login));
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
