import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, Loader2, ChevronDown, CheckCircle2, Circle } from 'lucide-react';
import { generateQuizFromHtml, GeneratedQuizQuestion } from '../../services/aiService';

export interface EditableQuizQuestion extends GeneratedQuizQuestion { }

interface QuizAuthoringProps {
  articleHtml: string;
  initialQuestions?: EditableQuizQuestion[];
  onChange?: (questions: EditableQuizQuestion[]) => void;
  maxQuestions?: number; // default 10
}

const QuizAuthoring: React.FC<QuizAuthoringProps> = ({
  articleHtml,
  initialQuestions = [],
  onChange,
  maxQuestions = 10,
}) => {
  const [questions, setQuestions] = useState<EditableQuizQuestion[]>(initialQuestions.slice(0, maxQuestions));
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(initialQuestions.length > 0 ? 0 : null);

  const canAdd = questions.length < maxQuestions;

  const handleChange = (next: EditableQuizQuestion[]) => {
    setQuestions(next);
    onChange?.(next);
  };

  const addBlankQuestion = () => {
    if (!canAdd) return;
    const blank: EditableQuizQuestion = {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
    };
    const next = [...questions, blank];
    handleChange(next);
    setExpandedIndex(next.length - 1); // Auto-expand new question
  };

  const removeQuestion = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling accordion
    const next = questions.filter((_, i) => i !== index);
    handleChange(next);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const updateQuestion = (index: number, updater: (q: EditableQuizQuestion) => EditableQuizQuestion) => {
    const next = questions.map((q, i) => (i === index ? updater(q) : q));
    handleChange(next);
  };

  const generateWithAI = async (desiredCount: number) => {
    try {
      setIsGenerating(true);
      const remaining = Math.max(0, maxQuestions - questions.length);
      const count = Math.min(desiredCount, remaining || maxQuestions);
      const generated = await generateQuizFromHtml(articleHtml, count);
      if (generated.length) {
        const next = [...questions, ...generated].slice(0, maxQuestions);
        handleChange(next);
        // Expand the first newly added question
        setExpandedIndex(questions.length);
      }
    } catch (e: any) {
      console.error('AI generation failed', e);
      alert(e?.message || 'AI generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const usedCount = questions.length;
  const remainingCount = Math.max(0, maxQuestions - usedCount);

  return (
    <div className="bg-dark-900/50 border border-dark-800 rounded-xl overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2.5 border-b border-dark-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-600/90 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Quiz Builder</h3>
            <p className="text-[11px] text-gray-500">Max {maxQuestions} • Multiple choice</p>
          </div>
        </div>
        <button
          disabled={isGenerating || !articleHtml}
          onClick={() => generateWithAI(5)}
          className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
          title="Generate quiz with AI"
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>Generate with AI</span>
        </button>
      </div>

      <div className="p-3 space-y-2">
        {questions.length === 0 && (
          <div className="text-center py-8 border border-dashed border-dark-700 rounded-lg">
            <Sparkles className="w-6 h-6 text-dark-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No questions yet</p>
            <p className="text-[11px] text-gray-600 mt-0.5">Add manually or generate with AI</p>
            <button
              onClick={addBlankQuestion}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-800 text-gray-300 hover:bg-dark-700 hover:text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>
        )}

        <div className="space-y-1.5">
          {questions.map((q, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <div
                key={index}
                className={`border transition-all duration-200 rounded-lg overflow-hidden ${isExpanded
                    ? 'border-primary-500/40 bg-dark-900/80'
                    : 'border-dark-800 bg-dark-900/50 hover:border-dark-700'
                  }`}
              >
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="flex items-center justify-between px-3 py-2 cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-2 overflow-hidden min-w-0">
                    <div className={`flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold flex-shrink-0 ${isExpanded ? 'bg-primary-600 text-white' : 'bg-dark-800 text-gray-500 group-hover:bg-dark-700'}`}>
                      {index + 1}
                    </div>
                    <span className={`text-xs truncate font-medium ${q.question ? 'text-gray-300' : 'text-gray-500 italic'}`}>
                      {q.question || 'New Question'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => removeQuestion(index, e)}
                      className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                      title="Remove question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} text-gray-500`}>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-2 border-t border-dark-800 space-y-2.5">
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1">Question</label>
                      <input
                        value={q.question}
                        onChange={(e) => updateQuestion(index, (old) => ({ ...old, question: e.target.value }))}
                        placeholder="Enter question..."
                        className="w-full bg-dark-950 border border-dark-700 rounded-lg px-2.5 py-2 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 focus:outline-none"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Options</label>
                      <div className="space-y-1.5">
                        {q.options.map((opt, optIndex) => {
                          const isCorrect = q.correctAnswer === optIndex;
                          return (
                            <div key={optIndex} className={`flex items-center gap-2 rounded-lg ${isCorrect ? 'bg-primary-900/15' : ''}`}>
                              <button
                                onClick={() => updateQuestion(index, (old) => ({ ...old, correctAnswer: optIndex }))}
                                className={`flex-shrink-0 w-7 h-7 rounded flex items-center justify-center transition-all ${isCorrect ? 'bg-primary-600 text-white' : 'bg-dark-800 text-gray-500 hover:bg-dark-700 hover:text-gray-400'}`}
                                title={isCorrect ? 'Correct' : 'Mark as correct'}
                              >
                                {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                              </button>
                              <input
                                value={opt}
                                onChange={(e) => updateQuestion(index, (old) => {
                                  const next = [...old.options];
                                  next[optIndex] = e.target.value;
                                  return { ...old, options: next };
                                })}
                                placeholder={`Option ${optIndex + 1}`}
                                className={`flex-1 bg-dark-950 border rounded-lg px-2.5 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none ${isCorrect ? 'border-primary-500/40' : 'border-dark-700 focus:border-primary-500/60'}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1">Explanation (optional)</label>
                      <textarea
                        value={q.explanation || ''}
                        onChange={(e) => updateQuestion(index, (old) => ({ ...old, explanation: e.target.value }))}
                        placeholder="Why this answer is correct..."
                        rows={2}
                        className="w-full bg-dark-950 border border-dark-700 rounded-lg px-2.5 py-2 text-xs text-gray-300 placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {questions.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-dark-800">
            <span className="text-[11px] text-gray-500">{usedCount}/{maxQuestions}</span>
            <button
              disabled={!canAdd}
              onClick={addBlankQuestion}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-800 text-gray-300 hover:bg-dark-700 hover:text-primary-400 border border-dark-700 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizAuthoring;



