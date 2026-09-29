import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup,
  signInWithRedirect, getRedirectResult, signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getDatabase, ref, get, set, update, push, onValue, runTransaction, off
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC79CsYTIjr2lahLJv2U1HX_1laEU7-31E",
  authDomain: "shursh-messenger.firebaseapp.com",
  databaseURL: "https://shursh-messenger-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "shursh-messenger",
  storageBucket: "shursh-messenger.firebasestorage.app",
  messagingSenderId: "1063665415609",
  appId: "1:1063665415609:web:d5069aef0e640e23f2b268",
  measurementId: "G-9TSG5MHTJ8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

const $ = (s, root=document) => root.querySelector(s);
const appEl = $("#app");
const toastEl = $("#toast");

const state = {
  user:null, profile:null, route:"home", chatUid:null, unsub:null,
  theme:localStorage.getItem("sl_theme")||"auto",
  accent:localStorage.getItem("sl_accent")||"#7c3aed",
  lang:localStorage.getItem("sl_lang")||"ru",
  dev:false
};

const t = {
  ru:{home:"Главное",friends:"Друзья",chats:"Чаты",communities:"Сообщество",profile:"Профиль",
      search:"Поиск",settings:"Настройки",login:"Войти с Google",welcome:"Добро пожаловать в StandLink",
      continue:"Продолжить",logout:"Выйти",edit:"Редактировать профиль",posts:"Посты",followers:"Подписчики",
      following:"Подписки",noContent:"Пока здесь ничего нет",under:"Раздел в разработке",save:"Сохранить",
      requests:"Заявки",allFriends:"Друзья",online:"Онлайн",emptyFriends:"У вас пока нет друзей",
      emptyChats:"У вас пока нет чатов",find:"Найти пользователя",username:"Имя пользователя",
      display:"Отображаемое имя",gameid:"ID Standoff 2",bio:"О себе",appearance:"Оформление",
      theme:"Тема",accent:"Акцент",language:"Язык",version:"Версия",developer:"Разработчик",
      developerCode:"Введите код разработчика",incorrect:"Неверный код",saved:"Сохранено"},
  en:{home:"Home",friends:"Friends",chats:"Chats",communities:"Community",profile:"Profile",
      search:"Search",settings:"Settings",login:"Sign in with Google",welcome:"Welcome to StandLink",
      continue:"Continue",logout:"Log out",edit:"Edit profile",posts:"Posts",followers:"Followers",
      following:"Following",noContent:"Nothing here yet",under:"Section in development",save:"Save",
      requests:"Requests",allFriends:"Friends",online:"Online",emptyFriends:"You have no friends yet",
      emptyChats:"You have no chats yet",find:"Find a user",username:"Username",
      display:"Display name",gameid:"Standoff 2 ID",bio:"About",appearance:"Appearance",
      theme:"Theme",accent:"Accent",language:"Language",version:"Version",developer:"Developer",
      developerCode:"Enter developer code",incorrect:"Incorrect code",saved:"Saved"}
};
const L=()=>t[state.lang]||t.ru;
function toast(x){toastEl.textContent=x;toastEl.classList.add("show");setTimeout(()=>toastEl.classList.remove("show"),2200)}
function esc(x=""){return String(x).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function avatar(p){return esc(p?.avatar||"🎮")}
function usernameKey(s){return String(s||"").trim().toLowerCase()}
function initials(p){return avatar(p)}
function applyAppearance(){
  document.documentElement.style.setProperty("--accent",state.accent);
  document.documentElement.style.setProperty("--accent2",state.accent);
  document.body.classList.toggle("dark",state.theme==="dark"||(state.theme==="auto"&&matchMedia("(prefers-color-scheme: dark)").matches));
}
applyAppearance();

function shell(content, active="home", titleActions=""){
  const nav=[["home","⌂",L().home],["friends","♙",L().friends],["chats","▣",L().chats],["communities","◈",L().communities],["profile","●",L().profile]];
  appEl.innerHTML=`<div class="app-shell">
    <header class="topbar">
      <button class="icon-btn brand" id="brand">Stand<span>Link</span></button>
      <div class="top-actions">${titleActions}</div>
    </header>
    <main class="main fade">${content}</main>
    <nav class="bottom-nav">${nav.map(n=>`<button class="nav-item ${active===n[0]?"active":""}" data-route="${n[0]}"><span class="nav-icon">${n[1]}</span>${n[2]}</button>`).join("")}</nav>
  </div>`;
  $("#brand").onclick=()=>{state.route="home";render()};
  document.querySelectorAll("[data-route]").forEach(b=>b.onclick=()=>{state.route=b.dataset.route;state.chatUid=null;render()});
}

function login(){
  appEl.innerHTML=`<div class="login"><div class="card login-box">
    <div class="logo-big">Stand<span>Link</span></div>
    <p class="muted">Социальная сеть для игроков Standoff 2.</p>
    <button class="primary google" id="google"><b>G</b>${L().login}</button>
  </div></div>`;
  $("#google").onclick=async()=>{
    try{
      if(/iPhone|iPad|Android/i.test(navigator.userAgent)) await signInWithRedirect(auth,provider);
      else await signInWithPopup(auth,provider);
    }catch(e){toast(e.message||"Ошибка входа")}
  };
}

async function loadProfile(){
  if(!state.user)return null;
  const snap=await get(ref(db,`users/${state.user.uid}`));
  state.profile=snap.exists()?snap.val():null;
  return state.profile;
}

function onboarding(){
  const p=state.profile||{};
  appEl.innerHTML=`<div class="onboard fade">
    <div class="logo-big">Stand<span>Link</span></div>
    <h1>${L().welcome}</h1>
    <p class="muted">Заполни профиль. Username должен быть уникальным.</p>
    <div class="card" style="padding:20px;margin-top:18px">
      <div class="field"><label>${L().display}</label><input id="display" value="${esc(p.displayName||state.user?.displayName||"")}"></div>
      <div class="field"><label>${L().username}</label><input id="username" placeholder="player_123" value="${esc(p.username||"")}"></div>
      <div class="field"><label>${L().gameid}</label><input id="gameid" value="${esc(p.gameId||"")}"></div>
      <div class="field"><label>${L().bio}</label><textarea id="bio">${esc(p.bio||"")}</textarea></div>
      <button class="primary" id="cont">${L().continue}</button>
    </div>
  </div>`;
  $("#cont").onclick=saveOnboarding;
}
async function saveOnboarding(){
  const displayName=$("#display").value.trim(), username=$("#username").value.trim(), gameId=$("#gameid").value.trim(), bio=$("#bio").value.trim();
  if(displayName.length<2)return toast("Укажи имя");
  if(!/^[a-z0-9_.-]{3,20}$/.test(username))return toast("Username: 3–20 символов, a-z 0-9 . _ -");
  const key=usernameKey(username);
  const uref=ref(db,`usernames/${key}`);
  const tx=await runTransaction(uref,current=>current===null?state.user.uid:current);
  if(!tx.committed || tx.snapshot.val()!==state.user.uid)return toast("Этот username уже занят");
  const profile={displayName,username,usernameLower:key,gameId,bio,avatar:state.profile?.avatar||"🎮",uid:state.user.uid,createdAt:state.profile?.createdAt||Date.now(),online:true};
  await set(ref(db,`users/${state.user.uid}`),profile);
  state.profile=profile;
  appearanceSetup();
}
function appearanceSetup(){
  appEl.innerHTML=`<div class="onboard fade"><div class="logo-big">Stand<span>Link</span></div>
    <h1>Оформление</h1><p class="muted">Настрой внешний вид. Это можно изменить позже.</p>
    <div class="card" style="padding:20px;margin-top:18px">
      <h3>${L().theme}</h3><div class="pills" id="themes">
       ${["light","dark","auto"].map(x=>`<button class="pill ${state.theme===x?"active":""}" data-theme="${x}">${x}</button>`).join("")}
      </div>
      <h3 style="margin-top:22px">${L().accent}</h3><div class="pills" id="accents">
       ${[["#7c3aed","Purple"],["#ec4899","Pink"],["#ef4444","Red"],["#22c55e","Green"],["#eab308","Yellow"],["#3b82f6","Blue"]].map(a=>`<button class="pill ${state.accent===a[0]?"active":""}" data-accent="${a[0]}">${a[1]}</button>`).join("")}
      </div>
      <h3 style="margin-top:22px">${L().language}</h3><div class="pills"><button class="pill active">Русский / English</button></div>
      <button class="primary" id="enter" style="margin-top:22px">Перейти в StandLink</button>
    </div></div>`;
  document.querySelectorAll("[data-theme]").forEach(b=>b.onclick=()=>{state.theme=b.dataset.theme;localStorage.setItem("sl_theme",state.theme);applyAppearance();appearanceSetup()});
  document.querySelectorAll("[data-accent]").forEach(b=>b.onclick=()=>{state.accent=b.dataset.accent;localStorage.setItem("sl_accent",state.accent);applyAppearance();appearanceSetup()});
  $("#enter").onclick=()=>{state.route="profile";render()};
}

function home(){
  shell(`<div class="page-title">${L().home}</div><div class="card empty"><strong>${L().noContent}</strong>${L().under}</div>`,"home",
    `<button class="icon-btn" id="searchBtn">⌕</button>`);
  $("#searchBtn").onclick=()=>quickSearch("users");
}
function quickSearch(type){
  const q=prompt(type==="communities"?"Поиск сообщества":"Поиск пользователя по username");
  if(!q)return;
  if(type==="communities"){toast(L().under);return}
  state.route="friends";render();setTimeout(()=>{const inp=$("#friendSearch");if(inp){inp.value=q;$("#doFriendSearch").click()}},0);
}

async function friends(){
  shell(`<div class="page-title">${L().friends}</div>
    <div class="search"><input id="friendSearch" placeholder="${L().find}"><button class="secondary" id="doFriendSearch">⌕</button></div>
    <div id="friendsBox" class="card"></div>`,"friends",`<button class="icon-btn" id="searchBtn">⌕</button>`);
  const box=$("#friendsBox");
  const friendsSnap=await get(ref(db,`friends/${state.user.uid}`));
  const ids=friendsSnap.exists()?Object.keys(friendsSnap.val()):[];
  const reqSnap=await get(ref(db,`friendRequests/${state.user.uid}`));
  const requests=reqSnap.exists()?Object.values(reqSnap.val()):[];
  let html="";
  if(requests.length) html+=`<div class="section-head" style="padding:15px 15px 0"><h3>${L().requests}</h3></div>`+requests.map(r=>`<div class="row"><div class="avatar">${avatar(r)}</div><div class="row-main"><div class="row-name">${esc(r.displayName)}</div><div class="row-sub">@${esc(r.username)}</div></div><button class="secondary" data-accept="${r.uid}">✓</button></div>`).join("");
  if(ids.length) for(const id of ids){const s=await get(ref(db,`users/${id}`));if(s.exists()){const p=s.val();html+=`<div class="row"><div class="avatar">${avatar(p)}</div><div class="row-main"><div class="row-name">${esc(p.displayName)}</div><div class="row-sub">@${esc(p.username)}</div></div></div>`}}
  if(!html)html=`<div class="empty"><strong>${L().emptyFriends}</strong>Найди человека по username.</div>`;
  box.innerHTML=html;
  document.querySelectorAll("[data-accept]").forEach(b=>b.onclick=()=>acceptFriend(b.dataset.accept));
  $("#doFriendSearch").onclick=searchFriend;
  $("#friendSearch").onkeydown=e=>{if(e.key==="Enter")searchFriend()};
  $("#searchBtn").onclick=()=>$("#friendSearch").focus();
}
async function searchFriend(){
  const q=usernameKey($("#friendSearch").value); if(!q)return;
  const snap=await get(ref(db,"users"));
  let found=null;
  snap.forEach(c=>{if(c.val()?.usernameLower===q)found=c.val()});
  if(!found||found.uid===state.user.uid)return toast("Пользователь не найден");
  $("#friendsBox").innerHTML=`<div class="row"><div class="avatar">${avatar(found)}</div><div class="row-main"><div class="row-name">${esc(found.displayName)}</div><div class="row-sub">@${esc(found.username)}</div></div><button class="secondary" id="addFriend">Добавить</button></div>`;
  $("#addFriend").onclick=()=>sendFriend(found);
}
async function sendFriend(p){
  await set(ref(db,`friendRequests/${p.uid}/${state.user.uid}`),{uid:state.user.uid,displayName:state.profile.displayName,username:state.profile.username,avatar:state.profile.avatar||"🎮",createdAt:Date.now()});
  toast("Заявка отправлена");
}
async function acceptFriend(uid){
  const r=await get(ref(db,`friendRequests/${state.user.uid}/${uid}`));
  if(!r.exists())return;
  await update(ref(db),{[`friends/${state.user.uid}/${uid}`]:true,[`friends/${uid}/${state.user.uid}`]:true,[`friendRequests/${state.user.uid}/${uid}`]:null});
  render();
}

async function chats(){
  shell(`<div class="page-title">${L().chats}</div><div id="chatList" class="card"></div>`,"chats",`<button class="icon-btn" id="searchBtn">⌕</button>`);
  const box=$("#chatList"), snap=await get(ref(db,`chatIndex/${state.user.uid}`));
  if(!snap.exists()){box.innerHTML=`<div class="empty"><strong>${L().emptyChats}</strong>Чаты появятся после добавления друзей.</div>`;return}
  let html="";
  for(const uid of Object.keys(snap.val())){const s=await get(ref(db,`users/${uid}`));if(s.exists()){const p=s.val();html+=`<button class="row" data-chat="${uid}" style="width:100%;background:none;text-align:left"><div class="avatar">${avatar(p)}</div><div class="row-main"><div class="row-name">${esc(p.displayName)}</div><div class="row-sub">@${esc(p.username)}</div></div></button>`}}
  box.innerHTML=html||`<div class="empty"><strong>${L().emptyChats}</strong></div>`;
  document.querySelectorAll("[data-chat]").forEach(b=>b.onclick=()=>{state.chatUid=b.dataset.chat;chatView()});
  $("#searchBtn").onclick=()=>quickSearch("users");
}
async function chatView(){
  const other=await get(ref(db,`users/${state.chatUid}`));if(!other.exists())return;
  const p=other.val(), key=[state.user.uid,state.chatUid].sort().join("_");
  if(state.unsub)state.unsub();
  shell(`<div class="back-title"><button id="back">‹ ${L().chats}</button><b>${esc(p.displayName)}</b></div>
    <div class="card"><div class="message-list" id="messages"></div><form class="composer" id="composer"><input id="message" placeholder="Сообщение…"><button class="send">➤</button></form></div>`,"chats");
  $("#back").onclick=()=>{state.route="chats";render()};
  const list=$("#messages");
  state.unsub=onValue(ref(db,`chats/${key}/messages`),snap=>{
    let html="";
    snap.forEach(c=>{const m=c.val();html+=`<div class="message ${m.uid===state.user.uid?"mine":""}"><div class="bubble">${esc(m.text)}</div></div>`});
    list.innerHTML=html||`<div class="empty">${L().noContent}</div>`;
    list.scrollTop=list.scrollHeight;
  });
  $("#composer").onsubmit=async e=>{
    e.preventDefault();const text=$("#message").value.trim();if(!text)return;
    await push(ref(db,`chats/${key}/messages`),{uid:state.user.uid,text,createdAt:Date.now()});
    await update(ref(db),{[`chatIndex/${state.user.uid}/${state.chatUid}`]:{updatedAt:Date.now()},[`chatIndex/${state.chatUid}/${state.user.uid}`]:{updatedAt:Date.now()}});
    $("#message").value="";
  };
}

function communities(){
  shell(`<div class="page-title">${L().communities}</div><div class="card empty"><strong>${L().noContent}</strong>${L().under}</div>`,"communities",
    `<button class="icon-btn" id="searchBtn">⌕</button>`);
  $("#searchBtn").onclick=()=>quickSearch("communities");
}

function profile(){
  const p=state.profile||{};
  const content=`<div class="profile-page">
    <section class="profile-top">
      <div class="profile-cover"></div>
      <div class="profile-brandbar">
        <button class="profile-brand" id="brand2"><img src="./assets/standlink-mark.png" alt=""><span>Stand<span class="link">Link</span></span></button>
        <div class="top-actions"><button class="icon-btn" id="profileNotify">♧</button><button class="icon-btn" id="profileSettings">⚙</button><button class="icon-btn" id="profileMore">⋮</button></div>
      </div>
      <div class="profile-head">
        <div class="profile-main2">
          <div class="profile-avatar2"><img src="./assets/profile-avatar.jpg" alt=""><button class="avatar-edit" id="avatarEdit">✎</button></div>
          <div class="profile-meta2">
            <div class="profile-name2">${esc(p.displayName||"Jdjddj")} <span class="verified">✓</span></div>
            <div class="profile-user2">@${esc(p.username||"username")}</div>
            <div class="profile-bio2">${esc(p.bio||"Пока ничего не написано...")} <button class="icon-btn" style="display:inline;width:28px;height:28px;font-size:14px">✎</button></div>
            <div class="profile-idrow">
              <div class="profile-chip">ID: ${esc(p.gameId||"12345678")} ⧉</div>
              <div class="profile-chip">🎮 Standoff 2</div>
            </div>
          </div>
        </div>
      </div>
      <div class="profile-stats2">
        <div class="profile-stat2"><b>0</b><span>Публикаций</span></div>
        <div class="profile-stat2"><b>0</b><span>Подписчиков</span></div>
        <div class="profile-stat2"><b>0</b><span>Подписок</span></div>
        <div class="profile-stat2"><b>🔥 0</b><span>Уровень</span></div>
      </div>
      <div class="profile-actions2">
        <button class="profile-btn primary2" id="edit">✎ Редактировать профиль</button>
        <button class="profile-btn secondary2" id="share">♧ Поделиться</button>
      </div>
      <div class="profile-tabs2">
        <button class="profile-tab2 active" data-ptab="posts">▤ Посты</button>
        <button class="profile-tab2" data-ptab="inventory">◇ Инвентарь</button>
        <button class="profile-tab2" data-ptab="achievements">☆ Достижения</button>
        <button class="profile-tab2" data-ptab="stats">▥ Статистика</button>
      </div>
      <div id="profileTabContent" class="profile-empty2">
        <div><div class="profile-empty-icon">▤⊕</div><h3>Пока нет публикаций</h3><p>Когда вы что-то опубликуете, это появится здесь</p></div>
      </div>
      <div class="skin-card">
        <div class="skin-head"><span>▣</span> Скин профиля <span>›</span></div>
        <div class="skin-body"><div class="skin-placeholder"><div class="big">▧</div><div>У вас пока нет скина профиля</div><div style="margin-top:7px">Вы можете установить скин из своего инвентаря</div><button id="chooseSkin">Выбрать скин</button></div></div>
      </div>
    </section>
  </div>
  <nav class="profile-bottom2">
    <button class="profile-nav2" data-route="home"><span class="ico">⌂</span>Главная</button>
    <button class="profile-nav2" data-route="friends"><span class="ico">♙</span>Друзья</button>
    <button class="profile-nav2" data-route="chats"><span class="ico">▢</span>Чаты</button>
    <button class="profile-nav2" data-route="communities"><span class="ico">♧</span>Сообщества</button>
    <button class="profile-nav2 active" data-route="profile"><span class="ico">●</span>Профиль</button>
  </nav>`;
  appEl.innerHTML=`<div class="app-shell">${content}</div>`;
  $("#brand2").onclick=()=>{state.route="home";render()};
  $("#profileSettings").onclick=()=>settings();
  $("#profileNotify").onclick=()=>toast("Уведомления — скоро");
  $("#profileMore").onclick=()=>toast("Дополнительные действия — скоро");
  $("#avatarEdit").onclick=()=>toast("Загрузка аватара — добавим следующим этапом");
  $("#edit").onclick=()=>editProfile();
  $("#share").onclick=async()=>{try{await navigator.clipboard.writeText(location.href);toast("Ссылка скопирована")}catch{toast("Готово")}};
  $("#chooseSkin").onclick=()=>toast("Выбор скина — подключим к инвентарю");
  document.querySelectorAll("[data-ptab]").forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll("[data-ptab]").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
    const type=btn.dataset.ptab;
    const box=$("#profileTabContent");
    if(type==="posts")box.innerHTML=`<div><div class="profile-empty-icon">▤⊕</div><h3>Пока нет публикаций</h3><p>Когда вы что-то опубликуете, это появится здесь</p></div>`;
    if(type==="inventory")box.innerHTML=`<div><div class="profile-empty-icon">◇</div><h3>Инвентарь профиля</h3><p>Здесь будут предметы и скины игрока.</p></div>`;
    if(type==="achievements")box.innerHTML=`<div><div class="profile-empty-icon">☆</div><h3>Достижения</h3><p>Здесь будут достижения игрока.</p></div>`;
    if(type==="stats")box.innerHTML=`<div><div class="profile-empty-icon">▥</div><h3>Статистика</h3><p>Здесь будет игровая статистика.</p></div>`;
  });
  document.querySelectorAll(".profile-nav2[data-route]").forEach(b=>b.onclick=()=>{state.route=b.dataset.route;render()});
}

function editProfile(){
  const p=state.profile;
  shell(`<div class="back-title"><button id="back">‹ ${L().profile}</button><b>${L().edit}</b></div>
    <div class="card" style="padding:20px">
      <div class="field"><label>${L().display}</label><input id="display" value="${esc(p.displayName)}"></div>
      <div class="field"><label>${L().gameid}</label><input id="gameid" value="${esc(p.gameId||"")}"></div>
      <div class="field"><label>${L().bio}</label><textarea id="bio">${esc(p.bio||"")}</textarea></div>
      <button class="primary" id="save">${L().save}</button>
    </div>`,"profile");
  $("#back").onclick=profile;
  $("#save").onclick=async()=>{await update(ref(db,`users/${state.user.uid}`),{displayName:$("#display").value.trim(),gameId:$("#gameid").value.trim(),bio:$("#bio").value.trim()});await loadProfile();profile();toast(L().saved)}
}
function settings(){
  shell(`<div class="back-title"><button id="back">‹ ${L().profile}</button><b>${L().settings}</b></div>
    <div class="section"><h3>${L().appearance}</h3><div class="card settings-list">
      <div class="setting-row"><div class="setting-label"><b>${L().theme}</b><span>Light / Dark / Auto</span></div><div class="pills">${["light","dark","auto"].map(x=>`<button class="pill ${state.theme===x?"active":""}" data-theme="${x}">${x}</button>`).join("")}</div></div>
      <div class="setting-row"><div class="setting-label"><b>${L().accent}</b><span>Глобальный цвет интерфейса</span></div><div class="pills">${["#7c3aed","#ec4899","#ef4444","#22c55e","#eab308","#3b82f6"].map(x=>`<button class="pill ${state.accent===x?"active":""}" data-accent="${x}">●</button>`).join("")}</div></div>
      <div class="setting-row"><div class="setting-label"><b>${L().language}</b><span>Русский / English</span></div><div class="pills"><button class="pill ${state.lang==="ru"?"active":""}" data-lang="ru">RU</button><button class="pill ${state.lang==="en"?"active":""}" data-lang="en">EN</button></div></div>
    </div></div>
    <div class="card settings-list">
      <button class="setting-row" id="designerBtn" style="width:100%;background:none;text-align:left"><div class="setting-label"><b>🎨 StandLink Designer</b><span>Расставить элементы интерфейса визуально</span></div>›</button>
      <div class="setting-row"><div class="setting-label"><b>${L().version}</b><span>StandLink</span></div><b>0.1.0</b></div>
      <button class="setting-row danger" id="logout" style="width:100%;background:none;text-align:left"><div class="setting-label"><b>${L().logout}</b></div>›</button>
    </div>`,"profile");
  $("#back").onclick=profile;
  document.querySelectorAll("[data-theme]").forEach(b=>b.onclick=()=>{state.theme=b.dataset.theme;localStorage.setItem("sl_theme",state.theme);applyAppearance();settings()});
  document.querySelectorAll("[data-accent]").forEach(b=>b.onclick=()=>{state.accent=b.dataset.accent;localStorage.setItem("sl_accent",state.accent);applyAppearance();settings()});
  document.querySelectorAll("[data-lang]").forEach(b=>b.onclick=()=>{state.lang=b.dataset.lang;localStorage.setItem("sl_lang",state.lang);settings()});
  $("#designerBtn").onclick=()=>{location.href="./designer.html"};
  $("#logout").onclick=()=>signOut(auth);
  let clicks=Number(sessionStorage.getItem("sl_dev_clicks")||0);
  // Hidden developer entry: 24 clicks on the StandLink logo.
  $("#brand").onclick=()=>{
    clicks++;sessionStorage.setItem("sl_dev_clicks",clicks);
    if(clicks>=24){clicks=0;sessionStorage.setItem("sl_dev_clicks","0");const code=prompt(L().developerCode);if(code==="5568228666007"){state.dev=true;toast("✓ "+L().developer)}else if(code!==null)toast(L().incorrect)}
    else {state.route="home";render()}
  };
}

async function render(){
  if(state.unsub){state.unsub();state.unsub=null}
  if(!state.user){login();return}
  await loadProfile();
  if(!state.profile?.username){onboarding();return}
  applyAppearance();
  if(state.route==="home")home();
  else if(state.route==="friends")await friends();
  else if(state.route==="chats")state.chatUid?await chatView():await chats();
  else if(state.route==="communities")communities();
  else profile();
}

getRedirectResult(auth).catch(()=>{});
onAuthStateChanged(auth,async user=>{
  state.user=user;
  if(user){await loadProfile();render()}else render();
});
