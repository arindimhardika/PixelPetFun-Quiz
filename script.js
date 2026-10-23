/* ===== DATA SOAL (tambah topik/soal di sini) ===== */
const TOPICS = {
  "Umum": [
    {q:"Ibu kota Indonesia saat ini adalah...",a:["Jakarta","Bandung","Surabaya","Medan"],c:0},
    {q:"Berapa jumlah hari dalam seminggu?",a:["5","6","7","8"],c:2},
    {q:"Hewan apa yang dijuluki raja hutan?",a:["Harimau","Singa","Gajah","Beruang"],c:1},
    {q:"Warna campuran biru dan kuning adalah...",a:["Ungu","Oranye","Hijau","Merah"],c:2},
    {q:"Benua terbesar di dunia adalah...",a:["Afrika","Asia","Eropa","Amerika"],c:1}
  ],
  "Sains": [
    {q:"Planet terdekat dari Matahari adalah...",a:["Venus","Bumi","Merkurius","Mars"],c:2},
    {q:"Air membeku pada suhu... derajat Celsius",a:["0","10","50","100"],c:0},
    {q:"Gas yang kita hirup untuk bernapas adalah...",a:["Oksigen","Karbon","Helium","Nitrogen"],c:0},
    {q:"Bagian tumbuhan yang menyerap air adalah...",a:["Daun","Bunga","Akar","Buah"],c:2},
    {q:"Satuan untuk mengukur panjang adalah...",a:["Kilogram","Meter","Liter","Detik"],c:1}
  ],
  "English": [
    {q:"Arti kata 'Apple' adalah...",a:["Jeruk","Apel","Pisang","Mangga"],c:1},
    {q:"Lawan kata 'Big' adalah...",a:["Small","Tall","Fast","Long"],c:0},
    {q:"She ___ a student. (to be)",a:["am","are","is","be"],c:2},
    {q:"Arti 'Thank you' adalah...",a:["Maaf","Tolong","Selamat pagi","Terima kasih"],c:3},
    {q:"Bahasa Inggris dari 'Kucing' adalah...",a:["Dog","Cat","Bird","Fish"],c:1}
  ]
};
const TIME_PER_Q = 15, LIVES = 3;

/* ===== UTILITAS ===== */
const $ = id => document.getElementById(id);
const show = id => { ["s-title","s-topic","s-quiz","s-end"].forEach(s => $(s).classList.toggle("hidden", s !== id)); };
const shuffle = a => { a = a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];} return a; };

/* ===== SUARA 8-BIT ===== */
let actx;
function beep(freqs, dur=0.1){
  try{
    actx = actx || new (window.AudioContext||window.webkitAudioContext)();
    freqs.forEach((f,i)=>{
      const o=actx.createOscillator(), g=actx.createGain(), t=actx.currentTime+i*dur;
      o.type="square"; o.frequency.value=f; g.gain.setValueAtTime(0.06,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t+dur);
    });
  }catch(e){}
}
const sfx = {ok:()=>beep([523,659,784]), bad:()=>beep([220,165],0.15), win:()=>beep([523,659,784,1047],0.12), tap:()=>beep([440],0.05)};

/* ===== KARAKTER PIXEL 16x16 ===== */
function drawPet(canvas, mood="idle", crown=false){
  const c = canvas.getContext("2d"); c.clearRect(0,0,16,16);
  const R = (x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
  const O="#2b1b4d", B="#ffd23f", P="#ff6fb5", W="#ffffff";
  // telinga
  R(1,1,4,3,O); R(11,1,4,3,O); R(2,2,2,2,B); R(12,2,2,2,B);
  // badan
  R(1,3,14,13,O); R(2,4,12,11,B);
  [[1,3],[14,3],[1,15],[14,15]].forEach(([x,y])=>c.clearRect(x,y,1,1));
  // pipi
  R(3,9,2,1,P); R(11,9,2,1,P);
  // mata & mulut
  if(mood==="happy"){
    [[4,7],[5,6],[6,7],[9,7],[10,6],[11,7]].forEach(([x,y])=>R(x,y,1,1,O));
    [[5,10],[10,10]].forEach(([x,y])=>R(x,y,1,1,O)); R(6,11,4,1,O);
  } else if(mood==="sad"){
    R(4,7,2,2,O); R(10,7,2,2,O); R(4,9,1,1,"#4cc9f0");
    R(7,10,2,1,O); R(6,11,1,1,O); R(9,11,1,1,O);
  } else {
    R(4,6,2,3,O); R(10,6,2,3,O); R(4,6,1,1,W); R(10,6,1,1,W);
    R(7,11,2,1,O);
  }
  if(crown){ R(5,0,6,2,"#ff9f1c"); R(5,0,1,1,O); R(8,0,1,1,O); R(10,0,1,1,O); }
}
function petAll(mood, crown){ ["pet0","pet1","pet2"].forEach(id=>drawPet($(id),mood,crown)); }
function anim(el, cls){ el.classList.remove("bounce","shake"); void el.offsetWidth; el.classList.add(cls); }

/* ===== LATAR INTERAKTIF ===== */
const bg = $("bg"), g = bg.getContext("2d");
const CELL = 28; let cols, rows, mx=-999, my=-999, baseHue=280, targetHue=280, parts=[];
function resize(){ bg.width=innerWidth; bg.height=innerHeight; cols=Math.ceil(bg.width/CELL); rows=Math.ceil(bg.height/CELL); }
addEventListener("resize", resize); resize();
addEventListener("pointermove", e=>{ mx=e.clientX; my=e.clientY; });
addEventListener("pointerdown", e=>{ mx=e.clientX; my=e.clientY; burst(e.clientX,e.clientY,14); targetHue+=25; });
function burst(x,y,n){
  for(let i=0;i<n;i++) parts.push({x,y,vx:(Math.random()-.5)*10,vy:(Math.random()-.9)*10,life:40+Math.random()*20,h:Math.random()*360,s:6+(Math.random()*3|0)*4});
}
const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
function loop(t){
  baseHue += ((targetHue-baseHue)*0.04); t*=0.001;
  for(let y=0;y<rows;y++){
    for(let x=0;x<cols;x++){
      const cx=x*CELL+CELL/2, cy=y*CELL+CELL/2;
      const d=Math.hypot(cx-mx,cy-my), near=Math.max(0,1-d/180);
      const wave=reduce?0:Math.sin(x*0.35+t*1.2)+Math.cos(y*0.3+t*0.9);
      const hue=(baseHue+x*2.5+y*2.5+wave*18+near*60)%360;
      const light=22+wave*3+near*38;
      g.fillStyle=`hsl(${hue},70%,${light}%)`;
      const pad=near>0.02?Math.max(0,3-near*3):2;
      g.fillRect(x*CELL+pad,y*CELL+pad,CELL-pad*2,CELL-pad*2);
    }
  }
  parts=parts.filter(p=>p.life>0);
  parts.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.4; p.life--; g.fillStyle=`hsl(${p.h},90%,65%)`; g.fillRect(p.x|0,p.y|0,p.s,p.s); });
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ===== LOGIKA KUIS ===== */
let topic, qs, idx, score, lives, streak, correctCount, timer, left, locked, hi = {};
try{ hi = JSON.parse(localStorage.getItem("pixelpet-best")||"{}"); }catch(e){}
function showBest(){ const b=Math.max(0,...Object.values(hi)); $("best").textContent = b?("Skor tertinggi: "+b):""; }
showBest(); petAll("idle");

$("start").onclick = ()=>{ sfx.tap(); show("s-topic"); };
Object.keys(TOPICS).forEach((name,i)=>{
  const b=document.createElement("button"); b.className="btn c"+i; b.textContent=name;
  b.onclick=()=>startQuiz(name); $("topics").appendChild(b);
});
$("again").onclick = ()=>startQuiz(topic);
$("menu").onclick = ()=>show("s-topic");

function startQuiz(name){
  topic=name; qs=shuffle(TOPICS[name]); idx=0; score=0; lives=LIVES; streak=0; correctCount=0;
  show("s-quiz"); petAll("idle"); nextQ();
}
function hud(){
  $("score").textContent="SKOR "+score;
  $("hearts").textContent="♥".repeat(lives)+"♡".repeat(LIVES-lives);
  $("num").textContent=(idx+1)+"/"+qs.length;
  $("combo").textContent=streak>=2?("COMBO x"+streak+"!"):"";
}
function nextQ(){
  locked=false; hud(); drawPet($("pet1"),"idle",streak>=3);
  const item=qs[idx]; $("q").textContent=item.q; $("bubble").textContent="Hmm... apa ya jawabannya?";
  const box=$("answers"); box.innerHTML="";
  shuffle(item.a.map((text,i)=>({text,ok:i===item.c}))).forEach((o,i)=>{
    const b=document.createElement("button"); b.className="btn c"+i; b.textContent=o.text;
    b.onclick=()=>answer(b,o.ok); box.appendChild(b);
  });
  left=TIME_PER_Q; clearInterval(timer);
  timer=setInterval(()=>{
    left-=0.1; $("bar").style.width=Math.max(0,left/TIME_PER_Q*100)+"%";
    $("bar").style.background=left<5?"#ff5a5a":"var(--mint)";
    if(left<=0){ clearInterval(timer); answer(null,false,true); }
  },100);
}
function answer(btn, ok, timeout){
  if(locked) return; locked=true; clearInterval(timer);
  [...$("answers").children].forEach(b=>b.disabled=true);
  const pet=$("pet1");
  if(ok){
    streak++; correctCount++; score+=10+Math.ceil(left/3)+(streak>=3?5:0);
    btn.classList.add("right"); sfx.ok(); drawPet(pet,"happy",streak>=3); anim(pet,"bounce");
    $("bubble").textContent=["Yeay, benar!","Kamu pintar!","Nyam, enak!"][Math.random()*3|0];
    targetHue+=45; const r=btn.getBoundingClientRect(); burst(r.left+r.width/2,r.top,30);
  } else {
    streak=0; lives--; if(btn) btn.classList.add("wrong"); sfx.bad(); drawPet(pet,"sad"); anim(pet,"shake");
    $("bubble").textContent=timeout?"Waktu habis...":"Oh tidak, salah...";
    const correct=qs[idx].a[qs[idx].c];
    [...$("answers").children].forEach(b=>{ if(b.textContent===correct) b.classList.add("right"); });
  }
  hud();
  setTimeout(()=>{ idx++; (lives<=0||idx>=qs.length)?finish():nextQ(); }, 1300);
}
function finish(){
  clearInterval(timer);
  const pct=correctCount/qs.length, stars=pct>=0.99?3:pct>=0.6?2:pct>0?1:0;
  const win=lives>0;
  $("endTitle").textContent=win?"SELESAI!":"GAME OVER";
  $("stars").textContent="★".repeat(stars)+"☆".repeat(3-stars);
  const best=Math.max(hi[topic]||0,score), isNew=score>(hi[topic]||0)&&score>0;
  hi[topic]=best; try{ localStorage.setItem("pixelpet-best",JSON.stringify(hi)); }catch(e){}
  $("endText").textContent="Benar "+correctCount+" dari "+qs.length+". Skor "+score+(isNew?" (rekor baru!)":".");
  petAll(stars>=2?"happy":stars===1?"idle":"sad", stars===3);
  anim($("pet2"), stars>=2?"bounce":"shake");
  win?sfx.win():sfx.bad(); if(win) burst(innerWidth/2,innerHeight/2,60);
  showBest(); show("s-end");
}
