/**
 * ====================================================================
 * OVERWATCH GHOST PROTOCOL (Local Command Node) - V4 PHOENIX
 * + SYNDICATE PROTOCOL ENABLED
 * ====================================================================
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const path = require('path');

const PORT = process.env.PORT || 4040;
const DOMAIN = 'cipher.local';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(__dirname));

let mdns;
try {
  mdns = require('multicast-dns')();
  mdns.on('query', (query) => {
    if (query.questions[0] && query.questions[0].name === DOMAIN) {
      const ip = Object.values(os.networkInterfaces())
        .flat()
        .find((i) => i.family === 'IPv4' && !i.internal)?.address;
      if (ip) {
        mdns.respond({ answers: [{ name: DOMAIN, type: 'A', ttl: 300, data: ip }] });
      }
    }
  });
} catch (e) {
  // mDNS not available
}

// SYNDICATE PROTOCOL STATE EXPANSION
let dbState = { 
  mode: 'LONE_WOLF', 
  squadIntegrity: 3, 
  nodes: {}, // Map of socket.id -> { opId, ip, activeTaskCount }
  tasks: [], 
  stats: {}, 
  lastBurnTime: 0 
}; 

let aiCoprocessor = { active: false, type: null, modelCount: 0 };
let activeModelName = '';
const calledTasks = new Set();
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

function detectCoprocessor() {
  http.get('http://127.0.0.1:11434/api/tags', (res) => {
    let rawData = '';
    res.on('data', (chunk) => rawData += chunk);
    res.on('end', () => {
      try {
        const data = JSON.parse(rawData);
        if (data.models && data.models.length > 0) {
          activeModelName = data.models[0].name;
          const newState = { active: true, type: 'OLLAMA', modelCount: data.models.length };
          if (JSON.stringify(aiCoprocessor) !== JSON.stringify(newState)) {
            aiCoprocessor = newState;
            io.emit('coprocessor_status', aiCoprocessor);
          }
        }
      } catch (e) {}
    });
  }).on('error', () => {
    if (aiCoprocessor.active) {
      aiCoprocessor = { active: false, type: null, modelCount: 0 };
      activeModelName = '';
      io.emit('coprocessor_status', aiCoprocessor);
    }
  });
}
setInterval(detectCoprocessor, 10000);
detectCoprocessor();

function mergeTasks(local, remote) {
  const taskMap = new Map();
  [...(local || []), ...(remote || [])].forEach(t => {
    const existing = taskMap.get(t.id);
    const tUpdated = t.updatedAt || t.createdAt || 0;
    const existingUpdated = existing ? (existing.updatedAt || existing.createdAt || 0) : -1;
    if (!existing || tUpdated > existingUpdated) {
      taskMap.set(t.id, t);
    }
  });
  return Array.from(taskMap.values());
}

function mergeStats(local, remote) {
  const l = local || {};
  const r = remote || {};
  return {
    totalCompleted: Math.max(l.totalCompleted || 0, r.totalCompleted || 0),
    totalExpired: Math.max(l.totalExpired || 0, r.totalExpired || 0),
    totalSessions: Math.max(l.totalSessions || 0, r.totalSessions || 0),
    fastestSessionMs: (l.fastestSessionMs && r.fastestSessionMs) 
      ? Math.min(l.fastestSessionMs, r.fastestSessionMs) 
      : (l.fastestSessionMs || r.fastestSessionMs || null)
  };
}

// ------------------------------------------------------------------
// THE M.A.D. ENGINE (MUTUALLY ASSURED DESTRUCTION)
// ------------------------------------------------------------------
function executeMADEngine() {
  if (dbState.mode !== 'SYNDICATE') return;
  
  const now = Date.now();
  let strikeCausedBy = null;
  let tasksMutated = false;

  dbState.tasks = dbState.tasks.map(t => {
    if (t.syndicate && !t.completedAt && !t.deletedAt && (now - t.createdAt > EXPIRY_MS)) {
       strikeCausedBy = t.owner || 'UNKNOWN_OP';
       t.deletedAt = now;
       t.updatedAt = now;
       dbState.squadIntegrity = Math.max(0, dbState.squadIntegrity - 1);
       tasksMutated = true;
       io.emit('integrity_strike', { task: t, strikeCausedBy, currentIntegrity: dbState.squadIntegrity });
    }
    return t;
  });

  if (dbState.squadIntegrity <= 0) {
     io.emit('global_scorched_earth', { culprit: strikeCausedBy });
     dbState.tasks = [];
     dbState.squadIntegrity = 3; 
     dbState.lastBurnTime = now;
  } else if (tasksMutated) {
     io.emit('sync_state', dbState);
  }
}
setInterval(executeMADEngine, 60000);

// Handler Daemon: AI Interrogation
const fallbackQuotes = [
  "Are we lacking executive function today? Execute your directives.",
  "Asset decay approaching. Stop stalling and move.",
  "Your cover is slipping. Complete the primary target.",
  "Thermal inversion is imminent on primary asset. Acknowledge and execute."
];

function triggerHandlerInterrogation() {
  const activeTasks = dbState.tasks.filter(t => !t.completedAt && !t.deletedAt);
  if (activeTasks.length === 0) return;

  const targetTask = activeTasks[0].text; 
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memUsage = Math.floor(((totalMem - freeMem) / totalMem) * 100);
  const uptimeMins = Math.floor(os.uptime() / 60);
  const platform = os.platform();

  if (aiCoprocessor.active && activeModelName) {
    const prompt = `You are an aggressive covert ops AI Handler monitoring an operative. 
    Host System State: ${platform} architecture, RAM at ${memUsage}% capacity, uptime ${uptimeMins} minutes. 
    The operative has ${activeTasks.length} pending directives. The oldest is: "${targetTask}". 
    Give them a 2-sentence threatening sitrep using espionage terminology. Mention the host system state (e.g., 'memory is degrading') to add urgency. No pleasantries.`;
    
    const data = JSON.stringify({ model: activeModelName, prompt: prompt, stream: false });
    const req = http.request('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (json.response) {
            io.emit('handler_message', { text: json.response.trim(), timestamp: Date.now(), isAI: true });
          }
        } catch(e) {}
      });
    });
    req.on('error', () => {});
    req.write(data);
    req.end();
  } else {
    if (Math.random() > 0.5) {
      const quote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      io.emit('handler_message', { text: `[SYSTEM_DAEMON] Target "${targetTask}" is pending. Host RAM at ${memUsage}%. ${quote}`, timestamp: Date.now(), isAI: false });
    }
  }
}
setInterval(triggerHandlerInterrogation, 45000);

function checkIncomingCalls() {
  const now = Date.now();
  dbState.tasks.forEach(t => {
    if (!t.completedAt && !t.deletedAt) {
      const age = now - t.createdAt;
      const timeLeft = EXPIRY_MS - age;
      if (timeLeft > 0 && timeLeft < ONE_HOUR_MS && !calledTasks.has(t.id)) {
        calledTasks.add(t.id);
        io.emit('incoming_call', { taskId: t.id, text: t.text });
      }
    }
  });
}
setInterval(checkIncomingCalls, 15000);

function broadcastNodeStatus() {
  const ip = Object.values(os.networkInterfaces())
    .flat()
    .find((i) => i.family === 'IPv4' && !i.internal)?.address;
  io.emit('node_status', { online: true, activeNodes: io.engine.clientsCount, networkIp: ip });
  io.emit('squad_update', Object.values(dbState.nodes));
}

io.on('connection', (socket) => {
  broadcastNodeStatus();
  socket.emit('sync_state', dbState);
  socket.emit('coprocessor_status', aiCoprocessor);

  // ------------------------------------------------------------------
  // SYNDICATE PROTOCOL EVENTS
  // ------------------------------------------------------------------
  socket.on('join_syndicate', ({ opId, activeTaskCount }) => {
    dbState.mode = 'SYNDICATE';
    const ip = socket.handshake.address.includes('::') ? '127.0.0.1' : socket.handshake.address;
    dbState.nodes[socket.id] = { socketId: socket.id, opId: opId.toUpperCase(), ip, activeTaskCount };
    broadcastNodeStatus();
  });

  socket.on('delegate_directive', (payload) => {
    const { targetOpId, text, handler } = payload;
    
    // Find target node
    const targetNode = Object.values(dbState.nodes).find(n => n.opId === targetOpId);
    
    if (!targetNode) {
      socket.emit('delegation_rejected', `[!] TARGET ${targetOpId} NOT FOUND ON RADAR.`);
      return;
    }
    
    if (targetNode.activeTaskCount >= 5) {
      socket.emit('delegation_rejected', `[!] REJECTED: ${targetOpId} AT MAXIMUM CAPACITY (5/5).`);
      return;
    }

    const taskId = require('crypto').randomUUID ? require('crypto').randomUUID() : Date.now().toString();
    const directiveTask = {
      id: taskId,
      text: text,
      createdAt: Date.now(),
      completedAt: null,
      owner: targetOpId,
      handler: handler,
      status: 'ACTIVE',
      syndicate: true
    };

    io.to(targetNode.socketId).emit('incoming_directive', directiveTask);
  });

  socket.on('accept_directive', (task) => {
    task.updatedAt = Date.now();
    dbState.tasks.push(task);
    if (dbState.nodes[socket.id]) {
       dbState.nodes[socket.id].activeTaskCount += 1;
       io.emit('squad_update', Object.values(dbState.nodes));
    }
    io.emit('sync_state', dbState);
  });

  socket.on('reject_directive', (payload) => {
    const { handler, taskId, text } = payload;
    const handlerNode = Object.values(dbState.nodes).find(n => n.opId === handler);
    if (handlerNode) {
      io.to(handlerNode.socketId).emit('delegation_rejected', `[!] BOUNCED: Target rejected directive: "${text}"`);
    }
  });

  socket.on('request_verification', (taskId) => {
    const task = dbState.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'PENDING_VERIFICATION';
      task.updatedAt = Date.now();
      const handlerNode = Object.values(dbState.nodes).find(n => n.opId === task.handler);
      if (handlerNode) {
        io.to(handlerNode.socketId).emit('verify_required', task);
      }
      io.emit('sync_state', dbState);
    }
  });

  socket.on('confirm_kill', (taskId) => {
    const task = dbState.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'NEUTRALIZED';
      task.completedAt = Date.now();
      task.updatedAt = Date.now();
      
      const ownerNode = Object.values(dbState.nodes).find(n => n.opId === task.owner);
      if (ownerNode) {
        io.to(ownerNode.socketId).emit('kill_confirmed', task);
      }

      // Update nodes active counts by re-counting (only tasks they own)
      Object.keys(dbState.nodes).forEach(sid => {
        const opId = dbState.nodes[sid].opId;
        dbState.nodes[sid].activeTaskCount = dbState.tasks.filter(t => (t.owner === opId || !t.owner) && t.completedAt === null && !t.deletedAt).length;
      });
      io.emit('squad_update', Object.values(dbState.nodes));
      io.emit('sync_state', dbState);
    }
  });

  socket.on('deny_kill', (taskId) => {
    const task = dbState.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'ACTIVE';
      task.updatedAt = Date.now();
      
      const ownerNode = Object.values(dbState.nodes).find(n => n.opId === task.owner);
      if (ownerNode) {
        io.to(ownerNode.socketId).emit('kill_denied', task);
      }

      io.emit('sync_state', dbState);
    }
  });
  // ------------------------------------------------------------------

  socket.on('update_state', (newState) => {
    if (newState.syndicateMode && newState.lastBurnTime && newState.lastBurnTime > dbState.lastBurnTime) {
      dbState.lastBurnTime = newState.lastBurnTime;
      dbState.tasks = [];
      calledTasks.clear();
    }
    const validTasks = (newState.tasks || []).filter(t => t.createdAt >= dbState.lastBurnTime);
    dbState.tasks = mergeTasks(dbState.tasks, validTasks);
    dbState.stats = mergeStats(dbState.stats, newState.stats);
    
    // Update local active capacity (must enforce scoping to owned tasks)
    if (dbState.nodes[socket.id]) {
      const opId = dbState.nodes[socket.id].opId;
      const activeCount = validTasks.filter(t => (t.owner === opId || !t.owner) && t.completedAt === null && !t.deletedAt).length;
      dbState.nodes[socket.id].activeTaskCount = activeCount;
      io.emit('squad_update', Object.values(dbState.nodes));
    }

    socket.broadcast.emit('sync_state', dbState);
  });

  socket.on('disconnect', () => {
    if (dbState.nodes[socket.id]) {
      delete dbState.nodes[socket.id];
    }
    broadcastNodeStatus();
  });

  socket.on('initiate_burn', (payload) => {
    const reason = payload?.reason;
    const isSyndicate = payload?.syndicateMode;
    const opId = payload?.opId;

    if (isSyndicate) {
      dbState.lastBurnTime = Date.now();
      dbState.tasks = [];
      calledTasks.clear();
      socket.broadcast.emit('execute_kill', reason);
    } else {
      // Local lone wolf burn isolates their own tasks without destroying the server network
      dbState.tasks = dbState.tasks.filter(t => t.owner !== opId);
    }
    socket.broadcast.emit('sync_state', dbState);
  });

  socket.on('terminate_host_process', () => {
    io.close(() => {
      server.close(() => {
        process.exit(0);
      });
    });
    setTimeout(() => process.exit(0), 1500);
  });
});

server.listen(PORT, () => {
  // Silent startup because it is now running detached.
});
