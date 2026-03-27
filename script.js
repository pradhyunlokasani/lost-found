const supabaseUrl = "https://kilcvwapslcnjcrhhyfm.supabase.co";
const supabaseKey = "sb_publishable_YRoTd89mkQwGzIX0QcaObg_WHo2sERX";

if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}
const supabase = window.supabaseClient;
const currentUser = localStorage.getItem("user");

/* ---------------- GLOBAL FUNCTIONS (Search & Claim) ---------------- */

window.searchItems = function(inputId, containerId) {
    let input = document.getElementById(inputId).value.toLowerCase();
    document.querySelectorAll(`#${containerId} .card`).forEach(card => {
        card.style.display = card.innerText.toLowerCase().includes(input) ? "block" : "none";
    });
};

window.claimItem = async function(id, table, secretField, secretValue) {
    let ans = prompt(`Enter the ${secretField} to verify:`);
    if (!ans) return;

    if (ans.trim().toLowerCase() === secretValue.trim().toLowerCase()) {
        // Instead of deleting, we update the row with the current user's email
        const { error } = await supabase
            .from(table)
            .update({ claimed_by: currentUser })
            .eq("id", id);

        if (error) {
            alert("Error updating status.");
        } else {
            alert("Verified! The owner has been notified with your email. ✅");
            location.reload(); 
        }
    } else {
        alert("Wrong details! ❌");
    }
};

/* ---------------- DATA FETCHING ---------------- */

window.fetchLost = async function() {
    const div = document.getElementById("lostItems");
    if (!div) return;

    // 1. Show items that are NOT claimed yet
    let { data: activeItems } = await supabase.from("lost_items").select("*").is("claimed_by", null);
    
    // 2. Show items YOU posted that WERE claimed (so you see the contact info)
    let { data: myClaimedUpdates } = await supabase.from("lost_items").select("*").eq("user", currentUser).not("claimed_by", "is", null);

    div.innerHTML = "";

    // Render Notifications First
    myClaimedUpdates?.forEach(item => {
        div.innerHTML += `
            <div class="card owner-update">
                <h3>✅ Item Found!</h3>
                <p>Your <b>${item.name}</b> was found by:</p>
                <p><b>${item.claimed_by}</b></p>
                <p>Contact them to get it back!</p>
            </div>`;
    });

    // Render Searchable Items
    activeItems?.forEach(item => {
        div.innerHTML += `
            <div class="card">
                <h3>📦 ${item.name}</h3>
                <p><b>Color:</b> ${item.color} | <b>Loc:</b> ${item.location}</p>
                <p>${item.description}</p>
                <button onclick="claimItem(${item.id}, 'lost_items', 'Secret Detail', '${item.detail.replace(/'/g, "\\'")}')">I Found This</button>
            </div>`;
    });
};

window.fetchFound = async function() {
    const div = document.getElementById("foundItems");
    if (!div) return;

    let { data: activeFound } = await supabase.from("found_items").select("*").is("claimed_by", null);
    let { data: myFoundUpdates } = await supabase.from("found_items").select("*").eq("user", currentUser).not("claimed_by", "is", null);

    div.innerHTML = "";

    myFoundUpdates?.forEach(item => {
        div.innerHTML += `
            <div class="card owner-update">
                <h3>🤝 Claimed!</h3>
                <p><b>${item.name}</b> was claimed by:</p>
                <p><b>${item.claimed_by}</b></p>
            </div>`;
    });

    activeFound?.forEach(item => {
        div.innerHTML += `
            <div class="card">
                <h3>✨ ${item.name}</h3>
                <p><b>Location:</b> ${item.location}</p>
                <p><b>Question:</b> ${item.question}</p>
                <button onclick="claimItem(${item.id}, 'found_items', 'Answer', '${item.answer.replace(/'/g, "\\'")}')">This is Mine</button>
            </div>`;
    });
};

/* ---------------- INITIALIZATION ---------------- */

document.addEventListener("DOMContentLoaded", () => {
    if (!currentUser && !window.location.pathname.includes("index.html")) {
        window.location.href = "index.html";
    }

    // Handle Feedback Form
    const feedbackForm = document.getElementById("feedbackForm");
    if (feedbackForm) {
        feedbackForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const msg = document.getElementById("feedbackText").value;
            const { error } = await supabase.from("feedback").insert([{ user: currentUser, message: msg }]);
            if (error) alert("Error sending feedback.");
            else {
                alert("Feedback sent! Thank you. ❤️");
                feedbackForm.reset();
            }
        });
    }

    // Handle Lost/Found Form Submissions (existing logic)
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

    fetchLost();
    fetchFound();
});
