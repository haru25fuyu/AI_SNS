export type Message = { role: 'user' | 'ai'; text: string };

export type Personality = {
  summary: string;
  midTermMemory: string[];
  conversationStyle: string;
  values: string[];
};

export type BottleMatch = {
  name: string;
  similarity: number;
  text: string;
  type: 'mud' | 'gold' | 'rainbow';
  note: string;
};
