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

// ═══════════════════════════════════════════
// FEATURE 4: MULTI-LANGUES FR/AR
// ═══════════════════════════════════════════
var TR={
  fr:{
    appName:"Recouvrement Pro",appDesc:"Gestion des créances impayées",login:"Connexion",username:"Identifiant",password:"Mot de passe",
    dashboard:"Tableau de Bord",dossiers:"Dossiers",scanner:"Scanner OCR",paiements:"Paiements",prescription:"Prescription",
    balance:"Balance Âgée",clients:"Clients",equipe:"Équipe",historique:"Historique",parametres:"Paramètres",logout:"Déconnexion",
    totalDossiers:"Dossiers",montantTotal:"Montant Total",recouvre:"Recouvré",actifs:"Actifs",taux:"Taux",
    alertes:"Alertes",prescImm:"Prescriptions Imminentes",parStatut:"Par Statut",parType:"Par Type",
    nouveau:"Nouveau",enCours:"En cours",relance:"Relancé",contentieux:"Contentieux",paye:"Payé",impaye:"Impayé définitif",prescrit:"Prescrit",
    backup:"Backup",exportExcel:"Export Excel",search:"Rechercher...",tousTypes:"Tous types",tousStatuts:"Tous statuts",tousClients:"Tous clients",
    scannerOCR:"Scanner OCR",nouvDossier:"+ Nouveau",type:"Type",debiteur:"Débiteur",cin:"CIN/RC",banque:"Banque",montant:"Montant",
    payeCol:"Payé",solde:"Solde",echeance:"Échéance",statut:"Statut",client:"Client",actions:"Actions",
    relanceBtn:"Relance",paiementBtn:"Paiement",modifier:"Modifier",supprimer:"Supprimer",creer:"Créer",annuler:"Annuler",
    nouvRelance:"Nouvelle Relance",action:"Action",canal:"Canal",details:"Détails",prochainRdv:"Prochain RDV",enregistrer:"Enregistrer",
    nouvPaiement:"Enregistrer un Paiement",montantMAD:"Montant (MAD)",date:"Date",mode:"Mode",reference:"Référence",notes:"Notes",
    detailDossier:"Dossier",miseEnDemeure:"Mise en Demeure",protocole:"Protocole",injonction:"Injonction",analyseIA:"Analyse IA",
    creances:"Créances",reste:"Reste",aucunDossier:"Aucun dossier",aucunPaiement:"Aucun paiement",aucuneRelance:"Aucune relance",
    aucuneActivite:"Aucune activité",aucunePrescription:"Aucune prescription imminente",aucuneDonnee:"Aucune donnée",
    prescInfo:"Chèque = 6 mois · LCN = 3 ans · Facture = 5 ans",jours:"j",
    etape1:"Étape 1: Scanner le Chèque / LCN",etape2:"Étape 2: Scanner le Certificat de Refus",etape3:"Vérifiez les données",
    photo:"Photo",recommencer:"Recommencer",clientMandant:"Client Mandant",
    nouvelUtilisateur:"Nouvel Utilisateur",nom:"Nom",role:"Rôle",
    paramSociete:"Paramètres Société",sauvegarder:"Sauvegarder",
    ajouterClient:"+ Ajouter Client",modifierClient:"Modifier Client",nouveauClient:"Nouveau Client",
    imprimer:"Imprimer",imprimerDossier:"Imprimer ce dossier",
    smsWhatsapp:"SMS / WhatsApp",envoyerSMS:"Envoyer SMS",envoyerWhatsApp:"Envoyer WhatsApp",
    messageRelance:"Message de relance",telephone:"Téléphone du débiteur",messageEnvoye:"Message envoyé",
    graphRecouvrement:"Évolution du Recouvrement",graphStatuts:"Répartition par Statut",graphTypes:"Montants par Type",graphMensuel:"Recouvrement Mensuel",
    langue:"Langue",chequeScanne:"Chèque scanné",analyse:"Analyse...",photoNette:"Prenez une photo nette",
    assigner:"Assigner",confirmerSupp:"Supprimer ?",priorite:"Priorité",adresse:"Adresse",ville:"Ville",
    repartitionStatut:"Répartition par Statut",montantParType:"Montants par Type",evolutionMensuelle:"Évolution Mensuelle",
    topDebiteurs:"Top Débiteurs",performanceAgents:"Performance Agents"
  },
  ar:{
    appName:"ريكوفرمون برو",appDesc:"إدارة الديون غير المسددة",login:"تسجيل الدخول",username:"المعرف",password:"كلمة المرور",
    dashboard:"لوحة القيادة",dossiers:"الملفات",scanner:"الماسح الضوئي",paiements:"المدفوعات",prescription:"التقادم",
    balance:"ميزان العمر",clients:"العملاء",equipe:"الفريق",historique:"السجل",parametres:"الإعدادات",logout:"تسجيل الخروج",
    totalDossiers:"الملفات",montantTotal:"المبلغ الإجمالي",recouvre:"المحصل",actifs:"نشط",taux:"النسبة",
    alertes:"التنبيهات",prescImm:"التقادم الوشيك",parStatut:"حسب الحالة",parType:"حسب النوع",
    nouveau:"جديد",enCours:"قيد المعالجة",relance:"تم التذكير",contentieux:"نزاع",paye:"مدفوع",impaye:"غير مدفوع نهائياً",prescrit:"متقادم",
    backup:"نسخ احتياطي",exportExcel:"تصدير إكسل",search:"بحث...",tousTypes:"جميع الأنواع",tousStatuts:"جميع الحالات",tousClients:"جميع العملاء",
    scannerOCR:"الماسح الضوئي",nouvDossier:"+ ملف جديد",type:"النوع",debiteur:"المدين",cin:"ب.ت/س.ت",banque:"البنك",montant:"المبلغ",
    payeCol:"المدفوع",solde:"الرصيد",echeance:"تاريخ الاستحقاق",statut:"الحالة",client:"العميل",actions:"الإجراءات",
    relanceBtn:"تذكير",paiementBtn:"دفع",modifier:"تعديل",supprimer:"حذف",creer:"إنشاء",annuler:"إلغاء",
    nouvRelance:"تذكير جديد",action:"الإجراء",canal:"القناة",details:"التفاصيل",prochainRdv:"الموعد القادم",enregistrer:"تسجيل",
    nouvPaiement:"تسجيل دفعة",montantMAD:"المبلغ (درهم)",date:"التاريخ",mode:"الطريقة",reference:"المرجع",notes:"ملاحظات",
    detailDossier:"ملف",miseEnDemeure:"إنذار بالأداء",protocole:"بروتوكول",injonction:"أمر بالأداء",analyseIA:"تحليل ذكي",
    creances:"الديون",reste:"المتبقي",aucunDossier:"لا توجد ملفات",aucunPaiement:"لا توجد مدفوعات",aucuneRelance:"لا توجد تذكيرات",
    aucuneActivite:"لا يوجد نشاط",aucunePrescription:"لا يوجد تقادم وشيك",aucuneDonnee:"لا توجد بيانات",
    prescInfo:"شيك = 6 أشهر · كمبيالة = 3 سنوات · فاتورة = 5 سنوات",jours:"ي",
    etape1:"المرحلة 1: مسح الشيك / الكمبيالة",etape2:"المرحلة 2: مسح شهادة الرفض",etape3:"تحقق من البيانات",
    photo:"صورة",recommencer:"إعادة",clientMandant:"العميل المكلف",
    nouvelUtilisateur:"مستخدم جديد",nom:"الاسم",role:"الدور",
    paramSociete:"إعدادات الشركة",sauvegarder:"حفظ",
    ajouterClient:"+ إضافة عميل",modifierClient:"تعديل العميل",nouveauClient:"عميل جديد",
    imprimer:"طباعة",imprimerDossier:"طباعة هذا الملف",
    smsWhatsapp:"رسائل / واتساب",envoyerSMS:"إرسال رسالة",envoyerWhatsApp:"إرسال واتساب",
    messageRelance:"رسالة تذكير",telephone:"هاتف المدين",messageEnvoye:"تم إرسال الرسالة",
    graphRecouvrement:"تطور التحصيل",graphStatuts:"توزيع حسب الحالة",graphTypes:"المبالغ حسب النوع",graphMensuel:"التحصيل الشهري",
    langue:"اللغة",chequeScanne:"تم مسح الشيك",analyse:"جاري التحليل...",photoNette:"التقط صورة واضحة",
    assigner:"تعيين",confirmerSupp:"هل تريد الحذف؟",priorite:"الأولوية",adresse:"العنوان",ville:"المدينة",
    repartitionStatut:"توزيع حسب الحالة",montantParType:"المبالغ حسب النوع",evolutionMensuelle:"التطور الشهري",
    topDebiteurs:"أكبر المدينين",performanceAgents:"أداء الوكلاء"
  }
};

// ═══════════════════════════════════════════
// FEATURE 3: LOGO SVG PROFESSIONNEL
// ═══════════════════════════════════════════
function RPLogo(props){
  var s=props.size||36;
  return(<svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpGrad" x1="0" y1="0" x2="48" y2="48">
        <stop offset="0%" stopColor="#D4A843"/>
        <stop offset="100%" stopColor="#B8922F"/>
      </linearGradient>
      <linearGradient id="rpShine" x1="0" y1="0" x2="0" y2="48">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25"/>
        <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0"/>
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx={s>30?"12":"8"} fill="url(#rpGrad)"/>
    <rect width="48" height="48" rx={s>30?"12":"8"} fill="url(#rpShine)"/>
    <path d="M12 12h8.5c4.5 0 7.5 2.8 7.5 7 0 3.5-2 5.8-5 6.6L28 36h-4.5l-4.5-10H16v10h-4V12zm4 3.5v7h4.5c2.3 0 3.5-1.5 3.5-3.5s-1.2-3.5-3.5-3.5H16z" fill="#0C0F1A" opacity="0.9"/>
    <path d="M30 12h4.2c4 0 6.8 2.5 6.8 6.8 0 4.3-2.8 6.8-6.8 6.8H34v10h-4V12zm4 3.5v6.6h0.5c2 0 3-1.2 3-3.3s-1-3.3-3-3.3H34z" fill="#0C0F1A" opacity="0.9"/>
  </svg>);
}

// ═══════════════════════════════════════════
// FEATURE 1: GRAPHIQUES SVG
// ═══════════════════════════════════════════
var CHART_COLORS=[T.blue,T.orange,T.green,T.purple,T.red,T.acc,"#EC4899","#14B8A6"];

function PieChart(props){
  var data=props.data||[];var size=props.size||200;var r=size/2-10;var cx=size/2;var cy=size/2;
  var total=data.reduce(function(s,d){return s+(d.value||0)},0);
  if(!total||data.length===0)return(<svg width={size} height={size}><text x={cx} y={cy} textAnchor="middle" fill={T.txtDim} fontSize="12">—</text></svg>);
  var slices=[];var angle=0;
  data.forEach(function(d,i){
    var pct=(d.value/total);var sweep=pct*360;var startAngle=angle;var endAngle=angle+sweep;
    var x1=cx+r*Math.cos((startAngle-90)*Math.PI/180);
    var y1=cy+r*Math.sin((startAngle-90)*Math.PI/180);
    var x2=cx+r*Math.cos((endAngle-90)*Math.PI/180);
    var y2=cy+r*Math.sin((endAngle-90)*Math.PI/180);
    var large=sweep>180?1:0;
    var path="M "+cx+" "+cy+" L "+x1+" "+y1+" A "+r+" "+r+" 0 "+large+" 1 "+x2+" "+y2+" Z";
    var midAngle=startAngle+sweep/2;
    var lx=cx+(r*0.65)*Math.cos((midAngle-90)*Math.PI/180);
    var ly=cy+(r*0.65)*Math.sin((midAngle-90)*Math.PI/180);
    slices.push({path:path,color:d.color||CHART_COLORS[i%CHART_COLORS.length],label:d.label,pct:Math.round(pct*100),lx:lx,ly:ly});
    angle=endAngle;
  });
  return(<svg width={size} height={size} style={{filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.3))"}}>
    {slices.map(function(s,i){return<path key={i} d={s.path} fill={s.color} stroke={T.bgCard} strokeWidth="2" style={{transition:"opacity .2s",cursor:"pointer"}}><title>{s.label}: {s.pct}%</title></path>})}
    {slices.map(function(s,i){return s.pct>=8?<text key={"t"+i} x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="10" fontWeight="700" style={{pointerEvents:"none",textShadow:"0 1px 3px rgba(0,0,0,0.6)"}}>{s.pct}%</text>:null})}
  </svg>);
}

function BarChart(props){
  var data=props.data||[];var w=props.width||360;var h=props.height||200;
  var max=Math.max.apply(null,data.map(function(d){return d.value||0}));
  if(!max)return(<svg width={w} height={h}><text x={w/2} y={h/2} textAnchor="middle" fill={T.txtDim} fontSize="12">—</text></svg>);
  var barW=Math.min(48,Math.floor((w-40)/(data.length||1))-8);var pad=(w-(data.length*(barW+8)))/2;
  return(<svg width={w} height={h}>
    <line x1="30" y1={h-30} x2={w} y2={h-30} stroke={T.brd} strokeWidth="1"/>
    {data.map(function(d,i){
      var barH=((d.value/max)*(h-60));var x=pad+i*(barW+8)+4;var y=h-30-barH;
      var color=d.color||CHART_COLORS[i%CHART_COLORS.length];
      return(<g key={i}>
        <defs><linearGradient id={"bg"+i} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="1"/><stop offset="100%" stopColor={color} stopOpacity="0.6"/></linearGradient></defs>
        <rect x={x} y={y} width={barW} height={barH} rx="4" fill={"url(#bg"+i+")"} style={{transition:"height .5s,y .5s"}}><title>{d.label}: {(d.value||0).toLocaleString("fr-MA")} MAD</title></rect>
        <text x={x+barW/2} y={y-6} textAnchor="middle" fill={T.txt} fontSize="9" fontWeight="700">{d.value>=1000000?(d.value/1000000).toFixed(1)+"M":d.value>=1000?(d.value/1000).toFixed(0)+"K":d.value}</text>
        <text x={x+barW/2} y={h-14} textAnchor="middle" fill={T.txtDim} fontSize="9" transform={"rotate(-25,"+(x+barW/2)+","+(h-14)+")"}>{(d.label||"").substring(0,8)}</text>
      </g>);
    })}
  </svg>);
}

function MiniLineChart(props){
  var data=props.data||[];var w=props.width||360;var h=props.height||180;
  var max=Math.max.apply(null,data.map(function(d){return d.value||0}));
  if(!max||data.length<2)return(<svg width={w} height={h}><text x={w/2} y={h/2} textAnchor="middle" fill={T.txtDim} fontSize="12">—</text></svg>);
  var padX=40;var padY=20;var plotW=w-padX-10;var plotH=h-padY-30;
  var points=data.map(function(d,i){
    var x=padX+i*(plotW/(data.length-1));
    var y=padY+plotH-(d.value/max)*plotH;
    return{x:x,y:y,label:d.label,value:d.value};
  });
  var linePath=points.map(function(p,i){return(i===0?"M ":"L ")+p.x+" "+p.y}).join(" ");
  var areaPath=linePath+" L "+points[points.length-1].x+" "+(padY+plotH)+" L "+points[0].x+" "+(padY+plotH)+" Z";
  return(<svg width={w} height={h}>
    {[0,0.25,0.5,0.75,1].map(function(f,i){var y=padY+plotH-f*plotH;return<g key={i}><line x1={padX} y1={y} x2={w-10} y2={y} stroke={T.brd} strokeWidth="0.5" strokeDasharray="4"/><text x={padX-4} y={y+3} textAnchor="end" fill={T.txtDim} fontSize="8">{Math.round(max*f/1000)}K</text></g>})}
    <defs><linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.acc} stopOpacity="0.3"/><stop offset="100%" stopColor={T.acc} stopOpacity="0"/></linearGradient></defs>
    <path d={areaPath} fill="url(#areaG)"/>
    <path d={linePath} fill="none" stroke={T.acc} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    {points.map(function(p,i){return<g key={i}><circle cx={p.x} cy={p.y} r="4" fill={T.bgCard} stroke={T.acc} strokeWidth="2"/><text x={p.x} y={padY+plotH+16} textAnchor="middle" fill={T.txtDim} fontSize="8">{p.label}</text></g>})}
  </svg>);
}

// ═══════════════════════════════════════════
// FEATURE 2: IMPRESSION — STYLES
// ═══════════════════════════════════════════
var PRINT_CSS="@media print{body{background:#fff!important;color:#000!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none!important}.print-only{display:block!important}aside,.sidebar-nav{display:none!important}main{padding:0!important;margin:0!important;max-height:none!important;overflow:visible!important}[data-print-area]{border:none!important;box-shadow:none!important;background:#fff!important;color:#000!important;padding:20px!important}[data-print-area] *{color:#000!important;background:transparent!important;border-color:#ccc!important}[data-print-area] span[style]{print-color-adjust:exact;-webkit-print-color-adjust:exact}}@page{margin:15mm;size:A4}";

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

// FEATURE 4: État langue
var _lang=useState(function(){return localStorage.getItem("rp_lang")||"fr"}),lang=_lang[0],setLang=_lang[1];
var t=TR[lang]||TR.fr;
var isRTL=lang==="ar";
var switchLang=function(){var nl=lang==="fr"?"ar":"fr";setLang(nl);localStorage.setItem("rp_lang",nl)};

// FEATURE 5: SMS/WhatsApp
var _showSMS=useState(false),showSMS=_showSMS[0],setShowSMS=_showSMS[1];
var _smsData=useState({tel:"",message:"",type:"sms",record_id:""}),smsData=_smsData[0],setSmsData=_smsData[1];
var _smsSending=useState(false),smsSending=_smsSending[0],setSmsSending=_smsSending[1];

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

// ── Stats ──
var stats=useMemo(function(){
  var total=records.length,montant=0,recouvre=0,actifs=0,parStatut={},parType={};
  records.forEach(function(r){montant+=Number(r.montant)||0;recouvre+=Number(r.montant_paye)||0;if(r.statut!=="Payé"&&r.statut!=="Impayé définitif"&&r.statut!=="Prescrit")actifs++;var sk=r.statut||"Nouveau";if(!parStatut[sk])parStatut[sk]={statut:sk,count:0,montant:0};parStatut[sk].count++;parStatut[sk].montant+=Number(r.montant)||0;var tk=r.type||"Autre";if(!parType[tk])parType[tk]={type:tk,count:0,montant:0};parType[tk].count++;parType[tk].montant+=Number(r.montant)||0});
  return{total:total,montant:montant,recouvre:recouvre,actifs:actifs,parStatut:Object.values(parStatut),parType:Object.values(parType)};
},[records]);

// FEATURE 1: Données graphiques calculées
var chartData=useMemo(function(){
  // Pie data par statut
  var pie=stats.parStatut.map(function(s){var sc=SC[s.statut];return{label:s.statut,value:s.count,color:sc?sc.txt:T.txtDim}});
  // Bar data par type
  var bar=stats.parType.map(function(t,i){return{label:t.type,value:t.montant,color:CHART_COLORS[i%CHART_COLORS.length]}});
  // Line data: recouvrement mensuel (6 derniers mois)
  var months={};var now=new Date();
  for(var mi=5;mi>=0;mi--){var md=new Date(now.getFullYear(),now.getMonth()-mi,1);var key=md.getFullYear()+"-"+String(md.getMonth()+1).padStart(2,"0");months[key]={label:md.toLocaleDateString("fr-FR",{month:"short"}),value:0}}
  records.forEach(function(r){if(r.montant_paye>0&&r.updated_at){var mk=r.updated_at.slice(0,7);if(months[mk])months[mk].value+=Number(r.montant_paye)||0}});
  var line=Object.values(months);
  // Top débiteurs
  var topDeb=records.filter(function(r){return r.statut!=="Payé"&&(Number(r.solde_restant)||0)>0}).sort(function(a,b){return(Number(b.solde_restant)||0)-(Number(a.solde_restant)||0)}).slice(0,5);
  return{pie:pie,bar:bar,line:line,topDeb:topDeb};
},[records,stats]);

// ── CRUD ──
var createRecord=function(){var data=Object.assign({},form);data.montant=parseFloat(data.montant)||0;api("POST","/api/records",data).then(function(){okH("Dossier créé");setShowForm(false);setForm(emptyForm);loadAll()}).catch(errH)};
var updateRecord=function(){var data=Object.assign({},form);data.montant=parseFloat(data.montant)||0;api("PUT","/api/records/"+editRec,data).then(function(){okH("Modifié");setShowForm(false);setEditRec(null);setForm(emptyForm);loadAll()}).catch(errH)};
var deleteRecord=function(id){if(!window.confirm(t.confirmerSupp))return;api("DELETE","/api/records/"+id).then(function(){okH("Supprimé");loadAll()}).catch(errH)};
var changeStatut=function(id,s){api("PATCH","/api/records/"+id+"/statut",{statut:s}).then(function(){okH("Statut OK");loadAll()}).catch(errH)};
var assignAgent=function(id,aid){api("PATCH","/api/records/"+id+"/assign",{agent_id:aid}).then(function(){okH("Assigné");loadAll()}).catch(errH)};
var doRel=function(){if(!rf.action){setErr("Sélectionnez une action");return;}api("POST","/api/relances",{record_id:selRec,type_relance:rf.action,canal:rf.canal,notes:rf.details,date_prochain_rdv:rf.date_prochain_rdv||""}).then(function(){okH("Relance OK");setShowRel(false);setRf({action:"",canal:"telephone",details:"",date_prochain_rdv:""});loadAll()}).catch(errH)};
var doPay=function(){var mt=parseFloat(pf.montant);if(!mt||mt<=0){setErr("Montant invalide");return;}api("POST","/api/paiements",{record_id:selRec,montant:mt,date_paiement:pf.date_paiement,mode:pf.mode,reference_paiement:pf.reference_paiement,banque:pf.banque,notes:pf.notes}).then(function(){okH("Paiement OK");setShowPay(false);setPf({montant:"",mode:"especes",date_paiement:new Date().toISOString().slice(0,10),reference_paiement:"",banque:"",notes:""});loadAll()}).catch(errH)};
var loadRecPay=function(rid){api("GET","/api/paiements/"+rid).then(setRecPay).catch(function(){setRecPay([])})};
var loadRecRel=function(rid){api("GET","/api/relances/"+rid).then(setRecRel).catch(function(){setRecRel([])})};
var createUser=function(){if(!uf.username||!uf.password||!uf.nom){setErr("Champs requis");return;}api("POST","/api/users",uf).then(function(){okH("Créé");setShowUF(false);setUf({username:"",password:"",nom:"",role:"agent"});loadAll()}).catch(errH)};
var deleteUser=function(id){if(!window.confirm(t.confirmerSupp))return;api("DELETE","/api/users/"+id).then(function(){okH("Supprimé");loadAll()}).catch(errH)};
var saveSociete=function(){api("PUT","/api/societe",societe).then(function(){okH("Sauvegardé")}).catch(errH)};
var exportExcel=function(){window.open(API+"/api/export/csv?token="+token,"_blank")};
var doBackup=function(){api("POST","/api/backup").then(function(){okH("Backup OK")}).catch(errH)};
var downloadDoc=function(type,id){window.open(API+"/api/documents/"+type+"/"+id+"?token="+token,"_blank")};
var doAiAnalyze=function(id){setAiLoading(true);setAiResult(null);api("GET","/api/ai/analyze/"+id).then(function(d){setAiResult(d.analysis||d);setAiLoading(false)}).catch(function(e){setAiLoading(false);errH(e)})};
var createClient=function(){if(!cf.nom){setErr("Nom requis");return;}api("POST","/api/clients",cf).then(function(){okH("Client créé");setShowClientForm(false);setCf(emptyCf);loadAll()}).catch(errH)};
var updateClient=function(){api("PUT","/api/clients/"+editClient,cf).then(function(){okH("Client modifié");setShowClientForm(false);setEditClient(null);setCf(emptyCf);loadAll()}).catch(errH)};
var openEditClient=function(c){setEditClient(c.id);setCf({nom:c.nom||"",ice:c.ice||"",rc:c.rc||"",adresse:c.adresse||"",ville:c.ville||"",tel:c.tel||"",email:c.email||"",contact_nom:c.contact_nom||"",contact_tel:c.contact_tel||""});setShowClientForm(true)};

// FEATURE 2: Impression
var doPrint=function(){window.print()};
var printDossier=function(rec){
  var w=window.open("","_blank","width=800,height=600");
  var mt=Number(rec.solde_restant)||Number(rec.montant)||0;
  w.document.write("<html><head><title>Dossier "+rec.id+"</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#1a1a1a}h1{color:#B8922F;border-bottom:3px solid #D4A843;padding-bottom:10px}table{width:100%;border-collapse:collapse;margin:15px 0}td{padding:8px 12px;border:1px solid #ddd;font-size:13px}td:first-child{font-weight:bold;background:#f9f9f7;width:35%}.header{text-align:center;margin-bottom:30px}.logo{font-size:28px;font-weight:900;color:#B8922F}.footer{margin-top:40px;text-align:center;color:#999;font-size:11px;border-top:1px solid #ddd;padding-top:15px}</style></head><body>");
  w.document.write("<div class='header'><div class='logo'>RP — Recouvrement Pro</div><div style='color:#888;font-size:12px'>"+((societe.nom||"")+" — "+(societe.tel||""))+"</div></div>");
  w.document.write("<h1>Fiche Dossier N° "+rec.id+"</h1><table>");
  var fields=[["Type",rec.type],["Débiteur",rec.nom_debiteur],["CIN",rec.cin_debiteur],["RC",rec.rc_debiteur],["Adresse",rec.adresse_debiteur],["Ville",rec.ville],["Téléphone",rec.tel_debiteur],["N° Compte",rec.num_compte],["N° Document",rec.num_document],["Banque",rec.banque],["Agence",rec.agence_bancaire],["Montant",fmtM(rec.montant)],["Payé",fmtM(rec.montant_paye)],["Solde restant",fmtM(mt)],["Échéance",fmtD(rec.date_echeance)],["Prescription",fmtD(rec.date_prescription)],["Statut",rec.statut],["Priorité",rec.priorite],["Motif rejet",rec.motif_rejet],["Client mandant",rec.nom_client],["Notes",rec.notes]];
  fields.forEach(function(f){if(f[1])w.document.write("<tr><td>"+f[0]+"</td><td>"+f[1]+"</td></tr>")});
  w.document.write("</table>");
  w.document.write("<div class='footer'>Document généré par Recouvrement Pro — "+new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})+"</div>");
  w.document.write("</body></html>");
  w.document.close();
  w.print();
};

// FEATURE 5: Envoyer SMS/WhatsApp
var openSMSModal=function(rec,type){
  var tel=rec.tel_debiteur||"";
  var mt=Number(rec.solde_restant)||Number(rec.montant)||0;
  var msgText=lang==="ar"?
    "السيد(ة) "+(rec.nom_debiteur||"")+", نذكركم بأن مبلغ "+mt.toLocaleString("fr-MA")+" درهم لا يزال غير مؤدى. نرجو تسوية المبلغ في أقرب وقت. شركة "+(societe.nom||""):
    "Cher(e) "+(rec.nom_debiteur||"")+", nous vous rappelons que la somme de "+fmtM(mt)+" reste impayée. Nous vous prions de régulariser dans les meilleurs délais. "+(societe.nom||"");
  setSmsData({tel:tel,message:msgText,type:type||"sms",record_id:rec.id});
  setShowSMS(true);
};
var sendSMS=function(){
  if(!smsData.tel||!smsData.message){setErr("Téléphone et message requis");return;}
  setSmsSending(true);
  api("POST","/api/messaging/send",{to:smsData.tel,message:smsData.message,type:smsData.type,record_id:smsData.record_id})
  .then(function(d){
    okH(t.messageEnvoye);setShowSMS(false);setSmsSending(false);loadAll();
  }).catch(function(e){
    // Si l'API n'est pas encore configurée, ouvrir WhatsApp directement
    if(smsData.type==="whatsapp"){
      var waUrl="https://wa.me/"+smsData.tel.replace(/[^0-9]/g,"")+"?text="+encodeURIComponent(smsData.message);
      window.open(waUrl,"_blank");
      okH("WhatsApp ouvert");
    }else{
      setErr("SMS API non configurée. Configurez l'API dans les paramètres serveur.");
    }
    setShowSMS(false);setSmsSending(false);
  });
};

var filtered=useMemo(function(){return records.filter(function(r){if(filterType&&r.type!==filterType)return false;if(filterStatut&&r.statut!==filterStatut)return false;if(filterClient&&r.nom_client!==filterClient)return false;if(search){var s=search.toLowerCase();return(r.nom_debiteur||"").toLowerCase().includes(s)||(r.cin_debiteur||"").toLowerCase().includes(s)||(r.num_document||"").toLowerCase().includes(s)||(r.nom_client||"").toLowerCase().includes(s)||(r.banque||"").toLowerCase().includes(s)||String(r.id).toLowerCase().includes(s)}return true})},[records,filterType,filterStatut,filterClient,search]);
var clientsList=useMemo(function(){var c={};records.forEach(function(r){if(r.nom_client)c[r.nom_client]=true});return Object.keys(c).sort()},[records]);
var alerts=useMemo(function(){var a=[],today=new Date();records.forEach(function(r){if(r.statut==="Payé"||r.statut==="Impayé définitif"||r.statut==="Prescrit")return;if(r.date_echeance){var diff=Math.floor((today-new Date(r.date_echeance))/86400000);if(diff>90)a.push({type:"danger",text:r.nom_debiteur+" — "+diff+t.jours+" retard ("+fmtM(r.montant)+")",id:r.id});else if(diff>30)a.push({type:"warning",text:r.nom_debiteur+" — "+diff+t.jours+" retard",id:r.id})}});return a},[records,t.jours]);

// ═══ LOGIN ═══
if(!user){return(
<div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0C0F1A,#1A1F35)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',sans-serif"}}>
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:16,padding:40,width:380,boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}>
<div style={{textAlign:"center",marginBottom:30}}>
  <RPLogo size={56}/>
  <div style={{fontSize:20,fontWeight:800,color:T.txt,marginTop:12}}>{t.appName}</div>
  <div style={{fontSize:12,color:T.txtDim,marginTop:4}}>{t.appDesc}</div>
</div>
{/* Language toggle on login */}
<div style={{textAlign:"center",marginBottom:16}}>
  <button onClick={switchLang} style={{background:T.bgHov,border:"1px solid "+T.brd,borderRadius:20,padding:"4px 14px",color:T.acc,fontSize:11,fontWeight:700,cursor:"pointer"}}>{lang==="fr"?"🇲🇦 العربية":"🇫🇷 Français"}</button>
</div>
{loginErr&&<div style={{background:T.redBg,color:T.red,padding:"8px 12px",borderRadius:8,fontSize:12,marginBottom:12}}>{loginErr}</div>}
<div style={{marginBottom:14}}><label style={dim}>{t.username}</label><input value={loginU} onChange={function(e){setLoginU(e.target.value)}} onKeyDown={function(e){if(e.key==="Enter")doLogin()}} style={iS} placeholder="admin"/></div>
<div style={{marginBottom:20}}><label style={dim}>{t.password}</label><input type="password" value={loginP} onChange={function(e){setLoginP(e.target.value)}} onKeyDown={function(e){if(e.key==="Enter")doLogin()}} style={iS} placeholder="••••••"/></div>
<button onClick={doLogin} style={Object.assign({},bs,{width:"100%",padding:12,fontSize:14})}>{t.login}</button>
</div></div>)}

var isMgr=user.role==="manager";
var navItems=[{id:"dashboard",icon:"📊",label:t.dashboard},{id:"dossiers",icon:"📁",label:t.dossiers},{id:"scanner",icon:"📸",label:t.scanner},{id:"paiements",icon:"💰",label:t.paiements},{id:"prescription",icon:"⏰",label:t.prescription},{id:"balance",icon:"📈",label:t.balance},{id:"clients",icon:"🏢",label:t.clients,mgr:true},{id:"equipe",icon:"👥",label:t.equipe,mgr:true},{id:"historique",icon:"📜",label:t.historique},{id:"parametres",icon:"⚙️",label:t.parametres,mgr:true}].filter(function(n){return!n.mgr||isMgr});

// ═══ MAIN ═══
return(
<div style={{display:"flex",minHeight:"100vh",background:T.bg,fontFamily:"'Segoe UI',sans-serif",color:T.txt,direction:isRTL?"rtl":"ltr"}}>
{/* SIDEBAR */}
<aside className="no-print" style={{width:collapsed?64:220,background:T.bgCard,borderRight:isRTL?undefined:"1px solid "+T.brd,borderLeft:isRTL?"1px solid "+T.brd:undefined,display:"flex",flexDirection:"column",transition:"width .2s",flexShrink:0,overflow:"hidden"}}>
<div style={{padding:collapsed?"16px 10px":"16px 18px",borderBottom:"1px solid "+T.brd,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={function(){setCollapsed(!collapsed)}}>
  <RPLogo size={36}/>
  {!collapsed&&<div><div style={{fontSize:14,fontWeight:800}}>{t.appName}</div><div style={{fontSize:10,color:T.txtDim}}>{user.nom} — {user.role}</div></div>}
</div>
{/* Language toggle in sidebar */}
{!collapsed&&<div style={{padding:"8px 18px",borderBottom:"1px solid "+T.brd}}><button onClick={switchLang} style={{width:"100%",background:T.bgHov,border:"1px solid "+T.brd,borderRadius:8,padding:"6px 10px",color:T.acc,fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><span>{lang==="fr"?"🇲🇦":"🇫🇷"}</span><span>{lang==="fr"?"العربية":"Français"}</span></button></div>}
<nav style={{flex:1,padding:"8px 0"}}>{navItems.map(function(n){var active=page===n.id;return<div key={n.id} onClick={function(){setPage(n.id)}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 18px",margin:"2px 8px",borderRadius:8,cursor:"pointer",background:active?T.accLight:"transparent",color:active?T.acc:T.txtDim,fontWeight:active?700:500,fontSize:13}}><span style={{fontSize:16,flexShrink:0}}>{n.icon}</span>{!collapsed&&<span>{n.label}</span>}</div>})}</nav>
<div style={{padding:"12px 8px",borderTop:"1px solid "+T.brd}}><button onClick={function(){setToken("");setUser(null);localStorage.removeItem("rp_token");localStorage.removeItem("rp_user")}} style={{width:"100%",padding:"8px",background:T.redBg,border:"none",borderRadius:8,color:T.red,fontSize:12,fontWeight:600,cursor:"pointer"}}>{collapsed?"🚪":t.logout}</button></div>
</aside>

<main style={{flex:1,overflow:"auto",padding:24,maxHeight:"100vh"}}>
{msg&&<div style={{position:"fixed",top:16,right:isRTL?undefined:16,left:isRTL?16:undefined,background:T.greenBg,border:"1px solid "+T.green,color:T.green,padding:"10px 18px",borderRadius:10,fontSize:13,fontWeight:600,zIndex:9999}}>{msg}</div>}
{err&&<div style={{position:"fixed",top:16,right:isRTL?undefined:16,left:isRTL?16:undefined,background:T.redBg,border:"1px solid "+T.red,color:T.red,padding:"10px 18px",borderRadius:10,fontSize:13,fontWeight:600,zIndex:9999}}>{err}</div>}

{/* ══ DASHBOARD ══ */}
{page==="dashboard"&&<div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:8}}><div><div style={{fontSize:22,fontWeight:800}}>{t.dashboard}</div></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={doPrint} className="no-print" style={Object.assign({},bs,{background:T.bgHov,color:T.txtDim,fontSize:11,padding:"8px 14px"})}>🖨️ {t.imprimer}</button>{isMgr&&<button onClick={doBackup} className="no-print" style={Object.assign({},bs,{background:T.bgHov,color:T.txtDim,fontSize:11,padding:"8px 14px"})}>💾 {t.backup}</button>}<button onClick={exportExcel} className="no-print" style={Object.assign({},bs,{fontSize:11,padding:"8px 14px"})}>📥 {t.exportExcel}</button></div></div>
{/* KPI Cards */}
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:20}}>
{[{l:t.totalDossiers,v:stats.total,c:T.blue,i:"📁"},{l:t.montantTotal,v:fmtM(stats.montant),c:T.orange,i:"💰"},{l:t.recouvre,v:fmtM(stats.recouvre),c:T.green,i:"✅"},{l:t.actifs,v:stats.actifs,c:T.purple,i:"⚡"},{l:t.taux,v:stats.montant?((stats.recouvre/stats.montant)*100).toFixed(1)+"%":"0%",c:T.acc,i:"📈"}].map(function(k,i){return<div key={i} style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:11,color:T.txtDim,fontWeight:600}}>{k.l}</span><span style={{fontSize:20}}>{k.i}</span></div><div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div></div>})}
</div>

{/* FEATURE 1: GRAPHIQUES */}
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:14,marginBottom:20}}>
{/* Pie - Statuts */}
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18}}>
  <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>{t.repartitionStatut}</div>
  <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
    <PieChart data={chartData.pie} size={180}/>
    <div style={{flex:1,minWidth:120}}>{chartData.pie.map(function(d,i){return<div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><div style={{width:10,height:10,borderRadius:3,background:d.color,flexShrink:0}}></div><span style={{fontSize:11,color:T.txtDim}}>{d.label}</span><span style={{fontSize:11,fontWeight:700,color:T.txt,marginLeft:"auto"}}>{d.value}</span></div>})}</div>
  </div>
</div>
{/* Bar - Types */}
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18}}>
  <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>{t.montantParType}</div>
  <BarChart data={chartData.bar} width={340} height={200}/>
</div>
</div>

{/* Line - Evolution mensuelle */}
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18,marginBottom:20}}>
  <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>{t.evolutionMensuelle}</div>
  <MiniLineChart data={chartData.line} width={700} height={180}/>
</div>

{/* Top débiteurs + Alertes */}
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
{/* Top Débiteurs */}
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18}}>
  <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>{t.topDebiteurs}</div>
  {chartData.topDeb.length>0?chartData.topDeb.map(function(r,i){var pct=stats.montant?((Number(r.solde_restant)||0)/stats.montant*100):0;return<div key={i} style={{marginBottom:8}}>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{fontWeight:600}}>{r.nom_debiteur||"—"}</span><span style={{color:T.red,fontWeight:700}}>{fmtM(r.solde_restant)}</span></div>
    <div style={{height:6,background:T.bgHov,borderRadius:3}}><div style={{width:Math.min(pct*2,100)+"%",height:"100%",background:T.red,borderRadius:3,transition:"width .5s"}}></div></div>
  </div>}):<div style={{color:T.txtDim,fontSize:12}}>—</div>}
</div>
{/* Alertes */}
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18}}>
  <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>🔔 {t.alertes} ({alerts.length})</div>
  {alerts.length>0?alerts.slice(0,8).map(function(a,i){return<div key={i} style={{padding:"8px 12px",borderRadius:8,marginBottom:4,background:a.type==="danger"?T.redBg:T.orangeBg,color:a.type==="danger"?T.red:T.orange,fontSize:12,cursor:"pointer"}} onClick={function(){setPage("dossiers");setSearch(String(a.id))}}>{a.text}</div>}):<div style={{color:T.txtDim,fontSize:12}}>{t.aucunDossier}</div>}
</div>
</div>

{prescSoon.length>0&&<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18,marginBottom:20}}><div style={{fontSize:14,fontWeight:700,marginBottom:10,color:T.red}}>⏰ {t.prescImm} ({prescSoon.length})</div>{prescSoon.slice(0,5).map(function(p,i){var jrs=Math.floor((new Date(p.date_prescription)-new Date())/86400000);return<div key={i} style={{padding:"8px 12px",borderRadius:8,marginBottom:4,background:jrs<=7?T.redBg:T.orangeBg,color:jrs<=7?T.red:T.orange,fontSize:12}}>{p.nom_debiteur} — {p.type} — {fmtM(p.montant)} — {fmtD(p.date_prescription)} ({jrs}{t.jours})</div>})}</div>}

{/* Par Statut / Par Type (ancien format aussi gardé) */}
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18}}><div style={{fontSize:14,fontWeight:700,marginBottom:12}}>{t.parStatut}</div>{stats.parStatut.map(function(s,i){var sc=SC[s.statut]||{bg:T.bgHov,txt:T.txtDim};return<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderRadius:6,marginBottom:4,background:sc.bg}}><span style={{color:sc.txt,fontSize:12,fontWeight:600}}>{s.statut}</span><span style={{color:sc.txt,fontSize:12}}>{s.count} — {fmtM(s.montant)}</span></div>})}</div>
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18}}><div style={{fontSize:14,fontWeight:700,marginBottom:12}}>{t.parType}</div>{stats.parType.map(function(tt,i){return<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderRadius:6,marginBottom:4,background:T.bgHov}}><span style={{fontSize:12,fontWeight:600}}>{tt.type}</span><span style={{fontSize:12,color:T.txtDim}}>{tt.count} — {fmtM(tt.montant)}</span></div>})}</div>
</div></div>}

{/* ══ DOSSIERS ══ */}
{page==="dossiers"&&<div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}><div style={{fontSize:22,fontWeight:800}}>{t.dossiers} ({filtered.length})</div><div style={{display:"flex",gap:8}}><button onClick={doPrint} className="no-print" style={Object.assign({},bs,{background:T.bgHov,color:T.txtDim,fontSize:11,padding:"8px 12px"})}>🖨️</button><button onClick={function(){setPage("scanner")}} style={Object.assign({},bs,{background:T.bgHov,color:T.acc})}>📸 {t.scannerOCR}</button><button onClick={function(){setEditRec(null);setForm(emptyForm);setShowForm(true)}} style={bs}>{t.nouvDossier}</button></div></div>
<div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}><input placeholder={"🔍 "+t.search} value={search} onChange={function(e){setSearch(e.target.value)}} style={Object.assign({},iS,{flex:1,minWidth:200})}/><select value={filterType} onChange={function(e){setFilterType(e.target.value)}} style={Object.assign({},iS,{width:130})}><option value="">{t.tousTypes}</option>{TYPES.map(function(tp){return<option key={tp}>{tp}</option>})}</select><select value={filterStatut} onChange={function(e){setFilterStatut(e.target.value)}} style={Object.assign({},iS,{width:150})}><option value="">{t.tousStatuts}</option>{STATUTS.map(function(s){return<option key={s}>{s}</option>})}</select><select value={filterClient} onChange={function(e){setFilterClient(e.target.value)}} style={Object.assign({},iS,{width:160})}><option value="">{t.tousClients}</option>{clientsList.map(function(c){return<option key={c}>{c}</option>})}</select></div>
<div data-print-area="true" style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{background:T.bgHov}}>{[t.type,t.debiteur,t.cin,t.banque,t.montant,t.payeCol,t.solde,t.echeance,t.statut,t.client,t.actions].map(function(h){return<th key={h} style={{padding:"10px 12px",textAlign:isRTL?"right":"left",color:T.txtDim,fontWeight:600,fontSize:11,borderBottom:"1px solid "+T.brd}}>{h}</th>})}</tr></thead>
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
<td style={{padding:"10px 12px"}} onClick={function(e){e.stopPropagation()}}><div style={{display:"flex",gap:4,flexWrap:"wrap"}} className="no-print">
<select value={r.statut} onChange={function(e){changeStatut(r.id,e.target.value)}} style={{background:T.bgInput,border:"1px solid "+T.brd,borderRadius:6,color:T.txt,fontSize:10,padding:"4px",cursor:"pointer"}}>{STATUTS.map(function(s){return<option key={s}>{s}</option>})}</select>
{isMgr&&<select value={r.assigned_to||""} onChange={function(e){assignAgent(r.id,e.target.value)}} style={{background:T.bgInput,border:"1px solid "+T.brd,borderRadius:6,color:T.txt,fontSize:10,padding:"4px",cursor:"pointer",maxWidth:80}}><option value="">{t.assigner}</option>{users.filter(function(u){return u.role==="agent"}).map(function(u){return<option key={u.id} value={u.id}>{u.nom}</option>})}</select>}
<button onClick={function(){setSelRec(r.id);setShowRel(true)}} style={{background:T.orangeBg,border:"none",borderRadius:6,color:T.orange,fontSize:10,padding:"4px 8px",cursor:"pointer"}} title={t.relanceBtn}>📞</button>
<button onClick={function(){setSelRec(r.id);setShowPay(true)}} style={{background:T.greenBg,border:"none",borderRadius:6,color:T.green,fontSize:10,padding:"4px 8px",cursor:"pointer"}} title={t.paiementBtn}>💰</button>
{/* FEATURE 5: SMS/WhatsApp buttons */}
{r.tel_debiteur&&<button onClick={function(){openSMSModal(r,"sms")}} style={{background:T.blueBg,border:"none",borderRadius:6,color:T.blue,fontSize:10,padding:"4px 8px",cursor:"pointer"}} title="SMS">💬</button>}
{r.tel_debiteur&&<button onClick={function(){openSMSModal(r,"whatsapp")}} style={{background:T.greenBg,border:"none",borderRadius:6,color:"#25D366",fontSize:10,padding:"4px 8px",cursor:"pointer"}} title="WhatsApp">📱</button>}
<button onClick={function(){setEditRec(r.id);setForm({type:r.type||"Chèque",nom_debiteur:r.nom_debiteur||"",cin_debiteur:r.cin_debiteur||"",rc_debiteur:r.rc_debiteur||"",ice_debiteur:r.ice_debiteur||"",adresse_debiteur:r.adresse_debiteur||"",tel_debiteur:r.tel_debiteur||"",email_debiteur:r.email_debiteur||"",num_compte:r.num_compte||"",num_document:r.num_document||"",banque:r.banque||"",agence_bancaire:r.agence_bancaire||"",montant:r.montant||"",date_echeance:r.date_echeance||"",motif_rejet:r.motif_rejet||"",nom_client:r.nom_client||"",ville:r.ville||"",notes:r.notes||"",priorite:r.priorite||"Normale",canal_prefere:r.canal_prefere||""});setShowForm(true)}} style={{background:T.blueBg,border:"none",borderRadius:6,color:T.blue,fontSize:10,padding:"4px 8px",cursor:"pointer"}} title={t.modifier}>✏️</button>
{isMgr&&<button onClick={function(){deleteRecord(r.id)}} style={{background:T.redBg,border:"none",borderRadius:6,color:T.red,fontSize:10,padding:"4px 8px",cursor:"pointer"}} title={t.supprimer}>🗑️</button>}
</div></td></tr>})}</tbody></table></div>{filtered.length===0&&<div style={{textAlign:"center",padding:40,color:T.txtDim}}>{t.aucunDossier}</div>}</div></div>}

{/* ══ SCANNER ══ */}
{page==="scanner"&&<ScanPage token={token} api={api} onDone={function(){loadAll();setPage("dossiers");okH("Dossier créé par scan")}} errH={errH} t={t}/>}

{/* ══ PAIEMENTS ══ */}
{page==="paiements"&&<div>
<div style={{fontSize:22,fontWeight:800,marginBottom:20}}>💰 {t.paiements}</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:20}}>
{[{l:t.creances,v:fmtM(stats.montant),c:T.orange},{l:t.recouvre,v:fmtM(stats.recouvre),c:T.green},{l:t.reste,v:fmtM(stats.montant-stats.recouvre),c:T.red},{l:t.taux,v:stats.montant?((stats.recouvre/stats.montant)*100).toFixed(1)+"%":"0%",c:T.acc}].map(function(k,i){return<div key={i} style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18}}><div style={{fontSize:11,color:T.txtDim,fontWeight:600,marginBottom:8}}>{k.l}</div><div style={{fontSize:20,fontWeight:800,color:k.c}}>{k.v}</div></div>})}
</div>
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{background:T.bgHov}}>{[t.debiteur,t.type,t.montant,t.payeCol,t.solde,t.statut,""].map(function(h){return<th key={h} style={{padding:"10px 12px",textAlign:isRTL?"right":"left",color:T.txtDim,fontWeight:600,fontSize:11,borderBottom:"1px solid "+T.brd}}>{h}</th>})}</tr></thead>
<tbody>{records.filter(function(r){return r.statut!=="Payé"&&r.statut!=="Impayé définitif"&&r.statut!=="Prescrit"}).map(function(r){var paid=Number(r.montant_paye)||0,mt=Number(r.montant)||0,pct=mt?((paid/mt)*100).toFixed(0):0;return<tr key={r.id} style={{borderBottom:"1px solid "+T.brd+"40"}}><td style={{padding:"10px 12px",fontWeight:600}}>{r.nom_debiteur||"—"}</td><td style={{padding:"10px 12px"}}>{r.type}</td><td style={{padding:"10px 12px",color:T.orange,fontWeight:700}}>{fmtM(mt)}</td><td style={{padding:"10px 12px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{flex:1,height:6,background:T.bgHov,borderRadius:3}}><div style={{width:pct+"%",height:"100%",background:T.green,borderRadius:3}}></div></div><span style={{color:T.green,fontSize:11,minWidth:35}}>{pct}%</span></div></td><td style={{padding:"10px 12px",color:T.red,fontWeight:700}}>{fmtM(Number(r.solde_restant)||0)}</td><td style={{padding:"10px 12px"}}><span style={{background:(SC[r.statut]||{}).bg,color:(SC[r.statut]||{}).txt,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>{r.statut}</span></td><td style={{padding:"10px 12px"}}><button onClick={function(){setSelRec(r.id);setShowPay(true)}} style={Object.assign({},bs,{padding:"6px 12px",fontSize:11})}>+ {t.paiementBtn}</button></td></tr>})}</tbody></table></div></div></div>}

{/* ══ PRESCRIPTION ══ */}
{page==="prescription"&&<div>
<div style={{fontSize:22,fontWeight:800,marginBottom:6}}>⏰ {t.prescription}</div>
<div style={{fontSize:12,color:T.txtDim,marginBottom:20}}>{t.prescInfo}</div>
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{background:T.bgHov}}>{[t.debiteur,t.type,t.montant,t.echeance,t.prescription,t.jours,t.statut].map(function(h){return<th key={h} style={{padding:"10px 12px",textAlign:isRTL?"right":"left",color:T.txtDim,fontWeight:600,fontSize:11,borderBottom:"1px solid "+T.brd}}>{h}</th>})}</tr></thead>
<tbody>{prescSoon.map(function(p,i){var jrs=Math.floor((new Date(p.date_prescription)-new Date())/86400000);var color=jrs<=7?T.red:jrs<=15?T.orange:T.acc;var bgc=jrs<=7?T.redBg:jrs<=15?T.orangeBg:T.accLight;return<tr key={i} style={{borderBottom:"1px solid "+T.brd+"40"}}><td style={{padding:"10px 12px",fontWeight:600}}>{p.nom_debiteur}</td><td style={{padding:"10px 12px"}}>{p.type}</td><td style={{padding:"10px 12px",color:T.orange,fontWeight:700}}>{fmtM(p.montant)}</td><td style={{padding:"10px 12px",color:T.txtDim}}>{fmtD(p.date_echeance)}</td><td style={{padding:"10px 12px",color:color,fontWeight:600}}>{fmtD(p.date_prescription)}</td><td style={{padding:"10px 12px"}}><span style={{background:bgc,color:color,padding:"4px 12px",borderRadius:20,fontWeight:700}}>{jrs}{t.jours}</span></td><td style={{padding:"10px 12px"}}><span style={{background:(SC[p.statut]||{}).bg,color:(SC[p.statut]||{}).txt,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>{p.statut}</span></td></tr>})}</tbody></table></div>{prescSoon.length===0&&<div style={{textAlign:"center",padding:40,color:T.txtDim}}>{t.aucunePrescription}</div>}</div></div>}

{/* ══ BALANCE ÂGÉE ══ */}
{page==="balance"&&<div>
<div style={{fontSize:22,fontWeight:800,marginBottom:20}}>📈 {t.balance}</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:20}}>
{aging.map(function(a,i){var colors={"0-30j":T.green,"31-60j":T.blue,"61-90j":T.orange,"91-180j":T.red,"181-365j":"#EF4444","+1an":"#DC2626"};return<div key={i} style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:16}}><div style={{fontSize:11,color:T.txtDim,fontWeight:600,marginBottom:6}}>{a.tranche}</div><div style={{fontSize:18,fontWeight:800,color:colors[a.tranche]||T.txtDim}}>{fmtM(a.montant)}</div><div style={{fontSize:11,color:T.txtDim}}>{a.count} {t.dossiers.toLowerCase()}</div></div>})}
</div>{aging.length===0&&<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:40,textAlign:"center",color:T.txtDim}}>{t.aucuneDonnee}</div>}</div>}

{/* ══ CLIENTS ══ */}
{page==="clients"&&isMgr&&<div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{fontSize:22,fontWeight:800}}>🏢 {t.clients} ({clients.length})</div><button onClick={function(){setEditClient(null);setCf(emptyCf);setShowClientForm(true)}} style={bs}>{t.ajouterClient}</button></div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14}}>
{clients.map(function(c){var cr=records.filter(function(r){return r.nom_client===c.nom||r.client_id===c.id});var mtTotal=cr.reduce(function(s,r){return s+(Number(r.montant)||0)},0);var mtPaye=cr.reduce(function(s,r){return s+(Number(r.montant_paye)||0)},0);return<div key={c.id} style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
<div><div style={{fontWeight:700,fontSize:15}}>{c.nom}</div>{c.ice&&<div style={{fontSize:11,color:T.txtDim}}>ICE: {c.ice}</div>}{c.rc&&<div style={{fontSize:11,color:T.txtDim}}>RC: {c.rc}</div>}{c.ville&&<div style={{fontSize:11,color:T.txtDim}}>{c.ville}</div>}</div>
<button onClick={function(){openEditClient(c)}} style={{background:T.blueBg,border:"none",borderRadius:6,color:T.blue,fontSize:11,padding:"4px 10px",cursor:"pointer"}}>✏️ {t.modifier}</button>
</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}>
<div><span style={{color:T.txtDim}}>{t.dossiers}:</span> <span style={{fontWeight:600}}>{cr.length}</span></div>
<div><span style={{color:T.txtDim}}>Total:</span> <span style={{fontWeight:600,color:T.orange}}>{fmtM(mtTotal)}</span></div>
<div><span style={{color:T.txtDim}}>{t.recouvre}:</span> <span style={{fontWeight:600,color:T.green}}>{fmtM(mtPaye)}</span></div>
<div><span style={{color:T.txtDim}}>{t.taux}:</span> <span style={{fontWeight:600,color:T.acc}}>{mtTotal?((mtPaye/mtTotal)*100).toFixed(1)+"%":"0%"}</span></div>
</div>
{(c.tel||c.email)&&<div style={{marginTop:8,fontSize:11,color:T.txtDim}}>{c.tel&&<span>📞 {c.tel} </span>}{c.email&&<span>✉️ {c.email}</span>}</div>}
{c.contact_nom&&<div style={{fontSize:11,color:T.txtDim}}>Contact: {c.contact_nom}{c.contact_tel?" — "+c.contact_tel:""}</div>}
</div>})}
</div>
{clients.length===0&&<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:40,textAlign:"center",color:T.txtDim,marginTop:14}}>{t.aucunDossier}</div>}
</div>}

{/* ══ EQUIPE ══ */}
{page==="equipe"&&isMgr&&<div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{fontSize:22,fontWeight:800}}>{t.equipe}</div><button onClick={function(){setShowUF(true)}} style={bs}>+ {lang==="ar"?"إضافة":"Ajouter"}</button></div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>{users.map(function(u){var ar=records.filter(function(r){return r.assigned_to===u.id});return<div key={u.id} style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:18}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div><div style={{fontWeight:700,fontSize:14}}>{u.nom}</div><div style={{fontSize:11,color:T.txtDim}}>{u.username} · {u.role}</div></div>{u.id!==user.id&&<button onClick={function(){deleteUser(u.id)}} style={{background:T.redBg,border:"none",borderRadius:6,color:T.red,fontSize:11,padding:"4px 10px",cursor:"pointer"}}>{t.supprimer}</button>}</div><div style={{fontSize:12,color:T.txtDim}}>{ar.length} {t.dossiers.toLowerCase()} · {fmtM(ar.reduce(function(s,r){return s+(Number(r.montant)||0)},0))}</div></div>})}</div></div>}

{/* ══ HISTORIQUE ══ */}
{page==="historique"&&<div>
<div style={{fontSize:22,fontWeight:800,marginBottom:20}}>{t.historique}</div>
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,overflow:"hidden"}}>{activities.map(function(a,i){return<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 18px",borderBottom:"1px solid "+T.brd+"40",fontSize:12}}><div><span style={{fontWeight:600}}>{a.user_name}</span> — <span style={{color:T.acc}}>{a.action}</span>{a.details?" : "+a.details:""}{a.record_id?<span style={{color:T.txtDim}}> (#{a.record_id})</span>:""}</div><div style={{color:T.txtDim,flexShrink:0,marginLeft:12}}>{fmtDT(a.created_at)}</div></div>})}{activities.length===0&&<div style={{textAlign:"center",padding:40,color:T.txtDim}}>{t.aucuneActivite}</div>}</div></div>}

{/* ══ PARAMETRES ══ */}
{page==="parametres"&&isMgr&&<div>
<div style={{fontSize:22,fontWeight:800,marginBottom:20}}>⚙️ {t.paramSociete}</div>
<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:24,maxWidth:600}}>
{[{k:"nom",l:"Nom de la Société / اسم الشركة"},{k:"adresse",l:"Adresse / العنوان"},{k:"ville",l:"Ville / المدينة"},{k:"code_postal",l:"Code Postal / الرمز البريدي"},{k:"tel",l:"Téléphone / الهاتف"},{k:"email",l:"Email"},{k:"site_web",l:"Site Web"},{k:"rc",l:"RC / السجل التجاري"},{k:"ice",l:"ICE"},{k:"if_fiscal",l:"IF / المعرف الضريبي"},{k:"tp",l:"TP / الضريبة المهنية"},{k:"cnss",l:"CNSS / الصندوق الوطني"}].map(function(f){return<div key={f.k} style={{marginBottom:14}}><label style={dim}>{f.l}</label><input value={societe[f.k]||""} onChange={function(e){var ns=Object.assign({},societe);ns[f.k]=e.target.value;setSociete(ns)}} style={iS}/></div>})}
<button onClick={saveSociete} style={Object.assign({},bs,{width:"100%",padding:14,marginTop:10,fontSize:14})}>💾 {t.sauvegarder}</button>
</div></div>}

</main>

{/* ══ MODALS ══ */}
{showForm&&<Modal onClose={function(){setShowForm(false)}} title={editRec?t.modifier:t.nouvDossier} isRTL={isRTL}>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
{[{k:"type",l:t.type,t:"select",o:TYPES},{k:"nom_debiteur",l:t.debiteur+" *"},{k:"cin_debiteur",l:"CIN"},{k:"rc_debiteur",l:"RC"},{k:"ice_debiteur",l:"ICE"},{k:"tel_debiteur",l:t.telephone||"Téléphone"},{k:"adresse_debiteur",l:t.adresse,s:2},{k:"email_debiteur",l:"Email"},{k:"num_compte",l:"N° Compte"},{k:"num_document",l:"N° Document"},{k:"banque",l:t.banque},{k:"agence_bancaire",l:"Agence"},{k:"montant",l:t.montant+" *",t:"number"},{k:"date_echeance",l:t.echeance,t:"date"},{k:"motif_rejet",l:"Motif Rejet",t:"select",o:[""].concat(MOTIFS)},{k:"priorite",l:t.priorite,t:"select",o:["Normale","Urgente","Critique"]},{k:"nom_client",l:t.client},{k:"ville",l:t.ville},{k:"notes",l:t.notes,t:"textarea",s:2}].map(function(f){return<div key={f.k} style={f.s===2?{gridColumn:"span 2"}:{}}><label style={dim}>{f.l}</label>{f.t==="select"?<select value={form[f.k]} onChange={function(e){var n=Object.assign({},form);n[f.k]=e.target.value;setForm(n)}} style={iS}>{(f.o||[]).map(function(o){return<option key={o}>{o}</option>})}</select>:f.t==="textarea"?<textarea rows={2} value={form[f.k]} onChange={function(e){var n=Object.assign({},form);n[f.k]=e.target.value;setForm(n)}} style={Object.assign({},iS,{resize:"vertical"})}/>:<input type={f.t||"text"} value={form[f.k]} onChange={function(e){var n=Object.assign({},form);n[f.k]=e.target.value;setForm(n)}} style={iS}/>}</div>})}
</div>
<div style={{display:"flex",gap:8,marginTop:16}}><button onClick={function(){setShowForm(false)}} style={Object.assign({},bs,{flex:1,background:T.bgHov,color:T.txtDim})}>{t.annuler}</button><button onClick={editRec?updateRecord:createRecord} style={Object.assign({},bs,{flex:1})}>{editRec?t.modifier:t.creer}</button></div>
</Modal>}

{showRel&&<Modal onClose={function(){setShowRel(false)}} title={t.nouvRelance} isRTL={isRTL}>
<div style={{marginBottom:12}}><label style={dim}>{t.action} *</label><select value={rf.action} onChange={function(e){setRf(Object.assign({},rf,{action:e.target.value}))}} style={iS}><option value="">...</option>{ACTIONS_REL.map(function(a){return<option key={a}>{a}</option>})}</select></div>
<div style={{marginBottom:12}}><label style={dim}>{t.canal}</label><select value={rf.canal} onChange={function(e){setRf(Object.assign({},rf,{canal:e.target.value}))}} style={iS}>{CANAUX.map(function(c){return<option key={c} value={c}>{c}</option>})}</select></div>
<div style={{marginBottom:12}}><label style={dim}>{t.details}</label><textarea rows={3} value={rf.details} onChange={function(e){setRf(Object.assign({},rf,{details:e.target.value}))}} style={Object.assign({},iS,{resize:"vertical"})}/></div>
<div style={{marginBottom:12}}><label style={dim}>{t.prochainRdv}</label><input type="date" value={rf.date_prochain_rdv} onChange={function(e){setRf(Object.assign({},rf,{date_prochain_rdv:e.target.value}))}} style={iS}/></div>
<div style={{display:"flex",gap:8}}><button onClick={function(){setShowRel(false)}} style={Object.assign({},bs,{flex:1,background:T.bgHov,color:T.txtDim})}>{t.annuler}</button><button onClick={doRel} style={Object.assign({},bs,{flex:1})}>{t.enregistrer}</button></div>
</Modal>}

{showPay&&<Modal onClose={function(){setShowPay(false)}} title={t.nouvPaiement} isRTL={isRTL}>
<div style={{marginBottom:12}}><label style={dim}>{t.montantMAD} *</label><input type="number" value={pf.montant} onChange={function(e){setPf(Object.assign({},pf,{montant:e.target.value}))}} style={iS} placeholder="0.00"/></div>
<div style={{marginBottom:12}}><label style={dim}>{t.date} *</label><input type="date" value={pf.date_paiement} onChange={function(e){setPf(Object.assign({},pf,{date_paiement:e.target.value}))}} style={iS}/></div>
<div style={{marginBottom:12}}><label style={dim}>{t.mode} *</label><select value={pf.mode} onChange={function(e){setPf(Object.assign({},pf,{mode:e.target.value}))}} style={iS}>{MODES_PAY.map(function(m){return<option key={m.v} value={m.v}>{m.l}</option>})}</select></div>
<div style={{marginBottom:12}}><label style={dim}>{t.reference}</label><input value={pf.reference_paiement} onChange={function(e){setPf(Object.assign({},pf,{reference_paiement:e.target.value}))}} style={iS}/></div>
<div style={{marginBottom:12}}><label style={dim}>{t.banque}</label><input value={pf.banque} onChange={function(e){setPf(Object.assign({},pf,{banque:e.target.value}))}} style={iS}/></div>
<div style={{marginBottom:12}}><label style={dim}>{t.notes}</label><textarea rows={2} value={pf.notes} onChange={function(e){setPf(Object.assign({},pf,{notes:e.target.value}))}} style={Object.assign({},iS,{resize:"vertical"})}/></div>
<div style={{display:"flex",gap:8}}><button onClick={function(){setShowPay(false)}} style={Object.assign({},bs,{flex:1,background:T.bgHov,color:T.txtDim})}>{t.annuler}</button><button onClick={doPay} style={Object.assign({},bs,{flex:1,background:T.green,color:"#0C0F1A"})}>💰 {t.enregistrer}</button></div>
</Modal>}

{/* DETAIL DOSSIER */}
{showDetail&&<Modal onClose={function(){setShowDetail(null);setRecPay([]);setRecRel([])}} title={t.detailDossier+" "+showDetail.id} width={700} isRTL={isRTL}>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>{[{l:t.type,v:showDetail.type},{l:t.statut,v:showDetail.statut},{l:t.priorite,v:showDetail.priorite},{l:t.debiteur,v:showDetail.nom_debiteur},{l:"CIN",v:showDetail.cin_debiteur},{l:"RC",v:showDetail.rc_debiteur},{l:t.adresse,v:showDetail.adresse_debiteur},{l:t.telephone||"Tél",v:showDetail.tel_debiteur},{l:"N° Compte",v:showDetail.num_compte},{l:"N° Doc",v:showDetail.num_document},{l:t.banque,v:showDetail.banque},{l:t.montant,v:fmtM(showDetail.montant)},{l:t.payeCol,v:fmtM(showDetail.montant_paye)},{l:t.solde,v:fmtM(showDetail.solde_restant)},{l:t.echeance,v:fmtD(showDetail.date_echeance)},{l:t.prescription,v:fmtD(showDetail.date_prescription)},{l:t.client,v:showDetail.nom_client},{l:"Motif",v:showDetail.motif_rejet}].map(function(d,i){return<div key={i}><span style={{fontSize:10,color:T.txtDim}}>{d.l}</span><div style={{fontSize:12,fontWeight:600}}>{d.v||"—"}</div></div>})}</div>

{/* Action buttons */}
<div style={{marginBottom:16,display:"flex",gap:8,flexWrap:"wrap"}} className="no-print">
<button onClick={function(){downloadDoc("mise-en-demeure",showDetail.id)}} style={Object.assign({},bs,{fontSize:11,padding:"6px 12px",background:T.redBg,color:T.red})}>📄 {t.miseEnDemeure}</button>
<button onClick={function(){downloadDoc("protocole",showDetail.id)}} style={Object.assign({},bs,{fontSize:11,padding:"6px 12px",background:T.blueBg,color:T.blue})}>📄 {t.protocole}</button>
<button onClick={function(){downloadDoc("injonction",showDetail.id)}} style={Object.assign({},bs,{fontSize:11,padding:"6px 12px",background:T.purpleBg,color:T.purple})}>📄 {t.injonction}</button>
<button onClick={function(){doAiAnalyze(showDetail.id)}} style={Object.assign({},bs,{fontSize:11,padding:"6px 12px",background:T.accLight,color:T.acc})}>🤖 {t.analyseIA}</button>
{/* FEATURE 2: Print button */}
<button onClick={function(){printDossier(showDetail)}} style={Object.assign({},bs,{fontSize:11,padding:"6px 12px",background:T.bgHov,color:T.txt})}>🖨️ {t.imprimer}</button>
{/* FEATURE 5: SMS/WhatsApp from detail */}
{showDetail.tel_debiteur&&<button onClick={function(){openSMSModal(showDetail,"sms")}} style={Object.assign({},bs,{fontSize:11,padding:"6px 12px",background:T.blueBg,color:T.blue})}>💬 SMS</button>}
{showDetail.tel_debiteur&&<button onClick={function(){openSMSModal(showDetail,"whatsapp")}} style={Object.assign({},bs,{fontSize:11,padding:"6px 12px",background:"#25D36618",color:"#25D366"})}>📱 WhatsApp</button>}
</div>

{aiLoading&&<div style={{padding:"12px",textAlign:"center",color:T.acc,fontSize:12}}>🤖 {t.analyse}...</div>}
{aiResult&&<div style={{background:T.bgHov,border:"1px solid "+T.brd,borderRadius:10,padding:14,marginBottom:16}}>
<div style={{fontSize:13,fontWeight:700,marginBottom:10,color:T.acc}}>🤖 {t.analyseIA}</div>
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

<div style={{marginBottom:12}}><div style={{fontSize:13,fontWeight:700,marginBottom:6,color:T.green}}>💰 {t.paiements} ({recPay.length})</div>{recPay.length>0?recPay.map(function(p,i){return<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",background:T.greenBg,borderRadius:6,marginBottom:4,fontSize:12}}><span style={{color:T.green,fontWeight:700}}>{fmtM(p.montant)}</span><span style={{color:T.txtDim}}>{p.mode}{p.reference_paiement?" · "+p.reference_paiement:""}</span><span style={{color:T.txtDim}}>{fmtD(p.date_paiement)}</span></div>}):<div style={{fontSize:11,color:T.txtDim}}>{t.aucunPaiement}</div>}</div>
<div><div style={{fontSize:13,fontWeight:700,marginBottom:6,color:T.orange}}>📞 Relances ({recRel.length})</div>{recRel.length>0?recRel.map(function(r,i){return<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",background:T.orangeBg,borderRadius:6,marginBottom:4,fontSize:12}}><span style={{color:T.orange,fontWeight:600}}>{r.type_relance||r.canal}</span><span style={{color:T.txtDim}}>{r.notes||""}</span><span style={{color:T.txtDim}}>{fmtD(r.created_at)}</span></div>}):<div style={{fontSize:11,color:T.txtDim}}>{t.aucuneRelance}</div>}</div>
</Modal>}

{showUF&&<Modal onClose={function(){setShowUF(false)}} title={t.nouvelUtilisateur} isRTL={isRTL}>
<div style={{marginBottom:12}}><label style={dim}>{t.username} *</label><input value={uf.username} onChange={function(e){setUf(Object.assign({},uf,{username:e.target.value}))}} style={iS}/></div>
<div style={{marginBottom:12}}><label style={dim}>{t.password} *</label><input type="password" value={uf.password} onChange={function(e){setUf(Object.assign({},uf,{password:e.target.value}))}} style={iS}/></div>
<div style={{marginBottom:12}}><label style={dim}>{t.nom} *</label><input value={uf.nom} onChange={function(e){setUf(Object.assign({},uf,{nom:e.target.value}))}} style={iS}/></div>
<div style={{marginBottom:12}}><label style={dim}>{t.role}</label><select value={uf.role} onChange={function(e){setUf(Object.assign({},uf,{role:e.target.value}))}} style={iS}><option value="agent">Agent</option><option value="client">Client</option><option value="manager">Manager</option></select></div>
<div style={{display:"flex",gap:8}}><button onClick={function(){setShowUF(false)}} style={Object.assign({},bs,{flex:1,background:T.bgHov,color:T.txtDim})}>{t.annuler}</button><button onClick={createUser} style={Object.assign({},bs,{flex:1})}>{t.creer}</button></div>
</Modal>}

{showClientForm&&<Modal onClose={function(){setShowClientForm(false)}} title={editClient?t.modifierClient:t.nouveauClient} isRTL={isRTL}>
{[{k:"nom",l:t.nom+" *"},{k:"ice",l:"ICE"},{k:"rc",l:"RC"},{k:"adresse",l:t.adresse},{k:"ville",l:t.ville},{k:"tel",l:t.telephone||"Téléphone"},{k:"email",l:"Email"},{k:"contact_nom",l:"Contact"},{k:"contact_tel",l:"Tél contact"}].map(function(f){return<div key={f.k} style={{marginBottom:12}}><label style={dim}>{f.l}</label><input value={cf[f.k]} onChange={function(e){var n=Object.assign({},cf);n[f.k]=e.target.value;setCf(n)}} style={iS}/></div>})}
<div style={{display:"flex",gap:8}}><button onClick={function(){setShowClientForm(false)}} style={Object.assign({},bs,{flex:1,background:T.bgHov,color:T.txtDim})}>{t.annuler}</button><button onClick={editClient?updateClient:createClient} style={Object.assign({},bs,{flex:1})}>{editClient?t.modifier:t.creer}</button></div>
</Modal>}

{/* FEATURE 5: MODAL SMS/WHATSAPP */}
{showSMS&&<Modal onClose={function(){setShowSMS(false)}} title={t.smsWhatsapp} isRTL={isRTL}>
<div style={{marginBottom:16,display:"flex",gap:8}}>
  <button onClick={function(){setSmsData(Object.assign({},smsData,{type:"sms"}))}} style={Object.assign({},bs,{flex:1,background:smsData.type==="sms"?T.blue:T.bgHov,color:smsData.type==="sms"?"#fff":T.txtDim})}>💬 SMS</button>
  <button onClick={function(){setSmsData(Object.assign({},smsData,{type:"whatsapp"}))}} style={Object.assign({},bs,{flex:1,background:smsData.type==="whatsapp"?"#25D366":T.bgHov,color:smsData.type==="whatsapp"?"#fff":T.txtDim})}>📱 WhatsApp</button>
</div>
<div style={{marginBottom:12}}><label style={dim}>{t.telephone} *</label><input value={smsData.tel} onChange={function(e){setSmsData(Object.assign({},smsData,{tel:e.target.value}))}} style={iS} placeholder="+212 6xx xxx xxx"/></div>
<div style={{marginBottom:12}}><label style={dim}>{t.messageRelance} *</label><textarea rows={5} value={smsData.message} onChange={function(e){setSmsData(Object.assign({},smsData,{message:e.target.value}))}} style={Object.assign({},iS,{resize:"vertical"})}/></div>
<div style={{fontSize:11,color:T.txtDim,marginBottom:12}}>{smsData.message.length} caractères{smsData.type==="sms"?" · "+Math.ceil(smsData.message.length/160)+" SMS":""}</div>
<div style={{display:"flex",gap:8}}>
  <button onClick={function(){setShowSMS(false)}} style={Object.assign({},bs,{flex:1,background:T.bgHov,color:T.txtDim})}>{t.annuler}</button>
  <button onClick={sendSMS} disabled={smsSending} style={Object.assign({},bs,{flex:1,background:smsData.type==="whatsapp"?"#25D366":T.blue,color:"#fff",opacity:smsSending?0.6:1})}>{smsSending?"...":smsData.type==="whatsapp"?t.envoyerWhatsApp:t.envoyerSMS}</button>
</div>
</Modal>}

<style>{PRINT_CSS+"*{box-sizing:border-box}input:focus,select:focus,textarea:focus{border-color:"+T.acc+"!important;box-shadow:0 0 0 3px "+T.acc+"20}button:hover{opacity:.88}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:"+T.brd+";border-radius:3px}select{appearance:none}select option{background:"+T.bgCard+";color:"+T.txt+"}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}.print-only{display:none}"}</style>
</div>)}

function Modal(props){return<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16}} onClick={props.onClose}><div style={{background:T.bgCard,borderRadius:16,border:"1px solid "+T.brd,padding:26,maxWidth:props.width||520,width:"100%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 25px 60px rgba(0,0,0,.5)",direction:props.isRTL?"rtl":"ltr"}} onClick={function(e){e.stopPropagation()}}>{props.title&&<div style={{fontSize:17,fontWeight:800,color:T.txt,marginBottom:16}}>{props.title}</div>}{props.children}</div></div>}

function ScanPage(props){
var token=props.token,api=props.api,onDone=props.onDone,errH=props.errH,t=props.t||TR.fr;
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
<div style={{fontSize:22,fontWeight:800,marginBottom:20}}>📸 {t.scannerOCR||"Scanner OCR"}</div>
<div style={{display:"flex",alignItems:"center",marginBottom:24}}><span style={stepS(1)}>1</span><span style={{fontSize:12,color:step>=1?T.txt:T.txtDim,marginRight:20}}>Chèque/LCN</span><div style={{width:30,height:2,background:step>=2?T.acc:T.brd,marginRight:10}}></div><span style={stepS(2)}>2</span><span style={{fontSize:12,color:step>=2?T.txt:T.txtDim,marginRight:20}}>Certificat</span><div style={{width:30,height:2,background:step>=3?T.acc:T.brd,marginRight:10}}></div><span style={stepS(3)}>3</span><span style={{fontSize:12,color:step>=3?T.txt:T.txtDim}}>Confirmation</span></div>
{scanErr&&<div style={{background:T.redBg,color:T.red,padding:"10px 14px",borderRadius:8,fontSize:12,marginBottom:12}}>{scanErr}</div>}
{busy&&<div style={{textAlign:"center",padding:40}}><div style={{display:"inline-block",width:32,height:32,border:"3px solid "+T.brd,borderTopColor:T.acc,borderRadius:"50%",animation:"spin 1s linear infinite"}}></div><div style={{color:T.txtDim,fontSize:12,marginTop:8}}>{t.analyse||"Analyse..."}</div></div>}
{step===1&&!busy&&<div style={{background:T.bgCard,border:"2px dashed "+T.brd,borderRadius:16,padding:40,textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>📄</div><div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{t.etape1}</div><div style={{fontSize:12,color:T.txtDim,marginBottom:16}}>{t.photoNette}</div><input ref={f1} type="file" accept="image/*" capture="environment" onChange={scan1} style={{display:"none"}}/><button onClick={function(){f1.current&&f1.current.click()}} style={Object.assign({},bs,{padding:"12px 28px",fontSize:14})}>📸 {t.photo}</button></div>}
{step===2&&!busy&&<div>{d1&&<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:16,marginBottom:16}}><div style={{fontSize:13,fontWeight:700,marginBottom:8,color:T.green}}>✅ {t.chequeScanne}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:12}}>{Object.entries(d1).map(function(e){return<div key={e[0]}><span style={{color:T.txtDim}}>{e[0]}:</span> <span style={{fontWeight:600}}>{String(e[1])}</span></div>})}</div></div>}<div style={{background:T.bgCard,border:"2px dashed "+T.acc,borderRadius:16,padding:40,textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>📋</div><div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{t.etape2}</div><input ref={f2} type="file" accept="image/*" capture="environment" onChange={scan2} style={{display:"none"}}/><button onClick={function(){f2.current&&f2.current.click()}} style={Object.assign({},bs,{padding:"12px 28px",fontSize:14})}>📸 {t.scannerOCR||"Scanner"}</button></div></div>}
{step===3&&!busy&&merged&&<div style={{background:T.bgCard,border:"1px solid "+T.brd,borderRadius:12,padding:20}}><div style={{fontSize:14,fontWeight:700,marginBottom:14,color:T.green}}>✅ {t.etape3}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16,fontSize:12}}>{Object.entries(merged).map(function(e){return<div key={e[0]}><label style={dim}>{e[0]}</label><input value={String(e[1]||"")} onChange={function(ev){var nm=Object.assign({},merged);nm[e[0]]=ev.target.value;setMerged(nm)}} style={iS}/></div>})}<div style={{gridColumn:"span 2"}}><label style={dim}>{t.clientMandant} *</label><input value={client} onChange={function(e){setClient(e.target.value)}} style={iS} placeholder={t.clientMandant}/></div></div><div style={{display:"flex",gap:8}}><button onClick={function(){setStep(1);setD1(null);setD2(null);setMerged(null)}} style={Object.assign({},bs,{flex:1,background:T.bgHov,color:T.txtDim})}>{t.recommencer}</button><button onClick={doCreate} style={Object.assign({},bs,{flex:1})}>✅ {t.creer}</button></div></div>}
</div>)}
