import React, { useState, useEffect } from 'react';

export const StealthMode: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    // Generate initial fake logs so it's not empty immediately
    const initialLogs = Array.from({ length: 30 }, () => generateLogEntry());
    setLogs(initialLogs);

    const interval = setInterval(() => {
      setLogs(prev => [...prev.slice(-40), generateLogEntry()]);
    }, 400 + Math.random() * 800);
    
    return () => clearInterval(interval);
  }, []);

  const generateLogEntry = () => {
    const timestamp = new Date().toISOString();
    const pids = [1423, 854, 12, 1, 9924, 304, 8812, 451];
    const pid = pids[Math.floor(Math.random() * pids.length)];
    const actions = [
      '[OK] systemd: Started Session', 
      '[INFO] kernel: TCP keepalive timeout', 
      '[WARN] sshd: Invalid user from 192.168.1.45', 
      'GET /api/v1/health HTTP/1.1 200', 
      'worker process exited with code 0',
      'nginx: worker process is active',
      '[DEBUG] allocating 2048 bytes for node buffer',
      'cron: (root) CMD ( /usr/lib64/sa/sa1 1 1 )'
    ];
    const action = actions[Math.floor(Math.random() * actions.length)];
    return `${timestamp} ip-172-31-45-92 [${pid}]: ${action}`;
  };

  return (
    <div className="fixed inset-0 bg-[#000000] text-[#00ff00] font-mono text-[10px] sm:text-xs md:text-sm p-4 overflow-hidden z-[9999] select-none leading-relaxed">
      <div className="flex flex-col h-full justify-end">
        {logs.map((log, i) => (
          <div key={i} className="whitespace-pre-wrap break-all opacity-80">{log}</div>
        ))}
        <div className="animate-pulse w-2 h-4 bg-[#00ff00] mt-1 inline-block"></div>
      </div>
    </div>
  );
};
