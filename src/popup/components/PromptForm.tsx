import { useState } from 'react';
import type { Prompt, PromptGroup } from '../../shared/types';

interface PromptFormProps {
  groups: PromptGroup[];
  initialData?: Prompt;
  onSave: (data: {
    title: string;
    content: string;
    groupId: string;
    groupName?: string;
  }) => void;
  onCancel: () => void;
}

export function PromptForm({
  groups,
  initialData,
  onSave,
  onCancel,
}: PromptFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [groupId, setGroupId] = useState(initialData?.groupId ?? '');
  const [newGroupName, setNewGroupName] = useState('');
  const [useNewGroup, setUseNewGroup] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (useNewGroup && newGroupName.trim()) {
      const id = `local-group-${newGroupName.trim()}`;
      onSave({
        title: title.trim(),
        content: content.trim(),
        groupId: id,
        groupName: newGroupName.trim(),
      });
    } else {
      onSave({
        title: title.trim(),
        content: content.trim(),
        groupId: groupId || 'default',
      });
    }
  };

  const localGroups = groups;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-gray-100">
        <button
          onClick={onCancel}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
          </svg>
        </button>
        <h2 className="text-sm font-medium text-gray-800">
          {initialData ? '编辑提示词' : '新增提示词'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入提示词标题"
            className="w-full h-8 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            分组
          </label>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
              <input
                type="radio"
                checked={!useNewGroup}
                onChange={() => setUseNewGroup(false)}
                className="w-3 h-3"
              />
              选择已有
            </label>
            <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
              <input
                type="radio"
                checked={useNewGroup}
                onChange={() => setUseNewGroup(true)}
                className="w-3 h-3"
              />
              新建分组
            </label>
          </div>
          {useNewGroup ? (
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="输入新分组名称"
              className="w-full h-8 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
            />
          ) : (
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full h-8 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 bg-white"
            >
              <option value="default">未分组</option>
              {localGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            内容
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="输入提示词内容..."
            className="flex-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 resize-none min-h-[120px]"
            required
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-8 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 h-8 rounded-lg bg-indigo-500 text-sm text-white hover:bg-indigo-600 transition-colors"
          >
            保存
          </button>
        </div>
      </form>
    </div>
  );
}
