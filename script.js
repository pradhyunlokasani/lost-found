// 🔥 1. INITIALIZATION (Only Declare 'supabase' ONCE here)
const supabaseUrl = "https://kilcvwapslcnjcrhhyfm.supabase.co";
const supabaseKey = "sb_publishable_YRoTd89mkQwGzIX0QcaObg_WHo2sERX";

// Check if it exists before creating to prevent redeclaration errors
if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}
const supabase = window.supabaseClient;
const currentUser = localStorage.getItem("user");

/* ---------------- 2. GLOBAL FUNCTIONS (For Search & Claim) ---------------- */

window.searchItems = function(inputId, containerId) {
    let input = document.getElementById(inputId).value.toLowerCase();
    document.querySelectorAll(`#${containerId} .card`).forEach(card => {
        card.style.display = card.innerText.toLowerCase().includes(input) ? "block" : "none";
    });
};

window.claimItem = async function(id, table, secretField, secretValue) {
    let ans = prompt(`To verify, enter the ${secretField}:`);
    if (!ans) return;

    if (ans.trim().toLowerCase() === secretValue.trim().toLowerCase()) {
        const { error } = await supabase.from(table).update({ claimed_by: currentUser }).eq("id", id);
        if (error) alert("Error: " + error.message);
        else {
            alert("Verification Success! Owner notified. ✅");
            location.reload();
        }
    } else {
        alert("Incorrect! ❌");
    }
};

/* ---------------- 3. DATA FETCHING ---------------- */

window.fetchLost = async function() {
    const div = document.getElementById("lostItems");
    if (!div) return;

    let { data, error } = await supabase.from("lost_items").select("*");
    if (error) {
        console.error("Fetch Lost Error:", error);
        return;
    }

    div.innerHTML = "";
    data.forEach(item => {
        if (!item.claimed_by) {
            div.innerHTML += `
                <div class="card">
                    <h3>📦 ${item.name}</h3>
                    <p><b>Loc:</b> ${item.location}</p>
                    <button onclick="claimItem(${item.id}, 'lost_items', 'Secret Detail', '${item.detail}')">I Found This</button>
                </div>`;
        } else if (item.user === currentUser) {
            div.innerHTML += `
                <div class="card owner-update">
                    <h3>✅ Item Found!</h3>
                    <p>Found by: <b>${item.claimed_by}</b></p>
                </div>`;
        }
    });
};

window.fetchFound = async function() {
    const div = document.getElementById("foundItems");
    if (!div) return;

    let { data, error } = await supabase.from("found_items").select("*");
    if (error) {
        console.error("Fetch Found Error:", error);
        return;
    }

    div.innerHTML = "";
    data.forEach(item => {
        if (!item.claimed_by) {
            div.innerHTML += `
                <div class="card">
                    <h3>✨ ${item.name}</h3>
                    <p><b>Loc:</b> ${item.location}</p>
                    <button onclick="claimItem(${item.id}, 'found_items', 'Answer', '${item.answer}')">This is Mine</button>
                </div>`;
        } else if (item.user === currentUser) {
            div.innerHTML += `
                <div class="card owner-update">
                    <h3>🤝 Claimed!</h3>
                    <p>Claimed by: <b>${item.claimed_by}</b></p>
                </div>`;
        }
    });
};

/* ---------------- 4. PAGE INITIALIZATION ---------------- */

document.addEventListener("DOMContentLoaded", () => {
    // 🔒 Auth Guard
    if (!currentUser && !window.location.pathname.includes("index.html")) {
        window.location.href = "index.html";
        return;
    }

    // Feedback Submission
    const feedbackForm = document.getElementById("feedbackForm");
    if (feedbackForm) {
        feedbackForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const msg = document.getElementById("feedbackText").value;
            await supabase.from("feedback").insert([{ user: currentUser, message: msg }]);
            alert("Feedback Sent!");
            feedbackForm.reset();
        });
    }

    // Form Submissions
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

    // Initial Load
    fetchLost();
    fetchFound();
});
