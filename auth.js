// ── auth.js ──────────────────────────────────────────────
// Defensive login with visible error messages at every step

const SUPABASE_URL = "https://kilcvwapslcnjcrhhyfm.supabase.co";
const SUPABASE_KEY = "sb_publishable_YRoTd89mkQwGzIX0QcaObg_WHo2sERX";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("authForm");
  const msg  = document.getElementById("msg");
  if (!form) return;

  // ── Step 1: Check Supabase CDN loaded ──
  if (typeof window.supabase === "undefined") {
    showMsg(msg, "❌ Supabase library failed to load. Check your internet connection.", "red");
    return;
  }

  // ── Step 2: Create client once ──
  if (!window.supabaseClient) {
    try {
      window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (err) {
      showMsg(msg, "❌ Could not connect to database: " + err.message, "red");
      return;
    }
  }
  const db = window.supabaseClient;

  // ── Step 3: Handle form submit ──
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const btn      = form.querySelector("button[type='submit']");

    // Basic email check
    if (!email.endsWith("@student.nitw.ac.in")) {
      showMsg(msg, "⚠️ Use your college email ending in @student.nitw.ac.in", "red");
      return;
    }

    // Password strength check
    const pattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{6,}$/;
    if (!pattern.test(password)) {
      showMsg(msg, "⚠️ Password needs 6+ chars, a number & a special character (@!#...)", "red");
      return;
    }

    // Loading state
    btn.textContent = "Connecting…";
    btn.disabled = true;
    showMsg(msg, "", "");

    try {
      // ── Step 4: Query users table ──
      const { data, error } = await db
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        // Most common cause: RLS blocking reads, or wrong key
        showMsg(
          msg,
          "❌ Database error: " + error.message +
          " — Check Supabase RLS policy on the 'users' table (allow public read).",
          "red"
        );
        resetBtn(btn);
        return;
      }

      if (data) {
        // ── LOGIN ──
        if (data.password === password) {
          localStorage.setItem("user", email);
          showMsg(msg, "✅ Logged in! Redirecting…", "green");
          setTimeout(() => window.location.href = "home.html", 700);
        } else {
          showMsg(msg, "❌ Wrong password. Try again.", "red");
          resetBtn(btn);
        }
      } else {
        // ── SIGNUP ──
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
