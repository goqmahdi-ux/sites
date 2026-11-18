import hashlib,sys
src,dst=sys.argv[1],sys.argv[2]
t=open(src,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global t
    n=t.count(a); assert n==cnt,(a[:90],n); t=t.replace(a,b)
# قائمة ستكرات الكراسي: حسب الصف (مع VIP الصحيح)، حسب القسم، وحسب الفئة
rep('(()=>{let n=R("#chairSec");if(n)for(let t=1;t<=ns;t++){let e=Gc(t);[...n.options].some(i=>i.value===e)||n.add(new Option(e+(t<=fn?" VIP":"")+" (30 \\u0643\\u0631\\u0633\\u064A)",e))}})();',
    '(()=>{let n=R("#chairSec");if(!n||n.dataset.v2)return;n.dataset.v2=1;const G=(l,a)=>{const g=document.createElement("optgroup");g.label=l;a.forEach(([v,x])=>g.appendChild(new Option(x,v)));n.appendChild(g)};'
    'G("حسب الصف",Array.from({length:ns},(_,k)=>{const r=k+1,vs="ABC".split("").filter((s,j)=>__vipRC(r,j*10+1)),full=vs.length===3,part=vs.length&&!full;return[Gc(r),Gc(r)+(full?" VIP":"")+" (30 كرسي"+(part?"، القسم "+vs.join(" و ")+" VIP":"")+")"]}));'
    'G("حسب القسم",[["sec:A","القسم A كامل (110 كرسي): الصف 1 رجال والباقي نساء"],["sec:B","القسم B كامل (110 كرسي): رجال"],["sec:C","القسم C كامل (110 كرسي): نساء"]]);'
    'G("حسب الفئة",[["g:vm","كل كراسي VIP رجال (40)"],["g:vf","كل كراسي VIP نساء (30)"],["g:rm","كل كراسي عادي رجال (80)"],["g:rf","كل كراسي عادي نساء (180)"]])})();')
rep('function WM(n){let t=[];for(let e=1;e<=ns;e++)if(!(n!=="all"&&Gc(e)!==n))for(let i=1;i<=hi;i++)t.push(Sr(e,i));return t}',
    'function WM(n){let t=[];for(let e=1;e<=ns;e++)for(let i=1;i<=hi;i++)(n==="all"||Gc(e)===n||n.startsWith("sec:")&&"ABC"[Math.floor((i-1)/10)]===n.slice(4)||n.startsWith("g:")&&(__vipRC(e,i)?"v":"r")+__zg(e,i)===n.slice(2))&&t.push(Sr(e,i));return t}')
rep('let n=R("#chairSec").value,t=Sr(n==="all"?1:+n.replace(/\\D/g,""),15),e=await ym(t);','let n=R("#chairSec").value,t=WM(n)[0]||Sr(1,15),e=await ym(t);')
# ستكر الكرسي: يكتب رجال أو نساء
rep('o=(r.vip?"VIP\\u060C ":"")+r.side,c=document.createElement("canvas")','o=(r.vip?"VIP\\u060C ":"")+__gl(__zgId(n))+"\\u060C "+r.side,c=document.createElement("canvas")')
rep('<label>الصف\n          <select id="chairSec">','<label>شنو تطبع\n          <select id="chairSec">')
rep('<button class="btn primary" id="chairBatch">اطبع ستكرات الصف</button>','<button class="btn primary" id="chairBatch">اطبع الستكرات</button>')
rep('n.textContent="\\u0627\\u0637\\u0628\\u0639 \\u0633\\u062A\\u0643\\u0631\\u0627\\u062A \\u0627\\u0644\\u0635\\u0641"','n.textContent="اطبع الستكرات"')
open(dst,'w',encoding='utf-8').write(t)
print(hashlib.sha256(open(src,encoding='utf-8').read().encode()).hexdigest()[:8],'->',hashlib.sha256(t.encode()).hexdigest()[:8])
