"use client";

import { useState } from "react";

interface SkillFeedbackProps {
  skillName: string;
  onSubmit: (feedback: { helpful: boolean; comment?: string }) => void;
}

export default function SkillFeedback({ skillName, onSubmit }: SkillFeedbackProps) {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = (isHelpful: boolean) => {
    setHelpful(isHelpful);
    setShowComment(true);
  };

  const handleSubmit = () => {
    onSubmit({ helpful: helpful === true, comment: comment || undefined });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-xs text-ink-muted">Thanks for your feedback!</div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-surface-muted/50 rounded-lg">
      <div className="text-sm text-ink mb-2">
        Skill: <span className="font-medium">{skillName}</span> ✓ Completed
      </div>

      {!showComment ? (
        <div>
          <div className="text-xs text-ink-muted mb-2">Was this helpful?</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFeedback(true)}
              className="px-3 py-1.5 rounded-md text-sm bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/20 transition-colors"
            >
              Thumbs up
            </button>
            <button
              onClick={() => handleFeedback(false)}
              className="px-3 py-1.5 rounded-md text-sm bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors"
            >
              Thumbs down
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-xs text-ink-muted mb-2">What could be better? (optional)</div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us how to improve this skill..."
            className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-md text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none"
            rows={2}
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSubmit}
              className="px-3 py-1.5 rounded-md text-sm bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-colors"
            >
              Send Feedback
            </button>
            <button
              onClick={() => setShowComment(false)}
              className="px-3 py-1.5 rounded-md text-sm text-ink-muted hover:text-ink transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
