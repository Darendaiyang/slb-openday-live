import { firebaseConfig, isFirebaseConfigured } from "../firebase-config.js";
import { matchJobsWithList, buildPersonalizedWish } from "./match.js";

const CONSENT_VERSION = "SLB-OD-PORTRAIT-2026-live-v1";
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "OTHER"];
const LS_COUNTER = "slb_live_reg_counter";
let memRegCounter = 0;

const $ = (id) => document.getElementById(id);

const state = {
  sessionId: null,
  registrationCode: null,
  shirtSize: null,
  name: null,
  useCloud: false,
  db: null,
  jobsList: [],
};

function show(el, on) {
  el.classList.toggle("hidden", !on);
}

function setErr(id, msg) {
  const n = $(id);
  if (!msg) {
    n.hidden = true;
    n.textContent = "";
    return;
  }
  n.hidden = false;
  n.textContent = msg;
}

async function loadJobs() {
  const url = new URL("../jobs.json", import.meta.url);
  const res = await fetch(url);
  if (!res.ok) throw new Error("无法加载岗位库 jobs.json");
  state.jobsList = await res.json();
}

async function initFirebase() {
  if (!isFirebaseConfigured()) {
    return null;
  }
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js");
  const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js");
  const app = initializeApp(firebaseConfig);
  return getFirestore(app);
}

function showModeBanner() {
  const b = $("mode-banner");
  b.classList.remove("hidden");
  if (state.useCloud) {
    b.className = "mode-banner ok";
    b.textContent =
      "已连接云端：多台手机扫码将共用同一登记流水号（R-001、R-002…）。数据保存在 Firebase，活动结束后可在控制台导出。";
  } else {
    b.className = "mode-banner warn";
    b.textContent =
      "单机演示模式：未配置 Firebase。登记号仅在本机有效，换手机不同步。若已配置 firebase-config.js 仍见此提示，请检查配置并刷新。";
  }
}

function nextLocalRegCode() {
  let n = 0;
  try {
    n = parseInt(localStorage.getItem(LS_COUNTER) || "0", 10);
  } catch {
    n = memRegCounter;
  }
  if (!Number.isFinite(n) || n < 0) n = 0;
  n += 1;
  memRegCounter = n;
  try {
    localStorage.setItem(LS_COUNTER, String(n));
  } catch {
    /* Teams / 隐私模式等可能禁用 localStorage */
  }
  return `R-${String(n).padStart(3, "0")}`;
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const rand = Math.random().toString(36).slice(2, 10);
  return `id-${Date.now()}-${rand}`;
}

function withTimeout(promise, ms, message) {
  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message || "请求超时")), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function submitCheckinCloud(finalSize) {
  const { doc, runTransaction, serverTimestamp } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
  );
  const checkinId = createId();
  const cRef = doc(state.db, "meta", "counter");
  const uRef = doc(state.db, "checkins", checkinId);
  let registrationCode = "";

  await runTransaction(state.db, async (t) => {
    const cs = await t.get(cRef);
    const csData = cs.exists ? cs.data() : null;
    const prev = csData && typeof csData.n === "number" ? csData.n : 0;
    const n = prev + 1;
    registrationCode = `R-${String(n).padStart(3, "0")}`;
    t.set(cRef, { n }, { merge: true });
    t.set(uRef, {
      name: state.name,
      shirtSize: finalSize,
      registrationCode,
      consentVersion: CONSENT_VERSION,
      createdAt: serverTimestamp(),
    });
  });

  return { id: checkinId, registrationCode, shirtSize: finalSize, name: state.name };
}

function submitCheckinLocal(finalSize) {
  const checkinId = createId();
  const registrationCode = nextLocalRegCode();
  return { id: checkinId, registrationCode, shirtSize: finalSize, name: state.name };
}

function switchToLocalMode(reason) {
  state.useCloud = false;
  state.db = null;
  const b = $("mode-banner");
  b.classList.remove("hidden");
  b.className = "mode-banner warn";
  b.textContent = `当前网络下云端写入不稳定，已自动切换为本机登记模式（${reason}）。如需全场连续编号，请切换网络后刷新重试。`;
}

async function saveProfileCloud(school, major, matches, wishMessage) {
  const { doc, updateDoc, serverTimestamp } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
  );
  await updateDoc(doc(state.db, "checkins", state.sessionId), {
    school,
    major,
    matches,
    wishMessage,
    profileAt: serverTimestamp(),
  });
}

function renderSizeGrid() {
  const grid = $("size-grid");
  grid.innerHTML = "";
  SIZE_OPTIONS.forEach((code) => {
    const label = document.createElement("label");
    label.className = "size-option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "shirtSize";
    input.value = code;
    input.required = true;
    const span = document.createElement("span");
    span.textContent = code === "OTHER" ? "其他" : code;
    label.appendChild(input);
    label.appendChild(span);
    grid.appendChild(label);
  });

  grid.addEventListener("change", () => {
    const picked = grid.querySelector('input[name="shirtSize"]:checked');
    const v = picked ? picked.value : "";
    show($("wrap-size-other"), v === "OTHER");
  });
}

function bindConsent() {
  $("consent-version-label").textContent = CONSENT_VERSION;
  $("consent-check").addEventListener("change", () => {
    $("consent-agree").disabled = !$("consent-check").checked;
  });
  $("consent-agree").addEventListener("click", () => {
    if (!$("consent-check").checked) return;
    show($("modal-consent"), false);
    show($("step-name"), true);
  });
}

function bindName() {
  $("form-name").addEventListener("submit", (e) => {
    e.preventDefault();
    setErr("err-name", "");
    const fd = new FormData(e.target);
    const name = String(fd.get("name") || "").trim();
    if (!name) {
      setErr("err-name", "请填写姓名");
      return;
    }
    state.name = name;
    show($("step-name"), false);
    show($("step-size"), true);
  });
}

function bindSize() {
  const form = $("form-size");
  const submitBtn = $("btn-submit-size");
  let sizeBusy = false;

  async function runSizeSubmit() {
    if (sizeBusy) return;
    sizeBusy = true;
    setErr("err-size", "");
    const fd = new FormData(form);
    const shirtSize = String(fd.get("shirtSize") || "").trim();
    const shirtSizeOther = String(fd.get("shirtSizeOther") || "").trim();
    if (!shirtSize) {
      setErr("err-size", "请选择领取尺码");
      sizeBusy = false;
      return;
    }
    if (!$("clothing-ack").checked) {
      setErr("err-size", "请勾选确认已与工作人员确认并完成领衣");
      sizeBusy = false;
      return;
    }

    let finalSize = shirtSize;
    if (shirtSize === "OTHER") {
      if (!shirtSizeOther) {
        setErr("err-size", "选择「其他」时请填写说明");
        sizeBusy = false;
        return;
      }
      finalSize = `其他:${shirtSizeOther}`;
    }

    submitBtn.disabled = true;
    try {
      let data;
      if (state.useCloud) {
        try {
          data = await withTimeout(submitCheckinCloud(finalSize), 8000, "云端提交超时");
        } catch (cloudErr) {
          switchToLocalMode(cloudErr.message || "云端不可用");
          data = submitCheckinLocal(finalSize);
        }
      } else {
        data = submitCheckinLocal(finalSize);
      }
      state.sessionId = data.id;
      state.registrationCode = data.registrationCode;
      state.shirtSize = data.shirtSize;

      $("reg-code-display").textContent = data.registrationCode;
      $("success-summary").innerHTML = `
        <div>姓名：<strong>${escapeHtml(data.name)}</strong></div>
        <div>登记尺码：<strong>${escapeHtml(data.shirtSize)}</strong></div>
        <div class="muted small" style="margin-top:8px">说明：尺码以你在现场实际领取为准；登记编号用于活动统计与核对。</div>
      `;

      show($("step-size"), false);
      show($("step-success"), true);
    } catch (err) {
      setErr("err-size", err.message || String(err));
    } finally {
      submitBtn.disabled = false;
      sizeBusy = false;
    }
  }

  window.__slbSubmitSize = function () {
    void runSizeSubmit();
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
  });
  /* 主入口：内联 onclick（index.html）+ 这里兜底，避免部分 WebView 不触发绑定 */
  submitBtn.addEventListener("click", () => {
    void runSizeSubmit();
  });
}

function bindSuccess() {
  $("btn-to-profile").addEventListener("click", () => {
    show($("step-success"), false);
    show($("step-profile"), true);
  });
}

function bindProfile() {
  $("form-profile").addEventListener("submit", async (e) => {
    e.preventDefault();
    setErr("err-profile", "");
    if (!state.sessionId) {
      setErr("err-profile", "会话失效，请刷新页面重新开始");
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);
    const school = String(fd.get("school") || "").trim();
    const major = String(fd.get("major") || "").trim();
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    submitBtn.disabled = true;
    try {
      const matches = matchJobsWithList(state.jobsList, school, major, 3);
      const wishMessage = buildPersonalizedWish({
        name: state.name,
        school,
        major,
        shirtSize: state.shirtSize,
        matches,
      });

      if (state.useCloud) {
        await saveProfileCloud(school, major, matches, wishMessage);
      }

      renderResults(matches, wishMessage);
      show($("step-profile"), false);
      show($("step-result"), true);
    } catch (err) {
      setErr("err-profile", err.message || String(err));
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function renderResults(matches, wishMessage) {
  $("result-source").textContent = state.useCloud
    ? "岗位来自本页同目录的 jobs.json；修改后推送到 GitHub 即可更新。数据已写入 Firebase。"
    : "岗位来自 jobs.json（单机模式）；登记数据未上传云端。";
  $("wish-text").textContent = wishMessage;

  const list = $("job-list");
  list.innerHTML = "";
  matches.forEach((m) => {
    const div = document.createElement("div");
    div.className = "job";
    div.innerHTML = `
      <h4>${escapeHtml(m.title)}</h4>
      <div class="job-meta">${escapeHtml(m.city)}</div>
      <p>${escapeHtml(m.jd)}</p>
    `;
    list.appendChild(div);
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initFooter() {
  $("footer-url").textContent = window.location.href.split("?")[0];
}

function initCustomBackground() {
  const key = "slb_custom_bg_image";
  const bg = new URLSearchParams(window.location.search).get("bg");
  try {
    if (bg) {
      localStorage.setItem(key, bg);
    }
  } catch {
    /* ignore */
  }
  let finalBg = bg || "";
  if (!finalBg) {
    try {
      finalBg = localStorage.getItem(key) || "";
    } catch {
      finalBg = "";
    }
  }
  if (!finalBg) return;
  document.documentElement.style.setProperty("--custom-bg-image", `url("${finalBg}")`);
}

async function boot() {
  initCustomBackground();
  renderSizeGrid();
  bindConsent();
  bindName();
  bindSize();
  bindSuccess();
  bindProfile();
  initFooter();

  try {
    await loadJobs();
  } catch (e) {
    $("mode-banner").className = "mode-banner warn";
    $("mode-banner").classList.remove("hidden");
    $("mode-banner").textContent =
      "无法加载 jobs.json，请确认通过 http 访问本目录（不要直接双击 file 打开）。";
    return;
  }

  try {
    state.db = await initFirebase();
  } catch (e) {
    state.db = null;
    $("mode-banner").className = "mode-banner warn";
    $("mode-banner").classList.remove("hidden");
    $("mode-banner").textContent = `Firebase 初始化失败：${e.message || e}。将使用单机模式。`;
  }
  state.useCloud = Boolean(state.db);
  showModeBanner();
}

boot();
