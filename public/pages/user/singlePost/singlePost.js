window.addEventListener("load", () => {
  let user_post = document.URL.split("post/")[1];
  let login = user_post.split("-")[1];
  let postId = user_post;

  loadHeader(login, "", "photo");
  fetch(`/getPost/${login}/${postId}`, {
    method: "GET"
  })
    .then(res => {
      return res.blob();
    })
    .then(postImg => {
      let image = URL.createObjectURL(postImg);
      openPost(image, login, postId);
    });
});
