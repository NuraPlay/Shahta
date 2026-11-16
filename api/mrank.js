// Мини-клиент базы Upstash Redis (REST). Переменные окружения Vercel добавляет сам, когда подключаешь базу к проекту.
const RU=(process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL||'').replace(/\/+$/,''),RT=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
async function pipe(cmds){ // несколько команд за один запрос
  if(!RU||!RT)throw new Error('db not connected');
  const r=await fetch(RU+'/pipeline',{method:'POST',headers:{Authorization:'Bearer '+RT,'Content-Type':'application/json'},body:JSON.stringify(cmds.map(c=>c.map(String)))}),j=await r.json();
  if(!Array.isArray(j))throw new Error('bad answer');
  return j.map(x=>{if(x&&x.error)throw new Error(x.error);return x?x.result:null})}
const redis=async(...c)=>(await pipe([c]))[0];
const out=(res,c,o)=>{res.setHeader('Cache-Control','no-store');res.status(c).json(o)};
const ID=/^[A-Z0-9]{4}-[A-Z0-9]{4}$/,KEY=/^[a-f0-9]{24}$/,NAME=/^[A-Za-zА-Яа-яЁё0-9 _-]{2,14}$/;
// грубый фильтр ников: только буквы, плюс корни ругательств (тот же, что в рейтинге «Фермы»)
const BAD=/хуй|хуе|хуя|хуи|пизд|пезд|ебан|ебат|ебал|ебну|ебуч|ебло|ёб|бляд|блят|мудак|мудил|сука|сучк|залуп|шлюх|пидор|пидар|гондон|fuck|shit|nigg|cunt|bitch|porn|порно|hitler|гитлер/;

// Рейтинг «Шахты» по глубине (метры): берётся самая большая глубина за всё время, «Новая шахта» её не обнуляет.
// Только ник, глубина и случайный id игрока, никаких денег. Ключи Redis, все с префиксом mrank: (с «Фермой» не пересекаются):
//   mrank:z      рейтинг: id игрока -> глубина (дробная часть = «кто раньше дошёл», при равенстве выше тот, кто был первым)
//   mrank:names  ники: id -> ник
//   mrank:p:ID   карточка игрока: s = секретный ключ владельца, t = время первого входа (мс)
//   mrank:r:ID   пауза между записями (30 секунд)
//   mrank:ip:IP  сколько новых игроков вошло с этого адреса за сутки
//   mrank:ban    множество id, которым запрещено писать в рейтинг
// Убрать игрока (читера или плохой ник): в консоли Upstash найди id командой ZREVRANGE mrank:z 0 19 WITHSCORES (места по порядку),
// ник смотри в HGET mrank:names ID, потом: ZREM mrank:z ID, HDEL mrank:names ID, SADD mrank:ban ID (бан нужен, иначе игра добавит его снова).

// Потолок роста. Глубина после «Новых шахт» растёт очень быстро (почти взрывом), поэтому линейный лимит, как в «Ферме», не подходит.
// Таблица получена симуляцией самого быстрого бота: 10 и 25 кликов в секунду без перерыва, бонус ×2 всегда включён,
// идеальные покупки, исследования, артефакты, сброс при разных порогах. Пары: секунды с начала игры -> глубина, м.
const ENV=[[0,0],[60,42],[120,109],[180,172],[300,271],[450,373],[600,576],[900,1980],[1200,9333],[1800,335672],[2700,5329785],[3600,13423978],[5400,28811696],[7200,44605165],[10800,78122195],[21600,173972210],[43200,387403187],[86400,759815840],[172800,1510982771],[345600,2866901214],[604800,4790988828],[1209600,9090402234],[2592000,18685816859]];
function env(t){
  if(!(t>0))return 0;
  if(t<=ENV[1][0])return ENV[1][1]*t/ENV[1][0];
  let i=2;while(i<ENV.length-1&&t>ENV[i][0])i++; // отрезок [i-1,i]; после последней точки продолжаем тот же наклон
  const a=ENV[i-1],b=ENV[i],k=(Math.log(b[1])-Math.log(a[1]))/(Math.log(b[0])-Math.log(a[0]));
  return Math.exp(Math.log(a[1])+k*(Math.log(t)-Math.log(a[0])))}
// Запас: время считаем вдвое быстрее и добавляем +50% к глубине, чтобы не обрезать честных игроков. Отсчёт идёт от первого входа в рейтинг,
// поэтому тот, кто давно играет, догоняет свой настоящий результат за час-два, а не сразу.
const cap=sec=>Math.floor(1.5*env(Math.min(2*sec+60,31536000))+300);

module.exports=async(req,res)=>{
  try{
    if(req.method!=='POST')return out(res,405,{error:'method'});
    let b=req.body;if(typeof b==='string'){try{b=JSON.parse(b)}catch(e){return out(res,400,{error:'bad'})}}b=b||{};
    const a=req.query&&req.query.a;
    if(a==='top'){
      const pid=ID.test(b.pid||'')?b.pid:null; // без id тоже можно смотреть таблицу
      const q=[['ZREVRANGE','mrank:z','0','19','WITHSCORES'],['ZCARD','mrank:z']];
      if(pid)q.push(['ZREVRANK','mrank:z',pid],['ZSCORE','mrank:z',pid]);
      const [z,total,r,s]=await pipe(q),ids=[],sc=[];
      for(let i=0;i<z.length;i+=2){ids.push(z[i]);sc.push(Math.floor(parseFloat(z[i+1])))}
      const nm=ids.length?await redis('HMGET','mrank:names',...ids):[];
      return out(res,200,{top:ids.map((id,i)=>({n:nm[i]||'Шахтёр',s:sc[i],m:id===pid?1:0})),me:r===null||r===undefined?null:{r:+r+1,s:Math.floor(parseFloat(s))},total:+total||0})}
    if(a==='set'){
      if(!ID.test(b.pid||'')||!KEY.test(b.k||''))return out(res,400,{error:'bad'});
      let nm=null;
      if(typeof b.name==='string'){nm=b.name.trim().replace(/\s+/g,' ');if(!NAME.test(nm)||BAD.test(nm.toLowerCase().replace(/[^a-zа-яё]/g,'')))return out(res,400,{error:'name'})}
      const want=Math.floor(+b.score);if(!(want>=0&&want<=1e12))return out(res,400,{error:'score'});
      const P='mrank:p:'+b.pid,now=Date.now();
      const [ban,h,zs]=await pipe([['SISMEMBER','mrank:ban',b.pid],['HMGET',P,'s','t'],['ZSCORE','mrank:z',b.pid]]);
      if(+ban)return out(res,403,{error:'banned'});
      let t0=+h[1]||0;
      if(h[0]===null){ // новый игрок: нужен ник, и не больше 12 новичков в сутки с одного адреса
        if(!nm)return out(res,400,{error:'name'});
        const ip=String(req.headers['x-forwarded-for']||'x').split(',')[0].trim(),ik='mrank:ip:'+ip,n=+(await pipe([['INCR',ik],['EXPIRE',ik,'86400','NX']]))[0];
        if(n>12)return out(res,429,{error:'ip'});
        const c=await pipe([['HSETNX',P,'s',b.k],['HSETNX',P,'t',String(now)]]); // секрет владельца: чужой человек не изменит твою запись
        if(+c[0]!==1&&(await redis('HGET',P,'s'))!==b.k)return out(res,403,{error:'forbidden'});
        t0=+(await redis('HGET',P,'t'))||now}
      else if(h[0]!==b.k)return out(res,403,{error:'forbidden'});
      if(await redis('SET','mrank:r:'+b.pid,'1','EX','30','NX')!=='OK')return out(res,429,{error:'slow'}); // не чаще раза в 30 секунд
      const old=zs===null?-1:Math.floor(parseFloat(zs)),s=Math.min(want,cap((now-t0)/1000)),w=[];
      if(s>old)w.push(['ZADD','mrank:z',String(s+1-now/1e13),b.pid]); // растёт только вверх; при равенстве раньше дошедший выше
      if(nm)w.push(['HSET','mrank:names',b.pid,nm]);
      if(h[0]!==null&&!h[1])w.push(['HSETNX',P,'t',String(now)]);
      if(w.length)await pipe(w);
      return out(res,200,{s:Math.max(s,old),l:want>s?1:0})} // l=1: результат урезан потолком роста
    out(res,404,{error:'unknown'})
  }catch(e){console.error('mrank',e&&e.message);out(res,500,{error:'server'})}
};
