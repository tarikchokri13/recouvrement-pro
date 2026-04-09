/* eslint-disable no-restricted-globals */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

var API = (window.location.hostname === "localhost") ? "http://localhost:3001" : "";
var TYPES = ["Chèque", "LCN", "Facture"];
var STATUTS = ["Nouveau", "En cours", "Relancé", "Contentieux", "Payé", "Impayé définitif", "Prescrit"];
var MOTIFS = ["Provision insuffisante", "Absence de provision", "Compte clôturé", "Opposition", "Signature non conforme", "Montant en chiffres et lettres différent", "Chèque prescrit", "Endos irrégulier", "Autre"];
var ACTIONS_REL = ["Appel téléphonique", "Visite terrain", "Mise en demeure", "Email/SMS", "Courrier recommandé", "Transmission avocat", "Accord amiable", "Autre"];
var MODES_PAY = [{v:"especes",l:"Espèces"},{v:"cheque",l:"Chèque"},{v:"virement",l:"Virement"},{v:"effet",l:"Effet"},{v:"mobile",l:"Mobile"},{v:"prelevement",l:"Prélèvement"},{v:"autre",l:"Autre"}];
var CANAUX = ["telephone","email","sms","whatsapp","courrier","visite","autre"];
var T={bg:"#0C0F1A",bgCard:"#141829",bgHov:"#1C2038",bgInput:"#0F1225",brd:"#252A40",txt:"#E8EAED",txtDim:"#8890A6",acc:"#D4A843",accLight:"#D4A84320",accDark:"#B8922F",green:"#34D399",greenBg:"#34D39918",red:"#F87171",redBg:"#F8717118",orange:"#FBBF24",orangeBg:"#FBBF2418",blue:"#60A5FA",blueBg:"#60A5FA18",purple:"#A78BFA",purpleBg:"#A78BFA18"};
var SC={"Nouveau":{bg:T.blueBg,txt:T.blue},"En cours":{bg:T.orangeBg,txt:T.orange},"Relancé":{bg:T.purpleBg,txt:T.purple},"Contentieux":{bg:T.redBg,txt:T.red},"Payé":{bg:T.greenBg,txt:T.green},"Impayé définitif":{bg:"#52525B20",txt:"#A1A1AA"},"Prescrit":{bg:"#92400E20",txt:"#92400E"}};
var fmtM=function(v){return(!v&&v!==0)?"—":Number(v).toLocaleString("fr-MA",{minimumFractionDigits:2})+" MAD"};
var fmtD=function(d){return!d?"—":new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"})};
var fmtDT=function(d){return!d?"—":new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})};
var iS={width:"100%",padding:"10px 12px",background:T.bgInput,border:"1px solid "+T.brd,borderRadius:8,color:T.txt,fontSize:13,outline:"none"};
var bs={padding:"10px 18px",background:T.acc,color:"#0C0F1A",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"};
var dim={fontSize:11,fontWeight:600,color:T.txtDim,display:"block",marginBottom:3};

export default function App(){
var _tok=useState(function(){return localStorage.getItem("rp_token")||""}),token=_tok[0],setToken=_tok[1];
var _user=useState(function(){try{return JSON.parse(localStorage.getItem("rp_user"))}catch(e){return null}}),user=_user[0],setUser=_user[1];
var _lu=useState(""),loginU=_lu[0],setLoginU=_lu[1];
var _lp=useState(""),loginP=_lp[0],setLoginP=_lp[1];
var _le=useState(""),loginErr=_le[0],setLoginErr=_le[1];
var _page=useState("dashboard"),page=_page[0],setPage=_page[1];
var _col=useState(false),collapsed=_col[0],setCollapsed=_col[1];
var _records=useState([]),records=_records[0],setRecords=_records[1];
var _users=useState([]),users=_users[0],setUsers=_users[1];
var _activities=useState([]),activities=_activities[0],setActivities=_activities[1];
var _societe=useState({}),societe=_societe[0],setSociete=_societe[1];
var _aging=useState([]),aging=_aging[0],setAging=_aging[1];
var _prescSoon=useState([]),prescSoon=_prescSoon[0],setPrescSoon=_prescSoon[1];
var _search=useState(""),search=_search[0],setSearch=_search[1];
var _fType=useState(""),filterType=_fType[0],setFilterType=_fType[1];
var _fStatut=useState(""),filterStatut=_fStatut[0],setFilterStatut=_fStatut[1];
var _fClient=useState(""),filterClient=_fClient[0],setFilterClient=_fClient[1];
var _showForm=useState(false),showForm=_showForm[0],setShowForm=_showForm[1];
var _showRel=useState(false),showRel=_showRel[0],setShowRel=_showRel[1];
var _showPay=useState(false),showPay=_showPay[0],setShowPay=_showPay[1];
var _showDetail=useState(null),showDetail=_showDetail[0],setShowDetail=_showDetail[1];
var _showUF=useState(false),showUF=_showUF[0],setShowUF=_showUF[1];
var _editRec=useState(null),editRec=_editRec[0],setEditRec=_editRec[1];
var _msg=useState(""),msg=_msg[0],setMsg=_msg[1];
var _err=useState(""),err=_err[0],setErr=_err[1];
var _selRec=useState(null),selRec=_selRec[0],setSelRec=_selRec[1];
var _recPay=useState([]),recPay=_recPay[0],setRecPay=_recPay[1];
var _recRel=useState([]),recRel=_recRel[0],setRecRel=_recRel[1];
var _aiResult=useState(null),aiResult=_aiResult[0],setAiResult=_aiResult[1];
var _aiLoading=useState(false),aiLoading=_aiLoading[0],setAiLoading=_aiLoading[1];
var _showClientForm=useState(false),showClientForm=_showClientForm[0],setShowClientForm=_showClientForm[1];
var _editClient=useState(null),editClient=_editClient[0],setEditClient=_editClient[1];
var _clients=useState([]),clients=_clients[0],setClients=_clients[1];
var _cf=useState({nom:"",ice:"",rc:"",adresse:"",ville:"",tel:"",email:"",contact_nom:"",contact_tel:""}),cf=_cf[0],setCf=_cf[1];
var emptyCf={nom:"",ice:"",rc:"",adresse:"",ville:"",tel:"",email:"",contact_nom:"",contact_tel:""};

var emptyForm={type:"Chèque",nom_debiteur:"",cin_debiteur:"",rc_debiteur:"",ice_debiteur:"",adresse_debiteur:"",tel_debiteur:"",email_debiteur:"",num_compte:"",num_document:"",banque:"",agence_bancaire:"",montant:"",date_echeance:"",motif_rejet:"",nom_client:"",ville:"",notes:"",priorite:"Normale",canal_prefere:""};
var _form=useState(emptyForm),form=_form[0],setForm=_form[1];
var _rf=useState({action:"",canal:"telephone",details:"",date_prochain_rdv:""}),rf=_rf[0],setRf=_rf[1];
var _pf=useState({montant:"",mode:"especes",date_paiement:new Date().toISOString().slice(0,10),reference_paiement:"",banque:"",notes:""}),pf=_pf[0],setPf=_pf[1];
var _uf=useState({username:"",password:"",nom:"",role:"agent"}),uf=_uf[0],setUf=_uf[1];

var hdr=useCallback(function(){return{"Content-Type":"application/json","Authorization":"Bearer "+token}},[token]);

var api=useCallback(function(method,path,body){
  var opts={method:method,headers:hdr()};
  if(body)opts.body=JSON.stringify(body);
  return fetch(API+path,opts).then(function(r){
    if(r.status===401){setToken("");setUser(null);localStorage.removeItem("rp_token");localStorage.removeItem("rp_user");throw new Error("Session expirée");}
    var ct=r.headers.get("content-type")||"";
    if(!ct.includes("application/json"))throw new Error("Endpoint non disponible");
    return r.json().then(function(d){if(d.error)throw new Error(d.error);return d;});
  });
},[hdr,setToken,setUser]);

var errH=useCallback(function(e){setErr(e.message||"Erreur");setTimeout(function(){setErr("")},4000)},[]);
var okH=useCallback(function(m){setMsg(m);setTimeout(function(){setMsg("")},3000)},[]);

// ── Load (endpoints réels du server.js v2) ──
var loadAll=useCallback(function(){
  if(!token)return;
  api("GET","/api/records").then(setRecords).catch(errH);
  api("GET","/api/activities").then(setActivities).catch(function(){});
  api("GET","/api/users").then(setUsers).catch(function(){});
  api("GET","/api/societe").then(setSociete).catch(function(){});
  api("GET","/api/stats/aging").then(setAging).catch(function(){});
  api("GET","/api/stats/prescriptions").then(setPrescSoon).catch(function(){});
  api("GET","/api/clients").then(setClients).catch(function(){});
},[token,api,errH]);

var doLogin=function(){
  fetch(API+"/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:loginU,password:loginP})})
  .then(function(r){var ct=r.headers.get("content-type")||"";if(!ct.includes("application/json"))throw new Error("Serveur inaccessible");return r.json()})
  .then(function(d){if(d.error){setLoginErr(d.error);return;}setToken(d.token);setUser(d.user);localStorage.setItem("rp_token",d.token);localStorage.setItem("rp_user",JSON.stringify(d.user));setLoginErr("")})
  .catch(function(e){setLoginErr(e.message||"Serveur inaccessible")});
};

useEffect(function(){
  if(!token||!user){if(token&&!user){setToken("");localStorage.removeItem("rp_token")}return;}
  fetch(API+"/api/users",{headers:{"Authorization":"Bearer "+token}}).then(function(r){if(r.status===401)throw new Error("expired")}).catch(function(){setToken("");setUser(null);localStorage.removeItem("rp_token");localStorage.removeItem("rp_user")});
},[]); // eslint-disable-line react-hooks/exhaustive-deps

useEffect(function(){if(user&&token)loadAll()},[user,token,loadAll]);
useEffect(function(){if(!user)return;var iv=setInterval(loadAll,30000);return function(){clearInterval(iv)}},[user,loadAll]);

// ── Stats locales ──
var stats=useMemo(function(){
  var total=records.length,montant=0,recouvre=0,actifs=0,parStatut={},parType={};
  records.forEach(function(r){montant+=Number(r.montant)||0;recouvre+=Number(r.montant_paye)||0;if(r.statut!=="Payé"&&r.statut!=="Impayé définitif"&&r.statut!=="Prescrit")actifs++;var sk=r.statut||"Nouveau";if(!parStatut[sk])parStatut[sk]={statut:sk,count:0,montant:0};parStatut[sk].count++;parStatut[sk].montant+=Number(r.montant)||0;var tk=r.type||"Autre";if(!parType[tk])parType[tk]={type:tk,count:0,montant:0};parType[tk].count++;parType[tk].montant+=Number(r.montant)||0});
  return{total:total,montant:montant,recouvre:recouvre,actifs:actifs,parStatut:Object.values(parStatut),parType:Object.values(parType)};
},[records]);

// ── CRUD ──
var createRecord=function(){var data=Object.assign({},form);data.montant=parseFloat(data.montant)||0;api("POST","/api/records",data).then(function(){okH("Dossier créé");setShowForm(false);setForm(emptyForm);loadAll()}).catch(errH)};
var updateRecord=function(){var data=Object.assign({},form);data.montant=parseFloat(data.montant)||0;api("PUT","/api/records/"+editRec,data).then(function(){okH("Modifié");setShowForm(false);setEditRec(null);setForm(emptyForm);loadAll()}).catch(errH)};
var deleteRecord=function(id){if(!window.confirm("Supprimer ?"))return;api("DELETE","/api/records/"+id).then(function(){okH("Supprimé");loadAll()}).catch(errH)};
var changeStatut=function(id,s){api("PATCH","/api/records/"+id+"/statut",{statut:s}).then(function(){okH("Statut OK");loadAll()}).catch(errH)};
var assignAgent=function(id,aid){api("PATCH","/api/records/"+id+"/assign",{agent_id:aid}).then(function(){okH("Assigné");loadAll()}).catch(errH)};

// ── Relance → POST /api/relances ──
var doRel=function(){if(!rf.action){setErr("Sélectionnez une action");return;}api("POST","/api/relances",{record_id:selRec,type_relance:rf.action,canal:rf.canal,notes:rf.details,date_prochain_rdv:rf.date_prochain_rdv||""}).then(function(){okH("Relance OK");setShowRel(false);setRf({action:"",canal:"telephone",details:"",date_prochain_rdv:""});loadAll()}).catch(errH)};

// ── Paiement → POST /api/paiements ──
var doPay=function(){var mt=parseFloat(pf.montant);if(!mt||mt<=0){setErr("Montant invalide");return;}api("POST","/api/paiements",{record_id:selRec,montant:mt,date_paiement:pf.date_paiement,mode:pf.mode,reference_paiement:pf.reference_paiement,banque:pf.banque,notes:pf.notes}).then(function(){okH("Paiement OK");setShowPay(false);setPf({montant:"",mode:"especes",date_paiement:new Date().toISOString().slice(0,10),reference_paiement:"",banque:"",notes:""});loadAll()}).catch(errH)};

var loadRecPay=function(rid){api("GET","/api/paiements/"+rid).then(setRecPay).catch(function(){setRecPay([])})};
var loadRecRel=function(rid){api("GET","/api/relances/"+rid).then(setRecRel).catch(function(){setRecRel([])})};

var createUser=function(){if(!uf.username||!uf.password||!uf.nom){setErr("Champs requis");return;}api("POST","/api/users",uf).then(function(){okH("Créé");setShowUF(false);setUf({username:"",password:"",nom:"",role:"agent"});loadAll()}).catch(errH)};
var deleteUser=function(id){if(!window.confirm("Supprimer ?"))return;api("DELETE","/api/users/"+id).then(function(){okH("Supprimé");loadAll()}).catch(errH)};
var saveSociete=function(){api("PUT","/api/societe",societe).then(function(){okH("Sauvegardé")}).catch(errH)};
var exportExcel=function(){window.open(API+"/api/export/csv?token="+token,"_blank")};
var doBackup=function(){api("POST","/api/backup").then(function(){okH("Backup OK")}).catch(errH)};
var downloadDoc=function(type,id){window.open(API+"/api/documents/"+type+"/"+id+"?token="+token,"_blank")};

// ── Analyse IA → GET /api/ai/analyze/:id ──
var doAiAnalyze=function(id){setAiLoading(true);setAiResult(null);api("GET","/api/ai/analyze/"+id).then(function(d){setAiResult(d.analysis||d);setAiLoading(false)}).catch(function(e){setAiLoading(false);errH(e)})};

// ── Clients mandants CRUD ──
var createClient=function(){if(!cf.nom){setErr("Nom requis");return;}api("POST","/api/clients",cf).then(function(){okH("Client créé");setShowClientForm(false);setCf(emptyCf);loadAll()}).catch(errH)};
var updateClient=function(){api("PUT","/api/clients/"+editClient,cf).then(function(){okH("Client modifié");setShowClientForm(false);setEditClient(null);setCf(emptyCf);loadAll()}).catch(errH)};
var openEditClient=function(c){setEditClient(c.id);setCf({nom:c.nom||"",ice:c.ice||"",rc:c.rc||"",adresse:c.adresse||"",ville:c.ville||"",tel:c.tel||"",email:c.email||"",contact_nom:c.contact_nom||"",contact_tel:c.contact_tel||""});setShowClientForm(true)};

var filtered=useMemo(function(){return records.filter(function(r){if(filterType&&r.type!==filterType)return false;if(filterStatut&&r.statut!==filterStatut)return false;if(filterClient&&r.nom_client!==filterClient)return false;if(search){var s=search.toLowerCase();return(r.nom_debiteur||"").toLowerCase().includes(s)||(r.cin_debiteur||"").toLowerCase().includes(s)||(r.num_document||"").toLowerCase().includes(s)||(r.nom_client||"").toLowerCase().includes(s)||(r.banque||"").toLowerCase().includes(s)||String(r.id).toLowerCase().includes(s)}return true})},[records,filterType,filterStatut,filterClient,search]);
var clientsList=useMemo(function(){var c={};records.forEach(function(r){if(r.nom_client)c[r.nom_client]=true});return Object.keys(c).sort()},[records]);
var alerts=useMemo(function(){var a=[],today=new Date();records.forEach(function(r){if(r.statut==="Payé"||r.statut==="Impayé définitif"||r.statut==="Prescrit")return;if(r.date_echeance){var diff=Math.floor((today-new Date(r.date_echeance))/86400000);if(diff>90)a.push({type:"danger",text:r.nom_debiteur+" — "+diff+"j retard ("+fmtM(r.montant)+")",id:r.id});else if(diff>30)a.push({type:"warning",text:r.nom_debiteur+" — "+diff+"j retard",id:r.id})}});return a},[records]);

// ═══ LOGIN ═══
if(!user){return(
<div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0C0F1A,#1A1F35)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',sans-serif"}}>
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:16,padding:40,width:380,boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}>
<div style={{textAlign:"center",marginBottom:30}}><div style={{width:56,height:56,background:"linear-gradient(135deg,"+T.acc+","+T.accDark+")",borderRadius:14,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:"#0C0F1A",marginBottom:12}}>RP</div><div style={{fontSize:20,fontWeight:800,color:T.txt}}>Recouvrement Pro</div><div style={{fontSize:12,color:T.txtDim,marginTop:4}}>Gestion des créances impayées</div></div>
{loginErr&&<div style={{background:T.redBg,color:T.red,padding:"8px 12px",borderRadius:8,fontSize:12,marginBottom:12}}>{loginErr}</div>}
<div style={{marginBottom:14}}><label style={dim}>Identifiant</label><input value={loginU} onChange={function(e){setLoginU(e.target.value)}} onKeyDown={function(e){if(e.key==="Enter")doLogin()}} style={iS} placeholder="admin"/></div>
<div style={{marginBottom:20}}><label style={dim}>Mot de passe</label><input type="password" value={loginP} onChange={function(e){setLoginP(e.target.value)}} onKeyDown={function(e){if(e.key==="Enter")doLogin()}} style={iS} placeholder="••••••"/></div>
<button onClick={doLogin} style={Object.assign({},bs,{width:"100%",padding:12,fontSize:14})}>Connexion</button>
</div></div>)}

var isMgr=user.role==="manager";
var navItems=[{id:"dashboard",icon:"📊",label:"Tableau de Bord"},{id:"dossiers",icon:"📁",label:"Dossiers"},{id:"scanner",icon:"📸",label:"Scanner OCR"},{id:"paiements",icon:"💰",label:"Paiements"},{id:"prescription",icon:"⏰",label:"Prescription"},{id:"balance",icon:"📈",label:"Balance Âgée"},{id:"clients",icon:"🏢",label:"Clients",mgr:true},{id:"equipe",icon:"👥",label:"Équipe",mgr:true},{id:"historique",icon:"📜",label:"Historique"},{id:"parametres",icon:"⚙️",label:"Paramètres",mgr:true}].filter(function(n){return!n.mgr||isMgr});

// ═══ MAIN ═══
return(
<div style={{display:"flex",minHeight:"100vh",background:T.bg,fontFamily:"'Segoe UI',sans-serif",color:T.txt}}>
{/* SIDEBAR */}
<aside style={{width:collapsed?64:220,background:T.bgCard,borderRight:"1px solid "+T.brd,display:"flex",flexDirection:"column",transition:"width .2s",flexShrink:0,overflow:"hidden"}}>
<div style={{padding:collapsed?"16px 10px":"16px 18px",borderBottom:"1px solid "+T.brd,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={function(){setCollapsed(!collapsed)}}><div style={{width:36,height:36,background:"linear-gradient(135deg,"+T.acc+","+T.accDark+")",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#0C0F1A",flexShrink:0}}>RP</div>{!collapsed&&<div><div style={{fontSize:14,fontWeight:800}}>Recouvrement Pro</div><div style={{fontSize:10,color:T.txtDim}}>{user.nom} — {user.role}</div></div>}</div>
<nav style={{flex:1,padding:"8px 0"}}>{navItems.map(function(n){var active=page===n.id;return<div key={n.id} onClick={function(){setPage(n.id)}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 18px",margin:"2px 8px",borderRadius:8,cursor:"pointer",background:active?T.accLight:"transparent",color:active?T.acc:T.txtDim,fontWeight:active?700:500,fontSize:13}}><span style={{fontSize:16,flexShrink:0}}>{n.icon}</span>{!collapsed&&<span>{n.label}</span>}</div>})}</nav>
<div style={{padding:"12px 8px",borderTop:"1px solid "+T.brd}}><button onClick={function(){setToken("");setUser(null);localStorage.removeItem("rp_token");localStorage.removeItem("rp_user")}} style={{width:"100%",padding:"8px",background:T.redBg,border:"none",borderRadius:8,color:T.red,fontSize:12,fontWeight:600,cursor:"pointer"}}>{collapsed?"🚪":"Déconnexion"}</button></div>
</aside>

<main style={{flex:1,overflow:"auto",padding:24,maxHeight:"100vh"}}>
{msg&&<div style={{position:"fixed",top:16,right:16,background:T.greenBg,border:"1px solid "+T.green,color:T.green,padding:"10px 18px",borderRadius:10,fontSize:13,fontWeight:600,zIndex:9999}}>{msg}</div>}
{err&&<div style={{position:"fixed",top:16,right:16,background:T.redBg,border:"1px solid "+T.red,color:T.red,padding:"10px 18px",borderRadius:10,fontSize:13,fontWeight:600,zIndex:9999}}>{err}</div>}

{/* ══ DASHBOARD ══ */}
{page==="dashboard"&&<div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div><div style={{fontSize:22,fontWeight:800}}>Tableau de Bord</div></div><div style={{display:"flex",gap:8}}>{isMgr&&<button onClick={doBackup} style={Object.assign({},bs,{background:T.bgHov,color:T.txtDim,fontSize:11,padding:"8px 14px"})}>💾 Backup</button>}<button onClick={exportExcel} style={Object.assign({},bs,{fontSize:11,padding:"8px 14px"})}>📥 Export Excel</button></div></div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:20}}>
{[{l:"Dossiers",v:stats.total,c:T.blue,i:"📁"},{l:"Montant Total",v:fmtM(stats.montant),c:T.orange,i:"💰"},{l:"Recouvré",v:fmtM(stats.recouvre),c:T.green,i:"✅"},{l:"Actifs",v:stats.actifs,c:T.purple,i:"⚡"},{l:"Taux",v:stats.montant?((stats.recouvre/stats.montant)*100).toFixed(1)+"%":"0%",c:T.acc,i:"📈"}].map(function(k,i){return<div key={i} style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:11,color:T.txtDim,fontWeight:600}}>{k.l}</span><span style={{fontSize:20}}>{k.i}</span></div><div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div></div>})}
</div>
{alerts.length>0&&<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18,marginBottom:20}}><div style={{fontSize:14,fontWeight:700,marginBottom:10}}>🔔 Alertes ({alerts.length})</div>{alerts.slice(0,8).map(function(a,i){return<div key={i} style={{padding:"8px 12px",borderRadius:8,marginBottom:4,background:a.type==="danger"?T.redBg:T.orangeBg,color:a.type==="danger"?T.red:T.orange,fontSize:12,cursor:"pointer"}} onClick={function(){setPage("dossiers");setSearch(String(a.id))}}>{a.text}</div>})}</div>}
{prescSoon.length>0&&<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18,marginBottom:20}}><div style={{fontSize:14,fontWeight:700,marginBottom:10,color:T.red}}>⏰ Prescriptions Imminentes ({prescSoon.length})</div>{prescSoon.slice(0,5).map(function(p,i){var jrs=Math.floor((new Date(p.date_prescription)-new Date())/86400000);return<div key={i} style={{padding:"8px 12px",borderRadius:8,marginBottom:4,background:jrs<=7?T.redBg:T.orangeBg,color:jrs<=7?T.red:T.orange,fontSize:12}}>{p.nom_debiteur} — {p.type} — {fmtM(p.montant)} — prescrit le {fmtD(p.date_prescription)} ({jrs}j)</div>})}</div>}
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18}}><div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Par Statut</div>{stats.parStatut.map(function(s,i){var sc=SC[s.statut]||{bg:T.bgHov,txt:T.txtDim};return<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderRadius:6,marginBottom:4,background:sc.bg}}><span style={{color:sc.txt,fontSize:12,fontWeight:600}}>{s.statut}</span><span style={{color:sc.txt,fontSize:12}}>{s.count} — {fmtM(s.montant)}</span></div>})}</div>
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18}}><div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Par Type</div>{stats.parType.map(function(t,i){return<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderRadius:6,marginBottom:4,background:T.bgHov}}><span style={{fontSize:12,fontWeight:600}}>{t.type}</span><span style={{fontSize:12,color:T.txtDim}}>{t.count} — {fmtM(t.montant)}</span></div>})}</div>
</div></div>}

{/* ══ DOSSIERS ══ */}
{page==="dossiers"&&<div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontSize:22,fontWeight:800}}>Dossiers ({filtered.length})</div><div style={{display:"flex",gap:8}}><button onClick={function(){setPage("scanner")}} style={Object.assign({},bs,{background:T.bgHov,color:T.acc})}>📸 Scanner</button><button onClick={function(){setEditRec(null);setForm(emptyForm);setShowForm(true)}} style={bs}>+ Nouveau</button></div></div>
<div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}><input placeholder="🔍 Rechercher..." value={search} onChange={function(e){setSearch(e.target.value)}} style={Object.assign({},iS,{flex:1,minWidth:200})}/><select value={filterType} onChange={function(e){setFilterType(e.target.value)}} style={Object.assign({},iS,{width:130})}><option value="">Tous types</option>{TYPES.map(function(t){return<option key={t}>{t}</option>})}</select><select value={filterStatut} onChange={function(e){setFilterStatut(e.target.value)}} style={Object.assign({},iS,{width:150})}><option value="">Tous statuts</option>{STATUTS.map(function(s){return<option key={s}>{s}</option>})}</select><select value={filterClient} onChange={function(e){setFilterClient(e.target.value)}} style={Object.assign({},iS,{width:160})}><option value="">Tous clients</option>{clientsList.map(function(c){return<option key={c}>{c}</option>})}</select></div>
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{background:T.bgHov}}>{["Type","Débiteur","CIN/RC","Banque","Montant","Payé","Solde","Échéance","Statut","Client","Actions"].map(function(h){return<th key={h} style={{padding:"10px 12px",textAlign:"left",color:T.txtDim,fontWeight:600,fontSize:11,borderBottom:"1px solid "+T.brd}}>{h}</th>})}</tr></thead>
<tbody>{filtered.map(function(r){var sc=SC[r.statut]||{bg:T.bgHov,txt:T.txtDim};return<tr key={r.id} style={{borderBottom:"1px solid "+T.brd+"40",cursor:"pointer"}} onClick={function(){setShowDetail(r);setAiResult(null);loadRecPay(r.id);loadRecRel(r.id)}}>
<td style={{padding:"10px 12px"}}>{r.type}</td>
<td style={{padding:"10px 12px",fontWeight:600}}>{r.nom_debiteur||"—"}</td>
<td style={{padding:"10px 12px",color:T.txtDim}}>{r.cin_debiteur||r.rc_debiteur||"—"}</td>
<td style={{padding:"10px 12px",color:T.txtDim}}>{r.banque||"—"}</td>
<td style={{padding:"10px 12px",fontWeight:700,color:T.orange}}>{fmtM(r.montant)}</td>
<td style={{padding:"10px 12px",color:T.green}}>{Number(r.montant_paye)>0?fmtM(r.montant_paye):"—"}</td>
<td style={{padding:"10px 12px",fontWeight:700,color:Number(r.solde_restant)>0?T.red:T.green}}>{fmtM(r.solde_restant)}</td>
<td style={{padding:"10px 12px",color:T.txtDim}}>{fmtD(r.date_echeance)}</td>
<td style={{padding:"10px 12px"}}><span style={{background:sc.bg,color:sc.txt,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>{r.statut}</span></td>
<td style={{padding:"10px 12px",color:T.txtDim}}>{r.nom_client||"—"}</td>
<td style={{padding:"10px 12px"}} onClick={function(e){e.stopPropagation()}}><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
<select value={r.statut} onChange={function(e){changeStatut(r.id,e.target.value)}} style={{background:T.bgInput,border:"1px solid "+T.brd,borderRadius:6,color:T.txt,fontSize:10,padding:"4px",cursor:"pointer"}}>{STATUTS.map(function(s){return<option key={s}>{s}</option>})}</select>
{isMgr&&<select value={r.assigned_to||""} onChange={function(e){assignAgent(r.id,e.target.value)}} style={{background:T.bgInput,border:"1px solid "+T.brd,borderRadius:6,color:T.txt,fontSize:10,padding:"4px",cursor:"pointer",maxWidth:80}}><option value="">Assigner</option>{users.filter(function(u){return u.role==="agent"}).map(function(u){return<option key={u.id} value={u.id}>{u.nom}</option>})}</select>}
<button onClick={function(){setSelRec(r.id);setShowRel(true)}} style={{background:T.orangeBg,border:"none",borderRadius:6,color:T.orange,fontSize:10,padding:"4px 8px",cursor:"pointer"}}>📞</button>
<button onClick={function(){setSelRec(r.id);setShowPay(true)}} style={{background:T.greenBg,border:"none",borderRadius:6,color:T.green,fontSize:10,padding:"4px 8px",cursor:"pointer"}}>💰</button>
<button onClick={function(){setEditRec(r.id);setForm({type:r.type||"Chèque",nom_debiteur:r.nom_debiteur||"",cin_debiteur:r.cin_debiteur||"",rc_debiteur:r.rc_debiteur||"",ice_debiteur:r.ice_debiteur||"",adresse_debiteur:r.adresse_debiteur||"",tel_debiteur:r.tel_debiteur||"",email_debiteur:r.email_debiteur||"",num_compte:r.num_compte||"",num_document:r.num_document||"",banque:r.banque||"",agence_bancaire:r.agence_bancaire||"",montant:r.montant||"",date_echeance:r.date_echeance||"",motif_rejet:r.motif_rejet||"",nom_client:r.nom_client||"",ville:r.ville||"",notes:r.notes||"",priorite:r.priorite||"Normale",canal_prefere:r.canal_prefere||""});setShowForm(true)}} style={{background:T.blueBg,border:"none",borderRadius:6,color:T.blue,fontSize:10,padding:"4px 8px",cursor:"pointer"}}>✏️</button>
{isMgr&&<button onClick={function(){deleteRecord(r.id)}} style={{background:T.redBg,border:"none",borderRadius:6,color:T.red,fontSize:10,padding:"4px 8px",cursor:"pointer"}}>🗑️</button>}
</div></td></tr>})}</tbody></table></div>{filtered.length===0&&<div style={{textAlign:"center",padding:40,color:T.txtDim}}>Aucun dossier</div>}</div></div>}

{/* ══ SCANNER ══ */}
{page==="scanner"&&<ScanPage token={token} api={api} onDone={function(){loadAll();setPage("dossiers");okH("Dossier créé par scan")}} errH={errH}/>}

{/* ══ PAIEMENTS ══ */}
{page==="paiements"&&<div>
<div style={{fontSize:22,fontWeight:800,marginBottom:20}}>💰 Paiements</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:20}}>
{[{l:"Créances",v:fmtM(stats.montant),c:T.orange},{l:"Recouvré",v:fmtM(stats.recouvre),c:T.green},{l:"Reste",v:fmtM(stats.montant-stats.recouvre),c:T.red},{l:"Taux",v:stats.montant?((stats.recouvre/stats.montant)*100).toFixed(1)+"%":"0%",c:T.acc}].map(function(k,i){return<div key={i} style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18}}><div style={{fontSize:11,color:T.txtDim,fontWeight:600,marginBottom:8}}>{k.l}</div><div style={{fontSize:20,fontWeight:800,color:k.c}}>{k.v}</div></div>})}
</div>
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{background:T.bgHov}}>{["Débiteur","Type","Montant","Payé","Solde","Statut",""].map(function(h){return<th key={h} style={{padding:"10px 12px",textAlign:"left",color:T.txtDim,fontWeight:600,fontSize:11,borderBottom:"1px solid "+T.brd}}>{h}</th>})}</tr></thead>
<tbody>{records.filter(function(r){return r.statut!=="Payé"&&r.statut!=="Impayé définitif"&&r.statut!=="Prescrit"}).map(function(r){var paid=Number(r.montant_paye)||0,mt=Number(r.montant)||0,pct=mt?((paid/mt)*100).toFixed(0):0;return<tr key={r.id} style={{borderBottom:"1px solid "+T.brd+"40"}}><td style={{padding:"10px 12px",fontWeight:600}}>{r.nom_debiteur||"—"}</td><td style={{padding:"10px 12px"}}>{r.type}</td><td style={{padding:"10px 12px",color:T.orange,fontWeight:700}}>{fmtM(mt)}</td><td style={{padding:"10px 12px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{flex:1,height:6,background:T.bgHov,borderRadius:3}}><div style={{width:pct+"%",height:"100%",background:T.green,borderRadius:3}}></div></div><span style={{color:T.green,fontSize:11,minWidth:35}}>{pct}%</span></div></td><td style={{padding:"10px 12px",color:T.red,fontWeight:700}}>{fmtM(Number(r.solde_restant)||0)}</td><td style={{padding:"10px 12px"}}><span style={{background:(SC[r.statut]||{}).bg,color:(SC[r.statut]||{}).txt,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>{r.statut}</span></td><td style={{padding:"10px 12px"}}><button onClick={function(){setSelRec(r.id);setShowPay(true)}} style={Object.assign({},bs,{padding:"6px 12px",fontSize:11})}>+ Paiement</button></td></tr>})}</tbody></table></div></div></div>}

{/* ══ PRESCRIPTION ══ */}
{page==="prescription"&&<div>
<div style={{fontSize:22,fontWeight:800,marginBottom:6}}>⏰ Prescriptions</div>
<div style={{fontSize:12,color:T.txtDim,marginBottom:20}}>Chèque = 6 mois · LCN = 3 ans · Facture = 5 ans</div>
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{background:T.bgHov}}>{["Débiteur","Type","Montant","Échéance","Prescription","Jours","Statut"].map(function(h){return<th key={h} style={{padding:"10px 12px",textAlign:"left",color:T.txtDim,fontWeight:600,fontSize:11,borderBottom:"1px solid "+T.brd}}>{h}</th>})}</tr></thead>
<tbody>{prescSoon.map(function(p,i){var jrs=Math.floor((new Date(p.date_prescription)-new Date())/86400000);var color=jrs<=7?T.red:jrs<=15?T.orange:T.acc;var bgc=jrs<=7?T.redBg:jrs<=15?T.orangeBg:T.accLight;return<tr key={i} style={{borderBottom:"1px solid "+T.brd+"40"}}><td style={{padding:"10px 12px",fontWeight:600}}>{p.nom_debiteur}</td><td style={{padding:"10px 12px"}}>{p.type}</td><td style={{padding:"10px 12px",color:T.orange,fontWeight:700}}>{fmtM(p.montant)}</td><td style={{padding:"10px 12px",color:T.txtDim}}>{fmtD(p.date_echeance)}</td><td style={{padding:"10px 12px",color:color,fontWeight:600}}>{fmtD(p.date_prescription)}</td><td style={{padding:"10px 12px"}}><span style={{background:bgc,color:color,padding:"4px 12px",borderRadius:20,fontWeight:700}}>{jrs}j</span></td><td style={{padding:"10px 12px"}}><span style={{background:(SC[p.statut]||{}).bg,color:(SC[p.statut]||{}).txt,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>{p.statut}</span></td></tr>})}</tbody></table></div>{prescSoon.length===0&&<div style={{textAlign:"center",padding:40,color:T.txtDim}}>Aucune prescription imminente</div>}</div></div>}

{/* ══ BALANCE ÂGÉE ══ */}
{page==="balance"&&<div>
<div style={{fontSize:22,fontWeight:800,marginBottom:20}}>📈 Balance Âgée</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:20}}>
{aging.map(function(a,i){var colors={"0-30j":T.green,"31-60j":T.blue,"61-90j":T.orange,"91-180j":T.red,"181-365j":"#EF4444","+1an":"#DC2626"};return<div key={i} style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:16}}><div style={{fontSize:11,color:T.txtDim,fontWeight:600,marginBottom:6}}>{a.tranche}</div><div style={{fontSize:18,fontWeight:800,color:colors[a.tranche]||T.txtDim}}>{fmtM(a.montant)}</div><div style={{fontSize:11,color:T.txtDim}}>{a.count} dossier{a.count>1?"s":""}</div></div>})}
</div>{aging.length===0&&<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:40,textAlign:"center",color:T.txtDim}}>Aucune donnée</div>}</div>}

{/* ══ CLIENTS MANDANTS ══ */}
{page==="clients"&&isMgr&&<div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{fontSize:22,fontWeight:800}}>🏢 Clients Mandants ({clients.length})</div><button onClick={function(){setEditClient(null);setCf(emptyCf);setShowClientForm(true)}} style={bs}>+ Ajouter Client</button></div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14}}>
{clients.map(function(c){var cr=records.filter(function(r){return r.nom_client===c.nom||r.client_id===c.id});var mtTotal=cr.reduce(function(s,r){return s+(Number(r.montant)||0)},0);var mtPaye=cr.reduce(function(s,r){return s+(Number(r.montant_paye)||0)},0);return<div key={c.id} style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
<div><div style={{fontWeight:700,fontSize:15}}>{c.nom}</div>{c.ice&&<div style={{fontSize:11,color:T.txtDim}}>ICE: {c.ice}</div>}{c.rc&&<div style={{fontSize:11,color:T.txtDim}}>RC: {c.rc}</div>}{c.ville&&<div style={{fontSize:11,color:T.txtDim}}>{c.ville}</div>}</div>
<button onClick={function(){openEditClient(c)}} style={{background:T.blueBg,border:"none",borderRadius:6,color:T.blue,fontSize:11,padding:"4px 10px",cursor:"pointer"}}>✏️ Modifier</button>
</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}>
<div><span style={{color:T.txtDim}}>Dossiers:</span> <span style={{fontWeight:600}}>{cr.length}</span></div>
<div><span style={{color:T.txtDim}}>Total:</span> <span style={{fontWeight:600,color:T.orange}}>{fmtM(mtTotal)}</span></div>
<div><span style={{color:T.txtDim}}>Recouvré:</span> <span style={{fontWeight:600,color:T.green}}>{fmtM(mtPaye)}</span></div>
<div><span style={{color:T.txtDim}}>Taux:</span> <span style={{fontWeight:600,color:T.acc}}>{mtTotal?((mtPaye/mtTotal)*100).toFixed(1)+"%":"0%"}</span></div>
</div>
{(c.tel||c.email)&&<div style={{marginTop:8,fontSize:11,color:T.txtDim}}>{c.tel&&<span>📞 {c.tel} </span>}{c.email&&<span>✉️ {c.email}</span>}</div>}
{c.contact_nom&&<div style={{fontSize:11,color:T.txtDim}}>Contact: {c.contact_nom}{c.contact_tel?" — "+c.contact_tel:""}</div>}
</div>})}
</div>
{clients.length===0&&<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:40,textAlign:"center",color:T.txtDim,marginTop:14}}>Aucun client mandant. Cliquez "+ Ajouter Client" pour commencer.</div>}
</div>}

{/* ══ EQUIPE ══ */}
{page==="equipe"&&isMgr&&<div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{fontSize:22,fontWeight:800}}>Équipe</div><button onClick={function(){setShowUF(true)}} style={bs}>+ Ajouter</button></div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>{users.map(function(u){var ar=records.filter(function(r){return r.assigned_to===u.id});return<div key={u.id} style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div><div style={{fontWeight:700,fontSize:14}}>{u.nom}</div><div style={{fontSize:11,color:T.txtDim}}>{u.username} · {u.role}</div></div>{u.id!==user.id&&<button onClick={function(){deleteUser(u.id)}} style={{background:T.redBg,border:"none",borderRadius:6,color:T.red,fontSize:11,padding:"4px 10px",cursor:"pointer"}}>Supprimer</button>}</div><div style={{fontSize:12,color:T.txtDim}}>{ar.length} dossiers · {fmtM(ar.reduce(function(s,r){return s+(Number(r.montant)||0)},0))}</div></div>})}</div></div>}

{/* ══ HISTORIQUE ══ */}
{page==="historique"&&<div>
<div style={{fontSize:22,fontWeight:800,marginBottom:20}}>Historique</div>
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,overflow:"hidden"}}>{activities.map(function(a,i){return<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 18px",borderBottom:"1px solid "+T.brd+"40",fontSize:12}}><div><span style={{fontWeight:600}}>{a.user_name}</span> — <span style={{color:T.acc}}>{a.action}</span>{a.details?" : "+a.details:""}{a.record_id?<span style={{color:T.txtDim}}> (#{a.record_id})</span>:""}</div><div style={{color:T.txtDim,flexShrink:0,marginLeft:12}}>{fmtDT(a.created_at)}</div></div>})}{activities.length===0&&<div style={{textAlign:"center",padding:40,color:T.txtDim}}>Aucune activité</div>}</div></div>}

{/* ══ PARAMETRES ══ */}
{page==="parametres"&&isMgr&&<div>
<div style={{fontSize:22,fontWeight:800,marginBottom:20}}>⚙️ Paramètres Société</div>
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:24,maxWidth:600}}>
{[{k:"nom",l:"Nom de la Société"},{k:"adresse",l:"Adresse"},{k:"ville",l:"Ville"},{k:"code_postal",l:"Code Postal"},{k:"tel",l:"Téléphone"},{k:"email",l:"Email"},{k:"site_web",l:"Site Web"},{k:"rc",l:"Registre de Commerce (RC)"},{k:"ice",l:"ICE"},{k:"if_fiscal",l:"Identifiant Fiscal (IF)"},{k:"tp",l:"Taxe Professionnelle (TP)"},{k:"cnss",l:"CNSS"}].map(function(f){return<div key={f.k} style={{marginBottom:14}}><label style={dim}>{f.l}</label><input value={societe[f.k]||""} onChange={function(e){var ns=Object.assign({},societe);ns[f.k]=e.target.value;setSociete(ns)}} style={iS}/></div>})}
<button onClick={saveSociete} style={Object.assign({},bs,{width:"100%",padding:14,marginTop:10,fontSize:14})}>💾 Sauvegarder</button>
</div></div>}

</main>

{/* ══ MODALS ══ */}
{showForm&&<Modal onClose={function(){setShowForm(false)}} title={editRec?"Modifier":"Nouveau Dossier"}>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
{[{k:"type",l:"Type",t:"select",o:TYPES},{k:"nom_debiteur",l:"Débiteur *"},{k:"cin_debiteur",l:"CIN"},{k:"rc_debiteur",l:"RC"},{k:"ice_debiteur",l:"ICE"},{k:"tel_debiteur",l:"Téléphone"},{k:"adresse_debiteur",l:"Adresse",s:2},{k:"email_debiteur",l:"Email"},{k:"num_compte",l:"N° Compte"},{k:"num_document",l:"N° Document"},{k:"banque",l:"Banque"},{k:"agence_bancaire",l:"Agence"},{k:"montant",l:"Montant *",t:"number"},{k:"date_echeance",l:"Échéance",t:"date"},{k:"motif_rejet",l:"Motif Rejet",t:"select",o:[""].concat(MOTIFS)},{k:"priorite",l:"Priorité",t:"select",o:["Normale","Urgente","Critique"]},{k:"nom_client",l:"Client"},{k:"ville",l:"Ville"},{k:"notes",l:"Notes",t:"textarea",s:2}].map(function(f){return<div key={f.k} style={f.s===2?{gridColumn:"span 2"}:{}}><label style={dim}>{f.l}</label>{f.t==="select"?<select value={form[f.k]} onChange={function(e){var n=Object.assign({},form);n[f.k]=e.target.value;setForm(n)}} style={iS}>{(f.o||[]).map(function(o){return<option key={o}>{o}</option>})}</select>:f.t==="textarea"?<textarea rows={2} value={form[f.k]} onChange={function(e){var n=Object.assign({},form);n[f.k]=e.target.value;setForm(n)}} style={Object.assign({},iS,{resize:"vertical"})}/>:<input type={f.t||"text"} value={form[f.k]} onChange={function(e){var n=Object.assign({},form);n[f.k]=e.target.value;setForm(n)}} style={iS}/>}</div>})}
</div>
<div style={{display:"flex",gap:8,marginTop:16}}><button onClick={function(){setShowForm(false)}} style={Object.assign({},bs,{flex:1,background:T.bgHov,color:T.txtDim})}>Annuler</button><button onClick={editRec?updateRecord:createRecord} style={Object.assign({},bs,{flex:1})}>{editRec?"Modifier":"Créer"}</button></div>
</Modal>}

{showRel&&<Modal onClose={function(){setShowRel(false)}} title="Nouvelle Relance">
<div style={{marginBottom:12}}><label style={dim}>Action *</label><select value={rf.action} onChange={function(e){setRf(Object.assign({},rf,{action:e.target.value}))}} style={iS}><option value="">Sélectionner...</option>{ACTIONS_REL.map(function(a){return<option key={a}>{a}</option>})}</select></div>
<div style={{marginBottom:12}}><label style={dim}>Canal</label><select value={rf.canal} onChange={function(e){setRf(Object.assign({},rf,{canal:e.target.value}))}} style={iS}>{CANAUX.map(function(c){return<option key={c} value={c}>{c}</option>})}</select></div>
<div style={{marginBottom:12}}><label style={dim}>Détails</label><textarea rows={3} value={rf.details} onChange={function(e){setRf(Object.assign({},rf,{details:e.target.value}))}} style={Object.assign({},iS,{resize:"vertical"})}/></div>
<div style={{marginBottom:12}}><label style={dim}>Prochain RDV</label><input type="date" value={rf.date_prochain_rdv} onChange={function(e){setRf(Object.assign({},rf,{date_prochain_rdv:e.target.value}))}} style={iS}/></div>
<div style={{display:"flex",gap:8}}><button onClick={function(){setShowRel(false)}} style={Object.assign({},bs,{flex:1,background:T.bgHov,color:T.txtDim})}>Annuler</button><button onClick={doRel} style={Object.assign({},bs,{flex:1})}>Enregistrer</button></div>
</Modal>}

{showPay&&<Modal onClose={function(){setShowPay(false)}} title="Enregistrer un Paiement">
<div style={{marginBottom:12}}><label style={dim}>Montant (MAD) *</label><input type="number" value={pf.montant} onChange={function(e){setPf(Object.assign({},pf,{montant:e.target.value}))}} style={iS} placeholder="0.00"/></div>
<div style={{marginBottom:12}}><label style={dim}>Date *</label><input type="date" value={pf.date_paiement} onChange={function(e){setPf(Object.assign({},pf,{date_paiement:e.target.value}))}} style={iS}/></div>
<div style={{marginBottom:12}}><label style={dim}>Mode *</label><select value={pf.mode} onChange={function(e){setPf(Object.assign({},pf,{mode:e.target.value}))}} style={iS}>{MODES_PAY.map(function(m){return<option key={m.v} value={m.v}>{m.l}</option>})}</select></div>
<div style={{marginBottom:12}}><label style={dim}>Référence</label><input value={pf.reference_paiement} onChange={function(e){setPf(Object.assign({},pf,{reference_paiement:e.target.value}))}} style={iS}/></div>
<div style={{marginBottom:12}}><label style={dim}>Banque</label><input value={pf.banque} onChange={function(e){setPf(Object.assign({},pf,{banque:e.target.value}))}} style={iS}/></div>
<div style={{marginBottom:12}}><label style={dim}>Notes</label><textarea rows={2} value={pf.notes} onChange={function(e){setPf(Object.assign({},pf,{notes:e.target.value}))}} style={Object.assign({},iS,{resize:"vertical"})}/></div>
<div style={{display:"flex",gap:8}}><button onClick={function(){setShowPay(false)}} style={Object.assign({},bs,{flex:1,background:T.bgHov,color:T.txtDim})}>Annuler</button><button onClick={doPay} style={Object.assign({},bs,{flex:1,background:T.green,color:"#0C0F1A"})}>💰 Enregistrer</button></div>
</Modal>}

{showDetail&&<Modal onClose={function(){setShowDetail(null);setRecPay([]);setRecRel([])}} title={"Dossier "+showDetail.id} width={700}>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>{[{l:"Type",v:showDetail.type},{l:"Statut",v:showDetail.statut},{l:"Priorité",v:showDetail.priorite},{l:"Débiteur",v:showDetail.nom_debiteur},{l:"CIN",v:showDetail.cin_debiteur},{l:"RC",v:showDetail.rc_debiteur},{l:"Adresse",v:showDetail.adresse_debiteur},{l:"Tél",v:showDetail.tel_debiteur},{l:"N° Compte",v:showDetail.num_compte},{l:"N° Doc",v:showDetail.num_document},{l:"Banque",v:showDetail.banque},{l:"Montant",v:fmtM(showDetail.montant)},{l:"Payé",v:fmtM(showDetail.montant_paye)},{l:"Solde",v:fmtM(showDetail.solde_restant)},{l:"Échéance",v:fmtD(showDetail.date_echeance)},{l:"Prescription",v:fmtD(showDetail.date_prescription)},{l:"Client",v:showDetail.nom_client},{l:"Motif",v:showDetail.motif_rejet}].map(function(d,i){return<div key={i}><span style={{fontSize:10,color:T.txtDim}}>{d.l}</span><div style={{fontSize:12,fontWeight:600}}>{d.v||"—"}</div></div>})}</div>
<div style={{marginBottom:16,display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={function(){downloadDoc("mise-en-demeure",showDetail.id)}} style={Object.assign({},bs,{fontSize:11,padding:"6px 12px",background:T.redBg,color:T.red})}>📄 Mise en Demeure</button><button onClick={function(){downloadDoc("protocole",showDetail.id)}} style={Object.assign({},bs,{fontSize:11,padding:"6px 12px",background:T.blueBg,color:T.blue})}>📄 Protocole</button><button onClick={function(){downloadDoc("injonction",showDetail.id)}} style={Object.assign({},bs,{fontSize:11,padding:"6px 12px",background:T.purpleBg,color:T.purple})}>📄 Injonction</button><button onClick={function(){doAiAnalyze(showDetail.id)}} style={Object.assign({},bs,{fontSize:11,padding:"6px 12px",background:T.accLight,color:T.acc})}>🤖 Analyse IA</button></div>
{aiLoading&&<div style={{padding:"12px",textAlign:"center",color:T.acc,fontSize:12}}>🤖 Analyse en cours...</div>}
{aiResult&&<div style={{background:T.bgHov,border:"1px solid "+T.brd,borderRadius:10,padding:14,marginBottom:16}}>
<div style={{fontSize:13,fontWeight:700,marginBottom:10,color:T.acc}}>🤖 Analyse IA</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12,marginBottom:10}}>
<div><span style={{color:T.txtDim}}>Risque:</span> <span style={{fontWeight:700,color:aiResult.risque==="Critique"||aiResult.risque==="Eleve"?T.red:aiResult.risque==="Moyen"?T.orange:T.green}}>{aiResult.risque} ({aiResult.score_risque}/100)</span></div>
<div><span style={{color:T.txtDim}}>Probabilité:</span> <span style={{fontWeight:700,color:T.green}}>{aiResult.probabilite_recouvrement}</span></div>
<div><span style={{color:T.txtDim}}>Délai estimé:</span> <span style={{fontWeight:600}}>{aiResult.estimation_delai}</span></div>
</div>
{aiResult.strategie_recommandee&&<div style={{fontSize:12,marginBottom:8}}><span style={{color:T.acc,fontWeight:600}}>Stratégie: </span>{aiResult.strategie_recommandee}</div>}
{aiResult.actions_prioritaires&&<div style={{fontSize:12,marginBottom:8}}><span style={{color:T.acc,fontWeight:600}}>Actions: </span>{aiResult.actions_prioritaires.map(function(a){return a.numero+". "+a.action+" ("+a.delai+")"}).join(" · ")}</div>}
{aiResult.analyse_juridique&&<div style={{fontSize:11,color:T.txtDim,marginBottom:6}}><span style={{fontWeight:600}}>Juridique: </span>{aiResult.analyse_juridique}</div>}
{aiResult.conseil_personnalise&&<div style={{fontSize:11,color:T.txtDim}}><span style={{fontWeight:600}}>Conseil: </span>{aiResult.conseil_personnalise}</div>}
</div>}
<div style={{marginBottom:12}}><div style={{fontSize:13,fontWeight:700,marginBottom:6,color:T.green}}>💰 Paiements ({recPay.length})</div>{recPay.length>0?recPay.map(function(p,i){return<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",background:T.greenBg,borderRadius:6,marginBottom:4,fontSize:12}}><span style={{color:T.green,fontWeight:700}}>{fmtM(p.montant)}</span><span style={{color:T.txtDim}}>{p.mode}{p.reference_paiement?" · "+p.reference_paiement:""}</span><span style={{color:T.txtDim}}>{fmtD(p.date_paiement)}</span></div>}):<div style={{fontSize:11,color:T.txtDim}}>Aucun paiement</div>}</div>
<div><div style={{fontSize:13,fontWeight:700,marginBottom:6,color:T.orange}}>📞 Relances ({recRel.length})</div>{recRel.length>0?recRel.map(function(r,i){return<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",background:T.orangeBg,borderRadius:6,marginBottom:4,fontSize:12}}><span style={{color:T.orange,fontWeight:600}}>{r.type_relance||r.canal}</span><span style={{color:T.txtDim}}>{r.notes||""}</span><span style={{color:T.txtDim}}>{fmtD(r.created_at)}</span></div>}):<div style={{fontSize:11,color:T.txtDim}}>Aucune relance</div>}</div>
</Modal>}

{showUF&&<Modal onClose={function(){setShowUF(false)}} title="Nouvel Utilisateur">
<div style={{marginBottom:12}}><label style={dim}>Identifiant *</label><input value={uf.username} onChange={function(e){setUf(Object.assign({},uf,{username:e.target.value}))}} style={iS}/></div>
<div style={{marginBottom:12}}><label style={dim}>Mot de passe *</label><input type="password" value={uf.password} onChange={function(e){setUf(Object.assign({},uf,{password:e.target.value}))}} style={iS}/></div>
<div style={{marginBottom:12}}><label style={dim}>Nom *</label><input value={uf.nom} onChange={function(e){setUf(Object.assign({},uf,{nom:e.target.value}))}} style={iS}/></div>
<div style={{marginBottom:12}}><label style={dim}>Rôle</label><select value={uf.role} onChange={function(e){setUf(Object.assign({},uf,{role:e.target.value}))}} style={iS}><option value="agent">Agent</option><option value="client">Client</option><option value="manager">Manager</option></select></div>
<div style={{display:"flex",gap:8}}><button onClick={function(){setShowUF(false)}} style={Object.assign({},bs,{flex:1,background:T.bgHov,color:T.txtDim})}>Annuler</button><button onClick={createUser} style={Object.assign({},bs,{flex:1})}>Créer</button></div>
</Modal>}

{showClientForm&&<Modal onClose={function(){setShowClientForm(false)}} title={editClient?"Modifier Client":"Nouveau Client"}>
{[{k:"nom",l:"Nom de la société *"},{k:"ice",l:"ICE"},{k:"rc",l:"RC"},{k:"adresse",l:"Adresse"},{k:"ville",l:"Ville"},{k:"tel",l:"Téléphone"},{k:"email",l:"Email"},{k:"contact_nom",l:"Nom du contact"},{k:"contact_tel",l:"Tél du contact"}].map(function(f){return<div key={f.k} style={{marginBottom:12}}><label style={dim}>{f.l}</label><input value={cf[f.k]} onChange={function(e){var n=Object.assign({},cf);n[f.k]=e.target.value;setCf(n)}} style={iS}/></div>})}
<div style={{display:"flex",gap:8}}><button onClick={function(){setShowClientForm(false)}} style={Object.assign({},bs,{flex:1,background:T.bgHov,color:T.txtDim})}>Annuler</button><button onClick={editClient?updateClient:createClient} style={Object.assign({},bs,{flex:1})}>{editClient?"Modifier":"Créer"}</button></div>
</Modal>}

<style>{"*{box-sizing:border-box}input:focus,select:focus,textarea:focus{border-color:"+T.acc+"!important;box-shadow:0 0 0 3px "+T.acc+"20}button:hover{opacity:.88}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:"+T.brd+";border-radius:3px}select{appearance:none}select option{background:"+T.bgCard+";color:"+T.txt+"}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}"}</style>
</div>)}

function Modal(props){return<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16}} onClick={props.onClose}><div style={{background:T.bgCard,borderRadius:16,border:"1px solid "+T.brd,padding:26,maxWidth:props.width||520,width:"100%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 25px 60px rgba(0,0,0,.5)"}} onClick={function(e){e.stopPropagation()}}>{props.title&&<div style={{fontSize:17,fontWeight:800,color:T.txt,marginBottom:16}}>{props.title}</div>}{props.children}</div></div>}

function ScanPage(props){
var token=props.token,api=props.api,onDone=props.onDone,errH=props.errH;
var _s=useState(1),step=_s[0],setStep=_s[1];var _b=useState(false),busy=_b[0],setBusy=_b[1];var _e=useState(null),scanErr=_e[0],setScanErr=_e[1];
var _d1=useState(null),d1=_d1[0],setD1=_d1[1];var _d2=useState(null),d2=_d2[0],setD2=_d2[1];
var _m=useState(null),merged=_m[0],setMerged=_m[1];var _c=useState(""),client=_c[0],setClient=_c[1];
var f1=useRef(null),f2=useRef(null);
var doScan=function(file,prompt){return new Promise(function(resolve,reject){var reader=new FileReader();reader.onload=function(){var b64=reader.result.split(",")[1];fetch(API+"/api/scan",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify({image:b64,mediaType:file.type||"image/jpeg",prompt:prompt})}).then(function(r){return r.json()}).then(function(data){if(!data.success){reject(new Error(data.error));return}resolve(JSON.parse((data.text||"").replace(/```json|```/g,"").trim()))}).catch(reject)};reader.onerror=reject;reader.readAsDataURL(file)})};
var scan1=function(e){var file=e.target.files&&e.target.files[0];if(!file)return;setBusy(true);setScanErr(null);doScan(file,"Analyse ce CHÈQUE ou LCN marocain. DÉBITEUR=TITULAIRE DU COMPTE=nom IMPRIMÉ SOUS le numéro de compte. JSON strict:{\"type\":\"Chèque ou LCN\",\"nom_debiteur\":\"titulaire\",\"num_compte\":\"RIB\",\"num_document\":\"n°\",\"banque\":\"\",\"agence_bancaire\":\"\",\"montant\":nombre,\"date_echeance\":\"YYYY-MM-DD\",\"ville\":\"\",\"notes\":\"\"} vide si non visible, 0 si montant non visible.").then(function(r){setD1(r);setStep(2)}).catch(function(){setScanErr("Échec. Photo plus nette SVP.")}).finally(function(){setBusy(false);if(f1.current)f1.current.value=""})};
var scan2=function(e){var file=e.target.files&&e.target.files[0];if(!file)return;setBusy(true);setScanErr(null);doScan(file,"Analyse ce CERTIFICAT DE REFUS DE PAIEMENT marocain. JSON strict:{\"cin_debiteur\":\"CIN\",\"rc_debiteur\":\"RC\",\"adresse_debiteur\":\"adresse\",\"motif_rejet\":\"motif\",\"date_rejet\":\"YYYY-MM-DD\",\"observations\":\"\"} vide si non visible.").then(function(r){setD2(r);setStep(3);setMerged(Object.assign({},d1||{},r))}).catch(function(){setScanErr("Échec certificat.")}).finally(function(){setBusy(false);if(f2.current)f2.current.value=""})};
var doCreate=function(){if(!merged)return;var data=Object.assign({},merged,{nom_client:client});data.montant=parseFloat(data.montant)||0;api("POST","/api/records",data).then(function(){onDone();setStep(1);setD1(null);setD2(null);setMerged(null);setClient("")}).catch(errH)};
var stepS=function(n){return{width:36,height:36,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,background:step>=n?T.acc:T.bgHov,color:step>=n?"#0C0F1A":T.txtDim,marginRight:8}};
return(<div>
<div style={{fontSize:22,fontWeight:800,marginBottom:20}}>📸 Scanner OCR</div>
<div style={{display:"flex",alignItems:"center",marginBottom:24}}><span style={stepS(1)}>1</span><span style={{fontSize:12,color:step>=1?T.txt:T.txtDim,marginRight:20}}>Chèque/LCN</span><div style={{width:30,height:2,background:step>=2?T.acc:T.brd,marginRight:10}}></div><span style={stepS(2)}>2</span><span style={{fontSize:12,color:step>=2?T.txt:T.txtDim,marginRight:20}}>Certificat</span><div style={{width:30,height:2,background:step>=3?T.acc:T.brd,marginRight:10}}></div><span style={stepS(3)}>3</span><span style={{fontSize:12,color:step>=3?T.txt:T.txtDim}}>Confirmation</span></div>
{scanErr&&<div style={{background:T.redBg,color:T.red,padding:"10px 14px",borderRadius:8,fontSize:12,marginBottom:12}}>{scanErr}</div>}
{busy&&<div style={{textAlign:"center",padding:40}}><div style={{display:"inline-block",width:32,height:32,border:"3px solid "+T.brd,borderTopColor:T.acc,borderRadius:"50%",animation:"spin 1s linear infinite"}}></div><div style={{color:T.txtDim,fontSize:12,marginTop:8}}>Analyse...</div></div>}
{step===1&&!busy&&<div style={{background:T.bgCard,border:"2px dashed "+T.brd,borderRadius:16,padding:40,textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>📄</div><div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Étape 1: Scanner le Chèque / LCN</div><div style={{fontSize:12,color:T.txtDim,marginBottom:16}}>Prenez une photo nette</div><input ref={f1} type="file" accept="image/*" capture="environment" onChange={scan1} style={{display:"none"}}/><button onClick={function(){f1.current&&f1.current.click()}} style={Object.assign({},bs,{padding:"12px 28px",fontSize:14})}>📸 Photo</button></div>}
{step===2&&!busy&&<div>{d1&&<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:16,marginBottom:16}}><div style={{fontSize:13,fontWeight:700,marginBottom:8,color:T.green}}>✅ Chèque scanné</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:12}}>{Object.entries(d1).map(function(e){return<div key={e[0]}><span style={{color:T.txtDim}}>{e[0]}:</span> <span style={{fontWeight:600}}>{String(e[1])}</span></div>})}</div></div>}<div style={{background:T.bgCard,border:"2px dashed "+T.acc,borderRadius:16,padding:40,textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>📋</div><div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Étape 2: Scanner le Certificat de Refus</div><input ref={f2} type="file" accept="image/*" capture="environment" onChange={scan2} style={{display:"none"}}/><button onClick={function(){f2.current&&f2.current.click()}} style={Object.assign({},bs,{padding:"12px 28px",fontSize:14})}>📸 Scanner</button></div></div>}
{step===3&&!busy&&merged&&<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:20}}><div style={{fontSize:14,fontWeight:700,marginBottom:14,color:T.green}}>✅ Vérifiez les données</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16,fontSize:12}}>{Object.entries(merged).map(function(e){return<div key={e[0]}><label style={dim}>{e[0]}</label><input value={String(e[1]||"")} onChange={function(ev){var nm=Object.assign({},merged);nm[e[0]]=ev.target.value;setMerged(nm)}} style={iS}/></div>})}<div style={{gridColumn:"span 2"}}><label style={dim}>Client Mandant *</label><input value={client} onChange={function(e){setClient(e.target.value)}} style={iS} placeholder="Nom du client"/></div></div><div style={{display:"flex",gap:8}}><button onClick={function(){setStep(1);setD1(null);setD2(null);setMerged(null)}} style={Object.assign({},bs,{flex:1,background:T.bgHov,color:T.txtDim})}>Recommencer</button><button onClick={doCreate} style={Object.assign({},bs,{flex:1})}>✅ Créer</button></div></div>}
</div>)}