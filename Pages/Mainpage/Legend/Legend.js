let Legend_btn = document.querySelector(".legend_button")
let Legend_window = document.querySelector("#legend_wrapper")

Legend_btn.addEventListener("click", function() {
    if (Legend_window.classList.contains("hidden_legend")) {
        Legend_window.classList.remove("hidden_legend")
    }

    if (Legend_window.classList.contains("open_legend")) {
        Legend_window.classList.remove("open_legend");
        Legend_window.classList.add("close_legend");
    }
    else {
        Legend_window.classList.remove("close_legend");
        Legend_window.classList.add("open_legend");
    }
});
