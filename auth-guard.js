// ============================================================
// auth-guard.js — protects every internal page
// Handles: login requirement, 1-minute auto-lock, single active
// session enforcement, logout, sidebar active-link highlighting.
// ============================================================
import {
  auth, db, signOut, onAuthStateChanged,
  doc, getDoc, setDoc, onSnapshot, serverTimestamp
} from './firebase-config.js';

const IDLE_LIMIT_MS = 60 * 1000; // 1 minute, per flowchart Detail B
let idleTimer = null;
let sessionUnsub = null;
let localSessionToken = sessionStorage.getItem('hs_session_token') || null;

function genToken(){
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

function buildLockOverlay(){
  if (document.getElementById('lockOverlay')) return;
  const el = document.createElement('div');
  el.id = 'lockOverlay';
  el.className = 'lock-overlay';
  el.innerHTML = `
    <div class="splash-seal" style="width:100px;height:100px;margin-bottom:22px;">
      <div class="seal-face"><span class="initials">HS</span><span class="sub">LOCKED</span></div>
      <div class="seal-face back"><span class="initials">HS</span><span class="sub">LOCKED</span></div>
    </div>
    <h2 style="color:#fff;">Session Locked</h2>
    <p style="color:#B5D4F4;max-width:320px;">1 minute of inactivity was detected. Please sign in again to continue.</p>
    <button class="btn btn-primary" id="lockReloginBtn" style="margin-top:16px;">Go to Login</button>
  `;
  document.body.appendChild(el);
  document.getElementById('lockReloginBtn').addEventListener('click', doAutoLock);
}

async function doAutoLock(){
  clearTimeout(idleTimer);
  if (sessionUnsub) sessionUnsub();
  sessionStorage.removeItem('hs_session_token');
  sessionStorage.removeItem('hs_last_activity');
  try { await signOut(auth); } catch(e){}
  window.location.href = 'index.html?locked=1';
}

function resetIdleTimer(){
  sessionStorage.setItem('hs_last_activity', Date.now().toString());
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    const overlay = document.getElementById('lockOverlay');
    if (overlay) overlay.classList.add('show');
    setTimeout(doAutoLock, 900);
  }, IDLE_LIMIT_MS);
}

function armActivityListeners(){
  ['click','keydown','mousemove','scroll','touchstart'].forEach(evt=>{
    window.addEventListener(evt, resetIdleTimer, { passive:true });
  });
  resetIdleTimer();
}

async function claimSingleSession(user){
  // Writes a fresh session token; any other open tab/device listening
  // on this doc will see the mismatch and be signed out automatically.
  const existing = sessionStorage.getItem('hs_session_token');
  const lastActivity = Number(sessionStorage.getItem('hs_last_activity') || 0);
  const withinIdleWindow = existing && (Date.now() - lastActivity) < IDLE_LIMIT_MS;

  const ref = doc(db, 'sessions', user.uid);

  if (withinIdleWindow) {
    // Reload within the active window: resume without forcing a new token,
    // so we don't kick our own tab out.
    localSessionToken = existing;
  } else {
    localSessionToken = genToken();
    sessionStorage.setItem('hs_session_token', localSessionToken);
  }

  await setDoc(ref, {
    token: localSessionToken,
    updatedAt: serverTimestamp(),
    email: user.email || ''
  }, { merge: true });

  sessionUnsub = onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;
    const remoteToken = snap.data().token;
    if (remoteToken && localSessionToken && remoteToken !== localSessionToken) {
      // Someone logged in elsewhere — only one active session allowed.
      signOut(auth).finally(() => {
        sessionStorage.removeItem('hs_session_token');
        window.location.href = 'index.html?kicked=1';
      });
    }
  });
}

function renderTopbarUser(user){
  const pill = document.querySelector('[data-session-pill]');
  if (!pill) return;
  const email = user.email || 'Admin';
  const initial = email.charAt(0).toUpperCase();
  pill.innerHTML = `
    <div class="avatar">${initial}</div>
    <div>
      <div style="font-weight:600;color:var(--ink)">${email}</div>
      <div>Administrator</div>
    </div>
    <button class="btn btn-outline btn-sm" id="logoutBtn" style="margin-left:10px;">Logout</button>
  `;
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    clearTimeout(idleTimer);
    if (sessionUnsub) sessionUnsub();
    sessionStorage.removeItem('hs_session_token');
    sessionStorage.removeItem('hs_last_activity');
    await signOut(auth);
    window.location.href = 'index.html';
  });
}

function highlightActiveNav(){
  const current = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    if (a.getAttribute('href') === current) a.classList.add('active');
  });
  const toggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (toggle && sidebar){
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}

/**
 * Call on every protected page. Resolves with the authenticated user,
 * or redirects to the login/splash screen if not authenticated.
 */
export function requireAuth(){
  buildLockOverlay();
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user){
        window.location.href = 'index.html';
        return;
      }
      await claimSingleSession(user);
      armActivityListeners();
      renderTopbarUser(user);
      highlightActiveNav();
      document.querySelectorAll('.app-shell').forEach(el => el.classList.add('ready'));
      resolve(user);
    });
  });
}

export function showToast(message, type = ''){
  let toast = document.getElementById('appToast');
  if (!toast){
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = 'toast show ' + type;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3200);
}
