import { onMessage } from '../shared/messaging';

/**
 * 记住用户最后聚焦的文本输入元素
 * 当用户点击 Popup 时页面 focus 会丢失，所以需要提前记录
 */
let lastFocusedInput: HTMLElement | null = null;

function isTextInput(el: EventTarget | null): el is HTMLElement {
  if (!el || !(el instanceof HTMLElement)) return false;

  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement && el.type === 'text') return true;
  if (el.getAttribute('contenteditable') === 'true') return true;
  if (el.getAttribute('role') === 'textbox') return true;

  return false;
}

// 监听所有 focusin 事件，记住最后一个被聚焦的输入框
document.addEventListener(
  'focusin',
  (e) => {
    if (isTextInput(e.target)) {
      lastFocusedInput = e.target as HTMLElement;
    }
  },
  true,
);

function injectToTextarea(element: HTMLTextAreaElement, text: string): void {
  element.focus();
  const nativeSetter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    'value',
  )?.set;

  if (nativeSetter) {
    nativeSetter.call(element, text);
  } else {
    element.value = text;
  }

  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function injectToContentEditable(element: HTMLElement, text: string): void {
  element.focus();

  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  const success = document.execCommand('insertText', false, text);

  if (!success) {
    element.textContent = text;
    element.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text,
      }),
    );
  }
}

function injectText(text: string): { success: boolean; reason?: string } {
  // 使用用户最后聚焦的输入框
  const element = lastFocusedInput;

  if (!element || !document.body.contains(element)) {
    return { success: false, reason: 'no-focus' };
  }

  if (element instanceof HTMLTextAreaElement) {
    injectToTextarea(element, text);
  } else if (
    element.getAttribute('contenteditable') === 'true' ||
    element.getAttribute('role') === 'textbox'
  ) {
    injectToContentEditable(element, text);
  } else if (element instanceof HTMLInputElement) {
    element.focus();
    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set;
    if (nativeSetter) {
      nativeSetter.call(element, text);
    } else {
      element.value = text;
    }
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    injectToContentEditable(element, text);
  }

  return { success: true };
}

onMessage((message, _sender, sendResponse) => {
  if (message.type === 'INJECT_PROMPT') {
    const result = injectText(message.payload.text);
    sendResponse(result);
  }
});
