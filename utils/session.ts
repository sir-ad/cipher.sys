export const CIPHER_STORAGE_KEYS = [
  'vanish_tasks',
  'vanish_stats',
  'vanish_last_burn',
  'vanish_is_deployed',
  'agent_codename',
  'cipher_syndicate_mode',
  'cipher_manual_ip',
];

export const wipeCipherLocalState = (): void => {
  try {
    CIPHER_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));

    // Defensive cleanup for forward-compatibility with future keys.
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('cipher_') || key.startsWith('vanish_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.error('[CIPHER] Failed to wipe local state', e);
  }
};
