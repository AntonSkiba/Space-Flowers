let toggleOnEdit = document.getElementById("editBtn");

if (toggleOnEdit) {
  toggleOnEdit.addEventListener("click", () => {
    let background = document.getElementById("userBackground").style.background;
    let photo = document.getElementById("userPhoto").style.background;
    let description = document.getElementById("userDesc")
      ? document.getElementById("userDesc").innerHTML
      : "";
    document.getElementById("profileHeader").style.display = "none";
    document.querySelector(".user_content").style.display = "none";
    document.getElementById("edit").style.display = "block";
    document.getElementsByClassName(
      "dropImages"
    )[0].style.background = background;
    document.getElementsByClassName("dropImages")[1].style.background = photo;
    description = description.replace(/@/gi, "$at");
    description = description.replace(
      /<a class=\"textUserLink\" href=\"\/user\/\S+">\S+<\/a>/gi,
      "@$&"
    );
    document.getElementById("descArea").value = description.replace(
      /<\/?[^>]+>/g,
      ""
    );
  });
}

let subscribeBtn = document.getElementById("subscribeBtn");
let unsubscribeBtn = document.getElementById("unsubscribeBtn");

if (subscribeBtn) {
  subscribeBtn.addEventListener("click", () => {
    fetch(`/subscribe/${login}`, {
      method: "GET"
    })
      .then(response => {
        return response.text();
      })
      .then(message => {
        subscribeBtn.style.display = "none";
        unsubscribeBtn.style.display = "block";
        let subrsContainer = document.getElementById("subscribers");
        let subrsCount = parseInt(subrsContainer.innerHTML);
        subrsContainer.innerHTML = subrsCount + 1;
        console.log(message);
      });
  });
}

if (unsubscribeBtn) {
  unsubscribeBtn.addEventListener("click", () => {
    fetch(`/unsubscribe/${login}`, {
      method: "GET"
    })
      .then(response => {
        return response.text();
      })
      .then(message => {
        subscribeBtn.style.display = "block";
        unsubscribeBtn.style.display = "none";
        let subrsContainer = document.getElementById("subscribers");
        let subrsCount = parseInt(subrsContainer.innerHTML);
        subrsContainer.innerHTML = subrsCount - 1;
        console.log(message);
      });
  });
}

let subrs = document.getElementById("subscribersContainer");
let subs = document.getElementById("subscribesContainer");

subrs.addEventListener("click", () => {
  getSubs(login, "subscribers");
});

subs.addEventListener("click", () => {
  getSubs(login, "subscribes");
});

function getSubs(login, type) {
  let title = document.getElementById("subsTitle");
  if (type === "subscribers") title.innerHTML = "Подписчики";
  else title.innerHTML = "Подписки";
  let usersContainer = document.getElementById("usersContainer");
  usersContainer.innerHTML = "";

  fetch(`/getSubs/${type}/${login}`, {
    method: "GET"
  })
    .then(response => {
      return response.json();
    })
    .then(users => {
      if (users.length === 0) {
        let noUsers = document.createElement("span");
        noUsers.setAttribute("id", "noUsers");
        if (type === "subscribers") {
          noUsers.innerHTML = "Нет подписчиков";
          noUsers.style.marginLeft = "120px";
        } else {
          noUsers.style.marginLeft = "140px";
          noUsers.innerHTML = "Нет подписок";
        }
        usersContainer.appendChild(noUsers);
        usersContainer.style.paddingTop = "250px";
      } else {
        usersContainer.style.paddingTop = "0";
        users.forEach(item => {
          let userDiv = document.createElement("div");
          userDiv.setAttribute("class", "userDiv");
          let userLink = document.createElement("a");
          userLink.setAttribute("class", "nav-link userLink");
          userLink.innerHTML = item;
          userLink.setAttribute("href", `/user/${item}`);
          userDiv.appendChild(userLink);
          usersContainer.appendChild(userDiv);
        });
      }
    });
  console.log(type);
}
