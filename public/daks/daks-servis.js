/* DAKS · servis ve gider kayıtları, araç kartları (lastik ölçüsü, araçtaki malzemeler) */
(function(){
const tl=n=>Number(n||0).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' TL';
const bugun=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
if($('svcCards')&&$('documentCardsHeading')){
 const form=$('svcForm');form.before($('documentCardsHeading'),$('svcCards'));
 const ledger=$('svcRows').closest('.table-scroll'),details=el('details','document-ledger');
 details.append(el('summary',null,'Gider kayıtları ve makbuz ayrıntıları'));ledger.before(details);details.append($('svcMonth').closest('div'),$('svcTotals'),ledger,$('svcEmpty'));
 const entry=el('details','document-ledger');entry.append(el('summary',null,'Yeni gider ekle'));form.before(entry);entry.append(form);
}
if($('documentFilter'))$('documentFilter').addEventListener('change',()=>servisCiz());
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
 const documentPlans=new Map(cs.map(c=>[c.plate,vehicleDocumentInfo(c,records,bugun())]));
 const counts={due:0,missing:0,ok:0};for(const info of documentPlans.values())counts[info.group]++;
 if($('documentSummary'))$('documentSummary').textContent=counts.due+' araç kontrol bekliyor · '+counts.missing+' araçta bilgi eksik · '+counts.ok+' aracın zamanı gelmedi.';
 const ayAd=new Date(ay+'-01T00:00:00').toLocaleDateString('tr-TR',{month:'long',year:'numeric'}),tarihY=t=>t?new Date(t+'T00:00:00').toLocaleDateString('tr-TR'):'Girilmedi',kalanG=t=>t?Math.ceil((new Date(t+'T00:00:00')-new Date())/864e5):null;
 const durumY=t=>{const k=kalanG(t);if(k==null)return['Girilmedi',''];return[tarihY(t)+(k<0?' · geçti':k<=30?' · '+k+' gün':''),k<0?'#F87171':k<=30?'#FBBF24':'']};
 for(const c of cs){const info=documentPlans.get(c.plate),filter=$('documentFilter')?.value||'all';if(filter!=='all'&&info.group!==filter)continue;const k=el('article','monthly-car-card');k.append(el('h3',null,c.plate),el('p',null,c.model||'Model bilgisi eklenmedi'));
  const sv=L.filter(x=>x.r.plate===c.plate).reduce((s,x)=>s+Number(x.r.amount||0),0),fv=fuel.filter(r=>r.plate===c.plate).reduce((s,r)=>s+Number(r.amount||0),0);
  const satir=(lab,val,renk)=>{const m=el('div','monthly-metric');const v=el('strong',null,val);if(renk)v.style.color=renk;v.style.textAlign='right';m.append(el('span',null,lab),v);k.append(m)};
  const state=(label,value)=>{const e=el('div','document-state '+value.tone);e.append(el('strong',null,label),el('span',null,value.label));k.append(e)};
  if(c.officialCheckDate)satir('Resmî kontrol tarihi',tarihY(c.officialCheckDate));
  state('Seyrüsefer',info.roadStatus);
  if(c.officialCheckDate&&c.officialRoadStatus&&c.officialRoadStatus!=='unknown')satir('Resmî borç sorgusu',c.officialRoadStatus==='none'?'Ödenecek borç yok':'Ödenecek borç var',c.officialRoadStatus==='none'?'#7be7d1':'#ffb5bd');
  satir('Geçerlilik sonu',tarihY(info.roadEnd));
  if(info.roadEnd){const d=new Date(info.roadEnd+'T00:00:00');d.setDate(1);d.setMonth(d.getMonth()+1);satir('Yenileme ayı',d.toLocaleDateString('tr-TR',{month:'long',year:'numeric'}));}
  if(info.road)satir('Son ödeme',tl(info.road.amount)+' · '+tarihY(info.road.svcDate));
  state('Muayene',info.inspectionStatus);
  if(c.officialCheckDate&&c.officialInspectionFee&&c.officialInspectionFee!=='unknown')satir('Resmî harç sorgusu',c.officialInspectionFee==='none'?'Ödenecek harç yok':'Ödenecek harç var',c.officialInspectionFee==='none'?'#7be7d1':'#ffb5bd');

  if(info.inspectionPeriod)satir('Muayene dönemi',info.inspectionPeriod.join(' – '));
  if(c.inspection)satir('Geçerlilik sonu',tarihY(c.inspection));
  if(info.inspection)satir('Son harç ödemesi',tl(info.inspection.amount)+' · '+tarihY(info.inspection.svcDate));
  state('Sigorta',info.insuranceStatus);
  if(c.insurance)satir('Geçerlilik sonu',tarihY(c.insurance));
  else if(c.insuranceMonth)satir('Sigorta ayı',c.insuranceMonth.split('-').reverse().join('.'));
  const extra=el('details','document-extra');extra.append(el('summary',null,'Diğer araç bilgileri'));k.append(extra);
  if(sv||fv){satir('Servis / gider',tl(sv));satir('Yakıt',tl(fv));satir('Toplam araç gideri',tl(sv+fv));}
  if(weekly[c.plate]?.kmKnown!==false&&weekly[c.plate]?.km!=null)satir('Son kilometre',weekly[c.plate]&&weekly[c.plate].kmKnown!==false&&weekly[c.plate].km!=null?Number(weekly[c.plate].km).toLocaleString('tr-TR')+' KM':'Girilmedi');
  const inv=(c.inventory||'').split('\n').map(x=>x.trim()).filter(Boolean);
  if(inv.length)satir('Araçtaki malzeme',inv.length+' kalem');
  if(inv.length){const ul=el('ul');ul.style.cssText='margin:6px 0 0;padding-left:18px;font-size:13px;color:#cfe0ee;line-height:1.6';inv.forEach(x=>ul.append(el('li',null,x)));k.append(ul)}
  for(const row of [...k.children])if(row.classList.contains('monthly-metric')&&['Servis / gider','Yakıt','Toplam araç gideri','Son kilometre','Araçtaki malzeme'].includes(row.firstChild.textContent))extra.append(row);
  if(c.tire){const t=el('p',null,'Lastik ölçüsü: '+c.tire);extra.append(t)}
  if(c.purchaseMonth&&isPrivileged())extra.append(el('p',null,'Alındığı ay: '+c.purchaseMonth.split('-').reverse().join('.')));
  for(const list of [...k.querySelectorAll('ul')])extra.append(list);
  if(c.inspectionCheckNote)extra.append(el('p',null,c.inspectionCheckNote));
  if(info.roadPeriod)extra.append(el('p',null,'Seyrüsefer dönemi: '+info.roadPeriod.join(' – ')));
  if(sv||fv)extra.append(el('small',null,'Gider toplamları '+ayAd+' içindir.'));
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
