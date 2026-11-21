export async function POST(req){
 const {summary}=await req.json();const key=process.env.NVIDIA_API_KEY;
 const fallback=`Your savings rate is ${summary.rate}%. ${summary.rate<20?"Try to lift it to 20% by trimming your biggest 'want' category.":"That is healthy; build a 6-month emergency fund, then start a SIP."} Top spend: ${summary.top}. ${summary.scams} suspicious message(s) were excluded.`;
 if(!key)return Response.json({text:fallback,source:"rules"});
 try{const r=await fetch("https://integrate.api.nvidia.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`},body:JSON.stringify({model:"meta/llama-3.1-70b-instruct",max_tokens:350,temperature:.3,messages:[{role:"system",content:"You are a friendly Indian personal-finance coach. Give 4 short, concrete tips in plain words. No investment guarantees."},{role:"user",content:JSON.stringify(summary)}]})});
  const j=await r.json();return Response.json({text:j.choices?.[0]?.message?.content||fallback,source:"ai"})}
 catch(e){return Response.json({text:fallback,source:"rules"})}}
