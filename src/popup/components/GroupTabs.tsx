import { useCallback } from 'react';
import type { Prompt, PromptGroup } from '../../shared/types';

interface GroupTabsProps {
  groups: PromptGroup[];
  activeGroupId: string | null;
  onSelect: (groupId: string | null) => void;
  prompts: Prompt[];
  onRenameGroup?: (groupId: string, newName: string) => void;
  onDeleteGroup?: (groupId: string) => void;
}

export function GroupTabs({
  groups,
  activeGroupId,
  onSelect,
  prompts,
  onRenameGroup,
  onDeleteGroup,
}: GroupTabsProps) {
  const countByGroup = (groupId: string) =>
    prompts.filter((p) => p.groupId === groupId).length;

  // 过滤掉 name 为空的分组
  const validGroups = groups.filter((g) => g.name && g.name.trim());

  const handleRename = useCallback(
    (e: React.MouseEvent, group: PromptGroup) => {
      e.stopPropagation();
      const newName = window.prompt('请输入新的分组名称', group.name);
      if (newName && newName.trim() && newName.trim() !== group.name) {
        onRenameGroup?.(group.id, newName.trim());
      }
    },
    [onRenameGroup],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent, group: PromptGroup) => {
      e.stopPropagation();
      const count = countByGroup(group.id);
      const msg = count > 0
        ? `确定删除分组「${group.name}」？其中的 ${count} 条提示词将移入未分组。`
        : `确定删除分组「${group.name}」？`;
      if (window.confirm(msg)) {
        onDeleteGroup?.(group.id);
      }
    },
    [onDeleteGroup, prompts],
  );

  return (
    <div className="flex items-center gap-1.5 px-3 pb-2 overflow-x-auto no-scrollbar">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
          activeGroupId === null
            ? 'bg-indigo-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        全部 ({prompts.length})
      </button>
      {validGroups.map((group) => (
        <div key={group.id} className="shrink-0 flex items-center gap-0.5">
          <button
            onClick={() => onSelect(group.id)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              activeGroupId === group.id
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {group.name} ({countByGroup(group.id)})
          </button>
          {activeGroupId === group.id && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={(e) => handleRename(e, group)}
                className="w-5 h-5 flex items-center justify-center rounded text-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="重命名分组"
              >
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175l-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                </svg>
              </button>
              <button
                onClick={(e) => handleDelete(e, group)}
                className="w-5 h-5 flex items-center justify-center rounded text-indigo-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="删除分组"
              >
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                  <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H5.5l1-1h3l1 1H14a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
