"use strict";

const input = document.querySelector("#example-input");
const output = document.querySelector("#tool-output");

document.querySelector("#run-tool").addEventListener("click", () => {
  output.textContent = input.value.trim()
    ? `You entered: ${input.value}`
    : "Enter a value first.";
});

document.querySelector("#clear-tool").addEventListener("click", () => {
  input.value = "";
  output.textContent = "Your result will appear here.";
  input.focus();
});
