// ANW Curator — service worker.
// Owns the actual network calls so popup/context-menu/keyboard paths share one
// code path with real error handling (host_permissions means no `no-cors`).

const API_BASE = "https://api.actionnetwork.world";
const CURATED_ENDPOINT = `${API_BASE}/webhooks/curated`;
const TOKEN_CHECK_ENDPOINT = `${API_BASE}/v1/users/me/access-tokens`;

const CONTEXT_MENU_ID = "anw-send-selection";

async function getToken() {
  const { anwToken } = await chrome.storage.local.get("anwToken");
  return anwToken || null;
}

// POST a curation. Surfaces real 4xx/5xx bodies as Error messages.
async function submitCuration({ text, sourceUrl, note }) {
  const token = await getToken();
  if (!token) {
    throw new Error("No API token saved. Open Options and paste your anw_ token.");
  }

  let res;
  try {
    res = await fetch(CURATED_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, text, sourceUrl, note }),
    });
  } catch (networkErr) {
    throw new Error(`Network error reaching the API: ${networkErr.message}`);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body.message || body.error || JSON.stringify(body);
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(`Submission failed (${res.status}): ${detail || res.statusText}`);
  }

  const result = await res.json().catch(() => ({}));
  await recordSubmission(sourceUrl);
  return result;
}

// ---- Contribution tracking: daily badge counter + last-10 history --------

function localDay() {
  // Local calendar day so the counter resets at the curator's midnight.
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
}

async function setBadge(count) {
  await chrome.action.setBadgeBackgroundColor({ color: "#1d4ed8" });
  await chrome.action.setBadgeText({ text: count ? String(count) : "" });
}

// Transient status on the toolbar icon for background submits (context menu /
// keyboard), where no popup is open to show progress. Reverts to the daily
// count after `revertMs`. (Best-effort: a short timer may not fire if the
// service worker is torn down first; the next event re-syncs the badge.)
async function flashBadge(text, color, title, revertMs) {
  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setBadgeText({ text });
  if (title) await chrome.action.setTitle({ title });
  if (revertMs) {
    setTimeout(() => {
      refreshBadge();
      chrome.action.setTitle({ title: "Send to ANW Curator" });
    }, revertMs);
  }
}

// One submit path for all three triggers, with icon feedback + a result object.
async function runSubmit(payload) {
  await flashBadge("…", "#a16207", "ANW Curator — sending…"); // amber, pending
  try {
    const result = await submitCuration(payload); // sets count badge on success
    await flashBadge("✓", "#15803d", "ANW Curator — sent ✓", 2500);
    return { ok: true, result };
  } catch (err) {
    await flashBadge("!", "#b91c1c", `ANW Curator — failed: ${err.message}`, 5000);
    return { ok: false, error: err.message };
  }
}

// Reset the badge to today's count (0 → cleared) on startup / new day.
async function refreshBadge() {
  const { submitStats } = await chrome.storage.local.get("submitStats");
  const count = submitStats && submitStats.day === localDay() ? submitStats.count : 0;
  await setBadge(count);
}

async function recordSubmission(sourceUrl) {
  const today = localDay();
  const { submitStats, history } = await chrome.storage.local.get([
    "submitStats",
    "history",
  ]);

  const stats =
    submitStats && submitStats.day === today
      ? { day: today, count: submitStats.count + 1 }
      : { day: today, count: 1 };

  let domain = "";
  try {
    domain = new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    /* sourceUrl may be empty/odd — leave domain blank */
  }
  const list = [{ ts: Date.now(), domain }, ...(history || [])].slice(0, 10);

  await chrome.storage.local.set({ submitStats: stats, history: list });
  await setBadge(stats.count);
}

// Validate a token without submitting anything (used by Options "Test token").
async function testToken(token) {
  if (!token || !token.startsWith("anw_")) {
    return { ok: false, error: "Token should start with \"anw_\"." };
  }
  let res;
  try {
    res = await fetch(TOKEN_CHECK_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (networkErr) {
    return { ok: false, error: `Network error: ${networkErr.message}` };
  }
  if (res.status === 200) return { ok: true };
  if (res.status === 401 || res.status === 403) {
    return { ok: false, error: "Token rejected (401/403). Check you copied the full token." };
  }
  return { ok: false, error: `Unexpected response: ${res.status} ${res.statusText}` };
}

function notify(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon-128.png",
    title,
    message: String(message).slice(0, 300),
  });
}

// Read the active tab's current text selection (returns "" if none/blocked).
async function readSelection(tabId) {
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.getSelection().toString(),
    });
    return (result || "").trim();
  } catch {
    return "";
  }
}

// ---- Wiring -------------------------------------------------------------

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Send selection to ANW",
    contexts: ["selection"],
  });
  refreshBadge();
});

// Re-sync the badge when the browser (re)starts — clears a stale prior-day count.
chrome.runtime.onStartup.addListener(refreshBadge);

// Messages from popup / options.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "submit") {
    runSubmit(msg.payload).then(sendResponse);
    return true; // keep channel open for async response
  }
  if (msg?.type === "testToken") {
    testToken(msg.token).then(sendResponse);
    return true;
  }
});

// Right-click on a selection → direct submit with toast feedback.
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) return;
  const r = await runSubmit({
    text: info.selectionText,
    sourceUrl: info.pageUrl || tab?.url,
    note: "",
  });
  if (r.ok) notify("ANW Curator", "Selection sent ✓");
  else notify("ANW Curator — failed", r.error);
});

// Keyboard shortcut → grab selection from the active tab and submit.
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "send-selection") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const selection = await readSelection(tab.id);
  const r = await runSubmit({ text: selection, sourceUrl: tab.url, note: "" });
  if (r.ok) notify("ANW Curator", selection ? "Selection sent ✓" : "Page sent ✓");
  else notify("ANW Curator — failed", r.error);
});
