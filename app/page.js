"use client";
import {useState,useEffect,useRef,useCallback} from "react";
import QRCode from "qrcode";
import {SAMPLE,analyse,scamScore,sipFV,compareTax,inr,healthScore,vpaCheck,buildUpi,checkUpiLink} from "../lib/engine";

const NAV=[["home","🏠","Home"],["upi","⚡","UPI"],["scam","🛡️","Scam Guard"],["tax","🧾","Tax"],["wealth","🚀","Wealth"]];
const PAL=["#7c83ff","#2dd4a8","#fbbf24","#fb7185","#38bdf8","#c084fc","#fb923c","#a3e635","#94a3b8"];

function useCount(v){const [n,setN]=useState(0);const from=useRef(0);
 useEffect(()=>{let raf,t0;const a=from.current,d=700;const f=t=>{t0=t0||t;const p=Math.min((t-t0)/d,1),e=1-Math.pow(1-p,3);setN(a+(v-a)*e);if(p<1)raf=requestAnimationFrame(f);else from.current=v};raf=requestAnimationFrame(f);return()=>cancelAnimationFrame(raf)},[v]);return n}
const Num=({v,pre="₹",suf=""})=>{const n=useCount(v);return <>{pre}{Math.round(n).toLocaleString("en-IN")}{suf}</>};

function Ring({score}){const n=useCount(score),r=52,c=2*Math.PI*r,col=score>=70?"#2dd4a8":score>=45?"#fbbf24":"#fb7185";
 return <svg width="140" height="140" viewBox="0 0 140 140"><circle cx="70" cy="70" r={r} stroke="#ffffff30" strokeWidth="12" fill="none"/><circle cx="70" cy="70" r={r} stroke={col} strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c*(1-n/100)} transform="rotate(-90 70 70)"/><text x="70" y="68" textAnchor="middle" fill="#fff" fontSize="32" fontWeight="800">{Math.round(n)}</text><text x="70" y="88" textAnchor="middle" fill="#ffffffcc" fontSize="11">HEALTH SCORE</text></svg>}

function Donut({data}){const [a,setA]=useState(null);const tot=data.reduce((s,[,v])=>s+v,0)||1;let off=0;const r=70,c=2*Math.PI*r;
 return <div style={{display:"flex",gap:22,alignItems:"center",flexWrap:"wrap"}}>
  <svg width="190" height="190" viewBox="0 0 190 190"><g transform="rotate(-90 95 95)">{data.map(([k,v],i)=>{const l=v/tot*c,el=<circle key={k} cx="95" cy="95" r={r} fill="none" stroke={PAL[i%9]} strokeWidth={a===i?26:20} strokeDasharray={`${Math.max(l-2,0)} ${c}`} strokeDashoffset={-off} style={{transition:".25s",cursor:"pointer"}} onMouseEnter={()=>setA(i)} onMouseLeave={()=>setA(null)}/>;off+=l;return el})}</g>
   <text x="95" y="92" textAnchor="middle" fill="currentColor" fontSize="20" fontWeight="800">{a===null?inr(tot):inr(data[a][1])}</text><text x="95" y="112" textAnchor="middle" fill="#8b92a8" fontSize="11">{a===null?"total spent":data[a][0]}</text></svg>
  <div style={{flex:1,minWidth:180}}>{data.map(([k,v],i)=><div key={k} className={"leg "+(a===i?"on":"")} onMouseEnter={()=>setA(i)} onMouseLeave={()=>setA(null)}><i style={{background:PAL[i%9]}}/>{k}<s>{(v/tot*100).toFixed(0)}% · {inr(v)}</s></div>)}</div></div>}

export default function App(){
 const [tab,setTab]=useState("home"),[text,setText]=useState(""),[R,setR]=useState(null),[theme,setTheme]=useState("dark"),[toast,setToast]=useState("");
 const say=useCallback(m=>{setToast(m);setTimeout(()=>setToast(""),1800)},[]);
 useEffect(()=>{try{const t=localStorage.getItem("pp_sms");if(t){setText(t);setR(analyse(t))}const th=localStorage.getItem("pp_th");if(th)setTheme(th)}catch{}},[]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;try{localStorage.setItem("pp_th",theme)}catch{}},[theme]);
 const run=t=>{setR(analyse(t));try{localStorage.setItem("pp_sms",t)}catch{}};
 const P={R,text,setText,run,say,go:setTab};
 return <div className="app">
  <aside className="side"><div className="logo">🧭 <b>PaisaPilot</b></div>
   {NAV.map(([k,i,l])=><button key={k} className={"nv "+(tab===k?"on":"")} onClick={()=>setTab(k)}><span>{i}</span>{l}</button>)}
   <div className="sp"/><button className="nv" onClick={()=>setTheme(theme==="dark"?"light":"dark")}><span>{theme==="dark"?"☀️":"🌙"}</span>{theme==="dark"?"Light":"Dark"} mode</button>
   <div className="mu sm" style={{padding:"8px 12px"}}>🔒 Private: runs in your browser</div></aside>
  <main key={tab}>
   {tab==="home"&&<Home {...P}/>}{tab==="upi"&&<Upi {...P}/>}{tab==="scam"&&<Scam {...P}/>}{tab==="tax"&&<Tax/>}{tab==="wealth"&&<Wealth {...P}/>}
   <p className="mu sm" style={{marginTop:28}}>Educational tool, not financial/tax advice. Tax slabs are FY 2025-26 estimates without surcharge; verify on incometax.gov.in. UPI links open your own UPI app; PaisaPilot never touches your money.</p>
  </main>
  <nav className="bot">{NAV.map(([k,i,l])=><button key={k} className={tab===k?"on":""} onClick={()=>setTab(k)}><span>{i}</span>{l.split(" ")[0]}</button>)}</nav>
  {toast&&<div className="toast">{toast}</div>}</div>}

function Home({R,text,setText,run,go,say}){
 const [ai,setAi]=useState(null),[busy,setBusy]=useState(false);
 const hs=healthScore(R),ents=R?Object.entries(R.by).sort((a,b)=>b[1]-a[1]):[];
 const explain=async()=>{setBusy(true);const r=await fetch("/api/explain",{method:"POST",body:JSON.stringify({rate:Math.round(R.rate),income:R.inc,spend:R.spend,top:ents[0]?ents[0][0]:"n/a",categories:R.by,scams:R.flags.filter(f=>f.score>=40).length})});setAi(await r.json());setBusy(false)};
 const demo=()=>{setText(SAMPLE);run(SAMPLE);say("Demo data loaded")};
 const pc=v=>R.inc?v/R.inc*100:0;
 return <>
  <h1>{R?"Your money, at a glance":"Welcome to PaisaPilot 👋"}</h1><p className="mu">Paste bank/UPI SMS and get budgets, scam alerts and what-if wealth in seconds.</p>
  {R&&<div className="c hero"><Ring score={hs}/><div style={{flex:1,minWidth:220}}><div className="mu">Net saved this period</div><div style={{fontSize:38,fontWeight:800,letterSpacing:-1}}><Num v={R.saved}/></div>
   <div className="mu">{hs>=70?"Excellent habits. Keep compounding.":hs>=45?"Decent. A few leaks to fix.":"Needs attention. Start with the insights below."}</div>
   <div style={{marginTop:10}}><span className="chip" style={{background:"#ffffff30"}}>In <Num v={R.inc}/></span><span className="chip" style={{background:"#ffffff30"}}>Out <Num v={R.spend}/></span><span className="chip" style={{background:"#ffffff30"}}>Savings <Num v={Math.max(R.rate,0)} pre="" suf="%"/></span></div></div></div>}
  <div className="c"><h2>📩 Your SMS alerts</h2><textarea value={text} onChange={e=>setText(e.target.value)} placeholder={"HDFC Bank: Rs 450.00 debited to VPA swiggy@icici...\nOne alert per line."}/>
   <button className="btn" onClick={()=>{run(text);say("Analysed")}}>Analyse</button><button className="btn g" onClick={demo}>✨ Try demo data</button><button className="btn g" onClick={()=>{setText("");location.reload();localStorage.removeItem("pp_sms")}}>Clear</button></div>
  {R&&<>
   <div className="g2"><div className="c"><h2>Where it went</h2><Donut data={ents}/></div>
    <div className="c"><h2>50 / 30 / 20 check</h2>{[["Needs",pc(R.need),50,1],["Wants",pc(R.want),30,1],["Savings",Math.max(pc(R.saved),0),20,0]].map(([n,p,t,hi])=>{const bad=hi?p>t:p<t;return <div key={n} style={{margin:"14px 0"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><b>{n}</b><span className={bad?"r1":"g1"}>{p.toFixed(0)}% · target {hi?"≤":"≥"}{t}%</span></div><div className="meter"><i style={{width:Math.min(p,100)+"%",background:bad?"var(--bad)":"var(--ac2)"}}/></div></div>})}</div></div>
   <div className="c"><h2>💡 Smart insights</h2>
    {R.subs.map(s=><div key={s.m} className="fl m"><b>{s.m}</b> charges {inr(s.amt)} repeatedly (~{inr(s.amt*12)}/year). Still using it?</div>)}
    {R.flags.filter(f=>f.score>=40).length>0&&<div className="fl"><b>{R.flags.filter(f=>f.score>=40).length} scam message(s)</b> blocked from your budget. <a href="#" style={{color:"var(--ac)"}} onClick={e=>{e.preventDefault();go("scam")}}>Review →</a></div>}
    <div className={"fl "+(R.rate<20?"m":"ok")}>{R.rate<20?`Raise savings to 20%: ${inr(R.inc*.2-Math.max(R.saved,0))} more per month. Try the Wealth tab.`:`Strong savings. Build an emergency fund of ${inr(R.spend*6)} before market risk.`}</div>
    <button className="btn" onClick={explain} disabled={busy}>{busy?"Thinking…":"✨ Explain with AI"}</button>
    {ai&&<div className="k" style={{marginTop:12,whiteSpace:"pre-wrap"}}>{ai.text}<div className="mu sm" style={{marginTop:6}}>{ai.source==="ai"?"Generated by an LLM":"Rule-based summary (add NVIDIA_API_KEY for LLM mode)"}</div></div>}</div>
   <div className="c"><h2>Ledger</h2><div className="tb"><table><thead><tr><th>Type</th><th>Merchant</th><th>Category</th><th>Amount</th></tr></thead><tbody>{R.tx.map((t,i)=><tr key={i}><td className={t.type==="credit"?"g1":""}>{t.type}</td><td>{t.m}</td><td>{t.cat}</td><td>{inr(t.amt)}</td></tr>)}</tbody></table></div></div></>}
 </>}

function Upi({say}){
 const [m,setM]=useState("pay");
 return <><h1>⚡ UPI Services</h1><p className="mu">Create payment links & QR, verify before you pay, and split bills. Opens in GPay, PhonePe, Paytm, BHIM.</p>
  <div className="seg">{[["pay","Request / QR"],["scan","Scan check"],["split","Split bill"]].map(([k,l])=><button key={k} className={m===k?"on":""} onClick={()=>setM(k)}>{l}</button>)}</div>
  {m==="pay"&&<PayQR say={say}/>}{m==="scan"&&<ScanCheck/>}{m==="split"&&<Split say={say}/>}</>}

function PayQR({say}){
 const [f,setF]=useState({pa:"",pn:"",am:"",tn:""}),[img,setImg]=useState("");
 const set=k=>e=>setF({...f,[k]:e.target.value});const v=vpaCheck(f.pa),link=v.valid?buildUpi(f):"";
 useEffect(()=>{if(link)QRCode.toDataURL(link,{margin:1,width:460}).then(setImg);else setImg("")},[link]);
 const copy=()=>{navigator.clipboard?.writeText(link);say("Link copied")};
 return <div className="c g2"><div><h2>Create a payment request</h2>
  <label>Your UPI ID</label><input value={f.pa} onChange={set("pa")} placeholder="yourname@okhdfcbank"/>
  {f.pa&&(v.valid?v.w.map(x=><div key={x} className="fl m">{x}</div>):<div className="fl">{v.w[0]}</div>)}{f.pa&&v.valid&&!v.w.length&&<div className="fl ok">UPI ID format looks good (@{v.handle})</div>}
  <label>Payee name</label><input value={f.pn} onChange={set("pn")} placeholder="Pulkit"/><label>Amount (₹, optional)</label><input type="number" value={f.am} onChange={set("am")} placeholder="500"/>
  <label>Note</label><input value={f.tn} onChange={set("tn")} placeholder="Dinner split"/></div>
  <div style={{textAlign:"center"}}>{img?<><div className="qr"><img src={img} alt="UPI payment QR"/></div><div><a className="btn" style={{display:"inline-block",textDecoration:"none"}} href={link}>Open in UPI app</a><button className="btn g" onClick={copy}>Copy link</button><a className="btn g" style={{display:"inline-block",textDecoration:"none"}} target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent("Pay me via UPI: "+link)}`}>WhatsApp</a></div><div className="mu sm">Scan with any UPI app. Direct app link works on mobile.</div></>:<div className="mu" style={{padding:60}}>Enter a valid UPI ID to generate your QR ✨</div>}</div></div>}

function ScanCheck(){
 const [s,setS]=useState("");const r=s?checkUpiLink(s):null;
 const demo="upi://collect?pa=refund.support@paytmx&pn=Refund&am=4999&tn=Enter PIN to receive";
 return <div className="c"><h2>🔍 Scan before you pay</h2><p className="mu sm">Paste a upi:// link or the text decoded from a QR. We flag collect requests, odd handles and scammy notes.</p>
  <textarea value={s} onChange={e=>setS(e.target.value)} style={{minHeight:80}} placeholder="upi://pay?pa=shop@okaxis&pn=Shop&am=250"/><button className="btn g" onClick={()=>setS(demo)}>Try a scam example</button>
  {r&&(!r.ok?r.w.map(x=><div key={x} className="fl">{x}</div>):<><div className="meter"><i style={{width:r.risk+"%",background:r.risk>=60?"var(--bad)":r.risk>=30?"var(--wa)":"var(--ac2)"}}/></div>
   <b className={r.risk>=60?"r1":r.risk>=30?"":"g1"}>{r.risk>=60?"High risk: do not pay":r.risk>=30?"Caution":"Looks safe"} · {r.act==="collect"?"Collect":"Pay"} request</b>
   <div className="grid" style={{margin:"12px 0"}}><div className="k"><b style={{fontSize:15}}>{r.p.pa||"—"}</b><span>Receiver</span></div><div className="k"><b style={{fontSize:15}}>{r.p.am?inr(+r.p.am):"Any"}</b><span>Amount</span></div><div className="k"><b style={{fontSize:15}}>{r.p.pn||"—"}</b><span>Name</span></div></div>
   {r.w.map(x=><div key={x} className="fl m">{x}</div>)}{!r.w.length&&<div className="fl ok">No red flags. Still verify the name shown in your UPI app.</div>}</>)}</div>}

function Split({say}){
 const [t,setT]=useState(2400),[names,setN]=useState("Aman, Riya, Karan"),[pa,setPa]=useState("");
 const ppl=names.split(",").map(s=>s.trim()).filter(Boolean),share=ppl.length?Math.ceil(t/(ppl.length+1)):0,ok=vpaCheck(pa).valid;
 return <div className="c"><h2>🍕 Split a bill</h2><div className="g2"><div><label>Total bill (₹)</label><input type="number" value={t} onChange={e=>setT(+e.target.value||0)}/><label>Friends (comma separated)</label><input value={names} onChange={e=>setN(e.target.value)}/><label>Your UPI ID (they pay you)</label><input value={pa} onChange={e=>setPa(e.target.value)} placeholder="you@okicici"/></div>
  <div><div className="k"><b className="g1">{inr(share)}</b><span>each, including you ({ppl.length+1} people)</span></div>
  {ppl.map(p=>{const l=ok?buildUpi({pa,pn:"Bill split",am:share,tn:"Split for "+p}):"";return <div key={p} className="k" style={{marginTop:10,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><b style={{fontSize:16,flex:1}}>{p}</b><span>{inr(share)}</span>{ok?<a className="btn g" style={{margin:0,textDecoration:"none"}} target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`Hi ${p}, your share is ${inr(share)}. Pay via UPI: ${l}`)}`} onClick={()=>say("Opening WhatsApp")}>Send request</a>:<span className="sm">add your UPI ID</span>}</div>})}</div></div></div>}

function Scam({R}){
 const [m,setM]=useState(""),s=scamScore(m),col=s.score>=60?"var(--bad)":s.score>=30?"var(--wa)":"var(--ac2)";
 return <><h1>🛡️ Scam Guard</h1><p className="mu">Check any suspicious SMS, WhatsApp or call script.</p>
  <div className="c"><textarea value={m} onChange={e=>setM(e.target.value)} placeholder="Paste a suspicious message…"/><div className="meter"><i style={{width:s.score+"%",background:col}}/></div>
   <b style={{color:col}}>Risk {s.score}/100 · {s.score>=60?"Likely scam":s.score>=30?"Be careful":m?"Looks okay":"Waiting for input"}</b>{s.why.map(w=><div key={w} className="fl m">{w}</div>)}</div>
  <div className="c"><h2>Flagged in your SMS</h2>{!R?<p className="mu">Add SMS on Home first.</p>:R.flags.length===0?<p className="g1">Nothing suspicious found.</p>:R.flags.map((f,i)=><div key={i} className={"fl "+(f.score<60?"m":"")}><b>{f.score>=60?"HIGH RISK":"CAUTION"} {f.score}</b> · {f.why.join(" · ")}<q>{f.line}</q></div>)}
   <div className="fl ok">Report fraud: call <b>1930</b> or cybercrime.gov.in. Never share OTP/PIN. Receiving money never needs a PIN.</div></div></>}

function Tax(){
 const [v,setV]=useState({gross:1200000,c80:150000,d80:25000,nps:0,hra:0,other:0});
 const set=k=>e=>setV({...v,[k]:+e.target.value||0}),t=compareTax(v),best=t.nTax<=t.oTax?"New":"Old";
 return <><h1>🧾 Tax regime picker</h1><p className="mu">Old vs New, in plain numbers.</p><div className="c"><div className="g2">{[["gross","Annual gross salary"],["c80","80C (PPF, ELSS, LIC)"],["d80","80D health insurance"],["nps","NPS 80CCD(1B)"],["hra","HRA exemption"],["other","Other deductions"]].map(([k,l])=><div key={k}><label>{l}</label><input type="number" value={v[k]} onChange={set(k)}/></div>)}</div>
  <div className="grid" style={{marginTop:16}}><div className={"k "+(best==="New"?"win":"")}><b><Num v={t.nTax}/></b><span>New regime (taxable {inr(t.nT)})</span></div><div className={"k "+(best==="Old"?"win":"")}><b><Num v={t.oTax}/></b><span>Old regime (deductions {inr(t.ded)})</span></div><div className="k"><b className="g1">{best} wins</b><span>Saves {inr(Math.abs(t.nTax-t.oTax))} / year</span></div></div></div></>}

function Wealth({R}){
 const [p,setP]=useState(R?Math.max(500,Math.round(R.want*.3/500)*500):5000),[y,setY]=useState(10),[r,setR2]=useState(12);
 const fv=sipFV(p,y,r),fd=sipFV(p,y,7),inv=p*y*12;
 return <><h1>🚀 Leak to Wealth</h1><p className="mu">{R?`Prefilled from 30% of your wants (${inr(R.want)}).`:"Drag the sliders to see compounding."}</p>
  <div className="c"><label>Monthly SIP: <b>{inr(p)}</b></label><input type="range" min="500" max="100000" step="500" value={p} onChange={e=>setP(+e.target.value)}/><label>Years: <b>{y}</b></label><input type="range" min="1" max="30" value={y} onChange={e=>setY(+e.target.value)}/><label>Expected return: <b>{r}% p.a.</b></label><input type="range" min="6" max="15" value={r} onChange={e=>setR2(+e.target.value)}/>
   <div className="grid" style={{marginTop:16}}><div className="k"><b><Num v={inv}/></b><span>You invest</span></div><div className="k win"><b className="g1"><Num v={fv}/></b><span>SIP value @ {r}%</span></div><div className="k"><b><Num v={fd}/></b><span>FD-like @ 7%</span></div><div className="k"><b><Num v={fv/Math.pow(1.06,y)}/></b><span>In today's ₹ (6% inflation)</span></div></div>
   <div className="meter" style={{height:18,marginTop:16}}><i style={{width:inv/fv*100+"%",background:"var(--ac)",float:"left",borderRadius:0}}/><i style={{width:(1-inv/fv)*100+"%",background:"var(--ac2)",float:"left",borderRadius:0}}/></div><div className="mu sm">Blue: your money · Green: growth. Returns not guaranteed.</div></div></>}
