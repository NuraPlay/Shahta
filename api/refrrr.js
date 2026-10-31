const {redis}=require('../lib/provider');
const out=(res,c,o)=>{res.setHeader('Cache-Control','no-store');res.status(c).json(o)};
const ID=/^[A-Z0-9]{4}-[A-Z0-9]{4}$/,KEY=/^[a-f0-9]{24}$/;
// Приглашения в «Ферме»: считаем новых игроков, пришедших по ссылке. Награда только игровая, денег здесь нет.
module.exports=async(req,res)=>{
  try{
    if(req.method!=='POST')return out(res,405,{error:'method'});
    const b=typeof req.body==='string'?JSON.parse(req.body):(req.body||{}),a=req.query.a;
    if(a==='join'){
      if(!ID.test(b.ref||'')||!ID.test(b.pid||'')||b.ref===b.pid)return out(res,400,{error:'bad'});
      if(await redis('SET','ref:j:'+b.pid,b.ref,'NX')!=='OK')return out(res,200,{ok:true,dup:true}); // каждый новичок засчитывается один раз
      const ip=(req.headers['x-forwarded-for']||'x').split(',')[0].trim(),n=await redis('INCR','ref:ip:'+ip);
      if(n===1)await redis('EXPIRE','ref:ip:'+ip,86400);
      if(n>3)return out(res,200,{ok:true,limited:true}); // не больше 3 засчитанных новичков в сутки с одного IP
      await redis('INCR','ref:n:'+b.ref);return out(res,200,{ok:true})}
    if(a==='get'||a==='claim'){
      if(!ID.test(b.pid||'')||!KEY.test(b.k||''))return out(res,400,{error:'bad'});
      await redis('SET','ref:s:'+b.pid,b.k,'NX'); // секрет владельца: чужой человек не заберёт награду
      if(await redis('GET','ref:s:'+b.pid)!==b.k)return out(res,403,{error:'forbidden'});
      const n=+(await redis('GET','ref:n:'+b.pid))||0,c=+(await redis('GET','ref:c:'+b.pid))||0,d=a==='claim'?Math.max(0,n-c):0;
      if(d>0)await redis('INCRBY','ref:c:'+b.pid,d);
      return out(res,200,{n,c:c+d,d})}
    out(res,404,{error:'unknown'})
  }catch(e){out(res,500,{error:'server'})}
};
