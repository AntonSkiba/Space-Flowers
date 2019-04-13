let isSearch = window.location.toString().includes("search");
let login = "";
if (!isSearch) {
  login = document
    .getElementById("username")
    .innerHTML.split(" ")
    .join("");
} else {
  login = decodeURI(window.location.toString().split("search/")[1]);
}

window.addEventListener("load", () => {
  if (!isSearch) {
    let desc = document.getElementById("userDesc");
    if (desc) {
      desc.innerHTML = desc.innerHTML
        .split("&lt;")
        .join("<")
        .split("&gt;")
        .join(">");
      desc.innerHTML = getTextWithTags(desc.innerHTML);
      desc.innerHTML = getTextWithUsers(desc.innerHTML);
      desc.style.display = "block";
    }
    let background = document.getElementById("userBackground");
    let photo = document.getElementById("userPhoto");
    loadHeader(login, background, "background");
    loadHeader(login, photo, "photo");
  }
  loadPosts(login, 0, 0);
});

let addNewPost = document.getElementById("addNewPost");
if (addNewPost) {
  addNewPost.addEventListener("click", () => {
    document.getElementById("likes").style.visibility = "hidden";
    document.getElementById("likes").style.height = "1px";
    console.log("click");
    document.getElementById("justPost").style.display = "none";
    document.getElementById("postStatus").innerHTML = "Сходство";
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

function fetchNow(i, start, posts, postsContainer) {
  let login = posts[posts.length - i - 1].split("-")[1];
  fetch(`/getPost/${login}/${posts[posts.length - i - 1]}`, {
    method: "GET"
  })
    .then(res => {
      return res.blob();
    })
    .then(postImg => {
      let image = URL.createObjectURL(postImg);
      let postElem = document.createElement("div");
      postElem.setAttribute("class", "postBlock animation");
      postElem.setAttribute("id", posts[posts.length - i - 1]);
      postElem.setAttribute("data-toggle", "modal");
      postElem.setAttribute("data-target", "#post");
      postElem.style.background = `url(${image}) center no-repeat`;
      postElem.style.backgroundSize = "cover";
      postElem.addEventListener(
        "click",
        openPost.bind(postElem, image, login, posts[posts.length - i - 1])
      );
      postsContainer.appendChild(postElem);
      containerResize();
      if (posts.length < 12 + start) {
        if (i < posts.length - 1) fetchNow(i + 1, start, posts, postsContainer);
      } else {
        if (i < 11 + start) fetchNow(i + 1, start, posts, postsContainer);
      }
    });
}

function loadPosts(login, i, start) {
  fetch(`/${isSearch ? "searchPosts" : "userPosts"}/${login}`, {
    method: "GET"
  })
    .then(response => {
      return response.json();
    })
    .then(posts => {
      let postsContainer = document.querySelector(".postsContainer");
      if (i < posts.length) fetchNow(i, start, posts, postsContainer);
      if (!posts.length && isSearch) {
        let noSearch = document.createElement("div");
        noSearch.setAttribute("class", "error_page");
        let noSearchMessage = document.createElement("h1");
        noSearchMessage.style.background = "var(--main-color)";
        noSearchMessage.innerHTML = "Ничего не найдено :с";
        noSearch.appendChild(noSearchMessage);
        document.querySelector(".user_content").appendChild(noSearch);
      }
    });
}

window.addEventListener("resize", containerResize);
let trigger = false;
setInterval(() => {
  let postsContainer = document.querySelector(".postsContainer");
  if (trigger !== isVisible(postsContainer.lastChild)) {
    trigger = !trigger;
  }
  if (
    trigger === true &&
    !(postsContainer.getElementsByClassName("postBlock").length % 12)
  ) {
    loadPosts(
      login,
      postsContainer.getElementsByClassName("postBlock").length,
      postsContainer.getElementsByClassName("postBlock").length
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
