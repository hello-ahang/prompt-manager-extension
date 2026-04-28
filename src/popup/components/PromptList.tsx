import type { Prompt } from '../../shared/types';
import { PromptItem } from './PromptItem';

interface PromptListProps {
  prompts: Prompt[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PromptList({ prompts, onEdit, onDelete }: PromptListProps) {
  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2 py-12">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>暂无提示词</span>
        <span className="text-xs text-gray-300">点击右上角 + 新增提示词</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {prompts.map((prompt) => (
        <PromptItem
          key={prompt.id}
          prompt={prompt}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
