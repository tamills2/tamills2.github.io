"use strict";
(() => {
  const today = new Date().toLocaleDateString("en-CA");
  const wordle = JSON.parse(localStorage.getItem("repo-wordle-stats") || "{}");
  const wordleToday = wordle.daily?.[today];
  const wordleStatus = document.querySelector("#wordle-status");
  if (wordleStatus && wordleToday) wordleStatus.textContent = wordleToday.won ? `Today: ${wordleToday.guesses}/6` : "Today completed";

  const sudoku = JSON.parse(localStorage.getItem("repo-sudoku-stats") || "{}");
  const done = ["easy","medium","hard"].filter(d => sudoku.daily?.[`${today}:${d}`]?.completed).length;
  const sudokuStatus = document.querySelector("#sudoku-status");
  if (sudokuStatus) sudokuStatus.textContent = done ? `Daily: ${done}/3 complete` : "Daily puzzles ready";
})();
