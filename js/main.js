var timer = document.querySelector("[js-timer]");
var moveCounter = document.querySelector("[js-moves]");
var timeStart, timerTimeout;
var moveCount = 0;

document.querySelector("[js-start]").addEventListener("click", startGame, false);
document.querySelector("[js-input]").addEventListener("change", changeGameSize, false);

if(!DEBUG) {
    var menu = document.querySelector("[js-menu]");

    window.addEventListener("load", showMenu, false);
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


function startTimer() {
    isTimerStarted = true;
    timeStart = Date.now();
    updateTimer();
}


function stopTimer() {
    isTimerStarted = false;
    let timeEnd = Date.now();

    clearTimeout(timerTimeout);
}


function updateTimer() {
    let timeNow = Date.now();
    timer.innerText = ((timeNow- timeStart) / 1000).toFixed(2);
    timerTimeout = setTimeout(updateTimer, 100);
}


function updateMoveCounter() {
    moveCounter.innerText = moveCount;
}
