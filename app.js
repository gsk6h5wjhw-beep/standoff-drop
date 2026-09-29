import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { ref, get, set, update, push, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { auth, provider, db } from "./firebase-config.js";

const VERSION = "0.1.0";
const DEV_CODE = "5568228666007";
const app = document.querySelector("#app");
const toast = document.querySelector("#toast");

const defaults = {
  theme: "dark",
  accent: "purple",
  language: "ru",
  fontSize: "medium",
  background: "aurora"
};

const accents = {
  purple: "#8b5cf6",
  pink: "#ec4899",
  red: "#ef4444",
  green: "#22c55e",
  yellow: "#eab308",
  blue: "#3b82f6"
};

const i18n = {
  ru: {
    loginTitle:"Социальная сеть для игроков", loginSub:"Общайся, находи тиммейтов и делись моментами.",
    google:"Войти с Google", setupTitle:"Добро пожаловать в StandLink!",
    setupSub:"Заполни профиль — эти данные будут видны другим игрокам.",
    name:"Имя / ник", username:"Юзернейм", gameId:"Игровой ID Standoff 2",
    bio:"Описание", avatar:"Аватар", continue:"Продолжить", enter:"Перейти в StandLink",
    appearance:"Оформление", theme:"Тема", light:"Светлая", dark:"Тёмная", auto:"Авто",
    accent:"Акцентный цвет", language:"Язык", background:"Фон", save:"Сохранить",
    home:"Главная", friends:"Друзья", chats:"Чаты", communities:"Сообщества", profile:"Профиль",
    posts:"Посты", media:"Медиа", clips:"Клипы", edit:"Редактировать профиль",
    history:"История", saved:"Сохранённое", achievements:"Достижения",
    online:"В сети", offline:"Не в сети", subscribers:"Подписчики", following:"Подписки",
    search:"Поиск", settings:"Настройки", general:"Общие настройки", logout:"Выйти из аккаунта",
    version:"Версия", requests:"Заявки", onlineNow:"Все в сети", invite:"Пригласить",
    noChats:"Здесь пока нет чатов.", noFriends:"Найди игроков по юзернейму.",
    developer:"Введите код разработчика", mediaSoon:"Медиафайлы — скоро",
    inviteTitle:"Пригласить играть", competitive:"Соревновательный", duo:"Напарники", custom:"Кастомная",
    send:"Отправить", cancel:"Отмена", find:"Найти игрока", createPost:"Что нового?"
  },
  en: {
    loginTitle:"A social network for players", loginSub:"Chat, find teammates and share moments.",
    google:"Continue with Google", setupTitle:"Welcome to StandLink!",
    setupSub:"Complete your profile — other players will see this information.",
    name:"Display name", username:"Username", gameId:"Standoff 2 Player ID",
    bio:"Bio", avatar:"Avatar", continue:"Continue", enter:"Enter StandLink",
    appearance:"Appearance", theme:"Theme", light:"Light", dark:"Dark", auto:"Auto",
    accent:"Accent color", language:"Language", background:"Background", save:"Save",
    home:"Home", friends:"Friends", chats:"Chats", communities:"Communities", profile:"Profile",
    posts:"Posts", media:"Media", clips:"Clips", edit:"Edit profile",
    history:"History", saved:"Saved", achievements:"Achievements",
    online:"Online", offline:"Offline", subscribers:"Followers", following:"Following",
    search:"Search", settings:"Settings", general:"General settings", logout:"Sign out",
    version:"Version", requests:"Requests", onlineNow:"Online now", invite:"Invite",
    noChats:"No chats yet.", noFriends:"Find players by username.",
    developer:"Enter developer code", mediaSoon:"Media files — coming soon",
    inviteTitle:"Invite to play", competitive:"Competitive", duo:"Duo", custom:"Custom",
    send:"Send", cancel:"Cancel", find:"Find player", createPost:"What's new?"
  }
};

let state = {
  user: null,
  profile: null,
  route: "home",
  setupStep: 1,
  settings: loadSettings(),
  search: "",
  friends: [],
  chats: [],
  posts: []
};

function loadSettings() {
  try { return {...defaults, ...(JSON.parse(localStorage.getItem("standlink_settings")) || {})}; }
  catch { return {...defaults}; }
}
function saveSettings() {
  localStorage.setItem("standlink_settings", JSON.stringify(state.settings));
  applyAppearance();
}
function t(key) { return (i18n[state.settings.language] || i18n.ru)[key] || key; }
function esc(v="") { return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function toastMsg(msg) {
  toast.textContent = msg; toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"), 2200);
}
function applyAppearance() {
  document.documentElement.style.setProperty("--accent", accents[state.settings.accent] || accents.purple);
  document.documentElement.dataset.theme = state.settings.theme;
  document.documentElement.dataset.font = state.settings.fontSize;
  document.documentElement.dataset.bg = state.settings.background;
  document.documentElement.lang = state.settings.language;
}

async function loadProfile(uid) {
  const snap = await get(ref(db, `profiles/${uid}`));
  return snap.exists() ? snap.val() : null;
}

function avatarHTML(profile, cls="avatar") {
  const letter = esc((profile?.name || profile?.username || "?").slice(0,1).toUpperCase());
  return `<div class="${cls}">${profile?.avatar ? `<img src="${esc(profile.avatar)}">` : letter}</div>`;
}

function render() {
  applyAppearance();
  if (!state.user) return renderLogin();
  if (!state.profile) return renderSetup();
  if (state.setupStep === 2) return renderAppearanceSetup();
  renderShell();
}

function renderLogin() {
  app.innerHTML = `
    <main class="auth-page">
      <div class="auth-glow"></div>
      <section class="auth-card glass">
        <div class="brand">Stand<span>Link</span></div>
        <div class="brand-mark">S</div>
        <h1>${t("loginTitle")}</h1>
        <p>${t("loginSub")}</p>
        <button id="googleLogin" class="primary google-btn">
          <span class="google-icon">G</span>${t("google")}
        </button>
        <div class="auth-foot">StandLink · ${VERSION}</div>
      </section>
    </main>`;
  document.querySelector("#googleLogin").onclick = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch(e) {
      console.error(e);
      toastMsg(e.code === "auth/popup-blocked" ? "Разреши всплывающие окна для сайта." : "Не удалось войти через Google.");
    }
  };
}

function renderSetup() {
  const p = state.profile || {};
  app.innerHTML = `
    <main class="onboard">
      <div class="onboard-top"><div class="brand small">Stand<span>Link</span></div><div class="step">1 / 2</div></div>
      <section class="onboard-card glass">
        <div class="setup-avatar-wrap">
          ${avatarHTML({name:p.name || state.user?.displayName}, "avatar xl")}
          <button id="randomAvatar" class="avatar-edit">↻</button>
        </div>
        <h1>${t("setupTitle")}</h1>
        <p>${t("setupSub")}</p>
        <label>${t("name")}<input id="name" value="${esc(p.name || state.user?.displayName || "")}" maxlength="32" placeholder="Например, VireM"></label>
        <label>${t("username")}<input id="username" value="${esc(p.username || "")}" maxlength="24" placeholder="@username"></label>
        <label>${t("gameId")}<input id="gameId" value="${esc(p.gameId || "")}" maxlength="32" placeholder="123456789"></label>
        <label>${t("bio")}<textarea id="bio" maxlength="160" placeholder="Расскажи немного о себе...">${esc(p.bio || "")}</textarea></label>
        <button id="setupNext" class="primary">${t("continue")} <span>→</span></button>
        <button id="changeLang" class="text-btn">${state.settings.language === "ru" ? "English" : "Русский"}</button>
      </section>
    </main>`;
  document.querySelector("#randomAvatar").onclick = () => {
    const emojis = ["🎮","🔥","⚡","🎯","🦊","🐺","👾","💜","🧊","🌙"];
    const e = emojis[Math.floor(Math.random()*emojis.length)];
    const a = document.querySelector(".setup-avatar-wrap .avatar");
    a.textContent = e; a.dataset.emoji = e;
  };
  document.querySelector("#changeLang").onclick = () => { state.settings.language = state.settings.language === "ru" ? "en" : "ru"; saveSettings(); render(); };
  document.querySelector("#setupNext").onclick = async () => {
    const name = document.querySelector("#name").value.trim();
    const username = document.querySelector("#username").value.trim().replace(/^@/,"").toLowerCase();
    const gameId = document.querySelector("#gameId").value.trim();
    const bio = document.querySelector("#bio").value.trim();
    if (!name || !username || !gameId) return toastMsg("Заполни имя, юзернейм и игровой ID.");
    if (!/^[a-z0-9._-]{3,24}$/.test(username)) return toastMsg("Юзернейм: 3–24 символа, латиница, цифры, ., _ или -.");
    const taken = await get(query(ref(db,"profiles"), orderByChild("username"), equalTo(username)));
    if (taken.exists() && !taken.child(state.user.uid).exists()) return toastMsg("Этот юзернейм уже занят.");
    const avatar = document.querySelector(".setup-avatar-wrap .avatar")?.dataset.emoji || "";
    state.profile = {name, username, gameId, bio, avatar, createdAt: Date.now(), online:true};
    await set(ref(db, `profiles/${state.user.uid}`), {...state.profile, email: state.user.email || "", photoURL: state.user.photoURL || ""});
    state.setupStep = 2; render();
  };
}

function renderAppearanceSetup() {
  app.innerHTML = `
    <main class="onboard">
      <div class="onboard-top"><div class="brand small">Stand<span>Link</span></div><div class="step">2 / 2</div></div>
      <section class="onboard-card glass">
        <h1>${t("appearance")}</h1>
        <p>Выбери оформление. Его всегда можно изменить в настройках.</p>
        ${appearanceControls()}
        <button id="enter" class="primary">${t("enter")} <span>→</span></button>
      </section>
    </main>`;
  bindAppearanceControls();
  document.querySelector("#enter").onclick = () => { state.route = "profile"; render(); };
}

function appearanceControls() {
  return `
  <div class="control-group"><h3>${t("theme")}</h3><div class="segmented">
    ${["light","dark","auto"].map(x=>`<button data-theme="${x}" class="${state.settings.theme===x?"selected":""}">${t(x)}</button>`).join("")}
  </div></div>
  <div class="control-group"><h3>${t("accent")}</h3><div class="color-row">
    ${Object.entries(accents).map(([k,c])=>`<button class="color-dot ${state.settings.accent===k?"selected":""}" data-accent="${k}" style="--dot:${c}" aria-label="${k}"></button>`).join("")}
  </div></div>
  <div class="control-group"><h3>${t("language")}</h3><div class="segmented">
    <button data-lang="ru" class="${state.settings.language==="ru"?"selected":""}">Русский</button>
    <button data-lang="en" class="${state.settings.language==="en"?"selected":""}">English</button>
  </div></div>`;
}
function bindAppearanceControls() {
  document.querySelectorAll("[data-theme]").forEach(b=>b.onclick=()=>{state.settings.theme=b.dataset.theme;saveSettings();renderAppearanceSetup();});
  document.querySelectorAll("[data-accent]").forEach(b=>b.onclick=()=>{state.settings.accent=b.dataset.accent;saveSettings();renderAppearanceSetup();});
  document.querySelectorAll("[data-lang]").forEach(b=>b.onclick=()=>{state.settings.language=b.dataset.lang;saveSettings();renderAppearanceSetup();});
}

function renderShell() {
  const content = {
    home: renderHome,
    friends: renderFriends,
    chats: renderChats,
    communities: renderCommunities,
    profile: renderProfile
  }[state.route] || renderHome;

  app.innerHTML = `
    <div class="site">
      <header class="topbar">
        <button id="brandHome" class="brand-button">Stand<span>Link</span></button>
        <div class="top-actions">
          ${state.route !== "profile" ? `<button id="searchBtn" class="icon-btn" aria-label="${t("search")}">⌕</button>` : ""}
          ${state.route === "profile" ? `<button id="settingsBtn" class="icon-btn">⚙</button>` : ""}
          ${avatarHTML(state.profile)}
        </div>
      </header>
      <main class="page">${content()}</main>
      <nav class="bottom-nav">
        ${navItem("home","⌂",t("home"))}
        ${navItem("friends","♧",t("friends"))}
        ${navItem("chats","◌",t("chats"))}
        ${navItem("communities","◈",t("communities"))}
        ${navItem("profile","◎",t("profile"))}
      </nav>
    </div>`;
  document.querySelector("#brandHome").onclick = () => { state.route="home"; state.search=""; render(); };
  document.querySelectorAll("[data-route]").forEach(x=>x.onclick=()=>{state.route=x.dataset.route;render();});
  document.querySelector("#searchBtn")?.addEventListener("click", openSearch);
  document.querySelector("#settingsBtn")?.addEventListener("click", openSettings);
}
function navItem(route,icon,label){return `<button data-route="${route}" class="nav-item ${state.route===route?"active":""}"><span>${icon}</span><small>${label}</small></button>`;}

function renderHome() {
  return `<section class="feed">
    <div class="welcome-row"><div><span class="eyebrow">STANDLINK</span><h1>Твоя игровая лента</h1></div><button class="round-btn">✦</button></div>
    <div class="composer glass"><div class="composer-top">${avatarHTML(state.profile)}<input id="fakeComposer" placeholder="${t("createPost")}"></div></div>
    ${demoPosts()}
  </section>`;
}
function demoPosts() {
  const posts = [
    ["VireM","🎯","Кто сегодня в напарники? ID оставил в профиле.","2 мин назад","24"],
    ["NightFox","🔥","Наконец-то выбил скин, который хотел.","18 мин назад","51"],
    ["Kira","💜","Кто-нибудь хочет собрать кастомную игру вечером?","42 мин назад","17"]
  ];
  return posts.map((p,i)=>`<article class="post glass">
    <div class="post-head">${avatarHTML({name:p[0]})}<div><b>${p[0]}</b><span>@${p[0].toLowerCase()} · ${p[3]}</span></div><button class="more">•••</button></div>
    <p>${esc(p[2])}</p><div class="post-visual visual-${i}">${p[1]}</div>
    <div class="post-actions"><button>♡ ${p[4]}</button><button>◌ ${i+3}</button><button>↗</button></div>
  </article>`).join("");
}
function renderFriends() {
  return `<section><div class="section-head"><div><span class="eyebrow">SOCIAL</span><h1>${t("friends")}</h1></div><button class="round-btn" id="friendSearch">⌕</button></div>
    <div class="tabs"><button class="active">${t("requests")} <b>0</b></button><button>${t("onlineNow")}</button><button>${t("friends")}</button></div>
    <div class="empty glass">${avatarHTML({name:"+"},"avatar empty-avatar")}<h3>${t("find")}</h3><p>${t("noFriends")}</p><button id="friendSearch2" class="primary small-btn">${t("search")}</button></div>
  </section>`;
}
function renderChats() {
  return `<section><div class="section-head"><div><span class="eyebrow">MESSAGES</span><h1>${t("chats")}</h1></div><button class="round-btn" id="chatSearch">⌕</button></div>
    <div class="chat-list">
      <div class="empty glass">${avatarHTML({name:"+"},"avatar empty-avatar")}<h3>${t("noChats")}</h3><p>Найди игрока через поиск, чтобы начать переписку.</p><button id="chatSearch2" class="primary small-btn">${t("search")}</button></div>
    </div>`;
}
function renderCommunities() {
  const communities = [
    ["Standoff 2","Новости, игроки и обсуждения","🎮","12.4K"],
    ["Кастомные игры","Собираем команды для кастомок","⚔️","3.8K"],
    ["Скины и трейд","Обсуждаем коллекции и обмен","💎","8.1K"]
  ];
  return `<section><div class="section-head"><div><span class="eyebrow">COMMUNITY</span><h1>${t("communities")}</h1></div><button class="round-btn" id="communitySearch">⌕</button></div>
    ${communities.map(c=>`<article class="community glass"><div class="community-icon">${c[2]}</div><div><b>${c[0]}</b><p>${c[1]}</p><span>${c[3]} участников</span></div><button class="ghost-btn">→</button></article>`).join("")}
  </section>`;
}
function renderProfile() {
  const p=state.profile;
  return `<section class="profile-page">
    <div class="profile-hero glass">
      ${avatarHTML(p,"avatar profile-avatar")}
      <h1>${esc(p.name)}</h1><div class="username">@${esc(p.username)}</div><div class="game-id">ID ${esc(p.gameId)}</div>
      <p>${esc(p.bio || "Игрок Standoff 2")}</p><span class="online-dot">● ${p.online===false?t("offline"):t("online")}</span>
      <div class="stats"><div><b>0</b><span>${t("posts")}</span></div><div><b>0</b><span>${t("subscribers")}</span></div><div><b>0</b><span>${t("following")}</span></div></div>
      <button id="editProfile" class="primary wide">${t("edit")}</button>
    </div>
    <div class="profile-shortcuts"><button>${t("history")}<span>›</span></button><button>${t("saved")}<span>›</span></button><button>${t("achievements")}<span>›</span></button></div>
    <div class="tabs profile-tabs"><button class="active">${t("posts")}</button><button>${t("media")}</button><button>${t("clips")}</button></div>
    <div class="empty profile-empty glass"><div class="empty-icon">✦</div><h3>Здесь появятся твои посты</h3><p>Создай первый пост, когда будешь готов.</p></div>
  </section>`;
}

function openSearch() {
  const mode = state.route === "communities" ? "communities" : "people";
  const title = mode==="communities" ? "Поиск сообществ" : "Поиск игроков";
  app.insertAdjacentHTML("beforeend", `<div class="modal-backdrop" id="searchModal"><div class="modal glass"><div class="modal-head"><h2>${title}</h2><button id="closeModal">×</button></div><input id="searchInput" autofocus placeholder="${mode==="communities"?"Название сообщества":"@username"}"><div id="searchResults" class="results"></div></div></div>`);
  document.querySelector("#closeModal").onclick=()=>document.querySelector("#searchModal").remove();
  document.querySelector("#searchInput").oninput = async e => {
    const value=e.target.value.trim().replace(/^@/,"").toLowerCase();
    const out=document.querySelector("#searchResults");
    if(!value){out.innerHTML="";return;}
    if(mode==="communities"){out.innerHTML=`<div class="result glass">${t("noFriends")}</div>`;return;}
    const snap=await get(query(ref(db,"profiles"), orderByChild("username"), equalTo(value)));
    if(!snap.exists()){out.innerHTML=`<div class="result glass">Игрок не найден</div>`;return;}
    const obj=Object.entries(snap.val())[0], uid=obj[0], p=obj[1];
    out.innerHTML=`<div class="result glass">${avatarHTML(p)}<div><b>${esc(p.name)}</b><span>@${esc(p.username)} · ID ${esc(p.gameId)}</span></div><button id="addFriend" class="primary mini">+ Добавить</button></div>`;
    document.querySelector("#addFriend").onclick=async()=>{await set(ref(db,`friendRequests/${uid}/${state.user.uid}`),{from:state.user.uid,createdAt:Date.now(),status:"pending"});toastMsg("Заявка отправлена");};
  };
}
function openSettings() {
  app.insertAdjacentHTML("beforeend", `<div class="modal-backdrop" id="settingsModal"><div class="modal glass settings-modal"><div class="modal-head"><h2>${t("settings")}</h2><button id="closeSettings">×</button></div><h3>${t("general")}</h3>${appearanceControls()}<button id="devTap" class="developer-trigger">StandLink</button><div class="settings-bottom"><span>${t("version")} ${VERSION}</span><button id="logout" class="danger">${t("logout")}</button></div></div></div>`);
  bindAppearanceControls();
  document.querySelector("#closeSettings").onclick=()=>document.querySelector("#settingsModal").remove();
  document.querySelector("#logout").onclick=async()=>{await signOut(auth);};
  let taps=0, timer;
  document.querySelector("#devTap").onclick=()=>{
    taps++; clearTimeout(timer); timer=setTimeout(()=>taps=0,1400);
    if(taps>=24){taps=0; openDeveloperCode();}
  };
}
function openDeveloperCode(){
  document.querySelector("#settingsModal")?.remove();
  app.insertAdjacentHTML("beforeend", `<div class="modal-backdrop" id="devModal"><div class="modal glass"><div class="modal-head"><h2>${t("developer")}</h2><button id="closeDev">×</button></div><input id="devCode" inputmode="numeric" placeholder="•••••••••••••"><button id="saveDev" class="primary">${t("save")}</button></div></div>`);
  document.querySelector("#closeDev").onclick=()=>document.querySelector("#devModal").remove();
  document.querySelector("#saveDev").onclick=()=>{
    if(document.querySelector("#devCode").value===DEV_CODE){localStorage.setItem("standlink_verified","1");toastMsg("✓ Вы официальный разработчик StandLink");document.querySelector("#devModal").remove();}
    else toastMsg("Неверный код.");
  };
}

onAuthStateChanged(auth, async user => {
  state.user=user;
  if(user){
    state.profile=await loadProfile(user.uid);
    if(state.profile) state.setupStep=0;
  } else { state.profile=null; state.setupStep=1; }
  render();
});
applyAppearance();
