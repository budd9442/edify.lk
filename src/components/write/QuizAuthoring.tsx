import React, { useMemo, useState } from 'react';
import { Sparkles, Plus, Trash2, Loader2 } from 'lucide-react';
import { generateQuizFromHtml, GeneratedQuizQuestion } from '../../services/aiService';

export interface EditableQuizQuestion extends GeneratedQuizQuestion {}

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
    handleChange([...questions, blank]);
  };

  const removeQuestion = (index: number) => {
    const next = questions.filter((_, i) => i !== index);
    handleChange(next);
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
        handleChange([...questions, ...generated].slice(0, maxQuestions));
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800 bg-gradient-to-r from-primary-900/20 to-primary-800/10">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
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
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Generate quiz with AI"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Generate with AI</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {questions.map((q, index) => (
          <div key={index} className="border border-dark-800 rounded-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-800 bg-dark-800/40">
              <div className="text-sm text-gray-400">Question {index + 1}</div>
              <button
                onClick={() => removeQuestion(index)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-red-300 hover:text-red-200 hover:bg-red-900/20"
                title="Remove question"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove</span>
              </button>
            </div>

            <div className="p-4 space-y-4">
              <input
                value={q.question}
                onChange={(e) => updateQuestion(index, (old) => ({ ...old, question: e.target.value }))}
                placeholder="Enter question text..."
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-gray-200 placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, optIndex) => (
                  <div key={optIndex} className={`relative ${q.correctAnswer === optIndex ? 'ring-1 ring-green-500/50 rounded-lg' : ''}`}>
                    <input
                      value={opt}
                      onChange={(e) => updateQuestion(index, (old) => {
                        const next = [...old.options];
                        next[optIndex] = e.target.value;
                        return { ...old, options: next };
                      })}
                      placeholder={`Option ${optIndex + 1}`}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-gray-200 placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                    <div className="absolute top-2 right-2">
                      <label className="inline-flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                        <input
                          type="radio"
                          checked={q.correctAnswer === optIndex}
                          onChange={() => updateQuestion(index, (old) => ({ ...old, correctAnswer: optIndex }))}
                          className="accent-green-500"
                        />
                        Correct
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <textarea
                value={q.explanation || ''}
                onChange={(e) => updateQuestion(index, (old) => ({ ...old, explanation: e.target.value }))}
                placeholder="Optional explanation..."
                rows={2}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-gray-200 placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">{usedCount}/{maxQuestions} used • {remainingCount} remaining</div>
          <button
            disabled={!canAdd}
            onClick={addBlankQuestion}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800 text-gray-200 hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Add question</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizAuthoring;



