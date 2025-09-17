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

// --- Predefined Option Responses ---
const optionResponses = {
    "Remedies": `
        Let's take a look at some <strong>title remedies</strong> within Alabama.<br>
        Here are some things you can ask me about:
        <ul>
            <li>Power of Attorney (POA)</li>
            <li>Affidavit of Correction (AOC)</li>
            <li>Lien Releases</li>
            <li>Title in the Name of a Business or Trust</li>
            <li>What to do if the Owner of the Vehicle is Deceased</li>
        </ul>
    `,
    "Boats & Alternative Vehicles": `
        Alabama has different title processes for boats, trailers, ATVs, and other non-standard vehicles:
        Check out some important specifications for different title processes:
        <ul>
            <li>Boats: No Title Needed - REQUIRED: Bill of Sale & Copy of Registration</li>
            <li>Motorhome/RVs: Title <em>is required</em> UNLESS it's twenty (20) years older than the Bill of Sale.</li>
            <li>Trailers: Travel Trailers & Folding/Collapsible Camping Trailers less than twenty (20) years old REQUIRE a Title.</li>
        </ul>
        Here are some other questions you can ask me...
        <ul>
            <li>If my boat or RV doesn't have a title, how can I obtain one?</li>
            <li>What fees are involved in transferring a boat or an RV title?</li>
            <li>Do I need a hull identification number (HIN) to title my boat?</li>
        </ul>
    `,
    "Applying for Salvage/Nonrepairable Titles": `
        Interested in applying for a <em>salvage</em> or <em>nonrepairable</em> title?<br>
        Let's take a look at some of the necessities:
        <ul>
            <li>Vehicles <strong>35 years or older</strong> are EXEMPT</li>
            <li>There is a $15 application fee</li>
            <li>The average turnaround time is between 2-4 weeks</li>
            <li>The <strong>Replacement Title Application</strong> (MVT-41-1) needs to be completed</li>
        </ul>
        Here are some things I can help you with...
        <ul>
            <li>Ask me to help you download the MVT-41-1 form</li>
            <li>Ask me what the difference is between a salvage title and a nonrepairable title</li>
            <li>Ask me if it's legal to sell a vehicle with a salvage title</li>
        </ul>
    `,
    "Applying for Duplicate Titles": `
        Need information when it comes to applying for a <em>duplicate</em> title?<br>
        Here's some important information for you:
        <ul>
            <li>You must complete the <strong>Replacement Title Application</strong> (MVT-12-1)</li>
            <li>There is a $15 application fee</li>
            <li>The average turnaround time is between 2-4 weeks</li>
        </ul>
        If you are looking to obtain a duplicate title <strong>on behalf of the owner</strong>...
        <ul>
            <li>You must provide two (2) notarized, Alabama specific POAs signed by <em>all</em> owners</li>
            <li>If the vehicle is <strong>older than 12 years</strong> AND the lien is <strong>older than 4 years</strong>, then <em>no lien release is required</em></li>
        </ul>
        Here are some additional questions you can ask me...
        <ul>
            <li>Can you provide me with the MVT-12-1 paperwork?</li>
            <li>Can you provide me with the MVT-5-13 paperwork?</li>
            <li>Can I legally transfer ownership with a duplicate title?</li>
        </ul>
    `,
    "Alternate Method to Sell Vehicle(s)": `
        Have some questions regarding alternate methods to sell a vehicle?<br>
        Try asking me about things like:
        <ul>
            <li>How does vehicle abandonment relate to selling a vehicle?</li>
            <li>What is Alabama's specific legal process when it comes to abandoned vehicles?</li>
            <li>What are some additional, legal ways to sell my vehicle(s)?</li>
        </ul>
    `,
    "General Information": `
        Want to ask me some more broad based questions regarding the title process in Alabama?<br>
        Try asking me about things like:
        <ul>
            <li>How old does my vehicle have to be in order to be exempt from title processes?</li>
            <li>Does mileage play a factor when it comes to title transfer?</li>
            <li>What do I do with my license plates after I transfer the title?</li>
        </ul>
    `
};

// --- Option Grid Buttons ---
function addOptionsGrid() {
    const buttonsHTML = `
        <div class="options-grid">
            ${Object.keys(optionResponses).map(option => `
                <button class="option-btn" data-option="${option}">
                    ${option}
                </button>
            `).join('')}
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
                    setTimeout(() => {
                        const response = optionResponses[selectedOption] || "Sorry, I don’t have info on that yet.";
                        addMessage(response, 'bot', true);
                    }, 600);
                }
            });
        });

        document.getElementById('ask-ai-btn').addEventListener('click', () => {
            aiMode = true;
            addMessage("Sure! What would you like to ask me about titles?", 'bot');
        });
    }, 100);
}

// --- Chat Handler ---
sendBtn.addEventListener('click', handleUserResponse);

addMessage("Hey there! I'm <strong>Title Tom</strong>.", 'bot', true);

setTimeout(() => {
    addMessage("I'm here to help you navigate the confusing world of titles.", 'bot', true);
}, 1200);

setTimeout(() => {
    addMessage("Are you looking for general title information/instructions, or do you have a vehicle title issue with one of our services like SHiFT, Car Donation Wizard, or You Call We Haul?", 'bot', true);
}, 2500);

setTimeout(() => {
    addIntroOptions();
}, 4000);

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
            const summary = `✅ It looks like your <strong>${c["vehicle year"]} ${c["vehicle make"]} ${c["vehicle model"]}</strong> is registered in <strong>${c["state"]}</strong>. Is this still accurate?`;
            addMessage(summary, 'bot', true);

            const confirmBtns = `
                <div class="intro-options" style="display: flex; justify-content: center; gap: 12px;">
                    <button class="intro-btn" data-confirm="yes">✅ Yes, that's correct</button>
                    <button class="intro-btn" data-confirm="no">❌ No, that's outdated</button>
                </div>
            `;
            addMessage(confirmBtns, 'bot', true);

            setTimeout(() => {
                document.querySelectorAll('[data-confirm]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        addMessage(btn.textContent, 'user');
                        const choice = btn.getAttribute('data-confirm');
                        if (choice === 'yes') {
                            answers['state'] = c["state"];
                            const stateName = c["state"];
                            setTimeout(() => {
addMessage(`Awesome. I'll use your state of <strong>${stateName}</strong> to pull relevant info.`, 'bot', true);

setTimeout(() => {
    addMessage(`Based on our records regarding your profile, your current title status shows <strong>${c["internal title status"]}</strong>.`, 'bot', true);
}, 800);

setTimeout(() => {
    const remedy = c["title remedy"];
    if (remedy) {
        addMessage(`🛠️ To address this, here's what I recommend: <strong>${remedy}</strong>`, 'bot', true);
    } else {
        addMessage("Given the issue with your title, my suggestion to remedy this would be...", 'bot');
    }

    // Then show options
    setTimeout(() => addOptionsGrid(), 800);
}, 1600);


                            }, 600);
                        } else {
                            currentQuestionIndex = 2;
                            setTimeout(() => addMessage("No problem! Let's figure out your state of residence.", 'bot'), 600);
                            setTimeout(() => addStateDropdown(), 1200);
                        }
                    });
                });
            }, 100);

        } else {
            addMessage("❌ No record found for that email. No worries — let's continue manually.", 'bot');
            currentQuestionIndex = 2;
            setTimeout(() => addStateDropdown(), 1000);
        }
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
