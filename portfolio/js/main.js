/* ============================================================
   АРХИВ.бюро — интерактив
   1. Лоадер «собери литеру» (easter egg-механика)
   2. Кастомный курсор
   3. Полка проектов + дело проекта (modal)
   4. GSAP: mask-reveal, scroll-анимации, счётчики, scramble
   5. Бриф-конструктор (live summary)
   ============================================================ */
(() => {
"use strict";
const $ = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => [...c.querySelectorAll(s)];
const hasGSAP = typeof gsap !== "undefined";
if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

/* ---------- 1. ЛОАДЕР: нажми и удержи — литера соберётся ---------- */
const loader = $("#loader"), glyph = $("#loaderGlyph"),
      bar = $("#loaderBar"), pct = $("#loaderPct");
let progress = 0, holding = false, done = false;

function finishLoader(){
  if (done) return; done = true;
  glyph.classList.add("focus");
  loader.classList.add("done");
  document.body.classList.remove("no-scroll");
  setTimeout(()=>loader.remove(), 1100);
  heroIntro();
}
function tick(){
  if (done) return;
  progress += holding ? 2.4 : 0.55;          // удержание ускоряет в ~4 раза
  if (progress >= 100){ progress = 100; finishLoader(); }
  bar.style.width = progress + "%";
  pct.textContent = Math.floor(progress) + "%";
  glyph.style.filter = `blur(${(1-progress/100)*14}px)`;
  glyph.style.opacity = .4 + (progress/100)*.6;
  requestAnimationFrame(tick);
}
["pointerdown"].forEach(ev=>loader.addEventListener(ev,()=>holding=true));
["pointerup","pointerleave"].forEach(ev=>loader.addEventListener(ev,()=>holding=false));
document.body.classList.add("no-scroll");
requestAnimationFrame(tick);
setTimeout(finishLoader, 7000); // милосердие: авто-вход

/* ---------- 2. КУРСОР ---------- */
const cursor = $("#cursor"), cursorLabel = $("#cursorLabel");
let cx=innerWidth/2, cy=innerHeight/2, tx=cx, ty=cy;
addEventListener("pointermove", e=>{tx=e.clientX; ty=e.clientY});
(function loop(){ cx+=(tx-cx)*.22; cy+=(ty-cy)*.22;
  cursor.style.transform=`translate(${cx}px,${cy}px) translate(-50%,-50%)`;
  requestAnimationFrame(loop);
})();
$$("[data-cursor]").forEach(el=>{
  const mode = el.dataset.cursor;
  el.addEventListener("pointerenter",()=>{
    if(mode.startsWith("hover")){ cursor.classList.add("is-big");
      cursorLabel.textContent = mode.includes("nav")?"перейти":mode.includes("row")?"обсудить":mode.includes("btn")?"погнали":"открыть дело";
    }
    if(mode==="invert") cursor.classList.add("is-invert");
  });
  el.addEventListener("pointerleave",()=>{ cursor.classList.remove("is-big","is-invert"); cursorLabel.textContent=""; });
});

/* ---------- 3. ПОЛКА + ДЕЛА ---------- */
const shelf = $("#shelfRow"), casesGrid = $("#casesGrid");
const labelByType = {spine:"корешок", cover:"книга", poster:"стенд", screen:"экран"};

PROJECTS.forEach((p,i)=>{
  let el;
  if(p.type==="spine"){
    el = document.createElement("button");
    el.className = "spine";
    el.style.background = p.ink;
    el.style.height = (p.h||220)+"px";
    el.style.width = (p.w||40)+"px";
    el.innerHTML = `<span>${p.title}</span><span class="spine__metric">${p.metric}</span>`;
  } else {
    el = document.createElement("button");
    el.className = `object object--${p.type}`;
    el.style.setProperty("--oc", p.ink);
    if(p.type==="cover")
      el.innerHTML = `<span class="object__cat">${labelByType[p.type]}</span><span><span class="object__t">${p.title}</span><br><span class="object__m">${p.metric}</span></span>`;
    else if(p.type==="poster")
      el.innerHTML = `<span class="object__cat">${p.year}</span><span class="object__t">${p.title}</span><span class="object__m">${labelByType[p.type]} · ${p.metric}</span>`;
    else
      el.innerHTML = `<i></i><span class="object__m" style="color:#fff8;display:block;margin-top:4px">${p.title}</span>`;
  }
  el.setAttribute("data-cursor","open");
  el.addEventListener("click",()=>openCase(p));
  shelf.appendChild(el);

  // карточка для сетки (SEO + альтернативный путь)
  const card = document.createElement("article");
  card.className = "case-card";
  card.style.setProperty("--cc", p.ink);
  card.setAttribute("data-cursor","open");
  card.innerHTML = `
    <span class="case-card__idx">дело № ${String(i+1).padStart(2,"0")} · ${p.year}</span>
    <h3 class="case-card__title">${p.title}</h3>
    <span class="case-card__cat">${p.cat}</span>
    <p class="case-card__tag">«${p.tagline}»</p>
    <span class="case-card__go">→</span>`;
  card.addEventListener("click",()=>openCase(p));
  casesGrid.appendChild(card);
});

/* модалка дела */
const modal = $("#caseModal"), caseBody = $("#caseBody");
function openCase(p){
  caseBody.innerHTML = `
    <div class="file-head">
      <div>
        <div class="file-cat">${p.cat} · ${p.client}</div>
        <h3>${p.title}</h3>
        <p style="font-family:var(--f-serif);font-style:italic;margin-top:8px">«${p.tagline}»</p>
      </div>
      <span class="file-stamp">ДЕЛО · ${p.year}</span>
    </div>
    <div class="file-grid">
      <div class="file-block"><h4>Задача</h4><p>${p.task}</p></div>
      <div class="file-block"><h4>Что сделано</h4><ul>${p.did.map(d=>`<li>${d}</li>`).join("")}</ul></div>
    </div>
    <div class="file-grid">
      <div class="file-block"><h4>Результат</h4><p>${p.result}</p></div>
      <div class="file-block"><h4>Показатель</h4><p style="font-family:var(--f-display);font-weight:800;font-size:26px;color:${p.ink}">${p.metric}</p></div>
    </div>
    <div class="file-plates">
      <div class="plate" style="--pc:${p.ink}" data-l="носитель 01"></div>
      <div class="plate" style="--pc:${p.ink}" data-l="носитель 02"></div>
      <div class="plate" style="--pc:${p.ink}" data-l="разворот"></div>
    </div>
    <div class="file-strip"><span>Архив бюро · ${p.id}</span><span>запросить полные материалы →</span></div>
    <p style="margin-top:18px;font-size:13px;color:var(--ink-soft)"><em>(Рыба: сюда подставляются реальные фото носителей и разворотов — они продают лучше мокапов.)</em></p>`;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("modal-open");
}
function closeCase(){ modal.classList.remove("open"); modal.setAttribute("aria-hidden","true"); document.body.classList.remove("modal-open"); }
$("#caseClose").addEventListener("click",closeCase);
modal.addEventListener("click",e=>{ if(e.target===modal) closeCase(); });
addEventListener("keydown",e=>{ if(e.key==="Escape") closeCase(); });

/* ---------- 4. GSAP-анимации ---------- */
function heroIntro(){
  if(!hasGSAP){ $$(".mask__i").forEach(m=>m.style.transform="none"); return; }
  gsap.to(".hero .mask__i",{y:0,duration:1.05,stagger:.09,ease:"power4.out"});
  gsap.fromTo(".reveal-line span",{y:"110%"},{y:0,duration:.9,ease:"power3.out",delay:.1});
  gsap.to(".hero .reveal-up",{opacity:1,y:0,duration:.9,delay:.55,ease:"power3.out"});
  scrambleOnce($(".hero__title-accent"),"работает");
}

/* scramble-эффект по тексту */
function scrambleOnce(el, final){
  if(!el) return;
  const chars="АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ#*+—";
  let frame=0; const total=final.length;
  const iv=setInterval(()=>{
    frame++;
    let out="";
    for(let i=0;i<total;i++){
      out += i < frame/2 ? final[i] : chars[Math.floor(Math.random()*chars.length)];
    }
    el.textContent=out;
    if(frame/2>=total){clearInterval(iv); el.textContent=final;}
  },45);
}

if(hasGSAP){
  // секционные mask-reveal
  $$(".section-head .mask__i, .story__title .mask__i, .contact__title .mask__i, .footer__big .mask__i").forEach(m=>{
    gsap.to(m,{y:0,duration:1,ease:"power4.out",scrollTrigger:{trigger:m,start:"top 88%"}});
  });
  // reveal-up по всему документу
  $$(".reveal-up").filter(el=>!el.closest(".hero")).forEach(el=>{
    gsap.to(el,{opacity:1,y:0,duration:.8,ease:"power3.out",scrollTrigger:{trigger:el,start:"top 90%"}});
  });
  // корешки «вырастают» из полки
  gsap.from(".spine, .object",{y:80,opacity:0,duration:.7,stagger:.04,ease:"back.out(1.6)",
    scrollTrigger:{trigger:".shelf",start:"top 80%"}});
  // story panels
  $$("[data-panel]").forEach(p=>{
    gsap.from(p,{y:60,opacity:0,duration:.8,ease:"power3.out",scrollTrigger:{trigger:p,start:"top 85%"}});
  });
  // счётчики
  $$(".number").forEach(n=>{
    const target=+n.dataset.count, suf=n.dataset.suffix||"", span=$("span",n);
    ScrollTrigger.create({trigger:n,start:"top 88%",once:true,onEnter:()=>{
      const o={v:0};
      gsap.to(o,{v:target,duration:1.6,ease:"power2.out",onUpdate:()=>span.textContent=Math.round(o.v)+suf});
    }});
  });
  // параллакс сетки героя
  gsap.to(".hero__grid-lines",{yPercent:18,ease:"none",scrollTrigger:{trigger:".hero",start:"top top",end:"bottom top",scrub:true}});
}

/* ---------- 5. БРИФ-КОНСТРУКТОР ---------- */
const form=$("#briefForm"), summary=$("#briefSummary");
const NAMES={brand:"бренд",book:"книгу",expo:"выставку",digital:"digital",pack:"упаковку",
  "300":"до 300 тыс ₽","700":"300–700 тыс","1500":"700 тыс – 1,5 млн",more:"1,5 млн+",
  asap:"горит",month:"через месяц",plan:"в планах"};
form.addEventListener("change",()=>{
  const fd=new FormData(form);
  const tasks=fd.getAll("task").map(v=>NAMES[v]);
  const budget=fd.get("budget"), when=fd.get("when");
  const parts=[];
  if(tasks.length) parts.push(`нужен ${tasks.join(" + ")}`);
  if(budget) parts.push(`бюджет ${NAMES[budget]}`);
  if(when) parts.push(`старт: ${NAMES[when]}`);
  summary.textContent = parts.length ? "→ " + parts.join(", ") : "Заявка пока пустая — соберите её выше ↑";
});
form.addEventListener("submit",e=>{
  e.preventDefault();
  // TODO: отправка на бэкенд / Formspree / Telegram-бот
  const btn=$("button[type=submit]",form);
  btn.classList.add("sent");
  if(btn.firstChild && btn.firstChild.nodeType===3) btn.firstChild.textContent="Принято в архив ";
  summary.textContent="→ заявка сформирована. отвечу в течение рабочего дня. (демо: подключите отправку)";
});

/* ---------- прочее ---------- */
// бургер
const burger=$("#burger"), overlay=$("#menuOverlay");
burger.addEventListener("click",()=>{
  overlay.classList.toggle("open");
  document.body.classList.toggle("menu-open");
  burger.classList.toggle("active");
});
$$("#menuOverlay a").forEach(a=>a.addEventListener("click",()=>{overlay.classList.remove("open");document.body.classList.remove("menu-open");}));

// easter egg: клик по точке в заголовке — инверсия темы
const dot=$(".hero__title .acc");
dot && dot.addEventListener("click",()=>{
  document.documentElement.style.filter =
    document.documentElement.style.filter==="invert(1)" ? "" : "invert(1) hue-rotate(180deg)";
});
})();
