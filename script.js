// ── script.js ─────────────────────────────────────────────
// Core logic: Supabase init, fetch, claim, search, forms

// ── 1. INITIALIZATION ──────────────────────────────────────
const supabaseUrl = "https://kilcvwapslcnjcrhhyfm.supabase.co";
const supabaseKey = "sb_publishable_YRoTd89mkQwGzIX0QcaObg_WHo2sERX";

if (!window.supabaseClient) {
  window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}
const supabase = window.supabaseClient;

const currentUser = localStorage.getItem("user");

// ── Auth guard (runs on every page except index) ───────────
if (!currentUser && !window.location.pathname.includes("index.html")) {
  window.location.href = "index.html";
}

// ── 2. TOAST NOTIFICATION ──────────────────────────────────
function showToast(message, type = "info") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastIn .3s ease reverse";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── 3. SEARCH ──────────────────────────────────────────────
window.searchItems = function (inputId, containerId) {
  const query = document.getElementById(inputId).value.toLowerCase();
  document.querySelectorAll(`#${containerId} .card`).forEach(card => {
    card.style.display = card.innerText.toLowerCase().includes(query) ? "" : "none";
  });
};

// ── 4. CLAIM ITEM ──────────────────────────────────────────
// ✅ FIX: secret values are encoded to handle quotes & special chars
window.claimItem = async function (id, table, secretField, secretValue) {
  const ans = prompt(`🔐 To verify ownership, enter the ${secretField}:`);
  if (!ans) return;

  // ✅ Decode the encoded secret before comparing
  const decoded = decodeURIComponent(secretValue);

  if (ans.trim().toLowerCase() === decoded.trim().toLowerCase()) {
    const { error } = await supabase
      .from(table)
      .update({ claimed_by: currentUser })
      .eq("id", id);

    if (error) {
      showToast("Error: " + error.message, "error");
    } else {
      showToast("✅ Verified! Owner has been notified.", "success");
      setTimeout(() => location.reload(), 1500);
    }
  } else {
    showToast("❌ Incorrect answer. Please try again.", "error");
  }
};

// ── 5. FETCH LOST ITEMS ────────────────────────────────────
window.fetchLost = async function () {
  const div = document.getElementById("lostItems");
  if (!div) return;

  // Show loader
  div.innerHTML = `<div class="loader">
    <div class="loader-dot"></div>
    <div class="loader-dot"></div>
    <div class="loader-dot"></div>
  </div>`;

  const { data, error } = await supabase.from("lost_items").select("*");

  if (error) {
    div.innerHTML = `<div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <p>Failed to load items: ${error.message}</p>
    </div>`;
    return;
  }

  // Update count badge
  const countEl = document.getElementById("lostCount");
  if (countEl) countEl.textContent = `${data.length} item${data.length !== 1 ? "s" : ""}`;

  div.innerHTML = "";

  const visible = data.filter(item =>
    !item.claimed_by || item.user === currentUser
  );

  if (visible.length === 0) {
    div.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📭</div>
      <p>No lost items reported yet. Be the first!</p>
    </div>`;
    return;
  }

  data.forEach(item => {
    if (!item.claimed_by) {
      // ✅ FIX: encode secret detail to handle single quotes & special chars
      const encoded = encodeURIComponent(item.detail);
      div.innerHTML += `
        <div class="card">
          <span class="badge badge-lost">Lost</span>
          <h3>📦 ${escapeHtml(item.name)}</h3>
          <p><b>Location:</b> ${escapeHtml(item.location)}</p>
          ${item.color ? `<p><b>Color:</b> ${escapeHtml(item.color)}</p>` : ""}
          ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
          <button onclick="claimItem(${item.id}, 'lost_items', 'Secret Identifying Detail', '${encoded}')">
            🙋 I Found This
          </button>
        </div>`;
    } else if (item.user === currentUser) {
      div.innerHTML += `
        <div class="card owner-update">
          <span class="badge" style="background:#d4edda;color:#155724;">Reunited!</span>
          <h3>✅ Your Item Was Found!</h3>
          <p><b>${escapeHtml(item.name)}</b> was found by:</p>
          <p style="font-size:1rem; font-weight:600; color: var(--success);">${escapeHtml(item.claimed_by)}</p>
          <p style="font-size:.82rem; color:var(--muted);">Contact them to retrieve your item.</p>
        </div>`;
    }
  });
};

// ── 6. FETCH FOUND ITEMS ───────────────────────────────────
window.fetchFound = async function () {
  const div = document.getElementById("foundItems");
  if (!div) return;

  div.innerHTML = `<div class="loader">
    <div class="loader-dot"></div>
    <div class="loader-dot"></div>
    <div class="loader-dot"></div>
  </div>`;

  const { data, error } = await supabase.from("found_items").select("*");

  if (error) {
    div.innerHTML = `<div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <p>Failed to load items: ${error.message}</p>
    </div>`;
    return;
  }

  const countEl = document.getElementById("foundCount");
  if (countEl) countEl.textContent = `${data.length} item${data.length !== 1 ? "s" : ""}`;

  div.innerHTML = "";

  if (data.length === 0) {
    div.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📭</div>
      <p>No found items listed yet.</p>
    </div>`;
    return;
  }

  data.forEach(item => {
    if (!item.claimed_by) {
      // ✅ FIX: encode answer to handle quotes & special chars
      const encoded = encodeURIComponent(item.answer);
      div.innerHTML += `
        <div class="card">
          <span class="badge badge-found">Found</span>
          <h3>✨ ${escapeHtml(item.name)}</h3>
          <p><b>Found at:</b> ${escapeHtml(item.location)}</p>
          ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
          ${item.question ? `<p style="font-size:.82rem; color:var(--muted);"><b>Verify:</b> ${escapeHtml(item.question)}</p>` : ""}
          <button onclick="claimItem(${item.id}, 'found_items', '${escapeHtml(item.question || "Verification Answer")}', '${encoded}')">
            🙋 This Is Mine
          </button>
        </div>`;
    } else if (item.user === currentUser) {
      div.innerHTML += `
        <div class="card owner-update">
          <span class="badge" style="background:#d4edda;color:#155724;">Claimed!</span>
          <h3>🤝 Item Has Been Claimed</h3>
          <p><b>${escapeHtml(item.name)}</b> claimed by:</p>
          <p style="font-size:1rem; font-weight:600; color: var(--success);">${escapeHtml(item.claimed_by)}</p>
        </div>`;
    }
  });
};

// ── 7. HELPER: Prevent XSS ────────────────────────────────
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── 8. PAGE INIT ───────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

  // Feedback form
  const feedbackForm = document.getElementById("feedbackForm");
  if (feedbackForm) {
    feedbackForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("feedbackText").value;
      const btn = feedbackForm.querySelector("button");
      btn.textContent = "Sending…";
      btn.disabled = true;

      const { error } = await supabase
        .from("feedback")
        .insert([{ user: currentUser, message: msg }]);

      if (error) {
        showToast("Failed to send feedback: " + error.message, "error");
      } else {
        showToast("💬 Feedback sent! Thank you.", "success");
        feedbackForm.reset();
      }

      btn.textContent = "Send Feedback →";
      btn.disabled = false;
    });
  }

  // Lost form
  const lostForm = document.getElementById("lostForm");
  if (lostForm) {
    lostForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = lostForm.querySelector("button[type='submit']");
      btn.textContent = "Posting…";
      btn.disabled = true;

      const item = {
        user:        currentUser,
        name:        document.getElementById("lostName").value,
        color:       document.getElementById("lostColor").value,
        location:    document.getElementById("lostLocation").value,
        description: document.getElementById("lostDescription").value,
        detail:      document.getElementById("lostDetail").value
      };

      const { error } = await supabase.from("lost_items").insert([item]);
      if (error) {
        showToast("Error posting item: " + error.message, "error");
      } else {
        showToast("📦 Lost item posted!", "success");
        lostForm.reset();
        fetchLost();
      }

      btn.textContent = "Post Lost Item";
      btn.disabled = false;
    });
  }

  // Found form
  const foundForm = document.getElementById("foundForm");
  if (foundForm) {
    foundForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = foundForm.querySelector("button[type='submit']");
      btn.textContent = "Posting…";
      btn.disabled = true;

      const item = {
        user:        currentUser,
        name:        document.getElementById("foundName").value,
        location:    document.getElementById("foundLocation").value,
        description: document.getElementById("foundDescription").value,
        question:    document.getElementById("foundQuestion").value,
        answer:      document.getElementById("foundAnswer").value
      };

      const { error } = await supabase.from("found_items").insert([item]);
      if (error) {
        showToast("Error posting item: " + error.message, "error");
      } else {
        showToast("✨ Found item posted!", "success");
        foundForm.reset();
        fetchFound();
      }

      btn.textContent = "Post Found Item";
      btn.disabled = false;
    });
  }

  // Auto-fetch on relevant pages
  fetchLost();
  fetchFound();
});
