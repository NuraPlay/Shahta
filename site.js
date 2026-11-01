/* Игротека: общий каркас сайта (шапка, подвал, панель игры, блоки под игрой, каталог на главной).
   Чтобы добавить игру на сайт, добавь объект в список G ниже: она появится в каталоге, подвале и «Похожих играх».
   Порядок «Популярных» задаётся полем p (чем больше, тем выше). */
(()=>{'use strict';
const d=document,MAIL='nurzatsaiabekov@gmail.com';
const LS={get(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v==null?f:v}catch(e){return f}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CATS={action:'Экшен',idle:'Кликеры',sim:'Симуляторы',puzzle:'Головоломки',team:'Командные'};
const G=[
{id:'orda',u:'orda.html',t:'Орда',c:'action',e:'🧟',e2:'⚔️',h:268,b:'Новинка',m:'5–20 мин',mode:'Один игрок',p:100,n:'2026-10-27',
 s:'Бесконечный экшен-рогалик: герой стреляет сам, враги идут волнами. Собирай сборку, побеждай боссов и усиливайся между забегами.',
 d:'Бесконечный экшен-рогалик: герой стреляет сам, враги идут волнами, а ты собираешь сборку из оружия, побеждаешь боссов и усиливаешься между забегами. Ежедневные вызовы, задания и подарки. Сколько минут ты продержишься?',
 how:['Двигай героя стрелками или WASD. На телефоне и с мышью веди пальцем или курсором по экрану: появится джойстик.','Оружие стреляет само. На каждом уровне выбирай улучшение и собирай свою сборку.','Побеждай боссов, собирай золото и открывай героев, карты и улучшения в лагере.','Пауза: клавиша P или Esc.']},
{id:'mine',u:'mine.html',t:'Шахта',c:'idle',e:'⛏️',h:28,m:'2–10 мин',mode:'Один игрок',p:90,n:'2026-10-20',g:'guide.html',
 s:'Копай руду, нанимай шахтёров, покупай технику и открывай новые шахты. Добыча идёт, даже когда ты не в игре.',
 d:'Копай руду, нанимай шахтёров, покупай технику и открывай новые шахты. Добыча идёт, даже когда ты не в игре. Обновляй шахту, чтобы получать самородки и постоянный бонус к доходу.',
 how:['Нажимай на породу, чтобы копать.','Нанимай шахтёров и покупай технику: добыча идёт сама, даже когда тебя нет.','Обновляй шахту, чтобы получать самородки и постоянный бонус к доходу.']},
{id:'farm',u:'farm.html',t:'Ферма',c:'sim',e:'🚜',h:140,b:'Новинка',m:'3–15 мин',mode:'Один игрок',p:85,n:'2026-10-29',
 s:'Сажай овощи, держи кур и коров, лови выгодные цены на рынке и выполняй заказы. Урожай растёт, даже когда тебя нет.',
 d:'Сажай овощи, держи кур и коров, лови выгодные цены на рынке и выполняй заказы. Урожай растёт, даже когда тебя нет. Зови друзей: они получают бонус, а ты игровые монеты. Реальных денег игра не выплачивает.',
 how:['Выбери семена и нажми на пустую грядку.','Когда урожай созреет, нажми на него и продай на рынке: цены меняются каждые 3 минуты.','Выполняй заказы и вкладывай монеты в улучшения и новые грядки.']},
{id:'spot',u:'spot.html',t:'Найди отличия',c:'puzzle',e:'🔍',h:205,m:'3–10 мин',mode:'Один игрок',p:70,n:'2026-10-18',
 s:'Сравни две картинки и отметь все отличия. Уровни не заканчиваются и становятся сложнее.',
 d:'Сравни две картинки и отметь все отличия. Уровни не заканчиваются и становятся сложнее. Ошибки отнимают сердечки, так что тапай внимательно.',
 how:['Сравни две картинки и нажми на каждое отличие.','Ошибочный тап отнимает сердечко, будь внимателен.','Уровни идут по нарастающей, переключай их стрелками ‹ и ›.']},
{id:'quiz',u:'quiz.html',t:'Викторина для команды',c:'team',e:'👥',h:330,m:'10–20 мин',mode:'2–20 игроков',p:60,n:'2026-10-15',
 s:'Играй с коллегами онлайн: создай комнату, отправь ссылку и отвечайте на вопросы на скорость. Подойдёт для перерыва в офисе.',
 d:'Играй с коллегами онлайн: создай комнату, отправь ссылку и отвечайте на вопросы на скорость. Подойдёт для перерыва в офисе. Ведущий создаёт комнату, остальные подключаются без регистрации.',
 how:['Введи имя и создай комнату или войди по коду.','Отправь ссылку коллегам: подключиться можно без регистрации.','Отвечайте на вопросы на скорость: кто быстрее, тот набирает больше очков.']}
];
// ---- шрифты
if(!d.querySelector('link[href*="family=Unbounded"]')){const l=d.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;800&family=Unbounded:wght@600;800&display=swap';d.head.appendChild(l)}
// ---- состояние
const pid=(location.pathname.split('/').pop()||'index').replace(/\.html$/,'')||'index',cur=G.find(g=>g.id===pid);
const fav=()=>LS.get('ig-fav',[]),rec=()=>LS.get('ig-rec',[]),isFav=i=>fav().includes(i);
const tog=i=>{const f=fav(),on=!f.includes(i);LS.set('ig-fav',on?[i,...f]:f.filter(x=>x!==i));return on};
if(cur)LS.set('ig-rec',[cur.id,...rec().filter(x=>x!==cur.id)].slice(0,8));
const pl=n=>n%10===1&&n%100!==11?'игра':[2,3,4].includes(n%10)&&![12,13,14].includes(n%100)?'игры':'игр';
// ---- стили внутри теневых блоков (изолированы от стилей игр)
const CSS=`*{box-sizing:border-box}:host{display:block;font-family:var(--ff);color:var(--ink);line-height:1.5}
a{color:inherit;text-decoration:none}button{font:inherit;color:inherit;cursor:pointer;border:0;background:none;padding:0}h2,h3,h4,p,ol{margin:0}:focus-visible{outline:3px solid var(--acc);outline-offset:2px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:12px;font-weight:600;font-size:14px;background:var(--acc);color:var(--accInk);transition:transform .2s,box-shadow .25s}.btn:hover{transform:translateY(-2px);box-shadow:0 10px 22px -10px var(--acc)}
.pk{background:linear-gradient(135deg,var(--pink),var(--vio));color:#fff}
.chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:99px;font-size:13px;font-weight:600;background:var(--glass);border:1px solid var(--line);color:var(--mute)}a.chip:hover{color:var(--acc);border-color:var(--acc)}
.logo{display:flex;align-items:center;gap:10px;font:800 17px var(--fd);letter-spacing:-.01em}
.lg{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,var(--vio),var(--acc));box-shadow:0 8px 20px -8px var(--vio);transition:transform .3s}.logo:hover .lg{transform:rotate(-8deg) scale(1.07)}
.hd{position:fixed;top:0;left:0;right:0;z-index:40;height:var(--igh);padding-top:env(safe-area-inset-top,0px);background:var(--glass);-webkit-backdrop-filter:blur(16px) saturate(1.5);backdrop-filter:blur(16px) saturate(1.5);border-bottom:1px solid transparent;transition:border-color .25s,box-shadow .25s}
.hd.sc{border-color:var(--line);box-shadow:0 10px 30px -20px rgba(0,0,0,.6)}
.in{max-width:1120px;height:60px;margin:0 auto;padding:0 clamp(14px,3vw,24px);display:flex;align-items:center;gap:14px}
nav.m{display:flex;gap:4px;margin-left:10px}nav.m a{padding:8px 13px;border-radius:10px;font-weight:500;color:var(--mute);transition:.2s}nav.m a:hover,nav.m a.on{color:var(--ink);background:var(--glass)}
.rt{margin-left:auto;display:flex;align-items:center;gap:8px}
.ico{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:var(--glass);border:1px solid var(--line);font-size:17px;transition:.2s}.ico:hover{transform:translateY(-2px);border-color:var(--acc)}
.mb{display:none}.mn{position:absolute;top:100%;right:12px;left:12px;max-width:340px;margin-left:auto;padding:8px;border-radius:18px;background:var(--card);border:1px solid var(--line);box-shadow:0 24px 50px -20px rgba(0,0,0,.6);animation:pop .2s ease-out}
.mn a{display:block;padding:12px 14px;border-radius:12px;font-weight:500}.mn a:hover{background:var(--glass)}@keyframes pop{from{opacity:0;transform:translateY(-8px) scale(.98)}}
@media(max-width:720px){nav.m{display:none}.mb{display:grid}.btn.pk span{display:none}.btn.pk{padding:0;width:40px;height:40px;justify-content:center;font-size:17px}}
.gb{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:2px 0}
.bc{display:flex;align-items:center;gap:8px;min-width:0;font-size:14px;color:var(--mute)}.bc a:hover{color:var(--acc)}.bc b{color:var(--ink);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ac{display:flex;gap:6px}.ac button{height:38px;min-width:38px;padding:0 11px;border-radius:11px;background:var(--glass);border:1px solid var(--line);font-size:15px;display:flex;align-items:center;justify-content:center;gap:6px;transition:.2s}.ac button:hover{transform:translateY(-2px);border-color:var(--acc)}.ac .on{color:var(--pink);border-color:var(--pink)}.ac span{display:none;font-size:13px;font-weight:600}@media(min-width:640px){.ac span{display:inline}}
.tt{position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);z-index:50;padding:10px 16px;border-radius:12px;background:#141a35;color:#fff;font-size:14px;opacity:0;pointer-events:none;transition:.25s}.tt.on{opacity:1;transform:translate(-50%,0)}
.wr{max-width:1000px;margin:0 auto;padding:0 clamp(10px,3vw,20px) 6px}.ab{display:grid;gap:14px;grid-template-columns:1.2fr 1fr}@media(max-width:760px){.ab{grid-template-columns:1fr}}
.pn{background:var(--glass);border:1px solid var(--line);border-radius:22px;padding:20px 22px}.pn h2{font:700 18px var(--fd);margin-bottom:10px}.pn p{color:var(--mute);line-height:1.65}.pn ol{padding-left:20px;color:var(--mute);line-height:1.6}.pn li{margin:7px 0}.pn li::marker{color:var(--acc);font-weight:700}
.meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}h2.sec{font:700 20px var(--fd);margin:30px 0 14px}.sh{display:flex;align-items:baseline;justify-content:space-between;gap:12px}.sh .sub{color:var(--mute);font-size:14px}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}.grid.two{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
.row{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 2px 16px;margin:0 -2px;scrollbar-width:none}.row::-webkit-scrollbar{display:none}.row .gc{flex:0 0 min(78%,290px);scroll-snap-align:start}
.gc{position:relative;display:flex;flex-direction:column;border-radius:22px;background:var(--card);border:1px solid var(--line);overflow:hidden;transition:transform .28s,box-shadow .28s,border-color .28s}
.gc:hover{transform:translateY(-6px);border-color:hsl(var(--h) 80% 60%/.7);box-shadow:0 24px 44px -22px hsl(var(--h) 90% 55%/.6)}.lk{position:absolute;inset:0;z-index:2;border-radius:22px}
.art{position:relative;height:150px;display:grid;place-items:center;overflow:hidden;background:linear-gradient(135deg,hsl(var(--h) 78% 54%),hsl(calc(var(--h) + 50) 80% 28%))}
.art::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 75% 15%,rgba(255,255,255,.38),transparent 45%),radial-gradient(circle at 15% 95%,rgba(0,0,0,.35),transparent 55%)}.gc.big .art{height:190px}
.em{position:relative;font-size:62px;line-height:1;filter:drop-shadow(0 10px 14px rgba(0,0,0,.35));transition:transform .4s cubic-bezier(.2,.8,.2,1)}.em i{font-style:normal;font-size:.62em;margin-left:-.1em}.gc:hover .em{transform:scale(1.14) rotate(-5deg)}
.bdg{position:absolute;left:12px;top:12px;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;background:#ffc247;color:#251a00}
.fv{position:absolute;z-index:3;top:10px;right:10px;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-size:18px;color:#fff;background:rgba(10,12,30,.42);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);transition:.2s}.fv:hover{transform:scale(1.12)}.fv.on{color:#ff6b9d}
.bd{display:flex;flex-direction:column;gap:8px;padding:16px 18px 18px;flex:1}.bd h3{font:700 17px var(--fd)}.mt{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:12.5px;font-weight:600;color:var(--mute)}
.bd p{font-size:14px;line-height:1.55;color:var(--mute);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.go{margin-top:auto;padding-top:6px;font-weight:700;color:var(--acc);font-size:14px}.go b{display:inline-block;transition:transform .25s}.gc:hover .go b{transform:translateX(5px)}
.sug .art{background:repeating-linear-gradient(135deg,var(--card),var(--card) 12px,var(--glass) 12px,var(--glass) 24px)}.sug .art::before{display:none}
.tb{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:22px 0 14px}
.sb{flex:1 1 260px;display:flex;align-items:center;gap:10px;padding:0 16px;height:50px;border-radius:15px;background:var(--glass);border:1px solid var(--line);transition:.2s}.sb:focus-within{border-color:var(--acc);box-shadow:0 0 0 4px rgba(53,224,176,.2)}
.sb input{flex:1;min-width:0;height:100%;border:0;outline:0;background:none;color:var(--ink);font:500 16px var(--ff)}
select{height:50px;padding:0 14px;border-radius:15px;background:var(--glass);border:1px solid var(--line);color:var(--ink);font:500 15px var(--ff)}
.chips{display:flex;gap:8px;overflow-x:auto;padding:2px 0 6px;scrollbar-width:none}.chips::-webkit-scrollbar{display:none}
.cp{flex:none;padding:9px 16px;border-radius:99px;font-weight:600;font-size:14px;background:var(--glass);border:1px solid var(--line);color:var(--mute);transition:.2s}.cp i{font-style:normal;opacity:.65;margin-left:4px}.cp:hover{color:var(--ink);border-color:var(--acc)}.cp.on{background:var(--acc);color:var(--accInk);border-color:var(--acc)}
.em0{text-align:center;padding:40px 10px;color:var(--mute)}.em0 span{font-size:48px;display:block}.lnk{color:var(--acc);font-weight:700;text-decoration:underline}
.rise{animation:rise .55s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i,0)*70ms)}@keyframes rise{from{opacity:0;transform:translateY(14px)}}
.ft{margin-top:44px;border-top:1px solid var(--line);background:var(--glass)}
.fi{max-width:1120px;margin:0 auto;padding:36px clamp(14px,3vw,24px) 18px;display:grid;gap:26px;grid-template-columns:1.4fr 1fr 1fr 1fr}@media(max-width:760px){.fi{grid-template-columns:1fr 1fr}.fb{grid-column:1/-1}}
.fb p{color:var(--mute);margin-top:12px;max-width:34ch;line-height:1.6;font-size:14px}.ft h4{font:700 13px var(--fd);text-transform:uppercase;letter-spacing:.06em;color:var(--mute);margin-bottom:12px}
.fi a:not(.logo){display:block;padding:5px 0;color:var(--ink);font-weight:500;font-size:15px;transition:color .2s,transform .2s}.fi a:not(.logo):hover{color:var(--acc);transform:translateX(3px)}
.cp2{max-width:1120px;margin:0 auto;padding:14px clamp(14px,3vw,24px) calc(22px + env(safe-area-inset-bottom,0px));color:var(--mute);font-size:13px;border-top:1px solid var(--line)}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;
let SH=null;try{SH=new CSSStyleSheet();SH.replaceSync(CSS)}catch(e){SH=null} // один общий стиль для всех блоков (быстрее и легче)
const mk=html=>{const h=d.createElement('div');h.className='ig-host';const r=h.attachShadow({mode:'open'});if(SH&&'adoptedStyleSheets'in r){r.adoptedStyleSheets=[SH];r.innerHTML=html}else r.innerHTML='<style>'+CSS+'</style>'+html;return[h,r]};
const logo='<a class="logo" href="index.html" aria-label="Игротека, на главную"><span class="lg"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="5"/><path d="M7 10v4M5 12h4M15.5 11.5h.01M18 13h.01"/></svg></span>Игротека</a>';
const card=(g,big,i)=>{const f=isFav(g.id);return`<article class="gc${big?' big':''} rise" style="--h:${g.h};--i:${i||0}"><a class="lk" href="${g.u}" aria-label="Играть: ${esc(g.t)}"></a><div class="art"><span class="em">${g.e}${g.e2?`<i>${g.e2}</i>`:''}</span>${g.b?`<span class="bdg">${g.b}</span>`:''}</div><button class="fv${f?' on':''}" data-fav="${g.id}" aria-pressed="${f}" aria-label="В избранное">${f?'♥':'♡'}</button><div class="bd"><h3>${esc(g.t)}</h3><div class="mt"><span>${CATS[g.c]}</span><span>⏱ ${g.m}</span><span>${g.mode}</span></div><p>${esc(g.s)}</p><span class="go">Играть <b>→</b></span></div></article>`};
const favWire=r=>r.addEventListener('click',e=>{const b=e.target.closest('[data-fav]');if(!b||b.dataset.done)return;const on=tog(b.dataset.fav);b.classList.toggle('on',on);b.textContent=on?'♥':'♡';b.setAttribute('aria-pressed',on)});
// ---- шапка
function header(){
  const nav=[['index.html#catalog','Игры'],['guide.html','Руководство'],['about.html','О проекте']],more=nav.concat([['donate.html','Поддержать автора'],['privacy.html','Конфиденциальность']]);
  const on=u=>u.split('#')[0].replace('.html','')===pid?' class="on" aria-current="page"':'';
  const[h,r]=mk(`<header class="hd" id="hd"><div class="in">${logo}<nav class="m" aria-label="Основная навигация">${nav.map(n=>`<a href="${n[0]}"${on(n[0])}>${n[1]}</a>`).join('')}</nav><div class="rt"><a class="chip" id="wal" href="donate.html" title="Кристаллы" hidden>💠 0</a><a class="ico" href="index.html#search" aria-label="Поиск игр">🔍</a><a class="btn pk" href="donate.html">💖<span>Поддержать</span></a><button class="ico mb" id="bg" aria-label="Меню" aria-expanded="false">☰</button></div></div><div class="mn" id="mn" hidden>${more.map(n=>`<a href="${n[0]}">${n[1]}</a>`).join('')}</div></header>`);
  const hd=r.getElementById('hd'),bg=r.getElementById('bg'),mn=r.getElementById('mn');
  bg.onclick=()=>{mn.hidden=!mn.hidden;bg.setAttribute('aria-expanded',!mn.hidden);bg.textContent=mn.hidden?'☰':'✕'};
  r.addEventListener('click',e=>{if(e.target.closest('#mn a'))mn.hidden=true});
  const sc=()=>hd.classList.toggle('sc',scrollY>6);addEventListener('scroll',sc,{passive:true});sc();
  if(window.Igro){const w=r.getElementById('wal');w.hidden=false;const u=()=>{w.textContent='💠 '+Igro.bal()};try{Igro.on(u);u()}catch(e){w.hidden=true}}
  return h}
// ---- панель игры над окном
function gamebar(app){
  const mw=getComputedStyle(app).maxWidth,[h,r]=mk(`<div class="gb"><nav class="bc" aria-label="Навигация"><a href="index.html">Игры</a><span>›</span><b>${esc(cur.t)}</b></nav><div class="ac"><button id="fv" aria-pressed="false" title="В избранное">♡<span>Избранное</span></button><button id="sh" title="Поделиться">⤴<span>Поделиться</span></button><button id="fs" title="На весь экран">⛶<span>На весь экран</span></button></div></div><div class="tt" id="tt" role="status"></div>`);
  h.style.cssText='display:block;margin:6px auto 0;width:calc(100% - 20px);max-width:'+(mw&&mw!=='none'?mw:'640px');
  const $=i=>r.getElementById(i),say=m=>{const t=$('tt');t.textContent=m;t.classList.add('on');clearTimeout(say.t);say.t=setTimeout(()=>t.classList.remove('on'),2200)};
  const paint=()=>{const f=isFav(cur.id),b=$('fv');b.firstChild.nodeValue=f?'♥':'♡';b.classList.toggle('on',f);b.setAttribute('aria-pressed',f)};paint();
  $('fv').onclick=()=>{tog(cur.id);paint();say(isFav(cur.id)?'Добавлено в избранное':'Убрано из избранного')};
  $('sh').onclick=()=>{const url=location.origin+location.pathname;if(navigator.share)navigator.share({title:cur.t+' — Игротека',text:cur.s,url}).catch(()=>{});else(navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(()=>say('Ссылка скопирована')).catch(()=>say(url))};
  if(!d.fullscreenEnabled)$('fs').hidden=true;
  $('fs').onclick=()=>{d.fullscreenElement?d.exitFullscreen():d.documentElement.requestFullscreen().catch(()=>say('Полный экран недоступен'))};
  return h}
// ---- описание, управление и похожие игры под окном
function about(){
  const rel=G.filter(g=>g.id!==cur.id).sort((a,b)=>(b.c===cur.c)-(a.c===cur.c)||b.p-a.p).slice(0,3);
  const[h,r]=mk(`<div class="wr"><div class="ab"><section class="pn"><h2>О игре «${esc(cur.t)}»</h2><p>${esc(cur.d)}</p><div class="meta"><span class="chip">${CATS[cur.c]}</span><span class="chip">⏱ ${cur.m}</span><span class="chip">${cur.mode}</span>${cur.g?`<a class="chip" href="${cur.g}">📖 Руководство</a>`:''}</div></section><section class="pn"><h2>Как играть</h2><ol>${cur.how.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></section></div><h2 class="sec">Похожие игры</h2><div class="grid">${rel.map((g,i)=>card(g,0,i)).join('')}</div></div>`);
  favWire(r);return h}
// ---- подвал
function footer(){
  const[h]=mk(`<footer class="ft"><div class="fi"><div class="fb">${logo}<p>Бесплатные игры в браузере. Без скачивания и регистрации.</p></div><div><h4>Игры</h4>${G.map(g=>`<a href="${g.u}">${esc(g.t)}</a>`).join('')}</div><div><h4>Проект</h4><a href="about.html">О проекте</a><a href="guide.html">Руководство</a><a href="privacy.html">Политика конфиденциальности</a><a href="mailto:${MAIL}">Контакты</a></div><div><h4>Поддержка</h4><a href="donate.html">💖 Поддержать автора</a><a href="mailto:${MAIL}?subject=${encodeURIComponent('Идея для Игротеки')}">💡 Предложить игру</a></div></div><div class="cp2">© 2026 Игротека. Сделано с любовью к играм.</div></footer>`);
  return h}
// ---- каталог на главной: поиск, категории, сортировка, избранное, «продолжить»
function catalog(el){
  let Q=new URLSearchParams(location.search).get('q')||'',C='all',S='p';
  const[h,r]=mk(`<div class="tb"><label class="sb"><span aria-hidden="true">🔍</span><input id="q" type="search" placeholder="Найти игру…" aria-label="Поиск по играм" autocomplete="off" value="${esc(Q)}"></label><select id="so" aria-label="Сортировка"><option value="p">Популярные</option><option value="n">Новые</option><option value="a">По алфавиту</option></select></div><div class="chips" id="chips" role="group" aria-label="Категории"></div><div id="out"></div>`);
  const cnt=c=>c==='all'?G.length:c==='new'?G.filter(g=>g.b).length:c==='fav'?G.filter(g=>isFav(g.id)).length:G.filter(g=>g.c===c).length;
  const chips=()=>{const cs=['all',...Object.keys(CATS).filter(cnt),...(cnt('new')?['new']:[]),...(cnt('fav')?['fav']:[])];if(!cs.includes(C))C='all';r.getElementById('chips').innerHTML=cs.map(c=>`<button class="cp${c===C?' on':''}" data-c="${c}" aria-pressed="${c===C}">${c==='all'?'Все':c==='fav'?'♥ Избранное':c==='new'?'🆕 Новинки':CATS[c]}<i>${cnt(c)}</i></button>`).join('')};
  const sec=(t,sub,body)=>`<section><div class="sh"><h2 class="sec">${t}</h2>${sub?`<span class="sub">${sub}</span>`:''}</div>${body}</section>`;
  const row=l=>`<div class="row">${l.map((g,i)=>card(g,0,i)).join('')}</div>`;
  function draw(){
    const q=Q.trim().toLowerCase(),filt=!!q||C!=='all';
    const list=G.filter(g=>(C==='all'||(C==='fav'?isFav(g.id):C==='new'?!!g.b:g.c===C))&&(!q||(g.t+' '+g.s+' '+CATS[g.c]+' '+g.mode).toLowerCase().includes(q)));
    list.sort(S==='a'?(a,b)=>a.t.localeCompare(b.t,'ru'):S==='n'?(a,b)=>b.n.localeCompare(a.n)||b.p-a.p:(a,b)=>b.p-a.p);
    const seen=rec(),rc=seen.map(i=>G.find(g=>g.id===i)).filter(Boolean),fresh=G.filter(g=>!seen.includes(g.id)).sort((a,b)=>b.p-a.p);
    let o='';
    if(!filt){
      if(rc.length)o+=sec('▶ Продолжить','Ты недавно играл',row(rc.slice(0,4)));
      o+=sec('🔥 Популярные','',row([...G].sort((a,b)=>b.p-a.p).slice(0,4)));
      const nw=G.filter(g=>g.b);if(nw.length)o+=sec('🆕 Новинки','',`<div class="grid two">${nw.map((g,i)=>card(g,1,i)).join('')}</div>`);
      const pick=rc.length?fresh:G.filter(g=>!g.b).sort((a,b)=>b.p-a.p);if(pick.length)o+=sec('⭐ Рекомендуем',rc.length?'Ты ещё не пробовал':'Выбор редакции',row(pick.slice(0,4)));
    }
    o+=sec(filt?'Результаты':'Все игры',list.length+' '+pl(list.length),list.length?`<div class="grid">${list.map((g,i)=>card(g,0,i)).join('')}${filt?'':`<article class="gc sug rise" style="--h:215;--i:${list.length}"><a class="lk" href="mailto:${MAIL}?subject=${encodeURIComponent('Идея для Игротеки')}" aria-label="Предложить игру"></a><div class="art"><span class="em">💡</span></div><div class="bd"><h3>Твоя идея?</h3><p>Расскажи, какой игры тебе не хватает на сайте. Лучшие идеи попадут в разработку.</p><span class="go">Предложить игру <b>→</b></span></div></article>`}</div>`:`<div class="em0"><span>🕹️</span><p>Ничего не нашлось. Попробуй другое слово или <button class="lnk" data-c="all" data-reset="1">сбросить фильтры</button></p></div>`);
    r.getElementById('out').innerHTML=o}
  chips();draw();
  r.addEventListener('input',e=>{if(e.target.id==='q'){Q=e.target.value;draw()}});
  r.addEventListener('change',e=>{if(e.target.id==='so'){S=e.target.value;draw()}});
  r.addEventListener('click',e=>{const c=e.target.closest('[data-c]');if(c){C=c.dataset.c;if(c.dataset.reset){Q='';r.getElementById('q').value=''}chips();draw();return}const f=e.target.closest('[data-fav]');if(f){tog(f.dataset.fav);chips();draw()}});
  const go=()=>{if(location.hash==='#search'){el.scrollIntoView({block:'start'});r.getElementById('q').focus()}};go();addEventListener('hashchange',go);addEventListener('keydown',e=>{const t=e.composedPath()[0];if(e.key==='/'&&!/^(INPUT|TEXTAREA|SELECT)$/.test(t&&t.tagName)){e.preventDefault();r.getElementById('q').focus()}});
  el.replaceChildren(h)}
function init(){
  const b=d.body;b.prepend(header());
  const app=d.getElementById('app');if(cur&&app){app.before(gamebar(app));app.after(about())}
  const c=d.getElementById('catalog');if(c)catalog(c);
  b.append(footer());
  const n=d.getElementById('ng');if(n)n.textContent=G.length}
d.readyState==='loading'?d.addEventListener('DOMContentLoaded',init):init();
window.IG={games:G}})();
