// 🔥 SUPABASE CONFIGURATION
const supabaseUrl = "https://kilcvwapslcnjcrhhyfm.supabase.co";
const supabaseKey = "sb_publishable_YRoTd89mkQwGzIX0QcaObg_WHo2sERX";

// Initialize Supabase Globally
if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}
const supabase = window.supabaseClient;

/* ---------------- GLOBAL FUNCTIONS (Accessible by HTML) ---------------- */

// 🔍 Search Functionality
window.searchLost = function() {
    let input = document.getElementById("lostSearch").value.toLowerCase();
    document.querySelectorAll("#lostItems .card").forEach(card => {
        card.style.display = card.innerText.toLowerCase().includes(input) ? "block" : "none";
    });
};

window.searchFound = function() {
    let input = document.getElementById("foundSearch").value.toLowerCase();
    document.querySelectorAll("#foundItems .card").forEach(card => {
        card.style.display = card.innerText.toLowerCase().includes(input) ? "block" : "none";
    });
};

// 🔨 Claiming Logic
window.claimLost = async function(id, detail) {
    let ans = prompt("Enter identifying detail (e.g., scratch location, sticker):");
    if (!ans) return;

    if (ans.trim().toLowerCase() === detail.trim().toLowerCase()) {
        const { error } = await supabase.from("lost_items").delete().eq("id", id);
        if (error) {
            alert("Error claiming item.");
        } else {
            alert("Item marked as recovered! 🎉");
            fetchLost(); // Refresh list without reloading page
        }
    } else {
        alert("Verification failed. Wrong detail! ❌");
    }
};

window.claimFound = async function(id, question, answer) {
    let ans = prompt(question);
    if (!ans) return;

    if (ans.trim().toLowerCase() === answer.trim().toLowerCase()) {
        const { error } = await supabase.from("found_items").delete().eq("id", id);
        if (error) {
            alert("Error claiming item.");
        } else {
            alert("Owner verified! Item claimed. 🎉");
            fetchFound(); // Refresh list without reloading page
        }
    } else {
        alert("Wrong answer! ❌");
    }
};

// 📥 Data Fetching Functions
window.fetchLost = async function() {
    const lostItemsDiv = document.getElementById("lostItems");
    if (!lostItemsDiv) return;

    let { data, error } = await supabase.from("lost_items").select("*");
    if (error) return console.error(error);

    lostItemsDiv.innerHTML = "";
    data.forEach(item => {
        lostItemsDiv.innerHTML += `
            <div class="card">
                <h3>📦 ${item.name}</h3>
                <p><b>Color:</b> ${item.color}</p>
                <p><b>Location:</b> ${item.location}</p>
                <p>${item.description}</p>
                <p><small>Posted by: ${item.user}</small></p>
                <button onclick="claimLost(${item.id}, '${item.detail.replace(/'/g, "\\'")}')">Claim</button>
            </div>`;
    });
};

window.fetchFound = async function() {
    const foundItemsDiv = document.getElementById("foundItems");
    if (!foundItemsDiv) return;

    let { data, error } = await supabase.from("found_items").select("*");
    if (error) return console.error(error);

    foundItemsDiv.innerHTML = "";
    data.forEach(item => {
        foundItemsDiv.innerHTML += `
            <div class="card">
                <h3>✨ ${item.name}</h3>
                <p><b>Location:</b> ${item.location}</p>
                <p>${item.description}</p>
                <p><b>Question:</b> ${item.question}</p>
                <p><small>Posted by: ${item.user}</small></p>
                <button onclick="claimFound(${item.id}, '${item.question.replace(/'/g, "\\'")}', '${item.answer.replace(/'/g, "\\'")}')">Answer to Claim</button>
            </div>`;
    });
};

/* ---------------- PAGE INITIALIZATION ---------------- */

document.addEventListener("DOMContentLoaded", () => {
    let currentUser = localStorage.getItem("user");

    // 🔒 Protect pages (except index.html)
    if (!currentUser && !window.location.pathname.includes("index.html")) {
        window.location.href = "index.html";
        return;
    }

    // 📱 Navbar Indicator Logic
    const links = document.querySelectorAll(".navbar a");
    const indicator = document.querySelector(".nav-indicator");
    let page = window.location.pathname.split("/").pop() || "home.html";

    if (indicator) {
        links.forEach(link => {
            if (link.getAttribute("href") === page) {
                indicator.style.width = link.offsetWidth + "px";
                indicator.style.left = link.offsetLeft + "px";
            }
        });
    }

    // 📝 Form Submissions
    const lostForm = document.getElementById("lostForm");
    if (lostForm) {
        lostForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const item = {
                user: currentUser,
                name: document.getElementById("lostName").value,
                color: document.getElementById("lostColor").value,
                location: document.getElementById("lostLocation").value,
                description: document.getElementById("lostDescription").value,
                detail: document.getElementById("lostDetail").value
            };
            await supabase.from("lost_items").insert([item]);
            lostForm.reset();
            fetchLost();
        });
    }

    const foundForm = document.getElementById("foundForm");
    if (foundForm) {
        foundForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const item = {
                user: currentUser,
                name: document.getElementById("foundName").value,
                location: document.getElementById("foundLocation").value,
                description: document.getElementById("foundDescription").value,
                question: document.getElementById("foundQuestion").value,
                answer: document.getElementById("foundAnswer").value
            };
            await supabase.from("found_items").insert([item]);
            foundForm.reset();
            fetchFound();
        });
    }

    // Initial Data Load
    fetchLost();
    fetchFound();
});
