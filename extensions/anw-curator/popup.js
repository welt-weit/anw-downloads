// ANW Curator — popup. Fires on every toolbar click (review-before-send).

// Container hosts where the URL alone is useless — the curator must select the
// relevant text rather than send a bare app URL.
const CONTAINER_HOSTS = [
  "slack.com",
  "app.slack.com",
  "discord.com",
  "notion.so",
  "mail.google.com",
  "web.whatsapp.com",
  "teams.microsoft.com",
];

const els = {
  url: document.getElementById("url"),
  selection: document.getElementById("selection"),
  note: document.getElementById("note"),
  warn: document.getElementById("warn"),
  send: document.getElementById("send"),
  status: document.getElementById("status"),
  history: document.getElementById("history"),
};

let state = { url: "", selection: "" };

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function setStatus(text, kind) {
  els.status.textContent = text;
  els.status.className = "status" + (kind ? " " + kind : "");
}

function timeAgo(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + "h ago";
  return Math.round(h / 24) + "d ago";
}

// Last-10 submissions (domain + relative time). Built via DOM nodes, not
// innerHTML, so a hostile domain string can't inject markup.
async function renderHistory() {
  const { history } = await chrome.storage.local.get("history");
  els.history.replaceChildren();
  if (!history || !history.length) return;

  const label = document.createElement("div");
  label.className = "label";
  label.textContent = "Recent";
  els.history.appendChild(label);

  for (const h of history) {
    const row = document.createElement("div");
    row.className = "hist-row";
    const dom = document.createElement("span");
    dom.textContent = h.domain || "—";
    const ago = document.createElement("span");
    ago.className = "ago";
    ago.textContent = timeAgo(h.ts);
    row.append(dom, ago);
    els.history.appendChild(row);
  }
}

// Resolve to `fallback` if `promise` hasn't settled within `ms`.
function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function readSelection(tabId) {
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.getSelection().toString(),
    });
    return (result || "").trim();
  } catch {
    return ""; // restricted page (chrome://, web store, etc.)
  }
}

async function init() {
  // Nudge to Options if no token is saved yet.
  const { anwToken } = await chrome.storage.local.get("anwToken");
  if (!anwToken) {
    setStatus("", null);
    els.status.innerHTML =
      'No token saved. <span class="link" id="openOptions">Open Options</span> to add it.';
    document.getElementById("openOptions").addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
    els.send.disabled = true;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  state.url = tab?.url || "";
  els.url.textContent = state.url || "(unknown)";

  // Paint history immediately — it doesn't depend on the page.
  renderHistory();

  // Read the page selection, but never let a heavy page stall the popup:
  // fall back to "no selection" after a short timeout.
  state.selection = tab?.id
    ? await withTimeout(readSelection(tab.id), 1200, "")
    : "";
  if (state.selection) {
    els.selection.textContent = state.selection;
    els.selection.classList.remove("empty");
  }

  // Container-host guard: app URL + no selection = almost certainly junk.
  const host = hostOf(state.url);
  const isContainer = CONTAINER_HOSTS.some((h) => host === h || host.endsWith("." + h));
  if (isContainer && !state.selection) {
    els.warn.style.display = "block";
    els.warn.textContent =
      `${host} pages need a text selection — the bare URL won't be useful. Select the relevant text first.`;
    if (anwToken) els.send.disabled = true;
  }
}

els.send.addEventListener("click", async () => {
  els.send.disabled = true;
  setStatus("Sending…", null);
  const payload = {
    text: state.selection,
    sourceUrl: state.url,
    note: els.note.value.trim(),
  };
  const resp = await chrome.runtime.sendMessage({ type: "submit", payload });
  if (resp?.ok) {
    setStatus("Sent ✓", "good");
    setTimeout(() => window.close(), 800);
  } else {
    setStatus(resp?.error || "Unknown error.", "bad");
    els.send.disabled = false;
  }
});

init();
