// Optional: bridge helpers for content script
// Add port-based long-lived connection or extra helpers when needed.

export const connectPort = (name = 'ces-port') => chrome.runtime.connect({ name });
