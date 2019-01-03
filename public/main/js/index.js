window.addEventListener("load", () => {
  returnInfo().then(res => {
    for (let i = 0; i < res.users.length; i++) {
      posts.appendChild(
        createPost(res.users[i].login, res.users[i].description)
      );
    }
  });

  // let updatePosts = setInterval(() => {
  //   returnInfo().then(res => {
  //     let posts = document.getElementById("posts");
  //     for (let i = 0; i < res.users.length; i++) {
  //       let post = document.getElementById(res.users[i].login);
  //       if (post) {
  //         let updDesc = post.querySelector(".userDesc").innerHTML
  //           ? post.querySelector(".userDesc").innerHTML
  //           : "";
  //         if (updDesc != res.users[i].description) {
  //           posts.removeChild(document.getElementById(res.users[i].login));
  //           posts.insertBefore(
  //             createPost(res.users[i].login, res.users[i].description),
  //             posts.firstChild
  //           );
  //         }
  //       } else {
  //         posts.insertBefore(
  //           createPost(res.users[i].login, res.users[i].description),
  //           posts.firstChild
  //         );
  //       }
  //     }
  //   });
  // }, 3000);
});

function createPost(login, description) {
  let post = document.createElement("div");
  post.setAttribute("class", "post");
  post.setAttribute("id", login);

  let postPhoto = document.createElement("div");
  postPhoto.setAttribute("class", "postPhoto");

  post.appendChild(postPhoto);

  let infoContainer = document.createElement("div");
  infoContainer.setAttribute("class", "infoContainer");
  post.appendChild(infoContainer);

  let postLogin = document.createElement("div");
  postLogin.setAttribute("class", "postLogin");
  infoContainer.appendChild(postLogin);

  let postDesc = document.createElement("div");
  postDesc.setAttribute("class", "postDesc");
  infoContainer.appendChild(postDesc);

  let userLogin = document.createElement("span");
  userLogin.setAttribute("class", "userLogin");
  userLogin.innerHTML = login;
  postLogin.appendChild(userLogin);

  postPhoto.addEventListener("click", () => {
    redirectOnUser(login);
  });
  postLogin.addEventListener("click", () => {
    redirectOnUser(login);
  });

  let userDesc = document.createElement("pre");
  userDesc.setAttribute("class", "userDesc");
  userDesc.setAttribute("width", "440px");
  userDesc.innerHTML = description;
  postDesc.appendChild(userDesc);

  fetch(`/userProfile/${login}/photo`, {
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
          width: 500,
          height: 500
        });
        let image = randomImage.png();
        postPhoto.style.background = `url(${image}) center no-repeat`;
        postPhoto.style.backgroundSize = "cover";
      } else {
        let image = URL.createObjectURL(backImg);
        postPhoto.style.background = `url(${image}) center no-repeat`;
        postPhoto.style.backgroundSize = "cover";
      }
    });

  return post;
}

function redirectOnUser(login) {
  window.location.href = `/user/${login}`;
}

function returnInfo() {
  return new Promise(function(resolve, reject) {
    fetch("/posts", {
      method: "GET"
    })
      .then(res => {
        return res.json();
      })
      .then(post => {
        resolve(post);
      });
  });
}
