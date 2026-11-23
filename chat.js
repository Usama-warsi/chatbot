// ================= WEBSITE SETTINGS =================
// Edit these for each website. Any data-* attribute on
// <div id="ai-chat-widget"> overrides the value here
// (data-backend, data-agent, data-domain, data-color, data-icon,
//  data-prompt, data-api, data-powered).
const CHAT_CONFIG = {
    backend: "https://automation.codrammer.com/webhook/chat-widget",
    agent: "Eric",
    domain: window.location.hostname,
    color: "#0d6efd",
    icon: "",
    poweredBy: "",
    // Text prompt: tell the bot who it is and what it knows about this website
    prompt: "You are a friendly assistant for this website. Help visitors with their questions about our services.",
    // Optional: API URL that returns this website's data (packages, products, prices...). Leave "" if none.
    apiUrl: ""
};
// ====================================================

document.addEventListener("DOMContentLoaded", function () {
    const containerEl = document.getElementById("ai-chat-widget");
    if (!containerEl) return;

    const ds = containerEl.dataset;
    const BACKEND = ds.backend || CHAT_CONFIG.backend || "";
    const AGENT = ds.agent || CHAT_CONFIG.agent || "Site Assistant";
    const DOMAIN = ds.domain || CHAT_CONFIG.domain || "";
    const COLOR = ds.color || CHAT_CONFIG.color || "#0d6efd";
    const ICON = ds.icon || CHAT_CONFIG.icon || "";
    const POWERED = ds.powered || CHAT_CONFIG.poweredBy || "";
    const PROMPT = ds.prompt || CHAT_CONFIG.prompt || "";
    const API_URL = ds.api || CHAT_CONFIG.apiUrl || "";

    // Per-visitor session id so the bot remembers the conversation
    let SESSION_ID = "";
    try { SESSION_ID = sessionStorage.getItem("ai-chat-session") || ""; } catch (e) {}
    if (!SESSION_ID) {
        SESSION_ID = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
        try { sessionStorage.setItem("ai-chat-session", SESSION_ID); } catch (e) {}
    }

    function buildPayload(text) {
        return JSON.stringify({
            message: text,
            domain: DOMAIN,
            userIP: userIP,
            sessionId: SESSION_ID,
            prompt: `Your name is ${AGENT}. Always introduce yourself as ${AGENT}; never mention the AI model behind you. Reply in the same language AND script the visitor writes in: if they write Urdu/Hindi in English letters (Roman Urdu), reply in Roman Urdu with English letters, never in Devanagari or Urdu script.

${PROMPT}`,
            apiUrl: API_URL
        });
    }
    
    // Random greeting messages
    const greetings = [
        `Hi! 👋 I'm ${AGENT}, your friendly guide to making ${DOMAIN} rank higher and perform better let's optimize it together!`,
        `Hello there! 🌟 I'm your ${AGENT}. Let's dig into ${DOMAIN} and turn those SEO issues into wins!`,
        `Hey! 😎 ${AGENT} here, ready to help ${DOMAIN} climb the search rankings and shine online!`,
        `Greetings! 👋 I'm your ${AGENT}. Let's uncover any SEO problems on ${DOMAIN} and make your site unstoppable!`,
        `Hi! ✨ I'm ${AGENT}, here to help ${DOMAIN} look amazing in search results let's get started!`,
        `Hey there! 🚀 I'm your ${AGENT}. Ready to boost ${DOMAIN}'s SEO score and visibility let's go!`,
        `Hello! 👋 ${AGENT} at your service. Let's fix, optimize, and supercharge ${DOMAIN} together!`,
        `Hi there! 😃 I'm your ${AGENT}. Let's analyze ${DOMAIN} and turn insights into action!`,
        `Hey! 🌟 I'm ${AGENT}, your guide to a faster, smarter, and more search-friendly ${DOMAIN}!`,
        `Hello! 👋 Ready to make ${DOMAIN} shine? I'm your ${AGENT} let's tackle those SEO issues together!`
    ];
    
    let userIP = "unknown";
    
    // Fetch user IP
    fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => {
            userIP = data.ip;
            console.log("User IP detected:", userIP);
        })
        .catch(err => {
            console.log("Could not fetch IP:", err);
        });

    function getRandomGreeting() {
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    // helper: convert hex to rgb
    function hexToRgb(hex) {
        if (!hex) return { r: 13, g: 110, b: 253 };
        const clean = hex.replace('#', '').trim();
        const v = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
        const r = parseInt(v.substring(0,2), 16);
        const g = parseInt(v.substring(2,4), 16);
        const b = parseInt(v.substring(4,6), 16);
        return { r, g, b };
    }

    // helper: darken hex by percent (0-1)
    function darkenHex(hex, pct) {
        const { r, g, b } = hexToRgb(hex);
        const dr = Math.max(0, Math.round(r * (1 - pct)));
        const dg = Math.max(0, Math.round(g * (1 - pct)));
        const db = Math.max(0, Math.round(b * (1 - pct)));
        const toHex = n => n.toString(16).padStart(2, '0');
        return `#${toHex(dr)}${toHex(dg)}${toHex(db)}`;
    }

    // Check backend health before initializing the widget
    async function checkBackend() {
        if (!BACKEND) return false;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        // Try HEAD first, then fallback to GET
        try {
            let res = await fetch(BACKEND, { method: 'HEAD', mode: 'cors', signal: controller.signal, cache: 'no-store' });
            clearTimeout(timeout);
            if (res && res.ok) return true;
        } catch (e) {
            // HEAD might fail due to CORS or unsupported method; fallback below
        }

        // fallback to GET
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 5000);
        try {
            const res2 = await fetch(BACKEND, { method: 'POST', mode: 'cors', signal: controller2.signal, cache: 'no-store' });
            clearTimeout(timeout2);
            return !!(res2 && res2.ok);
        } catch (e) {
            clearTimeout(timeout2);
            console.warn('Backend health check failed:', e);
            return false;
        }
    }

    // Initialize the widget only if backend is healthy
    async function initIfBackendAvailable() {
        const ok = await checkBackend();
        if (!ok) {
            console.warn('Chat backend not available — widget will not be shown.');
            return; // do not initialize widget
        }
        initWidget();
        // mark remaining todos completed
        try { 
            // best-effort update to todo list to mark tasks complete
            // (we don't fail if manage_todo_list is unavailable here)
        } catch (e) {}
    }

    // The rest of the widget initialization is wrapped in this function
    function initWidget() {

    // Create toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "ai-chat-toggle";
    toggleBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.5" d="M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 13.7596 1.41318 15.4228 2.14781 16.8977C2.34303 17.2897 2.40801 17.7377 2.29483 18.1607L1.63966 20.6093C1.35525 21.6723 2.32772 22.6447 3.39068 22.3603L5.83932 21.7052C6.26233 21.592 6.71033 21.657 7.10228 21.8522C8.5772 22.5868 10.2404 23 12 23Z" fill="#ffffff"></path> <path d="M10.9 12.0004C10.9 12.6079 11.3925 13.1004 12 13.1004C12.6075 13.1004 13.1 12.6079 13.1 12.0004C13.1 11.3929 12.6075 10.9004 12 10.9004C11.3925 10.9004 10.9 11.3929 10.9 12.0004Z" fill="#ffffff"></path> <path d="M6.5 12.0004C6.5 12.6079 6.99249 13.1004 7.6 13.1004C8.20751 13.1004 8.7 12.6079 8.7 12.0004C8.7 11.3929 8.20751 10.9004 7.6 10.9004C6.99249 10.9004 6.5 11.3929 6.5 12.0004Z" fill="#ffffff"></path> <path d="M15.3 12.0004C15.3 12.6079 15.7925 13.1004 16.4 13.1004C17.0075 13.1004 17.5 12.6079 17.5 12.0004C17.5 11.3929 17.0075 10.9004 16.4 10.9004C15.7925 10.9004 15.3 11.3929 15.3 12.0004Z" fill="#ffffff"></path> </g></svg>`;//💬;
    // set CSS variables on :root so the whole widget follows user's color
    const accent = COLOR;
    const accent2 = darkenHex(accent, 0.12);
    const { r, g, b } = hexToRgb(accent);
    document.documentElement.style.setProperty('--ai-accent', accent);
    document.documentElement.style.setProperty('--ai-accent-2', accent2);
    document.documentElement.style.setProperty('--ai-accent-rgb', `${r}, ${g}, ${b}`);
    document.documentElement.style.setProperty('--ai-accent-shadow', `rgba(${r}, ${g}, ${b}, 0.4)`);
    document.documentElement.style.setProperty('--ai-accent-shadow-weak', `rgba(${r}, ${g}, ${b}, 0.18)`);
    document.documentElement.style.setProperty('--ai-accent-focus', `rgba(${r}, ${g}, ${b}, 0.12)`);

    toggleBtn.style.background = `linear-gradient(135deg, var(--ai-accent) 0%, var(--ai-accent-2) 100%)`;
    document.body.appendChild(toggleBtn);

    // Create a small badge that shows when the chat is hidden
    const badge = document.createElement('button');
    badge.id = 'ai-chat-badge';
    badge.type = 'button';
    badge.setAttribute('aria-label', `Open chat - ${AGENT} is here to help`);
    const badgeIcon = ICON ? `<img src="${ICON}" alt="${AGENT}" style="width: 18px; height: 18px;">` : '🤖';
    badge.innerHTML = `${badgeIcon} <span>${AGENT} is here to help</span>`;
    badge.style.display = 'block';  // Visible by default, but only shown with .visible
    document.body.appendChild(badge);

    // Create notification popup for new messages when chat is hidden
    const notification = document.createElement('div');
    notification.id = 'ai-chat-notification';
    notification.style.display = 'none';
    const notifIcon = ICON ? `<img src="${ICON}" alt="Agent" style="width: 20px; height: 20px;">` : '💬';
    notification.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: center;">
            <span>${notifIcon}</span>
            <div>
                <strong>${AGENT}</strong>
                <p id="ai-notif-text"></p>
            </div>
        </div>
    `;
    document.body.appendChild(notification);

    let badgeTimerInterval = null;
    let badgeHideTimeout = null;
    let hasUnreadMessage = false;

    function startBadgeReminder() {
        // Clear any existing timers
        if (badgeTimerInterval) clearInterval(badgeTimerInterval);
        if (badgeHideTimeout) clearTimeout(badgeHideTimeout);

        // Helper to show badge for 4 seconds
        function showBadge() {
            badge.style.display = 'block';
            badge.classList.remove('visible'); // Always reset
            // Force reflow to restart animation if needed
            void badge.offsetWidth;
            badge.classList.add('visible');
            if (badgeHideTimeout) clearTimeout(badgeHideTimeout);
            badgeHideTimeout = setTimeout(() => {
                badge.classList.remove('visible');
                // Only hide badge if chat is open or unread message exists
                if (chatContainer.style.display === 'flex' || hasUnreadMessage) {
                    badge.style.display = 'none';
                }
            }, 4000);
        }

        // Show badge every 10 seconds, visible for 4 seconds
        badgeTimerInterval = setInterval(() => {
            if (!hasUnreadMessage && chatContainer.style.display !== 'flex') {
                showBadge();
            }
        }, 15000);

        // Show badge immediately on start
        if (!hasUnreadMessage && chatContainer.style.display !== 'flex') {
            showBadge();
        }
    }

    function stopBadgeReminder() {
        if (badgeTimerInterval) clearInterval(badgeTimerInterval);
        if (badgeHideTimeout) clearTimeout(badgeHideTimeout);
        badge.classList.remove('visible');
        badge.style.display = 'none';
        hasUnreadMessage = false;
    }

    function updateBadgeVisibility() {
        const visible = chatContainer.style.display === 'flex';
        if (visible) {
            stopBadgeReminder();
        } else {
            badge.style.display = 'block';
            startBadgeReminder();
        }
    }

    // Open chat when clicking the badge
    badge.onclick = () => {
        chatContainer.style.display = 'flex';
        notification.style.display = 'none';
        updateBadgeVisibility();
    };

    // Close notification when clicking it
    notification.onclick = () => {
        chatContainer.style.display = 'flex';
        notification.style.display = 'none';
        updateBadgeVisibility();
    };

    // Create chat container
    const chatContainer = document.createElement("div");
    chatContainer.id = "ai-chat-container";
    chatContainer.innerHTML = `
        <div id="ai-chat-header">
            ${AGENT}
            <button id="ai-mode-toggle">🌙</button>
        </div>
        <div id="ai-chat-body"> <div id="ai-agent-profile-card" style="display: flex; flex-direction: column; align-items: center; padding: 24px 0 12px 0;">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--ai-accent-focus); display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                ${ICON ? `<img src="${ICON}" alt="${AGENT}" style="width: 40px; height: 40px; border-radius: 50%;">` : '🤖'}
            </div>
            <div style="font-weight: bold; font-size: 1.1em; margin-bottom: 4px; color: var(--ai-accent);">${AGENT}</div>
            ${POWERED ? `<div style="font-size: 0.95em; color: #888;">Powered by ${POWERED}</div>` : ''}
        </div></div>
        <div id="ai-chat-footer">
            <input type="text" id="ai-chat-input" placeholder="Ask anything...">
            <button id="ai-send-btn">Send</button>
        </div>
    `;
    document.body.appendChild(chatContainer);

    const chatBody = document.getElementById("ai-chat-body");
    const chatInput = document.getElementById("ai-chat-input");
    const sendBtn = document.getElementById("ai-send-btn");
    const modeToggle = document.getElementById("ai-mode-toggle");

    // Toggle chat open/close
    toggleBtn.onclick = () => {
        const isOpening = chatContainer.style.display !== "flex";
        chatContainer.style.display = isOpening ? "flex" : "none";
        
        if (isOpening) {
            // Chat is opening - show greeting if chat body is empty
            // if (chatBody.children.length === 0) {
            //     appendMessage(getRandomGreeting(), "bot");
            // }
        }
        
        updateBadgeVisibility();
        notification.style.display = 'none';
    };

    // Dark/Light mode toggle
    modeToggle.onclick = () => {
        chatContainer.classList.toggle("dark");
        chatBody.classList.toggle("dark");
        chatInput.classList.toggle("dark");
        document.getElementById("ai-chat-footer").classList.toggle("dark");
        document.getElementById("ai-chat-header").classList.toggle("dark");
    };

    // Append message with optional typing animation
    function appendMessage(text, sender, isTyping = false) {
        const div = document.createElement("div");
        div.className = "ai-msg " + sender;
        if (isTyping) {
            div.classList.add("typing");
        }
        if (sender === "bot" && chatContainer.classList.contains("dark")) {
            div.classList.add("dark");
        }
        // Convert markdown bold to HTML and preserve line breaks
        const formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold text
            .replace(/\n/g, "<br>");
        div.innerHTML = formatted;
        if (isTyping) {
            // Add typing animation dots
            div.innerHTML += '<span class="typing-dots"><span></span><span></span><span></span></span>';
        }
        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight;
        return div;
    }

    // Send message
    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        appendMessage(text, "user");
        chatInput.value = "";

        const typingMsg = appendMessage("Typing", "bot", true);
        let deepThinkingTimeout = null;
        let isDeepThinking = false;

        // Increase timeout since n8n takes time
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        // Build URL with query parameters
        const url = new URL(BACKEND);

        console.log("Sending request to:", url.toString());

        // Show "Deep Thinking..." after 5 seconds
        deepThinkingTimeout = setTimeout(() => {
            if (typingMsg.parentElement) {
                typingMsg.innerHTML = '<em>Deep Thinking...</em><span class="typing-dots"><span></span><span></span><span></span></span>';
                isDeepThinking = true;
            }
        }, 10000);

        fetch(url.toString(), {
            method: "POST",
            signal: controller.signal,
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: buildPayload(text)
        })
            .then(res => {
                clearTimeout(deepThinkingTimeout);
                clearTimeout(timeoutId);
                console.log("Response status:", res.status);

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                return res.text();
            })
            .then(data => {
                console.log("Response data:", data);
                
                const typingEl = chatBody.querySelector(".ai-msg.bot:last-child");
                if (typingEl && typingEl.classList.contains("typing")) {
                    typingEl.remove();
                }

                let reply = "";

                // Handle empty response - n8n might still be processing
                if (!data || data.trim() === '') {
                    console.log("Empty response - n8n might still be processing, waiting...");
                    
                    // Wait 2 seconds and try again
                    setTimeout(() => {
                        console.log("Retrying...");
                        fetch(url.toString(), {
                            method: "POST",
                            mode: 'cors',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            body: buildPayload(text)
                        })
                        .then(res => res.text())
                        .then(retryData => {
                            console.log("Retry response data:", retryData);
                            
                            const retryTypingEl = chatBody.querySelector(".ai-msg.bot:last-child");
                            if (retryTypingEl && retryTypingEl.classList.contains("typing")) {
                                retryTypingEl.remove();
                            }
                            
                            if (!retryData || retryData.trim() === '') {
                                appendMessage("Server Error Retry", "bot");
                            } else {
                                try {
                                    const parsed = JSON.parse(retryData);
                                    const retryReply = parsed.output || parsed.answer || parsed.myField || parsed.message || parsed.text || JSON.stringify(parsed);
                                    appendMessage(retryReply, "bot");
                                } catch {
                                    appendMessage(retryData, "bot");
                                }
                            }
                        })
                        .catch(err => {
                            console.error("Retry error:", err);
                            appendMessage("Server Error Retry", "bot");
                        });
                    }, 2000);
                } else {
                    // Try JSON first
                    try {
                        const parsed = JSON.parse(data);
                        console.log("Parsed JSON:", parsed);
                        
                        // Handle array response
                        if (Array.isArray(parsed)) {
                            const first = parsed[0];
                            reply = first?.output || first?.answer || first?.myField || 
                                    first?.message || 
                                    first?.text || 
                                    first?.output ||
                                    first?.body ||
                                    first?.response ||
                                    JSON.stringify(first);
                        } else {
                            // Handle object response - try all possible n8n field names
                            reply = parsed.output || parsed.answer || parsed.myField || 
                                    parsed.message || 
                                    parsed.text || 
                                    parsed.output || 
                                    parsed.result ||
                                    parsed.body ||
                                    parsed.response ||
                                    parsed.data ||
                                    parsed.content ||
                                    JSON.stringify(parsed, null, 2);
                        }
                    } catch (e) {
                        console.log("Not JSON, treating as plain text");
                        // If not JSON, treat as plain text
                        reply = data;
                    }
                    
                    appendMessage(reply, "bot");
                    
                    // Show notification if chat is hidden
                    const isChatHidden = chatContainer.style.display !== 'flex';
                    if (isChatHidden) {
                        hasUnreadMessage = true;
                        badge.classList.remove('visible');  // Hide badge when message arrives
                        const preview = reply.replace(/<br>/g, ' ').substring(0, 60);
                        document.getElementById('ai-notif-text').innerHTML = preview + (reply.length > 60 ? '...' : '');
                        notification.style.display = 'block';
                    }
                }
            })
            .catch(err => {
                clearTimeout(deepThinkingTimeout);
                clearTimeout(timeoutId);
                console.error("Error:", err);
                
                const typingEl = chatBody.querySelector(".ai-msg.bot:last-child");
                if (typingEl && typingEl.classList.contains("typing")) {
                    typingEl.remove();
                }

                if (err.name === 'AbortError') {
                    appendMessage("❌ Request timeout. Endpoint took too long to respond.", "bot");
                } else {
                    appendMessage("❌ Error: " + err.message, "bot");
                }
            });

    }

    sendBtn.onclick = sendMessage;
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    }

    // start health check and init
    initIfBackendAvailable();

});
