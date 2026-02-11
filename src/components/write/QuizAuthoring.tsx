import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, Loader2, ChevronDown, ChevronUp, CheckCircle2, Circle } from 'lucide-react';
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
    <div className="mt-8 bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-dark-800 bg-gradient-to-r from-primary-900/20 to-primary-800/10 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Quiz Builder</h3>
            <p className="text-xs text-gray-400">Max {maxQuestions} questions • Multiple choice</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={isGenerating || !articleHtml}
            onClick={() => generateWithAI(5)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            title="Generate quiz with AI"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Generate with AI</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {questions.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-dark-800 rounded-xl">
            <Sparkles className="w-8 h-8 text-dark-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No questions yet</p>
            <p className="text-sm text-gray-500 mt-1">Add a question manually or generate with AI</p>
            <button
              onClick={addBlankQuestion}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-800 text-white hover:bg-dark-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Question</span>
            </button>
          </div>
        )}

        <div className="space-y-3">
          {questions.map((q, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <div
                key={index}
                className={`border transition-all duration-200 rounded-lg overflow-hidden ${isExpanded
                    ? 'border-primary-500/50 bg-dark-900/50 ring-1 ring-primary-500/20'
                    : 'border-dark-800 bg-dark-900 hover:border-dark-700'
                  }`}
              >
                {/* Header - Always visible */}
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`
                        flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 transition-colors
                        ${isExpanded ? 'bg-primary-600 text-white' : 'bg-dark-800 text-gray-400 group-hover:bg-dark-700'}
                      `}>
                      {index + 1}
                    </div>
                    <span className={`text-sm truncate font-medium ${q.question ? 'text-gray-200' : 'text-gray-500 italic'}`}>
                      {q.question || 'New Question'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => removeQuestion(index, e)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} text-gray-500`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Body - Collapsible */}
                {isExpanded && (
                  <div className="p-4 border-t border-dark-800/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Question</label>
                      <input
                        value={q.question}
                        onChange={(e) => updateQuestion(index, (old) => ({ ...old, question: e.target.value }))}
                        placeholder="Enter question text..."
                        className="w-full bg-dark-950 border border-dark-700 rounded-lg px-3 py-2.5 text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-all"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Options</label>
                      <div className="grid grid-cols-1 gap-2">
                        {q.options.map((opt, optIndex) => {
                          const isCorrect = q.correctAnswer === optIndex;
                          return (
                            <div
                              key={optIndex}
                              className={`flex items-center gap-3 p-1 rounded-lg transition-colors ${isCorrect ? 'bg-green-900/10' : ''}`}
                            >
                              <button
                                onClick={() => updateQuestion(index, (old) => ({ ...old, correctAnswer: optIndex }))}
                                className={`
                                        flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all
                                        ${isCorrect
                                    ? 'bg-green-500 text-white'
                                    : 'bg-dark-800 text-gray-500 hover:bg-dark-700 hover:text-gray-300'
                                  }
                                      `}
                                title={isCorrect ? "Correct Answer" : "Mark as Correct"}
                              >
                                {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                              </button>

                              <input
                                value={opt}
                                onChange={(e) => updateQuestion(index, (old) => {
                                  const next = [...old.options];
                                  next[optIndex] = e.target.value;
                                  return { ...old, options: next };
                                })}
                                placeholder={`Option ${optIndex + 1}`}
                                className={`
                                        flex-1 bg-dark-950 border rounded-lg px-3 py-2.5 text-gray-200 placeholder-dark-500 focus:outline-none transition-all
                                        ${isCorrect
                                    ? 'border-green-500/50 ring-1 ring-green-500/20'
                                    : 'border-dark-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                                  }
                                      `}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Explanation (Optional)</label>
                      <textarea
                        value={q.explanation || ''}
                        onChange={(e) => updateQuestion(index, (old) => ({ ...old, explanation: e.target.value }))}
                        placeholder="Explain why the answer is correct..."
                        rows={2}
                        className="w-full bg-dark-950 border border-dark-700 rounded-lg px-3 py-2.5 text-gray-300 placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-all resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        {questions.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-dark-800">
            <div className="text-xs text-gray-500 font-medium">
              {usedCount}/{maxQuestions} questions used
            </div>
            <button
              disabled={!canAdd}
              onClick={addBlankQuestion}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-800 text-white hover:bg-dark-700 hover:text-primary-400 border border-dark-700 hover:border-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizAuthoring;



