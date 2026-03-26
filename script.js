// 🔒 Protect page
if (!localStorage.getItem("user")) {
  window.location.href = "login.html";
}

// 🔥 SUPABASE CONFIG
const supabaseUrl = "https://kilcwapslcnjrchhyfm.supabase.co";
const supabaseKey = "sb_publishable_YRoTd89mkQwGzIX0QcaObg_WHo2sERX";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = localStorage.getItem("user");

/* ---------------- NAVBAR ---------------- */
const links = document.querySelectorAll(".navbar a");
const indicator = document.querySelector(".nav-indicator");

window.addEventListener("load", () => {
  let page = window.location.pathname.split("/").pop();

  links.forEach(link => {
    if (link.getAttribute("href") === page) {
      indicator.style.width = link.offsetWidth + "px";
      indicator.style.left = link.offsetLeft + "px";
    }
  });

  fetchLost();
  fetchFound();
});

/* ---------------- LOST ---------------- */
let lostForm = document.getElementById("lostForm");
let lostItemsDiv = document.getElementById("lostItems");

if (lostForm) {
  lostForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    let item = {
      user: currentUser,
      name: lostName.value,
      color: lostColor.value,
      location: lostLocation.value,
      description: lostDescription.value,
      detail: lostDetail.value
    };

    await supabase.from("lost_items").insert([item]);

    fetchLost();
    lostForm.reset();
  });
}

async function fetchLost() {
  if (!lostItemsDiv) return;

  let { data } = await supabase.from("lost_items").select("*");

  lostItemsDiv.innerHTML = "";

  data.forEach(item => {
    lostItemsDiv.innerHTML += `
      <div class="card">
        <h3>${item.name}</h3>
        <p><b>Color:</b> ${item.color}</p>
        <p><b>Location:</b> ${item.location}</p>
        <p>${item.description}</p>
        <p><b>Posted by:</b> ${item.user}</p>
        <button onclick="claimLost(${item.id}, '${item.detail}')">Claim</button>
      </div>
    `;
  });
}

/* ---------------- FOUND ---------------- */
let foundForm = document.getElementById("foundForm");
let foundItemsDiv = document.getElementById("foundItems");

if (foundForm) {
  foundForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    let item = {
      user: currentUser,
      name: foundName.value,
      location: foundLocation.value,
      description: foundDescription.value,
      question: foundQuestion.value,
      answer: foundAnswer.value
    };

    await supabase.from("found_items").insert([item]);

    fetchFound();
    foundForm.reset();
  });
}

async function fetchFound() {
  if (!foundItemsDiv) return;

  let { data } = await supabase.from("found_items").select("*");

  foundItemsDiv.innerHTML = "";

  data.forEach(item => {
    foundItemsDiv.innerHTML += `
      <div class="card">
        <h3>${item.name}</h3>
        <p><b>Location:</b> ${item.location}</p>
        <p>${item.description}</p>
        <p><b>Posted by:</b> ${item.user}</p>
        <button onclick="claimFound(${item.id}, '${item.question}', '${item.answer}')">Claim</button>
      </div>
    `;
  });
}

/* ---------------- CLAIM ---------------- */
async function claimLost(id, detail) {
  let ans = prompt("Enter identifying detail:");

  if (!ans) return;

  if (ans.trim().toLowerCase() === detail.trim().toLowerCase()) {
    await supabase.from("lost_items").delete().eq("id", id);
    fetchLost();
  } else {
    alert("Wrong ❌");
  }
}

async function claimFound(id, question, answer) {
  let ans = prompt(question);

  if (!ans) return;

  if (ans.trim().toLowerCase() === answer.trim().toLowerCase()) {
    await supabase.from("found_items").delete().eq("id", id);
    fetchFound();
  } else {
    alert("Wrong ❌");
  }
}

/* ---------------- SEARCH ---------------- */
function searchLost() {
  let input = lostSearch.value.toLowerCase();
  document.querySelectorAll("#lostItems .card").forEach(card => {
    card.style.display = card.innerText.toLowerCase().includes(input) ? "block" : "none";
  });
}

function searchFound() {
  let input = foundSearch.value.toLowerCase();
  document.querySelectorAll("#foundItems .card").forEach(card => {
    card.style.display = card.innerText.toLowerCase().includes(input) ? "block" : "none";
  });
}