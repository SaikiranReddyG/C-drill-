import React, { useState, useEffect } from "react";
import { Question, QuestionFormat, ImportFailure, ImportResult } from "../types";
import { persistentStorage } from "../storage";
import { Clipboard, AlertCircle, CheckCircle, Trash2, ShieldAlert, FileText, Zap } from "lucide-react";

interface PasteZoneProps {
  topicId: number;
  subCategoryId: string;
  activeFormat: QuestionFormat;
  onQuestionsUpdated: () => void;
}

export default function PasteZone({
  topicId,
  subCategoryId,
  activeFormat,
  onQuestionsUpdated,
}: PasteZoneProps) {
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Load existing questions for display/management
  const loadQuestions = async () => {
    const list = await persistentStorage.getQuestions(topicId, subCategoryId, activeFormat);
    setQuestions(list);
  };

  useEffect(() => {
    loadQuestions();
    setPasteText("");
    setError(null);
    setImportResult(null);
  }, [topicId, subCategoryId, activeFormat]);

  const handleImport = async () => {
    setError(null);
    setImportResult(null);
    
    if (!pasteText.trim()) {
      setError("Please paste a JSON array before importing.");
      return;
    }

    try {
      const parsed = JSON.parse(pasteText);
      if (!Array.isArray(parsed)) {
        setError("Invalid JSON format. Pasted content must be a JSON array of objects (i.e. starts with '[' and ends with ']').");
        return;
      }

      if (parsed.length > 100) {
        setError("Paste size limit exceeded. You can import up to 100 questions per paste block.");
        return;
      }

      const validList: Question[] = [];
      const failList: ImportFailure[] = [];

      parsed.forEach((item, index) => {
        // Enforce basic object presence
        if (!item || typeof item !== "object") {
          failList.push({
            questionIndex: index,
            error: "Item is not a valid JSON object.",
            raw: item,
          });
          return;
        }

        const itemType = item.type;
        const itemPrompt = item.prompt;
        const itemAnswer = item.answer;
        const itemGiven = item.given;

        // 1. Type validation
        if (!itemType || !["type", "fill", "fix", "output"].includes(itemType)) {
          failList.push({
            questionIndex: index,
            error: `Missing or invalid type: "${itemType}". Must be one of: "type", "fill", "fix", "output".`,
            raw: item,
          });
          return;
        }

        // 2. Prompt validation
        if (typeof itemPrompt !== "string" || itemPrompt.trim() === "") {
          failList.push({
            questionIndex: index,
            error: "Property 'prompt' must be a non-empty string.",
            raw: item,
          });
          return;
        }

        // 3. Answer validation
        if (typeof itemAnswer !== "string" || itemAnswer.trim() === "") {
          failList.push({
            questionIndex: index,
            error: "Property 'answer' must be a non-empty string.",
            raw: item,
          });
          return;
        }

        // 4. Given validation constraints
        if (itemType === "type") {
          if (itemGiven !== undefined && itemGiven !== null && itemGiven !== "") {
            failList.push({
              questionIndex: index,
              error: "Property 'given' must be absent/omitted for 'type' format.",
              raw: item,
            });
            return;
          }
        } else {
          if (typeof itemGiven !== "string" || itemGiven.trim() === "") {
            failList.push({
              questionIndex: index,
              error: `Property 'given' is required as a non-empty string for "${itemType}" format.`,
              raw: item,
            });
            return;
          }
        }

        // Construct complete Question model
        const randId = crypto.randomUUID 
          ? crypto.randomUUID() 
          : "q_" + Math.random().toString(36).substring(2, 15);

        const newQuestion: Question = {
          id: randId,
          type: itemType as QuestionFormat,
          prompt: itemPrompt.trim(),
          answer: itemAnswer, // preserve white spaces for exact matching representation
          given: itemGiven ? itemGiven.trim() : undefined,
          seen: false,
          lastResult: null,
          attempts: 0,
          passes: 0,
          fails: 0,
          lastAttemptAt: null,
        };

        validList.push(newQuestion);
      });

      // Group validated questions by their type field into four arrays
      const groups: Record<QuestionFormat, Question[]> = {
        type: [],
        fill: [],
        fix: [],
        output: [],
      };

      validList.forEach((q) => {
        groups[q.type].push(q);
      });

      // For EACH non-empty group, read existing, append, and save
      for (const format of ["type", "fill", "fix", "output"] as QuestionFormat[]) {
        const groupQuestions = groups[format];
        if (groupQuestions.length > 0) {
          const existing = await persistentStorage.getQuestions(topicId, subCategoryId, format);
          const combined = [...existing, ...groupQuestions];
          await persistentStorage.saveQuestions(topicId, subCategoryId, format, combined);
        }
      }

      setImportResult({
        successCount: validList.length,
        failures: failList,
      });

      setPasteText("");
      await loadQuestions(); // Keep the local table display refreshed for active format
      onQuestionsUpdated();
    } catch (err: any) {
      setError(`JSON Parsing syntax error: ${err.message}. Ensure braces and quotes are balanced.`);
    }
  };

  const deleteQuestion = async (id: string) => {
    const updated = questions.filter((q) => q.id !== id);
    await persistentStorage.saveQuestions(topicId, subCategoryId, activeFormat, updated);
    setQuestions(updated);
    onQuestionsUpdated();
  };

  const clearAllQuestions = async () => {
    if (confirm(`Are you sure you want to clear all ${questions.length} questions for "${activeFormat}" in this sub-category? This is structural and cannot be undone.`)) {
      await persistentStorage.saveQuestions(topicId, subCategoryId, activeFormat, []);
      setQuestions([]);
      onQuestionsUpdated();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Clipboard className="w-5 h-5 text-indigo-400" />
        <h3 className="text-white text-base font-bold tracking-wide">
          Import Area — <span className="capitalize text-indigo-400">{activeFormat}</span> Format
        </h3>
      </div>

      <p className="text-slate-400 text-xs sm:text-sm mb-4 leading-relaxed leading-normal">
        Paste a JSON array containing custom question objects. You can import up to 100 entries. 
        Each object needs a <code>type</code> matching <code>"{activeFormat}"</code>.
      </p>

      {/* JSON Form Templates styled as bento module */}
      <div className="mb-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-500">
        <div className="font-bold text-slate-400 select-none mb-1.5">JSON Template Structure:</div>
        <pre className="whitespace-pre overflow-x-auto text-[11px] leading-relaxed">
          {activeFormat === "type" && `[
  {
    "type": "type",
    "prompt": "Declare an integer variable called count",
    "answer": "int count;"
  }
]`}
          {activeFormat === "fill" && `[
  {
    "type": "fill",
    "prompt": "Complete the declaration",
    "given": "___ count;",
    "answer": "int"
  }
]`}
          {activeFormat === "fix" && `[
  {
    "type": "fix",
    "prompt": "Fix syntax missing semi-colon",
    "given": "int count",
    "answer": "int count;"
  }
]`}
          {activeFormat === "output" && `[
  {
    "type": "output",
    "prompt": "What does this code print?",
    "given": "printf(\\"%d\\", 5 + 3);",
    "answer": "8"
  }
]`}
        </pre>
      </div>

      {/* Text Area Input */}
      <div className="relative">
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={`[\n  {\n    "type": "${activeFormat}",\n    "prompt": "...",\n    ...\n  }\n]`}
          className="w-full h-44 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-slate-300 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-slate-700 leading-relaxed resize-y shadow-inner"
        />
      </div>

      {/* Action triggers */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={handleImport}
          className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-sans text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 cursor-pointer"
        >
          <Zap className="w-4 h-4" /> Import JSON Block
        </button>

        {questions.length > 0 && (
          <button
            onClick={clearAllQuestions}
            className="border border-red-500/20 hover:bg-rose-500/10 text-rose-400 font-sans text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Clear All Data ({questions.length})
          </button>
        )}
      </div>

      {/* Error Output feedback */}
      {error && (
        <div className="mt-4 bg-rose-950/15 border border-rose-900/35 text-rose-400 p-4 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm shadow-md">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="leading-normal">{error}</div>
        </div>
      )}

      {/* Success / Partial import stats */}
      {importResult && (
        <div className="mt-4 space-y-3">
          {/* Main counts */}
          <div className={`p-4 rounded-xl flex items-start gap-2.5 text-sm shadow-md ${
            importResult.failures.length > 0 
              ? "bg-amber-950/10 border border-amber-900/30 text-amber-300"
              : "bg-emerald-950/10 border border-emerald-950/20 text-emerald-400"
          }`}>
            {importResult.failures.length > 0 ? (
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold tracking-wide">
                Import complete: Imported {importResult.successCount} valid question(s).
                {importResult.failures.length > 0 && ` ${importResult.failures.length} failed.`}
              </div>
            </div>
          </div>

          {/* List of failures */}
          {importResult.failures.length > 0 && (
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 max-h-56 overflow-y-auto">
              <div className="text-xs text-rose-400 font-bold mb-2 select-none uppercase tracking-wider">Failure error log:</div>
              <ul className="space-y-2 text-xs font-mono text-slate-400 list-inside list-decimal leading-relaxed">
                {importResult.failures.map((f, i) => (
                  <li key={i} className="border-b border-slate-900 pb-2 last:border-b-0">
                    <span className="text-slate-500">Item Index {f.questionIndex}:</span>{" "}
                    <span className="text-rose-400/90 font-medium">{f.error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Question List displaying / Management */}
      <div className="mt-8 border-t border-slate-800 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white text-sm font-bold tracking-wide flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Existing {activeFormat} drills ({questions.length} total)
          </h4>
        </div>

        {questions.length === 0 ? (
          <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-500 font-sans text-xs sm:text-sm">
            No questions pasted for this format yet in this sub-category. Fill out the JSON box above to start drilling.
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-start justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1.5 font-sans min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 text-xs font-mono select-none">
                      #{idx + 1}
                    </span>
                    <span className="text-slate-200 text-base font-semibold truncate max-w-lg">
                      {q.prompt}
                    </span>
                  </div>
                  {q.given && (
                    <div className="text-sm text-slate-400 font-mono truncate max-w-xl">
                      Given: <code className="text-indigo-400/95 font-bold">{q.given}</code>
                    </div>
                  )}
                  <div className="text-sm text-emerald-400 font-mono truncate max-w-xl">
                    Answer: <code className="font-bold text-sm font-mono">{q.answer}</code>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Seen: {q.seen ? "Yes" : "No"} | Attempts: {q.attempts} | Passes: {q.passes} | Last Attempt: {q.lastAttemptAt ? new Date(q.lastAttemptAt).toLocaleDateString() : "Never"}
                  </div>
                </div>

                <button
                  onClick={() => deleteQuestion(q.id)}
                  className="p-1 px-[6px] hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                  title="Delete question"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
