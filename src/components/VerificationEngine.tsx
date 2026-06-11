import React, { useState, useEffect, useRef } from "react";
import { Question } from "../types";
import { Sparkles, Terminal, Keyboard, ShieldAlert, CheckCircle, HelpCircle } from "lucide-react";

interface VerificationEngineProps {
  key?: string | number;
  question: Question;
  isAnswerVisible: boolean;
  onComplete: (success: boolean) => void | Promise<void>;
}

export default function VerificationEngine({
  question,
  isAnswerVisible,
  onComplete,
}: VerificationEngineProps) {
  const { type, prompt, given, answer } = question;

  // Verification states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorChar, setErrorChar] = useState<string | null>(null);
  const [hasHadError, setHasHadError] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Focus reference
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when question changes
  useEffect(() => {
    setCurrentIndex(0);
    setErrorChar(null);
    setHasHadError(false);
    setIsDone(false);
    // Auto-focus on start
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, [question]);

  const handleInputChar = (typed: string) => {
    if (isDone || currentIndex >= answer.length) return;

    const expected = answer[currentIndex];

    if (typed === expected) {
      // Clear any active error and advance
      setErrorChar(null);
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      if (nextIndex === answer.length) {
        setIsDone(true);
        // Successful completion! Wait 800ms before calling onComplete
        const passedWithoutErrors = !hasHadError;
        setTimeout(() => {
          onComplete(passedWithoutErrors);
        }, 800);
      }
    } else {
      // Typo committed
      setErrorChar(typed);
      setHasHadError(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isDone) return;

    // Prevent default behaviour for Tab (inserts 4 spaces)
    if (e.key === "Tab") {
      e.preventDefault();
      // Insert spaces up to 4, checking correctness
      for (let i = 0; i < 4; i++) {
        handleInputChar(" ");
      }
      return;
    }

    // Backspace clears error character if present
    if (e.key === "Backspace") {
      e.preventDefault();
      if (errorChar !== null) {
        setErrorChar(null);
      }
      return;
    }

    // Capture Enter key as explicit newline check
    if (e.key === "Enter") {
      e.preventDefault();
      handleInputChar("\n");
      return;
    }

    // Standard printable character capture
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      handleInputChar(e.key);
    }
  };

  // Card click helper
  const handleContainerClick = () => {
    textareaRef.current?.focus();
  };

  // Build character render spans for the type/fix/output targets
  const renderCodeSegments = (targetText: string) => {
    const pieces: React.ReactNode[] = [];
    
    for (let i = 0; i < targetText.length; i++) {
      const char = targetText[i];
      let displayChar = char;
      
      if (char === "\n") {
        displayChar = "↵\n";
      }

      if (i < currentIndex) {
        // Correctly typed
        pieces.push(
          <span key={i} className="text-emerald-400 font-mono font-bold whitespace-pre">
            {displayChar === "\n" ? "↵\n" : char}
          </span>
        );
      } else if (i === currentIndex) {
        if (errorChar !== null) {
          // Typo at cursor
          pieces.push(
            <span
              key={i}
              className="text-rose-400 font-mono font-bold bg-rose-950/40 border-b-2 border-rose-400 whitespace-pre animate-pulse px-[1px]"
            >
              {errorChar === "\n" ? "↵\n" : errorChar}
            </span>
          );
        } else {
          // Active cursoring
          if (isAnswerVisible) {
            pieces.push(
              <span
                key={i}
                className="text-white font-mono font-bold bg-indigo-900/30 border-b-2 border-indigo-400 whitespace-pre animate-pulse px-[1px]"
              >
                {char}
              </span>
            );
          } else {
            // Hidden character
            pieces.push(
              <span
                key={i}
                className="text-transparent font-mono bg-emerald-400/20 border-b-2 border-[#4ade80] whitespace-pre animate-pulse"
              >
                {char === "\n" ? "↵\n" : " "}
              </span>
            );
          }
        }
      } else {
        // Future character
        if (isAnswerVisible) {
          pieces.push(
            <span key={i} className="text-slate-500 font-mono whitespace-pre">
              {char}
            </span>
          );
        } else {
          // Hidden spacer for memory recall
          pieces.push(
            <span key={i} className="text-slate-800/40 font-mono whitespace-pre select-none">
              ·
            </span>
          );
        }
      }
    }
    return pieces;
  };

  // Splitting helper for Fill-in-the-blank
  const renderFillMode = () => {
    if (!given) return null;
    const parts = given.split("___");
    const prefix = parts[0] || "";
    const suffix = parts[1] || "";

    return (
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 font-mono text-lg leading-relaxed text-slate-300 relative overflow-x-auto select-text">
        <span className="text-slate-500 select-none block mb-2 border-b border-slate-800/60 pb-1 text-[10px] uppercase font-bold tracking-wider">
          /* Complete the blank below by typing onto the cursor */
        </span>
        <pre className="whitespace-pre">
          {prefix}
          {/* Inline active input arena */}
          <span className="inline-flex bg-slate-900 px-1 border border-slate-800 rounded mx-0.5 align-middle">
            {renderCodeSegments(answer)}
          </span>
          {suffix}
        </pre>
      </div>
    );
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`relative w-full rounded-2xl border p-6 transition-all duration-300 cursor-text select-none ${
        isDone
          ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_24px_rgba(16,185,129,0.06)]"
          : "border-slate-800 bg-slate-900/50 hover:border-slate-700 shadow-xl"
      }`}
    >
      {/* Hidden capture engine */}
      <textarea
        ref={textareaRef}
        onKeyDown={handleKeyDown}
        value=""
        onChange={() => {}}
        className="absolute inset-0 h-0 w-0 opacity-0 pointer-events-none"
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* Header Info */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold tracking-wide uppercase bg-slate-950 text-slate-300 border border-slate-800">
            {type === "type" && <Keyboard className="w-3.5 h-3.5 text-indigo-400" />}
            {type === "fill" && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
            {type === "fix" && <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />}
            {type === "output" && <Terminal className="w-3.5 h-3.5 text-teal-400" />}
            {type} Drill
          </span>
          <p className="mt-3 text-slate-100 text-xl font-sans tracking-wide leading-relaxed font-semibold">
            {prompt}
          </p>
        </div>

        {/* Dynamic Badge indicating training wheels status */}
        <div className="text-right shrink-0">
          {isAnswerVisible ? (
            <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-mono font-bold bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 uppercase tracking-widest">
              <HelpCircle className="w-3 h-3" />
              wheels (visible)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-widest">
              <CheckCircle className="w-3 h-3" />
              recall (hidden)
            </span>
          )}
        </div>
      </div>

      {/* Target display container depending on Mode */}
      <div className="mt-4">
        {type === "type" && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 font-mono text-lg leading-relaxed overflow-x-auto min-h-[85px] shadow-inner">
            <pre className="whitespace-pre-wrap break-all leading-normal">
              {renderCodeSegments(answer)}
            </pre>
          </div>
        )}

        {type === "fill" && renderFillMode()}

        {type === "fix" && (
          <div className="flex flex-col gap-4">
            {/* Show original broken code */}
            <div className="bg-rose-950/15 border border-rose-900/35 rounded-xl p-4 font-mono text-lg">
              <div className="text-xs text-rose-400/90 mb-1.5 leading-none select-none font-sans flex items-center gap-1.5 uppercase font-bold tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                Broken reference code (fix this):
              </div>
              <pre className="text-rose-200/90 whitespace-pre overflow-x-auto leading-normal">
                {given}
              </pre>
            </div>
            {/* Typings */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 font-mono text-lg leading-relaxed overflow-x-auto min-h-[85px] shadow-inner">
              <pre className="whitespace-pre-wrap break-all leading-normal">
                {renderCodeSegments(answer)}
              </pre>
            </div>
          </div>
        )}

        {type === "output" && (
          <div className="flex flex-col gap-4">
            {/* Show snippet */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-lg">
              <div className="text-xs text-slate-400 mb-1.5 leading-none select-none font-sans flex items-center gap-1.5 uppercase font-bold tracking-wider">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                C Snippet code block:
              </div>
              <pre className="text-indigo-400/95 whitespace-pre overflow-x-auto leading-normal">
                {given}
              </pre>
            </div>
            {/* Typing box */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 font-mono text-lg leading-relaxed overflow-x-auto min-h-[85px] shadow-inner">
              <div className="text-xs text-slate-500 mb-2 leading-none select-none font-sans uppercase font-bold tracking-wider">
                Console Output answer:
              </div>
              <pre className="whitespace-pre-wrap break-all leading-normal">
                {renderCodeSegments(answer)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Hint panel helper */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-500 text-[10px] font-mono">
        <span className="flex items-center gap-1.5 grayscale opacity-75">
          <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
          Click container to focus keyboard. [Tab] key inserts 4 spaces.
        </span>
        {hasHadError && (
          <span className="text-rose-400 animate-pulse font-bold uppercase tracking-wider">
            Typo committed! Retype correctly to clear.
          </span>
        )}
      </div>

      {/* Done flash effect overlay */}
      {isDone && (
        <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center rounded-2xl pointer-events-none">
          <div className="bg-slate-950 border-2 border-emerald-500 text-emerald-400 px-5 py-2.5 rounded-full font-mono text-xs font-bold flex items-center gap-2 shadow-2xl">
            <CheckCircle className="w-4 h-4 animate-bounce" />
            DRILL COMPLETE
          </div>
        </div>
      )}
    </div>
  );
}
