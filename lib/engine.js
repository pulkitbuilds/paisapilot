export const SAMPLE=`HDFC Bank: Rs 450.00 debited from a/c XX1234 on 03-11-26 to VPA swiggy@icici. UPI Ref 4412
HDFC Bank: Rs 389.00 debited from a/c XX1234 to VPA zomato@hdfcbank on 05-11-26
HDFC Bank: Rs 1,250.00 debited to VPA bigbasket@axis on 06-11-26
Rs 649.00 paid to Netflix via UPI on 07-11-26
Rs 12,000.00 debited from a/c XX1234 to VPA landlord@sbi towards rent on 01-11-26
INR 60,000.00 credited to a/c XX1234 salary from TECHCORP on 01-11-26
Rs 220.00 debited to VPA uber@axisbank on 08-11-26
Rs 540.00 debited to VPA swiggy@icici on 09-11-26
Rs 2,799.00 debited at Amazon on 10-11-26 for shopping
Rs 3,499.00 debited at Myntra on 11-11-26
Rs 649.00 paid to Netflix via UPI on 12-11-26
Rs 899.00 debited to VPA airtel@icici for mobile bill on 12-11-26
Rs 310.00 debited to VPA zomato@hdfcbank on 13-11-26
Rs 1,500.00 credited from friend rohan@okaxis on 14-11-26
Rs 1,100.00 debited to VPA bookmyshow@ybl on 15-11-26 movie
Rs 850.00 debited to VPA apollopharmacy@icici on 16-11-26
ALERT: Your SBI account will be blocked within 24 hrs! Complete KYC now: http://sbi-kyc-update.xyz/login
You have received a collect request of Rs 4,999 from rewards@ybl. Enter UPI PIN to receive money.
Congratulations! You won Rs 25 lakh lottery. Download app: bit.ly/claim-now and share OTP to verify
Dear customer, refund of Rs 1,299 pending. Install AnyDesk and share the 9-digit code to receive.`;
export const CATS={Rent:/rent|landlord/,Bills:/bill|airtel|jio|electric|recharge|broadband/,Groceries:/bigbasket|blinkit|zepto|grocer|dmart/,"Food delivery":/swiggy|zomato|eatsure|restaurant|cafe/,Transport:/uber|ola|rapido|metro|fuel|petrol/,Health:/pharmacy|apollo|hospital|clinic|medic/,Shopping:/amazon|flipkart|myntra|ajio|shopping/,Entertainment:/netflix|spotify|prime|hotstar|bookmyshow|movie/};
export const NEED=["Rent","Bills","Groceries","Transport","Health"];
const SC=[[/collect request|requested money|enter (upi )?pin to receive|approve.*request/i,50,"Fake collect request: you never need a PIN to receive money"],[/otp|cvv|\bpin\b/i,20,"Asks for OTP/PIN: banks never ask for these"],[/https?:\/\/|bit\.ly|tinyurl|www\.|\.xyz|\.top|\.cc\b/i,30,"Suspicious link"],[/kyc|blocked|suspend|expire|within 24|immediately|urgent|last chance/i,25,"Urgency or fear tactic"],[/lottery|you won|prize|reward|cashback|refund/i,25,"Too-good-to-be-true offer or fake refund"],[/anydesk|teamviewer|quicksupport|\.apk|install|download app/i,45,"Pushes remote-access or unknown app install"]];
export function scamScore(t){let s=0,why=[];SC.forEach(([r,w,m])=>{if(r.test(t)){s+=w;why.push(m)}});return{score:Math.min(s,100),why}}
export const inr=n=>"₹"+Math.round(n).toLocaleString("en-IN");
function parse(line){const a=line.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d+)?)/i);if(!a)return null;
 const amt=parseFloat(a[1].replace(/,/g,"")),l=line.toLowerCase();
 const type=/credited|received|deposited/.test(l)&&!/debited/.test(l)?"credit":"debit";
 let m=line.match(/([\w.\-]+)@[a-z]+/i);m=m?m[1]:(line.match(/(?:at|to|from)\s+([A-Za-z][A-Za-z0-9&]{2,15})/)||[,"unknown"])[1];
 let cat="Other";for(const k in CATS)if(CATS[k].test(l)){cat=k;break}
 if(type==="credit")cat=/salary/.test(l)?"Salary":"Transfer in";
 return{amt,type,m:m.toLowerCase(),cat}}
export function analyse(text){
 const tx=[],flags=[];
 text.split("\n").map(s=>s.trim()).filter(Boolean).forEach(l=>{const s=scamScore(l);
  if(s.score>=20)flags.push({line:l,...s});if(s.score>=40)return;const p=parse(l);if(p)tx.push(p)});
 const inc=tx.filter(t=>t.type==="credit").reduce((a,t)=>a+t.amt,0),deb=tx.filter(t=>t.type==="debit");
 const spend=deb.reduce((a,t)=>a+t.amt,0),by={};deb.forEach(t=>by[t.cat]=(by[t.cat]||0)+t.amt);
 const need=NEED.reduce((a,k)=>a+(by[k]||0),0),saved=inc-spend,rate=inc?saved/inc*100:0;
 const rec={};deb.forEach(t=>(rec[t.m]=rec[t.m]||[]).push(t.amt));
 const subs=Object.entries(rec).filter(([,v])=>v.length>1&&new Set(v).size===1).map(([m,v])=>({m,amt:v[0]}));
 return{tx,flags,inc,spend,by,need,want:spend-need,saved,rate,subs}}
export const sipFV=(p,yrs,ret)=>{const n=yrs*12,r=ret/1200;return r?p*((Math.pow(1+r,n)-1)/r)*(1+r):p*n};
function slab(inc,sl){let prev=0,t=0;for(const[l,r]of sl){if(inc>prev)t+=(Math.min(inc,l)-prev)*r;prev=l}return t}
export function compareTax({gross,c80,d80,nps,hra,other}){
 const nT=Math.max(0,gross-75000);let nTax=slab(nT,[[4e5,0],[8e5,.05],[12e5,.1],[16e5,.15],[2e6,.2],[24e5,.25],[Infinity,.3]]);if(nT<=12e5)nTax=0;
 const ded=Math.min(c80,150000)+d80+Math.min(nps,50000)+hra+other,oT=Math.max(0,gross-50000-ded);
 let oTax=slab(oT,[[25e4,0],[5e5,.05],[1e6,.2],[Infinity,.3]]);if(oT<=5e5)oTax=0;
 return{nT,oT,ded,nTax:nTax*1.04,oTax:oTax*1.04}}

export function healthScore(R){
 if(!R||!R.inc)return 0;const n=R.need/R.inc*100,w=R.want/R.inc*100;
 const s=40*Math.max(0,Math.min(R.rate/20,1))+(n<=50?30:Math.max(0,30-(n-50)))+(w<=30?20:Math.max(0,20-(w-30)*.7))+(10-Math.min(R.subs.length*3,10));
 return Math.round(Math.max(0,Math.min(100,s)))}
const HANDLES="okhdfcbank okicici oksbi okaxis ybl ibl axl paytm upi sbi icici hdfcbank axisbank apl fbl jupiter ikwik postbank pnb boi cnrb unionbank yesbank kotak rbl idfcbank airtel".split(" ");
export function vpaCheck(v){
 const w=[],m=(v||"").trim().match(/^([a-zA-Z0-9._-]{2,50})@([a-zA-Z]{2,20})$/);
 if(!m)return{valid:false,w:["Not a valid UPI ID. Expected format: name@bank"]};
 if(!HANDLES.includes(m[2].toLowerCase()))w.push(`Unknown bank handle "@${m[2]}". Double-check with the receiver.`);
 if(/refund|reward|cashback|support|care|kyc|helpdesk|lottery|prize/i.test(m[1]))w.push("Name looks like a scam-style ID (refund/reward/support).");
 if(/^\d{10}$/.test(m[1]))w.push("Mobile-number ID: confirm the name shown by your UPI app before paying.");
 return{valid:true,handle:m[2].toLowerCase(),w}}
export const buildUpi=({pa,pn,am,tn})=>`upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn||"")}${am?`&am=${am}`:""}&cu=INR${tn?`&tn=${encodeURIComponent(tn)}`:""}`;
export function checkUpiLink(s){
 const w=[];let u;try{u=new URL(s.trim())}catch{return{ok:false,w:["Not a valid link. Paste a upi://pay?... link or the text inside a QR."]}}
 if(u.protocol!=="upi:")return{ok:false,w:["This is not a UPI link. Web links in 'payment' QR codes are a classic scam."]};
 const p=Object.fromEntries(u.searchParams),act=u.hostname;
 if(act==="collect")w.push("This is a COLLECT request: it takes money from you. Paying never needs a PIN to receive.");
 const v=vpaCheck(p.pa||"");if(!v.valid)w.push("Receiver UPI ID is missing or invalid.");else w.push(...v.w);
 const am=+p.am;if(am>=10000)w.push(`High amount ${inr(am)}. Confirm it is intended.`);
 if(p.tn){const sc=scamScore(p.tn);if(sc.score>=25)w.push("Payment note contains scam-style wording.")}
 return{ok:true,p,act,w,risk:Math.min(100,w.length*30)}}
