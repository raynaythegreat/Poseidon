export interface SkillMetadata {
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  context: string[];
  suggestionTrigger?: string;
}

export interface Skill {
  metadata: SkillMetadata;
  prompt: string;
  handlerPath?: string;
}

export interface SkillContext {
  messages: Array<{ role: string; content: string }>;
  repo?: { name: string; owner: string };
  userInput: string;
}

export interface SkillExecutionResult {
  response: string;
  followUpQuestions?: string[];
}
