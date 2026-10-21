function fuelCycles(entries,plate){
 const list=entries.filter(r=>r.kind==='fuel'&&r.plate===plate).sort((a,b)=>a.fuelDate.localeCompare(b.fuelDate)||a.km-b.km);let start=null,litres=0,amount=0,valid=true,previous=null;const cycles=[];
 for(const r of list){if(start){litres+=r.litres;amount+=r.amount;if(r.fuelType!==start.fuelType||r.km<=previous.km)valid=false;if(r.fullTank){if(valid&&r.km>start.km)cycles.push({start:start.fuelDate,end:r.fuelDate,km:r.km-start.km,litres,amount,rate:litres/(r.km-start.km)*100,cost:amount/(r.km-start.km)});start=r;litres=0;amount=0;valid=true;}}else if(r.fullTank)start=r;previous=r;}
 return cycles;
}
function auditFuel(r,car,all){
 const priceMismatch=r.unitPrice>0&&Math.abs(r.unitPrice*r.litres-r.amount)>0.1;
 const issues=[];if(!r.receiptNo)issues.push('Fiş bilgisi eksik');if(!r.cardPayment)issues.push('Kart ödemesi eşleştirilmedi');else {if(Math.abs(r.amount-r.cardPayment.amount)>0.02)issues.push('Kart / fiş tutarı uyuşmuyor');if(r.cardPayment.date!==r.fuelDate)issues.push('Kart / alım tarihi farklı');if(r.station&&r.cardPayment.station.toLocaleLowerCase('tr-TR')!==r.station.toLocaleLowerCase('tr-TR'))issues.push('Kart / istasyon bilgisi farklı');}
 if(r.receiptNo&&all.some(x=>x!==r&&x.kind==='fuel'&&x.receiptNo===r.receiptNo&&x.station===r.station))issues.push('Aynı fiş tekrar girilmiş');
 if(r.cardPayment?.reference&&all.some(x=>x!==r&&x.kind==='fuel'&&x.cardPayment?.reference===r.cardPayment.reference))issues.push('Kart işlem referansı tekrar kullanılmış');
 if(car?.tankCapacity>0&&r.litres>car.tankCapacity)issues.push('Alım depo kapasitesini aşıyor');if(priceMismatch)issues.push('Litre × birim fiyat fiş tutarını karşılamıyor');return issues;
}
function renderFuelAudit(){
 if(!document.getElementById('fuelAudit'))return;const container=document.getElementById('fuelAudit');container.replaceChildren();
 if(document.getElementById('role').value==='driver')return;
 const month=document.getElementById('fuelMonth')?.value;
 const list=records.filter(r=>r.kind==='fuel'&&(!month||r.fuelDate.slice(0,7)===month));
 for(const r of list){const card=document.createElement('article');card.className='card';card.style.marginTop='15px';const heading=document.createElement('h3');heading.textContent=r.plate+' · '+r.fuelDate+' · '+r.litres+' L · '+r.amount+' TL';const issues=auditFuel(r,cars.find(c=>c.plate===r.plate),records);const status=document.createElement('p');status.textContent=issues.length?'KONTROL ET: '+issues.join(' · '):'Fiş bilgileri ve girilen kart hareketi eşleşiyor.';if(issues.length)status.className='consumption-status high-consumption';card.append(heading,status);
 if(isPrivileged()){const form=document.createElement('form');const fields={date:['Kart işlem tarihi','date',r.cardPayment?.date||r.fuelDate],amount:['Kart ödemesi (TL)','number',r.cardPayment?.amount??''],station:['Kart ekstresindeki istasyon','text',r.cardPayment?.station||''],reference:['Kart işlem referansı','text',r.cardPayment?.reference||'']};const inputs={};for(const [key,[label,type,value]]of Object.entries(fields)){const caption=document.createElement('label');caption.textContent=label;const input=document.createElement('input');input.type=type;input.value=value;input.required=true;if(type==='number'){input.min='0.01';input.step='0.01';}input.maxLength=150;caption.append(input);form.append(caption);inputs[key]=input;}const button=document.createElement('button');button.textContent='Kart hareketini eşleştir ve kaydet';button.style.marginTop='15px';form.append(button);form.addEventListener('submit',async e=>{e.preventDefault();const previous=r.cardPayment;r.cardPayment={date:inputs.date.value,amount:Number(inputs.amount.value),station:inputs.station.value.trim(),reference:inputs.reference.value.trim()};if(!await persistData()){r.cardPayment=previous;return;}render();});card.append(form);}
 container.append(card);}
 if(!list.length){const text=document.createElement('p');text.textContent='Seçilen ayda eşleştirilecek yakıt kaydı yok.';container.append(text);}
}
