// lib/projects.ts
import { Project, ProjectTemplate } from "@/types/projects";

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: "nextjs-starter",
    name: "Next.js Starter",
    description: "Modern Next.js app with Tailwind CSS and TypeScript",
    thumbnail: "/templates/nextjs.png",
    category: "web",
    prompt: "Create a Next.js 14 application with TypeScript, Tailwind CSS, and App Router. Include a homepage with hero section, about page, and contact page.",
    tags: ["nextjs", "react", "tailwind"],
  },
  {
    id: "express-api",
    name: "Express API",
    description: "RESTful API with Express.js and MongoDB",
    thumbnail: "/templates/express.png",
    category: "api",
    prompt: "Create an Express.js REST API with MongoDB integration. Include authentication, user management, and CRUD operations.",
    tags: ["express", "mongodb", "api"],
  },
  {
    id: "electron-app",
    name: "Electron Desktop",
    description: "Cross-platform desktop app with Electron",
    thumbnail: "/templates/electron.png",
    category: "fullstack",
    prompt: "Create an Electron desktop application with React frontend and Node.js backend. Include main window, menu, and system tray integration.",
    tags: ["electron", "react", "desktop"],
  },
  {
    id: "react-native",
    name: "React Native App",
    description: "Mobile app with React Native and Expo",
    thumbnail: "/templates/react-native.png",
    category: "mobile",
    prompt: "Create a React Native mobile app using Expo. Include bottom tab navigation, home screen, profile screen, and settings screen.",
    tags: ["react-native", "expo", "mobile"],
  },
  {
    id: "vue-dashboard",
    name: "Vue Dashboard",
    description: "Admin dashboard with Vue 3 and Element Plus",
    thumbnail: "/templates/vue.png",
    category: "web",
    prompt: "Create a Vue 3 admin dashboard with Element Plus UI library. Include charts, data tables, and sidebar navigation.",
    tags: ["vue", "dashboard", "admin"],
  },
  {
    id: "cli-tool",
    name: "CLI Tool",
    description: "Command-line tool with Node.js and Commander",
    thumbnail: "/templates/cli.png",
    category: "cli",
    prompt: "Create a Node.js CLI tool using Commander. Include commands for init, build, and deploy with helpful output and error handling.",
    tags: ["nodejs", "cli", "commander"],
  },
];

export function createProjectFromChat(
  sessionId: string,
  name: string,
  repoFullName?: string
): Project {
  return {
    id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: `Chat session about ${name}`,
    type: "chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {
      chatSessionId: sessionId,
      repoFullName,
    },
  };
}

export function createProjectFromRepo(
  repoFullName: string,
  description: string,
  language?: string
): Project {
  const [owner, name] = repoFullName.split("/");
  return {
    id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    type: "repo",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {
      repoFullName,
      language,
    },
  };
}

export function getRecentlyViewedProjects(projects: Project[], limit: number = 6): Project[] {
  return [...projects]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
}
