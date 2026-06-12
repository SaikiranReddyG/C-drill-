import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { persistentStorage } from "../storage";

interface NotesPanelProps {
  storageKey: string;
}

export default function NotesPanel({ storageKey }: NotesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing notes from storage when the component mounts or storageKey changes
  useEffect(() => {
    let active = true;
    const fetchNotes = async () => {
      const val = await persistentStorage.getNote(storageKey);
      if (active) {
        setText(val || "");
      }
    };
    fetchNotes();
    // Collapse state does not persist. Always starts collapsed when entering the screen
    setIsOpen(false);

    return () => {
      active = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [storageKey]);

  // Handle changes and debounce for 500ms
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      await persistentStorage.saveNote(storageKey, val);
    }, 500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
      {/* Toggle Bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer select-none"
      >
        <span className="flex items-center gap-2 text-sm font-semibold tracking-wide">
          <FileText className="w-4 h-4 text-indigo-400" />
          Notes
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Textarea Area */}
      {isOpen && (
        <div className="border-t border-slate-800 p-4 bg-slate-950">
          <textarea
            value={text}
            onChange={handleChange}
            placeholder="Lesson notes, things to remember, scratch work..."
            className="w-full min-h-[150px] resize-y bg-slate-950 text-slate-100 font-mono text-base leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500/30 p-3 rounded-xl border border-slate-800"
          />
        </div>
      )}
    </div>
  );
}
