"use client";

interface LovableStyleChatLayoutProps {
  header?: React.ReactNode;
  inputArea: React.ReactNode;
  contentArea?: React.ReactNode;
}

export default function LovableStyleChatLayout({
  header,
  inputArea,
  contentArea,
}: LovableStyleChatLayoutProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      {/* Header */}
      {header && (
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black flex-shrink-0">
          {header}
        </div>
      )}

      {/* Content Area - Messages/Preview */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {contentArea}
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {inputArea}
        </div>
      </div>
    </div>
  );
}
