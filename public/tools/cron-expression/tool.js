"use strict";

(() => {
  const fieldDefs = [
    { id: "minute", name: "Minute", min: 0, max: 59 },
    { id: "hour", name: "Hour", min: 0, max: 23 },
    { id: "day-month", name: "Day of month", min: 1, max: 31 },
    { id: "month", name: "Month", min: 1, max: 12, names: { JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12 } },
    { id: "day-week", name: "Day of week", min: 0, max: 7, names: { SUN:0,MON:1,TUE:2,WED:3,THU:4,FRI:5,SAT:6 } }
  ];
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const inputs = fieldDefs.map((def) => document.querySelector(`#${def.id}`));
  const generatedExpression = document.querySelector("#generated-expression");
  const generatedExplanation = document.querySelector("#generated-explanation");
  const builderStatus = document.querySelector("#builder-status");
  const cronInput = document.querySelector("#cron-input");
  const explainerStatus = document.querySelector("#explainer-status");
  const cronExplanation = document.querySelector("#cron-explanation");
  const fieldBreakdown = document.querySelector("#field-breakdown");

  function normaliseToken(token, def) {
    let value = token.toUpperCase();
    if (def.names) Object.entries(def.names).forEach(([name, number]) => { value = value.replace(new RegExp(`\\b${name}\\b`, "g"), String(number)); });
    return value;
  }

  function validateAtom(atom, def) {
    if (!/^\d+$/.test(atom)) return false;
    const n = Number(atom);
    return n >= def.min && n <= def.max;
  }

  function validateField(raw, def) {
    const value = normaliseToken(raw.trim(), def);
    if (!value || /\s/.test(value)) return { valid:false, message:`${def.name} cannot be empty.` };
    const parts = value.split(",");
    for (const part of parts) {
      const stepParts = part.split("/");
      if (stepParts.length > 2 || (stepParts[1] && (!/^\d+$/.test(stepParts[1]) || Number(stepParts[1]) < 1))) return { valid:false, message:`Invalid step in ${def.name}.` };
      const base = stepParts[0];
      if (base === "*") continue;
      if (base.includes("-")) {
        const range = base.split("-");
        if (range.length !== 2 || !validateAtom(range[0],def) || !validateAtom(range[1],def) || Number(range[0]) > Number(range[1])) return { valid:false, message:`Invalid range in ${def.name}.` };
      } else if (!validateAtom(base,def)) return { valid:false, message:`${def.name} must be between ${def.min} and ${def.max}.` };
    }
    return { valid:true, value };
  }

  function parseExpression(expression) {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return { valid:false, message:"Enter exactly five cron fields: minute, hour, day of month, month, and day of week." };
    const values=[];
    for (let i=0;i<5;i++) {
      const result=validateField(parts[i],fieldDefs[i]);
      if (!result.valid) return result;
      values.push(result.value);
    }
    return { valid:true, values, expression:values.join(" ") };
  }

  function formatList(values, formatter=(v)=>String(v)) {
    const names=values.map(formatter);
    if (names.length===1) return names[0];
    if (names.length===2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0,-1).join(", ")}, and ${names.at(-1)}`;
  }

  function describeSimple(field, def) {
    if (field === "*") return `every ${def.name.toLowerCase()}`;
    if (/^\*\/\d+$/.test(field)) return `every ${field.split("/")[1]} ${def.name.toLowerCase()}s`;
    if (/^\d+-\d+$/.test(field)) {
      const [a,b]=field.split("-").map(Number);
      if (def.id==="day-week") return `${dayNames[a]} through ${dayNames[b]}`;
      if (def.id==="month") return `${monthNames[a-1]} through ${monthNames[b-1]}`;
      return `${a} through ${b}`;
    }
    if (field.includes(",")) {
      const vals=field.split(",").map(Number);
      if (def.id==="day-week") return formatList(vals,v=>dayNames[v]);
      if (def.id==="month") return formatList(vals,v=>monthNames[v-1]);
      return formatList(vals);
    }
    const n=Number(field);
    if (def.id==="day-week") return dayNames[n];
    if (def.id==="month") return monthNames[n-1];
    return String(n);
  }

  function describe(values) {
    const [minute,hour,dom,month,dow]=values;
    let timing;
    if (minute==="*" && hour==="*") timing="Every minute";
    else if (/^\*\/\d+$/.test(minute) && hour==="*") timing=`Every ${minute.split("/")[1]} minutes`;
    else if (/^\d+$/.test(minute) && hour==="*") timing=`At minute ${minute} of every hour`;
    else if (/^\d+$/.test(minute) && /^\d+$/.test(hour)) {
      const h=Number(hour), m=Number(minute);
      const time=new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit",hour12:true,timeZone:"UTC"}).format(new Date(Date.UTC(2000,0,1,h,m)));
      timing=`At ${time}`;
    } else timing=`At minute ${describeSimple(minute,fieldDefs[0])}, during hour ${describeSimple(hour,fieldDefs[1])}`;

    const constraints=[];
    if (dom!=="*") constraints.push(`on day ${describeSimple(dom,fieldDefs[2])} of the month`);
    if (month!=="*") constraints.push(`in ${describeSimple(month,fieldDefs[3])}`);
    if (dow!=="*") constraints.push(`on ${describeSimple(dow,fieldDefs[4])}`);
    return `${timing}${constraints.length ? ` ${constraints.join(" ")}` : " every day"}.`;
  }

  function fieldDescription(value,def) {
    if (value==="*") return "Any allowed value";
    if (/^\*\/\d+$/.test(value)) return `Every ${value.split("/")[1]} values`;
    if (value.includes(",")) return `List: ${describeSimple(value,def)}`;
    if (value.includes("-")) return `Range: ${describeSimple(value,def)}`;
    return describeSimple(value,def);
  }

  function renderBreakdown(values) {
    fieldBreakdown.innerHTML=values.map((value,i)=>`<article><strong>${fieldDefs[i].name}</strong><code>${value}</code><span>${fieldDescription(value,fieldDefs[i])}</span></article>`).join("");
  }

  function updateBuilder() {
    const parsed=parseExpression(inputs.map(input=>input.value.trim()).join(" "));
    if (!parsed.valid) {
      builderStatus.textContent=parsed.message; builderStatus.classList.add("error");
      generatedExplanation.textContent=""; return;
    }
    builderStatus.textContent="Valid standard five-field cron expression."; builderStatus.classList.remove("error");
    generatedExpression.textContent=parsed.expression;
    generatedExplanation.textContent=describe(parsed.values);
  }

  function explainInput() {
    const parsed=parseExpression(cronInput.value);
    if (!parsed.valid) {
      explainerStatus.textContent=parsed.message; explainerStatus.classList.add("error");
      cronExplanation.textContent=""; fieldBreakdown.innerHTML=""; return null;
    }
    cronInput.value=parsed.expression;
    explainerStatus.textContent="Valid standard five-field cron expression."; explainerStatus.classList.remove("error");
    cronExplanation.textContent=describe(parsed.values);
    renderBreakdown(parsed.values);
    return parsed;
  }

  inputs.forEach(input=>input.addEventListener("input",updateBuilder));
  document.querySelector("#preset-row").addEventListener("click",event=>{
    const button=event.target.closest("[data-cron]"); if(!button)return;
    const values=button.dataset.cron.split(" "); inputs.forEach((input,i)=>input.value=values[i]); updateBuilder();
  });
  document.querySelector("#copy-generated").addEventListener("click",async event=>{
    try { await navigator.clipboard.writeText(generatedExpression.textContent); event.currentTarget.textContent="Copied"; setTimeout(()=>event.currentTarget.textContent="Copy",1200); }
    catch { builderStatus.textContent="Copy failed. Select the expression and copy it manually."; builderStatus.classList.add("error"); }
  });
  document.querySelector("#explain-button").addEventListener("click",explainInput);
  cronInput.addEventListener("input",explainInput);
  cronInput.addEventListener("keydown",event=>{ if(event.key==="Enter"){event.preventDefault();explainInput();} });
  document.querySelector("#use-builder-button").addEventListener("click",()=>{
    const parsed=explainInput(); if(!parsed)return;
    inputs.forEach((input,i)=>input.value=parsed.values[i]); updateBuilder(); document.querySelector("#builder-title").scrollIntoView({behavior:"smooth",block:"start"});
  });
  document.querySelector("#clear-button").addEventListener("click",()=>{ cronInput.value=""; explainerStatus.textContent=""; cronExplanation.textContent=""; fieldBreakdown.innerHTML=""; cronInput.focus(); });

  updateBuilder(); explainInput();
})();
