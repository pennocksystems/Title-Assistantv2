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
let verificationMode = false;
let pendingClientData = null;

// --- Form Library ---
const formLibrary = {
  "mvt-5-13": { 
    label: "MVT-5-13 Form (Alabama)", 
    path: "https://eforms.com/download/2015/09/Alabama-Motor-Vehicle-Power-of-Attorney-Form-MVT-5-13.pdf" 
  },
  "mvt-41-1": { 
    label: "MVT-41-1 Form (Alabama)", 
    path: "https://drive.google.com/file/d/1J3jB9wuNE0l4zqxgvIumvRehJmtwF7g8/view" 
  },
  "mvt-12-1": { 
    label: "MVT-12-1 Form (Alabama)", 
    path: "https://www.formalu.com/forms/506/application-for-replacement-title" 
  },
  "mvt-5-7": {
    label: "MVT-5-7 Form (Alabama)",
    path: "https://www.revenue.alabama.gov/wp-content/uploads/2021/10/MVT-5-7-8-19.pdf"
  },
  "mvt-5-6": {
    label: "MVT-5-6 Form (Alabama)",
    path: "https://drive.google.com/file/d/1oWm0T7w9C0UsaNcw5S0nt5pYWzmRBTrW/view"
  }
};


// --- Option Responses ---
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
        </ul>`,
    "Boats & Alternative Vehicles": `
        Alabama has different title processes for boats, trailers, ATVs, and other non-standard vehicles:
        <ul>
            <li>Boats: No Title Needed - REQUIRED: Bill of Sale & Copy of Registration</li>
            <li>Motorhome/RVs: Title <em>is required</em> UNLESS it's twenty (20) years older than the Bill of Sale.</li>
            <li>Trailers: Travel Trailers & Folding/Collapsible Camping Trailers less than twenty (20) years old REQUIRE a Title.</li>
        </ul>`,
    "Applying for Salvage/Nonrepairable Titles": `
        Interested in applying for a <em>salvage</em> or <em>nonrepairable</em> title?
        <ul>
            <li>Vehicles <strong>35 years or older</strong> are EXEMPT</li>
            <li>$15 application fee</li>
            <li>Turnaround: 2–4 weeks</li>
            <li>Use <strong>MVT-41-1</strong> application</li>
        </ul>`,
    "Applying for Duplicate Titles": `
        Need a <em>duplicate</em> title?
        <ul>
            <li>Complete <strong>MVT-12-1</strong> form</li>
            <li>$15 fee, turnaround 2–4 weeks</li>
            <li>POA may be required if acting on behalf</li>
        </ul>`,
    "Alternate Method to Sell Vehicle(s)": `
        Try asking about:
        <ul>
            <li>Vehicle abandonment rules</li>
            <li>Alternate selling methods</li>
            <li>Legal pathways for out-of-title vehicles</li>
        </ul>`,
    "General Information": `
        Want to ask broad title questions?
        Try:
        <ul>
            <li>Age exemption rules</li>
            <li>Role of mileage in transfers</li>
            <li>License plate handling after sale</li>
        </ul>`
};

// --- Chat Start ---
sendBtn.addEventListener('click', handleUserResponse);
function showTypingIndicator(callback, delay = 1000) {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('bot-message', 'typing');
    typingDiv.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
        typingDiv.remove();
        callback();
    }, delay);
}

addMessage("Hey there! I'm <strong>Title Tom</strong>.", 'bot', true);
setTimeout(() => addMessage("I'm here to help you navigate the confusing world of titles.", 'bot', true), 1200);
setTimeout(() => addMessage("Are you looking for general title information/instructions, or do you have a vehicle title issue with one of our services like SHiFT, Car Donation Wizard, or You Call We Haul?", 'bot', true), 2500);
setTimeout(() => addIntroOptions(), 4000);

// --- State Normalization ---
const stateMap = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
    "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WI": "Wisconsin", "WY": "Wyoming"
};

function normalizeState(input) {
    if (!input) return '';
    const cleaned = input.trim().toUpperCase();

    // direct abbreviation
    if (stateMap[cleaned]) return stateMap[cleaned];

    // try partial or full match (e.g., "calif" → "California")
    const match = Object.values(stateMap).find(
        name => name.toUpperCase().startsWith(cleaned)
    );
    return match || input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}

// --- User Response Handler ---
function handleUserResponse() {
    const userText = chatInput.value.trim();
    if (!userText) return;

    // --- 2FA Step ---
    if (verificationMode) {
        addMessage(userText, 'user');
        chatInput.value = '';
        if (userText === '0000') {
            verificationMode = false;
            const c = pendingClientData;
            const summary = `✅ It looks like your <strong>${c["vehicle year"]} ${c["vehicle make"]} ${c["vehicle model"]}</strong> is registered in <strong>${c["state"]}</strong>. Is this still accurate?`;
            addMessage(summary, 'bot', true);
            showConfirmButtons(c);


            function showConfirmButtons(clientData) {
    const html = `
        <div class="intro-options" style="display: flex; justify-content: center; gap: 12px;">
            <button class="intro-btn" data-confirm="yes">✅ Yes, that's correct</button>
            <button class="intro-btn" data-confirm="no">❌ No, that's outdated</button>
        </div>`;
    
    addMessage(html, 'bot', true); // no await needed here since listener is added after callback


    // Use a MutationObserver to wait for it to be in DOM
    const observer = new MutationObserver(() => {
        const buttons = document.querySelectorAll('[data-confirm]');
        if (buttons.length) {
            observer.disconnect(); // stop once found

            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    addMessage(btn.textContent, 'user');
                    const choice = btn.getAttribute('data-confirm');

                    if (choice === 'yes') {
                        const stateName = clientData["state"];
                        answers['state'] = clientData["state"];
                        setTimeout(() => {
                            addMessage(`Awesome. I'll use your state of <strong>${stateName}</strong> to pull relevant info.`, 'bot', true);
                            setTimeout(() => {
                                addMessage(`Based on our records regarding your profile, your current title status shows <strong>${clientData["internal title status"]}</strong>.`, 'bot', true);
                            }, 800);
                            setTimeout(() => {
                                if (clientData["title remedy"]) {
                                    addMessage(`🛠️ To address this, here's what I recommend: <strong>${clientData["title remedy"]}</strong>`, 'bot', true);
                                }
                                setTimeout(() => addOptionsGrid(), 800);
                            }, 1600);
                        }, 600);
                    } else {
                        currentQuestionIndex = 2;
                        addMessage("No problem! Let's figure out your state of residence.", 'bot');
                        setTimeout(() => addStateInput(), 1000);
                    }
                });
            });
        }
    });

    observer.observe(chatBody, { childList: true, subtree: true });
}

        } else {
            addMessage("❌ That code is incorrect. Please try entering the 4-digit code again.", 'bot');
        }
        return;
    }

    // --- Record Check Mode ---
    if (recordCheckMode) {
        recordCheckMode = false;
        addMessage(userText, 'user');
        chatInput.value = '';
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
                pendingClientData = data.data;
                verificationMode = true;
                addMessage("📧 We've sent a 4-digit code to the email address you provided. Please type that code here to verify access (DEMO CODE:<strong>0000</strong>).", 'bot', true);
            } else {
                addMessage("❌ No record found for that email. No worries — let's continue manually.", 'bot');
                currentQuestionIndex = 2;
                setTimeout(() => addStateInput(), 1000);
            }
        })
        .catch(err => {
            console.error("Lookup failed:", err);
            addMessage("⚠️ Something went wrong while checking your record.", 'bot');
            currentQuestionIndex = 2;
            setTimeout(() => addStateInput(), 1000);
        });
        return;
    }

    // --- AI mode ---
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

    if (currentQuestionIndex === 2) {
    const stateInput = document.getElementById('state-input');
    const stateName = (stateInput && stateInput.value.trim()) || chatInput.value.trim();

    if (!stateName) {
        alert('Please enter your state before continuing.');
        return;
    }

    const normalizedState = normalizeState(stateName);
    answers['state'] = normalizedState;
    if (stateInput) stateInput.parentNode.remove(); // remove the inline input if it's rendered
    addMessage(stateName, 'user');
    chatInput.value = '';

    setTimeout(() => {
    addMessage(`Perfect. I'll pull all the information I can regarding <strong>${normalizedState} Title Information</strong>. Here are some of the routes we can take:`, 'bot', true);
        setTimeout(() => addOptionsGrid(), 800);
    }, 1000);
    currentQuestionIndex++;
    return;
}


    // --- Default Flow ---
    addMessage(userText, 'user');
    const keys = ['name', 'phone', 'state'];
    answers[keys[currentQuestionIndex]] = userText;
    currentQuestionIndex++;
    chatInput.value = '';

    if (currentQuestionIndex < questions.length) {
        if (questions[currentQuestionIndex].toLowerCase().includes('state')) {
            setTimeout(() => addStateInput(), 1000);
        } else {
            setTimeout(() => addMessage(getPersonalizedMessage(questions[currentQuestionIndex]), 'bot'), 1000);
        }
    }
}

// --- UI Builders ---
async function addIntroOptions() {
    const html = `
        <div class="intro-options" style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
            <button class="intro-btn" data-type="general">📘 General Title Help</button>
            <button class="intro-btn" data-type="issue">🚨 Problem with Vehicle Service Title Issue</button>
        </div>`;

    await addMessage(html, 'bot', true); // Wait for message to render

    document.querySelectorAll('.intro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const choice = btn.getAttribute('data-type');
            addMessage(btn.textContent, 'user');
            handleIntroSelection(choice);
        });
    });
}


function handleIntroSelection(choice) {
    if (choice === 'general') {
        currentQuestionIndex = 2;
        addMessage("Great! Let's figure out your state of residence to get started.", 'bot');
        setTimeout(() => addStateInput(), 1000);
    } else if (choice === 'issue') {
        addMessage("Got it! Before we dive in, would you like me to check if we already have a record of your vehicle?", 'bot');
        setTimeout(async () => await addRecordCheckOptions(), 1000);
    }
}

async function addRecordCheckOptions() {
    const html = `
        <div class="intro-options" style="display: flex; justify-content: center; gap: 12px;">
            <button class="intro-btn" data-record="check">📋 Record Check</button>
            <button class="intro-btn" data-record="skip">⏭️ Skip For Now</button>
        </div>`;

    await addMessage(html, 'bot', true); // Wait for typing + DOM update

    document.querySelectorAll('[data-record]').forEach(btn => {
        btn.addEventListener('click', () => {
            addMessage(btn.textContent, 'user');
            const choice = btn.getAttribute('data-record');
            handleRecordCheckSelection(choice);
        });
    });
}


function handleRecordCheckSelection(choice) {
    if (choice === 'check') {
        recordCheckMode = true;
        addMessage("Please enter your email address so I can check for a record on file.", 'bot');
    } else {
        currentQuestionIndex = 2;
        addMessage("No problem! Let's figure out your state of residence.", 'bot');
        setTimeout(() => addStateInput(), 1000);
    }
}

function addStateInput() {
    addMessage("Please type your state of residence (e.g., Alabama, CA, etc.):", 'bot');
}

async function addOptionsGrid() {
    const orderedOptions = [
        "General Information",
        "Ask Me Anything",
        "Boats & Alternative Vehicles",
        "Applying for Salvage/Nonrepairable Titles",
        "Applying for Duplicate Titles",
        "Alternate Method to Sell Vehicle(s)"
    ];

    const buttonsHTML = `
        <div class="options-grid">
            ${orderedOptions.map(option => {
                if (option === "Ask Me Anything") {
                    return `<button class="option-btn ai-btn" data-option="Ask Me Anything">${option}</button>`;
                }
                return `<button class="option-btn" data-option="${option}">${option}</button>`;
            }).join('')}
        </div>`;

    // Show typing dots first, then insert buttons into DOM
    await addMessage(buttonsHTML, 'bot', true);

    // Attach event listeners AFTER the buttons are present
    document.querySelectorAll('.option-btn').forEach(btn => {
        const selectedOption = btn.getAttribute('data-option');
        btn.addEventListener('click', () => {
            addMessage(btn.textContent, 'user');

            if (selectedOption === "Ask Me Anything") {
    aiMode = true;
    addMessage("Sure! What would you like to ask me about titles?", 'bot', true);
} else {
    setTimeout(() => addMessage(optionResponses[selectedOption], 'bot', true), 600);
}

        });
    });
}

function addMessage(text, sender, isHTML = false) {
    return new Promise((resolve) => {
        if (sender === 'bot') {
            showTypingIndicator(() => {
                const div = document.createElement('div');
                div.classList.add('bot-message');
                div[isHTML ? 'innerHTML' : 'innerText'] = text;
                chatBody.appendChild(div);
                chatBody.scrollTop = chatBody.scrollHeight;
                resolve(); // Let caller know it's safe to bind listeners
            });
        } else {
            const div = document.createElement('div');
            div.classList.add('user-message');
            div[isHTML ? 'innerHTML' : 'innerText'] = text;
            chatBody.appendChild(div);
            chatBody.scrollTop = chatBody.scrollHeight;
            resolve();
        }
    });
}



function getPersonalizedMessage(text) {
    if (!saidNiceToMeetYou && answers.name) {
        saidNiceToMeetYou = true;
        return `Nice to meet you, ${answers.name}. ${text}`;
    }
    return text;
}

function checkForFormDownload(message) {
    const msg = message.toLowerCase().replace(/\s|_/g, '-');
    for (const [formId, meta] of Object.entries(formLibrary)) {
        if (msg.includes(formId)) {
            return `📥 You can download the <strong>${meta.label}</strong> below:<br><br><a href="${meta.path}" download style="color: #3b82f6; text-decoration: underline;">📄 Download ${meta.label}</a>`;
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

// === Dark Mode Toggle ===
const darkToggle = document.getElementById('dark-toggle');
if (darkToggle) {
  darkToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
  });
}