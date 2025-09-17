// --- DOM Elements ---
const chatBody = document.getElementById('chat-body');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

// --- State ---
const questions = [
    "What's your Name?",
    "What's your Phone Number?",
    "Great! Now, please select your state of residence.",
];

let answers = {};
let currentQuestionIndex = 0;
let saidNiceToMeetYou = false;
let aiMode = false;
let recordCheckMode = false;

// --- Form Library ---
const formLibrary = {
    "mvt-5-13": {
        label: "MVT‑5‑13 Form (Alabama)",
        path: "/forms/mvt-5-13.pdf"
    },
    "mvt-41-1": {
        label: "MVT‑41‑1 Form (Alabama)",
        path: "/forms/mvt-41-1.pdf"
    },
    "mvt-12-1": {
        label: "MVT‑12‑1 Form (Alabama)",
        path: "/forms/mvt-12-1.pdf"
    }
};

// --- Chat Handler ---
sendBtn.addEventListener('click', handleUserResponse);

// --- Intro Greeting ---
addMessage(
    "Hey there! I'm <strong>Title Tom</strong>. I'm here to help you navigate the confusing world of titles. Are you looking for general title information/instructions, or do you have a vehicle title issue with one of our services like SHiFT, Car Donation Wizard, or You Call We Haul?",
    'bot'
);
setTimeout(() => addIntroOptions(), 2000);

// --- Handle User Response ---
function handleUserResponse() {
    const userText = chatInput.value.trim();
    if (!userText) return;

    // If in Record Check Mode
    if (recordCheckMode) {
        recordCheckMode = false;
        addMessage(userText, 'user');
        chatInput.value = '';

        // Validate email
        if (!userText.includes('@')) {
            addMessage("⚠️ Please enter a valid email address.", 'bot');
            return;
        }

        fetch('/check-client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userText })
        })
        .then(res => res.json())
        .then(data => {
            if (data.match) {
                const c = data.data;
                const info = `
                    ✅ Here's what we found on file:<br><br>
                    <ul>
                      <li><strong>Name:</strong> ${c["client first name"]} ${c["client last name"]}</li>
                      <li><strong>Email:</strong> ${c["client email"]}</li>
                      <li><strong>Phone:</strong> ${c["client phone"]}</li>
                      <li><strong>Vehicle:</strong> ${c["vehicle year"]} ${c["vehicle make"]} ${c["vehicle model"]}</li>
                      <li><strong>City/State/ZIP:</strong> ${c["city"]}, ${c["state"]} ${c["zip-code"]}</li>
                      <li><strong>Title Status:</strong> ${c["internal title status"]}</li>
                    </ul>
                    Let me know what you'd like help with regarding this vehicle.
                `;
                addMessage(info, 'bot', true);
            } else {
                addMessage("❌ No record found for that email. No worries — let's continue manually.", 'bot');
            }

            currentQuestionIndex = 2;
            setTimeout(() => addStateDropdown(), 1000);
        })
        .catch(err => {
            console.error("Lookup failed:", err);
            addMessage("⚠️ Something went wrong while checking your record.", 'bot');
            currentQuestionIndex = 2;
            setTimeout(() => addStateDropdown(), 1000);
        });

        return;
    }

    // AI mode
    if (aiMode) {
        addMessage(userText, 'user');
        chatInput.value = '';
        const formResponse = checkForFormDownload(userText);
        if (formResponse) {
            addMessage(formResponse, 'bot', true);
        } else {
            callOpenAI(userText);
        }
        return;
    }

    // State selection step
    if (currentQuestionIndex === 2) {
        const stateSelect = document.getElementById('state-select');
        if (!stateSelect || !stateSelect.value) {
            alert('Please select a state before continuing.');
            return;
        }
        const stateName = stateSelect.options[stateSelect.selectedIndex].text;
        answers['state'] = stateSelect.value;
        stateSelect.parentNode.remove();
        setTimeout(() => {
            addMessage(`Perfect. I'll pull all the information I can regarding <strong>${stateName} Title Information</strong>. Here are some of the routes we can take:`, 'bot');
            setTimeout(() => addOptionsGrid(), 800);
        }, 1000);
        currentQuestionIndex++;
        chatInput.value = '';
        return;
    }

    // Default flow
    const userTextTrimmed = userText.trim();
    addMessage(userTextTrimmed, 'user');
    const keys = ['name', 'phone', 'state'];
    answers[keys[currentQuestionIndex]] = userTextTrimmed;
    currentQuestionIndex++;
    chatInput.value = '';

    if (currentQuestionIndex < questions.length) {
        if (questions[currentQuestionIndex].toLowerCase().includes('state')) {
            setTimeout(() => addStateDropdown(), 1000);
        } else {
            setTimeout(() => addMessage(getPersonalizedMessage(questions[currentQuestionIndex]), 'bot'), 1000);
        }
    }
}

// --- Intro Options ---
function addIntroOptions() {
    const introHTML = `
        <div class="intro-options" style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
            <button class="intro-btn" data-type="general">📘 General Title Help</button>
            <button class="intro-btn" data-type="issue">🚨 Problem with Vehicle Service Title Issue</button>
        </div>
    `;
    addMessage(introHTML, 'bot', true);
    setTimeout(() => {
        document.querySelectorAll('.intro-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const choice = btn.getAttribute('data-type');
                addMessage(btn.textContent, 'user');
                handleIntroSelection(choice);
            });
        });
    }, 100);
}

function handleIntroSelection(choice) {
    if (choice === 'general') {
        currentQuestionIndex = 2;
        addMessage("Great! Let's figure out your state of residence to get started.", 'bot');
        setTimeout(() => addStateDropdown(), 1000);
    } else if (choice === 'issue') {
        addMessage("Got it! Before we dive in, would you like me to check if we already have a record of your vehicle?", 'bot');
        setTimeout(() => addRecordCheckOptions(), 1000);
    }
}

function addRecordCheckOptions() {
    const html = `
        <div class="intro-options" style="display: flex; justify-content: center; gap: 12px;">
            <button class="intro-btn" data-record="check">📋 Record Check</button>
            <button class="intro-btn" data-record="skip">⏭️ Skip For Now</button>
        </div>
    `;
    addMessage(html, 'bot', true);
    setTimeout(() => {
        document.querySelectorAll('.intro-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const choice = btn.getAttribute('data-record');
                addMessage(btn.textContent, 'user');
                handleRecordCheckSelection(choice);
            });
        });
    }, 100);
}

function handleRecordCheckSelection(choice) {
    if (choice === 'check') {
        recordCheckMode = true;
        addMessage("Please enter your email address so I can check for a record on file.", 'bot');
    } else if (choice === 'skip') {
        currentQuestionIndex = 2;
        addMessage("No problem! Let's figure out your state of residence.", 'bot');
        setTimeout(() => addStateDropdown(), 1000);
    }
}

function getPersonalizedMessage(text) {
    if (!saidNiceToMeetYou && answers.name) {
        saidNiceToMeetYou = true;
        return `Nice to meet you, ${answers.name}. ${text}`;
    }
    return text;
}

function addMessage(text, sender, isHTML = false) {
    const div = document.createElement('div');
    div.classList.add(sender === 'bot' ? 'bot-message' : 'user-message');
    div[isHTML ? 'innerHTML' : 'innerText'] = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function addStateDropdown() {
    addMessage(`
        <label class="dropdown-label">Please select your state of residence:</label>
        <select id="state-select" class="dropdown-select">
            <option value="">--Select State--</option>
            <option value="AL">Alabama</option>
        </select>
    `, 'bot', true);
}

function addOptionsGrid() {
    const buttonsHTML = `
        <div class="options-grid">
            ${Object.keys(optionResponses).map(option => `<button class="option-btn" data-option="${option}">${option}</button>`).join('')}
        </div>
        <div class="ai-option">
            <button id="ask-ai-btn" class="option-btn ai-btn">Ask Me Anything</button>
        </div>
    `;
    addMessage(buttonsHTML, 'bot', true);

    setTimeout(() => {
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const selectedOption = btn.getAttribute('data-option');
                if (selectedOption) {
                    addMessage(selectedOption, 'user');
                    setTimeout(() => addMessage(optionResponses[selectedOption], 'bot'), 600);
                }
            });
        });
        document.getElementById('ask-ai-btn').addEventListener('click', () => {
            aiMode = true;
            addMessage("Sure! What would you like to ask me about titles?", 'bot');
        });
    }, 50);
}

function checkForFormDownload(message) {
    const msg = message.toLowerCase().replace(/\s|_/g, '-');
    for (const [formId, meta] of Object.entries(formLibrary)) {
        if (msg.includes(formId)) {
            return `
                📥 You can download the <strong>${meta.label}</strong> below:<br><br>
                <a href="${meta.path}" download style="color: #3b82f6; text-decoration: underline;">
                  📄 Download ${meta.label}
                </a>
            `;
        }
    }
    return null;
}

async function callOpenAI(userMessage) {
    addMessage("Thinking...", 'bot');
    try {
        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userMessage })
        });
        const data = await res.json();
        chatBody.lastChild.remove();
        addMessage(data.reply || "Sorry, I couldn't get a response.", 'bot');
    } catch (err) {
        chatBody.lastChild.remove();
        addMessage("Error contacting AI service.", 'bot');
    }
}
