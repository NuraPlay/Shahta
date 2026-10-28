/* wallet.js: общий кошелёк Игротеки (💠 кристаллы). Подключается на страницах игр и на donate.html.
   Игра регистрирует обмен: Igro.game({id,name,icon,unit,per:()=>число,give:n=>{...},fmt:необязательно})
   и открывает окно обмена: Igro.open(id).
   Для будущих покупок «фишек»: if(Igro.spend(20)){ ...включить фишку... } */
(function(){
'use strict';
var K='igroteka_pay',G={},L=[],cur=null;
var CSS='#igw{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}'
+'#igw .igw-c{background:#1d2430;color:#eef2f8;border:1.5px solid #3a4558;border-radius:18px;padding:18px;max-width:380px;width:100%;line-height:1.5;text-align:left}'
+'#igw h3{margin:0 0 6px;font-size:20px;color:#eef2f8}#igw p{margin:6px 0;color:#eef2f8}'
+'#igw-bt{display:grid;gap:8px;margin:10px 0}#igw-bt button{font:inherit;font-weight:700;border:0;border-radius:12px;padding:12px;background:#ff6b9a;color:#2a0a16;cursor:pointer}'
+'#igw .igw-x{font:inherit;font-weight:700;width:100%;border:1.5px solid #3a4558;background:transparent;color:#eef2f8;border-radius:12px;padding:11px;margin-top:8px;cursor:pointer}'
+'#igw .igw-l{display:block;text-align:center;color:#ff8fb1;margin-top:6px}#igw-m{color:#3dd6a8!important;font-weight:700;min-height:1.5em}';
function rd(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch(e){return{}}}
function wr(p){try{localStorage.setItem(K,JSON.stringify(p));return true}catch(e){return false}}
function load(){var p=rd();p.used=p.used||[];p.bal=+p.bal||0;p.sum=+p.sum||0;
  if(!p.id){var A='23456789ABCDEFGHJKMNPQRSTUVWXYZ',r=crypto.getRandomValues(new Uint8Array(8)),s='',i;for(i=0;i<8;i++)s+=A[r[i]%A.length];p.id=s.slice(0,4)+'-'+s.slice(4);wr(p)}
  return p}
function fire(){L.forEach(function(f){try{f()}catch(e){}});if(cur)try{cur()}catch(e){}}
function fnum(n){return Math.floor(n).toLocaleString('ru-RU')}
function shut(){var o=document.getElementById('igw');if(o)o.remove();cur=null}
var Igro=window.Igro={
  id:function(){return load().id},
  bal:function(){return load().bal},
  sum:function(){return load().sum},
  credit:function(n,nonce){var p=load();if(!(n>0)||p.used.indexOf(nonce)>=0)return false;p.used.push(nonce);p.bal+=n;p.sum+=n;if(!wr(p))return false;fire();return true},
  spend:function(n){var p=load();if(!(n>0)||p.bal<n)return false;p.bal-=n;if(!wr(p))return false;fire();return true},
  on:function(f){L.push(f)},
  game:function(c){G[c.id]=c},
  open:function(id){var c=G[id];if(!c)return;shut();
    if(!document.getElementById('igw-css')){var st=document.createElement('style');st.id='igw-css';st.textContent=CSS;document.head.appendChild(st)}
    var o=document.createElement('div');o.id='igw';
    o.innerHTML='<div class="igw-c" role="dialog" aria-modal="true" aria-label="Обмен кристаллов"><h3>💠 Обмен кристаллов</h3><p id="igw-b"></p><p id="igw-r"></p><div id="igw-bt"></div><p id="igw-m"></p><a class="igw-l" href="donate.html">Купить кристаллы и поддержать автора</a><button class="igw-x" id="igw-x">Закрыть</button></div>';
    document.body.appendChild(o);
    var F=c.fmt||fnum,$=function(i){return document.getElementById(i)};
    function draw(){var bal=Igro.bal(),per=Math.floor(c.per()),h='';
      $('igw-b').innerHTML='На кошельке: <b>💠 '+fnum(bal)+'</b>';
      $('igw-r').innerHTML='1 💠 = <b>'+F(per)+' '+c.icon+'</b> · '+c.unit;
      if(bal<1){$('igw-bt').innerHTML='<p>Кристаллов пока нет. Их можно купить на странице поддержки.</p>';return}
      [1,5,10,50,bal].filter(function(n,i,a){return n<=bal&&a.indexOf(n)===i}).forEach(function(n){h+='<button data-n="'+n+'">'+(n===bal&&n>1?'Всё: ':'')+'💠 '+fnum(n)+' → '+F(n*per)+' '+c.icon+'</button>'});
      $('igw-bt').innerHTML=h}
    o.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button');
      if(e.target===o||(b&&b.id==='igw-x')){shut();return}
      if(b&&b.dataset.n){var n=+b.dataset.n,per=Math.floor(c.per());
        if(!Igro.spend(n)){$('igw-m').textContent='Не хватает кристаллов';draw();return}
        try{c.give(n*per);$('igw-m').textContent='Готово! Начислено '+F(n*per)+' '+c.icon}
        catch(x){var p=load();p.bal+=n;wr(p);fire();$('igw-m').textContent='Не получилось, кристаллы возвращены'}
        draw()}});
    cur=draw;draw();$('igw-x').focus()}
};
addEventListener('keydown',function(e){if(e.key==='Escape')shut()});
addEventListener('storage',function(e){if(e.key===K)fire()});
})();
