// ── auth.js ──────────────────────────────────────────────
// Fixed: removed .maybeSingle() — not supported in older Supabase CDN versions

const SUPABASE_URL = "https://kilcvwapslcnjcrhhyfm.supabase.co";
const SUPABASE_KEY = "sb_publishable_YRoTd89mkQwGzIX0QcaObg_WHo2sERX";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("authForm");
  const msg  = document.getElementById("msg");
  if (!form) return;

  // Check Supabase CDN loaded
  if (typeof window.supabase === "undefined") {
    showMsg(msg, "❌ Supabase library failed to load. Check your internet.", "red");
    return;
  }

  // Create client once
  if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  const db = window.supabaseClient;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const btn      = form.querySelector("button[type='submit']");

    // Email validation
    if (!email.endsWith("@student.nitw.ac.in")) {
      showMsg(msg, "⚠️ Use your college email (@student.nitw.ac.in)", "red");
      return;
    }

    // Password strength
    const pattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{6,}$/;
    if (!pattern.test(password)) {
      showMsg(msg, "⚠️ Password needs 6+ chars, a letter, number & special char", "red");
      return;
    }

    btn.textContent = "Connecting…";
    btn.disabled = true;
    showMsg(msg, "", "");

    try {
      // ✅ Use .select() returning an array — no .single() or .maybeSingle()
      const { data, error } = await db
        .from("users")
        .select("*")
        .eq("email", email);

      if (error) {
        showMsg(msg, "❌ Database error: " + error.message, "red");
        resetBtn(btn);
        return;
      }

      if (data && data.length > 0) {
        // ── LOGIN — user exists ──
        if (data[0].password === password) {
          localStorage.setItem("user", email);
          showMsg(msg, "✅ Logged in! Redirecting…", "green");
          setTimeout(() => window.location.href = "home.html", 700);
        } else {
          showMsg(msg, "❌ Wrong password. Try again.", "red");
          resetBtn(btn);
        }
      } else {
        // ── SIGNUP — new user ──
        const { error: insertError } = await db
          .from("users")
          .insert([{ email, password }]);

        if (insertError) {
          showMsg(msg, "❌ Signup failed: " + insertError.message, "red");
          resetBtn(btn);
          return;
        }

        localStorage.setItem("user", email);
        showMsg(msg, "🎉 Account created! Redirecting…", "green");
        setTimeout(() => window.location.href = "home.html", 900);
      }

    } catch (err) {
      showMsg(msg, "❌ Unexpected error: " + err.message, "red");
      resetBtn(btn);
    }
  });
});

function showMsg(el, text, color) {
  el.textContent = text;
  el.style.color = color;
}

function resetBtn(btn) {
  btn.textContent = "Login / Sign Up →";
  btn.disabled = false;
}
