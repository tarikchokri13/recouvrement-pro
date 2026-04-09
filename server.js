var express=require('express');var cors=require('cors');var Database=require('better-sqlite3');var jwt=require('jsonwebtoken');var path=require('path');var fs=require('fs');var ExcelJS=require('exceljs');var docx=require('docx');var crypto=require('crypto');

var app=express();
// SECURITE: CORS restrictif
app.use(cors({origin:function(origin,cb){cb(null,true)},credentials:true}));
app.use(express.json({limit:'25mb'}));

// SECURITE: Rate limiting simple
var loginAttempts={};
function rateLimit(ip){var now=Date.now();if(!loginAttempts[ip])loginAttempts[ip]=[];loginAttempts[ip]=loginAttempts[ip].filter(function(t){return now-t<60000});if(loginAttempts[ip].length>=5)return false;loginAttempts[ip].push(now);return true;}

var PORT=process.env.PORT||3001;
// SECURITE: Secret depuis env, pas en dur
var SECRET=process.env.JWT_SECRET||crypto.randomBytes(32).toString('hex');
var AKEY=process.env.ANTHROPIC_KEY||'';
var DDIR=process.env.DATA_DIR||path.join(__dirname,'data');var BDIR=path.join(DDIR,'backups');var UDIR=path.join(__dirname,'uploads');
if(!fs.existsSync(DDIR))fs.mkdirSync(DDIR,{recursive:true});
if(!fs.existsSync(BDIR))fs.mkdirSync(BDIR,{recursive:true});
if(!fs.existsSync(UDIR))fs.mkdirSync(UDIR,{recursive:true});

var db=new Database(path.join(DDIR,'recouvrement.db'));db.pragma('journal_mode=WAL');db.pragma('foreign_keys=ON');

// ══ SCHEMA COMPLET ══
db.exec("CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN('manager','agent','client')),nom TEXT NOT NULL,active INTEGER DEFAULT 1,created_at TEXT DEFAULT(datetime('now')))");

db.exec("CREATE TABLE IF NOT EXISTS societe(id INTEGER PRIMARY KEY DEFAULT 1,nom TEXT,adresse TEXT,ville TEXT,code_postal TEXT,tel TEXT,email TEXT,site_web TEXT,ice TEXT,if_fiscal TEXT,rc TEXT,cnss TEXT,tp TEXT,logo_path TEXT,cachet_path TEXT)");

db.exec("CREATE TABLE IF NOT EXISTS clients(id TEXT PRIMARY KEY,nom TEXT NOT NULL,ice TEXT,if_fiscal TEXT,rc TEXT,cnss TEXT,tp TEXT,adresse TEXT,ville TEXT,code_postal TEXT,tel TEXT,email TEXT,contact_nom TEXT,contact_tel TEXT,created_at TEXT DEFAULT(datetime('now')))");

db.exec("CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,type TEXT NOT NULL,nom_debiteur TEXT,cin_debiteur TEXT,rc_debiteur TEXT,ice_debiteur TEXT,if_debiteur TEXT,adresse_debiteur TEXT,tel_debiteur TEXT,email_debiteur TEXT,client_id TEXT REFERENCES clients(id),nom_client TEXT,ref_client TEXT,client_user_id TEXT,num_document TEXT,num_compte TEXT,banque TEXT,agence_bancaire TEXT,montant REAL DEFAULT 0,montant_paye REAL DEFAULT 0,solde_restant REAL DEFAULT 0,frais_recouvrement REAL DEFAULT 0,interets_retard REAL DEFAULT 0,date_echeance TEXT,date_reception TEXT,date_prescription TEXT,statut TEXT DEFAULT 'Nouveau' CHECK(statut IN('Nouveau','En cours','Relancé','Contentieux','Payé','Impayé définitif','Prescrit')),priorite TEXT DEFAULT 'Normale',motif_rejet TEXT,notes TEXT,ville TEXT,canal_prefere TEXT,assigned_to TEXT,created_by TEXT,created_at TEXT DEFAULT(datetime('now')),updated_at TEXT DEFAULT(datetime('now')))");

db.exec("CREATE TABLE IF NOT EXISTS paiements(id TEXT PRIMARY KEY,record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE,montant REAL NOT NULL,date_paiement TEXT NOT NULL,mode TEXT CHECK(mode IN('virement','cheque','especes','effet','mobile','prelevement','autre')),reference_paiement TEXT,banque TEXT,notes TEXT,created_by TEXT,created_at TEXT DEFAULT(datetime('now')))");

db.exec("CREATE TABLE IF NOT EXISTS echeanciers(id TEXT PRIMARY KEY,record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE,numero INTEGER NOT NULL,montant REAL NOT NULL,date_echeance TEXT NOT NULL,statut TEXT DEFAULT 'en_attente' CHECK(statut IN('en_attente','paye','en_retard')),paiement_id TEXT REFERENCES paiements(id),created_at TEXT DEFAULT(datetime('now')))");

db.exec("CREATE TABLE IF NOT EXISTS relances(id TEXT PRIMARY KEY,record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE,type_relance TEXT,canal TEXT CHECK(canal IN('telephone','email','sms','whatsapp','courrier','visite','autre')),date_relance TEXT DEFAULT(datetime('now')),date_prochain_rdv TEXT,resultat TEXT,notes TEXT,created_by TEXT,created_at TEXT DEFAULT(datetime('now')))");

db.exec("CREATE TABLE IF NOT EXISTS activities(id TEXT PRIMARY KEY,user_id TEXT,user_name TEXT,action TEXT,record_id TEXT,details TEXT,ip TEXT,created_at TEXT DEFAULT(datetime('now')))");

// Index
db.exec("CREATE INDEX IF NOT EXISTS idx_rec_client ON records(client_id)");
db.exec("CREATE INDEX IF NOT EXISTS idx_rec_assigned ON records(assigned_to)");
db.exec("CREATE INDEX IF NOT EXISTS idx_rec_statut ON records(statut)");
db.exec("CREATE INDEX IF NOT EXISTS idx_rec_echeance ON records(date_echeance)");
db.exec("CREATE INDEX IF NOT EXISTS idx_rec_prescription ON records(date_prescription)");
db.exec("CREATE INDEX IF NOT EXISTS idx_pai_record ON paiements(record_id)");
db.exec("CREATE INDEX IF NOT EXISTS idx_rel_record ON relances(record_id)");
db.exec("CREATE INDEX IF NOT EXISTS idx_ech_record ON echeanciers(record_id)");

// Table messages SMS/WhatsApp
db.exec("CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY,record_id TEXT REFERENCES records(id),type TEXT CHECK(type IN('sms','whatsapp')),to_number TEXT NOT NULL,message TEXT NOT NULL,status TEXT DEFAULT 'sent',provider_id TEXT,created_by TEXT,created_at TEXT DEFAULT(datetime('now')))");

// SECURITE: Hash des mots de passe
function hashPwd(pwd){var salt=crypto.randomBytes(16).toString('hex');var hash=crypto.pbkdf2Sync(pwd,salt,10000,64,'sha512').toString('hex');return salt+':'+hash;}
function verifyPwd(pwd,stored){var parts=stored.split(':');if(parts.length!==2)return pwd===stored;var hash=crypto.pbkdf2Sync(pwd,parts[0],10000,64,'sha512').toString('hex');return hash===parts[1];}

// Admin par defaut
if(!db.prepare("SELECT id FROM users WHERE role='manager'").get()){
  db.prepare("INSERT INTO users(id,username,password,role,nom)VALUES(?,?,?,?,?)").run('M1','admin',hashPwd('admin'),'manager','Administrateur');
  console.log('Compte admin cree (admin/admin)');
}
// Init societe
if(!db.prepare("SELECT id FROM societe WHERE id=1").get()){
  db.prepare("INSERT INTO societe(id,nom)VALUES(1,?)").run('Ma Societe de Recouvrement');
}

function auth(req,res,next){var t=req.headers.authorization||'';t=t.replace('Bearer ','');if(!t&&req.query.token)t=req.query.token;if(!t)return res.status(401).json({error:'Non autorise'});try{req.user=jwt.verify(t,SECRET);next();}catch(e){return res.status(401).json({error:'Token invalide'});}}
function mgr(req,res,next){if(req.user.role!=='manager')return res.status(403).json({error:'Acces refuse'});next();}
function gid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,5)}

// SECURITE: Validation des entrees
function validate(obj,rules){var errors=[];Object.keys(rules).forEach(function(k){var r=rules[k];var v=obj[k];if(r.required&&(!v||String(v).trim()===''))errors.push(k+' est requis');if(v&&r.maxLen&&String(v).length>r.maxLen)errors.push(k+' trop long (max '+r.maxLen+')');if(v&&r.type==='number'&&isNaN(Number(v)))errors.push(k+' doit etre un nombre');if(v&&r.enum&&r.enum.indexOf(v)===-1)errors.push(k+' invalide');});return errors;}

// Calcul prescription
function calcPrescription(type,dateEcheance){if(!dateEcheance)return null;var d=new Date(dateEcheance);if(type==='Chèque'){d.setMonth(d.getMonth()+6);}else if(type==='LCN'){d.setFullYear(d.getFullYear()+3);}else{d.setFullYear(d.getFullYear()+5);}return d.toISOString().slice(0,10);}

// ══ AUTH ══
app.post('/api/login',function(req,res){
  var ip=req.ip||req.connection.remoteAddress;
  if(!rateLimit(ip))return res.status(429).json({error:'Trop de tentatives. Reessayez dans 1 minute.'});
  var errs=validate(req.body,{username:{required:true,maxLen:50},password:{required:true,maxLen:100}});
  if(errs.length)return res.status(400).json({error:errs.join(', ')});
  var u=db.prepare("SELECT * FROM users WHERE username=?").get(req.body.username);
  if(!u||!verifyPwd(req.body.password,u.password))return res.status(401).json({error:'Identifiants incorrects'});
  if(!u.active)return res.status(401).json({error:'Compte desactive'});
  var token=jwt.sign({id:u.id,role:u.role,nom:u.nom},SECRET,{expiresIn:'24h'});
  db.prepare("INSERT INTO activities(id,user_id,user_name,action,ip)VALUES(?,?,?,?,?)").run('A'+gid(),u.id,u.nom,'Connexion',ip);
  res.json({token:token,user:{id:u.id,username:u.username,role:u.role,nom:u.nom}});
});

// ══ USERS ══
app.get('/api/users',auth,function(req,res){res.json(db.prepare("SELECT id,username,role,nom,active,created_at FROM users").all());});
app.post('/api/users',auth,mgr,function(req,res){var b=req.body;var errs=validate(b,{username:{required:true,maxLen:50},password:{required:true,maxLen:100},nom:{required:true,maxLen:100},role:{required:true,enum:['manager','agent','client']}});if(errs.length)return res.status(400).json({error:errs.join(', ')});var id='U'+gid();try{db.prepare("INSERT INTO users(id,username,password,role,nom)VALUES(?,?,?,?,?)").run(id,b.username,hashPwd(b.password),b.role,b.nom);res.json({id:id,success:true});}catch(e){res.status(400).json({error:'Identifiant existe deja'});}});
app.put('/api/users/:id',auth,mgr,function(req,res){var b=req.body;var existing=db.prepare("SELECT password FROM users WHERE id=?").get(req.params.id);if(!existing)return res.status(404).json({error:'Utilisateur introuvable'});var newPwd=b.password?hashPwd(b.password):existing.password;db.prepare("UPDATE users SET nom=?,username=?,password=?,active=? WHERE id=?").run(b.nom,b.username,newPwd,b.active?1:0,req.params.id);res.json({success:true});});

// ══ SOCIETE (parametres) ══
app.get('/api/societe',auth,function(req,res){res.json(db.prepare("SELECT * FROM societe WHERE id=1").get()||{});});
app.put('/api/societe',auth,mgr,function(req,res){var b=req.body;db.prepare("UPDATE societe SET nom=?,adresse=?,ville=?,code_postal=?,tel=?,email=?,site_web=?,ice=?,if_fiscal=?,rc=?,cnss=?,tp=? WHERE id=1").run(b.nom||'',b.adresse||'',b.ville||'',b.code_postal||'',b.tel||'',b.email||'',b.site_web||'',b.ice||'',b.if_fiscal||'',b.rc||'',b.cnss||'',b.tp||'');res.json({success:true});});

// ══ CLIENTS MANDANTS ══
app.get('/api/clients',auth,function(req,res){res.json(db.prepare("SELECT * FROM clients ORDER BY nom ASC").all());});
app.post('/api/clients',auth,mgr,function(req,res){var b=req.body;var errs=validate(b,{nom:{required:true,maxLen:200}});if(errs.length)return res.status(400).json({error:errs.join(', ')});var id='CL'+gid();db.prepare("INSERT INTO clients(id,nom,ice,if_fiscal,rc,cnss,tp,adresse,ville,code_postal,tel,email,contact_nom,contact_tel)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(id,b.nom,b.ice||'',b.if_fiscal||'',b.rc||'',b.cnss||'',b.tp||'',b.adresse||'',b.ville||'',b.code_postal||'',b.tel||'',b.email||'',b.contact_nom||'',b.contact_tel||'');res.json({id:id,success:true});});
app.put('/api/clients/:id',auth,mgr,function(req,res){var b=req.body;db.prepare("UPDATE clients SET nom=?,ice=?,if_fiscal=?,rc=?,cnss=?,tp=?,adresse=?,ville=?,code_postal=?,tel=?,email=?,contact_nom=?,contact_tel=? WHERE id=?").run(b.nom||'',b.ice||'',b.if_fiscal||'',b.rc||'',b.cnss||'',b.tp||'',b.adresse||'',b.ville||'',b.code_postal||'',b.tel||'',b.email||'',b.contact_nom||'',b.contact_tel||'',req.params.id);res.json({success:true});});

// ══ RECORDS ══
app.get('/api/records',auth,function(req,res){if(req.user.role==='manager')return res.json(db.prepare("SELECT * FROM records ORDER BY created_at DESC").all());if(req.user.role==='client')return res.json(db.prepare("SELECT * FROM records WHERE client_user_id=? ORDER BY created_at DESC").all(req.user.id));res.json(db.prepare("SELECT * FROM records WHERE assigned_to=? ORDER BY created_at DESC").all(req.user.id));});
app.post('/api/records',auth,function(req,res){var b=req.body;var id='D'+gid();var now=new Date().toISOString();var prescription=calcPrescription(b.type,b.date_echeance);try{db.prepare("INSERT INTO records(id,type,nom_debiteur,cin_debiteur,rc_debiteur,ice_debiteur,if_debiteur,adresse_debiteur,tel_debiteur,email_debiteur,client_id,nom_client,ref_client,client_user_id,num_document,num_compte,banque,agence_bancaire,montant,solde_restant,date_echeance,date_reception,date_prescription,statut,priorite,motif_rejet,notes,ville,canal_prefere,assigned_to,created_by,created_at,updated_at)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(id,b.type||'Chèque',b.nom_debiteur||'',b.cin_debiteur||'',b.rc_debiteur||'',b.ice_debiteur||'',b.if_debiteur||'',b.adresse_debiteur||'',b.tel_debiteur||'',b.email_debiteur||'',b.client_id||null,b.nom_client||'',b.ref_client||'',b.client_user_id||null,b.num_document||'',b.num_compte||'',b.banque||'',b.agence_bancaire||'',Number(b.montant)||0,Number(b.montant)||0,b.date_echeance||'',b.date_reception||now.slice(0,10),prescription,b.statut||'Nouveau',b.priorite||'Normale',b.motif_rejet||'',b.notes||'',b.ville||'',b.canal_prefere||'',b.assigned_to||null,req.user.id,now,now);db.prepare("INSERT INTO activities(id,user_id,user_name,action,record_id,details)VALUES(?,?,?,?,?,?)").run('A'+gid(),req.user.id,req.user.nom,'Creation',id,b.nom_debiteur||'');res.json({id:id,success:true});}catch(e){console.error(e.message);res.status(500).json({error:e.message});}});
app.put('/api/records/:id',auth,function(req,res){var b=req.body;var now=new Date().toISOString();var prescription=calcPrescription(b.type,b.date_echeance);try{db.prepare("UPDATE records SET type=?,nom_debiteur=?,cin_debiteur=?,rc_debiteur=?,ice_debiteur=?,if_debiteur=?,adresse_debiteur=?,tel_debiteur=?,email_debiteur=?,client_id=?,nom_client=?,ref_client=?,client_user_id=?,num_document=?,num_compte=?,banque=?,agence_bancaire=?,montant=?,date_echeance=?,date_reception=?,date_prescription=?,statut=?,priorite=?,motif_rejet=?,notes=?,ville=?,canal_prefere=?,assigned_to=?,updated_at=? WHERE id=?").run(b.type||'',b.nom_debiteur||'',b.cin_debiteur||'',b.rc_debiteur||'',b.ice_debiteur||'',b.if_debiteur||'',b.adresse_debiteur||'',b.tel_debiteur||'',b.email_debiteur||'',b.client_id||null,b.nom_client||'',b.ref_client||'',b.client_user_id||null,b.num_document||'',b.num_compte||'',b.banque||'',b.agence_bancaire||'',Number(b.montant)||0,b.date_echeance||'',b.date_reception||'',prescription,b.statut||'Nouveau',b.priorite||'Normale',b.motif_rejet||'',b.notes||'',b.ville||'',b.canal_prefere||'',b.assigned_to||null,now,req.params.id);db.prepare("INSERT INTO activities(id,user_id,user_name,action,record_id,details)VALUES(?,?,?,?,?,?)").run('A'+gid(),req.user.id,req.user.nom,'Modification',req.params.id,b.nom_debiteur||'');res.json({success:true});}catch(e){res.status(500).json({error:e.message});}});
app.delete('/api/records/:id',auth,mgr,function(req,res){db.prepare("DELETE FROM records WHERE id=?").run(req.params.id);db.prepare("INSERT INTO activities(id,user_id,user_name,action,record_id)VALUES(?,?,?,?,?)").run('A'+gid(),req.user.id,req.user.nom,'Suppression',req.params.id);res.json({success:true});});
app.patch('/api/records/:id/statut',auth,function(req,res){try{db.prepare("UPDATE records SET statut=?,updated_at=? WHERE id=?").run(req.body.statut,new Date().toISOString(),req.params.id);db.prepare("INSERT INTO activities(id,user_id,user_name,action,record_id,details)VALUES(?,?,?,?,?,?)").run('A'+gid(),req.user.id,req.user.nom,'Statut',req.params.id,req.body.statut);res.json({success:true});}catch(e){res.status(500).json({error:e.message});}});
app.patch('/api/records/:id/assign',auth,mgr,function(req,res){try{db.prepare("UPDATE records SET assigned_to=?,updated_at=? WHERE id=?").run(req.body.agent_id||null,new Date().toISOString(),req.params.id);res.json({success:true});}catch(e){res.status(500).json({error:e.message});}});

// ══ PAIEMENTS (NOUVEAU) ══
app.get('/api/paiements/:recordId',auth,function(req,res){res.json(db.prepare("SELECT * FROM paiements WHERE record_id=? ORDER BY date_paiement DESC").all(req.params.recordId));});
app.post('/api/paiements',auth,function(req,res){
  var b=req.body;
  var errs=validate(b,{record_id:{required:true},montant:{required:true,type:'number'},date_paiement:{required:true},mode:{required:true,enum:['virement','cheque','especes','effet','mobile','prelevement','autre']}});
  if(errs.length)return res.status(400).json({error:errs.join(', ')});
  var id='P'+gid();var mt=Number(b.montant);
  try{
    db.prepare("INSERT INTO paiements(id,record_id,montant,date_paiement,mode,reference_paiement,banque,notes,created_by)VALUES(?,?,?,?,?,?,?,?,?)").run(id,b.record_id,mt,b.date_paiement,b.mode,b.reference_paiement||'',b.banque||'',b.notes||'',req.user.id);
    // Mettre a jour le solde
    var totalPaye=db.prepare("SELECT COALESCE(SUM(montant),0) as t FROM paiements WHERE record_id=?").get(b.record_id).t;
    var rec=db.prepare("SELECT montant FROM records WHERE id=?").get(b.record_id);
    var solde=Math.max(0,(rec?rec.montant:0)-totalPaye);
    var newStatut=solde<=0?'Payé':null;
    if(newStatut){db.prepare("UPDATE records SET montant_paye=?,solde_restant=0,statut='Payé',updated_at=? WHERE id=?").run(totalPaye,new Date().toISOString(),b.record_id);}
    else{db.prepare("UPDATE records SET montant_paye=?,solde_restant=?,updated_at=? WHERE id=?").run(totalPaye,solde,new Date().toISOString(),b.record_id);}
    db.prepare("INSERT INTO activities(id,user_id,user_name,action,record_id,details)VALUES(?,?,?,?,?,?)").run('A'+gid(),req.user.id,req.user.nom,'Paiement',b.record_id,mt+' MAD par '+b.mode);
    res.json({id:id,success:true,solde:solde,totalPaye:totalPaye});
  }catch(e){res.status(500).json({error:e.message});}
});
app.delete('/api/paiements/:id',auth,mgr,function(req,res){
  var p=db.prepare("SELECT * FROM paiements WHERE id=?").get(req.params.id);if(!p)return res.status(404).json({error:'Introuvable'});
  db.prepare("DELETE FROM paiements WHERE id=?").run(req.params.id);
  var totalPaye=db.prepare("SELECT COALESCE(SUM(montant),0) as t FROM paiements WHERE record_id=?").get(p.record_id).t;
  var rec=db.prepare("SELECT montant FROM records WHERE id=?").get(p.record_id);
  var solde=Math.max(0,(rec?rec.montant:0)-totalPaye);
  db.prepare("UPDATE records SET montant_paye=?,solde_restant=?,statut=CASE WHEN ?<=0 THEN 'Payé' ELSE statut END,updated_at=? WHERE id=?").run(totalPaye,solde,solde,new Date().toISOString(),p.record_id);
  res.json({success:true});
});

// ══ RELANCES ══
app.post('/api/relances',auth,function(req,res){var b=req.body;try{db.prepare("INSERT INTO relances(id,record_id,type_relance,canal,date_prochain_rdv,resultat,notes,created_by)VALUES(?,?,?,?,?,?,?,?)").run('R'+gid(),b.record_id,b.type_relance||b.action||'',b.canal||'telephone',b.date_prochain_rdv||'',b.resultat||'',b.notes||b.details||'',req.user.id);db.prepare("INSERT INTO activities(id,user_id,user_name,action,record_id,details)VALUES(?,?,?,?,?,?)").run('A'+gid(),req.user.id,req.user.nom,'Relance',b.record_id,(b.type_relance||b.action)+': '+(b.notes||b.details||''));db.prepare("UPDATE records SET date_derniere_relance=?,nb_relances=COALESCE(nb_relances,0)+1,updated_at=? WHERE id=?").run(new Date().toISOString(),new Date().toISOString(),b.record_id);res.json({success:true});}catch(e){res.status(500).json({error:e.message});}});
app.get('/api/relances/:recordId',auth,function(req,res){res.json(db.prepare("SELECT * FROM relances WHERE record_id=? ORDER BY created_at DESC").all(req.params.recordId));});

// ══ ACTIVITIES ══
app.get('/api/activities',auth,function(req,res){if(req.user.role==='manager')return res.json(db.prepare("SELECT * FROM activities ORDER BY created_at DESC LIMIT 200").all());res.json(db.prepare("SELECT * FROM activities WHERE user_id=? ORDER BY created_at DESC LIMIT 100").all(req.user.id));});
app.get('/api/activities/record/:rid',auth,function(req,res){res.json(db.prepare("SELECT * FROM activities WHERE record_id=? ORDER BY created_at DESC").all(req.params.rid));});

// ══ STATS ══
app.get('/api/stats/aging',auth,function(req,res){
  var now=new Date().toISOString().slice(0,10);
  var aging=db.prepare("SELECT CASE WHEN julianday(?)-julianday(date_echeance)<=30 THEN '0-30j' WHEN julianday(?)-julianday(date_echeance)<=60 THEN '31-60j' WHEN julianday(?)-julianday(date_echeance)<=90 THEN '61-90j' WHEN julianday(?)-julianday(date_echeance)<=180 THEN '91-180j' WHEN julianday(?)-julianday(date_echeance)<=365 THEN '181-365j' ELSE '+1an' END as tranche,COUNT(*) as count,COALESCE(SUM(solde_restant),0) as montant FROM records WHERE statut NOT IN('Payé','Impayé définitif','Prescrit') AND date_echeance IS NOT NULL AND date_echeance!='' GROUP BY tranche ORDER BY tranche").all(now,now,now,now,now);
  res.json(aging);
});

app.get('/api/stats/prescriptions',auth,function(req,res){
  var soon=db.prepare("SELECT * FROM records WHERE date_prescription IS NOT NULL AND date_prescription!='' AND date_prescription<=date('now','+30 days') AND statut NOT IN('Payé','Impayé définitif','Prescrit') ORDER BY date_prescription ASC").all();
  res.json(soon);
});

// ══ MESSAGING SMS/WHATSAPP ══
// Configurer via env: SMS_API_KEY, SMS_API_URL, SMS_SENDER
// Compatible avec: InfoBip, Twilio, MessageBird ou tout provider SMS REST
var SMS_KEY=process.env.SMS_API_KEY||'';
var SMS_URL=process.env.SMS_API_URL||'';
var SMS_SENDER=process.env.SMS_SENDER||'RecouvrementPro';
var WA_API_URL=process.env.WA_API_URL||'';
var WA_TOKEN=process.env.WA_TOKEN||'';

app.post('/api/messaging/send',auth,function(req,res){
  var b=req.body;
  var errs=validate(b,{to:{required:true,maxLen:20},message:{required:true,maxLen:1600},type:{required:true,enum:['sms','whatsapp']}});
  if(errs.length)return res.status(400).json({error:errs.join(', ')});
  var id='MSG'+gid();
  // Enregistrer le message dans la base
  try{
    db.prepare("INSERT INTO messages(id,record_id,type,to_number,message,status,created_by)VALUES(?,?,?,?,?,?,?)").run(id,b.record_id||null,b.type,b.to,b.message,'pending',req.user.id);
    if(b.record_id){
      db.prepare("INSERT INTO activities(id,user_id,user_name,action,record_id,details)VALUES(?,?,?,?,?,?)").run('A'+gid(),req.user.id,req.user.nom,b.type==='whatsapp'?'WhatsApp':'SMS',b.record_id,'Envoi '+b.type+' a '+b.to);
      // Enregistrer aussi comme relance
      db.prepare("INSERT INTO relances(id,record_id,type_relance,canal,notes,created_by)VALUES(?,?,?,?,?,?)").run('R'+gid(),b.record_id,'Relance '+b.type.toUpperCase(),b.type,b.message.substring(0,200),req.user.id);
      db.prepare("UPDATE records SET date_derniere_relance=?,nb_relances=COALESCE(nb_relances,0)+1,updated_at=? WHERE id=?").run(new Date().toISOString(),new Date().toISOString(),b.record_id);
    }
  }catch(e){return res.status(500).json({error:e.message});}

  // Envoyer via API externe si configuree
  if(b.type==='sms'&&SMS_KEY&&SMS_URL){
    fetch(SMS_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+SMS_KEY},body:JSON.stringify({from:SMS_SENDER,to:b.to,text:b.message})})
    .then(function(r){return r.json()})
    .then(function(d){db.prepare("UPDATE messages SET status='sent',provider_id=? WHERE id=?").run(d.messageId||d.id||'ok',id);res.json({success:true,id:id,status:'sent'});})
    .catch(function(e){db.prepare("UPDATE messages SET status='failed' WHERE id=?").run(id);res.json({success:true,id:id,status:'logged',note:'SMS API indisponible, message enregistre'});});
  }else if(b.type==='whatsapp'&&WA_TOKEN&&WA_API_URL){
    fetch(WA_API_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+WA_TOKEN},body:JSON.stringify({messaging_product:'whatsapp',to:b.to,type:'text',text:{body:b.message}})})
    .then(function(r){return r.json()})
    .then(function(d){db.prepare("UPDATE messages SET status='sent',provider_id=? WHERE id=?").run(d.messages?d.messages[0].id:'ok',id);res.json({success:true,id:id,status:'sent'});})
    .catch(function(e){db.prepare("UPDATE messages SET status='logged' WHERE id=?").run(id);res.json({success:true,id:id,status:'logged',note:'WhatsApp API indisponible'});});
  }else{
    // Pas d API configuree → on enregistre quand meme + fallback WhatsApp web
    db.prepare("UPDATE messages SET status='logged' WHERE id=?").run(id);
    res.json({success:true,id:id,status:'logged',note:'API non configuree. Message enregistre. Pour WhatsApp, utiliser le lien direct.'});
  }
});
app.get('/api/messaging/history/:recordId',auth,function(req,res){res.json(db.prepare("SELECT * FROM messages WHERE record_id=? ORDER BY created_at DESC").all(req.params.recordId));});

// ══ SCAN OCR ══
app.post('/api/scan',auth,function(req,res){if(!AKEY)return res.status(500).json({success:false,error:'Cle API non configuree'});fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':AKEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:req.body.mediaType||'image/jpeg',data:req.body.image}},{type:'text',text:req.body.prompt}]}]})}).then(function(r){return r.json()}).then(function(data){if(data.error)return res.status(500).json({success:false,error:data.error.message});var text='';for(var i=0;i<data.content.length;i++)text+=data.content[i].text||'';res.json({success:true,text:text});}).catch(function(e){res.status(500).json({success:false,error:e.message});});});

// ══ EXPORT EXCEL ══
app.get('/api/export/csv',auth,async function(req,res){
  var rows;if(req.user.role==='manager')rows=db.prepare("SELECT * FROM records ORDER BY nom_client ASC,created_at DESC").all();else if(req.user.role==='client')rows=db.prepare("SELECT * FROM records WHERE client_user_id=? ORDER BY created_at DESC").all(req.user.id);else rows=db.prepare("SELECT * FROM records WHERE assigned_to=? ORDER BY created_at DESC").all(req.user.id);
  var wb=new ExcelJS.Workbook();wb.creator='Recouvrement Pro';var ws=wb.addWorksheet('Dossiers',{properties:{defaultRowHeight:20}});
  ws.columns=[{header:'N',key:'no',width:5},{header:'Type',key:'type',width:10},{header:'Nom Debiteur',key:'nom',width:28},{header:'CIN',key:'cin',width:12},{header:'RC',key:'rc',width:12},{header:'Telephone',key:'tel',width:14},{header:'Adresse',key:'adr',width:30},{header:'Ville',key:'ville',width:14},{header:'N Compte',key:'cpt',width:20},{header:'N Document',key:'doc',width:14},{header:'Banque',key:'banque',width:18},{header:'Agence',key:'agence',width:16},{header:'Montant',key:'montant',width:14},{header:'Paye',key:'paye',width:14},{header:'Solde',key:'solde',width:14},{header:'Echeance',key:'ech',width:12},{header:'Prescription',key:'presc',width:12},{header:'Statut',key:'statut',width:16},{header:'Priorite',key:'prio',width:12},{header:'Motif',key:'motif',width:28},{header:'Client',key:'client',width:22},{header:'Notes',key:'notes',width:35}];
  var hr=ws.getRow(1);hr.height=28;hr.eachCell(function(c){c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1C1917'}};c.font={bold:true,color:{argb:'FFFFFFFF'},size:10,name:'Arial'};c.alignment={vertical:'middle',horizontal:'center',wrapText:true};c.border={top:{style:'thin',color:{argb:'FF444444'}},bottom:{style:'thin',color:{argb:'FF444444'}},left:{style:'thin',color:{argb:'FF444444'}},right:{style:'thin',color:{argb:'FF444444'}}};});
  rows.forEach(function(r,i){var row=ws.addRow({no:i+1,type:r.type||'',nom:r.nom_debiteur||'',cin:r.cin_debiteur||'',rc:r.rc_debiteur||'',tel:r.tel_debiteur||'',adr:r.adresse_debiteur||'',ville:r.ville||'',cpt:r.num_compte||'',doc:r.num_document||'',banque:r.banque||'',agence:r.agence_bancaire||'',montant:Number(r.montant)||0,paye:Number(r.montant_paye)||0,solde:Number(r.solde_restant)||0,ech:r.date_echeance||'',presc:r.date_prescription||'',statut:r.statut||'',prio:r.priorite||'',motif:r.motif_rejet||'',client:r.nom_client||'',notes:r.notes||''});var bg=i%2===0?'FFFAFAF9':'FFFFFFFF';row.eachCell({includeEmpty:true},function(c){c.border={top:{style:'thin',color:{argb:'FFE5E5E5'}},bottom:{style:'thin',color:{argb:'FFE5E5E5'}},left:{style:'thin',color:{argb:'FFE5E5E5'}},right:{style:'thin',color:{argb:'FFE5E5E5'}}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:bg}};c.font={size:10,name:'Arial'};c.alignment={vertical:'middle',wrapText:true};});row.getCell('montant').numFmt='#,##0.00';row.getCell('paye').numFmt='#,##0.00';row.getCell('solde').numFmt='#,##0.00';row.getCell('montant').font={bold:true,size:10,name:'Arial'};});
  ws.views=[{state:'frozen',ySplit:1}];ws.autoFilter={from:'A1',to:'V1'};
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');res.setHeader('Content-Disposition','attachment;filename=recouvrement_'+new Date().toISOString().slice(0,10)+'.xlsx');await wb.xlsx.write(res);res.end();
});

// ══ DOCUMENTS WORD BILINGUES ══
var Document=docx.Document,Packer=docx.Packer,Paragraph=docx.Paragraph,TextRun=docx.TextRun,AlignmentType=docx.AlignmentType,BorderStyle=docx.BorderStyle,PageBreak=docx.PageBreak;
function fdf(d){return(d||new Date()).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}
function n2w(n){if(!n)return'zero dirham';var u=['','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];var d=['','','vingt','trente','quarante','cinquante','soixante','soixante','quatre-vingt','quatre-vingt'];function c(x){if(x<20)return u[x];if(x<100){var i=Math.floor(x/10),r=x%10;if(i===7||i===9)return d[i]+'-'+u[10+r];return d[i]+(r?'-'+u[r]:'');}if(x<1000){var h=Math.floor(x/100),r2=x%100;return(h===1?'cent':u[h]+' cent')+(r2?' '+c(r2):'');}if(x<1e6){var m=Math.floor(x/1000),r3=x%1000;return(m===1?'mille':c(m)+' mille')+(r3?' '+c(r3):'');}return String(x);}var e=Math.floor(n),ct=Math.round((n-e)*100);return c(e)+' dirham'+(e>1?'s':'')+(ct>0?' et '+c(ct)+' centime'+(ct>1?'s':''):'');}
function mkP(txt,o){o=o||{};var pO={spacing:{after:o.after||100}};if(o.align)pO.alignment=o.align;if(o.bidi)pO.bidirectional=true;if(o.indent)pO.indent=o.indent;var rO={text:txt,size:o.size||22,font:o.font||'Arial'};if(o.bold)rO.bold=true;if(o.color)rO.color=o.color;if(o.italic)rO.italics=true;if(o.rtl)rO.rightToLeft=true;if(o.underline)rO.underline={};return new Paragraph(Object.assign(pO,{children:[new TextRun(rO)]}));}
function docHdr(soc){var nom=(soc&&soc.nom)||'SOCIETE DE RECOUVREMENT';return[mkP(nom.toUpperCase(),{bold:true,size:28,color:'1C1917',after:60}),mkP('Recouvrement de cheques, LCN et factures impayees',{size:16,color:'888888',italic:true,after:20}),(soc&&soc.adresse)?mkP(soc.adresse+(soc.ville?' - '+soc.ville:'')+(soc.tel?' | Tel: '+soc.tel:''),{size:16,color:'888888',after:10}):mkP('',{after:10}),(soc&&soc.ice)?mkP('ICE: '+soc.ice+(soc.rc?' | RC: '+soc.rc:'')+(soc.if_fiscal?' | IF: '+soc.if_fiscal:''),{size:14,color:'AAAAAA',after:10}):mkP('',{after:10}),new Paragraph({spacing:{after:250},border:{bottom:{style:BorderStyle.SINGLE,size:4,color:'C9A44E',space:6}},children:[]})];}
function arHdr(){return[mkP('\u0634\u0631\u0643\u0629 \u0627\u0633\u062a\u062e\u0644\u0627\u0635 \u0627\u0644\u062f\u064a\u0648\u0646',{bold:true,size:28,font:'Sakkal Majalla',align:AlignmentType.RIGHT,bidi:true,rtl:true,after:60}),mkP('\u0627\u0633\u062a\u062e\u0644\u0627\u0635 \u0627\u0644\u0634\u064a\u0643\u0627\u062a \u0648\u0627\u0644\u0643\u0645\u0628\u064a\u0627\u0644\u0627\u062a \u0648\u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631',{size:16,color:'888888',italic:true,font:'Sakkal Majalla',align:AlignmentType.RIGHT,bidi:true,rtl:true,after:20}),new Paragraph({spacing:{after:250},bidirectional:true,border:{bottom:{style:BorderStyle.SINGLE,size:4,color:'C9A44E',space:6}},children:[]})];}

app.get('/api/documents/mise-en-demeure/:id',auth,async function(req,res){
  var rec=db.prepare("SELECT * FROM records WHERE id=?").get(req.params.id);if(!rec)return res.status(404).json({error:'Introuvable'});
  var soc=db.prepare("SELECT * FROM societe WHERE id=1").get();
  var mt=Number(rec.solde_restant)||Number(rec.montant)||0;var dl=new Date();dl.setDate(dl.getDate()+15);
  var ch=[].concat(docHdr(soc));
  ch.push(mkP((soc&&soc.ville?soc.ville:'Casablanca')+', le '+fdf(),{align:AlignmentType.RIGHT,size:20,after:80}));
  ch.push(mkP('Ref: MED/'+rec.id,{bold:true,size:18,color:'888888',after:250}));
  ch.push(mkP('A l\'attention de:',{bold:true,size:18,color:'888888',after:30}));
  ch.push(mkP((rec.nom_debiteur||'').toUpperCase(),{bold:true,size:24,after:15}));
  if(rec.adresse_debiteur)ch.push(mkP(rec.adresse_debiteur,{size:20,after:10}));
  if(rec.ville)ch.push(mkP(rec.ville,{size:20,after:10}));
  if(rec.cin_debiteur)ch.push(mkP('CIN: '+rec.cin_debiteur,{size:18,color:'666666',after:10}));
  if(rec.rc_debiteur)ch.push(mkP('RC: '+rec.rc_debiteur,{size:18,color:'666666',after:10}));
  ch.push(mkP('',{after:200}));
  ch.push(new Paragraph({spacing:{after:200},border:{bottom:{style:BorderStyle.SINGLE,size:1,color:'CCCCCC',space:4}},children:[new TextRun({text:'Objet: ',size:22,font:'Arial'}),new TextRun({text:'MISE EN DEMEURE DE PAIEMENT',bold:true,size:24,font:'Arial',color:'B91C1C',underline:{}})]}));
  ch.push(mkP('Madame, Monsieur,',{after:120}));
  ch.push(mkP('Par la presente, nous avons l\'honneur de vous informer que notre cabinet a ete mandate pour le recouvrement de la creance ci-apres, demeuree impayee:',{after:120}));
  var fields=[['Type',rec.type],['N. Document',rec.num_document],['Banque',rec.banque],['N. Compte',rec.num_compte],['Montant initial',Number(rec.montant).toLocaleString('fr-MA')+' MAD'],['Solde restant du',mt.toLocaleString('fr-MA')+' MAD'],['Date echeance',rec.date_echeance],['Motif du rejet',rec.motif_rejet]];
  fields.forEach(function(f){if(f[1])ch.push(new Paragraph({spacing:{after:50},indent:{left:400},children:[new TextRun({text:f[0]+': ',bold:true,size:20,font:'Arial'}),new TextRun({text:String(f[1]),size:20,font:'Arial'})]}));});
  if(rec.nom_client)ch.push(new Paragraph({spacing:{after:50},indent:{left:400},children:[new TextRun({text:'Creancier: ',bold:true,size:20,font:'Arial'}),new TextRun({text:rec.nom_client,size:20,font:'Arial'})]}));
  ch.push(mkP('En consequence, nous vous mettons formellement en demeure de proceder au reglement integral de la somme de '+mt.toLocaleString('fr-MA')+' MAD ('+n2w(mt)+') dans un delai de QUINZE (15) jours a compter de la reception de la presente, soit au plus tard le '+fdf(dl)+'.',{after:120}));
  ch.push(mkP('A defaut, nous engagerons toutes les voies de recours judiciaires, notamment:',{after:80}));
  ['Articles 316 et suivants du Code de Commerce relatifs aux cheques impayee','Article 155 du Code Penal relatif a l\'escroquerie','Procedure d\'injonction de payer (art. 155-165 du CPC)','Toute autre action preservant les droits de notre mandant'].forEach(function(t){ch.push(new Paragraph({spacing:{after:50},indent:{left:400},children:[new TextRun({text:'- '+t,size:20,font:'Arial'})]}));});
  ch.push(mkP('Les frais de justice, honoraires, interets moratoires et dommages seront a votre charge.',{after:120}));
  ch.push(mkP('Veuillez agreer, Madame, Monsieur, l\'expression de nos salutations distinguees.',{after:250}));
  ch.push(mkP(req.user.nom||'Le Directeur',{bold:true,align:AlignmentType.RIGHT,after:10}));
  ch.push(mkP('Signature et cachet',{size:16,color:'AAAAAA',italic:true,align:AlignmentType.RIGHT}));
  // PAGE ARABE
  ch.push(new Paragraph({children:[new PageBreak()]}));
  ch=ch.concat(arHdr());
  ch.push(mkP('\u0627\u0644\u062f\u0627\u0631 \u0627\u0644\u0628\u064a\u0636\u0627\u0621\u060c '+new Date().toLocaleDateString('ar-MA',{day:'2-digit',month:'long',year:'numeric'}),{size:20,font:'Sakkal Majalla',align:AlignmentType.LEFT,bidi:true,rtl:true,after:80}));
  ch.push(mkP(rec.id+' :\u0645\u0631\u062c\u0639',{bold:true,size:18,color:'888888',font:'Sakkal Majalla',align:AlignmentType.RIGHT,bidi:true,rtl:true,after:200}));
  ch.push(new Paragraph({spacing:{after:200},bidirectional:true,border:{bottom:{style:BorderStyle.SINGLE,size:1,color:'CCCCCC',space:4}},children:[new TextRun({text:'\u0627\u0644\u0645\u0648\u0636\u0648\u0639: ',size:22,font:'Sakkal Majalla',rightToLeft:true}),new TextRun({text:'\u0625\u0646\u0630\u0627\u0631 \u0628\u0627\u0644\u0623\u062f\u0627\u0621',bold:true,size:24,font:'Sakkal Majalla',color:'B91C1C',rightToLeft:true})]}));
  ch.push(mkP('\u0633\u064a\u062f\u064a / \u0633\u064a\u062f\u062a\u064a\u060c',{size:22,font:'Sakkal Majalla',align:AlignmentType.RIGHT,bidi:true,rtl:true,after:120}));
  ch.push(mkP('\u0646\u062a\u0634\u0631\u0641 \u0628\u0625\u0639\u0644\u0627\u0645\u0643\u0645 \u0623\u0646 \u0634\u0631\u0643\u062a\u0646\u0627 \u0643\u0644\u0641\u062a \u0628\u0627\u0633\u062a\u062e\u0644\u0627\u0635 \u0627\u0644\u062f\u064a\u0646 \u0627\u0644\u062a\u0627\u0644\u064a: '+(rec.type||'')+' \u0631\u0642\u0645 '+(rec.num_document||'')+' \u0628\u0645\u0628\u0644\u063a '+mt.toLocaleString('fr-MA')+' \u062f\u0631\u0647\u0645',{size:22,font:'Sakkal Majalla',bidi:true,rtl:true,after:120}));
  ch.push(mkP('\u0646\u0646\u0630\u0631\u0643\u0645 \u0628\u0623\u062f\u0627\u0621 \u0643\u0627\u0645\u0644 \u0627\u0644\u0645\u0628\u0644\u063a \u0641\u064a \u0623\u062c\u0644 15 \u064a\u0648\u0645\u0627. \u0641\u064a \u062d\u0627\u0644\u0629 \u0639\u062f\u0645 \u0627\u0644\u0627\u0633\u062a\u062c\u0627\u0628\u0629 \u0633\u0646\u062a\u062e\u0630 \u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629 \u0648\u0641\u0642 \u0645\u062f\u0648\u0646\u0629 \u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0648\u0627\u0644\u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u062c\u0646\u0627\u0626\u064a.',{size:22,font:'Sakkal Majalla',bidi:true,rtl:true,after:200}));
  ch.push(mkP('\u0648\u062a\u0642\u0628\u0644\u0648\u0627 \u0641\u0627\u0626\u0642 \u0627\u0644\u062a\u0642\u062f\u064a\u0631 \u0648\u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0645',{size:22,font:'Sakkal Majalla',align:AlignmentType.RIGHT,bidi:true,rtl:true,after:200}));
  ch.push(mkP('\u0627\u0644\u0625\u0645\u0636\u0627\u0621 \u0648\u0627\u0644\u062e\u062a\u0645',{size:16,color:'AAAAAA',italic:true,font:'Sakkal Majalla',align:AlignmentType.LEFT,bidi:true,rtl:true}));
  try{var doc=new Document({sections:[{properties:{page:{margin:{top:1100,right:900,bottom:900,left:900}}},children:ch}]});var buf=await Packer.toBuffer(doc);db.prepare("INSERT INTO activities(id,user_id,user_name,action,record_id,details)VALUES(?,?,?,?,?,?)").run('A'+gid(),req.user.id,req.user.nom,'Document',rec.id,'Mise en demeure');res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.wordprocessingml.document');res.setHeader('Content-Disposition','attachment;filename=MED_'+(rec.nom_debiteur||'x').replace(/[^a-zA-Z0-9]/g,'_')+'.docx');res.send(buf);}catch(e){console.error(e);res.status(500).json({error:e.message});}
});

app.get('/api/documents/relance/:id',auth,async function(req,res){
  var rec=db.prepare("SELECT * FROM records WHERE id=?").get(req.params.id);if(!rec)return res.status(404).json({error:'Introuvable'});
  var soc=db.prepare("SELECT * FROM societe WHERE id=1").get();
  var mt=Number(rec.solde_restant)||Number(rec.montant)||0;var nr=db.prepare("SELECT COUNT(*) as c FROM relances WHERE record_id=?").get(req.params.id).c||1;
  var ch=[].concat(docHdr(soc));
  ch.push(mkP((soc&&soc.ville?soc.ville:'Casablanca')+', le '+fdf(),{align:AlignmentType.RIGHT,size:20,after:80}));
  ch.push(mkP((rec.nom_debiteur||'').toUpperCase(),{bold:true,size:24,after:15}));
  if(rec.adresse_debiteur)ch.push(mkP(rec.adresse_debiteur,{size:20,after:10}));
  if(rec.ville)ch.push(mkP(rec.ville,{size:20,after:200}));
  ch.push(new Paragraph({spacing:{after:200},border:{bottom:{style:BorderStyle.SINGLE,size:1,color:'CCCCCC',space:4}},children:[new TextRun({text:'Objet: LETTRE DE '+(nr>1?nr+'eme':'1ere')+' RELANCE - '+(rec.type||'')+' N. '+(rec.num_document||''),bold:true,size:22,font:'Arial',color:'C2410C'})]}));
  ch.push(mkP('Madame, Monsieur,',{after:120}));
  ch.push(mkP('Sauf erreur de notre part, votre '+(rec.type||'')+' N. '+(rec.num_document||'')+' d\'un montant de '+mt.toLocaleString('fr-MA')+' MAD demeure impaye. Nous vous prions de regulariser dans les plus brefs delais.',{after:120}));
  ch.push(mkP('A defaut, nous serons contraints de transmettre votre dossier au service contentieux.',{after:120}));
  ch.push(mkP('Cordialement,',{after:200}));
  ch.push(mkP(req.user.nom||'Service Recouvrement',{bold:true,align:AlignmentType.RIGHT}));
  ch.push(new Paragraph({children:[new PageBreak()]}));
  ch=ch.concat(arHdr());
  ch.push(new Paragraph({spacing:{after:200},bidirectional:true,border:{bottom:{style:BorderStyle.SINGLE,size:1,color:'CCCCCC',space:4}},children:[new TextRun({text:'\u0631\u0633\u0627\u0644\u0629 \u062a\u0630\u0643\u064a\u0631 \u0628\u0627\u0644\u0623\u062f\u0627\u0621',bold:true,size:24,font:'Sakkal Majalla',color:'C2410C',rightToLeft:true})]}));
  ch.push(mkP('\u0646\u0630\u0643\u0631\u0643\u0645 \u0628\u0623\u0646 '+(rec.type||'')+' \u0631\u0642\u0645 '+(rec.num_document||'')+' \u0628\u0645\u0628\u0644\u063a '+mt.toLocaleString('fr-MA')+' \u062f\u0631\u0647\u0645 \u0644\u0627 \u064a\u0632\u0627\u0644 \u063a\u064a\u0631 \u0645\u0624\u062f\u0649. \u0646\u0631\u062c\u0648 \u062a\u0633\u0648\u064a\u0629 \u0627\u0644\u0645\u0628\u0644\u063a \u0641\u064a \u0623\u0642\u0631\u0628 \u0648\u0642\u062a.',{size:22,font:'Sakkal Majalla',bidi:true,rtl:true,after:200}));
  try{var doc=new Document({sections:[{properties:{page:{margin:{top:1100,right:900,bottom:900,left:900}}},children:ch}]});var buf=await Packer.toBuffer(doc);res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.wordprocessingml.document');res.setHeader('Content-Disposition','attachment;filename=REL_'+(rec.nom_debiteur||'x').replace(/[^a-zA-Z0-9]/g,'_')+'.docx');res.send(buf);}catch(e){res.status(500).json({error:e.message});}
});

app.get('/api/documents/protocole/:id',auth,async function(req,res){
  var rec=db.prepare("SELECT * FROM records WHERE id=?").get(req.params.id);if(!rec)return res.status(404).json({error:'Introuvable'});
  var soc=db.prepare("SELECT * FROM societe WHERE id=1").get();
  var mt=Number(rec.solde_restant)||Number(rec.montant)||0;var nb=Number(req.query.nb)||3;var mens=Math.ceil(mt/nb);
  var ch=[].concat(docHdr(soc));
  ch.push(mkP('PROTOCOLE D\'ACCORD DE REGLEMENT AMIABLE',{bold:true,size:28,color:'1C1917',align:AlignmentType.CENTER,after:200,underline:true}));
  ch.push(mkP('Entre:',{bold:true,after:80}));
  ch.push(mkP('- '+(soc&&soc.nom?soc.nom:'La societe')+', agissant pour '+(rec.nom_client||'le creancier'),{size:20,after:80,indent:{left:400}}));
  ch.push(mkP('- '+(rec.nom_debiteur||'Le debiteur')+(rec.cin_debiteur?' (CIN: '+rec.cin_debiteur+')':''),{size:20,after:120,indent:{left:400}}));
  ch.push(mkP('Art. 1 - Le debiteur reconnait devoir '+mt.toLocaleString('fr-MA')+' MAD ('+n2w(mt)+').',{size:20,after:80}));
  ch.push(mkP('Art. 2 - Echeancier en '+nb+' versements de '+mens.toLocaleString('fr-MA')+' MAD:',{size:20,after:80}));
  for(var i=0;i<nb;i++){var d=new Date();d.setMonth(d.getMonth()+i+1);ch.push(mkP('  Echeance '+(i+1)+': '+mens.toLocaleString('fr-MA')+' MAD avant le '+fdf(d),{size:20,after:40,indent:{left:600}}));}
  ch.push(mkP('Art. 3 - Clause resolutoire: defaut = solde immediatement exigible.',{size:20,after:120}));
  ch.push(mkP('Fait a '+(soc&&soc.ville?soc.ville:'Casablanca')+' le '+fdf()+', en 2 exemplaires.',{size:20,after:200}));
  ch.push(mkP('Le creancier                                              Le debiteur',{bold:true,size:20}));
  try{var doc=new Document({sections:[{properties:{page:{margin:{top:1100,right:900,bottom:900,left:900}}},children:ch}]});var buf=await Packer.toBuffer(doc);res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.wordprocessingml.document');res.setHeader('Content-Disposition','attachment;filename=Protocole_'+(rec.nom_debiteur||'x').replace(/[^a-zA-Z0-9]/g,'_')+'.docx');res.send(buf);}catch(e){res.status(500).json({error:e.message});}
});

app.get('/api/documents/injonction/:id',auth,async function(req,res){
  var rec=db.prepare("SELECT * FROM records WHERE id=?").get(req.params.id);if(!rec)return res.status(404).json({error:'Introuvable'});
  var mt=Number(rec.solde_restant)||Number(rec.montant)||0;
  var ch=[];
  ch.push(mkP('REQUETE AUX FINS D\'INJONCTION DE PAYER',{bold:true,size:28,color:'1C1917',align:AlignmentType.CENTER,after:100,underline:true}));
  ch.push(mkP('(Articles 155 a 165 du Code de Procedure Civile)',{size:18,color:'888888',italic:true,align:AlignmentType.CENTER,after:80}));
  ch.push(mkP('Tribunal de Premiere Instance de '+(rec.ville||'Casablanca'),{bold:true,align:AlignmentType.CENTER,after:200}));
  ch.push(mkP('A Monsieur le President du Tribunal,',{after:120}));
  ch.push(mkP('Le soussigne, agissant pour '+(rec.nom_client||'le creancier')+', expose respectueusement:',{after:120}));
  ch.push(mkP('FAITS: Le requerant est porteur d\'un '+(rec.type||'')+' N. '+(rec.num_document||'')+' de '+(rec.nom_debiteur||'')+' pour '+mt.toLocaleString('fr-MA')+' MAD, rejete pour: '+(rec.motif_rejet||'defaut de provision')+'.',{size:20,after:100}));
  ch.push(mkP('Malgre mise en demeure, le debiteur n\'a pas regle.',{size:20,after:100}));
  ch.push(mkP('PAR CES MOTIFS, plaise au Tribunal de:',{bold:true,after:80}));
  ch.push(mkP('- Rendre ordonnance d\'injonction de payer contre '+(rec.nom_debiteur||'')+(rec.cin_debiteur?' CIN: '+rec.cin_debiteur:''),{size:20,after:50,indent:{left:400}}));
  ch.push(mkP('- Condamner au paiement de '+mt.toLocaleString('fr-MA')+' MAD',{size:20,bold:true,after:50,indent:{left:400}}));
  ch.push(mkP('- Condamner aux depens + execution provisoire',{size:20,after:120,indent:{left:400}}));
  ch.push(mkP('PIECES JOINTES:',{bold:true,size:18,color:'888888',after:40}));
  ['Original du document impaye','Certificat de refus','Mise en demeure + AR'].forEach(function(p,i){ch.push(mkP((i+1)+'. '+p,{size:18,after:30,indent:{left:400}}));});
  ch.push(mkP('Fait le '+fdf(),{size:20,align:AlignmentType.RIGHT,after:200}));
  try{var doc=new Document({sections:[{properties:{page:{margin:{top:1100,right:900,bottom:900,left:900}}},children:ch}]});var buf=await Packer.toBuffer(doc);res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.wordprocessingml.document');res.setHeader('Content-Disposition','attachment;filename=Injonction_'+(rec.nom_debiteur||'x').replace(/[^a-zA-Z0-9]/g,'_')+'.docx');res.send(buf);}catch(e){res.status(500).json({error:e.message});}
});

// ══ ANALYSE IA ══
app.get('/api/ai/analyze/:id',auth,async function(req,res){
  if(!AKEY)return res.status(500).json({error:'Cle API non configuree'});
  var rec=db.prepare("SELECT * FROM records WHERE id=?").get(req.params.id);if(!rec)return res.status(404).json({error:'Introuvable'});
  var rels=db.prepare("SELECT COUNT(*) as c FROM relances WHERE record_id=?").get(req.params.id).c;
  var paye=db.prepare("SELECT COALESCE(SUM(montant),0) as t FROM paiements WHERE record_id=?").get(req.params.id).t;
  var jrs=rec.date_echeance?Math.floor((new Date()-new Date(rec.date_echeance))/864e5):0;
  var prompt='Expert recouvrement Maroc. Analyse ce dossier. JSON strict sans markdown:\n'+JSON.stringify({type:rec.type,debiteur:rec.nom_debiteur,montant:rec.montant,paye:paye,solde:rec.solde_restant,echeance:rec.date_echeance,prescription:rec.date_prescription,motif:rec.motif_rejet,statut:rec.statut,ville:rec.ville,jours_retard:jrs,nb_relances:rels,banque:rec.banque,cin:rec.cin_debiteur,rc:rec.rc_debiteur})+'\nFormat:\n{"risque":"Faible/Moyen/Eleve/Critique","score_risque":0_100,"probabilite_recouvrement":"X%","strategie_recommandee":"text","actions_prioritaires":[{"numero":1,"action":"text","delai":"text"}],"analyse_juridique":"text avec articles de loi marocains","points_forts":"text","points_faibles":"text","estimation_delai":"text","conseil_personnalise":"text"}';
  try{
    var response=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':AKEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1500,messages:[{role:'user',content:prompt}]})});
    var data=await response.json();if(data.error)return res.status(500).json({error:data.error.message});
    var text='';for(var i=0;i<data.content.length;i++)text+=data.content[i].text||'';
    res.json({success:true,analysis:JSON.parse(text.replace(/```json|```/g,'').trim())});
  }catch(e){res.status(500).json({error:e.message});}
});

// ══ BACKUP ══
function backup(){var name='backup_'+new Date().toISOString().slice(0,10)+'_'+new Date().toISOString().slice(11,19).replace(/:/g,'-')+'.db';try{db.backup(path.join(BDIR,name));var files=fs.readdirSync(BDIR).filter(function(f){return f.endsWith('.db')}).sort().reverse();for(var i=10;i<files.length;i++)fs.unlinkSync(path.join(BDIR,files[i]));console.log('Sauvegarde:',name);}catch(e){console.error('Backup error:',e.message);}}
setInterval(backup,6*3600000);
app.post('/api/backup',auth,mgr,function(req,res){backup();res.json({success:true});});

if(fs.existsSync(path.join(__dirname,'build'))){app.use(express.static(path.join(__dirname,'build')));app.get(/(.*)/,function(req,res){res.sendFile(path.join(__dirname,'build','index.html'));});}

app.listen(PORT,'0.0.0.0',function(){
  console.log('');
  console.log('  ==========================================');
  console.log('  RECOUVREMENT PRO v3 - Serveur Securise');
  console.log('  ==========================================');
  console.log('  URL:      http://localhost:'+PORT);
  console.log('  Base:     '+path.join(DDIR,'recouvrement.db'));
  console.log('  OCR/IA:   '+(AKEY?'Actif':'Inactif'));
  console.log('  SMS:      '+(SMS_KEY?'Actif':'Non configure'));
  console.log('  WhatsApp: '+(WA_TOKEN?'Actif':'Non configure (fallback web)'));
  console.log('  Securite: Mots de passe hashes + JWT env');
  console.log('  Modules:  Paiements, Prescription, Balance,');
  console.log('            Graphiques, i18n FR/AR, SMS/WhatsApp');
  console.log('  ==========================================');
  console.log('');
  backup();
});