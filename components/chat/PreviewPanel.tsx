"use client";

interface PreviewPanelProps {
  selectedFile: string | null;
  fileContent?: string;
  fileType?: string;
}

export default function PreviewPanel({
  selectedFile,
  fileContent,
  fileType,
}: PreviewPanelProps) {
  const getLanguageFromPath = (path: string) => {
    const ext = path.split(".").pop();
    const langMap: Record<string, string> = {
      ts: "TypeScript",
      tsx: "TypeScript",
      js: "JavaScript",
      jsx: "JavaScript",
      py: "Python",
      rs: "Rust",
      go: "Go",
      java: "Java",
      cpp: "C++",
      c: "C",
      css: "CSS",
      html: "HTML",
      json: "JSON",
      md: "Markdown",
      yaml: "YAML",
      yml: "YAML",
    };
    return langMap[ext || ""] || "Text";
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.08]">
        <div className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">
          Inspector
        </div>
        {selectedFile && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60 truncate flex-1" title={selectedFile}>
              {selectedFile.split("/").pop()}
            </div>
            <div className="text-xs text-white/40 ml-2">
              {getLanguageFromPath(selectedFile)}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#050505]">
        {!selectedFile ? (
          <div className="h-full flex items-center justify-center text-sm text-white/40">
            Select a file to preview
          </div>
        ) : fileContent ? (
          <pre className="p-4 text-sm text-white/60 font-mono whitespace-pre-wrap">
            {fileContent}
          </pre>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-white/40">
            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-sm">File content not loaded</div>
          </div>
        )}
      </div>

      {/* Footer - File Stats */}
      {selectedFile && (
        <div className="px-4 py-2 border-t border-white/[0.08]">
          <div className="text-xs text-white/40">
            {fileContent ? `${fileContent.split("\n").length} lines` : "Binary file"}
          </div>
        </div>
      )}
    </div>
  );
}
