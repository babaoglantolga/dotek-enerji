/* DAKS · bulut bağlantısı: kayıtlar Dotek ortak veritabanında, giriş DSYS kullanıcı adı ve şifresiyle */
(function(){
const sb=supabase.createClient("https://lbrbbmpebmepbrvxdfyi.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxicmJibXBlYm1lcGJydnhkZnlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNTU4NTgsImV4cCI6MjEwNzgzMTg1OH0.UaXo2-XKSL2asf1wSniJT3sYUzmvMLINcrzB50evSiA"),DOMAIN="dotek.app",ROLAD={admin:'Ana yönetici',office:'Ofis',vehicle:'Araç sorumlusu',driver:'Şoför'};
let coz;const hazir=new Promise(r=>coz=r);let son=null;
const norm=u=>u.trim().toLowerCase().replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u').replace(/[^a-z0-9._]/g,'');
const cev=(st,o)=>new Response(JSON.stringify(o),{status:st,headers:{'Content-Type':'application/json'}});
const of=window.fetch.bind(window);
window.fetch=async(u,o={})=>{
 if(typeof u!=='string'||!u.startsWith('/api/'))return of(u,o);
 await hazir;const m=(o.method||'GET').toUpperCase();
 try{
  if(u==='/api/state'&&m==='GET'){const {data,error}=await sb.rpc('daks_oku');if(error)throw error;son=data;return cev(200,data)}
  if(u==='/api/state'&&m==='PUT'){const b=JSON.parse(o.body);const {data,error}=await sb.rpc('daks_kaydet',{rev:b.revision,veri:{cars:b.cars,weekly:b.weekly,records:b.records}});if(error)return cev(409,{error:error.message});return cev(200,{revision:data})}
  if(u==='/api/backup-time'&&m==='GET'){const {data,error}=await sb.rpc('daks_oku');if(error)throw error;return cev(200,{lastBackup:data.yedek||null})}
  if(u==='/api/backup-time'&&m==='POST'){const {data,error}=await sb.rpc('daks_yedek_alindi');if(error)throw error;return cev(200,{lastBackup:data})}
  return cev(404,{error:'Bulunamadı'});
 }catch(e){return cev(500,{error:(e&&e.message)||'Bağlantı hatası'})}
};
const css=document.createElement('style');css.textContent='#dgiris{position:fixed;inset:0;z-index:999;background:#0b1830;display:grid;place-items:center;padding:16px}#dgiris form{background:#fff;color:#14284b;border-radius:16px;padding:26px 22px;width:100%;max-width:360px;font-family:inherit}#dgiris h2{margin:0 0 4px}#dgiris p{margin:0 0 14px;color:#5b6b8c;font-size:14px}#dgiris label{display:block;font-size:13px;margin:10px 0 4px;color:#5b6b8c}#dgiris input{width:100%;box-sizing:border-box;padding:11px;border:1px solid #cbd3e0;border-radius:9px;font:inherit}#dgiris button{margin-top:16px;width:100%;padding:12px;border:0;border-radius:9px;background:#14284b;color:#fff;font:inherit;font-weight:700;cursor:pointer}#dgiris .h{color:#c23030;font-size:13px;min-height:18px;margin-top:8px}#dkul{display:flex;align-items:center;gap:8px;color:#b6c9dd;font-size:13px;margin-top:6px}#dkul button{background:transparent;border:1px solid #b6c9dd55;color:#b6c9dd;border-radius:8px;padding:4px 10px;font:inherit;cursor:pointer}';document.head.appendChild(css);
function girisGoster(msg){let g=document.getElementById('dgiris');if(!g){g=document.createElement('div');g.id='dgiris';document.body.appendChild(g)}
 g.innerHTML='<form><h2>DAKS · Giriş</h2><p>Dotek Araç Kontrol Sistemi. Saha programındaki (DSYS) kullanıcı adı ve şifrenle gir.</p><label for="dgu">Kullanıcı adı</label><input id="dgu" autocomplete="username" autocapitalize="none" required><label for="dgp">Şifre</label><input id="dgp" type="password" autocomplete="current-password" required><div class="h" role="alert">'+(msg||'')+'</div><button>Giriş yap</button></form>';
 g.querySelector('form').onsubmit=async e=>{e.preventDefault();const h=g.querySelector('.h');h.textContent='Giriliyor…';const {error}=await sb.auth.signInWithPassword({email:norm(g.querySelector('#dgu').value)+'@'+DOMAIN,password:g.querySelector('#dgp').value});if(error){h.textContent='Kullanıcı adı veya şifre hatalı.';return}basla()};setTimeout(()=>g.querySelector('#dgu').focus(),30)}
async function basla(){
 const {data:{session}}=await sb.auth.getSession();if(!session){girisGoster();return}
 const {data,error}=await sb.rpc('daks_oku');if(error){girisGoster('Bu hesabın DAKS yetkisi yok. Doğuş’tan yetki iste.');await sb.auth.signOut();return}
 const g=document.getElementById('dgiris');if(g)g.remove();
 const sel=document.getElementById('role');if(sel){sel.value=data.rol;if(data.rol!=='admin'){sel.disabled=true;sel.parentElement.style.display='none'}else{const l=sel.parentElement.querySelector('label');if(l)l.textContent='Görünüm (önizleme)'}}
 const hd=document.querySelector('header');if(hd&&!document.getElementById('dkul')){const k=document.createElement('div');k.id='dkul';k.innerHTML='<span>👤 '+(data.ad||'')+' · '+(ROLAD[data.rol]||'')+'</span><button type="button">Çıkış</button>';k.querySelector('button').onclick=async()=>{await sb.auth.signOut();location.reload()};hd.appendChild(k)}
 if(sel)sel.dispatchEvent(new Event('change'));coz();
}
basla();
})();
