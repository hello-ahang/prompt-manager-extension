import type { Message } from './types';

export function sendToBackground(message: Message): Promise<unknown> {
  return chrome.runtime.sendMessage(message);
}

export async function sendToContentScript(
  tabId: number,
  message: Message,
): Promise<unknown> {
  return chrome.tabs.sendMessage(tabId, message);
}

export function onMessage(
  handler: (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => boolean | void,
): void {
  chrome.runtime.onMessage.addListener(handler);
}
