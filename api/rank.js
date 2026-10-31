// Мини-клиент базы Upstash Redis (REST). Переменные окружения Vercel добавляет сам, когда подключаешь базу к проекту.
const RU=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL,RT=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
async function redis(...cmd){
  if(!RU||!RT)throw new Error('db not connected');
  const r=await fetch(RU,{method:'POST',headers:{Authorization:'Bearer '+RT},body:JSON.stringify(cmd.map(String))}),j=await r.json();
  if(j.error)throw new Error(j.error);return j.result}
const out=(res,c,o)=>{res.setHeader('Cache-Control','no-store');res.status(c).json(o)};
const ID=/^[A-Z0-9]{4}-[A-Z0-9]{4}$/,KEY=/^[a-f0-9]{24}$/,NAME=/^[A-Za-zА-Яа-яЁё0-9 _-]{2,14}$/;
// грубый фильтр ников: только буквы и цифры, плюс корни ругательств. Плохой ник можно удалить в Upstash: HDEL rank:names ID и ZREM rank:z ID
const BAD=/хуй|хуе|хуя|хуи|пизд|пезд|ебан|ебат|ебал|ебну|ебуч|ебло|ёб|бляд|блят|мудак|мудил|сука|сучк|залуп|шлюх|пидор|пидар|гондон|fuck|shit|nigg|cunt|bitch|porn|порно|hitler|гитлер/;
// Рейтинг фермеров по очкам опыта. Только ник и очки, никаких денег.
module.exports=async(req,res)=>{
  try{
    if(req.method!=='POST')return out(res,405,{error:'method'});
    const b=typeof req.body==='string'?JSON.parse(req.body):(req.body||{}),a=req.query.a;
    if(!ID.test(b.pid||''))return out(res,400,{error:'bad'});
    if(a==='top'){
      const z=await redis('ZREVRANGE','rank:z','0','19','WITHSCORES'),ids=[],sc=[];
      for(let i=0;i<z.length;i+=2){ids.push(z[i]);sc.push(+z[i+1])}
      const nm=ids.length?await redis('HMGET','rank:names',...ids):[];
      const r=await redis('ZREVRANK','rank:z',b.pid),s=await redis('ZSCORE','rank:z',b.pid),total=+(await redis('ZCARD','rank:z'))||0;
      return out(res,200,{top:ids.map((id,i)=>({n:nm[i]||'Фермер',s:sc[i],m:id===b.pid?1:0})),me:r===null?null:{r:+r+1,s:+s},total})}
    if(a==='set'){
      if(!KEY.test(b.k||''))return out(res,400,{error:'bad'});
      await redis('SET','ref:s:'+b.pid,b.k,'NX'); // секрет владельца: чужой человек не изменит твою запись
      if(await redis('GET','ref:s:'+b.pid)!==b.k)return out(res,403,{error:'forbidden'});
      let nm=null;
      if(typeof b.name==='string'){nm=b.name.trim().replace(/\s+/g,' ');if(!NAME.test(nm)||BAD.test(nm.toLowerCase().replace(/[^a-zа-яё]/g,'')))return out(res,400,{error:'name'})}
      const want=Math.floor(+b.score);if(!(want>=0&&want<=1e9))return out(res,400,{error:'score'});
      if(await redis('SET','rank:r:'+b.pid,'1','EX','30','NX')!=='OK')return out(res,429,{error:'slow'}); // не чаще раза в 30 секунд
      const old=+(await redis('ZSCORE','rank:z',b.pid))||0,t0=await redis('SET','rank:t:'+b.pid,String(Date.now()),'NX')==='OK'?Date.now():(+(await redis('GET','rank:t:'+b.pid))||Date.now()),lim=Math.min(old?Math.floor(old*1.15+20000):300000,20000+Math.floor((Date.now()-t0)/1000*150)),s=Math.min(want,lim); // режем скачки и темп быстрее человеческого
      if(nm)await redis('HSET','rank:names',b.pid,nm);
      if(s>old||!old)await redis('ZADD','rank:z',String(s),b.pid);
      return out(res,200,{s:Math.max(s,old)})}
    out(res,404,{error:'unknown'})
  }catch(e){out(res,500,{error:'server'})}
};
