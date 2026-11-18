import hashlib,sys
src,dst=sys.argv[1],sys.argv[2]
t=open(src,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global t
    n=t.count(a); assert n==cnt,(a[:90],n); t=t.replace(a,b)
# الكراسي الموجودة فعلاً: آخر صف (11) بالقسم A بيه 9 كراسي، والقسم B: الصف الفردي 10 والزوجي 9
rep("window.__vg=null;\n","window.__vg=null;\n/* كراسي غير موجودة: A10 بالصف 11، و B10 بالصفوف الزوجية */\nwindow.__seatOk=function(r,c){return !((r===11&&c===10)||(c===20&&r%2===0))};\n")
rep("for(var r=1;r<=11;r++)for(var c=1;c<=30;c++){if(seats&&seats['R'+r+'-'+c])continue;","for(var r=1;r<=11;r++)for(var c=1;c<=30;c++){if(!__seatOk(r,c)||seats&&seats['R'+r+'-'+c])continue;")
rep('function*Wu(n,g){for(let i=1;i<=ns;i++)for(let s=1;s<=hi;s++)__vipRC(i,s)','function*Wu(n,g){for(let i=1;i<=ns;i++)for(let s=1;s<=hi;s++)__seatOk(i,s)&&__vipRC(i,s)')
rep('var sn=[];for(let n=1;n<=ns;n++)for(let t=1;t<=hi;t++){let e=ja(n),i=Mr(t)/e;','var sn=[];for(let n=1;n<=ns;n++)for(let t=1;t<=hi;t++){if(!__seatOk(n,t))continue;let e=ja(n),i=(Mr(t)-(t>10&&t<21&&n%2===0?yr/2:0))/e;')
rep('function WM(n){let t=[];for(let e=1;e<=ns;e++)for(let i=1;i<=hi;i++)(n==="all"','function WM(n){let t=[];for(let e=1;e<=ns;e++)for(let i=1;i<=hi;i++)__seatOk(e,i)&&(n==="all"')
# المخطط
rep('for(let c=bi*10+1;c<=bi*10+10;c++)g+=`<div data-s="R${r}-${c}"','for(let c=bi*10+1;c<=bi*10+10;c++)g+=!__seatOk(r,c)?"<div></div>":`<div data-s="R${r}-${c}"')
# قائمة ستكرات الكراسي: الأعداد الحقيقية
rep('n.dataset.v2=1;const G=','n.dataset.v2=1;n.options[0].text="كل القاعة ("+WM("all").length+" كرسي)";const G=')
rep('return[Gc(r),Gc(r)+(full?" VIP":"")+" (30 كرسي"+','return[Gc(r),Gc(r)+(full?" VIP":"")+" ("+WM(Gc(r)).length+" كرسي"+')
rep('G("حسب القسم",[["sec:A","القسم A كامل (110 كرسي): الصف 1 رجال والباقي نساء"],["sec:B","القسم B كامل (110 كرسي): رجال"],["sec:C","القسم C كامل (110 كرسي): نساء"]]);',
    'G("حسب القسم",[["sec:A","الصف 1 رجال والباقي نساء"],["sec:B","رجال"],["sec:C","نساء"]].map(([v,x])=>[v,"القسم "+v.slice(4)+" كامل ("+WM(v).length+" كرسي): "+x]));')
rep('G("حسب الفئة",[["g:vm","كل كراسي VIP رجال (40)"],["g:vf","كل كراسي VIP نساء (30)"],["g:rm","كل كراسي عادي رجال (80)"],["g:rf","كل كراسي عادي نساء (180)"]])',
    'G("حسب الفئة",[["g:vm","VIP رجال"],["g:vf","VIP نساء"],["g:rm","عادي رجال"],["g:rf","عادي نساء"]].map(([v,x])=>[v,"كل كراسي "+x+" ("+WM(v).length+")"]))')
rep('const c="ABC".indexOf(m[1])*10+ +m[2],x=await ym(Sr(r,c));','const c="ABC".indexOf(m[1])*10+ +m[2];if(!__seatOk(r,c)){Vt("ماكو كرسي "+m[1]+m[2]+" بالصف "+r,!0);return}const x=await ym(Sr(r,c));')
# أرقام البداية
rep('<b id="sVip">70</b><small>من 70</small>','<b id="sVip">69</b><small>من 69</small>')
rep('<b id="sReg">260</b><small>من 260</small>','<b id="sReg">255</b><small>من 255</small>')
rep('<option value="all">كل القاعة (330 كرسي)</option>','<option value="all">كل القاعة (324 كرسي)</option>')
for a,b in [('cVipM">40','cVipM">39'),('cRegM">80','cRegM">76'),('cRegF">180','cRegF">179')]:
    rep('<span id="%s متاح</span>'%a,'<span id="%s متاح</span>'%b)
open(dst,'w',encoding='utf-8').write(t)
print(hashlib.sha256(open(src,encoding='utf-8').read().encode()).hexdigest()[:8],'->',hashlib.sha256(t.encode()).hexdigest()[:8])
