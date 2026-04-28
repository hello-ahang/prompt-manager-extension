import { useCallback, useEffect, useState } from 'react';
import type { Prompt, PromptGroup } from '../../shared/types';
import {
  getPrompts,
  savePrompt as storageSavePrompt,
  deletePrompt as storageDeletePrompt,
  getGroups,
  saveGroups,
} from '../../shared/storage';

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [groups, setGroups] = useState<PromptGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [p, g] = await Promise.all([getPrompts(), getGroups()]);
    setPrompts(p);
    setGroups(g);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.prompts || changes.groups) {
        loadData();
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [loadData]);

  const addPrompt = useCallback(
    async (data: { title: string; content: string; groupId: string; groupName?: string }) => {
      if (data.groupName && !groups.find((g) => g.id === data.groupId)) {
        const newGroup: PromptGroup = {
          id: data.groupId,
          name: data.groupName,
        };
        await saveGroups([...groups, newGroup]);
      }

      const prompt: Prompt = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: data.title,
        content: data.content,
        groupId: data.groupId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await storageSavePrompt(prompt);
    },
    [groups],
  );

  const updatePrompt = useCallback(
    async (id: string, data: { title: string; content: string; groupId: string; groupName?: string }) => {
      const existing = prompts.find((p) => p.id === id);
      if (!existing) return;

      if (data.groupName && !groups.find((g) => g.id === data.groupId)) {
        const newGroup: PromptGroup = {
          id: data.groupId,
          name: data.groupName,
        };
        await saveGroups([...groups, newGroup]);
      }

      await storageSavePrompt({
        ...existing,
        title: data.title,
        content: data.content,
        groupId: data.groupId,
        updatedAt: Date.now(),
      });
    },
    [prompts, groups],
  );

  const removePrompt = useCallback(async (id: string) => {
    await storageDeletePrompt(id);
  }, []);

  const filteredPrompts = useCallback(
    (groupId: string | null, keyword: string) => {
      let result = prompts;
      if (groupId) {
        result = result.filter((p) => p.groupId === groupId);
      }
      if (keyword.trim()) {
        const kw = keyword.toLowerCase();
        result = result.filter(
          (p) =>
            p.title.toLowerCase().includes(kw) ||
            p.content.toLowerCase().includes(kw),
        );
      }
      return result;
    },
    [prompts],
  );

  return {
    prompts,
    groups,
    loading,
    addPrompt,
    updatePrompt,
    removePrompt,
    filteredPrompts,
  };
}
