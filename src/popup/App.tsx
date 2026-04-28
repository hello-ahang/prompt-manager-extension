import { useCallback, useRef, useState } from 'react';
import { usePrompts } from './hooks/usePrompts';
import { SearchBar } from './components/SearchBar';
import { GroupTabs } from './components/GroupTabs';
import { PromptList } from './components/PromptList';
import { PromptForm } from './components/PromptForm';
import { getPrompts, savePrompts, getGroups, saveGroups } from '../shared/storage';
import type { Prompt, PromptGroup } from '../shared/types';

type View = 'list' | 'form';

export default function App() {
  const [view, setView] = useState<View>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    prompts,
    groups,
    loading,
    addPrompt,
    updatePrompt,
    removePrompt,
    renameGroup,
    deleteGroup,
    filteredPrompts,
  } = usePrompts();

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    await deleteGroup(groupId);
    if (activeGroupId === groupId) {
      setActiveGroupId(null);
    }
  }, [deleteGroup, activeGroupId]);

  const displayedPrompts = filteredPrompts(activeGroupId, keyword);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setView('form');
  };

  const handleAdd = () => {
    setEditingId(null);
    setView('form');
  };

  const handleFormSave = async (data: {
    title: string;
    content: string;
    groupId: string;
    groupName?: string;
  }) => {
    if (editingId) {
      await updatePrompt(editingId, data);
    } else {
      await addPrompt(data);
    }
    setView('list');
    setEditingId(null);
  };

  const handleFormCancel = () => {
    setView('list');
    setEditingId(null);
  };

  const handleExport = useCallback(async () => {
    const [allPrompts, allGroups] = await Promise.all([getPrompts(), getGroups()]);
    const data = JSON.stringify({ prompts: allPrompts, groups: allGroups }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as { prompts?: Prompt[]; groups?: PromptGroup[] };
      if (!data.prompts || !Array.isArray(data.prompts)) {
        setImportMsg('文件格式无效');
        return;
      }
      const existingPrompts = await getPrompts();
      const existingGroups = await getGroups();
      const existingIds = new Set(existingPrompts.map((p) => p.id));
      const newPrompts = data.prompts.filter((p) => !existingIds.has(p.id));
      await savePrompts([...existingPrompts, ...newPrompts]);
      if (data.groups) {
        const existingGroupIds = new Set(existingGroups.map((g) => g.id));
        const newGroups = data.groups.filter((g) => !existingGroupIds.has(g.id));
        await saveGroups([...existingGroups, ...newGroups]);
      }
      setImportMsg(`导入成功，新增 ${newPrompts.length} 条`);
      setTimeout(() => setImportMsg(''), 3000);
    } catch {
      setImportMsg('导入失败：文件解析错误');
      setTimeout(() => setImportMsg(''), 3000);
    }
    e.target.value = '';
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        加载中...
      </div>
    );
  }

  if (view === 'form') {
    const editingPrompt = editingId
      ? prompts.find((p) => p.id === editingId)
      : undefined;
    return (
      <PromptForm
        groups={groups}
        initialData={editingPrompt}
        onSave={handleFormSave}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="flex-1">
          <SearchBar value={keyword} onChange={setKeyword} />
        </div>
        <button
          onClick={handleAdd}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors text-lg"
          title="新增提示词"
        >
          +
        </button>
      </div>

      {/* Group Tabs */}
      <GroupTabs
        groups={groups}
        activeGroupId={activeGroupId}
        onSelect={setActiveGroupId}
        prompts={prompts}
        onRenameGroup={renameGroup}
        onDeleteGroup={handleDeleteGroup}
      />

      {/* Prompt List */}
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        <PromptList
          prompts={displayedPrompts}
          onEdit={handleEdit}
          onDelete={removePrompt}
        />
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
        <span>共 {prompts.length} 条</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="text-gray-400 hover:text-indigo-500 transition-colors"
            title="导出所有提示词"
          >
            导出
          </button>
          <span className="text-gray-200">|</span>
          <button
            onClick={handleImport}
            className="text-gray-400 hover:text-indigo-500 transition-colors"
            title="从文件导入提示词"
          >
            导入
          </button>
        </div>
      </div>
      {importMsg && (
        <div className={`px-3 py-1 text-xs ${importMsg.includes('成功') ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
          {importMsg}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
