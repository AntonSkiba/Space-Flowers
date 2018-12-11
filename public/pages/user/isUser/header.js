let toggleOnEdit = document.getElementById("editBtn");

if (toggleOnEdit) {
  toggleOnEdit.addEventListener("click", () => {
    let background = document.getElementById("userBackground").style.background;
    let photo = document.getElementById("userPhoto").style.background;
    let description = document.getElementById("userDesc")
      ? document.getElementById("userDesc").innerHTML
      : "";
    document.getElementById("profileHeader").style.display = "none";
    document.getElementById("edit").style.display = "block";
    document.getElementsByClassName(
      "dropImages"
    )[0].style.background = background;
    document.getElementsByClassName("dropImages")[1].style.background = photo;
    document.getElementById("descArea").value = description.replace(
      /<\/?[^>]+>/g,
      ""
    );
  });
}
