const chatBody = document.getElementById('chat-body');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

const questions = [
    "What's your Name?",
    "What's your Phone Number?",
    "Great! Now, please select your state of residence.",
];

let answers = {};
let currentQuestionIndex = 0;
let saidNiceToMeetYou = false;
let aiMode = false; // Track if user is chatting with AI

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

// Greeting
addMessage(
    "Hey there! I'm <strong>Title Tom</strong>. I'm here to guide you through the title transfer process and provide you with the necessary forms and information. Let's start by having you answer some questions about yourself...",
    'bot'
);

setTimeout(() => {
    addMessage(questions[currentQuestionIndex], 'bot');
}, 2000);

sendBtn.addEventListener('click', handleUserResponse);

function handleUserResponse() {
    let userText = chatInput.value.trim();
    if (aiMode) {
        if (!userText) return;
        addMessage(userText, 'user');
        chatInput.value = ''; // clear input after user sends in AI mode
        callOpenAI(userText);
        return;
    }

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
            addMessage(`Perfect. I'll pull all the information I can regarding <strong>${stateName} Title Information</strong>. Here are some of the routes we can take to get you the information you need:`, 'bot');
            setTimeout(() => addOptionsGrid(), 800);
        }, 1000);

        currentQuestionIndex++;
        chatInput.value = ''; // clear input here too just in case
        return;
    }

    if (!userText) return;
    addMessage(userText, 'user');

    const keys = ['name', 'phone', 'state'];
    answers[keys[currentQuestionIndex]] = userText;
    currentQuestionIndex++;

    chatInput.value = ''; // <-- Clear input here after user sends message

    if (currentQuestionIndex < questions.length) {
        if (questions[currentQuestionIndex].toLowerCase().includes('state')) {
            setTimeout(() => addStateDropdown(), 1000);
        } else {
            setTimeout(() => addMessage(getPersonalizedMessage(questions[currentQuestionIndex]), 'bot'), 1000);
        }
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
    if (sender === 'bot' || isHTML) div.innerHTML = text;
    else div.innerText = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function addStateDropdown() {
    addMessage(`
        <label class="dropdown-label">Awesome! Next, please select your state of residence:</label>
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

// Backend OpenAI call
async function callOpenAI(userMessage) {
    addMessage("Thinking...", 'bot');
    try {
const res = await fetch('http://localhost:3000/chat', {
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
