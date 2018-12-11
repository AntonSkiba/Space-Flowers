window.addEventListener("load", () => {
  let login = document
    .getElementById("username")
    .innerHTML.split(" ")
    .join("");
  let background = document.getElementById("userBackground");
  let photo = document.getElementById("userPhoto");
  loadHeader(login, background, "background");
  loadHeader(login, photo, "photo");
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
