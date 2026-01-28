// types/projects.ts
export interface Project {
  id: string;
  name: string;
  description: string;
  type: "chat" | "repo" | "template";
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
  metadata?: {
    chatSessionId?: string;
    repoFullName?: string;
    templateId?: string;
    language?: string;
    framework?: string;
  };
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: "web" | "mobile" | "api" | "cli" | "fullstack";
  prompt: string;
  tags: string[];
}
