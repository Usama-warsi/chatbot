# AI Chatbot Widget

One-file chatbot widget for any website. `chatbot.js` adds its own CSS and HTML, and talks to an n8n workflow (`Multi-Site-Chatbot.json`).

## Use on a website

```html
<script>
  window.AIChatConfig = {
    agent: "Eric",
    color: "#FF4001",
    prompt: "What the bot should know about this website...",
    apiUrl: ""        // optional: URL of this website's data API
  };
</script>
<script src="https://cdn.jsdelivr.net/gh/Usama-warsi/chatbot@main/chatbot.js"></script>
```

Or start it yourself:

```html
<script src="https://cdn.jsdelivr.net/gh/Usama-warsi/chatbot@main/chatbot.js" data-auto="false"></script>
<script>
  AIChat.init({ agent: "Eric", color: "#7c3aed", prompt: "..." });
</script>
```

### Options

| Option      | Meaning                                         |
|-------------|-------------------------------------------------|
| `agent`     | Bot name (default: Eric)                        |
| `color`     | Widget colour                                   |
| `prompt`    | What the bot should know about the website      |
| `apiUrl`    | Optional API URL with the website's data        |
| `icon`      | Avatar image URL                                |
| `poweredBy` | "Powered by ..." text                           |
| `domain`    | Defaults to the current site                    |
| `backend`   | n8n webhook URL                                 |

## n8n

Import `Multi-Site-Chatbot.json`, choose the OpenRouter credential, and publish the workflow.
