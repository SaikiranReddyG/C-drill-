import React, { useState, useEffect } from "react";
import { CURRICULUM } from "./curriculum";
import { Question, QuestionFormat, Topic, SubCategory } from "./types";
import { persistentStorage } from "./storage";
import VerificationEngine from "./components/VerificationEngine";
import PasteZone from "./components/PasteZone";
import {
  GraduationCap,
  Terminal,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  Play,
  Zap,
  BarChart2,
  RefreshCw,
  Shuffle,
  Activity,
  Award,
  BookOpen,
  Keyboard,
  ShieldCheck,
  Code2
} from "lucide-react";

type ActiveScreen = "home" | "topic-detail" | "paste-zone" | "drill";

export default function App() {
  // Navigation & Router states
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>("home");
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<SubCategory | null>(null);
  const [activeFormat, setActiveFormat] = useState<QuestionFormat>("type");
  const [isShuffleOn, setIsShuffleOn] = useState(false);

  // Global consolidated Questions cache loaded from storage on startup
  // Key: "topicId:subCategoryId:format" -> Question[]
  const [questionsCache, setQuestionsCache] = useState<Record<string, Question[]>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Active drill state
  const [drillQuestions, setDrillQuestions] = useState<Question[]>([]);
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [isCycleComplete, setIsCycleComplete] = useState(false);
  const [drillStats, setDrillStats] = useState({
    correctAnswers: 0,
    incorrectAnswers: 0,
    totalAnswered: 0,
  });

  // Background preload inside useEffect on mount
  useEffect(() => {
    const preloadAllQuestions = async () => {
      const cache: Record<string, Question[]> = {};
      const loadPromises: Promise<void>[] = [];

      CURRICULUM.forEach((topic) => {
        topic.subCategories.forEach((sub) => {
          ["type", "fill", "fix", "output"].forEach((format) => {
            const promise = persistentStorage
              .getQuestions(topic.id, sub.id, format as QuestionFormat)
              .then((list) => {
                if (list && list.length > 0) {
                  cache[`${topic.id}:${sub.id}:${format}`] = list;
                }
              });
            loadPromises.push(promise);
          });
        });
      });

      try {
        await Promise.all(loadPromises);
      } catch (err) {
        console.warn("Failed to load some categories", err);
      }
      setQuestionsCache(cache);
      setIsLoaded(true);
    };

    preloadAllQuestions();
  }, []);

  // Sync questions and reload drill cache whenever cached entries change
  const handleQuestionsUpdated = async () => {
    if (!activeTopic || !activeSubCategory) return;
    
    const formats: QuestionFormat[] = ["type", "fill", "fix", "output"];
    const loadedData: Record<string, Question[]> = {};
    
    await Promise.all(
      formats.map(async (fmt) => {
        const list = await persistentStorage.getQuestions(
          activeTopic.id,
          activeSubCategory.id,
          fmt
        );
        loadedData[`${activeTopic.id}:${activeSubCategory.id}:${fmt}`] = list || [];
      })
    );
    
    setQuestionsCache((prev) => ({
      ...prev,
      ...loadedData,
    }));
  };

  // Pre-conditions for drilling
  const startDrillSession = (topic: Topic, sub: SubCategory, format: QuestionFormat = "type") => {
    setActiveTopic(topic);
    setActiveSubCategory(sub);
    setActiveFormat(format);
    
    // Retrieve lists from loaded cache
    const cachedList = questionsCache[`${topic.id}:${sub.id}:${format}`] || [];
    
    if (cachedList.length > 0) {
      let preparedList = [...cachedList];
      if (isShuffleOn) {
        preparedList = preparedList.sort(() => Math.random() - 0.5);
      }
      setDrillQuestions(preparedList);
    } else {
      setDrillQuestions([]);
    }

    setCurrentDrillIndex(0);
    setIsCycleComplete(false);
    setDrillStats({ correctAnswers: 0, incorrectAnswers: 0, totalAnswered: 0 });
    setCurrentScreen("drill");
  };

  // Re-sync drill state when format toggled during session
  useEffect(() => {
    if (currentScreen !== "drill" || !activeTopic || !activeSubCategory) return;

    const cachedList = questionsCache[`${activeTopic.id}:${activeSubCategory.id}:${activeFormat}`] || [];
    
    if (cachedList.length > 0) {
      let preparedList = [...cachedList];
      if (isShuffleOn) {
        preparedList = preparedList.sort(() => Math.random() - 0.5);
      }
      setDrillQuestions(preparedList);
    } else {
      setDrillQuestions([]);
    }

    setCurrentDrillIndex(0);
    setIsCycleComplete(false);
    // Keep stats growing or reset? Resetting on format change is standard and expected
    setDrillStats({ correctAnswers: 0, incorrectAnswers: 0, totalAnswered: 0 });
  }, [activeFormat, isShuffleOn, currentScreen, activeTopic, activeSubCategory]);

  // Handle single question finished trigger
  const handleQuestionComplete = async (passedWithoutErrors: boolean) => {
    if (!activeTopic || !activeSubCategory || drillQuestions.length === 0) return;

    const originalActiveQuestion = drillQuestions[currentDrillIndex];
    
    // Retrieve master cache list for syncing
    const cachedKey = `${activeTopic.id}:${activeSubCategory.id}:${activeFormat}`;
    const categoryQuestions = [...(questionsCache[cachedKey] || [])];
    
    // Mutate state fields in place on the targeted item
    const targetIdx = categoryQuestions.findIndex((q) => q.id === originalActiveQuestion.id);
    if (targetIdx !== -1) {
      const q = { ...categoryQuestions[targetIdx] };
      q.seen = true;
      q.attempts += 1;
      
      if (passedWithoutErrors) {
        q.passes += 1;
        q.lastResult = "pass";
      } else {
        q.fails += 1;
        q.lastResult = "fail";
      }
      q.lastAttemptAt = new Date().toISOString();
      
      categoryQuestions[targetIdx] = q;

      // Update drillQuestions in place so it has immediate fresh metrics
      setDrillQuestions((prev) => {
        const copy = [...prev];
        const drillIdx = copy.findIndex((item) => item.id === q.id);
        if (drillIdx !== -1) {
          copy[drillIdx] = q;
        }
        return copy;
      });

      // Persist in-memory immediately for reactive updates
      setQuestionsCache((prev) => ({
        ...prev,
        [cachedKey]: categoryQuestions,
      }));

      // Flush to window.storage asynchronously in background
      await persistentStorage.saveQuestions(
        activeTopic.id,
        activeSubCategory.id,
        activeFormat,
        categoryQuestions
      );
    }

    // Accumulate metrics counters
    setDrillStats((prev) => ({
      correctAnswers: prev.correctAnswers + (passedWithoutErrors ? 1 : 0),
      incorrectAnswers: prev.incorrectAnswers + (passedWithoutErrors ? 0 : 1),
      totalAnswered: prev.totalAnswered + 1,
    }));

    // Decide what question to serve next
    const nextIdx = currentDrillIndex + 1;
    if (nextIdx < drillQuestions.length) {
      setCurrentDrillIndex(nextIdx);
    } else {
      // Reached boundary limit
      if (isShuffleOn) {
        // Endless shuffle iteration - re-jiggle questions & start over
        let reshuffledProne = [...drillQuestions];
        if (reshuffledProne.length > 1) {
          // ensure we don't serve the same final question on repeat immediately
          const lastId = drillQuestions[drillQuestions.length - 1].id;
          let attempts = 0;
          do {
            reshuffledProne = [...reshuffledProne].sort(() => Math.random() - 0.5);
            attempts++;
          } while (reshuffledProne[0].id === lastId && attempts < 40);
        }
        setDrillQuestions(reshuffledProne);
        setCurrentDrillIndex(0);
      } else {
        // Stop, announce sequential loop finish
        setIsCycleComplete(true);
      }
    }
  };

  // Reset completion cycle
  const resetDrillCycle = () => {
    setCurrentDrillIndex(0);
    setIsCycleComplete(false);
    setDrillStats({ correctAnswers: 0, incorrectAnswers: 0, totalAnswered: 0 });
  };

  // Helper calculates mastery progress of sub-categories for main view bars
  const getTopicMetrics = (topicId: number) => {
    const topic = CURRICULUM.find((t) => t.id === topicId);
    if (!topic) return { startedCount: 0, passedCount: 0, totalCount: 0, percentPassed: 0 };

    const totalCount = topic.subCategories.length;
    let startedCount = 0;
    let passedCount = 0; // subcategories having at least one question marked as passed-while-hidden

    topic.subCategories.forEach((sub) => {
      let hasAttachedQuestion = false;
      let hasAtLeastOnePassedWhileHidden = false;

      ["type", "fill", "fix", "output"].forEach((format) => {
        const cacheKey = `${topicId}:${sub.id}:${format}`;
        const questionsList = questionsCache[cacheKey] || [];
        if (questionsList.length > 0) {
          hasAttachedQuestion = true;
          // check for mastered (seen and lastResult == pass)
          const hasMastered = questionsList.some((q) => q.seen && q.lastResult === "pass");
          if (hasMastered) {
            hasAtLeastOnePassedWhileHidden = true;
          }
        }
      });

      if (hasAttachedQuestion) startedCount++;
      if (hasAtLeastOnePassedWhileHidden) passedCount++;
    });

    const percentPassed = totalCount > 0 ? (passedCount / totalCount) * 100 : 0;

    return { startedCount, passedCount, totalCount, percentPassed };
  };

  // Subcategory metric counts specifically
  const getSubcategoryCounts = (topicId: number, subId: string) => {
    let typeTotal = 0, typeMastered = 0;
    let fillTotal = 0, fillMastered = 0;
    let fixTotal = 0, fixMastered = 0;
    let outputTotal = 0, outputMastered = 0;

    const listType = questionsCache[`${topicId}:${subId}:type`] || [];
    typeTotal = listType.length;
    typeMastered = listType.filter((q) => q.seen && q.lastResult === "pass").length;

    const listFill = questionsCache[`${topicId}:${subId}:fill`] || [];
    fillTotal = listFill.length;
    fillMastered = listFill.filter((q) => q.seen && q.lastResult === "pass").length;

    const listFix = questionsCache[`${topicId}:${subId}:fix`] || [];
    fixTotal = listFix.length;
    fixMastered = listFix.filter((q) => q.seen && q.lastResult === "pass").length;

    const listOutput = questionsCache[`${topicId}:${subId}:output`] || [];
    outputTotal = listOutput.length;
    outputMastered = listOutput.filter((q) => q.seen && q.lastResult === "pass").length;

    const grandTotal = typeTotal + fillTotal + fixTotal + outputTotal;
    const grandMastered = typeMastered + fillMastered + fixMastered + outputMastered;

    return {
      type: { total: typeTotal, mastered: typeMastered },
      fill: { total: fillTotal, mastered: fillMastered },
      fix: { total: fixTotal, mastered: fixMastered },
      output: { total: outputTotal, mastered: outputMastered },
      grandTotal,
      grandMastered,
    };
  };

  // Global aggregate values for dashboard
  const getGlobalAggregateValues = () => {
    let totalQuestions = 0;
    let masteredQuestions = 0;
    let totalSubcategoriesStarted = 0;
    let totalSubcategoriesTotal = 0;

    CURRICULUM.forEach((t) => {
      totalSubcategoriesTotal += t.subCategories.length;
      t.subCategories.forEach((sub) => {
        let isStarted = false;
        ["type", "fill", "fix", "output"].forEach((fmt) => {
          const qs = questionsCache[`${t.id}:${sub.id}:${fmt}`] || [];
          totalQuestions += qs.length;
          masteredQuestions += qs.filter((q) => q.seen && q.lastResult === "pass").length;
          if (qs.length > 0) isStarted = true;
        });
        if (isStarted) totalSubcategoriesStarted++;
      });
    });

    return {
      totalQuestions,
      masteredQuestions,
      totalSubcategoriesStarted,
      totalSubcategoriesTotal,
    };
  };

  // Retrieve current visibility state for progressive feedback
  const getIsAnswerVisible = (q: Question) => {
    if (!q.seen) return true; // unseen
    if (q.lastResult === "fail") return true; // fallback to training wheels on failure
    return false; // passed on Hidden before, retains recall hidden mode!
  };

  const agg = getGlobalAggregateValues();

  return (
    <div className="bg-slate-950 text-slate-200 font-sans antialiased min-h-screen pb-16 selection:bg-indigo-600/30 selection:text-white">
      {/* Top Banner Branding Header styled with the Bento Grid design */}
      <header className="border border-slate-800 bg-slate-900/50 backdrop-blur sticky top-4 z-40 px-6 py-4 rounded-2xl shadow-xl max-w-7xl mx-auto my-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div
            onClick={() => {
              setCurrentScreen("home");
              setActiveTopic(null);
              setActiveSubCategory(null);
            }}
            className="flex items-center gap-3.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all">
              Σ
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-white text-lg font-bold font-display tracking-tight leading-none">
                  C DRILL
                </span>
                <span className="text-slate-500 font-mono text-xs">v4.0.2-prod</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                character-precision verification module
              </span>
            </div>
          </div>

          {/* Core Analytics Counter & System Nominal Indicator */}
          <div className="flex flex-wrap items-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#10b981]">SYSTEM NOMINAL</span>
            </div>
            
            <div className="h-4 w-[1px] bg-slate-800"></div>

            <div className="text-right">
              <div className="text-slate-500">Mastery Level</div>
              <div className="text-white font-semibold">
                {agg.masteredQuestions} / {agg.totalQuestions} Drills
              </div>
            </div>
            
            <div className="h-4 w-[1px] bg-slate-800"></div>

            <div className="text-right">
              <div className="text-slate-500">Sub-categories</div>
              <div className="text-white font-semibold">
                {agg.totalSubcategoriesStarted} / {agg.totalSubcategoriesTotal} Loaded
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Primary Canvas Container */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        {!isLoaded ? (
          /* Loading overlay skeleton styled as nested Bento */
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto my-12 shadow-2xl">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-slate-400 text-sm font-mono animate-pulse">
              Priming drills database & initializing index...
            </p>
          </div>
        ) : (
          <>
            {/* SCREEN 1: HOME PANEL */}
            {currentScreen === "home" && (
              <div className="space-y-8">
                {/* Grid List displaying 20 C Topics in a 3-column Bento style */}
                <div>
                  <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
                    <h3 className="text-white text-xs font-bold uppercase tracking-widest font-mono flex items-center gap-2 text-slate-400">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      Curriculum Modules ({CURRICULUM.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {CURRICULUM.map((topic) => {
                      const metrics = getTopicMetrics(topic.id);
                      return (
                        <div
                          key={topic.id}
                          onClick={() => {
                            setActiveTopic(topic);
                            setCurrentScreen("topic-detail");
                          }}
                          className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 transition-all rounded-2xl p-6 cursor-pointer flex flex-col justify-between group h-full shadow-lg"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-bold tracking-wider font-mono">
                                MODULE {topic.id.toString().padStart(2, "0")}
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 translate-x-0 group-hover:translate-x-1.5 transition-all duration-300" />
                            </div>

                            <h4 className="text-white text-base font-bold group-hover:text-indigo-400 transition-colors tracking-tight mb-2">
                              {topic.name}
                            </h4>
                          </div>

                          <div className="space-y-3 mt-6 pt-4 border-t border-slate-800/60">
                            {/*started status*/}
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-slate-500">
                                {metrics.startedCount}/{metrics.totalCount} Units Started
                              </span>
                              <span className="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded font-bold">
                                {Math.round(metrics.percentPassed)}% OK
                              </span>
                            </div>

                            {/*Progress indicator bar*/}
                            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                              <div
                                style={{ width: `${metrics.percentPassed}%` }}
                                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 2: TOPIC DETAIL */}
            {currentScreen === "topic-detail" && activeTopic && (
              <div className="space-y-6">
                {/* Topic context header card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-6">
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setCurrentScreen("home");
                        setActiveTopic(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors mb-2 group"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-all text-indigo-400" />
                      Back to categories
                    </button>
                    <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-bold tracking-wider font-mono">
                      MODULE {activeTopic.id.toString().padStart(2, "0")}
                    </span>
                    <h2 className="text-2xl sm:text-3xl text-white font-extrabold tracking-tight font-display mt-2">
                      {activeTopic.name}
                    </h2>
                  </div>
                </div>

                {/* Subcategory Indexing Grid styled in Bento format */}
                <div className="space-y-4">
                  {activeTopic.subCategories.map((sub) => {
                    const counts = getSubcategoryCounts(activeTopic.id, sub.id);
                    const isStarted = counts.grandTotal > 0;

                    return (
                      <div
                        key={sub.id}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/90 transition-all rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-xl group"
                      >
                        {/* Title block */}
                        <div className="space-y-1.5 max-w-2xl">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/25 font-bold tracking-wider font-mono">
                              Unit {sub.id}
                            </span>
                            <h3 className="text-white text-base font-bold tracking-tight">
                              {sub.name}
                            </h3>
                          </div>
                          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed leading-normal">
                            {sub.description}
                          </p>
                        </div>

                        {/* Counts tags and action layout block */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:shrink-0">
                          {/* Mini counters displaying T/F/X/O metrics */}
                          <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                            <div className="text-center px-1.5">
                              <div className="text-slate-500 font-sans uppercase text-[9px] font-bold tracking-wider">Type</div>
                              <div className="text-slate-200 font-semibold mt-0.5">
                                {counts.type.mastered}/{counts.type.total}
                              </div>
                            </div>
                            <div className="text-center px-1.5 border-l border-slate-800">
                              <div className="text-slate-500 font-sans uppercase text-[9px] font-bold tracking-wider">Fill</div>
                              <div className="text-slate-200 font-semibold mt-0.5">
                                {counts.fill.mastered}/{counts.fill.total}
                              </div>
                            </div>
                            <div className="text-center px-1.5 border-l border-slate-800">
                              <div className="text-slate-500 font-sans uppercase text-[9px] font-bold tracking-wider">Fix</div>
                              <div className="text-slate-200 font-semibold mt-0.5">
                                {counts.fix.mastered}/{counts.fix.total}
                              </div>
                            </div>
                            <div className="text-center px-1.5 border-l border-slate-800">
                              <div className="text-slate-500 font-sans uppercase text-[9px] font-bold tracking-wider">Out</div>
                              <div className="text-slate-200 font-semibold mt-0.5">
                                {counts.output.mastered}/{counts.output.total}
                              </div>
                            </div>
                          </div>

                          {/* Trigger buttons with bento indigo design */}
                          <div className="flex items-center gap-2">
                            {/* Drill Button */}
                            <button
                              disabled={!isStarted}
                              onClick={() => startDrillSession(activeTopic, sub, "type")}
                              className={`flex-1 sm:flex-none font-sans text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md ${
                                isStarted
                                  ? "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white cursor-pointer hover:shadow-indigo-500/25 shadow-lg"
                                  : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-[0.4]"
                              }`}
                              title={isStarted ? "Launch Drill Screen" : "Dampened: Paste drills first"}
                            >
                              <Play className="w-3.5 h-3.5" /> Drill
                            </button>

                            {/* Paste Zone Trigger */}
                            <button
                              onClick={() => {
                                  setActiveSubCategory(sub);
                                  setCurrentScreen("paste-zone");
                              }}
                              className="flex-1 sm:flex-none border border-slate-800 hover:bg-slate-800 active:bg-slate-900 font-sans text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl text-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5" /> Import
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SCREEN 3: PASTE ZONE */}
            {currentScreen === "paste-zone" && activeTopic && activeSubCategory && (
              <div className="space-y-6">
                {/* Paste Zone top category context header */}
                <div className="border-b border-slate-800 pb-6">
                  <button
                    onClick={() => {
                      setCurrentScreen("topic-detail");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors mb-2 group"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-all text-indigo-400" />
                    Back to Module detail
                  </button>
                  <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">
                    Module {activeTopic.id} • Unit {activeSubCategory.id}
                  </p>
                  <h2 className="text-2xl sm:text-3xl text-white font-extrabold tracking-tight font-display mt-1">
                    Manage Questions Bank: {activeSubCategory.name}
                  </h2>
                </div>

                {/* Selection format tab headers with bento pill container styled */}
                <div className="flex border border-slate-800 p-1.5 bg-slate-950 rounded-2xl gap-1">
                  {(["type", "fill", "fix", "output"] as QuestionFormat[]).map((fmt) => {
                    const cnt = questionsCache[`${activeTopic.id}:${activeSubCategory.id}:${fmt}`]?.length || 0;
                    return (
                      <button
                        key={fmt}
                        onClick={() => {
                          setActiveFormat(fmt);
                        }}
                        className={`flex-1 py-2 px-2 font-mono text-base text-center font-bold capitalize rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          activeFormat === fmt
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/15"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                        }`}
                      >
                        {fmt}
                        <span className="text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-[1px] rounded font-semibold text-slate-300">
                          {cnt}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-rendered Paste Container */}
                <PasteZone
                  topicId={activeTopic.id}
                  subCategoryId={activeSubCategory.id}
                  activeFormat={activeFormat}
                  onQuestionsUpdated={handleQuestionsUpdated}
                />
              </div>
            )}

            {/* SCREEN 4: DRILL WORKSPACE */}
            {currentScreen === "drill" && activeTopic && activeSubCategory && (
              <div className="space-y-6 max-w-4xl mx-auto">
                {/* Workspace top utilities with Bento outline */}
                <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 mb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setCurrentScreen("topic-detail");
                          setDrillQuestions([]);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors mb-2 group"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-all text-indigo-400" />
                        Back to Unit Detail
                      </button>
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block">
                        Module {activeTopic.id} • Unit {activeSubCategory.id}
                      </span>
                      <h2 className="text-2xl text-white font-bold tracking-tight">
                        {activeSubCategory.name}
                      </h2>
                    </div>

                    {/* Shuffle controller trigger */}
                    <div className="flex items-center gap-2 font-mono text-xs bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        onClick={() => {
                          setIsShuffleOn(!isShuffleOn);
                          resetDrillCycle();
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-sans font-medium text-xs cursor-pointer ${
                          isShuffleOn
                            ? "bg-slate-800 text-indigo-400 shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
                        Shuffle Mode: {isShuffleOn ? "ON" : "OFF"}
                      </button>
                    </div>
                  </div>

                  {/* Format switcher specifically inside active session */}
                  <div className="flex border border-slate-800 p-1.5 bg-slate-950 rounded-2xl gap-1">
                    {(["type", "fill", "fix", "output"] as QuestionFormat[]).map((fmt) => {
                      const listCount =
                        questionsCache[`${activeTopic.id}:${activeSubCategory.id}:${fmt}`]?.length || 0;
                      return (
                        <button
                          key={fmt}
                          onClick={() => {
                            setActiveFormat(fmt);
                          }}
                          className={`flex-1 py-1.5 font-mono text-base text-center font-bold capitalize rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeFormat === fmt
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/15"
                              : "text-slate-400 hover:text-slate-350"
                          }`}
                        >
                          {fmt}
                          <span className="text-[10px] bg-slate-905 border border-slate-800 px-1.5 py-[1px] rounded text-slate-300 font-semibold">
                            {listCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Workspace Main Execution Block */}
                <div className="space-y-4">
                  {drillQuestions.length === 0 ? (
                    /* EMPTY STATE IF NO QUESTIONS PRESENT FOR ACTIVE Category-format pairing */
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-4 shadow-xl">
                      <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                        <Activity className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-white text-base font-semibold">
                          No Drills Found for Format: "{activeFormat}"
                        </h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                          Please paste a valid JSON block of question objects to begin character drilling.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setCurrentScreen("paste-zone");
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/15 mt-4 cursor-pointer inline-block"
                      >
                        Paste Drills Database
                      </button>
                    </div>
                  ) : isCycleComplete ? (
                    /* ROUND/CYCLE RECAP COMPLETE VIEW */
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-xl">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.15)]">
                        <Award className="w-7 h-7" />
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-white text-lg font-bold tracking-tight font-display">
                          Drill Cycle Concluded!
                        </h3>
                        <p className="text-slate-405 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                          You completed checking all <strong>{drillQuestions.length}</strong> questions in sequential order. 
                          Excellent typing, keep pushing memory boundaries.
                        </p>
                      </div>

                      {/* Cumulative accuracy recap indicators styled as Bento grid components */}
                      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto font-mono text-xs">
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                          <div className="text-slate-500 uppercase text-[9px] font-bold">Passed drill</div>
                          <div className="text-emerald-400 font-bold text-lg mt-0.5">
                            {drillStats.correctAnswers}
                          </div>
                        </div>
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                          <div className="text-slate-500 uppercase text-[9px] font-bold">Typo drills</div>
                          <div className="text-rose-400 font-bold text-lg mt-0.5">
                            {drillStats.incorrectAnswers}
                          </div>
                        </div>
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                          <div className="text-slate-500 uppercase text-[9px] font-bold">Accuracy rate</div>
                          <div className="text-white font-bold text-lg mt-0.5">
                            {drillStats.totalAnswered > 0
                              ? Math.round((drillStats.correctAnswers / drillStats.totalAnswered) * 100)
                              : 100}
                            %
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          onClick={resetDrillCycle}
                          className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow shadow-indigo-500/10 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> Restart Cycle Sequence
                        </button>
                        <button
                          onClick={() => {
                            setCurrentScreen("topic-detail");
                          }}
                          className="border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                        >
                          Exit Drill Workspace
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* CENTRAL DRILL CONTAINER SYSTEM */
                    <div className="space-y-4">
                      {/* Queue statistics */}
                      <div className="flex items-center justify-between text-base font-mono text-slate-400">
                        <span>
                          Drilling Progress:{" "}
                          <strong className="text-white font-bold">
                            {currentDrillIndex + 1}
                          </strong>{" "}
                          / {drillQuestions.length}
                        </span>

                        <div className="flex gap-4">
                          <span className="text-emerald-400 font-semibold">passes: {drillStats.correctAnswers}</span>
                          <span className="text-rose-400 font-semibold">typos: {drillStats.incorrectAnswers}</span>
                        </div>
                      </div>

                      {/* Active queue loader bar indicator */}
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/40">
                        <div
                          style={{
                            width: `${((currentDrillIndex + 1) / drillQuestions.length) * 100}%`,
                          }}
                          className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                        ></div>
                      </div>

                      {/* Verification engine workspace */}
                      <VerificationEngine
                        key={drillQuestions[currentDrillIndex].id} // Ensure it forces remount on ID change
                        question={drillQuestions[currentDrillIndex]}
                        isAnswerVisible={getIsAnswerVisible(drillQuestions[currentDrillIndex])}
                        onComplete={handleQuestionComplete}
                      />

                      {/* Micro stats overview card below focus area */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-mono text-base text-slate-500 select-none bg-slate-900/40 p-3.5 border border-slate-800 rounded-xl mt-4">
                        <div>
                          <span>Lifetime attempts:</span>{" "}
                          <strong className="text-slate-300">
                            {drillQuestions[currentDrillIndex].attempts}
                          </strong>
                        </div>
                        <div>
                          <span>Lifetime passes:</span>{" "}
                          <strong className="text-slate-300">
                            {drillQuestions[currentDrillIndex].passes}
                          </strong>
                        </div>
                        <div>
                          <span>Last Result:</span>{" "}
                          <strong
                            className={
                              drillQuestions[currentDrillIndex].lastResult === "pass"
                                ? "text-emerald-400 font-bold"
                                : drillQuestions[currentDrillIndex].lastResult === "fail"
                                ? "text-rose-400 font-bold"
                                : "text-slate-500"
                            }
                          >
                            {drillQuestions[currentDrillIndex].lastResult || "None"}
                          </strong>
                        </div>
                        <div>
                          <span>Last attempted:</span>{" "}
                          <strong className="text-slate-300">
                            {drillQuestions[currentDrillIndex].lastAttemptAt
                              ? new Date(drillQuestions[currentDrillIndex].lastAttemptAt!).toLocaleDateString()
                              : "Never"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
