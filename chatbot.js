/*!
 * AI Chatbot Widget - single-file embed (no need to edit this file)
 *
 * Way 1 - config object (set it BEFORE loading the script):
 *   <script>
 *     window.AIChatConfig = {
 *       agent: "Eric",
 *       color: "#FF4001",
 *       prompt: "What the bot should know about this website...",
 *       apiUrl: "",      // optional: URL of this website's data API
 *       icon: "",        // optional: avatar image URL
 *       poweredBy: "",   // optional: "Powered by ..." text
 *       poweredByUrl: "", // optional: link for the "Powered by" text
 *       domain: "",      // optional: defaults to the current site
 *       backend: "",     // optional: n8n webhook URL
 *       timeout: 180,    // optional: seconds to wait for a reply
 *       greeting: "",    // optional: first bot message ({agent} = bot name)
 *       autoOpen: true   // optional: open the chat on a visitor's first visit
 *     };
 *   </script>
 *   <script src="https://YOUR-CDN/chatbot.js"></script>
 *
 * Way 2 - init function (start it yourself):
 *   <script src="https://YOUR-CDN/chatbot.js" data-auto="false"></script>
 *   <script>
 *     AIChat.init({ agent: "Eric", color: "#FF4001", prompt: "..." });
 *   </script>
 *
 * Way 3 - data attributes on the script tag:
 *   <script src="https://YOUR-CDN/chatbot.js" data-agent="Eric" data-color="#FF4001"
 *           data-prompt="..." data-api="" data-icon="" data-powered=""></script>
 */
(function () {
"use strict";

// The <script> tag that loaded this file (read now; it is null later)
const SCRIPT_EL = document.currentScript;

// ================= DEFAULT SETTINGS =================
// Used when the <script> tag does not set a data-* attribute.
const CHAT_CONFIG = {
    backend: "https://automation.codrammer.com/webhook/chat-widget",
    agent: "Eric",
    domain: window.location.hostname,
    color: "#0d6efd",
    icon: "",
    poweredBy: "",
    poweredByUrl: "",
    // Text prompt: tell the bot who it is and what it knows about this website
    prompt: "You are a friendly assistant for this website. Help visitors with their questions about our services.",
    // Optional: API URL that returns this website's data (packages, products, prices...). Leave "" if none.
    apiUrl: "",
    // Seconds to wait for a reply (raise it for slow self-hosted models like Ollama)
    timeout: 180,
    // First message from the bot ({agent} = bot name)
    greeting: "Hi! 👋 I'm {agent}. How can I help you today?",
    // Open the chat by itself on a visitor's first visit
    autoOpen: true
};
// ====================================================

const AI_CHAT_RESET = `
:host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    color: #1f2937;
}
*, *::before, *::after { box-sizing: border-box; }
button, input {
    font-family: inherit;
    font-size: inherit;
    line-height: normal;
    margin: 0;
    width: auto;
    height: auto;
    max-width: none;
    text-transform: none;
    letter-spacing: normal;
    text-indent: 0;
    text-shadow: none;
    -webkit-appearance: none;
    appearance: none;
}
img { max-width: none; display: inline-block; }
p { margin: 0; }
#ai-chat-footer input { min-width: 0; color: #1f2937; }
#ai-chat-footer button { flex: 0 0 auto; }
#ai-chat-header { line-height: 1.2; }
`;

const AI_CHAT_CSS = "#ai-chat-toggle {\n    position: fixed;\n    bottom: 25px;\n    right: 25px;\n    background: linear-gradient(135deg, var(--ai-accent) 0%, var(--ai-accent-2) 100%);\n    color: white;\n    border-radius: 50%;\n    width: 70px;\n    height: 70px;\n    border: none;\n    cursor: pointer;\n    font-size: 28px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    z-index: 9999;\n    box-shadow: 0 8px 24px var(--ai-accent-shadow);\n    transition: all 0.3s ease;\n    transform: scale(1);\n    padding:10px;\n}\n\n#ai-chat-toggle:hover {\n    transform: scale(1.1);\n    box-shadow: 0 12px 32px var(--ai-accent-shadow);\n}\n\n#ai-chat-toggle:active {\n    transform: scale(0.95);\n}\n\n/* Small badge shown when chat is hidden */\n#ai-chat-badge {\n    position: fixed;\n    bottom: 100px;\n    right: 25px;\n    background: rgba(var(--ai-accent-rgb), 0.96);\n    color: white;\n    border: none;\n    padding: 8px 12px;\n    border-radius: 999px;\n    box-shadow: 0 8px 24px var(--ai-accent-shadow);\n    font-size: 13px;\n    cursor: pointer;\n    z-index: 9998;\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    transition: opacity 0.5s ease, transform 0.5s ease;\n    opacity: 0;\n    pointer-events: none;\n}\n\n#ai-chat-badge.visible {\n    opacity: 1;\n    pointer-events: auto;\n    animation: badgePulse 0.5s ease-out;\n}\n\n#ai-chat-badge:hover {\n    transform: translateY(-3px);\n    box-shadow: 0 12px 32px var(--ai-accent-shadow);\n}\n\n#ai-chat-badge:focus {\n    outline: none;\n    box-shadow: 0 0 0 4px var(--ai-accent-focus);\n}\n\n@keyframes badgePulse {\n    0% {\n        opacity: 0;\n        transform: scale(0.8) translateY(10px);\n    }\n    100% {\n        opacity: 1;\n        transform: scale(1) translateY(0);\n    }\n}\n\n#ai-chat-container {\n    position: fixed;\n    bottom: 90px;\n    right: 25px;\n    width: 380px;\n    max-height: 600px;\n    background: #fff;\n    border-radius: 16px;\n    box-shadow: 0 20px 60px rgba(0,0,0,0.15);\n    display: flex;\n    flex-direction: column;\n    overflow: hidden;\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;\n    z-index: 9999;\n    display: none;\n    animation: slideUp 0.3s ease-out;\n}\n\n@keyframes slideUp {\n    from {\n        opacity: 0;\n        transform: translateY(20px);\n    }\n    to {\n        opacity: 1;\n        transform: translateY(0);\n    }\n}\n\n#ai-chat-container.dark {\n    background: #1f2937;\n    color: #f3f4f6;\n}\n\n#ai-chat-header {\n    padding: 16px;\n    background: linear-gradient(135deg, var(--ai-accent) 0%, var(--ai-accent-2) 100%);\n    color: white;\n    font-weight: 600;\n    cursor: grab;\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    font-size: 15px;\n    letter-spacing: 0.3px;\n}\n\n#ai-chat-header.dark {\n    background: #111827;\n    color: #f3f4f6;\n}\n\n#ai-chat-body {\n    flex: 1;\n    padding: 16px;\n    overflow-y: auto;\n    background: #f8fafb;\n    scrollbar-width: thin;\n    scrollbar-color: #cbd5e1 transparent;\n    min-height: 300px;\n}\n\n#ai-chat-body::-webkit-scrollbar {\n    width: 6px;\n}\n\n#ai-chat-body::-webkit-scrollbar-track {\n    background: transparent;\n}\n\n#ai-chat-body::-webkit-scrollbar-thumb {\n    background: #cbd5e1;\n    border-radius: 3px;\n}\n\n#ai-chat-body::-webkit-scrollbar-thumb:hover {\n    background: #94a3b8;\n}\n\n#ai-chat-body.dark {\n    background: #1f2937;\n    color: #f3f4f6;\n}\n\n.ai-msg {\n    max-width: 85%;\n    padding: 12px 16px;\n    border-radius: 14px;\n    margin: 10px 0;\n    word-wrap: break-word;\n    line-height: 1.5;\n    font-size: 14px;\n    animation: fadeIn 0.3s ease-in;\n}\n\n@keyframes fadeIn {\n    from {\n        opacity: 0;\n        transform: translateY(10px);\n    }\n    to {\n        opacity: 1;\n        transform: translateY(0);\n    }\n}\n\n.ai-msg.user {\n    background: linear-gradient(135deg, var(--ai-accent) 0%, var(--ai-accent-2) 100%);\n    color: white;\n    margin-left: auto;\n    border-bottom-right-radius: 4px;\n    box-shadow: 0 2px 8px var(--ai-accent-shadow-weak);\n}\n\n.ai-msg.bot {\n    background: #e8eef7;\n    color: #1f2937;\n    margin-right: auto;\n    border-bottom-left-radius: 4px;\n    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);\n}\n\n.ai-msg strong {\n    font-weight: 600;\n    color: inherit;\n}\n\n.ai-msg.user strong {\n    color: #ffffff;\n}\n\n.ai-msg.bot.dark {\n    background: #374151;\n    color: #f3f4f6;\n}\n\n#ai-chat-footer {\n    display: flex;\n    gap: 8px;\n    padding: 12px 16px;\n    border-top: 1px solid #e2e8f0;\n    background: #fff;\n}\n\n#ai-chat-footer.dark {\n    background: #111827;\n    border-top: 1px solid #374151;\n}\n\n#ai-chat-footer input {\n    flex: 1;\n    padding: 11px 14px;\n    border-radius: 8px;\n    border: 1px solid #e2e8f0;\n    background: #f8fafb;\n    font-size: 14px;\n    transition: all 0.2s ease;\n}\n\n#ai-chat-footer input:focus {\n    outline: none;\n    border-color: var(--ai-accent);\n    background: #fff;\n    box-shadow: 0 0 0 3px var(--ai-accent-focus);\n}\n\n#ai-chat-footer input.dark {\n    border: 1px solid #374151;\n    background: #1f2937;\n    color: #f3f4f6;\n}\n\n#ai-chat-footer button {\n    padding: 11px 16px;\n    border: none;\n    border-radius: 8px;\n    cursor: pointer;\n    background: linear-gradient(135deg, var(--ai-accent) 0%, var(--ai-accent-2) 100%);\n    color: white;\n    font-weight: 500;\n    font-size: 13px;\n    transition: all 0.2s ease;\n    min-width: 60px;\n}\n\n#ai-chat-footer button:hover {\n    box-shadow: 0 4px 12px var(--ai-accent-shadow);\n    transform: translateY(-2px);\n}\n\n#ai-chat-footer button:active {\n    transform: translateY(0);\n}\n\n#ai-chat-footer button.dark {\n    background: #2563eb;\n}\n\n/* Mode toggle (moon) button in header */\n#ai-mode-toggle {\n    background: transparent;\n    border: none;\n    color: inherit;\n    font-size: 16px;\n    padding: 6px;\n    border-radius: 8px;\n    cursor: pointer;\n    transition: background 0.15s ease, transform 0.08s ease;\n}\n\n#ai-mode-toggle:hover {\n    background: rgba(var(--ai-accent-rgb), 0.08);\n    transform: translateY(-1px);\n}\n\n#ai-mode-toggle:active {\n    transform: translateY(0);\n}\n\n#ai-mode-toggle:focus {\n    outline: none;\n    box-shadow: 0 0 0 3px var(--ai-accent-focus);\n}\n\n/* Dark header hover fallback */\n#ai-chat-header.dark #ai-mode-toggle:hover {\n    background: rgba(255,255,255,0.06);\n}\n\n/* Notification popup for new messages when chat is hidden */\n#ai-chat-notification {\n    position: fixed;\n    bottom: 100px;\n    right: 25px;\n    background: rgba(var(--ai-accent-rgb), 0.98);\n    color: white;\n    padding: 12px 16px;\n    border-radius: 12px;\n    box-shadow: 0 10px 30px var(--ai-accent-shadow);\n    z-index: 9998;\n    max-width: 320px;\n    font-size: 14px;\n    cursor: pointer;\n    transition: all 0.3s ease;\n    animation: slideInUp 0.3s ease-out;\n}\n\n#ai-chat-notification:hover {\n    transform: translateY(-3px);\n    box-shadow: 0 14px 40px var(--ai-accent-shadow);\n}\n\n#ai-chat-notification strong {\n    display: block;\n    margin-bottom: 4px;\n    font-weight: 600;\n}\n\n#ai-chat-notification p {\n    margin: 0;\n    opacity: 0.95;\n    line-height: 1.4;\n}\n\n@keyframes slideInUp {\n    from {\n        opacity: 0;\n        transform: translateY(20px);\n    }\n    to {\n        opacity: 1;\n        transform: translateY(0);\n    }\n}\n\n/* Typing indicator dots animation */\n.typing-dots {\n    display: inline-flex;\n    gap: 4px;\n    align-items: center;\n    margin-left: 4px;\n}\n\n.typing-dots span {\n    display: inline-block;\n    width: 8px;\n    height: 8px;\n    border-radius: 50%;\n    background: currentColor;\n    opacity: 0.4;\n    animation: typing 1.4s infinite;\n}\n\n.typing-dots span:nth-child(2) {\n    animation-delay: 0.2s;\n}\n\n.typing-dots span:nth-child(3) {\n    animation-delay: 0.4s;\n}\n\n@keyframes typing {\n    0%, 60%, 100% {\n        opacity: 0.4;\n        transform: translateY(0);\n    }\n    30% {\n        opacity: 1;\n        transform: translateY(-8px);\n    }\n}\n";

// Turn data-* attributes into config keys (data-powered -> poweredBy, data-powered-url -> poweredByUrl, data-api -> apiUrl)
function configFromDataset(ds) {
    const out = {};
    if (!ds) return out;
    ["backend", "agent", "domain", "color", "icon", "prompt"].forEach(function (k) {
        if (ds[k]) out[k] = ds[k];
    });
    if (ds.powered) out.poweredBy = ds.powered;
    if (ds.poweredUrl) out.poweredByUrl = ds.poweredUrl;
    if (ds.api) out.apiUrl = ds.api;
    if (ds.timeout) out.timeout = ds.timeout;
    if (ds.greeting) out.greeting = ds.greeting;
    if (ds.autoOpen) out.autoOpen = ds.autoOpen;
    return out;
}

// Drop empty values so they don't wipe out a default
function clean(obj) {
    const out = {};
    Object.keys(obj || {}).forEach(function (k) {
        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") out[k] = obj[k];
    });
    return out;
}

function aiChatInit(userConfig) {
    if (window.__aiChatLoaded) return;
    window.__aiChatLoaded = true;

    // The widget lives inside a Shadow DOM so the website's CSS can't break it
    // (and the widget's CSS can't touch the website).
    const host = document.createElement("ai-chat-root");
    host.style.cssText = "all: initial !important; display: block !important;";
    document.body.appendChild(host);
    const root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    const $ = id => root.querySelector("#" + id);

    const style = document.createElement("style");
    style.textContent = AI_CHAT_RESET + AI_CHAT_CSS;
    root.appendChild(style);

    // Config priority (later wins):
    // defaults < window.AIChatConfig < <script data-*> < <div id="ai-chat-widget" data-*> < AIChat.init({...})
    const containerEl = document.getElementById("ai-chat-widget");
    const cfg = Object.assign({},
        CHAT_CONFIG,
        clean(window.AIChatConfig),
        configFromDataset(SCRIPT_EL && SCRIPT_EL.dataset),
        configFromDataset(containerEl && containerEl.dataset),
        clean(userConfig)
    );
    const BACKEND = cfg.backend || "";
    const AGENT = cfg.agent || "Site Assistant";
    const DOMAIN = cfg.domain || "";
    const COLOR = cfg.color || "#0d6efd";
    const ICON = cfg.icon || "";
    const POWERED = cfg.poweredBy || "";
    // Only allow http(s) links for "Powered by"
    const POWERED_URL = /^https?:\/\//i.test(cfg.poweredByUrl || "") ? cfg.poweredByUrl.replace(/"/g, "&quot;") : "";
    const PROMPT = cfg.prompt || "";
    const API_URL = cfg.apiUrl || "";
    const TIMEOUT_MS = (parseInt(cfg.timeout, 10) || 180) * 1000;

    // Cookie helpers
    function getCookie(name) {
        try {
            const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
            return m ? decodeURIComponent(m[1]) : "";
        } catch (e) { return ""; }
    }
    function setCookie(name, value, days) {
        try {
            const exp = new Date(Date.now() + days * 864e5).toUTCString();
            document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + exp + "; path=/; SameSite=Lax";
        } catch (e) {}
    }

    // Per-visitor session id (cookie, 30 days) so the bot remembers the conversation after reload
    let SESSION_ID = getCookie("ai_chat_sid");
    if (!SESSION_ID) {
        SESSION_ID = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }
    setCookie("ai_chat_sid", SESSION_ID, 30);

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
    
    // Greeting shown to a visitor with no chat yet ({agent} is replaced with the bot name)
    const GREETING = String(cfg.greeting || "Hi! 👋 I'm {agent}. How can I help you today?").replace(/\{agent\}/g, AGENT);
    // Open the chat by itself on the visitor's first visit to this website
    const AUTO_OPEN = cfg.autoOpen !== false && cfg.autoOpen !== "false";
    
    let userIP = "unknown";

    // Fetch user IP (gives up after 3s so the chat history still loads)
    const ipReady = Promise.race([
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => {
                userIP = data.ip || "unknown";
                console.log("User IP detected:", userIP);
            })
            .catch(err => {
                console.log("Could not fetch IP:", err);
            }),
        new Promise(resolve => setTimeout(resolve, 3000))
    ]);

    // Chat history: saved per website + visitor IP so it survives a page reload
    const HISTORY_LIMIT = 50;
    function historyKey() {
        return "ai_chat_history:" + DOMAIN + ":" + userIP;
    }
    function loadHistory() {
        try { return JSON.parse(localStorage.getItem(historyKey()) || "[]"); } catch (e) { return []; }
    }
    function saveHistory(list) {
        try { localStorage.setItem(historyKey(), JSON.stringify(list.slice(-HISTORY_LIMIT))); } catch (e) {}
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
    host.style.setProperty('--ai-accent', accent);
    host.style.setProperty('--ai-accent-2', accent2);
    host.style.setProperty('--ai-accent-rgb', `${r}, ${g}, ${b}`);
    host.style.setProperty('--ai-accent-shadow', `rgba(${r}, ${g}, ${b}, 0.4)`);
    host.style.setProperty('--ai-accent-shadow-weak', `rgba(${r}, ${g}, ${b}, 0.18)`);
    host.style.setProperty('--ai-accent-focus', `rgba(${r}, ${g}, ${b}, 0.12)`);

    toggleBtn.style.background = `linear-gradient(135deg, var(--ai-accent) 0%, var(--ai-accent-2) 100%)`;
    root.appendChild(toggleBtn);

    // Create a small badge that shows when the chat is hidden
    const badge = document.createElement('button');
    badge.id = 'ai-chat-badge';
    badge.type = 'button';
    badge.setAttribute('aria-label', `Open chat - ${AGENT} is here to help`);
    const badgeIcon = ICON ? `<img src="${ICON}" alt="${AGENT}" style="width: 18px; height: 18px;">` : '🤖';
    badge.innerHTML = `${badgeIcon} <span>${AGENT} is here to help</span>`;
    badge.style.display = 'block';  // Visible by default, but only shown with .visible
    root.appendChild(badge);

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
    root.appendChild(notification);

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
                ${ICON ? `<img src="${ICON}" alt="${AGENT}" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover;">` : '<span style="font-size: 38px; line-height: 1;">🤖</span>'}
            </div>
            <div style="font-weight: bold; font-size: 1.1em; margin-bottom: 4px; color: var(--ai-accent);">${AGENT}</div>
            ${POWERED ? `<div style="font-size: 0.95em; color: #888;">Powered by ${POWERED_URL ? `<a href="${POWERED_URL}" target="_blank" rel="noopener" style="color: var(--ai-accent); font-weight: 600; text-decoration: none;">${POWERED}</a>` : POWERED}</div>` : ''}
        </div></div>
        <div id="ai-chat-footer">
            <input type="text" id="ai-chat-input" placeholder="Ask anything...">
            <button id="ai-send-btn">Send</button>
        </div>
    `;
    root.appendChild(chatContainer);

    const chatBody = $("ai-chat-body");
    const chatInput = $("ai-chat-input");
    const sendBtn = $("ai-send-btn");
    const modeToggle = $("ai-mode-toggle");

    // Toggle chat open/close
    toggleBtn.onclick = () => {
        const isOpening = chatContainer.style.display !== "flex";
        chatContainer.style.display = isOpening ? "flex" : "none";
        
        updateBadgeVisibility();
        notification.style.display = 'none';
    };

    // Dark/Light mode toggle
    modeToggle.onclick = () => {
        chatContainer.classList.toggle("dark");
        chatBody.classList.toggle("dark");
        chatInput.classList.toggle("dark");
        $("ai-chat-footer").classList.toggle("dark");
        $("ai-chat-header").classList.toggle("dark");
    };

    // Messages shown in this page view; merged into saved history once it has loaded
    let chatHistory = [];
    let historyLoaded = false;

    function rememberMessage(text, sender) {
        // Don't keep error/status messages
        if (text.startsWith("❌") || text === "Server Error Retry") return;
        chatHistory.push({ text: text, sender: sender });
        if (historyLoaded) saveHistory(chatHistory);
    }

    // Restore earlier messages after a reload
    ipReady.then(() => {
        const saved = loadHistory();
        const newThisPage = chatHistory;
        const firstNew = chatBody.querySelector(".ai-msg");
        saved.forEach(m => {
            const el = renderMessage(m.text, m.sender, false);
            chatBody.insertBefore(el, firstNew);
        });
        chatHistory = saved.concat(newThisPage);
        historyLoaded = true;
        saveHistory(chatHistory);
        chatBody.scrollTop = chatBody.scrollHeight;

        // No chat yet: greet the visitor. On the first visit (no cookie) also open the chat.
        if (chatHistory.length === 0) {
            const firstVisit = !getCookie("ai_chat_greeted");
            setCookie("ai_chat_greeted", "1", 30);
            setTimeout(() => {
                if (firstVisit && AUTO_OPEN && chatContainer.style.display !== "flex") {
                    chatContainer.style.display = "flex";
                    notification.style.display = "none";
                    updateBadgeVisibility();
                }
                if (chatHistory.length === 0) appendMessage(GREETING, "bot");
            }, 1000);
        }
    });

    // Append message with optional typing animation
    function appendMessage(text, sender, isTyping = false) {
        const div = renderMessage(text, sender, isTyping);
        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight;
        if (!isTyping) rememberMessage(text, sender);
        return div;
    }

    function renderMessage(text, sender, isTyping) {
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
            .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)"]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color: inherit; text-decoration: underline;">$1</a>')  // [text](link)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold text
            .replace(/\n/g, "<br>");
        div.innerHTML = formatted;
        if (isTyping) {
            // Add typing animation dots
            div.innerHTML += '<span class="typing-dots"><span></span><span></span><span></span></span>';
        }
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
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        // Build URL with query parameters
        const url = new URL(BACKEND);

        console.log("Sending request to:", url.toString());

        // Show "Deep Thinking..." after 10 seconds
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
                        $('ai-notif-text').innerHTML = preview + (reply.length > 60 ? '...' : '');
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

}

function whenReady(fn) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", fn);
    } else {
        fn();
    }
}

// Public API: AIChat.init({ agent: "Eric", prompt: "...", ... })
window.AIChat = {
    init: function (config) {
        whenReady(function () { aiChatInit(config); });
    }
};

// Auto-start unless the page asked to start it manually with AIChat.init()
const manual = (SCRIPT_EL && SCRIPT_EL.dataset.auto === "false") ||
    (window.AIChatConfig && window.AIChatConfig.autoInit === false);
if (!manual) {
    whenReady(function () { aiChatInit(); });
}

})();
