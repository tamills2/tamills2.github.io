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
  let answers = [], allowed = new Set(), target = "", guesses = [], current = "", mode = "daily", finished = false;
  const rows = ["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"];
  const today = () => new Date().toLocaleDateString("en-CA");
  const hash = s => { let h=2166136261; for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)} return h>>>0; };
  const stats = () => { try{return JSON.parse(localStorage.getItem(STORAGE)||"{}")}catch{return {}} };
  const saveStats = s => localStorage.setItem(STORAGE,JSON.stringify(s));

  Promise.all([
    fetch("./data/answers.json",{cache:"no-store"}).then(r=>r.json()),
    fetch("./data/allowed-guesses.txt",{cache:"no-store"}).then(r=>r.text())
  ]).then(([a,w])=>{answers=a;allowed=new Set(w.split(/\s+/).filter(Boolean)); hardToggle.checked=localStorage.getItem(HARD)==="true"; buildKeyboard(); startDaily();}).catch(()=>message.textContent="Word dictionary could not be loaded.");

  function dailyTarget(){ return answers[hash(`repo-wordle:${today()}`)%answers.length]; }
  function practiceTarget(){ return answers[Math.floor(Math.random()*answers.length)]; }
  function startDaily(){ mode="daily";target=dailyTarget(); const saved=JSON.parse(localStorage.getItem(STATE)||"null"); if(saved?.date===today()){guesses=saved.guesses||[];finished=!!saved.finished;}else{guesses=[];finished=false;} current="";modeLabel.textContent=`Daily • ${today()}`; message.textContent="";render(); }
  function startPractice(){ mode="practice";target=practiceTarget();guesses=[];current="";finished=false;modeLabel.textContent="Practice • does not affect stats";message.textContent="";render(); }

  function buildKeyboard(){ keyboard.replaceChildren(); rows.forEach((letters,ri)=>{const row=document.createElement("div");row.className="wordle-key-row";if(ri===2)row.append(keyButton("Enter","ENTER",true));for(const ch of letters)row.append(keyButton(ch,ch));if(ri===2)row.append(keyButton("⌫","BACKSPACE",true));keyboard.append(row);}); }
  function keyButton(label,key,wide=false){const b=document.createElement("button");b.type="button";b.className=`wordle-key${wide?" wide":""}`;b.textContent=label;b.dataset.key=key;b.addEventListener("click",()=>handleKey(key));return b;}

  function render(){ board.replaceChildren(); for(let r=0;r<6;r++){const row=document.createElement("div");row.className="wordle-row";const word=guesses[r]??(r===guesses.length?current:"");const result=guesses[r]?scoreGuess(guesses[r]):null;for(let c=0;c<5;c++){const tile=document.createElement("div");tile.className="wordle-tile";tile.textContent=word[c]||"";if(word[c])tile.classList.add("filled");if(result)tile.classList.add(result[c]);row.append(tile);}board.append(row);} updateKeyboard(); if(finished && mode==="daily") message.textContent=guesses.at(-1)===target?`Solved in ${guesses.length}/6`:`Answer: ${target.toUpperCase()}`; }
  function scoreGuess(word){const out=Array(5).fill("absent"),remain={};for(let i=0;i<5;i++){if(word[i]===target[i])out[i]="correct";else remain[target[i]]=(remain[target[i]]||0)+1;}for(let i=0;i<5;i++){if(out[i]==="correct")continue;if(remain[word[i]]){out[i]="present";remain[word[i]]--;}}return out;}
  function updateKeyboard(){const rank={absent:1,present:2,correct:3};const states={};for(const g of guesses){scoreGuess(g).forEach((s,i)=>{const ch=g[i];if(!states[ch]||rank[s]>rank[states[ch]])states[ch]=s;});}keyboard.querySelectorAll("[data-key]").forEach(b=>{b.classList.remove("correct","present","absent");if(states[b.dataset.key.toLowerCase()])b.classList.add(states[b.dataset.key.toLowerCase()]);});}

  function hardValid(word){if(!hardToggle.checked||!guesses.length)return true;const requirements={};for(const g of guesses){const score=scoreGuess(g);for(let i=0;i<5;i++){if(score[i]==="correct"&&word[i]!==g[i])return false;if(score[i]==="present"||score[i]==="correct")requirements[g[i]]=Math.max(requirements[g[i]]||0,g.split(g[i]).length-1);}}for(const [ch,n] of Object.entries(requirements))if(word.split(ch).length-1<n)return false;return true;}
  function handleKey(key){if(finished)return;if(key==="BACKSPACE"){current=current.slice(0,-1);render();return;}if(key==="ENTER"){submit();return;}if(/^[A-Z]$/.test(key)&&current.length<5){current+=key.toLowerCase();render();}}
  function submit(){if(current.length!==5){message.textContent="Enter five letters.";return;}if(!allowed.has(current)){message.textContent="Not in the offline dictionary.";return;}if(!hardValid(current)){message.textContent="Hard mode requires revealed hints to be used.";return;}guesses.push(current);current="";message.textContent="";if(guesses.at(-1)===target||guesses.length===6){finished=true;finishGame();}if(mode==="daily")localStorage.setItem(STATE,JSON.stringify({date:today(),guesses,finished}));render();}
  function finishGame(){if(mode!=="daily")return;const s=stats();s.daily ||= {};if(s.daily[today()])return;const won=guesses.at(-1)===target;s.daily[today()]={won,guesses:guesses.length};const dates=Object.keys(s.daily).sort();s.played=dates.length;s.wins=dates.filter(d=>s.daily[d].won).length;s.distribution ||= {1:0,2:0,3:0,4:0,5:0,6:0};if(won)s.distribution[guesses.length]=(s.distribution[guesses.length]||0)+1;let streak=0,best=0,prev=null;for(const d of dates){if(!s.daily[d].won){streak=0;prev=d;continue;}const dt=new Date(`${d}T12:00:00`);if(prev){const p=new Date(`${prev}T12:00:00`);const delta=(dt-p)/86400000;streak=delta===1?streak+1:1;}else streak=1;best=Math.max(best,streak);prev=d;}s.currentStreak=streak;s.bestStreak=best;saveStats(s);}
  function showStats(){const s=stats();const dist=s.distribution||{};const max=Math.max(1,...Object.values(dist));document.querySelector("#wordle-stats-content").innerHTML=`<div class="wordle-stats-grid"><div class="wordle-stat"><strong>${s.played||0}</strong><span>Played</span></div><div class="wordle-stat"><strong>${s.played?Math.round((s.wins||0)/s.played*100):0}%</strong><span>Win</span></div><div class="wordle-stat"><strong>${s.currentStreak||0}</strong><span>Streak</span></div><div class="wordle-stat"><strong>${s.bestStreak||0}</strong><span>Best</span></div></div><div class="guess-dist">${[1,2,3,4,5,6].map(n=>`<div class="guess-row"><span>${n}</span><div class="guess-bar" style="width:${Math.max(8,((dist[n]||0)/max)*100)}%">${dist[n]||0}</div></div>`).join("")}</div>`;modal.hidden=false;}
  document.addEventListener("keydown",e=>{if(e.metaKey||e.ctrlKey||e.altKey)return;const k=e.key.toUpperCase();if(k==="ENTER")handleKey("ENTER");else if(k==="BACKSPACE")handleKey("BACKSPACE");else if(/^[A-Z]$/.test(k))handleKey(k);});
  document.querySelector("#daily-button").addEventListener("click",startDaily);document.querySelector("#practice-button").addEventListener("click",startPractice);document.querySelector("#stats-button").addEventListener("click",showStats);document.querySelector("#close-stats").addEventListener("click",()=>modal.hidden=true);hardToggle.addEventListener("change",()=>localStorage.setItem(HARD,String(hardToggle.checked)));
})();
