"use strict";
(() => {
  const STORAGE = "repo-wordle-stats";
  const STATE = "repo-wordle-daily-state";
  const HARD = "repo-wordle-hard-mode";
  const board = document.querySelector("#wordle-board");
  const keyboard = document.querySelector("#wordle-keyboard");
  const message = document.querySelector("#wordle-message");
  const modeLabel = document.querySelector("#wordle-mode");
  const hardToggle = document.querySelector("#hard-mode");
  const modal = document.querySelector("#wordle-stats-modal");
  let answers = [], allowed = new Set(), target = "", guesses = [], current = "", mode = "daily", finished = false, animating = false;
  const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  const today = () => new Date().toLocaleDateString("en-CA");
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const stats = () => { try { return JSON.parse(localStorage.getItem(STORAGE) || "{}"); } catch { return {}; } };
  const saveStats = s => localStorage.setItem(STORAGE, JSON.stringify(s));
  const parseWords = text => [...new Set(text.toLowerCase().split(/\s+/).map(w => w.trim()).filter(w => /^[a-z]{5}$/.test(w)))];

  Promise.all([
    fetch("./data/la-words.txt", { cache: "no-store" }).then(r => { if (!r.ok) throw new Error("LA word list missing"); return r.text(); }),
    fetch("./data/ta-words.txt", { cache: "no-store" }).then(r => { if (!r.ok) throw new Error("TA word list missing"); return r.text(); })
  ]).then(([laText, taText]) => {
    answers = parseWords(laText);
    const ta = parseWords(taText);
    allowed = new Set([...answers, ...ta]);
    if (!answers.length) throw new Error("LA word list is empty");
    hardToggle.checked = localStorage.getItem(HARD) === "true";
    buildKeyboard();
    startDaily();
  }).catch(error => {
    console.error(error);
    message.textContent = "Word dictionaries could not be loaded.";
  });

  function dailyTarget() { return answers[hash(`repo-wordle:${today()}`) % answers.length]; }
  function practiceTarget() { return answers[Math.floor(Math.random() * answers.length)]; }
  function startDaily() {
    if (animating) return;
    keyboard.querySelectorAll("button").forEach(button => button.disabled = false);
    mode = "daily";

    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STATE) || "null"); } catch {}

    if (saved?.date === today()) {
      guesses = Array.isArray(saved.guesses) ? saved.guesses : [];
      finished = !!saved.finished;

      // Daily answers must not move when la-words.txt is edited. New state
      // records persist the chosen target for the rest of the day. Older
      // completed-win state can be migrated safely from its winning guess.
      if (typeof saved.target === "string" && /^[a-z]{5}$/.test(saved.target)) {
        target = saved.target;
      } else {
        const s = stats();
        const legacyWin = finished && s.daily?.[today()]?.won && guesses.length;
        target = legacyWin ? guesses.at(-1) : dailyTarget();
        localStorage.setItem(STATE, JSON.stringify({ date: today(), target, guesses, finished }));
      }
    } else {
      target = dailyTarget();
      guesses = [];
      finished = false;
      // Lock today's answer immediately, before the first guess, so changing
      // the answer dictionary later cannot alter an in-progress Daily.
      localStorage.setItem(STATE, JSON.stringify({ date: today(), target, guesses, finished }));
    }

    current = ""; modeLabel.textContent = `Daily • ${today()}`; message.textContent = ""; render();
    if (finished) keyboard.querySelectorAll("button").forEach(button => button.disabled = true);
  }
  function startPractice() {
    if (animating) return;
    keyboard.querySelectorAll("button").forEach(button => button.disabled = false);
    mode = "practice"; target = practiceTarget(); guesses = []; current = ""; finished = false;
    modeLabel.textContent = "Practice • does not affect stats"; message.textContent = ""; render();
  }

  function buildKeyboard() {
    keyboard.replaceChildren();
    rows.forEach((letters, ri) => {
      const row = document.createElement("div"); row.className = "wordle-key-row";
      if (ri === 2) row.append(keyButton("Enter", "ENTER", true));
      for (const ch of letters) row.append(keyButton(ch, ch));
      if (ri === 2) row.append(keyButton("⌫", "BACKSPACE", true));
      keyboard.append(row);
    });
  }
  function keyButton(label, key, wide = false) {
    const b = document.createElement("button"); b.type = "button"; b.className = `wordle-key${wide ? " wide" : ""}`;
    b.textContent = label; b.dataset.key = key; b.addEventListener("click", () => handleKey(key)); return b;
  }

  function render({ deferRow = -1 } = {}) {
    board.replaceChildren();
    for (let r = 0; r < 6; r++) {
      const row = document.createElement("div"); row.className = "wordle-row"; row.dataset.row = r;
      const word = guesses[r] ?? (r === guesses.length ? current : "");
      const result = guesses[r] && r !== deferRow ? scoreGuess(guesses[r]) : null;
      for (let c = 0; c < 5; c++) {
        const tile = document.createElement("div"); tile.className = "wordle-tile"; tile.textContent = word[c] || "";
        if (word[c]) tile.classList.add("filled"); if (result) tile.classList.add(result[c]); row.append(tile);
      }
      board.append(row);
    }
    updateKeyboard();
    if (finished && mode === "daily") message.textContent = guesses.at(-1) === target ? `Solved in ${guesses.length}/6` : `Answer: ${target.toUpperCase()}`;
  }
  function scoreGuess(word) {
    const out = Array(5).fill("absent"), remain = {};
    for (let i = 0; i < 5; i++) { if (word[i] === target[i]) out[i] = "correct"; else remain[target[i]] = (remain[target[i]] || 0) + 1; }
    for (let i = 0; i < 5; i++) { if (out[i] === "correct") continue; if (remain[word[i]]) { out[i] = "present"; remain[word[i]]--; } }
    return out;
  }
  function updateKeyboard() {
    const rank = { absent: 1, present: 2, correct: 3 }, states = {};
    for (const g of guesses) scoreGuess(g).forEach((s, i) => { const ch = g[i]; if (!states[ch] || rank[s] > rank[states[ch]]) states[ch] = s; });
    keyboard.querySelectorAll("[data-key]").forEach(b => { b.classList.remove("correct", "present", "absent"); const state = states[b.dataset.key.toLowerCase()]; if (state) b.classList.add(state); });
  }

  function hardValid(word) {
    if (!hardToggle.checked || !guesses.length) return true;
    const requirements = {};
    for (const g of guesses) {
      const score = scoreGuess(g);
      for (let i = 0; i < 5; i++) {
        if (score[i] === "correct" && word[i] !== g[i]) return false;
        if (score[i] === "present" || score[i] === "correct") requirements[g[i]] = Math.max(requirements[g[i]] || 0, g.split(g[i]).length - 1);
      }
    }
    for (const [ch, n] of Object.entries(requirements)) if (word.split(ch).length - 1 < n) return false;
    return true;
  }

  function handleKey(key) {
    if (finished || animating) return;
    if (key === "BACKSPACE") { current = current.slice(0, -1); render(); return; }
    if (key === "ENTER") { submit(); return; }
    if (/^[A-Z]$/.test(key) && current.length < 5) {
      current += key.toLowerCase(); render();
      const tiles = board.querySelectorAll(`.wordle-row[data-row="${guesses.length}"] .wordle-tile`);
      const tile = tiles[current.length - 1]; if (tile) { tile.classList.add("pop"); tile.addEventListener("animationend", () => tile.classList.remove("pop"), { once: true }); }
    }
  }

  function shakeCurrentRow(text) {
    message.textContent = text;
    const row = board.querySelector(`.wordle-row[data-row="${guesses.length}"]`);
    if (!row) return;
    row.classList.remove("shake"); void row.offsetWidth; row.classList.add("shake");
    row.addEventListener("animationend", () => row.classList.remove("shake"), { once: true });
  }

  async function submit() {
    if (animating) return;
    if (current.length !== 5) { shakeCurrentRow("Enter five letters."); return; }
    if (!allowed.has(current)) { shakeCurrentRow("Not in the offline dictionary."); return; }
    if (!hardValid(current)) { shakeCurrentRow("Hard mode requires revealed hints to be used."); return; }

    const guess = current, rowIndex = guesses.length, result = scoreGuess(guess);
    guesses.push(guess); current = ""; message.textContent = ""; animating = true;
    render({ deferRow: rowIndex });
    const tiles = [...board.querySelectorAll(`.wordle-row[data-row="${rowIndex}"] .wordle-tile`)];
    const colors = { correct: "#538d4e", present: "#b59f3b", absent: "#3a3a3c" };

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i], state = result[i];
      tile.style.setProperty("--reveal-bg", colors[state]);
      tile.style.setProperty("--reveal-border", colors[state]);
      tile.style.setProperty("--flip-delay", `${i * 115}ms`);
      tile.classList.add("reveal");
      setTimeout(() => tile.classList.add(state), i * 115 + 260);
    }
    await sleep(5 * 115 + 520);
    updateKeyboard();

    const won = guess === target;
    if (won || guesses.length === 6) {
      finished = true;
      if (won) {
        tiles.forEach((tile, i) => { tile.style.setProperty("--dance-delay", `${i * 85}ms`); tile.classList.add("dance"); });
        message.textContent = `Solved in ${guesses.length}/6`;
      } else message.textContent = `Answer: ${target.toUpperCase()}`;
      finishGame();
    }
    if (mode === "daily") localStorage.setItem(STATE, JSON.stringify({ date: today(), target, guesses, finished }));

    // Keep the completed board visible but read-only. For a Daily win, let the
    // tile celebration finish before bringing the stats modal forward.
    if (finished) {
      keyboard.querySelectorAll("button").forEach(button => button.disabled = true);
      if (mode === "daily" && won) {
        await sleep(700);
        showStats();
      }
    }
    animating = false;
  }

  function finishGame() {
    if (mode !== "daily") return;
    const s = stats(); s.daily ||= {}; if (s.daily[today()]) return;
    const won = guesses.at(-1) === target; s.daily[today()] = { won, guesses: guesses.length };
    const dates = Object.keys(s.daily).sort(); s.played = dates.length; s.wins = dates.filter(d => s.daily[d].won).length;
    s.distribution ||= { 1:0,2:0,3:0,4:0,5:0,6:0 }; if (won) s.distribution[guesses.length] = (s.distribution[guesses.length] || 0) + 1;
    let streak = 0, best = 0, prev = null;
    for (const d of dates) {
      if (!s.daily[d].won) { streak = 0; prev = d; continue; }
      const dt = new Date(`${d}T12:00:00`);
      if (prev) { const p = new Date(`${prev}T12:00:00`); const delta = (dt - p) / 86400000; streak = delta === 1 ? streak + 1 : 1; } else streak = 1;
      best = Math.max(best, streak); prev = d;
    }
    s.currentStreak = streak; s.bestStreak = best; saveStats(s);
  }

  function showStats() {
    const s = stats(), dist = s.distribution || {}, max = Math.max(1, ...Object.values(dist));
    document.querySelector("#wordle-stats-content").innerHTML = `<div class="wordle-stats-grid"><div class="wordle-stat"><strong>${s.played||0}</strong><span>Played</span></div><div class="wordle-stat"><strong>${s.played?Math.round((s.wins||0)/s.played*100):0}%</strong><span>Win</span></div><div class="wordle-stat"><strong>${s.currentStreak||0}</strong><span>Streak</span></div><div class="wordle-stat"><strong>${s.bestStreak||0}</strong><span>Best</span></div></div><div class="guess-dist">${[1,2,3,4,5,6].map(n=>`<div class="guess-row"><span>${n}</span><div class="guess-bar" style="width:${Math.max(8,((dist[n]||0)/max)*100)}%">${dist[n]||0}</div></div>`).join("")}</div>`;
    modal.hidden = false;
  }

  document.addEventListener("keydown", e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (!modal.hidden) return;

    const k = e.key.toUpperCase();
    let gameKey = null;
    if (k === "ENTER") gameKey = "ENTER";
    else if (k === "BACKSPACE") gameKey = "BACKSPACE";
    else if (/^[A-Z]$/.test(k)) gameKey = k;
    if (!gameKey) return;

    // Prevent Enter/Backspace/letter keys from also triggering the browser's
    // default action on whichever toolbar or keyboard button still has focus.
    // Without this, Enter can submit a guess and then click Daily/Practice,
    // which makes an invalid guess appear to reset or disappear at random.
    e.preventDefault();
    handleKey(gameKey);
  });
  document.querySelector("#daily-button").addEventListener("click", startDaily);
  document.querySelector("#practice-button").addEventListener("click", startPractice);
  document.querySelector("#stats-button").addEventListener("click", showStats);
  document.querySelector("#close-stats").addEventListener("click", () => modal.hidden = true);
  hardToggle.addEventListener("change", () => localStorage.setItem(HARD, String(hardToggle.checked)));
})();
