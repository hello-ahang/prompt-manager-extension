import type { Prompt, PromptGroup } from '../../shared/types';

interface GroupTabsProps {
  groups: PromptGroup[];
  activeGroupId: string | null;
  onSelect: (groupId: string | null) => void;
  prompts: Prompt[];
}

export function GroupTabs({
  groups,
  activeGroupId,
  onSelect,
  prompts,
}: GroupTabsProps) {
  const countByGroup = (groupId: string) =>
    prompts.filter((p) => p.groupId === groupId).length;

  return (
    <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto no-scrollbar">
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
      {groups.map((group) => (
        <button
          key={group.id}
          onClick={() => onSelect(group.id)}
          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            activeGroupId === group.id
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {group.name} ({countByGroup(group.id)})
        </button>
      ))}
    </div>
  );
}
