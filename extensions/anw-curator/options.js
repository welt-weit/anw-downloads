// ANW Curator — options page. Token entry, masked preview, validity check.

const tokenInput = document.getElementById("token");
const savedEl = document.getElementById("saved");
const statusEl = document.getElementById("status");

function mask(token) {
  if (!token) return "";
  if (token.length <= 12) return token.slice(0, 4) + "…";
  return token.slice(0, 8) + "…" + token.slice(-4);
}

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = "status" + (kind ? " " + kind : "");
}

async function showSaved() {
  const { anwToken } = await chrome.storage.local.get("anwToken");
  savedEl.textContent = anwToken
    ? `Saved token: ${mask(anwToken)}`
    : "No token saved yet.";
}

document.getElementById("save").addEventListener("click", async () => {
  const token = tokenInput.value.trim();
  if (!token) {
    setStatus("Enter a token first.", "bad");
    return;
  }
  if (!token.startsWith("anw_")) {
    setStatus('That doesn\'t look like an anw_ token — saving anyway, but double-check it.', "bad");
  }
  await chrome.storage.local.set({ anwToken: token });
  tokenInput.value = "";
  await showSaved();
  setStatus("Saved ✓", "good");
});

document.getElementById("test").addEventListener("click", async () => {
  // Test the field value if typed, otherwise the saved token.
  let token = tokenInput.value.trim();
  if (!token) {
    ({ anwToken: token } = await chrome.storage.local.get("anwToken"));
  }
  if (!token) {
    setStatus("Nothing to test — enter or save a token first.", "bad");
    return;
  }
  setStatus("Testing…", null);
  const resp = await chrome.runtime.sendMessage({ type: "testToken", token });
  if (resp?.ok) {
    setStatus("Token is valid ✓", "good");
  } else {
    setStatus(resp?.error || "Token check failed.", "bad");
  }
});

showSaved();
