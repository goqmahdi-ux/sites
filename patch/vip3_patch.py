import hashlib,sys
src,dst=sys.argv[1],sys.argv[2]
t=open(src,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global t
    n=t.count(a); assert n==cnt,(a[:90],n); t=t.replace(a,b)
# helpers
rep("window.__vg=null;\n","window.__vg=null;\n/* صفوف VIP: القسم B أول 3 صفوف، والقسمين A و C أول صفين */\nwindow.__vipRC=function(r,c){return r<=((c>10&&c<21)?3:2)};\nwindow.__vipId=function(id){var p=String(id).slice(1).split('-');return __vipRC(+p[0],+p[1])};\nwindow.__vipJ=function(j){var l=String(j&&j.lbl||''),k='ABC'.indexOf(l[0]);return k<0?(+j.r<=2):__vipRC(+j.r,k*10+1)};\n")
rep("k[(r<=2?'v':'r')+__zg(r,c)]++","k[(__vipRC(r,c)?'v':'r')+__zg(r,c)]++")
rep("return r<=2?(g==='m'?","return __vipRC(r,+p[1])?(g==='m'?")
# markup counts
rep('<span id="cVipM">30 متاح</span>','<span id="cVipM">40 متاح</span>')
rep('<span id="cRegM">90 متاح</span>','<span id="cRegM">80 متاح</span>')
# bundle
rep('side:Wp(e),vip:t<=fn}}var Rc=n=>Vp(n).r<=fn?"VIP"','side:Wp(e),vip:__vipRC(t,e)}}var Rc=n=>__vipId(n)?"VIP"')
rep('function*Wu(n,g){let[t,e]=n==="VIP"?[1,fn]:[fn+1,ns];for(let i=t;i<=e;i++)for(let s=1;s<=hi;s++)(!g||__zg(i,s)===g)&&(yield Sr(i,s))}',
    'function*Wu(n,g){for(let i=1;i<=ns;i++)for(let s=1;s<=hi;s++)__vipRC(i,s)===(n==="VIP")&&(!g||__zg(i,s)===g)&&(yield Sr(i,s))}')
rep('sn.push({id:Sr(n,t),r:n,c:t,vip:n<=fn,','sn.push({id:Sr(n,t),r:n,c:t,vip:__vipRC(n,t),')
rep('no=sn.length,bM=fn*hi,','no=sn.length,bM=sn.filter(n=>n.vip).length,')
rep('e=fn*hi,i=(ns-fn)*hi,s=e-n+(i-t)','e=sn.filter(x=>x.vip).length,i=no-e,s=e-n+(i-t)')
rep('let c=n.r?n.r<=fn:n.sec==="VIP"','let c=n.r?__vipJ(n):n.sec==="VIP"')
rep('<span class="sb${s.r<=fn?" vip":""}">','<span class="sb${__vipJ(s)?" vip":""}">')
rep('<div class="jSeat${n.r<=fn?" vip":""}">','<div class="jSeat${__vipJ(n)?" vip":""}">')
open(dst,'w',encoding='utf-8').write(t)
print(hashlib.sha256(open(src,encoding='utf-8').read().encode()).hexdigest()[:8],'->',hashlib.sha256(t.encode()).hexdigest()[:8])
t=open(dst,encoding='utf-8').read()
a='b==="B"?"رجال فقط":"نساء فقط"';assert t.count(a)==1
t=t.replace(a,'b==="B"?"رجال فقط · أول 3 صفوف VIP":"نساء فقط"')
open(dst,'w',encoding='utf-8').write(t)
print('final',hashlib.sha256(t.encode()).hexdigest()[:8])
