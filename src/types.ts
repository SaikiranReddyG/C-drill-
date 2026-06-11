export type QuestionFormat = "type" | "fill" | "fix" | "output";

export interface Question {
  id: string;
  type: QuestionFormat;
  prompt: string;
  given?: string;
  answer: string;
  seen: boolean;
  lastResult: "pass" | "fail" | null;
  attempts: number;
  passes: number;
  fails: number;
  lastAttemptAt: string | null;
}

export interface SubCategory {
  id: string; // format "topicId:subId" e.g., "1:1"
  name: string;
  description: string;
}

export interface Topic {
  id: number;
  name: string;
  subCategories: SubCategory[];
}

export interface ImportFailure {
  questionIndex: number;
  error: string;
  raw?: any;
}

export interface ImportResult {
  successCount: number;
  failures: ImportFailure[];
}
