import type { Prompt, PromptGroup } from './types';

const KEYS = {
  PROMPTS: 'prompts',
  GROUPS: 'groups',
} as const;

export async function getPrompts(): Promise<Prompt[]> {
  const result = await chrome.storage.local.get(KEYS.PROMPTS);
  return result[KEYS.PROMPTS] ?? [];
}

export async function savePrompts(prompts: Prompt[]): Promise<void> {
  await chrome.storage.local.set({ [KEYS.PROMPTS]: prompts });
}

export async function savePrompt(prompt: Prompt): Promise<void> {
  const prompts = await getPrompts();
  const index = prompts.findIndex((p) => p.id === prompt.id);
  if (index >= 0) {
    prompts[index] = prompt;
  } else {
    prompts.push(prompt);
  }
  await savePrompts(prompts);
}

export async function deletePrompt(id: string): Promise<void> {
  const prompts = await getPrompts();
  await savePrompts(prompts.filter((p) => p.id !== id));
}

export async function getGroups(): Promise<PromptGroup[]> {
  const result = await chrome.storage.local.get(KEYS.GROUPS);
  return result[KEYS.GROUPS] ?? [];
}

export async function saveGroups(groups: PromptGroup[]): Promise<void> {
  await chrome.storage.local.set({ [KEYS.GROUPS]: groups });
}
