"use strict";

(() => {
  const ESC = "\x1b";
  const codes = [
    ["Reset all", "Text style", "[0m", "Reset colors and text attributes"],
    ["Bold", "Text style", "[1m", "Enable bold or increased intensity"],
    ["Dim", "Text style", "[2m", "Enable faint or decreased intensity"],
    ["Italic", "Text style", "[3m", "Enable italic text where supported"],
    ["Underline", "Text style", "[4m", "Enable underline"],
    ["Slow blink", "Text style", "[5m", "Enable slow blink where supported"],
    ["Inverse", "Text style", "[7m", "Swap foreground and background"],
    ["Hidden", "Text style", "[8m", "Conceal text"],
    ["Strikethrough", "Text style", "[9m", "Enable strikethrough where supported"],
    ["Normal intensity", "Text style", "[22m", "Disable bold and dim"],
    ["Not italic", "Text style", "[23m", "Disable italic"],
    ["Not underlined", "Text style", "[24m", "Disable underline"],
    ["Cursor up N", "Cursor movement", "[{n}A", "Move cursor up N rows"],
    ["Cursor down N", "Cursor movement", "[{n}B", "Move cursor down N rows"],
    ["Cursor forward N", "Cursor movement", "[{n}C", "Move cursor right N columns"],
    ["Cursor back N", "Cursor movement", "[{n}D", "Move cursor left N columns"],
    ["Next line N", "Cursor movement", "[{n}E", "Move to beginning of line N rows down"],
    ["Previous line N", "Cursor movement", "[{n}F", "Move to beginning of line N rows up"],
    ["Horizontal position", "Cursor movement", "[{n}G", "Move cursor to column N"],
    ["Cursor position", "Cursor movement", "[{row};{col}H", "Move cursor to row and column"],
    ["Save cursor", "Cursor movement", "[s", "Save current cursor position"],
    ["Restore cursor", "Cursor movement", "[u", "Restore saved cursor position"],
    ["Hide cursor", "Cursor movement", "[?25l", "Hide the cursor"],
    ["Show cursor", "Cursor movement", "[?25h", "Show the cursor"],
    ["Clear to end of screen", "Erase", "[0J", "Erase from cursor to end of screen"],
    ["Clear to start of screen", "Erase", "[1J", "Erase from cursor to start of screen"],
    ["Clear screen", "Erase", "[2J", "Erase the entire visible screen"],
    ["Clear screen and scrollback", "Erase", "[3J", "Erase screen and saved scrollback where supported"],
    ["Clear to end of line", "Erase", "[0K", "Erase from cursor to end of line"],
    ["Clear to start of line", "Erase", "[1K", "Erase from cursor to start of line"],
    ["Clear line", "Erase", "[2K", "Erase the entire current line"],
    ["Scroll up N", "Scrolling", "[{n}S", "Scroll display up N lines"],
    ["Scroll down N", "Scrolling", "[{n}T", "Scroll display down N lines"],
    ["Set scroll region", "Scrolling", "[{top};{bottom}r", "Set top and bottom margins for scrolling"],
    ["Set terminal title", "Terminal", "]0;{title}\x07", "Set terminal window title using OSC"],
    ["Foreground black", "16 colors", "[30m", "Standard black foreground"],
    ["Foreground red", "16 colors", "[31m", "Standard red foreground"],
    ["Foreground green", "16 colors", "[32m", "Standard green foreground"],
    ["Foreground yellow", "16 colors", "[33m", "Standard yellow foreground"],
    ["Foreground blue", "16 colors", "[34m", "Standard blue foreground"],
    ["Foreground magenta", "16 colors", "[35m", "Standard magenta foreground"],
    ["Foreground cyan", "16 colors", "[36m", "Standard cyan foreground"],
    ["Foreground white", "16 colors", "[37m", "Standard white foreground"],
    ["Default foreground", "16 colors", "[39m", "Restore terminal default foreground"],
    ["Background black", "16 colors", "[40m", "Standard black background"],
    ["Background red", "16 colors", "[41m", "Standard red background"],
    ["Background green", "16 colors", "[42m", "Standard green background"],
    ["Background yellow", "16 colors", "[43m", "Standard yellow background"],
    ["Background blue", "16 colors", "[44m", "Standard blue background"],
    ["Background magenta", "16 colors", "[45m", "Standard magenta background"],
    ["Background cyan", "16 colors", "[46m", "Standard cyan background"],
    ["Background white", "16 colors", "[47m", "Standard white background"],
    ["Default background", "16 colors", "[49m", "Restore terminal default background"],
    ["256-color foreground", "Extended color", "[38;5;{n}m", "Set foreground to ANSI 256 palette index N"],
    ["256-color background", "Extended color", "[48;5;{n}m", "Set background to ANSI 256 palette index N"],
    ["Truecolor foreground", "Extended color", "[38;2;{r};{g};{b}m", "Set 24-bit RGB foreground"],
    ["Truecolor background", "Extended color", "[48;2;{r};{g};{b}m", "Set 24-bit RGB background"]
  ].map((row, id) => ({ id, name: row[0], category: row[1], body: row[2], description: row[3] }));

  const state = { h: 210, s: 69, v: 100, sequence: [] };
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const copyIcon = '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"></rect><rect x="4" y="4" width="11" height="11" rx="2"></rect></svg>';

  function escapeText(body, format = $("#display-format")?.value || "hex") {
    const prefix = { hex: "\\x1b", octal: "\\033", shell: "\\e", esc: "ESC", literal: "\u001b" }[format];
    return prefix + body.replace("\\x07", format === "esc" ? "BEL" : "\\x07");
  }

  async function copyText(text, button) {
    try { await navigator.clipboard.writeText(text); }
    catch { const area = document.createElement("textarea"); area.value = text; area.style.position = "fixed"; area.style.opacity = "0"; document.body.append(area); area.select(); document.execCommand("copy"); area.remove(); }
    const old = button.innerHTML; button.textContent = "✓"; setTimeout(() => { button.innerHTML = old; }, 1200);
  }

  function initTabs() {
    $$(".ansi-tab").forEach(button => button.addEventListener("click", () => {
      $$(".ansi-tab").forEach(item => item.classList.toggle("active", item === button));
      $$(".ansi-panel").forEach(panel => { const active = panel.dataset.panelName === button.dataset.panel; panel.hidden = !active; panel.classList.toggle("active", active); });
      if (button.dataset.panel === "color") drawWheel();
    }));
  }

  function renderReference() {
    const body = $("#reference-body"); const query = $("#reference-search").value.trim().toLowerCase(); const category = $("#reference-category").value;
    const filtered = codes.filter(code => (category === "all" || code.category === category) && (!query || `${code.name} ${code.category} ${code.body} ${code.description}`.toLowerCase().includes(query)));
    body.replaceChildren(...filtered.map(code => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td><strong>${code.name}</strong></td><td>${code.category}</td><td><code class="ansi-sequence"></code></td><td>${code.description}</td><td><div class="row-actions"><button class="icon-action copy-row" type="button" title="Copy sequence" aria-label="Copy ${code.name}">${copyIcon}</button><button class="icon-action add-row" type="button" title="Add to sequence" aria-label="Add ${code.name}">+</button></div></td>`;
      tr.querySelector("code").textContent = escapeText(code.body);
      tr.querySelector(".copy-row").addEventListener("click", e => copyText(escapeText(code.body), e.currentTarget));
      tr.querySelector(".add-row").addEventListener("click", () => addSequence(code.name, code.body));
      return tr;
    }));
    $("#reference-status").textContent = `${filtered.length} of ${codes.length} codes shown`;
  }

  function initReference() {
    const categories = [...new Set(codes.map(code => code.category))];
    $("#reference-category").append(...categories.map(category => { const option = document.createElement("option"); option.value = category; option.textContent = category; return option; }));
    ["#reference-search", "#reference-category", "#display-format"].forEach(selector => $(selector).addEventListener(selector === "#reference-search" ? "input" : "change", renderReference));
    renderReference();
  }

  function hsvToRgb(h, s, v) { s /= 100; v /= 100; const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c; let r=0,g=0,b=0; if(h<60)[r,g,b]=[c,x,0];else if(h<120)[r,g,b]=[x,c,0];else if(h<180)[r,g,b]=[0,c,x];else if(h<240)[r,g,b]=[0,x,c];else if(h<300)[r,g,b]=[x,0,c];else[r,g,b]=[c,0,x]; return [r,g,b].map(n=>Math.round((n+m)*255)); }
  function rgbToHsv(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0;if(d){if(max===r)h=60*(((g-b)/d)%6);else if(max===g)h=60*((b-r)/d+2);else h=60*((r-g)/d+4)}if(h<0)h+=360;return[h,max?d/max*100:0,max*100]}
  const toHex = rgb => `#${rgb.map(n=>n.toString(16).padStart(2,"0")).join("").toUpperCase()}`;
  function parseHex(value){const match=/^#?([0-9a-f]{6})$/i.exec(value.trim());if(!match)return null;return[0,2,4].map(i=>parseInt(match[1].slice(i,i+2),16))}

  function drawWheel(){const canvas=$("#color-wheel");if(!canvas)return;const ctx=canvas.getContext("2d"),size=canvas.width,c=size/2,img=ctx.createImageData(size,size);for(let y=0;y<size;y++){for(let x=0;x<size;x++){const dx=x-c,dy=y-c,dist=Math.sqrt(dx*dx+dy*dy),i=(y*size+x)*4;if(dist<=c){const h=(Math.atan2(dy,dx)*180/Math.PI+360)%360,s=Math.min(100,dist/c*100),rgb=hsvToRgb(h,s,state.v);img.data[i]=rgb[0];img.data[i+1]=rgb[1];img.data[i+2]=rgb[2];img.data[i+3]=255}else img.data[i+3]=0}}ctx.putImageData(img,0,0);positionMarker()}
  function positionMarker(){const shell=$(".wheel-shell"),marker=$("#wheel-marker");if(!shell||!marker)return;const r=shell.clientWidth/2*(state.s/100),angle=state.h*Math.PI/180;marker.style.left=`${shell.clientWidth/2+Math.cos(angle)*r}px`;marker.style.top=`${shell.clientWidth/2+Math.sin(angle)*r}px`}
  function setFromWheel(event){const canvas=$("#color-wheel"),rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left-rect.width/2,y=event.clientY-rect.top-rect.height/2,r=Math.sqrt(x*x+y*y),max=rect.width/2;if(r>max)return;state.h=(Math.atan2(y,x)*180/Math.PI+360)%360;state.s=Math.min(100,r/max*100);syncColor();}
  function colorData(){const rgb=hsvToRgb(state.h,state.s,state.v);return{rgb,hex:toHex(rgb)}}
  function nearest256(rgb){const palette=[];const basic=[[0,0,0],[128,0,0],[0,128,0],[128,128,0],[0,0,128],[128,0,128],[0,128,128],[192,192,192],[128,128,128],[255,0,0],[0,255,0],[255,255,0],[0,0,255],[255,0,255],[0,255,255],[255,255,255]];basic.forEach((v,i)=>palette.push([i,v]));const levels=[0,95,135,175,215,255];for(let r=0;r<6;r++)for(let g=0;g<6;g++)for(let b=0;b<6;b++)palette.push([16+36*r+6*g+b,[levels[r],levels[g],levels[b]]]);for(let i=0;i<24;i++){const v=8+i*10;palette.push([232+i,[v,v,v]])}return palette.reduce((best,p)=>{const d=p[1].reduce((sum,v,i)=>sum+(v-rgb[i])**2,0);return d<best.d?{index:p[0],rgb:p[1],d}:best},{d:Infinity})}
  function nearest16(rgb){const names=["black","red","green","yellow","blue","magenta","cyan","white","bright black","bright red","bright green","bright yellow","bright blue","bright magenta","bright cyan","bright white"];const vals=[[0,0,0],[128,0,0],[0,128,0],[128,128,0],[0,0,128],[128,0,128],[0,128,128],[192,192,192],[128,128,128],[255,0,0],[0,255,0],[255,255,0],[0,0,255],[255,0,255],[0,255,255],[255,255,255]];let best={d:Infinity};vals.forEach((v,i)=>{const d=v.reduce((sum,n,j)=>sum+(n-rgb[j])**2,0);if(d<best.d)best={index:i,name:names[i],rgb:v,d}});return best}
  function makeSgr(rgb, apply, mode){if(mode==="truecolor")return apply==="foreground"?`38;2;${rgb.join(";")}`:`48;2;${rgb.join(";")}`;if(mode==="ansi256"){const n=nearest256(rgb).index;return apply==="foreground"?`38;5;${n}`:`48;5;${n}`}const n=nearest16(rgb).index;if(apply==="foreground")return String(n<8?30+n:90+n-8);return String(n<8?40+n:100+n-8)}
  function currentColorBody(){const primary=colorData().rgb,apply=$("input[name=apply-to]:checked").value,mode=$("input[name=color-mode]:checked").value,styles=$$(".style-option:checked").map(i=>i.value);const parts=[...styles];if(apply==="foreground"||apply==="both")parts.push(makeSgr(primary,"foreground",mode));if(apply==="background"||apply==="both"){const bg=parseHex($("#background-hex").value)||[16,24,32];parts.push(makeSgr(apply==="background"?primary:bg,"background",mode))}return`[${parts.join(";")}m`}
  function outputItem(label,value){const div=document.createElement("div");div.className="output-item";div.innerHTML=`<strong>${label}</strong><code></code><button class="icon-action" type="button" aria-label="Copy ${label}">${copyIcon}</button>`;div.querySelector("code").textContent=value;div.querySelector("button").addEventListener("click",e=>copyText(value,e.currentTarget));return div}
  function updateColorOutputs(){const {rgb,hex}=colorData(),n256=nearest256(rgb),n16=nearest16(rgb),body=currentColorBody(),seq=escapeText(body,"hex"),grid=$("#color-output-grid");$("#color-swatch").style.background=hex;$("#swatch-label").textContent=hex;$("#hex-input").value=hex;[$("#red-input").value,$("#green-input").value,$("#blue-input").value]=rgb;const preview=$("#terminal-preview"),apply=$("input[name=apply-to]:checked").value,styles=$$(".style-option:checked").map(i=>i.value);preview.style.color=apply==="background"?"#e8edf5":hex;preview.style.background=apply==="foreground"?"#11151c":apply==="background"?hex:($("#background-hex").value||"#101820");preview.style.fontWeight=styles.includes("1")?"800":"400";preview.style.fontStyle=styles.includes("3")?"italic":"normal";preview.style.textDecoration=[styles.includes("4")?"underline":"",styles.includes("9")?"line-through":""].filter(Boolean).join(" ")||"none";grid.replaceChildren(outputItem("Hex",hex),outputItem("RGB",`rgb(${rgb.join(", ")})`),outputItem("Selected ANSI sequence",seq),outputItem("ANSI 256 approximation",`${escapeText(`[38;5;${n256.index}m`,"hex")} — index ${n256.index}`),outputItem("Standard 16-color approximation",`${n16.name} — ${escapeText(`[${n16.index<8?30+n16.index:90+n16.index-8}m`,"hex")}`),outputItem("Reset",escapeText("[0m","hex")))}
  function syncColor(){const data=colorData();$("#brightness-value").textContent=`${Math.round(state.v)}%`;positionMarker();updateColorOutputs()}
  function initColor(){drawWheel();const canvas=$("#color-wheel");let dragging=false;canvas.addEventListener("pointerdown",e=>{dragging=true;canvas.setPointerCapture(e.pointerId);setFromWheel(e)});canvas.addEventListener("pointermove",e=>{if(dragging)setFromWheel(e)});canvas.addEventListener("pointerup",()=>dragging=false);$("#brightness").addEventListener("input",e=>{state.v=Number(e.target.value);drawWheel();syncColor()});$("#hex-input").addEventListener("change",e=>{const rgb=parseHex(e.target.value);if(!rgb){e.target.value=colorData().hex;return}const hsv=rgbToHsv(...rgb);[state.h,state.s,state.v]=hsv;$("#brightness").value=state.v;drawWheel();syncColor()});["#red-input","#green-input","#blue-input"].forEach(sel=>$(sel).addEventListener("change",()=>{const rgb=["#red-input","#green-input","#blue-input"].map(s=>Math.max(0,Math.min(255,Number($(s).value)||0))),hsv=rgbToHsv(...rgb);[state.h,state.s,state.v]=hsv;$("#brightness").value=state.v;drawWheel();syncColor()}));$$("input[name=apply-to],input[name=color-mode],.style-option").forEach(i=>i.addEventListener("change",()=>{$("#background-color-fields").hidden=$("input[name=apply-to]:checked").value!=="both";updateColorOutputs()}));$("#background-hex").addEventListener("input",updateColorOutputs);$("#add-color-sequence").addEventListener("click",()=>addSequence("Generated color and styles",currentColorBody()));syncColor()}

  function addSequence(name,body){state.sequence.push({name,body});renderSequence();$$(".ansi-tab").find(b=>b.dataset.panel==="sequence").click()}
  function renderSequence(){const list=$("#sequence-list");list.replaceChildren(...state.sequence.map((item,index)=>{const div=document.createElement("div");div.className="sequence-item";div.innerHTML=`<span class="sequence-order">${index+1}</span><div><strong></strong><code></code></div><div class="sequence-controls"><button class="icon-action up" type="button" aria-label="Move up">↑</button><button class="icon-action down" type="button" aria-label="Move down">↓</button><button class="icon-action remove" type="button" aria-label="Remove">×</button></div>`;div.querySelector("strong").textContent=item.name;div.querySelector("code").textContent=escapeText(item.body,"hex");div.querySelector(".up").disabled=index===0;div.querySelector(".down").disabled=index===state.sequence.length-1;div.querySelector(".up").onclick=()=>{[state.sequence[index-1],state.sequence[index]]=[state.sequence[index],state.sequence[index-1]];renderSequence()};div.querySelector(".down").onclick=()=>{[state.sequence[index+1],state.sequence[index]]=[state.sequence[index],state.sequence[index+1]];renderSequence()};div.querySelector(".remove").onclick=()=>{state.sequence.splice(index,1);renderSequence()};return div}));$("#sequence-empty").hidden=state.sequence.length>0;updateGenerated()}
  const languages={bash:"Bash",powershell:"PowerShell",python:"Python",javascript:"JavaScript",typescript:"TypeScript",c:"C",cpp:"C++",csharp:"C#",java:"Java",go:"Go",rust:"Rust",php:"PHP",ruby:"Ruby",perl:"Perl"};
  function ident(value,language){let v=value.trim().replace(/[^a-zA-Z0-9_]/g,"_")||"ansi_sequence";if(/^\d/.test(v))v="ansi_"+v;if(["bash","powershell","c","cpp"].includes(language))return v.toUpperCase();return v}
  function literal(body,language){const encoded="\\x1b"+body.replace(/\\x07/g,"\\x07");if(language==="bash")return `$'${body.startsWith("]")?"\\e":"\\e"}${body}'`;return `"${encoded}"`}
  function generate(){const lang=$("#language-select").value,name=ident($("#variable-name").value,lang),text=$("#example-text").value.replace(/"/g,'\\"'),mode=$("#output-mode").value,items=state.sequence.length?state.sequence:[{name:"Reset all",body:"[0m"}],combined=items.map(i=>i.body).join(""),reset="[0m";const varLine=(n,b)=>({bash:`${n}=${literal(b,"bash")}`,powershell:`$${n} = "\u001b${b}"`,python:`${n} = ${literal(b,lang)}`,javascript:`const ${n} = ${literal(b,lang)};`,typescript:`const ${n}: string = ${literal(b,lang)};`,c:`const char *${n} = ${literal(b,lang)};`,cpp:`const std::string ${n} = ${literal(b,lang)};`,csharp:`const string ${n} = "\\u001b${b}";`,java:`String ${n} = ${literal(b,lang)};`,go:`${n} := ${literal(b,lang)}`,rust:`let ${n} = ${literal(b,lang)};`,php:`$${n} = ${literal(b,lang)};`,ruby:`${n} = ${literal(b,lang)}`,perl:`my $${n} = ${literal(b,lang)};`}[lang]);if(mode==="separate")return items.map((i,index)=>varLine(ident(i.name,lang)||`${name}_${index+1}`,i.body)).join("\n");if(mode==="single")return `${varLine(name,combined)}\n${varLine(ident("reset",lang),reset)}`;const base=`${varLine(name,combined)}\n${varLine(ident("reset",lang),reset)}`;if(mode==="helper"){return({bash:`ansi() { printf '%s%s%s' "$2" "$1" "$RESET"; }\n\n${base}\nansi "${text}" "$${name}"`,powershell:`function Write-Ansi([string]$Text, [string]$Sequence) { Write-Host "$Sequence$Text$RESET" -NoNewline }\n\n${base}\nWrite-Ansi "${text}" $${name}`,python:`def ansi(text, sequence):\n    return f"{sequence}{text}\\x1b[0m"\n\n${base}\nprint(ansi("${text}", ${name}))`,javascript:`function ansi(text, sequence) {\n  return \`${'${sequence}${text}'}\\x1b[0m\`;\n}\n\n${base}\nconsole.log(ansi("${text}", ${name}));`,typescript:`function ansi(text: string, sequence: string): string {\n  return \`${'${sequence}${text}'}\\x1b[0m\`;\n}\n\n${base}\nconsole.log(ansi("${text}", ${name}));`}[lang]||`${base}\n\n// Use ${name} before text and reset after it.`)}return({bash:`${base}\n\nprintf '%s${text}%s\\n' "$${name}" "$RESET"`,powershell:`${base}\n\nWrite-Host "$${name}${text}$RESET"`,python:`${base}\n\nprint(f"{${name}}${text}{reset}")`,javascript:`${base}\n\nconsole.log(\`${'${'+name+'}'}${text}${'${reset}'}\`);`,typescript:`${base}\n\nconsole.log(\`${'${'+name+'}'}${text}${'${reset}'}\`);`,c:`#include <stdio.h>\n\n${base}\n\nint main(void) {\n    printf("%s${text}%s\\n", ${name}, RESET);\n    return 0;\n}`,cpp:`#include <iostream>\n#include <string>\n\n${base}\n\nint main() {\n    std::cout << ${name} << "${text}" << RESET << '\\n';\n}`,csharp:`${base}\n\nConsole.WriteLine($"{${name}}${text}{RESET}");`,java:`${base}\n\nSystem.out.println(${name} + "${text}" + RESET);`,go:`package main\n\nimport "fmt"\n\nfunc main() {\n    ${base.replace(/\n/g,"\n    ")}\n    fmt.Printf("%s${text}%s\\n", ${name}, RESET)\n}`,rust:`fn main() {\n    ${base.replace(/\n/g,"\n    ")}\n    println!("{}${text}{}", ${name}, RESET);\n}`,php:`<?php\n${base}\n\necho $${name} . "${text}" . $RESET . PHP_EOL;`,ruby:`${base}\n\nputs "#{${name}}${text}#{RESET}"`,perl:`use strict;\nuse warnings;\n\n${base}\n\nprint $${name}, "${text}", $RESET, "\\n";`}[lang])}
  function updateGenerated(){$("#generated-code").textContent=generate()}
  function initGenerator(){const select=$("#language-select");Object.entries(languages).forEach(([value,label])=>{const option=document.createElement("option");option.value=value;option.textContent=label;select.append(option)});["#language-select","#variable-name","#example-text","#output-mode"].forEach(sel=>$(sel).addEventListener(sel.includes("select")||sel.includes("mode")?"change":"input",updateGenerated));$("#clear-sequence").addEventListener("click",()=>{state.sequence=[];renderSequence()});$("#copy-generated").addEventListener("click",e=>copyText($("#generated-code").textContent,e.currentTarget));renderSequence()}

  initTabs();initReference();initColor();initGenerator();
})();
