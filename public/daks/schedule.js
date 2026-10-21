// Kaynak: KKTC Bayındırlık ve Ulaştırma Bakanlığı, 2025–2026 muayene duyurusu.
const inspectionSource='https://bub.gov.ct.tr/Portals/42/2025-2026%20muayene%20A3.pdf';
const privateSchedule=[
 ['A B C D E F G H J AF AG AH AJ AK AL AN AP AR BF BG BH BJ BY BZ CR CS CT DG DH DJ DK DL EC ED EE EF EG EH EJ EK EL EM','2026-08-03','2026-08-11'],
 ['FB FC FD FE FF GM GN GP GR GS GT GU GV GY GZ HA HB HC HD HE HF HG HH HJ HK HL','2026-08-12','2026-08-20'],
 ['HM HN HP HR KD KE KF KG KH KJ KK KL KM KN LL LM LN LP LR LS LT LU LV','2026-08-21','2026-09-01'],
 ['MS MT MU MV MY MZ NA NB NC PD PE PF','2026-09-02','2026-09-14'],
 ['PG PH PJ PK PL PM PN PP PR PS PT SA','2026-09-15','2026-09-25'],
 ['SB SC SD SE SF SG SH SJ SK SL UM','2026-09-28','2026-10-09'],
 ['UN UP UR US UT UU UV UY UZ VA VB','2026-10-12','2026-10-23'],
 ['VC VD VE VF VG VH VJ VK VL VM VN','2026-10-26','2026-11-09']
];
function inspectionWindow(car){
 const plate=car.plate.replace(/\s+/g,'').toUpperCase();const prefix=plate.match(/^[A-Z]+/)?.[0];
 if(car.vehicleClass==='private'){const group=privateSchedule.find(g=>g[0].split(' ').includes(prefix));if(group)return {start:group[1],end:group[2]};}
 if(car.vehicleClass==='van'&&'NZ PA PB PC PD PE PF PG PH PJ PK PL PM'.split(' ').includes(prefix))return {start:'2026-02-17',end:'2026-02-25'};
 if(car.vehicleClass==='rental')return {start:'2026-01-02',end:'2026-04-30'};
 if(car.vehicleClass==='school')return {start:'2026-07-01',end:'2026-07-31'};
 return null;
}
function trackingPlan(car){
 const today=new Date();today.setHours(0,0,0,0);const fmt=d=>d.toLocaleDateString('tr-TR');
 let road='İlk seyrüsefer tarihi girilmeli';let roadDue=null;
 if(car.firstRoad){const base=new Date(car.firstRoad+'T00:00:00');roadDue=new Date(today.getFullYear(),base.getMonth(),1);if(base.getMonth()<today.getMonth())roadDue.setFullYear(roadDue.getFullYear()+1);road=roadDue.toLocaleDateString('tr-TR',{month:'long',year:'numeric'})+' · tahmini kontrol ayı';}
 const window=inspectionWindow(car);let inspection='Araç sınıfı / resmî takvim kontrol edilmeli';let inspectionDue=null;
 if(car.inspection){inspectionDue=new Date(car.inspection+'T00:00:00');inspection='Girilen belge tarihi: '+fmt(inspectionDue);}
 else if(window){const start=new Date(window.start+'T00:00:00'),end=new Date(window.end+'T00:00:00');inspectionDue=start;inspection=fmt(start)+' – '+fmt(end)+' · resmî 2025–2026 dönemi';if(end<today)inspection+=' · yeni dönem / belge kontrol edilmeli';}
 return {road,roadDue,inspection,inspectionDue};
}

