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
const DEV_CODE_HASH="0701f394faa0b0986f9b0534d1acea6bb41ddf2fabd25b7511818100e9baacd2";
function ico(name,size=22,cls=""){
  const paths={
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/>',
    settings:'<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="m19.4 15 .1.1a1.9 1.9 0 0 1-2.7 2.7l-.1-.1a1.9 1.9 0 0 0-3.2 1.3v.2a1.9 1.9 0 0 1-3.8 0V19a1.9 1.9 0 0 0-3.2-1.3l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1A1.9 1.9 0 0 0 2.5 12a1.9 1.9 0 0 1 0-3.8h.2A1.9 1.9 0 0 0 4 5l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1A1.9 1.9 0 0 0 10 1.5h.2a1.9 1.9 0 0 1 3.8 0v.2a1.9 1.9 0 0 0 3.2 1.3l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1A1.9 1.9 0 0 0 19.5 8h.2a1.9 1.9 0 0 1 0 3.8h-.2a1.9 1.9 0 0 0-.1 3.2Z"/>',
    more:'<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
    pencil:'<path d="m4 20 4.2-1 9.9-9.9a2.2 2.2 0 0 0-3.1-3.1L5.1 15.9 4 20Z"/><path d="m13.8 7.2 3.1 3.1"/>',
    copy:'<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    share:'<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.5-4.4M8.2 13.2l7.5 4.4"/>',
    post:'<path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    inventory:'<path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    chart:'<path d="M4 19V9M10 19V5M16 19v-8M22 19H2"/>',
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
    friends:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5M15 15c2.8.1 5 1.7 5 5"/>',
    chat:'<path d="M4 5h16v11H8l-4 4V5Z"/>',
    community:'<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2.5 20c.4-3.2 2.2-5 5.5-5s5.1 1.8 5.5 5M10.5 15c3.7-1.1 7.1.6 7.8 5"/>',
    profile:'<circle cx="12" cy="8" r="3.5"/><path d="M4 21c.6-4.3 3.3-6.5 8-6.5s7.4 2.2 8 6.5"/>',
    image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 3-3 5 5"/>',
    fire:'<path d="M12 21c4.2 0 7-2.7 7-6.5 0-3.1-1.9-5.3-4.1-7.5.1 2.1-1 3.4-2.2 4.2.1-3.8-2.1-6.2-4.5-8.2.1 4.2-3.2 6.6-3.2 11.1C5 18.1 7.8 21 12 21Z"/>'
  };
  return `<svg class="ui-icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.more}</svg>`;
}
async function sha256(text){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function handleBrandClick(){
  let clicks=Number(sessionStorage.getItem("sl_dev_clicks")||0)+1;
  sessionStorage.setItem("sl_dev_clicks",String(clicks));
  if(clicks>=26){
    sessionStorage.setItem("sl_dev_clicks","0");
    const code=prompt(L().developerCode);
    if(code!==null){
      if(await sha256(code)===DEV_CODE_HASH){
        await update(ref(db,`users/${state.user.uid}`),{isDeveloper:true});
        state.dev=true;state.profile={...(state.profile||{}),isDeveloper:true};
        toast("✓ "+L().developer);profile();return;
      }
      toast(L().incorrect);
    }
  }
  state.route="home";state.chatUid=null;render();
}
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
  $("#brand").onclick=handleBrandClick;
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
  state.dev=!!state.profile?.isDeveloper;
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
  const profile={displayName,username,usernameLower:key,gameId,bio,avatar:state.profile?.avatar||"",uid:state.user.uid,createdAt:state.profile?.createdAt||Date.now(),online:true};
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
    snap.forEach(c=>{
      const m=c.val();
      if(m.type==="profileShare"){
        const pr=m.profile||{};
        html+=`<div class="message ${m.uid===state.user.uid?"mine":""}">
          <div class="profile-share-card">
            <div class="profile-share-title">StandLink</div>
            <div class="profile-share-main"><div class="share-avatar big">${avatar(pr)}</div><div><b>${esc(pr.displayName||"Игрок")}</b><small>@${esc(pr.username||"")}</small></div></div>
            <div class="profile-share-id">ID: ${esc(pr.gameId||"—")}</div>
            <button class="profile-share-open" data-shared-profile="${esc(pr.uid||"")}">Открыть профиль</button>
          </div>
        </div>`;
      }else{
        html+=`<div class="message ${m.uid===state.user.uid?"mine":""}"><div class="bubble">${esc(m.text||"")}</div></div>`;
      }
    });
    list.innerHTML=html||`<div class="empty">${L().noContent}</div>`;
    list.querySelectorAll("[data-shared-profile]").forEach(b=>b.onclick=async()=>{
      const uid=b.dataset.sharedProfile;
      const s=await get(ref(db,`users/${uid}`));
      if(!s.exists())return toast("Профиль не найден");
      const p=s.val();
      toast(`@${p.username||"player"}`);
    });
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
  const isDev=!!(p.isDeveloper||state.dev);
  const display=esc(p.displayName||"Игрок");
  const username=esc(p.username||"username");
  const gameId=esc(p.gameId||"—");
  const bio=esc(p.bio||"Пока ничего не написано...");
  const coverStyle=isDev?' style="background-image:url(./assets/profile-background.jpg)"':'';
  const avatarHtml=isDev
    ? `<img src="./assets/profile-avatar.jpg" alt="Аватар разработчика">`
    : `<div class="profile-avatar-empty" aria-label="Пустой аватар"></div>`;
  const verify=isDev?`<span class="verified" title="Разработчик">✓</span>`:'';
  const content=`<div class="profile-page exact-profile">
    <section class="profile-top">
      <div class="profile-cover ${isDev?'developer-cover':''}"${coverStyle}></div>
      <div class="profile-brandbar">
        <button class="profile-brand" id="brand2" aria-label="StandLink">
          <img src="./assets/standlink-mark-transparent.png" alt="">
          <span>Stand<span class="link">Link</span></span>
        </button>
        <div class="top-actions">
          <button class="icon-btn profile-top-icon" id="profileNotify" aria-label="Уведомления">${ico('bell',24)}</button>
          <button class="icon-btn profile-top-icon" id="profileSettings" aria-label="Настройки">${ico('settings',24)}</button>
          <button class="icon-btn profile-top-icon" id="profileMore" aria-label="Ещё">${ico('more',24)}</button>
        </div>
      </div>

      <div class="profile-head exact-head">
        <div class="profile-main2">
          <div class="profile-avatar2 ${isDev?'developer-avatar':''}">
            ${avatarHtml}
            <button class="avatar-edit" id="avatarEdit" aria-label="Изменить аватар">${ico('pencil',19)}</button>
          </div>
          <div class="profile-meta2">
            <div class="profile-name2">${display} ${verify}</div>
            <div class="profile-user2"><span>@${username}</span><button class="tiny-copy" id="copyUsername" aria-label="Скопировать username">${ico('copy',18)}</button></div>
            <div class="profile-bio2"><span>${bio}</span><button class="tiny-copy" id="editBio" aria-label="Изменить описание">${ico('pencil',16)}</button></div>
            <div class="profile-idrow">
              <div class="profile-chip">ID: ${gameId}<button class="chip-copy" id="copyGameId" aria-label="Скопировать ID">${ico('copy',16)}</button></div>
              <div class="profile-chip"><span class="standoff-mini">🎮</span> Standoff 2</div>
            </div>
          </div>
        </div>
      </div>

      <div class="profile-stats2 exact-stats">
        <button class="profile-stat2"><b>0</b><span>Публикаций</span></button>
        <button class="profile-stat2"><b>0</b><span>Подписчиков</span></button>
        <button class="profile-stat2"><b>0</b><span>Подписок</span></button>
        <button class="profile-stat2"><b><span class="level-fire">${ico('fire',21)}</span> 0</b><span>Уровень</span></button>
      </div>

      <div class="profile-actions2 exact-actions">
        <button class="profile-btn primary2" id="edit">${ico('pencil',18)}<span>Редактировать профиль</span></button>
        <button class="profile-btn secondary2" id="share">${ico('share',19)}<span>Поделиться</span></button>
      </div>

      <div class="profile-tabs2 exact-tabs">
        <button class="profile-tab2 active" data-ptab="posts">${ico('post',20)}<span>Посты</span></button>
        <button class="profile-tab2" data-ptab="inventory">${ico('inventory',20)}<span>Инвентарь</span></button>
        <button class="profile-tab2" data-ptab="achievements">${ico('star',20)}<span>Достижения</span></button>
        <button class="profile-tab2" data-ptab="stats">${ico('chart',20)}<span>Статистика</span></button>
      </div>

      <div id="profileTabContent" class="profile-empty2 exact-empty">
        <div>
          <div class="profile-empty-icon">${ico('post',62)}</div>
          <h3>Пока нет публикаций</h3>
          <p>Когда вы что-то опубликуете, это появится здесь</p>
        </div>
      </div>

      <div class="skin-card exact-skin">
        <button class="skin-head" id="skinHeader"><span class="skin-title-icon">${ico('image',20)}</span><b>Скин профиля</b><span class="skin-arrow">›</span></button>
        <div class="skin-body">
          <div class="skin-placeholder">
            <div class="big">${ico('image',58)}</div>
            <div>У вас пока нет скина профиля</div>
            <div class="skin-subtext">Вы можете установить скин из своего инвентаря</div>
            <button id="chooseSkin">Выбрать скин</button>
          </div>
        </div>
      </div>
    </section>
  </div>

  <nav class="profile-bottom2 exact-bottom">
    <button class="profile-nav2" data-route="home"><span class="ico">${ico('home',25)}</span><span>Главная</span></button>
    <button class="profile-nav2" data-route="friends"><span class="ico">${ico('friends',25)}</span><span>Друзья</span></button>
    <button class="profile-nav2" data-route="chats"><span class="ico">${ico('chat',25)}</span><span>Чаты</span></button>
    <button class="profile-nav2" data-route="communities"><span class="ico">${ico('community',25)}</span><span>Сообщества</span></button>
    <button class="profile-nav2 active" data-route="profile"><span class="ico">${ico('profile',25)}</span><span>Профиль</span></button>
  </nav>`;

  appEl.innerHTML=`<div class="app-shell">${content}</div>`;
  $("#brand2").onclick=handleBrandClick;
  $("#profileSettings").onclick=()=>settings();
  $("#profileNotify").onclick=()=>toast("Уведомления — скоро");
  $("#profileMore").onclick=()=>toast("Дополнительные действия — скоро");
  $("#avatarEdit").onclick=()=>toast(isDev?"Аватар разработчика закреплён":"Загрузка аватарки — добавим после финальной вёрстки");
  $("#edit").onclick=()=>editProfile();
  $("#editBio").onclick=()=>editProfile();
  $("#copyUsername").onclick=async()=>{try{await navigator.clipboard.writeText("@"+(p.username||""));toast("Username скопирован")}catch{}};
  $("#copyGameId").onclick=async()=>{try{await navigator.clipboard.writeText(String(p.gameId||""));toast("ID скопирован")}catch{}};
  $("#share").onclick=()=>openProfileShare();
  $("#chooseSkin").onclick=()=>toast("Выбор скина — добавим после финальной вёрстки");
  $("#skinHeader").onclick=()=>toast("Скины профиля — в разработке");

  document.querySelectorAll("[data-ptab]").forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll("[data-ptab]").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    const type=btn.dataset.ptab, box=$("#profileTabContent");
    const data={
      posts:[ico('post',62),"Пока нет публикаций","Когда вы что-то опубликуете, это появится здесь"],
      inventory:[ico('inventory',62),"Инвентарь пуст","Здесь будут ваши предметы и скины"],
      achievements:[ico('star',62),"Пока нет достижений","Здесь появятся полученные достижения"],
      stats:[ico('chart',62),"Статистика пока пуста","Статистика будет собираться по мере активности"]
    }[type];
    box.innerHTML=`<div><div class="profile-empty-icon">${data[0]}</div><h3>${data[1]}</h3><p>${data[2]}</p></div>`;
  });

  document.querySelectorAll(".profile-nav2[data-route]").forEach(b=>b.onclick=()=>{
    state.route=b.dataset.route;state.chatUid=null;render();
  });
}

async function openProfileShare(){
  const snap=await get(ref(db,`friends/${state.user.uid}`));
  const ids=snap.exists()?Object.keys(snap.val()):[];
  const modal=document.createElement("div");
  modal.className="share-modal";
  modal.innerHTML=`<div class="share-sheet">
    <div class="share-head"><div><b>Поделиться профилем</b><span>Выберите друзей, которым отправить профиль в чат</span></div><button id="closeShare">×</button></div>
    <div id="shareFriends" class="share-friends"></div>
    <div class="share-actions">
      <button class="secondary" id="copyProfileLink">Копировать ссылку</button>
      <button class="primary" id="sendProfileShare">Отправить</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  const list=$("#shareFriends",modal);

  if(!ids.length){
    list.innerHTML=`<div class="share-empty">У тебя пока нет друзей. Добавь друзей, чтобы отправлять им профиль в чаты.</div>`;
  }else{
    let html="";
    for(const uid of ids){
      const s=await get(ref(db,`users/${uid}`));
      if(s.exists()){
        const f=s.val();
        html+=`<label class="share-friend"><input type="checkbox" value="${esc(uid)}"><span class="share-avatar">${avatar(f)}</span><span><b>${esc(f.displayName||"")}</b><small>@${esc(f.username||"")}</small></span><i>✓</i></label>`;
      }
    }
    list.innerHTML=html||`<div class="share-empty">Друзья не найдены.</div>`;
  }

  $("#closeShare",modal).onclick=()=>modal.remove();
  modal.onclick=e=>{if(e.target===modal)modal.remove()};
  $("#copyProfileLink",modal).onclick=async()=>{
    const url=new URL(location.href);
    url.searchParams.set("profile",state.user.uid);
    try{await navigator.clipboard.writeText(url.toString());toast("Ссылка на профиль скопирована")}catch{toast("Скопируй ссылку из адресной строки")};
  };
  $("#sendProfileShare",modal).onclick=async()=>{
    const selected=[...modal.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value);
    if(!selected.length)return toast("Выбери хотя бы одного друга");
    const profileData={uid:state.user.uid,displayName:state.profile.displayName||"",username:state.profile.username||"",gameId:state.profile.gameId||"",avatar:state.profile.avatar||""};
    const now=Date.now();
    for(const uid of selected){
      const key=[state.user.uid,uid].sort().join("_");
      await push(ref(db,`chats/${key}/messages`),{
        uid:state.user.uid,type:"profileShare",profile:profileData,createdAt:now
      });
      await update(ref(db),{
        [`chatIndex/${state.user.uid}/${uid}`]:{updatedAt:now},
        [`chatIndex/${uid}/${state.user.uid}`]:{updatedAt:now}
      });
    }
    modal.remove();
    toast(`Профиль отправлен: ${selected.length}`);
  };
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
