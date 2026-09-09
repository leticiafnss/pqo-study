const storeKey="pqoStudyV4";
const defaultState={
  profile:null, completed:[],
  flashReviewed:0, flashRatings:{},
  answered:0, correct:0, errors:[],
  moduleFlash:{}, moduleQuestions:{}, lastModule:null, reviewSchedule:{}, studySessions:0,
  meta:{localUpdatedAt:null,cloudSyncedAt:null},
  game:{xp:0,totalGames:0,totalCorrect:0,totalAnswered:0,bestScores:{survival:0,lightning:0,match:0,boss:0},daily:{date:null,played:0},achievements:[],playDates:[],lastPlayedAt:null}
};

function readLocalState(){
  const keys=["pqoStudyV4","pqoStudyV3","pqoStudyV2","pqoStudyState"];
  for(const key of keys){
    try{
      const saved=JSON.parse(localStorage.getItem(key)||"null");
      if(saved) return {...defaultState,...saved};
    }catch(e){}
  }
  return {...defaultState};
}
let state=readLocalState();
state.meta={...defaultState.meta,...(state.meta||{})};
state.game={...defaultState.game,...(state.game||{}),bestScores:{...defaultState.game.bestScores,...(state.game?.bestScores||{})},daily:{...defaultState.game.daily,...(state.game?.daily||{})}};
let currentUser=null, cloudEnabled=false, supabaseClient=null, saveTimer=null, isLoadingCloud=false;
const cfg=window.PQO_CONFIG||{};
cloudEnabled=Boolean(window.supabase && cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY && !cfg.SUPABASE_URL.includes("COLE_AQUI") && !cfg.SUPABASE_PUBLISHABLE_KEY.includes("COLE_AQUI"));
if(cloudEnabled){supabaseClient=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});}
function setSyncStatus(text,mode=""){
  const el=document.querySelector("#sync-status");if(el){el.textContent=text;el.classList.remove("online","syncing");if(mode)el.classList.add(mode)}
  renderNetworkStatus(mode);
}
function renderNetworkStatus(mode=""){
  const pill=document.querySelector("#network-pill");if(!pill)return;
  const online=navigator.onLine;
  pill.classList.remove("offline","syncing");
  if(!online){pill.classList.add("offline");pill.innerHTML="<span>●</span><b>Offline</b>";return}
  if(mode==="syncing"){pill.classList.add("syncing");pill.innerHTML="<span>●</span><b>Sincronizando</b>";return}
  pill.innerHTML="<span>●</span><b>Online</b>";
}
function stateTime(st){return new Date(st?.meta?.localUpdatedAt||0).getTime()||0}
async function loadCloudState(){
  if(!cloudEnabled||!currentUser)return;
  if(!navigator.onLine){setSyncStatus("● offline — salvo neste aparelho");renderAll();return}
  isLoadingCloud=true;setSyncStatus("● sincronizando...","syncing");
  const {data,error}=await supabaseClient.from("study_state").select("state,updated_at").eq("user_id",currentUser.id).maybeSingle();
  if(error){console.error(error);setSyncStatus("● offline — salvo neste aparelho");isLoadingCloud=false;renderAll();return}
  const cloud=data?.state && Object.keys(data.state).length?data.state:null;
  if(cloud){
    cloud.meta={...defaultState.meta,...(cloud.meta||{})};
    cloud.game={...defaultState.game,...(cloud.game||{}),bestScores:{...defaultState.game.bestScores,...(cloud.game?.bestScores||{})},daily:{...defaultState.game.daily,...(cloud.game?.daily||{})}};
    if(stateTime(state)>stateTime(cloud)){
      isLoadingCloud=false;await syncCloudNow();isLoadingCloud=true;
    }else{
      state={...defaultState,...cloud,meta:{...defaultState.meta,...cloud.meta},game:{...defaultState.game,...cloud.game,bestScores:{...defaultState.game.bestScores,...cloud.game.bestScores},daily:{...defaultState.game.daily,...cloud.game.daily}}};
      state.meta.cloudSyncedAt=new Date().toISOString();
      localStorage.setItem(storeKey,JSON.stringify(state));
    }
  }else{
    isLoadingCloud=false;await syncCloudNow();isLoadingCloud=true;
  }
  isLoadingCloud=false;setSyncStatus("● sincronizado","online");renderAll();
}
async function syncCloudNow(){
  if(!cloudEnabled||!currentUser||isLoadingCloud)return;
  if(!navigator.onLine){setSyncStatus("● offline — salvo neste aparelho");return}
  setSyncStatus("● salvando...","syncing");
  const snapshot=JSON.parse(JSON.stringify(state));
  snapshot.meta={...defaultState.meta,...(snapshot.meta||{}),cloudSyncedAt:new Date().toISOString()};
  const {error}=await supabaseClient.from("study_state").upsert({user_id:currentUser.id,state:snapshot,updated_at:new Date().toISOString()},{onConflict:"user_id"});
  if(error){console.error(error);setSyncStatus("● offline — salvo neste aparelho")}
  else{state.meta.cloudSyncedAt=snapshot.meta.cloudSyncedAt;localStorage.setItem(storeKey,JSON.stringify(state));setSyncStatus("● sincronizado","online")}
}
function save(){
  state.meta={...defaultState.meta,...(state.meta||{}),localUpdatedAt:new Date().toISOString()};
  localStorage.setItem(storeKey,JSON.stringify(state));
  clearTimeout(saveTimer);
  if(cloudEnabled&&currentUser&&navigator.onLine)saveTimer=setTimeout(syncCloudNow,350);
  else setSyncStatus("● offline — salvo neste aparelho");
  renderAll();
}
window.addEventListener("offline",()=>setSyncStatus("● offline — salvo neste aparelho"));
window.addEventListener("online",()=>{setSyncStatus("● sincronizando...","syncing");clearTimeout(saveTimer);saveTimer=setTimeout(syncCloudNow,250)});
function showAuthMessage(message,success=false){const el=document.querySelector("#auth-message");el.textContent=message;el.classList.remove("hidden","success");if(success)el.classList.add("success")}
let authMode="login";
function renderAuthMode(){
  const s=authMode==="signup";
  document.querySelector("#auth-title").textContent=s?"Criar conta":"Entrar";
  document.querySelector("#auth-description").textContent=s
    ?"Crie sua conta e tenha um plano de preparação que acompanha sua data de prova, seus estudos, revisões, questões e desempenho."
    :"Sua preparação para a certificação PQO em um só lugar: plano adaptado à data da prova, conteúdo guiado, prática, revisão e evolução acompanhada até o dia da certificação.";
  document.querySelector("#auth-name-wrap").classList.toggle("hidden",!s);
  document.querySelector("#auth-submit").textContent=s?"Criar conta":"Entrar";
  document.querySelector("#auth-toggle").textContent=s?"Já tenho uma conta":"Ainda não tenho conta";
  document.querySelector("#auth-message").classList.add("hidden");
}
async function initAuth(){const overlay=document.querySelector("#auth-overlay");if(!cloudEnabled){setSyncStatus(navigator.onLine?"● modo local":"● offline — salvo neste aparelho");overlay.classList.add("hidden");return}const {data:{session}}=await supabaseClient.auth.getSession();currentUser=session?.user||null;if(currentUser){overlay.classList.add("hidden");await loadCloudState()}else{overlay.classList.remove("hidden");setSyncStatus("● desconectado")}supabaseClient.auth.onAuthStateChange(async(event,session)=>{currentUser=session?.user||null;if(event==="SIGNED_IN"&&currentUser){overlay.classList.add("hidden");await loadCloudState()}if(event==="SIGNED_OUT"){currentUser=null;setSyncStatus("● desconectado");overlay.classList.remove("hidden")}});document.querySelector("#auth-toggle").onclick=()=>{authMode=authMode==="login"?"signup":"login";renderAuthMode()};document.querySelector("#auth-submit").onclick=async()=>{const email=document.querySelector("#auth-email").value.trim(),password=document.querySelector("#auth-password").value,name=document.querySelector("#auth-name").value.trim();if(!email||!password){showAuthMessage("Preencha e-mail e senha.");return}if(password.length<6){showAuthMessage("Use uma senha com pelo menos 6 caracteres.");return}if(authMode==="signup"){if(!name){showAuthMessage("Preencha seu nome.");return}const {data,error}=await supabaseClient.auth.signUp({email,password,options:{data:{name}}});if(error)showAuthMessage("Não foi possível criar a conta: "+error.message);else showAuthMessage(data.session?"Conta criada e conectada.":"Conta criada. Confira seu e-mail para confirmar o cadastro e depois faça login.",true)}else{const {error}=await supabaseClient.auth.signInWithPassword({email,password});if(error)showAuthMessage("Não foi possível entrar. Confira e-mail e senha.")}};document.querySelector("#logout-btn").onclick=async()=>{await supabaseClient.auth.signOut()};}

let currentModule=null, flashIndex=0, qIndex=0, currentFlash=[...FLASHCARDS], currentQ=[...QUESTIONS];

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmtDate=d=>new Intl.DateTimeFormat("pt-BR").format(d);

function openProfile(){
  $("#onboarding").classList.remove("hidden");
  if(state.profile){
    $("#profile-name").value=state.profile.name||"";
    $("#profile-email").value=state.profile.email||"";
    $("#profile-exam").value=state.profile.exam||"";
  }
}
function initProfile(){
  if(!state.profile && (!cloudEnabled || currentUser)) openProfile();
  $("#save-profile").onclick=()=>{
    const name=$("#profile-name").value.trim(),email=$("#profile-email").value.trim(),exam=$("#profile-exam").value;
    if(!name||!email||!exam){alert("Preencha nome, e-mail e data da prova.");return}
    state.profile={name,email:currentUser?.email||email,exam};save();$("#onboarding").classList.add("hidden");
  };
  $("#edit-profile").onclick=openProfile;
}

function go(view){
  $$(".view").forEach(v=>v.classList.remove("active"));
  $$(".nav").forEach(n=>n.classList.remove("active"));
  $("#"+view).classList.add("active");
  const nav=$(`.nav[data-view="${view}"]`);if(nav)nav.classList.add("active");
  const titles={dashboard:"Visão geral",trilha:"Trilha completa",plano:"Meu plano",flashcards:"Flashcards",questoes:"Questões",jogar:"PQO Arena",erros:"Caderno de erros",fontes:"Fontes oficiais"};
  $("#page-title").textContent=titles[view]||"PQO Study";
}
$$(".nav").forEach(n=>n.onclick=()=>go(n.dataset.view));
$$("[data-jump]").forEach(n=>n.onclick=()=>go(n.dataset.jump));

function daysLeft(){
  if(!state.profile?.exam)return null;
  const end=new Date(state.profile.exam+"T23:59:59"), now=new Date();
  return Math.max(0,Math.ceil((end-now)/86400000));
}
function orderedModules(){
  const rank={P0:0,P1:1,P2:2,P3:3};
  return [...MODULES].sort((a,b)=>rank[a.priority]-rank[b.priority]||a.order-b.order);
}
function makePlan(){
  const days=daysLeft();
  if(days===null)return [];
  const totalWeeks=Math.max(1,Math.ceil(days/7));
  const reviewWeeks=totalWeeks>=6?Math.max(1,Math.ceil(totalWeeks*.2)):1;
  const studyWeeks=Math.max(1,totalWeeks-reviewWeeks);
  const mods=orderedModules();
  const weeks=Array.from({length:totalWeeks},(_,i)=>({week:i+1,type:i<studyWeeks?"Estudo":"Revisão",modules:[]}));
  mods.forEach((m,i)=>weeks[i%studyWeeks].modules.push(m));
  for(let i=studyWeeks;i<totalWeeks;i++){
    weeks[i].modules=orderedModules().filter(m=>["P0","P1"].includes(m.priority));
  }
  return weeks;
}


function reviewInterval(rate){return rate==="Dificil"?1:rate==="Medio"?3:7}
function scheduleReview(key,rate){
  const due=new Date(); due.setDate(due.getDate()+reviewInterval(rate));
  state.reviewSchedule[key]={rate,due:due.toISOString(),updatedAt:new Date().toISOString()};
}
function dueReviews(){
  const now=Date.now();
  return Object.entries(state.reviewSchedule||{}).filter(([,v])=>new Date(v.due).getTime()<=now);
}
function moduleAccuracy(id){
  const qp=state.moduleQuestions?.[id], qs=moduleQs(id); if(!qp)return null;
  const entries=Object.entries(qp.answers||{}); if(!entries.length)return null;
  const ok=entries.filter(([i,a])=>qs[+i]&&qs[+i].correct===a).length;
  return Math.round(ok/entries.length*100);
}
function priorityStats(priority){
  const mods=MODULES.filter(m=>m.priority===priority); const vals=mods.map(m=>moduleAccuracy(m.id)).filter(v=>v!==null);
  const done=mods.filter(m=>state.completed.includes(m.id)).length;
  return {accuracy:vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0,done,total:mods.length,hasData:vals.length>0};
}
function renderAnalytics(){
  const pp=$("#priority-performance"); if(pp) pp.innerHTML=["P0","P1","P2","P3"].map(p=>{const s=priorityStats(p);const score=s.hasData?s.accuracy:0;return `<div class="perf-row"><div><strong>${p}</strong><small>${s.done}/${s.total} módulos • ${s.hasData?score+"% nas questões":"sem questões ainda"}</small></div><div class="bar"><i style="width:${score}%"></i></div></div>`}).join("");
  const sr=$("#smart-review"); if(sr){
    const due=dueReviews(); const difficult=Object.entries(state.flashRatings||{}).filter(([,v])=>v==="Dificil").length;
    const err=(state.errors||[]).length;
    sr.innerHTML=`<div class="review-summary"><strong>${due.length}</strong><span>revisões vencidas hoje</span></div><p class="muted">${difficult} flashcard(s) difícil(eis) • ${err} erro(s) registrado(s)</p>${due.length?'<button class="secondary" id="review-now">Revisar agora</button>':'<p class="good-note">✓ Você está em dia com a repetição espaçada.</p>'}`;
    const b=$("#review-now"); if(b)b.onclick=()=>go("flashcards");
  }
}
function renderDashboard(){
  const done=state.completed.length,pct=Math.round(done/MODULES.length*100),days=daysLeft();
  $("#progress-pct").textContent=pct+"%";
  $("#progress-ring").style.background=`conic-gradient(var(--accent) ${pct}%,#e5e7eb ${pct}%)`;
  $("#modules-done").textContent=`${done}/${MODULES.length}`;
  $("#days-left").textContent=days??"—";
  const pace=days===null?"Defina sua data":days<14?"Plano intensivo":days<35?"Ritmo acelerado":"Ritmo equilibrado";
  $("#pace-label").textContent=pace;
  $("#question-score").textContent=(state.answered?Math.round(state.correct/state.answered*100):0)+"%";
  $("#question-total").textContent=`${state.answered} respondidas`;
  $("#reviews-due").textContent=dueReviews().length;
  if(state.profile){
    $("#hello").textContent=`OLÁ, ${state.profile.name.toUpperCase()}`;
    $("#exam-date-label").textContent=fmtDate(new Date(state.profile.exam+"T12:00:00"));
  }
  const last=state.lastModule?MODULES.find(m=>m.id===state.lastModule):null;
  const next=(last && !state.completed.includes(last.id))?last:(orderedModules().find(m=>!state.completed.includes(m.id))||orderedModules()[0]);
  $("#hero-title").textContent=done===MODULES.length?"Trilha concluída — hora da revisão final":`Próximo: ${next.name}`;
  $("#hero-subtitle").textContent=next.reviewFocus;
  $("#continue-btn").onclick=()=>openModule(next.id);
  const plan=makePlan(), first=plan[0];
  $("#today-plan").innerHTML= first ? `
    <div class="task"><span class="n">1</span><div><strong>${first.type}: ${first.modules[0]?.name||"Revisão geral"}</strong><p>Comece pelo primeiro item da semana atual.</p></div></div>
    <div class="task"><span class="n">2</span><div><strong>Flashcards</strong><p>Faça pelo menos 10 cartões e marque os difíceis.</p></div></div>
    <div class="task"><span class="n">3</span><div><strong>Questões</strong><p>Finalize com questões e revise seus erros.</p></div></div>`:
    `<p class="muted">Defina a data da prova para gerar seu plano.</p>`;
}

function renderModules(filter="Todos"){
  const list=MODULES.filter(m=>filter==="Todos"||m.priority===filter);
  $("#module-list").innerHTML=list.map(m=>{
    const done=state.completed.includes(m.id);
    return `<article class="module-card" data-id="${m.id}">
      <div class="module-number">${String(m.order).padStart(2,"0")}</div>
      <div><p class="eyebrow">${m.titleCode} • CAP. ${m.chapterCode} • ${m.priority}</p><h3>${m.name}</h3><p>${m.area} — ${m.reviewFocus}</p></div>
      <div class="status ${done?"done":""}">${done?"✓ Concluído":"Abrir módulo →"}</div>
    </article>`;
  }).join("");
  $$(".module-card").forEach(c=>c.onclick=()=>openModule(c.dataset.id));
}
$$(".filter").forEach(b=>b.onclick=()=>{$$(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderModules(b.dataset.priority)});


function moduleCards(id){ return FLASHCARDS.filter(c=>c.moduleId===id).slice(0,8); }
function moduleQs(id){ return QUESTIONS.filter(q=>q.moduleId===id).slice(0,6); }

function ensureModuleProgress(id){
  if(!state.moduleFlash[id]) state.moduleFlash[id]={index:0,seen:{},ratings:{}};
  if(!state.moduleQuestions[id]) state.moduleQuestions[id]={index:0,answers:{},correct:0,answered:0};
}

function renderModuleFlash(){
  if(!currentModule)return;
  const id=currentModule.id;
  ensureModuleProgress(id);
  const cards=moduleCards(id), mp=state.moduleFlash[id];
  const idx=Math.min(mp.index||0, Math.max(0,cards.length-1));
  const card=cards[idx];
  const area=$("#module-flash-area");
  if(!card){area.innerHTML="<p class='muted'>Nenhum flashcard disponível.</p>";return}
  const reviewed=Object.keys(mp.seen||{}).length;
  $("#module-flash-progress").innerHTML=`<strong>${reviewed}/${cards.length}</strong> cartões revisados`;
  area.innerHTML=`
    <div class="inline-flash">
      <small>${idx+1} de ${cards.length}</small>
      <h4>${card.question}</h4>
      <div class="inline-answer hidden" id="inline-answer">${card.answer}</div>
      <button class="secondary" id="inline-reveal">Mostrar resposta</button>
      <div class="inline-rates hidden" id="inline-rates">
        <button class="rate" data-module-rate="Dificil">Difícil</button>
        <button class="rate" data-module-rate="Medio">Médio</button>
        <button class="rate" data-module-rate="Facil">Fácil</button>
      </div>
    </div>`;
  $("#inline-reveal").onclick=()=>{
    $("#inline-answer").classList.remove("hidden");
    $("#inline-rates").classList.remove("hidden");
    $("#inline-reveal").classList.add("hidden");
  };
  $$("[data-module-rate]").forEach(btn=>btn.onclick=()=>{
    mp.seen[card.question]=true;
    mp.ratings[card.question]=btn.dataset.moduleRate;
    state.flashRatings[card.question]=btn.dataset.moduleRate;
    scheduleReview(card.question,btn.dataset.moduleRate);
    state.flashReviewed++;
    mp.index=(idx+1)%cards.length;
    save();
    renderModuleFlash();
    renderModuleResult();
  });
}

function renderModuleQuestion(){
  if(!currentModule)return;
  const id=currentModule.id;
  ensureModuleProgress(id);
  const qs=moduleQs(id), qp=state.moduleQuestions[id];
  const unansweredIndex=qs.findIndex((q,i)=>qp.answers[i]===undefined);
  const idx=unansweredIndex>=0?unansweredIndex:Math.min(qp.index||0,Math.max(0,qs.length-1));
  const q=qs[idx];
  const area=$("#module-question-area");
  if(!q){area.innerHTML="<p class='muted'>Nenhuma questão disponível.</p>";return}
  const answered=Object.keys(qp.answers||{}).length;
  $("#module-q-progress").innerHTML=`<strong>${answered}/${qs.length}</strong> questões respondidas`;
  const previous=qp.answers[idx];
  area.innerHTML=`
    <div class="inline-question">
      <small>Questão ${idx+1} de ${qs.length}</small>
      <h4>${q.question}</h4>
      <div class="inline-options">
        ${q.options.map((o,i)=>`<button class="option module-option ${previous!==undefined?(i===q.correct?"correct":(i===previous&&previous!==q.correct?"wrong":"")):""}" data-module-option="${i}" ${previous!==undefined?"disabled":""}>${String.fromCharCode(65+i)}. ${o}</button>`).join("")}
      </div>
      <div class="feedback ${previous===undefined?"hidden":""}" id="module-feedback">
        ${previous===undefined?"":(previous===q.correct?"<strong>✓ Correto.</strong><br>":"<strong>✕ Revise este ponto.</strong><br>")+q.explanation}
      </div>
      ${previous!==undefined?`<button class="secondary" id="module-next-q">Próxima questão</button>`:""}
    </div>`;
  if(previous===undefined){
    $$("[data-module-option]").forEach(btn=>btn.onclick=()=>{
      const chosen=+btn.dataset.moduleOption;
      qp.answers[idx]=chosen;
      qp.answered++;
      state.answered++;
      if(chosen===q.correct){qp.correct++;state.correct++}
      else state.errors.unshift({topic:q.topic,question:q.question,selected:q.options[chosen],correct:q.options[q.correct],explanation:q.explanation,date:new Date().toLocaleDateString("pt-BR")});
      qp.index=(idx+1)%qs.length;
      save();
      renderModuleQuestion();
      renderModuleResult();
    });
  }else if($("#module-next-q")){
    $("#module-next-q").onclick=()=>{
      qp.index=(idx+1)%qs.length;
      // allow navigating existing questions; if all answered, cycle.
      const next=(idx+1)%qs.length;
      const saved=qp.answers[next];
      // Temporarily render chosen index by setting index; render uses first unanswered if any.
      qp.index=next;
      renderModuleQuestion();
    };
  }
}

function renderModuleResult(){
  if(!currentModule)return;
  const id=currentModule.id;
  ensureModuleProgress(id);
  const cards=moduleCards(id), qs=moduleQs(id);
  const fp=state.moduleFlash[id], qp=state.moduleQuestions[id];
  const reviewed=Object.keys(fp.seen||{}).length;
  const difficult=Object.values(fp.ratings||{}).filter(v=>v==="Dificil").length;
  const answered=Object.keys(qp.answers||{}).length;
  const correct=Object.entries(qp.answers||{}).filter(([i,a])=>qs[+i] && qs[+i].correct===a).length;
  const acc=answered?Math.round(correct/answered*100):0;
  let diagnosis="Comece pelos flashcards e questões para gerar seu diagnóstico.";
  if(answered>=3 || reviewed>=4){
    if(acc>=80 && difficult<=1) diagnosis="Muito bom. Você demonstra domínio consistente deste módulo.";
    else if(acc>=60) diagnosis="Bom caminho. Revise os cartões difíceis e as questões erradas antes de concluir.";
    else diagnosis="Este módulo precisa de reforço. Releia o resumo, revise os pontos-chave e refaça a prática.";
  }
  $("#module-result").innerHTML=`
    <div class="module-result-grid">
      <div><span>Flashcards</span><strong>${reviewed}/${cards.length}</strong><small>${difficult} difícil(eis)</small></div>
      <div><span>Questões</span><strong>${correct}/${answered||0}</strong><small>${acc}% de acerto</small></div>
    </div>
    <p class="diagnosis">${diagnosis}</p>`;
}

function openModule(id){
  const m=MODULES.find(x=>x.id===id);currentModule=m;
  $("#modal-code").textContent=`${m.titleCode} • Capítulo ${m.chapterCode} • ${m.area}`;
  $("#modal-title").textContent=m.name;
  $("#modal-priority").textContent=m.priority==="P0"?"P0 — Núcleo de Compliance":`${m.priority} — Prioridade de estudo`;
  $("#modal-summary").textContent=m.summary||"";
  $("#modal-keypoints").innerHTML=(m.keyPoints||[]).map(t=>`<li>${t}</li>`).join("");
  $("#modal-topics").innerHTML=m.topics.map(t=>`<li>${t}</li>`).join("");
  $("#modal-method").textContent=m.studyMethod;
  $("#modal-review").textContent=m.reviewFocus;
  $("#modal-source").textContent=m.source;
  $("#modal-links").innerHTML=(m.sources||[]).map(s=>`
    <a class="source-link-btn" href="${s.url}" target="_blank" rel="noopener">
      <span><strong>${s.name}</strong><small>${s.note||""}</small></span>
      <b>↗</b>
    </a>`).join("");
  state.lastModule=id;
  localStorage.setItem(storeKey,JSON.stringify(state));
  $("#toggle-module").textContent=state.completed.includes(id)?"Marcar como não concluído":"Marcar como concluído";
  $("#module-modal").classList.remove("hidden");
  renderModuleFlash();
  renderModuleQuestion();
  renderModuleResult();
}
$("#close-module").onclick=()=>$("#module-modal").classList.add("hidden");
$("#toggle-module").onclick=()=>{
  if(!currentModule)return;
  const id=currentModule.id;
  if(state.completed.includes(id))state.completed=state.completed.filter(x=>x!==id);else state.completed.push(id);
  save();openModule(id);renderModuleResult();
};

function renderPlan(){
  const days=daysLeft(), plan=makePlan();
  if(days===null){$("#planner-summary").innerHTML="<p>Defina a data da prova para gerar o cronograma.</p>";$("#weekly-plan").innerHTML="";return}
  const weeks=plan.length, intensity=days<14?"intensivo":days<35?"acelerado":"equilibrado";
  const totalPlanModules=MODULES.length;
  const doneTotal=MODULES.filter(m=>state.completed.includes(m.id)).length;
  const pct=Math.round(doneTotal/totalPlanModules*100);
  const currentWeekIndex=Math.max(0,plan.findIndex(w=>w.modules.some(m=>!state.completed.includes(m.id))));
  $("#planner-summary").innerHTML=`
    <p class="eyebrow">PLANO ${intensity.toUpperCase()}</p>
    <div class="planner-title-row"><div><h2>${days} dias • ${weeks} semana(s)</h2><p class="muted">Os módulos são priorizados em P0 → P1 → P2 → P3. A reta final é reservada para revisão, caderno de erros e simulados.</p></div><strong class="plan-pct">${pct}%</strong></div>
    <div class="plan-progress"><i style="width:${pct}%"></i></div>
    <small class="muted">Seu avanço no plano: ${doneTotal}/${totalPlanModules} módulos concluídos.</small>`;

  $("#weekly-plan").innerHTML=plan.map((w,idx)=>{
    const done=w.modules.filter(m=>state.completed.includes(m.id)).length;
    const total=w.modules.length;
    const weekPct=total?Math.round(done/total*100):0;
    const isCurrent=idx===currentWeekIndex && done<total;
    const isDone=total>0 && done===total;
    const open=isCurrent || (idx===0 && done===0);
    return `<article class="week-card ${isCurrent?"current-week":""} ${isDone?"week-done":""}">
      <button class="week-toggle" type="button" data-week-toggle="${w.week}" aria-expanded="${open}">
        <div class="week-toggle-main">
          <div><p class="eyebrow">SEMANA ${w.week}${isCurrent?" • SEMANA ATUAL":""}</p><h3>${w.type==="Estudo"?"Conteúdo + prática":"Revisão + simulados"}</h3></div>
          <div class="week-status"><strong>${done}/${total}</strong><span>${isDone?"✓ Concluída":"módulos"}</span><b class="week-chevron">⌄</b></div>
        </div>
        <p class="muted">${w.type==="Estudo"?"Abra a semana e avance pelos módulos na ordem do seu plano.":"Revise os módulos prioritários, seus erros e faça simulados."}</p>
        <div class="week-progress"><i style="width:${weekPct}%"></i></div>
      </button>
      <div class="week-detail ${open?"":"hidden"}" data-week-detail="${w.week}">
        <div class="week-guidance">
          <strong>${w.type==="Estudo"?"Como avançar nesta semana":"Foco desta semana"}</strong>
          <p>${w.type==="Estudo"?"Entre em cada módulo, leia o resumo e os pontos-chave, estude o conteúdo a dominar, faça os flashcards e finalize com as questões. Marque o módulo como concluído quando terminar.":"Volte aos resumos dos módulos abaixo, priorize erros e flashcards difíceis e use questões e Arena para consolidar o conteúdo."}</p>
        </div>
        <div class="plan-module-list">
          ${w.modules.map(m=>{const mdone=state.completed.includes(m.id);return `<button class="plan-module-row" type="button" data-plan-module="${m.id}">
            <span class="plan-module-order">${String(m.order).padStart(2,"0")}</span>
            <span class="plan-module-copy"><small>${m.priority} • ${m.area}</small><strong>${m.name}</strong><em>${m.reviewFocus}</em></span>
            <span class="plan-module-action ${mdone?"done":""}">${mdone?"✓ Concluído":"Estudar →"}</span>
          </button>`}).join("")}
        </div>
      </div>
    </article>`
  }).join("");

  $$('[data-week-toggle]').forEach(btn=>btn.onclick=()=>{
    const detail=document.querySelector(`[data-week-detail="${btn.dataset.weekToggle}"]`);
    const expanded=btn.getAttribute("aria-expanded")==="true";
    btn.setAttribute("aria-expanded",String(!expanded));
    detail.classList.toggle("hidden",expanded);
  });
  $$('[data-plan-module]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();openModule(btn.dataset.planModule)});
}

function topics(items,key){return ["Todos",...new Set(items.map(x=>x[key]))]}
function setupFlash(){
  $("#flash-filter").innerHTML=topics(FLASHCARDS,"topic").map(t=>`<option>${t}</option>`).join("");
  $("#flash-filter").onchange=()=>{currentFlash=$("#flash-filter").value==="Todos"?[...FLASHCARDS]:FLASHCARDS.filter(x=>x.topic===$("#flash-filter").value);flashIndex=0;renderFlash()};
  $("#reveal").onclick=()=>$("#flash-answer").classList.remove("hidden");
  $$(".rate").forEach(b=>b.onclick=()=>{const key=currentFlash[flashIndex]?.question;if(key){state.flashRatings[key]=b.dataset.rate;scheduleReview(key,b.dataset.rate)}state.flashReviewed++;save();flashIndex=(flashIndex+1)%currentFlash.length;renderFlash()});
  renderFlash();
}
function renderFlash(){
  const f=currentFlash[flashIndex];if(!f)return;
  $("#flash-topic").textContent=f.topic;$("#flash-question").textContent=f.question;$("#flash-answer").textContent=f.answer;$("#flash-answer").classList.add("hidden");$("#flash-counter").textContent=`${flashIndex+1} / ${currentFlash.length}`;
}

function setupQ(){
  $("#question-filter").innerHTML=topics(QUESTIONS,"topic").map(t=>`<option>${t}</option>`).join("");
  $("#question-filter").onchange=()=>{currentQ=$("#question-filter").value==="Todos"?[...QUESTIONS]:QUESTIONS.filter(x=>x.topic===$("#question-filter").value);qIndex=0;renderQ()};
  $("#next-q").onclick=()=>{qIndex=(qIndex+1)%currentQ.length;renderQ()};
  renderQ();
}
function renderQ(){
  const q=currentQ[qIndex];if(!q)return;
  $("#q-topic").textContent=q.topic;$("#q-text").textContent=q.question;$("#q-counter").textContent=`${qIndex+1} / ${currentQ.length}`;
  $("#q-options").innerHTML=q.options.map((o,i)=>`<button class="option" data-i="${i}">${String.fromCharCode(65+i)}. ${o}</button>`).join("");
  $("#q-feedback").classList.add("hidden");$("#next-q").classList.add("hidden");
  $$(".option").forEach(b=>b.onclick=()=>answerQ(+b.dataset.i));
}
function answerQ(i){
  const q=currentQ[qIndex];$$(".option").forEach(b=>b.disabled=true);$$(".option")[q.correct].classList.add("correct");
  state.answered++;
  if(i===q.correct){state.correct++;$("#q-feedback").innerHTML=`<strong>✓ Correto.</strong><br>${q.explanation}`}
  else{$$(".option")[i].classList.add("wrong");$("#q-feedback").innerHTML=`<strong>✕ Revise este ponto.</strong><br>${q.explanation}`;state.errors.unshift({topic:q.topic,question:q.question,selected:q.options[i],correct:q.options[q.correct],explanation:q.explanation,date:new Date().toLocaleDateString("pt-BR")})}
  $("#q-feedback").classList.remove("hidden");$("#next-q").classList.remove("hidden");save();
}
function renderErrors(){
  const difficult=Object.entries(state.flashRatings).filter(([,v])=>v==="Dificil").map(([q])=>({topic:"Flashcard difícil",question:q}));
  const all=[...state.errors,...difficult];
  $("#error-list").innerHTML=all.length?all.map(e=>`<article class="error-item"><p class="eyebrow">${e.topic}${e.date?" • "+e.date:""}</p><h3>${e.question}</h3>${e.correct?`<p><strong>Correta:</strong> ${e.correct}</p><p>${e.explanation}</p>`:"<p>Refaça este flashcard na próxima revisão.</p>"}</article>`).join(""):`<div class="card"><h3>Nenhum erro registrado 🎉</h3><p class="muted">Quando você errar uma questão ou marcar um flashcard como difícil, ele aparece aqui.</p></div>`;
}
function renderSources(){
  $("#source-list").innerHTML=SOURCES.map(s=>`<article class="source-card"><p class="eyebrow">${s.type}</p><h3>${s.name}</h3><a href="${s.url}" target="_blank" rel="noopener">Abrir fonte ↗</a></article>`).join("");
}
function renderAll(){renderDashboard();renderModules();renderPlan();renderErrors();renderSources();renderAnalytics();renderGameHub();renderNetworkStatus()}


// ---------- PQO ARENA ----------
let activeGame=null, gameTimer=null;
function shuffle(items){
  const a=[...items];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}
function todayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function gameLevel(){return Math.floor((state.game?.xp||0)/250)+1}
function gameDayStreak(){
  const dates=[...new Set(state.game?.playDates||[])].sort().reverse(); if(!dates.length)return 0;
  let streak=0, d=new Date(); d.setHours(12,0,0,0);
  const today=todayISO(); const y=new Date(d);y.setDate(y.getDate()-1);const yesterday=`${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,"0")}-${String(y.getDate()).padStart(2,"0")}`;
  if(dates[0]!==today&&dates[0]!==yesterday)return 0;
  if(dates[0]===yesterday)d=y;
  for(const date of dates){const exp=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;if(date!==exp)break;streak++;d.setDate(d.getDate()-1)}
  return streak;
}
function weakTopics(){
  const counts={};
  (state.errors||[]).forEach(e=>{if(e.topic)counts[e.topic]=(counts[e.topic]||0)+2});
  Object.entries(state.flashRatings||{}).forEach(([question,rating])=>{if(rating!=="Dificil")return;const f=FLASHCARDS.find(x=>x.question===question);if(f?.topic)counts[f.topic]=(counts[f.topic]||0)+1});
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([t])=>t);
}
function adaptiveQuestions(pool=QUESTIONS){
  const weak=weakTopics();
  const priority=pool.filter(q=>weak.includes(q.topic));
  const rest=pool.filter(q=>!weak.includes(q.topic));
  return [...shuffle(priority),...shuffle(rest)];
}
function ensureDaily(){
  const t=todayISO(); if(state.game.daily?.date!==t)state.game.daily={date:t,played:0};
}
function achievementDefs(){return [
  {id:"first",icon:"🎮",name:"Primeira partida",desc:"Jogue 1 partida",ok:()=>state.game.totalGames>=1},
  {id:"ten",icon:"⚡",name:"Aquecida",desc:"Acerte 10 no Arena",ok:()=>state.game.totalCorrect>=10},
  {id:"fifty",icon:"🧠",name:"Mente afiada",desc:"Acerte 50 no Arena",ok:()=>state.game.totalCorrect>=50},
  {id:"survivor",icon:"❤",name:"Sobrevivente",desc:"Faça 10 pontos",ok:()=>state.game.bestScores.survival>=10},
  {id:"boss",icon:"♛",name:"Domadora do P0",desc:"10/12 no Chefão",ok:()=>state.game.bestScores.boss>=10},
  {id:"level3",icon:"🏆",name:"Nível 3",desc:"Chegue ao nível 3",ok:()=>gameLevel()>=3}
]}
function unlockAchievements(){
  const unlocked=new Set(state.game.achievements||[]);achievementDefs().forEach(a=>{if(a.ok())unlocked.add(a.id)});state.game.achievements=[...unlocked];
}
function renderGameHub(){
  if(!document.querySelector("#game-level"))return;
  ensureDaily();unlockAchievements();
  const lvl=gameLevel(), inLevel=(state.game.xp||0)%250;
  $("#game-level").textContent=lvl;$("#game-xp-bar").style.width=`${Math.round(inLevel/250*100)}%`;$("#game-xp-text").textContent=`${inLevel} / 250 XP`;$("#game-streak").textContent=`${gameDayStreak()} 🔥`;
  const weak=weakTopics()[0];
  $("#daily-mission").innerHTML=`<div class="mission-card"><span class="mission-icon">🎯</span><div><p class="eyebrow">MISSÃO DO DIA</p><h3>${weak?`Reforce ${weak}`:"Construa sua primeira sequência"}</h3><p>${weak?"O Arena percebeu que este tema merece mais treino. Faça uma partida adaptativa hoje.":"Jogue uma partida para o Arena começar a entender seus pontos fortes e fracos."}</p></div><button class="secondary" data-mission-play>Começar</button></div>`;
  const mb=document.querySelector("[data-mission-play]");if(mb)mb.onclick=()=>startGame("survival");
  const labels={survival:"Sobrevivência",lightning:"Relâmpago",match:"Associação",boss:"Chefão P0"};
  $("#game-records").innerHTML=Object.entries(labels).map(([k,v])=>`<div class="record-row"><span>${v}</span><strong>${state.game.bestScores[k]||0}</strong></div>`).join("");
  const unlocked=new Set(state.game.achievements||[]);
  $("#game-achievements").innerHTML=achievementDefs().map(a=>`<div class="achievement ${unlocked.has(a.id)?"unlocked":""}"><span>${a.icon}</span><strong>${a.name}</strong><small>${a.desc}</small></div>`).join("");
}
function gameQuestions(mode){
  if(mode==="boss"){
    const p0ids=new Set(MODULES.filter(m=>m.priority==="P0").map(m=>m.id));return adaptiveQuestions(QUESTIONS.filter(q=>p0ids.has(q.moduleId))).slice(0,12);
  }
  return adaptiveQuestions(QUESTIONS);
}
function startGame(mode){
  clearInterval(gameTimer);ensureDaily();
  const base={mode,score:0,correct:0,answered:0,combo:0,maxCombo:0,index:0,locked:false,startedAt:Date.now(),xpEarned:0};
  if(mode==="survival")Object.assign(base,{lives:3,questions:gameQuestions(mode).slice(0,30)});
  if(mode==="lightning")Object.assign(base,{seconds:60,questions:gameQuestions(mode)});
  if(mode==="boss")Object.assign(base,{questions:gameQuestions(mode)});
  if(mode==="match")Object.assign(base,{cards:adaptiveMatchCards().slice(0,10)});
  activeGame=base;$("#game-modal").classList.remove("hidden");renderGameRound();
  if(mode==="lightning"){
    gameTimer=setInterval(()=>{if(!activeGame||activeGame.mode!=="lightning")return;activeGame.seconds--;updateGameTimer();if(activeGame.seconds<=0)finishGame()},1000)
  }
}
function adaptiveMatchCards(){
  const weak=weakTopics();const pri=FLASHCARDS.filter(f=>weak.includes(f.topic)),rest=FLASHCARDS.filter(f=>!weak.includes(f.topic));return [...shuffle(pri),...shuffle(rest)];
}
function gameTitle(mode){return {survival:"Sobrevivência PQO",lightning:"Batalha Relâmpago",match:"Faça a Associação",boss:"Chefão P0"}[mode]}
function renderGameRound(){
  if(!activeGame)return;const g=activeGame,screen=$("#game-screen");
  if(g.mode==="match"){renderMatchRound();return}
  const q=g.questions[g.index]; if(!q){finishGame();return}
  let right=`${g.score} pts`;
  if(g.mode==="survival")right=`<span class="game-hearts">${"♥".repeat(g.lives)}${"♡".repeat(3-g.lives)}</span>`;
  if(g.mode==="lightning")right=`<span id="game-time">${g.seconds}s</span>`;
  if(g.mode==="boss")right=`${g.index+1}/12`;
  screen.innerHTML=`<div class="game-stage"><div class="game-topline"><span class="game-chip">${gameTitle(g.mode)}</span><span class="game-chip">${right}</span></div>${g.mode==="lightning"?'<div class="game-timer"><i id="game-timer-bar"></i></div>':""}<p class="game-topic">${q.topic}</p><h2>${q.question}</h2><div class="combo-pop">${g.combo>=3?`🔥 Combo x${g.combo}`:""}</div><div class="game-options">${q.options.map((o,i)=>`<button class="game-answer" data-game-answer="${i}"><b>${String.fromCharCode(65+i)}.</b> ${o}</button>`).join("")}</div><div id="game-feedback-slot"></div><p class="offline-note">${navigator.onLine?"Progresso sincroniza com sua conta.":"Você está offline. A partida será salva neste aparelho e sincronizada depois."}</p></div>`;
  document.querySelectorAll("[data-game-answer]").forEach(b=>b.onclick=()=>answerGameQuestion(+b.dataset.gameAnswer));updateGameTimer();
}
function updateGameTimer(){if(!activeGame||activeGame.mode!=="lightning")return;const t=$("#game-time"),bar=$("#game-timer-bar");if(t)t.textContent=`${activeGame.seconds}s`;if(bar)bar.style.width=`${Math.max(0,activeGame.seconds/60*100)}%`}
function answerGameQuestion(chosen){
  const g=activeGame;if(!g||g.locked)return;g.locked=true;const q=g.questions[g.index],ok=chosen===q.correct;g.answered++;state.game.totalAnswered++;
  document.querySelectorAll("[data-game-answer]").forEach((b,i)=>{b.disabled=true;if(i===q.correct)b.classList.add("correct");if(i===chosen&&!ok)b.classList.add("wrong")});
  if(ok){g.correct++;state.game.totalCorrect++;g.combo++;g.maxCombo=Math.max(g.maxCombo,g.combo);const gain=10+Math.min(15,g.combo*2);g.score+=g.mode==="lightning"?1:1;g.xpEarned+=gain}
  else{g.combo=0;if(g.mode==="survival")g.lives--;state.errors.unshift({topic:q.topic,question:q.question,selected:q.options[chosen],correct:q.options[q.correct],explanation:q.explanation,date:new Date().toLocaleDateString("pt-BR"),source:"PQO Arena"})}
  const slot=$("#game-feedback-slot");if(slot)slot.innerHTML=`<div class="game-feedback"><strong>${ok?"✓ Boa!":"✕ Essa escapou."}</strong><br>${q.explanation}</div>${g.mode!=="lightning"?'<button class="game-next" id="game-next-round">Continuar →</button>':""}`;
  if(g.mode==="lightning"){setTimeout(()=>advanceGame(),450)}else{const n=$("#game-next-round");if(n)n.onclick=advanceGame}
  save();
}
function advanceGame(){
  const g=activeGame;if(!g)return;if(g.mode==="survival"&&g.lives<=0){finishGame();return}g.index++;g.locked=false;if(g.mode==="boss"&&g.index>=g.questions.length){finishGame();return}if(g.mode==="survival"&&g.index>=g.questions.length){finishGame();return}renderGameRound();
}
function renderMatchRound(){
  const g=activeGame,card=g.cards[g.index];if(!card){finishGame();return}
  const distract=shuffle(FLASHCARDS.filter(f=>f.question!==card.question&&f.answer!==card.answer)).slice(0,3).map(f=>f.answer);const answers=shuffle([card.answer,...distract]);g.matchCorrect=answers.indexOf(card.answer);
  $("#game-screen").innerHTML=`<div class="game-stage"><div class="game-topline"><span class="game-chip">Faça a Associação</span><span class="game-chip">${g.index+1}/10 • ${g.score} pts</span></div><p class="game-topic">${card.topic}</p><div class="match-prompt"><small>QUAL DEFINIÇÃO COMBINA COM ESTE CARTÃO?</small><h3>${card.question}</h3></div><div class="combo-pop">${g.combo>=3?`🔥 Combo x${g.combo}`:""}</div><div class="game-options">${answers.map((a,i)=>`<button class="game-answer" data-match-answer="${i}">${a}</button>`).join("")}</div><div id="game-feedback-slot"></div></div>`;
  document.querySelectorAll("[data-match-answer]").forEach(b=>b.onclick=()=>answerMatch(+b.dataset.matchAnswer,card,answers));
}
function answerMatch(chosen,card,answers){
  const g=activeGame;if(!g||g.locked)return;g.locked=true;const ok=chosen===g.matchCorrect;g.answered++;state.game.totalAnswered++;
  document.querySelectorAll("[data-match-answer]").forEach((b,i)=>{b.disabled=true;if(i===g.matchCorrect)b.classList.add("correct");if(i===chosen&&!ok)b.classList.add("wrong")});
  if(ok){g.correct++;state.game.totalCorrect++;g.score++;g.combo++;g.maxCombo=Math.max(g.maxCombo,g.combo);g.xpEarned+=10+Math.min(15,g.combo*2)}else{g.combo=0;state.flashRatings[card.question]="Dificil";scheduleReview(card.question,"Dificil")}
  $("#game-feedback-slot").innerHTML=`<div class="game-feedback"><strong>${ok?"✓ Associação certa!":"✕ Guarde esta relação."}</strong><br>${card.answer}</div><button class="game-next" id="game-next-round">Continuar →</button>`;
  $("#game-next-round").onclick=()=>{g.index++;g.locked=false;if(g.index>=10)finishGame();else renderGameRound()};save();
}
function finishGame(){
  clearInterval(gameTimer);gameTimer=null;const g=activeGame;if(!g)return;
  const modeScore=g.mode==="boss"?g.correct:g.score;state.game.totalGames++;state.game.xp=(state.game.xp||0)+g.xpEarned+20;state.game.bestScores[g.mode]=Math.max(state.game.bestScores[g.mode]||0,modeScore);state.game.lastPlayedAt=new Date().toISOString();state.game.daily.played=(state.game.daily.played||0)+1;state.game.playDates=[...new Set([...(state.game.playDates||[]),todayISO()])].slice(-90);unlockAchievements();
  const acc=g.answered?Math.round(g.correct/g.answered*100):0;let message=acc>=85?"Excelente. Seu domínio está muito consistente.":acc>=65?"Boa rodada. Os erros já entraram na sua revisão inteligente.":"Essa partida mostrou exatamente onde reforçar. Isso é progresso.";
  $("#game-screen").innerHTML=`<div class="game-stage"><p class="game-topic">PARTIDA CONCLUÍDA</p><h2>${gameTitle(g.mode)}</h2><div class="game-score-big">${modeScore}</div><p>${g.mode==="lightning"?"acertos em 60 segundos":"pontos"}</p><div class="game-result-card"><div class="game-result-stats"><div><span>Acertos</span><strong>${g.correct}/${g.answered}</strong></div><div><span>Precisão</span><strong>${acc}%</strong></div><div><span>Melhor combo</span><strong>x${g.maxCombo}</strong></div></div></div><p>${message}</p><p class="game-xp-gain">+${g.xpEarned+20} XP</p><div class="actions" style="justify-content:center"><button class="game-next" id="game-again">Jogar de novo</button><button class="secondary" id="game-done">Voltar à Arena</button></div></div>`;
  save();const mode=g.mode;activeGame=null;$("#game-again").onclick=()=>startGame(mode);$("#game-done").onclick=closeGame;
}
function closeGame(){clearInterval(gameTimer);gameTimer=null;activeGame=null;$("#game-modal").classList.add("hidden");renderGameHub()}
const closeGameBtn=$("#close-game");if(closeGameBtn)closeGameBtn.onclick=closeGame;
document.querySelectorAll("[data-game]").forEach(b=>b.onclick=()=>startGame(b.dataset.game));

let deferredInstallPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;const b=$("#install-app");if(b)b.classList.remove("hidden")});
const installBtn=$("#install-app");
if(installBtn) installBtn.onclick=async()=>{if(!deferredInstallPrompt){alert("No iPhone, abra no Safari, toque em Compartilhar e depois em ‘Adicionar à Tela de Início’.");return}deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;installBtn.classList.add("hidden")};

async function boot(){
  setupFlash();
  setupQ();
  renderAll();
  await initAuth();
  initProfile();
  if(cloudEnabled && currentUser && !state.profile){
    $("#profile-name").value=currentUser.user_metadata?.name||"";
    $("#profile-email").value=currentUser.email||"";
    openProfile();
  }
}
boot();
