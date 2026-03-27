// 🔥 SUPABASE CONFIG
const supabaseUrl = "https://kilcvwapslcnjcrhhyfm.supabase.co";
const supabaseKey = "sb_publishable_YRoTd89mkQwGzIX0QcaObg_WHo2sERX";

// ✅ CREATE ONLY ONCE
if (!window.supabaseClient) {
  window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}

var supabase = window.supabaseClient;

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("authForm");
  if (!form) return;

  form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("msg");

    if (!email.endsWith("@student.nitw.ac.in")) {
      msg.textContent = "Enter valid college email!";
      return;
    }

    const pattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{6,}$/;
    if (!pattern.test(password)) {
      msg.textContent = "Password must be strong!";
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (error) {
      msg.textContent = "Server error!";
      return;
    }

    if (data.length > 0) {
      if (data[0].password === password) {
        localStorage.setItem("user", email);
        window.location.href = "home.html";
      } else {
        msg.textContent = "Wrong password!";
      }
    } else {
      const { error: insertError } = await supabase
        .from("users")
        .insert([{ email, password }]);

      if (insertError) {
        msg.textContent = "Signup failed!";
        return;
      }

      localStorage.setItem("user", email);
      msg.style.color = "green";
      msg.textContent = "Account created!";

      setTimeout(() => {
        window.location.href = "home.html";
      }, 1000);
    }
  });

});
