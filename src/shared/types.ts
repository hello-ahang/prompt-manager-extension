export interface Prompt {
  id: string;
  title: string;
  content: string;
  groupId: string;
  createdAt: number;
  updatedAt: number;
}

export interface PromptGroup {
  id: string;
  name: string;
}

export type Message = {
  type: 'INJECT_PROMPT';
  payload: { text: string };
};
