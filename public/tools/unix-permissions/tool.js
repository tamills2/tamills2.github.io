(() => {
  const permissionInputs = [...document.querySelectorAll("[data-class][data-permission]")];
  const setuidInput = document.querySelector("#setuid");
  const setgidInput = document.querySelector("#setgid");
  const stickyInput = document.querySelector("#sticky");
  const symbolicInput = document.querySelector("#symbolic-input");
  const octalInput = document.querySelector("#octal-input");
  const commandInput = document.querySelector("#command-input");
  const resetButton = document.querySelector("#reset-permissions");

  const classes = ["owner", "group", "other"];
  const permissionValues = { read: 4, write: 2, execute: 1 };
  let commandPath = "path";
  let updating = false;

  function getPermissionInput(group, permission) {
    return permissionInputs.find(
      (input) => input.dataset.class === group && input.dataset.permission === permission
    );
  }

  function specialDigit() {
    return (setuidInput.checked ? 4 : 0) + (setgidInput.checked ? 2 : 0) + (stickyInput.checked ? 1 : 0);
  }

  function permissionDigit(group) {
    return ["read", "write", "execute"].reduce((total, permission) => {
      return total + (getPermissionInput(group, permission).checked ? permissionValues[permission] : 0);
    }, 0);
  }

  function buildOctal() {
    const standard = classes.map(permissionDigit).join("");
    const special = specialDigit();
    return special ? `${special}${standard}` : standard;
  }

  function buildSymbolic() {
    const output = [];

    classes.forEach((group) => {
      const read = getPermissionInput(group, "read").checked ? "r" : "-";
      const write = getPermissionInput(group, "write").checked ? "w" : "-";
      const executeEnabled = getPermissionInput(group, "execute").checked;
      let execute = executeEnabled ? "x" : "-";

      if (group === "owner" && setuidInput.checked) execute = executeEnabled ? "s" : "S";
      if (group === "group" && setgidInput.checked) execute = executeEnabled ? "s" : "S";
      if (group === "other" && stickyInput.checked) execute = executeEnabled ? "t" : "T";

      output.push(read, write, execute);
    });

    return output.join("");
  }

  function syncOutputs() {
    if (updating) return;
    updating = true;
    const octal = buildOctal();
    symbolicInput.value = buildSymbolic();
    octalInput.value = octal;
    commandInput.value = `chmod ${octal} ${commandPath}`;
    updating = false;
  }

  function applyOctal(rawValue) {
    const digits = rawValue.replace(/[^0-7]/g, "").slice(0, 4);
    if (digits.length !== 3 && digits.length !== 4) return false;

    const special = digits.length === 4 ? Number(digits[0]) : 0;
    const standard = digits.slice(-3).split("").map(Number);

    setuidInput.checked = Boolean(special & 4);
    setgidInput.checked = Boolean(special & 2);
    stickyInput.checked = Boolean(special & 1);

    classes.forEach((group, index) => {
      const value = standard[index];
      getPermissionInput(group, "read").checked = Boolean(value & 4);
      getPermissionInput(group, "write").checked = Boolean(value & 2);
      getPermissionInput(group, "execute").checked = Boolean(value & 1);
    });

    return true;
  }

  function applySymbolic(rawValue) {
    const value = rawValue.trim().replace(/^[bcdlps-]/, "");
    if (!/^[r-][w-][xXsS-][r-][w-][xXsS-][r-][w-][xXtT-]$/.test(value)) return false;

    setuidInput.checked = /[sS]/.test(value[2]);
    setgidInput.checked = /[sS]/.test(value[5]);
    stickyInput.checked = /[tT]/.test(value[8]);

    classes.forEach((group, index) => {
      const offset = index * 3;
      getPermissionInput(group, "read").checked = value[offset] === "r";
      getPermissionInput(group, "write").checked = value[offset + 1] === "w";
      getPermissionInput(group, "execute").checked = /[xst]/i.test(value[offset + 2]);
    });

    return true;
  }

  function parseCommand() {
    const match = commandInput.value.trim().match(/^chmod\s+([0-7]{3,4})\s+(.+)$/i);
    if (!match) return false;
    commandPath = match[2].trim() || "path";
    return applyOctal(match[1]);
  }

  permissionInputs.forEach((input) => input.addEventListener("change", syncOutputs));
  [setuidInput, setgidInput, stickyInput].forEach((input) => input.addEventListener("change", syncOutputs));

  octalInput.addEventListener("input", () => {
    if (updating) return;
    const clean = octalInput.value.replace(/[^0-7]/g, "").slice(0, 4);
    octalInput.value = clean;
    if (applyOctal(clean)) syncOutputs();
  });

  symbolicInput.addEventListener("input", () => {
    if (updating) return;
    if (applySymbolic(symbolicInput.value)) syncOutputs();
  });

  commandInput.addEventListener("input", () => {
    if (updating) return;
    if (parseCommand()) syncOutputs();
  });

  [symbolicInput, octalInput, commandInput].forEach((input) => {
    input.addEventListener("blur", syncOutputs);
  });

  resetButton.addEventListener("click", () => {
    commandPath = "path";
    applyOctal("755");
    syncOutputs();
  });

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.getElementById(button.dataset.copyTarget);
      try {
        await navigator.clipboard.writeText(target.value);
        button.classList.add("copied");
        button.setAttribute("aria-label", "Copied");
        window.setTimeout(() => {
          button.classList.remove("copied");
          button.setAttribute("aria-label", button.title === "Copy" ? `Copy ${target.labels?.[0]?.textContent || "value"}` : "Copy");
        }, 1200);
      } catch {
        target.select();
        document.execCommand("copy");
        target.setSelectionRange(target.value.length, target.value.length);
      }
    });
  });

  syncOutputs();
})();
