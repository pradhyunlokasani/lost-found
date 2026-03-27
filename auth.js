// 🔥 SUPABASE CONFIG
const supabaseUrl = "https://kilcwapslcnjrchhyfm.supabase.co";
const supabaseKey = "sb_publishable_YRoTd89mkQwGzIX0QcaObg_WHo2sERX";

// ✅ SINGLE INSTANCE ONLY
if (!window.supabaseClient) {
  window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}

const supabase = window.supabaseClient;

// ✅ WAIT FOR DOM
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
      msg.textContent = "Password must have letter, number & special character!";
      return;
    }

    let { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (error) {
      msg.textContent = "Error connecting to server!";
      return;
    }

    if (data.length > 0) {
      if (data[0].password === password) {
        localStorage.setItem("user", email);
        window.location.href = "home.html";
      } else {
        msg.textContent = "Incorrect password!";
      }
    } else {
      let { error: insertError } = await supabase
        .from("users")
        .insert([{ email, password }]);

      if (insertError) {
        msg.textContent = "Error creating account!";
        return;
      }

      localStorage.setItem("user", email);
      msg.style.color = "green";
      msg.textContent = "Account created! Redirecting...";

      setTimeout(() => {
        window.location.href = "home.html";
      }, 1000);
    }
  });

});
