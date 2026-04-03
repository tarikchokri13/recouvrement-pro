import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   RECOUVREMENT PRO v4
   3 Rôles: Manager | Agent | Client (lecture seule)
   ═══════════════════════════════════════════════════════════════ */

const KEYS = { users:"rp4-users", records:"rp4-records", activities:"rp4-activities", session:"rp4-session" };
const TYPES = ["Chèque","LCN","Facture"];
const STATUTS = ["Nouveau","En cours","Relancé","Contentieux","Payé","Impayé définitif"];
const ACTIONS_RELANCE = ["Appel téléphonique","Visite terrain","Mise en demeure","Email/SMS","Courrier recommandé","Transmission avocat","Accord amiable","Autre"];
const PRIORITES = ["Normale","Urgente","Critique"];
const MOTIFS = ["Provision insuffisante","Absence de provision","Compte clôturé","Opposition","Signature non conforme","Montant différent","Chèque prescrit","Endos irrégulier","Autre"];

const SC = {
  "Nouveau":{bg:"#EEF2FF",tx:"#4338CA",dt:"#6366F1"},
  "En cours":{bg:"#FFF7ED",tx:"#C2410C",dt:"#F97316"},
  "Relancé":{bg:"#FFFBEB",tx:"#B45309",dt:"#F59E0B"},
  "Contentieux":{bg:"#FEF2F2",tx:"#B91C1C",dt:"#EF4444"},
  "Payé":{bg:"#F0FDF4",tx:"#15803D",dt:"#22C55E"},
  "Impayé définitif":{bg:"#F5F5F4",tx:"#57534E",dt:"#A8A29E"},
};
const PRC = {"Normale":{bg:"#F5F5F4",tx:"#57534E"},"Urgente":{bg:"#FFF7ED",tx:"#C2410C"},"Critique":{bg:"#FEF2F2",tx:"#B91C1C"}};

const DMGR = {id:"MGR-001",username:"manager",password:"manager2026",role:"manager",nom:"Directeur",active:true,createdAt:new Date().toISOString()};

const gid=(p)=>`${p}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2,5).toUpperCase()}`;
const fM=(v)=>(!v&&v!==0)?"—":Number(v).toLocaleString("fr-MA",{style:"currency",currency:"MAD"});
const fD=(d)=>!d?"—":new Date(d).toLocaleDateString("fr-MA",{day:"2-digit",month:"short",year:"numeric"});
const fDT=(d)=>!d?"—":new Date(d).toLocaleDateString("fr-MA",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
const ddf=(d)=>d?Math.floor((new Date(d)-new Date())/864e5):null;
const td=()=>new Date().toISOString().slice(0,10);

const ER={id:"",type:"Chèque",nomDebiteur:"",cinDebiteur:"",rcDebiteur:"",adresseDebiteur:"",telDebiteur:"",emailDebiteur:"",nomClient:"",refClient:"",clientUserId:"",numDocument:"",numCompte:"",banque:"",agenceBancaire:"",montant:"",dateEcheance:"",dateReception:"",statut:"Nouveau",priorite:"Normale",motifRejet:"",notes:"",ville:"",assignedTo:"",createdBy:"",createdAt:"",updatedAt:""};

async function ld(k,fb){try{const r=await window.storage.get(k);return r?.value?JSON.parse(r.value):fb;}catch{return fb;}}
async function sv(k,d){try{await window.storage.set(k,JSON.stringify(d));}catch{}}

// ── Micro Components ──
const Badge=({s})=>{const c=SC[s]||SC["Nouveau"];return<span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,background:c.bg,color:c.tx,fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}><span style={{width:6,height:6,borderRadius:"50%",background:c.dt}}/>{s}</span>;};
const PB=({p})=>{const c=PRC[p]||PRC["Normale"];return<span style={{padding:"2px 8px",borderRadius:6,background:c.bg,color:c.tx,fontSize:10,fontWeight:700}}>{p}</span>;};
const RoleBadge=({r})=>{const m={manager:{bg:"#FEF2F2",tx:"#B91C1C",label:"Manager"},agent:{bg:"#EEF2FF",tx:"#4338CA",label:"Agent"},client:{bg:"#F0FDF4",tx:"#15803D",label:"Client"}}[r]||{bg:"#F5F5F4",tx:"#57534E",label:r};return<span style={{padding:"2px 8px",borderRadius:6,background:m.bg,color:m.tx,fontSize:10,fontWeight:700}}>{m.label}</span>;};

function SC2({icon,label,value,color,sub,onClick}){
  return<div onClick={onClick} style={{background:"#fff",borderRadius:14,padding:"16px 20px",flex:"1 1 170px",minWidth:160,border:"1px solid #E7E5E4",position:"relative",overflow:"hidden",cursor:onClick?"pointer":"default",transition:"transform .15s"}} onMouseEnter={e=>onClick&&(e.currentTarget.style.transform="translateY(-2px)")} onMouseLeave={e=>{if(e.currentTarget)e.currentTarget.style.transform="none"}}>
    <div style={{position:"absolute",top:0,left:0,width:4,height:"100%",background:color,borderRadius:"14px 0 0 14px"}}/>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><span style={{fontSize:16}}>{icon}</span><span style={{fontSize:10,color:"#78716C",fontWeight:600,letterSpacing:.5,textTransform:"uppercase"}}>{label}</span></div>
    <div style={{fontSize:22,fontWeight:700,color:"#1C1917",fontFamily:"'DM Mono',monospace"}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:"#A8A29E",marginTop:2}}>{sub}</div>}
  </div>;
}

function AlertBox({icon,title,count,color,items,onItem}){
  const[o,setO]=useState(false);
  if(!count)return null;
  return<div style={{background:"#fff",borderRadius:12,border:`1px solid ${color}22`,overflow:"hidden",marginBottom:8}}>
    <div onClick={()=>setO(!o)} style={{padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",background:`${color}08`}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>{icon}</span><span style={{fontWeight:600,fontSize:13}}>{title}</span></div>
      <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{background:color,color:"#fff",padding:"1px 8px",borderRadius:10,fontSize:11,fontWeight:700}}>{count}</span><span style={{fontSize:11,color:"#A8A29E"}}>{o?"▲":"▼"}</span></div>
    </div>
    {o&&items.slice(0,8).map((it,i)=><div key={i} onClick={()=>onItem?.(it)} style={{padding:"6px 14px 6px 38px",borderTop:"1px solid #F5F5F4",fontSize:12,cursor:"pointer",display:"flex",justifyContent:"space-between"}} onMouseEnter={e=>{e.currentTarget.style.background="#FAFAF9"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent"}}>
      <span><b>{it.nomDebiteur||"?"}</b> — {it.numDocument||""}</span><span style={{fontFamily:"'DM Mono',monospace",fontWeight:600}}>{fM(it.montant)}</span>
    </div>)}
  </div>;
}

// ── SCAN MODAL ──
function ScanModal({show,onClose,onDone}){
  const[step,setStep]=useState(1);
  const[ld2,setLd2]=useState(false);
  const[err,setErr]=useState(null);
  const[dd,setDD]=useState(null);
  const[cd,setCD]=useState(null);
  const f1=useRef(null),f2=useRef(null);

  useEffect(()=>{if(show){setStep(1);setDD(null);setCD(null);setErr(null);}},[show]);

  const scan=async(file,prompt)=>{
    const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});
    const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:file.type||"image/jpeg",data:b64}},{type:"text",text:prompt}]}]})});
    const data=await resp.json();
    return JSON.parse((data.content?.map(i=>i.text||"").join("")||"").replace(/```json|```/g,"").trim());
  };

  const scanDoc=async(e)=>{
    const file=e.target.files?.[0];if(!file)return;setLd2(true);setErr(null);
    try{
      const r=await scan(file,`Analyse ce CHÈQUE ou LCN marocain impayé.
DÉBITEUR = TITULAIRE DU COMPTE = nom IMPRIMÉ SOUS le numéro de compte (PAS le bénéficiaire).
JSON strict sans markdown:
{"type":"Chèque ou LCN","nomDebiteur":"titulaire du compte","numCompte":"RIB complet","numDocument":"n° chèque/LCN","banque":"","agenceBancaire":"","montant":nombre,"dateEcheance":"YYYY-MM-DD","ville":"","notes":""}
"" si non visible, 0 si montant non visible. JSON UNIQUEMENT.`);
      setDD(r);setStep(2);
    }catch{setErr("Échec lecture. Réessayez avec photo plus nette.");}
    setLd2(false);if(f1.current)f1.current.value="";
  };

  const scanCert=async(e)=>{
    const file=e.target.files?.[0];if(!file)return;setLd2(true);setErr(null);
    try{
      const r=await scan(file,`Analyse ce CERTIFICAT DE REFUS DE PAIEMENT marocain.
JSON strict sans markdown:
{"cinDebiteur":"CIN","rcDebiteur":"RC si société","adresseDebiteur":"adresse","motifRejet":"motif du rejet","dateRejet":"YYYY-MM-DD","observations":""}
"" si non visible. JSON UNIQUEMENT.`);
      setCD(r);setStep(3);
    }catch{setErr("Échec lecture certificat.");}
    setLd2(false);if(f2.current)f2.current.value="";
  };

  const confirm=()=>{
    onDone({...ER,type:dd?.type||"Chèque",nomDebiteur:dd?.nomDebiteur||"",numCompte:dd?.numCompte||"",numDocument:dd?.numDocument||"",banque:dd?.banque||"",agenceBancaire:dd?.agenceBancaire||"",montant:dd?.montant&&dd.montant!==0?dd.montant:"",dateEcheance:dd?.dateEcheance||"",ville:dd?.ville||"",cinDebiteur:cd?.cinDebiteur||"",rcDebiteur:cd?.rcDebiteur||"",adresseDebiteur:cd?.adresseDebiteur||"",motifRejet:cd?.motifRejet||"",notes:[dd?.notes,cd?.observations].filter(Boolean).join(" | "),dateReception:td()});
  };

  if(!show)return null;
  const FR=(l,v)=>v?<div style={{display:"flex",justifyContent:"space-between",padding:"4px 10px",background:"#FAFAF9",borderRadius:6,marginBottom:2,fontSize:12}}><span style={{color:"#78716C"}}>{l}</span><span style={{fontWeight:600,maxWidth:"55%",textAlign:"right",wordBreak:"break-word"}}>{typeof v==="number"?fM(v):String(v)}</span></div>:null;

  return<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16}} onClick={()=>!ld2&&onClose()}>
    <div style={{background:"#fff",borderRadius:18,padding:24,maxWidth:480,width:"100%",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",gap:4,marginBottom:16}}>{["Chèque/LCN","Certificat","Résumé"].map((l,i)=><div key={i} style={{flex:1,textAlign:"center"}}><div style={{height:4,borderRadius:2,background:i+1<=step?"#F59E0B":"#E7E5E4",marginBottom:3}}/><span style={{fontSize:9,color:i+1<=step?"#92400E":"#A8A29E",fontWeight:600}}>{l}</span></div>)}</div>

      {ld2&&<div style={{textAlign:"center",padding:36}}><div style={{fontSize:40,marginBottom:12,animation:"spin 1.5s linear infinite"}}>📷</div><div style={{fontWeight:700}}>Analyse…</div></div>}
      {err&&!ld2&&<div style={{textAlign:"center",padding:20}}><div style={{color:"#DC2626",fontWeight:600,marginBottom:12}}>{err}</div><button onClick={()=>setErr(null)} style={{padding:"6px 16px",borderRadius:8,border:"1.5px solid #D6D3D1",background:"#fff",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontSize:13}}>Réessayer</button></div>}

      {!ld2&&!err&&step===1&&<div style={{textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:6}}>🏦</div><div style={{fontWeight:700,fontSize:16,marginBottom:12}}>Étape 1 — Chèque ou LCN</div>
        <div onClick={()=>f1.current?.click()} style={{padding:22,border:"2px dashed #F59E0B",borderRadius:14,background:"#FFFBEB",cursor:"pointer"}}><div style={{fontSize:30,marginBottom:6}}>📷</div><div style={{fontWeight:700,color:"#92400E"}}>Cliquez pour scanner</div></div>
        <input ref={f1} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={scanDoc}/>
      </div>}

      {!ld2&&!err&&step===2&&<div>
        <div style={{textAlign:"center",marginBottom:12}}><div style={{fontSize:36,marginBottom:6}}>📄</div><div style={{fontWeight:700,fontSize:16}}>Étape 2 — Certificat de refus</div></div>
        <div style={{padding:10,background:"#F0FDF4",borderRadius:8,marginBottom:12,border:"1px solid #BBF7D0",fontSize:12}}>
          <b style={{color:"#15803D"}}>✓ Chèque scanné</b> — {dd?.nomDebiteur} — {dd?.montant?fM(dd.montant):""}
        </div>
        <div onClick={()=>f2.current?.click()} style={{padding:20,border:"2px dashed #6366F1",borderRadius:14,background:"#EEF2FF",textAlign:"center",cursor:"pointer"}}><div style={{fontSize:30,marginBottom:6}}>📄</div><div style={{fontWeight:700,color:"#4338CA"}}>Scanner le certificat</div></div>
        <input ref={f2} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={scanCert}/>
        <button onClick={()=>setStep(3)} style={{width:"100%",marginTop:10,padding:8,borderRadius:8,border:"1.5px solid #D6D3D1",background:"#fff",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontSize:12,color:"#78716C"}}>Passer →</button>
      </div>}

      {!ld2&&!err&&step===3&&<div>
        <div style={{fontWeight:700,fontSize:16,marginBottom:10,textAlign:"center"}}>✅ Résumé</div>
        {FR("Débiteur",dd?.nomDebiteur)}{FR("N° Compte",dd?.numCompte)}{FR("N° Doc",dd?.numDocument)}{FR("Banque",dd?.banque)}{FR("Montant",dd?.montant)}{FR("Échéance",dd?.dateEcheance)}
        {cd&&<>{FR("CIN",cd?.cinDebiteur)}{FR("RC",cd?.rcDebiteur)}{FR("Adresse",cd?.adresseDebiteur)}{FR("Motif rejet",cd?.motifRejet)}</>}
        {!cd&&<div style={{padding:8,background:"#FFFBEB",borderRadius:8,fontSize:11,color:"#92400E",marginTop:6}}>Certificat non scanné — saisie manuelle</div>}
        <div style={{padding:8,background:"#EEF2FF",borderRadius:8,fontSize:11,color:"#4338CA",marginTop:6}}>💡 Client mandant = saisie manuelle</div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button onClick={onClose} style={{flex:1,padding:9,borderRadius:8,border:"1.5px solid #D6D3D1",background:"#fff",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:13}}>Annuler</button>
          <button onClick={confirm} style={{flex:1,padding:9,borderRadius:8,border:"none",background:"#1C1917",color:"#fff",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:13}}>Importer</button>
        </div>
      </div>}
    </div>
  </div>;
}

// ════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════
export default function App(){
  const[ok,setOk]=useState(false);
  const[user,setUser]=useState(null);
  const[users,setUsers]=useState([]);
  const[recs,setRecs]=useState([]);
  const[acts,setActs]=useState([]);
  const[view,setView]=useState("dashboard");
  const[eRec,setERec]=useState(null);
  const[eUsr,setEUsr]=useState(null);
  const[det,setDet]=useState(null);
  const[search,setSearch]=useState("");
  const[globalSearch,setGS]=useState("");
  const[showGS,setShowGS]=useState(false);
  const[fT,setFT]=useState("Tous");
  const[fS,setFS]=useState("Tous");
  const[fA,setFA]=useState("Tous");
  const[fP,setFP]=useState("Tous");
  const[fCl,setFCl]=useState("Tous");
  const[lf,setLf]=useState({username:"",password:""});
  const[le,setLe]=useState("");
  const[notif,setNotif]=useState(null);
  const[showScan,setShowScan]=useState(false);
  const[rf,setRf]=useState({action:"",details:"",rdv:""});
  const[showRel,setShowRel]=useState(false);
  const[relT,setRelT]=useState(null);
  const[sb,setSb]=useState(true);
  const[clientView,setClientView]=useState(null); // for manager: view specific client dashboard

  useEffect(()=>{(async()=>{
    let u=await ld(KEYS.users,[]);if(!u.find(x=>x.role==="manager"))u=[DMGR,...u];
    setUsers(u);await sv(KEYS.users,u);setRecs(await ld(KEYS.records,[]));setActs(await ld(KEYS.activities,[]));
    const s=await ld(KEYS.session,null);if(s){const f=u.find(x=>x.id===s.id&&x.active);if(f)setUser(f);}setOk(true);
  })();},[]);

  const sAll=useCallback(async(r,u,a)=>{if(r){setRecs(r);await sv(KEYS.records,r);}if(u){setUsers(u);await sv(KEYS.users,u);}if(a){setActs(a);await sv(KEYS.activities,a);}},[]);
  const notify=(m,t="success")=>{setNotif({m,t});setTimeout(()=>setNotif(null),3e3);};
  const logA=useCallback((action,rid=null,d="")=>{const a={id:gid("A"),userId:user?.id,userName:user?.nom,action,recordId:rid,details:d,timestamp:new Date().toISOString()};const up=[a,...acts].slice(0,500);setActs(up);sv(KEYS.activities,up);},[user,acts]);
  const role=user?.role;const isMgr=role==="manager";const isAgt=role==="agent";const isCli=role==="client";

  const login=async()=>{const f=users.find(u=>u.username===lf.username&&u.password===lf.password);if(!f){setLe("Identifiant ou mot de passe incorrect");return;}if(!f.active){setLe("Compte désactivé");return;}setUser(f);setLe("");await sv(KEYS.session,{id:f.id});setLf({username:"",password:""});};
  const logout=async()=>{setUser(null);await sv(KEYS.session,null);setView("dashboard");setDet(null);};

  const saveRec=(rec)=>{
    let up;const now=new Date().toISOString();
    if(rec.id){rec.updatedAt=now;up=recs.map(r=>r.id===rec.id?rec:r);logA("Modification",rec.id,rec.nomDebiteur);notify("Dossier mis à jour");}
    else{rec.id=gid("D");rec.createdBy=user.id;rec.createdAt=now;rec.updatedAt=now;rec.dateReception=rec.dateReception||td();up=[rec,...recs];logA("Création",rec.id,rec.nomDebiteur);notify("Dossier créé");}
    sAll(up);setERec(null);setView("dossiers");
  };

  const delRec=(id)=>{if(!window.confirm("Supprimer ce dossier ?"))return;const r=recs.find(x=>x.id===id);sAll(recs.filter(x=>x.id!==id));logA("Suppression",id,r?.nomDebiteur);setDet(null);notify("Supprimé","w");};
  const chgStat=(id,ns)=>{sAll(recs.map(x=>x.id===id?{...x,statut:ns,updatedAt:new Date().toISOString()}:x));logA("Statut",id,`→ ${ns}`);if(det?.id===id)setDet(p=>({...p,statut:ns}));notify(`→ ${ns}`);};
  const assign=(rid,aid)=>{const ag=users.find(u=>u.id===aid);sAll(recs.map(r=>r.id===rid?{...r,assignedTo:aid,updatedAt:new Date().toISOString()}:r));logA("Assignation",rid,`→ ${ag?.nom||""}`);notify(`Assigné`);};
  const doRelance=()=>{if(!relT||!rf.action)return;logA("Relance",relT.id,`${rf.action}: ${rf.details}`);if(relT.statut==="Nouveau")chgStat(relT.id,"En cours");setShowRel(false);setRf({action:"",details:"",rdv:""});notify("Relance OK");};

  const saveUsr=(u)=>{let up;if(u.id){up=users.map(x=>x.id===u.id?u:x);notify("Modifié");}else{u.id=gid("U");u.createdAt=new Date().toISOString();up=[...users,u];logA("Création "+u.role,null,u.nom);notify("Créé");}sAll(null,up);setEUsr(null);};
  const toggleUsr=(id)=>{const u=users.find(x=>x.id===id);sAll(null,users.map(x=>x.id===id?{...x,active:!x.active}:x));notify(u.active?"Désactivé":"Activé");};

  const handleScanDone=(merged)=>{setERec(merged);setView("form");setShowScan(false);};

  const exportCSV=(data,name)=>{
    const h=["ID","Type","Priorité","Débiteur","CIN","RC","N° Compte","N° Doc","Banque","Montant","Échéance","Statut","Motif Rejet","Client","Ville","Notes"];
    const rows=data.map(r=>[r.id,r.type,r.priorite,r.nomDebiteur,r.cinDebiteur,r.rcDebiteur,r.numCompte,r.numDocument,r.banque,r.montant,r.dateEcheance,r.statut,r.motifRejet,r.nomClient,r.ville,r.notes]);
    const csv="\uFEFF"+[h,...rows].map(r=>r.map(c=>`"${String(c||"").replace(/"/g,'""')}"`).join(";")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));a.download=`${name}_${td()}.csv`;a.click();notify("CSV exporté");
  };

  // ── COMPUTED ──
  const myRecs=useMemo(()=>{
    if(isMgr)return recs;
    if(isAgt)return recs.filter(r=>r.assignedTo===user?.id);
    if(isCli)return recs.filter(r=>r.clientUserId===user?.id);
    return[];
  },[recs,user,isMgr,isAgt,isCli]);

  const clientUsers=useMemo(()=>users.filter(u=>u.role==="client"),[users]);
  const agentUsers=useMemo(()=>users.filter(u=>u.role==="agent"),[users]);

  const uniqueClients=useMemo(()=>{
    const map={};recs.forEach(r=>{if(r.nomClient){if(!map[r.nomClient])map[r.nomClient]={nom:r.nomClient,clientUserId:r.clientUserId,count:0,montant:0,paye:0};map[r.nomClient].count++;map[r.nomClient].montant+=(Number(r.montant)||0);if(r.statut==="Payé")map[r.nomClient].paye+=(Number(r.montant)||0);}});
    return Object.values(map);
  },[recs]);

  const filtered=useMemo(()=>{
    let base=clientView?recs.filter(r=>r.nomClient===clientView):myRecs;
    return base.filter(r=>{
      if(search&&![r.nomDebiteur,r.numDocument,r.nomClient,r.id,r.banque,r.ville,r.cinDebiteur,r.numCompte].some(f=>(f||"").toLowerCase().includes(search.toLowerCase())))return false;
      if(fT!=="Tous"&&r.type!==fT)return false;if(fS!=="Tous"&&r.statut!==fS)return false;
      if(fP!=="Tous"&&r.priorite!==fP)return false;if(fA!=="Tous"&&r.assignedTo!==fA)return false;
      if(fCl!=="Tous"&&r.nomClient!==fCl)return false;return true;
    });
  },[myRecs,recs,clientView,search,fT,fS,fA,fP,fCl]);

  const alerts=useMemo(()=>{
    const a=recs.filter(r=>!["Payé","Impayé définitif"].includes(r.statut));
    return{ov:a.filter(r=>{const d=ddf(r.dateEcheance);return d!==null&&d<0;}),up:a.filter(r=>{const d=ddf(r.dateEcheance);return d!==null&&d>=0&&d<=7;}),ua:a.filter(r=>!r.assignedTo),cr:a.filter(r=>r.priorite==="Critique")};
  },[recs]);

  const agStats=useMemo(()=>agentUsers.filter(u=>u.active).map(a=>{
    const as=recs.filter(r=>r.assignedTo===a.id);const p=as.filter(r=>r.statut==="Payé");
    const mR=p.reduce((s,r)=>s+(Number(r.montant)||0),0);const mT=as.reduce((s,r)=>s+(Number(r.montant)||0),0);
    return{...a,asg:as.length,act:as.filter(r=>!["Payé","Impayé définitif"].includes(r.statut)).length,pay:p.length,mR,mT,rel:acts.filter(x=>x.userId===a.id&&x.action==="Relance").length,tx:mT>0?mR/mT:0};
  }),[agentUsers,recs,acts]);

  const tS=useMemo(()=>{const mt=recs.reduce((s,r)=>s+(Number(r.montant)||0),0);const mr=recs.filter(r=>r.statut==="Payé").reduce((s,r)=>s+(Number(r.montant)||0),0);return{tot:recs.length,mt,mr,tx:mt>0?mr/mt:0,ec:recs.filter(r=>!["Payé","Impayé définitif"].includes(r.statut)).length};},[recs]);

  // Global search results
  const gsResults=useMemo(()=>{
    if(!globalSearch||globalSearch.length<2)return{dossiers:[],clients:[],debiteurs:[]};
    const q=globalSearch.toLowerCase();
    const dossiers=recs.filter(r=>[r.id,r.numDocument,r.numCompte].some(f=>(f||"").toLowerCase().includes(q))).slice(0,5);
    const clSet=new Set();const clients=[];recs.forEach(r=>{if(r.nomClient&&r.nomClient.toLowerCase().includes(q)&&!clSet.has(r.nomClient)){clSet.add(r.nomClient);clients.push({nom:r.nomClient,count:recs.filter(x=>x.nomClient===r.nomClient).length});}});
    const debSet=new Set();const debiteurs=[];recs.forEach(r=>{if(r.nomDebiteur&&r.nomDebiteur.toLowerCase().includes(q)&&!debSet.has(r.nomDebiteur)){debSet.add(r.nomDebiteur);debiteurs.push({nom:r.nomDebiteur,rec:r});}});
    return{dossiers:dossiers.slice(0,5),clients:clients.slice(0,5),debiteurs:debiteurs.slice(0,5)};
  },[globalSearch,recs]);

  const inp={width:"100%",padding:"8px 12px",borderRadius:8,border:"1.5px solid #D6D3D1",fontSize:13,outline:"none",fontFamily:"'Outfit',sans-serif",background:"#FAFAF9",boxSizing:"border-box"};
  const bP={padding:"8px 20px",borderRadius:8,border:"none",background:"#1C1917",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif"};
  const bS={...bP,background:"#F5F5F4",color:"#1C1917",border:"1.5px solid #D6D3D1"};

  if(!ok)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"'Outfit',sans-serif",color:"#78716C"}}>Chargement…</div>;

  // ── LOGIN ──
  if(!user)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#1C1917",fontFamily:"'Outfit',sans-serif",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <div style={{background:"#fff",borderRadius:20,padding:"44px 36px",maxWidth:380,width:"100%",boxShadow:"0 25px 60px rgba(0,0,0,.4)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#F59E0B,#D97706)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,color:"#1C1917",marginBottom:14}}>R</div>
          <h1 style={{fontSize:20,fontWeight:800,margin:"0 0 4px"}}>RECOUVREMENT PRO</h1>
          <p style={{color:"#A8A29E",fontSize:12,margin:0}}>Gestion des créances impayées</p>
        </div>
        <div style={{marginBottom:14}}><label style={{fontSize:11,fontWeight:600,color:"#57534E",display:"block",marginBottom:4}}>Identifiant</label><input value={lf.username} onChange={e=>setLf({...lf,username:e.target.value})} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Identifiant" style={inp}/></div>
        <div style={{marginBottom:18}}><label style={{fontSize:11,fontWeight:600,color:"#57534E",display:"block",marginBottom:4}}>Mot de passe</label><input type="password" value={lf.password} onChange={e=>setLf({...lf,password:e.target.value})} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="••••••••" style={inp}/></div>
        {le&&<div style={{color:"#DC2626",fontSize:12,marginBottom:10,padding:"6px 10px",background:"#FEF2F2",borderRadius:8}}>{le}</div>}
        <button onClick={login} style={{...bP,width:"100%",padding:11,fontSize:14,background:"linear-gradient(135deg,#F59E0B,#D97706)",color:"#1C1917"}}>Se connecter</button>
        <div style={{marginTop:20,padding:12,background:"#FAFAF9",borderRadius:8,fontSize:10,color:"#78716C",lineHeight:1.6}}>
          <b>Manager:</b> <code>manager</code> / <code>manager2026</code>
        </div>
      </div>
    </div>
  );

  // NAV
  const nav=[
    {id:"dashboard",ic:"◉",lb:"Tableau de bord"},
    ...(!isCli?[{id:"dossiers",ic:"☰",lb:"Dossiers"},{id:"nouveau",ic:"＋",lb:"Nouveau"},{id:"scanner",ic:"📷",lb:"Scanner"}]:[{id:"dossiers",ic:"☰",lb:"Mes dossiers"}]),
    ...(isMgr?[{id:"clients",ic:"🏢",lb:"Clients"},{id:"agents",ic:"👥",lb:"Agents"},{id:"performance",ic:"📊",lb:"Performance"}]:[]),
    {id:"historique",ic:"📋",lb:"Historique"},
  ];
  const alC=alerts.ov.length+alerts.up.length+alerts.ua.length+alerts.cr.length;

  return(
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"'Outfit',sans-serif",background:"#F5F5F4",color:"#1C1917"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      {notif&&<div style={{position:"fixed",top:14,right:14,zIndex:9999,padding:"10px 20px",borderRadius:10,background:notif.t==="success"?"#15803D":"#C2410C",color:"#fff",fontWeight:600,fontSize:13,boxShadow:"0 8px 30px rgba(0,0,0,.2)",animation:"slideIn .3s ease"}}>{notif.t==="success"?"✓":"⚠"} {notif.m}</div>}

      <aside style={{width:sb?210:56,background:"#1C1917",color:"#fff",transition:"width .2s",flexShrink:0,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflow:"hidden",zIndex:100}}>
        <div style={{padding:sb?"14px 16px":"14px 10px",borderBottom:"1px solid #292524",display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:32,height:32,minWidth:32,borderRadius:8,background:"linear-gradient(135deg,#F59E0B,#D97706)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,cursor:"pointer"}} onClick={()=>setSb(!sb)}>R</div>
          {sb&&<div><div style={{fontWeight:700,fontSize:12,letterSpacing:.5}}>RECOUVREMENT</div><div style={{fontSize:8,color:"#78716C",letterSpacing:1}}>PRO v4</div></div>}
        </div>
        {sb&&<div style={{padding:"10px 16px",borderBottom:"1px solid #292524",fontSize:11}}><div style={{color:"#F59E0B",fontWeight:600}}>{user.nom}</div><div style={{color:"#78716C",display:"flex",gap:6,alignItems:"center"}}><RoleBadge r={role}/></div></div>}
        <nav style={{flex:1,padding:"6px 0",overflowY:"auto"}}>
          {nav.map(it=><button key={it.id} onClick={()=>{
            if(it.id==="nouveau"){setERec({...ER});setView("form");}
            else if(it.id==="scanner")setShowScan(true);
            else{setView(it.id);setDet(null);setERec(null);setEUsr(null);setClientView(null);}
          }} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:sb?"9px 16px":"9px 0",background:(view===it.id||(it.id==="nouveau"&&view==="form"))?"rgba(245,158,11,.15)":"transparent",color:(view===it.id||(it.id==="nouveau"&&view==="form"))?"#F59E0B":"#A8A29E",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:500,textAlign:"left",justifyContent:sb?"flex-start":"center"}}>
            <span style={{fontSize:14,minWidth:18,textAlign:"center"}}>{it.ic}</span>
            {sb&&<span>{it.lb}</span>}
            {sb&&it.id==="dashboard"&&alC>0&&<span style={{marginLeft:"auto",background:"#EF4444",color:"#fff",padding:"0 6px",borderRadius:8,fontSize:9,fontWeight:700}}>{alC}</span>}
          </button>)}
        </nav>
        <button onClick={logout} style={{display:"flex",alignItems:"center",gap:8,padding:sb?"12px 16px":"12px 0",background:"transparent",color:"#78716C",border:"none",borderTop:"1px solid #292524",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontSize:11,width:"100%",justifyContent:sb?"flex-start":"center"}}><span>⏻</span>{sb&&<span>Déconnexion</span>}</button>
      </aside>

      <main style={{flex:1,padding:"20px 24px",maxWidth:1200,overflow:"auto"}}>
        {/* GLOBAL SEARCH BAR */}
        <div style={{position:"relative",marginBottom:20}}>
          <input value={globalSearch} onChange={e=>{setGS(e.target.value);setShowGS(true);}} onFocus={()=>setShowGS(true)} placeholder="🔍 Recherche rapide : dossier, client, débiteur…" style={{...inp,background:"#fff",padding:"10px 16px",fontSize:14,borderRadius:12,boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}/>
          {showGS&&globalSearch.length>=2&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",borderRadius:12,border:"1px solid #E7E5E4",boxShadow:"0 8px 30px rgba(0,0,0,.12)",zIndex:50,maxHeight:360,overflowY:"auto",marginTop:4}}>
            {gsResults.dossiers.length===0&&gsResults.clients.length===0&&gsResults.debiteurs.length===0&&<div style={{padding:16,textAlign:"center",color:"#A8A29E",fontSize:13}}>Aucun résultat</div>}
            {gsResults.dossiers.length>0&&<div><div style={{padding:"8px 14px",fontSize:10,fontWeight:700,color:"#78716C",background:"#FAFAF9"}}>DOSSIERS</div>{gsResults.dossiers.map(r=><div key={r.id} onClick={()=>{setDet(r);setView("dossiers");setShowGS(false);setGS("");}} style={{padding:"8px 14px",cursor:"pointer",fontSize:12,display:"flex",justifyContent:"space-between",borderTop:"1px solid #F5F5F4"}} onMouseEnter={e=>{e.currentTarget.style.background="#FAFAF9"}} onMouseLeave={e=>{e.currentTarget.style.background=""}}><span><b>{r.numDocument||r.id}</b> — {r.nomDebiteur}</span><span style={{fontFamily:"'DM Mono',monospace"}}>{fM(r.montant)}</span></div>)}</div>}
            {gsResults.clients.length>0&&<div><div style={{padding:"8px 14px",fontSize:10,fontWeight:700,color:"#78716C",background:"#FAFAF9"}}>CLIENTS</div>{gsResults.clients.map((c,i)=><div key={i} onClick={()=>{setClientView(c.nom);setView("dossiers");setShowGS(false);setGS("");}} style={{padding:"8px 14px",cursor:"pointer",fontSize:12,borderTop:"1px solid #F5F5F4"}} onMouseEnter={e=>{e.currentTarget.style.background="#FAFAF9"}} onMouseLeave={e=>{e.currentTarget.style.background=""}}><b>{c.nom}</b> <span style={{color:"#78716C"}}>({c.count} dossiers)</span></div>)}</div>}
            {gsResults.debiteurs.length>0&&<div><div style={{padding:"8px 14px",fontSize:10,fontWeight:700,color:"#78716C",background:"#FAFAF9"}}>DÉBITEURS</div>{gsResults.debiteurs.map((d,i)=><div key={i} onClick={()=>{setDet(d.rec);setView("dossiers");setShowGS(false);setGS("");}} style={{padding:"8px 14px",cursor:"pointer",fontSize:12,borderTop:"1px solid #F5F5F4"}} onMouseEnter={e=>{e.currentTarget.style.background="#FAFAF9"}} onMouseLeave={e=>{e.currentTarget.style.background=""}}><b>{d.nom}</b></div>)}</div>}
          </div>}
          {showGS&&<div style={{position:"fixed",inset:0,zIndex:40}} onClick={()=>setShowGS(false)}/>}
        </div>

        {/* ═══ DASHBOARD ═══ */}
        {view==="dashboard"&&<>
          <h1 style={{fontSize:22,fontWeight:800,margin:"0 0 4px"}}>Bonjour, {user.nom}</h1>
          <p style={{color:"#78716C",margin:"0 0 18px",fontSize:12}}>{isMgr?"Vue globale":isAgt?"Vos dossiers":"Suivi de vos créances"}</p>

          <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:20}}>
            <SC2 icon="📁" label="Dossiers" value={isMgr?tS.tot:myRecs.length} color="#6366F1" sub={`${(isMgr?tS.ec:myRecs.filter(r=>!["Payé","Impayé définitif"].includes(r.statut)).length)} actifs`}/>
            <SC2 icon="💰" label="Total" value={fM(isMgr?tS.mt:myRecs.reduce((s,r)=>s+(Number(r.montant)||0),0))} color="#F59E0B"/>
            <SC2 icon="✓" label="Recouvré" value={fM(isMgr?tS.mr:myRecs.filter(r=>r.statut==="Payé").reduce((s,r)=>s+(Number(r.montant)||0),0))} color="#22C55E"/>
            <SC2 icon="📈" label="Taux" value={`${Math.round((isMgr?tS.tx:(() =>{const t=myRecs.reduce((s,r)=>s+(Number(r.montant)||0),0);return t>0?myRecs.filter(r=>r.statut==="Payé").reduce((s,r)=>s+(Number(r.montant)||0),0)/t:0;})())*100)}%`} color="#8B5CF6"/>
          </div>

          {!isCli&&<div style={{marginBottom:20}}>
            <h2 style={{fontSize:15,fontWeight:700,marginBottom:10}}>⚡ Alertes {alC>0&&<span style={{background:"#EF4444",color:"#fff",padding:"1px 8px",borderRadius:10,fontSize:11}}>{alC}</span>}</h2>
            <AlertBox icon="🔴" title="Échéances dépassées" count={alerts.ov.length} color="#EF4444" items={alerts.ov} onItem={r=>{setDet(r);setView("dossiers");}}/>
            <AlertBox icon="🟡" title="< 7 jours" count={alerts.up.length} color="#F59E0B" items={alerts.up} onItem={r=>{setDet(r);setView("dossiers");}}/>
            {isMgr&&<AlertBox icon="🟣" title="Non assignés" count={alerts.ua.length} color="#8B5CF6" items={alerts.ua} onItem={r=>{setDet(r);setView("dossiers");}}/>}
            <AlertBox icon="🔥" title="Critique" count={alerts.cr.length} color="#DC2626" items={alerts.cr} onItem={r=>{setDet(r);setView("dossiers");}}/>
            {alC===0&&<div style={{padding:14,textAlign:"center",color:"#22C55E",background:"#F0FDF4",borderRadius:10,fontSize:12}}>✓ RAS</div>}
          </div>}

          {/* Manager: agents overview */}
          {isMgr&&agStats.length>0&&<div style={{marginBottom:20}}>
            <h2 style={{fontSize:15,fontWeight:700,marginBottom:10}}>👥 Agents</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
              {agStats.map(a=><div key={a.id} style={{background:"#fff",borderRadius:12,border:"1px solid #E7E5E4",padding:14}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>{a.nom}</div>
                <div style={{display:"flex",gap:6,fontSize:10}}><span style={{background:"#FAFAF9",padding:"3px 8px",borderRadius:4}}>{a.asg} dossiers</span><span style={{background:"#F0FDF4",padding:"3px 8px",borderRadius:4,color:"#15803D"}}>{Math.round(a.tx*100)}%</span><span style={{background:"#EEF2FF",padding:"3px 8px",borderRadius:4,color:"#4338CA"}}>{a.rel} relances</span></div>
              </div>)}
            </div>
          </div>}

          {/* Manager: clients overview */}
          {isMgr&&uniqueClients.length>0&&<div style={{marginBottom:20}}>
            <h2 style={{fontSize:15,fontWeight:700,marginBottom:10}}>🏢 Clients mandants</h2>
            <div style={{background:"#fff",borderRadius:12,border:"1px solid #E7E5E4",overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{background:"#FAFAF9"}}>{["Client","Dossiers","Montant","Recouvré","Taux",""].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontWeight:600,color:"#78716C",fontSize:10}}>{h}</th>)}</tr></thead>
              <tbody>{uniqueClients.sort((a,b)=>b.montant-a.montant).slice(0,10).map((c,i)=><tr key={i} style={{borderTop:"1px solid #F5F5F4"}}>
                <td style={{padding:"8px 12px",fontWeight:600}}>{c.nom}</td>
                <td style={{padding:"8px 12px",textAlign:"center"}}>{c.count}</td>
                <td style={{padding:"8px 12px",fontFamily:"'DM Mono',monospace"}}>{fM(c.montant)}</td>
                <td style={{padding:"8px 12px",fontFamily:"'DM Mono',monospace",color:"#15803D"}}>{fM(c.paye)}</td>
                <td style={{padding:"8px 12px"}}>{c.montant>0?Math.round(c.paye/c.montant*100):0}%</td>
                <td><button onClick={()=>{setClientView(c.nom);setView("dossiers");}} style={{...bS,padding:"4px 10px",fontSize:10}}>Voir</button></td>
              </tr>)}</tbody>
            </table></div>
          </div>}

          {isCli&&<div style={{padding:16,background:"#EEF2FF",borderRadius:12,border:"1px solid #C7D2FE",fontSize:13,color:"#4338CA"}}>
            📋 Vous consultez la progression de vos dossiers en <b>lecture seule</b>.
          </div>}
        </>}

        {/* ═══ DOSSIERS ═══ */}
        {view==="dossiers"&&!det&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <div>
              <h1 style={{fontSize:22,fontWeight:800,margin:0}}>{clientView?`Client: ${clientView}`:"Dossiers"}</h1>
              {clientView&&<button onClick={()=>setClientView(null)} style={{fontSize:11,color:"#6366F1",background:"none",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif",padding:0}}>← Tous les dossiers</button>}
            </div>
            {!isCli&&<div style={{display:"flex",gap:6}}><button onClick={()=>setShowScan(true)} style={{...bS,padding:"6px 12px",fontSize:11}}>📷</button><button onClick={()=>exportCSV(filtered,clientView||"tous")} style={{...bS,padding:"6px 12px",fontSize:11}}>⬇ CSV</button><button onClick={()=>{setERec({...ER,nomClient:clientView||""});setView("form");}} style={{...bP,padding:"6px 12px",fontSize:11}}>＋</button></div>}
          </div>
          <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
            <input placeholder="🔍 Filtrer…" value={search} onChange={e=>setSearch(e.target.value)} style={{...inp,maxWidth:200,background:"#fff"}}/>
            <select value={fT} onChange={e=>setFT(e.target.value)} style={{...inp,maxWidth:110,background:"#fff"}}><option>Tous</option>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
            <select value={fS} onChange={e=>setFS(e.target.value)} style={{...inp,maxWidth:140,background:"#fff"}}><option>Tous</option>{STATUTS.map(s=><option key={s}>{s}</option>)}</select>
            {!clientView&&isMgr&&<select value={fCl} onChange={e=>setFCl(e.target.value)} style={{...inp,maxWidth:160,background:"#fff"}}><option value="Tous">Tous clients</option>{uniqueClients.map(c=><option key={c.nom}>{c.nom}</option>)}</select>}
            <select value={fP} onChange={e=>setFP(e.target.value)} style={{...inp,maxWidth:120,background:"#fff"}}><option>Tous</option>{PRIORITES.map(p=><option key={p}>{p}</option>)}</select>
            {isMgr&&<select value={fA} onChange={e=>setFA(e.target.value)} style={{...inp,maxWidth:150,background:"#fff"}}><option value="Tous">Tous agents</option>{agentUsers.map(u=><option key={u.id} value={u.id}>{u.nom}</option>)}</select>}
            <span style={{marginLeft:"auto",fontSize:11,color:"#78716C",alignSelf:"center"}}>{filtered.length}</span>
          </div>
          {filtered.length===0?<div style={{textAlign:"center",padding:40,color:"#A8A29E"}}><div style={{fontSize:36}}>📂</div><div style={{fontWeight:600,marginTop:6}}>Aucun dossier</div></div>:
          <div style={{background:"#fff",borderRadius:12,border:"1px solid #E7E5E4",overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead><tr style={{background:"#FAFAF9"}}>{["Type","Débiteur","N° Doc","Montant","Échéance","Motif","Statut",...(isMgr&&!clientView?["Client"]:[]),""].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#78716C",fontSize:10,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
            <tbody>{filtered.map(r=>{const ov=ddf(r.dateEcheance)<0&&!["Payé","Impayé définitif"].includes(r.statut);
              return<tr key={r.id} onClick={()=>setDet(r)} style={{borderTop:"1px solid #F5F5F4",cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.background="#FAFAF9"}} onMouseLeave={e=>{e.currentTarget.style.background=""}}>
                <td style={{padding:"8px 10px",fontWeight:600}}>{r.type}</td>
                <td style={{padding:"8px 10px"}}>{r.nomDebiteur||"—"}</td>
                <td style={{padding:"8px 10px",fontFamily:"'DM Mono',monospace",fontSize:10}}>{r.numDocument||"—"}</td>
                <td style={{padding:"8px 10px",fontWeight:600,fontFamily:"'DM Mono',monospace"}}>{fM(r.montant)}</td>
                <td style={{padding:"8px 10px",color:ov?"#DC2626":"inherit",fontWeight:ov?600:400}}>{fD(r.dateEcheance)}{ov&&" ⚠"}</td>
                <td style={{padding:"8px 10px",fontSize:10,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.motifRejet||"—"}</td>
                <td style={{padding:"8px 10px"}}><Badge s={r.statut}/></td>
                {isMgr&&!clientView&&<td style={{padding:"8px 10px",fontSize:10}}>{r.nomClient||"—"}</td>}
                <td style={{padding:"8px 10px"}}>{!isCli&&<button onClick={e=>{e.stopPropagation();setRelT(r);setShowRel(true);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:13}}>📞</button>}</td>
              </tr>;})}
            </tbody></table></div></div>}
        </>}

        {/* ═══ DETAIL ═══ */}
        {view==="dossiers"&&det&&(()=>{const r=recs.find(x=>x.id===det.id)||det;const ag=users.find(u=>u.id===r.assignedTo);const ra=acts.filter(a=>a.recordId===r.id);const dd=ddf(r.dateEcheance);const ov=dd!==null&&dd<0&&!["Payé","Impayé définitif"].includes(r.statut);
          return<>
            <button onClick={()=>setDet(null)} style={{...bS,marginBottom:14,padding:"5px 12px",fontSize:11}}>← Retour</button>
            <div style={{background:"#fff",borderRadius:14,border:"1px solid #E7E5E4",padding:24}}>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:20}}>
                <div><div style={{fontSize:10,color:"#78716C",fontFamily:"'DM Mono',monospace"}}>{r.id}</div><h2 style={{margin:"4px 0 6px",fontSize:20,fontWeight:800}}>{r.nomDebiteur||"Sans nom"}</h2><div style={{display:"flex",gap:5,flexWrap:"wrap"}}><span style={{padding:"2px 8px",borderRadius:6,background:"#EEF2FF",color:"#4338CA",fontWeight:600,fontSize:11}}>{r.type}</span><Badge s={r.statut}/><PB p={r.priorite||"Normale"}/>{ov&&<span style={{padding:"2px 8px",borderRadius:6,background:"#FEF2F2",color:"#DC2626",fontSize:10,fontWeight:600}}>⚠ {Math.abs(dd)}j dépassée</span>}</div></div>
                {!isCli&&<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  <select value={r.statut} onChange={e=>chgStat(r.id,e.target.value)} style={{...inp,maxWidth:150,fontSize:12}}>{STATUTS.map(s=><option key={s}>{s}</option>)}</select>
                  {isMgr&&<select value={r.assignedTo||""} onChange={e=>assign(r.id,e.target.value)} style={{...inp,maxWidth:150,fontSize:12}}><option value="">Non assigné</option>{agentUsers.filter(u=>u.active).map(u=><option key={u.id} value={u.id}>{u.nom}</option>)}</select>}
                  <button onClick={()=>{setRelT(r);setShowRel(true);}} style={{...bP,padding:"6px 12px",fontSize:11,background:"#F59E0B",color:"#1C1917"}}>📞</button>
                  {(isMgr||r.createdBy===user.id)&&<button onClick={()=>{setERec({...r});setView("form");}} style={{...bS,padding:"6px 12px",fontSize:11}}>✎</button>}
                  {isMgr&&<button onClick={()=>delRec(r.id)} style={{...bS,padding:"6px 12px",fontSize:11,color:"#DC2626",borderColor:"#FCA5A5"}}>🗑</button>}
                </div>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:16}}>
                {[{l:"Montant",v:fM(r.montant),m:1},{l:"N° Compte",v:r.numCompte,m:1},{l:"N° Document",v:r.numDocument,m:1},{l:"Banque",v:r.banque},{l:"Agence",v:r.agenceBancaire},{l:"Échéance",v:fD(r.dateEcheance)},{l:"Réception",v:fD(r.dateReception)},{l:"CIN",v:r.cinDebiteur},{l:"RC",v:r.rcDebiteur},{l:"Tél",v:r.telDebiteur},{l:"Adresse",v:r.adresseDebiteur},{l:"Ville",v:r.ville},{l:"Client",v:r.nomClient},{l:"Réf",v:r.refClient},{l:"Agent",v:ag?.nom||"—"}].map((f,i)=><div key={i}><div style={{fontSize:9,color:"#A8A29E",fontWeight:600,letterSpacing:.7,marginBottom:2}}>{f.l}</div><div style={{fontSize:13,fontWeight:500,fontFamily:f.m?"'DM Mono',monospace":"inherit"}}>{f.v||"—"}</div></div>)}
              </div>
              {r.motifRejet&&<div style={{padding:10,background:"#FEF2F2",borderRadius:8,border:"1px solid #FCA5A5",marginBottom:12}}><div style={{fontSize:9,color:"#B91C1C",fontWeight:700}}>MOTIF REJET</div><div style={{fontSize:13,fontWeight:600,color:"#DC2626"}}>{r.motifRejet}</div></div>}
              {r.notes&&<div style={{padding:10,background:"#FAFAF9",borderRadius:8,marginBottom:12}}><div style={{fontSize:9,color:"#A8A29E",fontWeight:700}}>NOTES</div><div style={{fontSize:12,whiteSpace:"pre-wrap"}}>{r.notes}</div></div>}
              <div><div style={{fontSize:13,fontWeight:700,marginBottom:8}}>📋 Historique</div>
                {ra.length===0?<div style={{color:"#A8A29E",fontSize:11}}>—</div>:ra.slice(0,15).map(a=><div key={a.id} style={{padding:"6px 10px",borderLeft:"3px solid #F59E0B",marginBottom:4,background:"#FAFAF9",borderRadius:"0 6px 6px 0",fontSize:11}}><div style={{display:"flex",justifyContent:"space-between"}}><span><b>{a.userName}</b> — {a.action}</span><span style={{color:"#A8A29E",fontSize:10}}>{fDT(a.timestamp)}</span></div>{a.details&&<div style={{color:"#57534E",marginTop:1}}>{a.details}</div>}</div>)}
              </div>
            </div></>;})()}

        {/* ═══ FORM ═══ */}
        {view==="form"&&eRec&&!isCli&&<>
          <h1 style={{fontSize:22,fontWeight:800,margin:"0 0 16px"}}>{eRec.id?"Modifier":"Nouveau dossier"}</h1>
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #E7E5E4",padding:24}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}}>
              <div><label style={{fontSize:10,fontWeight:600,color:"#57534E",display:"block",marginBottom:3}}>Type *</label><select value={eRec.type} onChange={e=>setERec({...eRec,type:e.target.value})} style={inp}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
              <div><label style={{fontSize:10,fontWeight:600,color:"#57534E",display:"block",marginBottom:3}}>Priorité</label><select value={eRec.priorite||"Normale"} onChange={e=>setERec({...eRec,priorite:e.target.value})} style={inp}>{PRIORITES.map(p=><option key={p}>{p}</option>)}</select></div>
              <div><label style={{fontSize:10,fontWeight:600,color:"#57534E",display:"block",marginBottom:3}}>Statut</label><select value={eRec.statut} onChange={e=>setERec({...eRec,statut:e.target.value})} style={inp}>{STATUTS.map(s=><option key={s}>{s}</option>)}</select></div>
              {isMgr&&<div><label style={{fontSize:10,fontWeight:600,color:"#57534E",display:"block",marginBottom:3}}>Assigner à</label><select value={eRec.assignedTo||""} onChange={e=>setERec({...eRec,assignedTo:e.target.value})} style={inp}><option value="">—</option>{agentUsers.filter(u=>u.active).map(u=><option key={u.id} value={u.id}>{u.nom}</option>)}</select></div>}

              <div style={{gridColumn:"1/-1",padding:"8px 12px",background:"#FAFAF9",borderRadius:8,fontWeight:700,fontSize:12,color:"#57534E"}}>● Débiteur</div>
              {[{k:"nomDebiteur",l:"Nom *",p:"Titulaire du compte"},{k:"cinDebiteur",l:"CIN",p:"AB123456"},{k:"rcDebiteur",l:"RC",p:"Si société"},{k:"telDebiteur",l:"Tél",p:"0661234567"},{k:"emailDebiteur",l:"Email"},{k:"ville",l:"Ville"}].map(f=><div key={f.k}><label style={{fontSize:10,fontWeight:600,color:"#57534E",display:"block",marginBottom:3}}>{f.l}</label><input value={eRec[f.k]||""} onChange={e=>setERec({...eRec,[f.k]:e.target.value})} placeholder={f.p} style={inp}/></div>)}
              <div style={{gridColumn:"1/-1"}}><label style={{fontSize:10,fontWeight:600,color:"#57534E",display:"block",marginBottom:3}}>Adresse</label><input value={eRec.adresseDebiteur||""} onChange={e=>setERec({...eRec,adresseDebiteur:e.target.value})} style={inp}/></div>

              <div style={{gridColumn:"1/-1",padding:"8px 12px",background:"#FAFAF9",borderRadius:8,fontWeight:700,fontSize:12,color:"#57534E"}}>● Document</div>
              {[{k:"numDocument",l:"N° Doc *"},{k:"numCompte",l:"N° Compte"},{k:"banque",l:"Banque"},{k:"agenceBancaire",l:"Agence"},{k:"montant",l:"Montant (MAD) *",t:"number"},{k:"dateEcheance",l:"Échéance",t:"date"},{k:"dateReception",l:"Réception",t:"date"}].map(f=><div key={f.k}><label style={{fontSize:10,fontWeight:600,color:"#57534E",display:"block",marginBottom:3}}>{f.l}</label><input type={f.t||"text"} value={eRec[f.k]||""} onChange={e=>setERec({...eRec,[f.k]:e.target.value})} style={inp}/></div>)}

              <div style={{gridColumn:"1/-1",padding:"8px 12px",background:"#FEF2F2",borderRadius:8,fontWeight:700,fontSize:12,color:"#B91C1C"}}>● Rejet</div>
              <div><label style={{fontSize:10,fontWeight:600,color:"#57534E",display:"block",marginBottom:3}}>Motif</label><select value={eRec.motifRejet||""} onChange={e=>setERec({...eRec,motifRejet:e.target.value})} style={inp}><option value="">—</option>{MOTIFS.map(m=><option key={m}>{m}</option>)}</select></div>

              <div style={{gridColumn:"1/-1",padding:"8px 12px",background:"#FFFBEB",borderRadius:8,fontWeight:700,fontSize:12,color:"#92400E"}}>● Client mandant (saisie manuelle)</div>
              <div><label style={{fontSize:10,fontWeight:600,color:"#57534E",display:"block",marginBottom:3}}>Client</label><input value={eRec.nomClient||""} onChange={e=>setERec({...eRec,nomClient:e.target.value})} placeholder="Société mandante" style={inp}/></div>
              <div><label style={{fontSize:10,fontWeight:600,color:"#57534E",display:"block",marginBottom:3}}>Réf.</label><input value={eRec.refClient||""} onChange={e=>setERec({...eRec,refClient:e.target.value})} style={inp}/></div>
              {isMgr&&<div><label style={{fontSize:10,fontWeight:600,color:"#57534E",display:"block",marginBottom:3}}>Lier au compte client</label><select value={eRec.clientUserId||""} onChange={e=>setERec({...eRec,clientUserId:e.target.value})} style={inp}><option value="">—</option>{clientUsers.map(c=><option key={c.id} value={c.id}>{c.nom} (@{c.username})</option>)}</select></div>}

              <div style={{gridColumn:"1/-1"}}><label style={{fontSize:10,fontWeight:600,color:"#57534E",display:"block",marginBottom:3}}>Notes</label><textarea rows={2} value={eRec.notes||""} onChange={e=>setERec({...eRec,notes:e.target.value})} style={{...inp,resize:"vertical"}}/></div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:20,justifyContent:"flex-end"}}><button onClick={()=>{setERec(null);setView("dossiers");}} style={bS}>Annuler</button><button onClick={()=>saveRec(eRec)} style={bP}>{eRec.id?"OK":"Créer"}</button></div>
          </div>
        </>}

        {/* ═══ CLIENTS (Manager) ═══ */}
        {view==="clients"&&isMgr&&!eUsr&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h1 style={{fontSize:22,fontWeight:800,margin:0}}>Gestion des clients</h1><button onClick={()=>setEUsr({id:"",username:"",password:"",role:"client",nom:"",active:true})} style={bP}>＋ Compte client</button></div>
          <p style={{color:"#78716C",fontSize:12,marginBottom:14}}>Créez des comptes pour que vos clients suivent leurs dossiers en lecture seule.</p>
          {clientUsers.length===0?<div style={{textAlign:"center",padding:40,color:"#A8A29E"}}><div style={{fontSize:36}}>🏢</div><div style={{fontWeight:600,marginTop:6}}>Aucun compte client</div></div>:
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12}}>
            {clientUsers.map(u=>{const cl=recs.filter(r=>r.clientUserId===u.id);const mt=cl.reduce((s,r)=>s+(Number(r.montant)||0),0);const mp=cl.filter(r=>r.statut==="Payé").reduce((s,r)=>s+(Number(r.montant)||0),0);
              return<div key={u.id} style={{background:"#fff",borderRadius:12,border:"1px solid #E7E5E4",padding:16,opacity:u.active?1:.5}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div><div style={{fontWeight:700}}>{u.nom}</div><div style={{fontSize:10,color:"#78716C"}}>@{u.username} {!u.active&&<span style={{color:"#DC2626"}}>(off)</span>}</div></div><div style={{display:"flex",gap:4}}><button onClick={()=>setEUsr({...u})} style={{...bS,padding:"3px 8px",fontSize:10}}>✎</button><button onClick={()=>toggleUsr(u.id)} style={{...bS,padding:"3px 8px",fontSize:10,color:u.active?"#DC2626":"#15803D"}}>{u.active?"Off":"On"}</button></div></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,fontSize:10}}>
                  <div style={{background:"#FAFAF9",padding:6,borderRadius:4,textAlign:"center"}}><div style={{fontWeight:700,fontSize:14}}>{cl.length}</div>Dossiers</div>
                  <div style={{background:"#FAFAF9",padding:6,borderRadius:4,textAlign:"center"}}><div style={{fontWeight:700,fontSize:14,color:"#15803D"}}>{mt>0?Math.round(mp/mt*100):0}%</div>Recouvré</div>
                  <div><button onClick={()=>{const cn=recs.find(r=>r.clientUserId===u.id)?.nomClient;if(cn){setClientView(cn);setView("dossiers");}}} style={{...bS,padding:"8px 4px",fontSize:10,width:"100%"}}>Voir →</button></div>
                </div>
              </div>;})}
          </div>}
        </>}

        {/* ═══ AGENTS (Manager) ═══ */}
        {view==="agents"&&isMgr&&!eUsr&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h1 style={{fontSize:22,fontWeight:800,margin:0}}>Agents</h1><button onClick={()=>setEUsr({id:"",username:"",password:"",role:"agent",nom:"",active:true})} style={bP}>＋ Agent</button></div>
          {agentUsers.length===0?<div style={{textAlign:"center",padding:40,color:"#A8A29E"}}>Aucun agent</div>:
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12}}>
            {agentUsers.map(u=>{const st=agStats.find(a=>a.id===u.id);return<div key={u.id} style={{background:"#fff",borderRadius:12,border:"1px solid #E7E5E4",padding:16,opacity:u.active?1:.5}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div><div style={{fontWeight:700}}>{u.nom}</div><div style={{fontSize:10,color:"#78716C"}}>@{u.username}</div></div><div style={{display:"flex",gap:4}}><button onClick={()=>setEUsr({...u})} style={{...bS,padding:"3px 8px",fontSize:10}}>✎</button><button onClick={()=>toggleUsr(u.id)} style={{...bS,padding:"3px 8px",fontSize:10,color:u.active?"#DC2626":"#15803D"}}>{u.active?"Off":"On"}</button></div></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,fontSize:10}}>
                <div style={{background:"#FAFAF9",padding:6,borderRadius:4,textAlign:"center"}}><div style={{fontWeight:700,fontSize:14}}>{st?.asg||0}</div>Dossiers</div>
                <div style={{background:"#F0FDF4",padding:6,borderRadius:4,textAlign:"center"}}><div style={{fontWeight:700,fontSize:14,color:"#15803D"}}>{st?.pay||0}</div>Payés</div>
                <div style={{background:"#EEF2FF",padding:6,borderRadius:4,textAlign:"center"}}><div style={{fontWeight:700,fontSize:14,color:"#4338CA"}}>{st?.rel||0}</div>Relances</div>
              </div>
            </div>;})}
          </div>}
          <div style={{marginTop:20,padding:14,background:"#fff",borderRadius:12,border:"1px solid #E7E5E4"}}><div style={{fontWeight:700,fontSize:13,marginBottom:6}}>⚙ Manager</div><button onClick={()=>setEUsr({...users.find(u=>u.role==="manager")})} style={{...bS,padding:"5px 12px",fontSize:11}}>Modifier MDP</button></div>
        </>}

        {/* USER FORM (agents+clients) */}
        {(view==="agents"||view==="clients")&&isMgr&&eUsr&&<>
          <button onClick={()=>setEUsr(null)} style={{...bS,marginBottom:14,padding:"5px 12px",fontSize:11}}>← Retour</button>
          <h1 style={{fontSize:22,fontWeight:800,margin:"0 0 16px"}}>{eUsr.id?"Modifier":"Nouveau "+eUsr.role}</h1>
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #E7E5E4",padding:24,maxWidth:450}}>
            {[{k:"nom",l:"Nom complet"},{k:"username",l:"Identifiant"},{k:"password",l:"Mot de passe"}].map(f=><div key={f.k} style={{marginBottom:12}}><label style={{fontSize:10,fontWeight:600,color:"#57534E",display:"block",marginBottom:3}}>{f.l}</label><input value={eUsr[f.k]||""} onChange={e=>setEUsr({...eUsr,[f.k]:e.target.value})} style={inp}/></div>)}
            <div style={{display:"flex",gap:8,marginTop:16}}><button onClick={()=>setEUsr(null)} style={bS}>Annuler</button><button onClick={()=>{if(!eUsr.nom||!eUsr.username||!eUsr.password){notify("Champs requis","w");return;}if(eUsr.password.length<6){notify("MDP≥6","w");return;}if(users.find(u=>u.username===eUsr.username&&u.id!==eUsr.id)){notify("ID existe","w");return;}saveUsr(eUsr);}} style={bP}>{eUsr.id?"OK":"Créer"}</button></div>
          </div>
        </>}

        {/* ═══ PERFORMANCE ═══ */}
        {view==="performance"&&isMgr&&<>
          <h1 style={{fontSize:22,fontWeight:800,margin:"0 0 16px"}}>Performance</h1>
          {agStats.length===0?<div style={{padding:40,textAlign:"center",color:"#A8A29E"}}>Aucun agent</div>:
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #E7E5E4",overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:"#FAFAF9"}}>{["Agent","Dossiers","Actifs","Payés","Relances","Montant","Recouvré","Taux"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontWeight:600,color:"#78716C",fontSize:10}}>{h}</th>)}</tr></thead>
            <tbody>{agStats.sort((a,b)=>b.tx-a.tx).map(a=><tr key={a.id} style={{borderTop:"1px solid #F5F5F4"}}>
              <td style={{padding:"10px 12px",fontWeight:600}}>{a.nom}</td><td style={{padding:"10px 12px",textAlign:"center"}}>{a.asg}</td><td style={{padding:"10px 12px",textAlign:"center"}}>{a.act}</td><td style={{padding:"10px 12px",textAlign:"center",color:"#15803D",fontWeight:600}}>{a.pay}</td><td style={{padding:"10px 12px",textAlign:"center"}}>{a.rel}</td><td style={{padding:"10px 12px",fontFamily:"'DM Mono',monospace"}}>{fM(a.mT)}</td><td style={{padding:"10px 12px",fontFamily:"'DM Mono',monospace",color:"#15803D"}}>{fM(a.mR)}</td>
              <td style={{padding:"10px 12px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{flex:1,height:6,background:"#E7E5E4",borderRadius:3,overflow:"hidden"}}><div style={{width:`${Math.round(a.tx*100)}%`,height:"100%",background:a.tx>.5?"#22C55E":a.tx>.25?"#F59E0B":"#EF4444",borderRadius:3}}/></div><span style={{fontWeight:700,fontSize:11,minWidth:30}}>{Math.round(a.tx*100)}%</span></div></td>
            </tr>)}</tbody>
          </table></div></div>}
        </>}

        {/* ═══ HISTORIQUE ═══ */}
        {view==="historique"&&<>
          <h1 style={{fontSize:22,fontWeight:800,margin:"0 0 16px"}}>Historique</h1>
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #E7E5E4",padding:16}}>
            {(isMgr?acts:acts.filter(a=>a.userId===user.id)).slice(0,80).map(a=><div key={a.id} style={{padding:"8px 10px",borderLeft:`3px solid ${a.action==="Relance"?"#F59E0B":a.action.includes("Création")?"#22C55E":"#6366F1"}`,marginBottom:5,background:"#FAFAF9",borderRadius:"0 6px 6px 0",fontSize:11}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><span><b>{a.userName}</b> — {a.action}</span><span style={{color:"#A8A29E",fontSize:10}}>{fDT(a.timestamp)}</span></div>
              {a.details&&<div style={{color:"#57534E",marginTop:1}}>{a.details}</div>}
            </div>)}
          </div>
        </>}
      </main>

      <ScanModal show={showScan} onClose={()=>setShowScan(false)} onDone={handleScanDone}/>

      {showRel&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16}} onClick={()=>setShowRel(false)}>
        <div style={{background:"#fff",borderRadius:16,padding:24,maxWidth:440,width:"100%"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>📞 Relance — {relT?.nomDebiteur}</div>
          <div style={{marginBottom:10}}><label style={{fontSize:10,fontWeight:600,display:"block",marginBottom:3}}>Action *</label><select value={rf.action} onChange={e=>setRf({...rf,action:e.target.value})} style={inp}><option value="">—</option>{ACTIONS_RELANCE.map(a=><option key={a}>{a}</option>)}</select></div>
          <div style={{marginBottom:10}}><label style={{fontSize:10,fontWeight:600,display:"block",marginBottom:3}}>Détails</label><textarea rows={2} value={rf.details} onChange={e=>setRf({...rf,details:e.target.value})} style={{...inp,resize:"vertical"}}/></div>
          <div style={{display:"flex",gap:8,marginTop:14}}><button onClick={()=>setShowRel(false)} style={{...bS,flex:1}}>Annuler</button><button onClick={doRelance} style={{...bP,flex:1,background:"#F59E0B",color:"#1C1917"}}>OK</button></div>
        </div>
      </div>}

      <style>{`@keyframes slideIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}*{box-sizing:border-box}input:focus,select:focus,textarea:focus{border-color:#F59E0B!important;box-shadow:0 0 0 3px rgba(245,158,11,.12)}button:hover{opacity:.9}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#D6D3D1;border-radius:2px}@media(max-width:768px){aside{position:fixed!important;z-index:200}main{margin-left:56px}}`}</style>
    </div>
  );
}