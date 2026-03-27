// ── auth.js ──────────────────────────────────────────────
// Handles Login & Signup with basic validation

const supabaseUrl = "https://kilcvwapslcnjcrhhyfm.supabase.co";
const supabaseKey = "sb_publishable_YRoTd89mkQwGzIX0QcaObg_WHo2sERX";

if (!window.supabaseClient) {
  window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}
const supabase = window.supabaseClient;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("authForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg      = document.getElementById("msg");
    const btn      = form.querySelector("button[type='submit']");

    // ── Validation ──
    if (!email.endsWith("@student.nitw.ac.in")) {
      showMsg(msg, "⚠️ Please use your college email (@student.nitw.ac.in)", "red");
      return;
    }

    const pattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{6,}$/;
    if (!pattern.test(password)) {
      showMsg(msg, "⚠️ Password must be 6+ chars with a letter, number & special character", "red");
      return;
    }

    // ── Loading state ──
    btn.textContent = "Please wait…";
    btn.disabled = true;

    // ── Check if user exists ──
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle(); // ✅ won't throw if no rows found

    if (error) {
      showMsg(msg, "Server error: " + error.message, "red");
      resetBtn(btn);
      return;
    }

    if (data) {
      // ── LOGIN ──
      if (data.password === password) {
        localStorage.setItem("user", email);
        showMsg(msg, "✅ Logged in!", "green");
        setTimeout(() => window.location.href = "home.html", 600);
      } else {
        showMsg(msg, "❌ Wrong password!", "red");
        resetBtn(btn);
      }
    } else {
      // ── SIGNUP ──
      const { error: insertError } = await supabase
        .from("users")
        .insert([{ email, password }]);

      if (insertError) {
        showMsg(msg, "Signup failed: " + insertError.message, "red");
        resetBtn(btn);
        return;
      }

      localStorage.setItem("user", email);
      showMsg(msg, "🎉 Account created! Redirecting…", "green");
      setTimeout(() => window.location.href = "home.html", 1000);
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
