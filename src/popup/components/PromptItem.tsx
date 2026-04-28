import { useCallback, useState } from 'react';
import type { Prompt } from '../../shared/types';

interface PromptItemProps {
  prompt: Prompt;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PromptItem({ prompt, onEdit, onDelete }: PromptItemProps) {
  const [injecting, setInjecting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleClick = useCallback(async () => {
    setInjecting(true);
    setStatus('idle');
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) {
        setStatus('error');
        return;
      }

      const textToInject = `--用户输入：\n\n--系统提示词：\n${prompt.content}`;

      // 方案1: 尝试通过 Content Script 消息注入
      let injected = false;
      try {
        const csResponse = await chrome.tabs.sendMessage(tab.id, {
          type: 'INJECT_PROMPT',
          payload: { text: textToInject },
        });
        if ((csResponse as { success?: boolean })?.success) {
          injected = true;
        }
      } catch {
        // Content Script 未加载，继续尝试方案2
      }

      // 方案2: 使用 chrome.scripting.executeScript 动态注入
      if (!injected) {
        // 先尝试主框架
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          func: (text: string) => {
            try {
              // 查找页面上的输入框
              const selectors = [
                'textarea',
                'div[contenteditable="true"][role="textbox"]',
                'div[contenteditable="true"]',
                '[role="textbox"]',
                'input[type="text"]',
                'input:not([type])',
              ];

              let element: HTMLElement | null = null;
              for (const selector of selectors) {
                element = document.querySelector<HTMLElement>(selector);
                if (element) break;
              }

              if (!element) {
                return { success: false, info: `no-input(url=${location.href.slice(0,50)})` };
              }

              const tagInfo = `${element.tagName}.${element.className?.toString().slice(0,30)}`;

              if (element instanceof HTMLTextAreaElement) {
                element.focus();
                const nativeSetter = Object.getOwnPropertyDescriptor(
                  HTMLTextAreaElement.prototype, 'value',
                )?.set;
                if (nativeSetter) {
                  nativeSetter.call(element, text);
                } else {
                  element.value = text;
                }
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return { success: true, info: tagInfo };
              } else if (element instanceof HTMLInputElement) {
                element.focus();
                const nativeSetter = Object.getOwnPropertyDescriptor(
                  HTMLInputElement.prototype, 'value',
                )?.set;
                if (nativeSetter) {
                  nativeSetter.call(element, text);
                } else {
                  element.value = text;
                }
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return { success: true, info: tagInfo };
              } else {
                element.focus();
                const selection = window.getSelection();
                if (selection) {
                  const range = document.createRange();
                  range.selectNodeContents(element);
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
                if (!document.execCommand('insertText', false, text)) {
                  element.textContent = text;
                  element.dispatchEvent(
                    new InputEvent('input', {
                      bubbles: true, cancelable: true,
                      inputType: 'insertText', data: text,
                    }),
                  );
                }
                return { success: true, info: tagInfo };
              }
            } catch (err) {
              return { success: false, info: `exec-err: ${String(err)}` };
            }
          },
          args: [textToInject],
        });

        // 检查所有 frame 的结果，任一成功即可
        const successResult = results?.find(
          (r) => (r.result as { success?: boolean })?.success,
        );
        if (successResult) {
          injected = true;
        } else {
          // 收集所有 frame 的错误信息
          const infos = results
            ?.map((r) => (r.result as { info?: string })?.info)
            .filter(Boolean)
            .join(' | ');
          setErrorMsg(infos || `${results?.length ?? 0} frames checked`);
        }
      }

      if (injected) {
        setStatus('success');
        setErrorMsg('');
      } else {
        setStatus('error');
      }
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setInjecting(false);
      setTimeout(() => setStatus('idle'), 2000);
    }
  }, [prompt.content]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm(`确定删除「${prompt.title}」？`)) {
        onDelete(prompt.id);
      }
    },
    [prompt, onDelete],
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(prompt.id);
    },
    [prompt.id, onEdit],
  );

  const preview =
    prompt.content.length > 80
      ? prompt.content.slice(0, 80) + '...'
      : prompt.content;

  return (
    <div
      onClick={handleClick}
      className={`group relative p-2.5 rounded-lg border cursor-pointer transition-all ${
        status === 'success'
          ? 'border-green-300 bg-green-50'
          : status === 'error'
            ? 'border-red-300 bg-red-50'
            : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-800 truncate">
            {prompt.title}
          </h3>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed line-clamp-2">
            {preview}
          </p>
        </div>

        <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-indigo-500 hover:bg-indigo-50"
              title="编辑"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175l-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
              title="删除"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H5.5l1-1h3l1 1H14a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
              </svg>
            </button>
          </div>
      </div>

      {injecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
          <span className="text-xs text-gray-500">注入中...</span>
        </div>
      )}
      {status === 'success' && (
        <div className="absolute top-1 right-1 text-green-500 text-[10px]">
          已注入
        </div>
      )}
      {status === 'error' && (
        <div className="absolute top-1 right-1 text-red-500 text-[10px] max-w-[200px] truncate" title={errorMsg}>
          失败: {errorMsg || '未知'}
        </div>
      )}
    </div>
  );
}
