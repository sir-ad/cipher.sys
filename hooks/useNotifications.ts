import { useEffect, useCallback, useState } from 'react';

/**
 * ============================================================================
 * CIPHER.SYS // NOTIFICATION SUBSYSTEM [COMM-LINK]
 * ============================================================================
 * 
 * TAXONOMY & TRIGGERS:
 * 
 * 1. [comm-link]
 *    - Purpose: Verify initial operative connection and handshake.
 *    - Trigger: Manual permission grant by operative.
 *    - Intrusion Level: Low (Quick double pulse).
 * 
 * 2. [decay-warning]
 *    - Purpose: Warn operative of impending thermal decay for active directives.
 *    - Trigger: Asset drops below 24h or 2h of remaining lifespan.
 *    - Intrusion Level: HIGH (Requires interaction, aggressive SOS vibration).
 * 
 * 3. [asset-purged]
 *    - Purpose: Inform operative that assets were erased due to inaction.
 *    - Trigger: Directive hits 168 hours (7 days) without execution.
 *    - Intrusion Level: CRITICAL (Long harsh shock vibration, red icon).
 * 
 * 4. [mission-log]
 *    - Purpose: Silent heartbeat ping ensuring operative knows the node is active.
 *    - Trigger: Periodic 2-hour SitRep if no urgent warnings exist.
 *    - Intrusion Level: Ghost (Silent, no vibration, updates existing tray tag).
 * 
 * 5. [scorched-earth]
 *    - Purpose: Signal the completion of all tasks and imminent self-destruct.
 *    - Trigger: Final directive executed.
 *    - Intrusion Level: MAXIMUM (Ascending pulse pattern, critical re-notify).
 * ============================================================================
 */

export type NotificationTag = 
  | 'comm-link' 
  | 'decay-warning' 
  | 'asset-purged' 
  | 'mission-log' 
  | 'scorched-earth';

// Encoded SVGs for Sci-Fi Terminal feel based on threat level
const ICON_INFO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23050505'/%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%233b82f6' stroke-width='2' stroke-dasharray='10 5'/%3E%3Ccircle cx='50' cy='50' r='10' fill='%233b82f6'/%3E%3Cpath d='M50 10 L50 30 M50 70 L50 90 M10 50 L30 50 M70 50 L90 50' stroke='%233b82f6' stroke-width='2'/%3E%3C/svg%3E";
const ICON_WARN = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23050505'/%3E%3Cpath d='M50 15 L90 85 L10 85 Z' fill='none' stroke='%23f59e0b' stroke-width='4'/%3E%3Crect x='46' y='40' width='8' height='20' fill='%23f59e0b'/%3E%3Ccircle cx='50' cy='72' r='5' fill='%23f59e0b'/%3E%3C/svg%3E";
const ICON_CRITICAL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23050505'/%3E%3Cpath d='M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z' fill='none' stroke='%23ff0033' stroke-width='4'/%3E%3Crect x='46' y='30' width='8' height='25' fill='%23ff0033'/%3E%3Ccircle cx='50' cy='65' r='5' fill='%23ff0033'/%3E%3C/svg%3E";

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    } else {
      setPermission('denied'); // Unsupported browsers treated as denied
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission === 'granted') {
      setPermission('granted');
      return true;
    }
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (e) {
      console.error('[CIPHER] Notification authorization failed:', e);
      return false;
    }
  }, []);

  const sendTransmission = useCallback((title: string, body: string, tag: NotificationTag = 'mission-log') => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    try {
      let vibrate: number[] | undefined;
      let silent = false;
      let requireInteraction = false;
      let icon = ICON_INFO;

      switch (tag) {
        case 'decay-warning':
          vibrate = [300, 100, 300, 100, 300, 500, 800]; // SOS distress pattern
          requireInteraction = true;
          icon = ICON_WARN;
          break;
        case 'asset-purged':
          vibrate = [800, 200, 800, 200, 1000]; // Heavy harsh shock
          requireInteraction = true;
          icon = ICON_CRITICAL;
          break;
        case 'scorched-earth':
          vibrate = [100, 50, 100, 50, 100, 50, 500, 1000]; // Rapid heartbeat flatlining
          requireInteraction = true;
          icon = ICON_CRITICAL;
          break;
        case 'comm-link':
          vibrate = [50, 100, 50]; // Quick sync double-tap
          icon = ICON_INFO;
          break;
        case 'mission-log':
          silent = true; // Ghost ping. Updates tray without sound/vibration
          icon = ICON_INFO;
          break;
      }

      const isCritical = tag === 'decay-warning' || tag === 'asset-purged' || tag === 'scorched-earth';

      const notification = new Notification(`CIPHER // ${title}`, {
        body,
        tag,
        icon,
        badge: ICON_CRITICAL, // Small monochrome icon for mobile status bars
        renotify: isCritical, // Forces alert again even if notification with this tag exists
        requireInteraction,
        vibrate,
        silent,
      } as any);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.error('[CIPHER] Transmission dispatch failure:', e);
    }
  }, []);

  return { permission, requestPermission, sendTransmission };
};
