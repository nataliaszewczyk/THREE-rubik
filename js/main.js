if(!DEBUG) {
    var menu = document.querySelector("[js-menu]");

    window.addEventListener("load", showMenu, false);
    document.querySelector("[js-start]").addEventListener("click", startGame, false);
    document.querySelector("[js-input]").addEventListener("change", changeGameSize, false);
    menu.addEventListener("transitionend", transitionEndHandler, false);
}


function showMenu(e) {
    if(!isGameStarted) {
        menu.classList.add("visible", "transition");
    }
}


function startGame(e) {
    menu.classList.remove("visible");
    menu.classList.add("transition");
    init();
    isGameStarted = true;
}


function changeGameSize(e) {
    gameSize = e.target.value;
}


function transitionEndHandler(e) {
    e.target.classList.remove("transition");
}
