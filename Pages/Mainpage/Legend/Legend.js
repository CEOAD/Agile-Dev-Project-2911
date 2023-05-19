let Legend_btn = document.querySelector(".legend_button")
let Legend_window = document.querySelector(".legend_wrapper")

Legend_btn.addEventListener("click", function() {
    if (Legend_window.classList.contains("legend_hidden")) {
        Legend_window.classList.remove("legend_hidden");
    }
    else {
        Legend_window.classList.add("legend_hidden");
    }
});
