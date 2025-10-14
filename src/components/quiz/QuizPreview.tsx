import React from 'react';
import { Brain } from 'lucide-react';

interface QuizPreviewQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizPreviewProps {
  title?: string;
  questions: QuizPreviewQuestion[];
}

const QuizPreview: React.FC<QuizPreviewProps> = ({ title = 'Article Quiz', questions }) => {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="mt-12 space-y-6">
      <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary-900/20 to-primary-800/20 border-b border-primary-800/30 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Test Your Knowledge (Preview)</h3>
              <p className="text-gray-300 text-sm">{title}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {questions.map((q, idx) => (
            <div key={idx} className="border border-dark-800 rounded-lg">
              <div className="px-4 py-3 border-b border-dark-800 bg-dark-800/40 text-sm text-gray-400">
                Question {idx + 1}
              </div>
              <div className="p-4 space-y-3">
                <div className="text-white font-medium">{q.question}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.slice(0, 4).map((opt, oidx) => (
                    <div key={oidx} className={`px-3 py-2 rounded-lg border ${q.correctAnswer === oidx ? 'border-green-600/60 bg-green-900/10 text-green-300' : 'border-dark-700 text-gray-300 bg-dark-800'}`}>
                      {opt}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <div className="text-sm text-gray-400 border-t border-dark-800 pt-2">{q.explanation}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizPreview;


