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
  let login = document
    .getElementById("username")
    .innerHTML.split(" ")
    .join("");
  let background = document.getElementById("userBackground");
  let photo = document.getElementById("userPhoto");
  loadHeader(login, background, "background");
  loadHeader(login, photo, "photo");
  loadPosts(login, 0, 0);
});

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
        element.style.background = `url(${image}) center no-repeat`;
        element.style.backgroundSize = "cover";
      } else {
        let image = URL.createObjectURL(backImg);
        element.style.background = `url(${image}) center no-repeat`;
        element.style.backgroundSize = "cover";
      }
    });
}
let fetchNow = function(login, i, start, length, postsContainer) {
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
      postElem.style.background = `url(${image}) center no-repeat`;
      postElem.style.backgroundSize = "cover";
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
};

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
      "SkibaAnton",
      parseInt(postsContainer.lastChild.id) + 1,
      parseInt(postsContainer.lastChild.id) + 1
    );
  }
}, 1000);

function isVisible(elem) {
  if (elem) {
    var coords = elem.getBoundingClientRect();

    var windowHeight = document.documentElement.clientHeight;
    var topVisible = coords.top > 0 && coords.top < windowHeight;
    var bottomVisible = coords.bottom < windowHeight && coords.bottom > 0;

    return topVisible || bottomVisible;
  } else return false;
}

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
      content.style.height = `${realHeight + 80}px`;
      container.style.height = `${realHeight}px`;
    }
  }
}
// temp loading post
function postImages(file) {
  let reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = function() {
    let img = reader.result;
    let loadPost = document.getElementById("loadPost");
    loadPost.style.height = "300px";
    loadPost.style.width = "500px";
    loadPost.style.background = `url("${img}") center no-repeat`;
    loadPost.style.backgroundSize = "cover";
  };
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
}
