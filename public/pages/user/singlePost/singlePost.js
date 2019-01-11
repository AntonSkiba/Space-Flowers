window.addEventListener("load", () => {
  let user_post = document.URL.split("post/")[1];
  let login = user_post.split("__")[0];
  fetch(`/userPosts/${login}`, {
    method: "GET"
  })
    .then(response => {
      return response.json();
    })
    .then(posts => {
      let postId = posts.length - parseInt(user_post.split("__")[1]) - 1;

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
});
