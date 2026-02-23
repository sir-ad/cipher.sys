# AI INTERROGATION

CIPHER.SYS includes a passive scanning system that looks for a local AI Coprocessor.

## OLLAMA INTEGRATION

Every 10 seconds, the daemon pings `http://127.0.0.1:11434/api/tags`. If an active Ollama instance is found, CIPHER enters **Coprocessor Mode**.

```javascript
// Telemetry gathered for the AI
const totalMem = os.totalmem();
const freeMem = os.freemem();
const memUsage = Math.floor(((totalMem - freeMem) / totalMem) * 100);
const uptimeMins = Math.floor(os.uptime() / 60);
```

### The Prompt Structure

Every 45 seconds of inaction, the daemon sends system telemetry to your local LLM with the following prompt:

> *"You are an aggressive covert ops AI Handler monitoring an operative. Host System State: ${platform} architecture, RAM at ${memUsage}% capacity. The operative has ${tasks} pending directives. The oldest is: "${target}". Give them a 2-sentence threatening sitrep using espionage terminology. Mention the host system state to add urgency. No pleasantries."*

The response is broadcasted to the frontend UI as a `[HANDLER_MESSAGE]` via WebSockets, triggering an audio ping.

!!! note "PRIVACY SECURED"
    Because this hooks exclusively into localhost:11434 (Ollama), your tasks and system telemetry **never leave your physical hardware**.
