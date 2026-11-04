/* DAKS · servis ve gider kayıtları, araç kartları (lastik ölçüsü, araçtaki malzemeler) */
(function(){
const tl=n=>Number(n||0).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' TL';
const bugun=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
if($('svcDate'))$('svcDate').value=bugun();if($('svcMonth'))$('svcMonth').value=bugun().slice(0,7);
window.servisCiz=function(){if(!$('svcRows'))return;
 const cs=visibleCars(),old=$('svcPlate').value;$('svcPlate').replaceChildren();for(const c of cs){const o=el('option',null,c.plate+' · '+c.model);o.value=c.plate;$('svcPlate').append(o)}if(cs.some(c=>c.plate===old))$('svcPlate').value=old;
 const ay=$('svcMonth').value||bugun().slice(0,7),L=records.map((r,i)=>({r,i})).filter(x=>x.r.kind==='service'&&(x.r.svcDate||'').slice(0,7)===ay).sort((a,b)=>b.r.svcDate.localeCompare(a.r.svcDate));
 $('svcRows').replaceChildren();$('svcEmpty').hidden=L.length>0;
 for(const {r,i} of L){const tr=el('tr');[new Date(r.svcDate+'T00:00:00').toLocaleDateString('tr-TR'),r.plate,r.svcType,(r.note||'')+(r.shop?' · '+r.shop:''),r.km?Number(r.km).toLocaleString('tr-TR'):'—',tl(r.amount)].forEach(v=>tr.append(el('td',null,v)));
  const td=el('td');if(isPrivileged()){const b=el('button','secondary','Sil');b.type='button';b.style.width='auto';b.style.padding='4px 10px';b.onclick=async()=>{if(!confirm('Bu gider kaydı silinsin mi?'))return;records.splice(i,1);if(await persistData())render()};td.append(b)}tr.append(td);$('svcRows').append(tr)}
 const fuel=records.filter(r=>r.kind==='fuel'&&(r.fuelDate||'').slice(0,7)===ay);
 const per={};L.forEach(({r})=>{per[r.plate]=(per[r.plate]||0)+Number(r.amount||0)});const top=L.reduce((s,{r})=>s+Number(r.amount||0),0),ftop=fuel.reduce((s,r)=>s+Number(r.amount||0),0);
 $('svcTotals').textContent=L.length||fuel.length?'Bu ay servis/gider: '+tl(top)+' · yakıt: '+tl(ftop)+' · toplam araç gideri: '+tl(top+ftop)+(Object.keys(per).length?' · '+Object.entries(per).map(([p,v])=>p+' '+tl(v)).join(', '):''):'';
 $('svcCards').replaceChildren();
 const ayAd=new Date(ay+'-01T00:00:00').toLocaleDateString('tr-TR',{month:'long',year:'numeric'}),tarihY=t=>t?new Date(t+'T00:00:00').toLocaleDateString('tr-TR'):'Girilmedi',kalanG=t=>t?Math.ceil((new Date(t+'T00:00:00')-new Date())/864e5):null;
 const durumY=t=>{const k=kalanG(t);if(k==null)return['Girilmedi',''];return[tarihY(t)+(k<0?' · geçti':k<=30?' · '+k+' gün':''),k<0?'#F87171':k<=30?'#FBBF24':'']};
 for(const c of cs){const k=el('article','monthly-car-card');k.append(el('h3',null,c.plate),el('p',null,c.model+' · '+ayAd));
  const sv=L.filter(x=>x.r.plate===c.plate).reduce((s,x)=>s+Number(x.r.amount||0),0),fv=fuel.filter(r=>r.plate===c.plate).reduce((s,r)=>s+Number(r.amount||0),0);
  const satir=(lab,val,renk)=>{const m=el('div','monthly-metric');const v=el('strong',null,val);if(renk)v.style.color=renk;v.style.textAlign='right';m.append(el('span',null,lab),v);k.append(m)};
  satir('Lastik ölçüsü',c.tire||'Girilmedi');
  {const [v,r]=durumY(c.insurance);satir('Sigorta',v,r)}
  {const [v,r]=durumY(c.road);satir('Seyrüsefer',v,r)}
  {const [v,r]=durumY(c.inspection);satir('Muayene',v,r)}
  satir('Servis / gider',tl(sv));satir('Yakıt',tl(fv));satir('Toplam araç gideri',tl(sv+fv));
  satir('Son kilometre',weekly[c.plate]&&weekly[c.plate].km!=null?Number(weekly[c.plate].km).toLocaleString('tr-TR')+' KM':'Girilmedi');
  const inv=(c.inventory||'').split('\n').map(x=>x.trim()).filter(Boolean);
  satir('Araçtaki malzeme',inv.length?inv.length+' kalem':'Girilmedi');
  if(inv.length){const ul=el('ul');ul.style.cssText='margin:6px 0 0;padding-left:18px;font-size:13px;color:#cfe0ee;line-height:1.6';inv.forEach(x=>ul.append(el('li',null,x)));k.append(ul)}
  k.append(el('small',null,'Gider ve yakıt '+ayAd+' içindir. Tarihi 30 gün kalan sarı, geçen kırmızı görünür.'));
  if(isPrivileged()){const b=el('button','secondary','Bilgileri düzenle');b.type='button';b.style.cssText='width:100%;margin-top:14px';b.onclick=()=>openVehicleEditor(c);k.append(b)}
  $('svcCards').append(k)}
};
if($('svcMonth'))$('svcMonth').addEventListener('change',servisCiz);
if($('svcForm'))$('svcForm').addEventListener('submit',async e=>{e.preventDefault();const m=$('svcMessage');
 const amount=Number($('svcAmount').value);if(!(amount>=0)){m.textContent='Tutarı yazın.';return}
 records.push({kind:'service',plate:$('svcPlate').value,svcDate:$('svcDate').value,svcType:$('svcType').value,amount,km:$('svcKm').value?Number($('svcKm').value):null,shop:$('svcShop').value.trim(),note:$('svcNote').value.trim(),author:$('role').value,date:new Date().toLocaleString('tr-TR')});
 if(!await persistData()){records.pop();return}
 $('svcMonth').value=$('svcDate').value.slice(0,7);['svcAmount','svcKm','svcShop','svcNote'].forEach(id=>$(id).value='');m.textContent='Kaydedildi.';render()});
})();
