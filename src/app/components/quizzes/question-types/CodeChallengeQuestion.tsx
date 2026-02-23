'use client';

import { useState } from 'react';
import { Question, useQuizStore } from '@/app/store/quizStore';
import Editor from '@monaco-editor/react';
import { FaCheck, FaTimes, FaPlay } from 'react-icons/fa';

interface CodeChallengeQuestionProps {
  question: Question;
  isReviewMode: boolean;
}

export default function CodeChallengeQuestion({
  question,
  isReviewMode,
}: CodeChallengeQuestionProps) {
  const { answers, setAnswer } = useQuizStore();
  const [code, setCode] = useState(answers[question.id] || question.codeTemplate || '');
  const [testResults, setTestResults] = useState<boolean[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      if (!isReviewMode) {
        setAnswer(question.id, value);
      }
    }
  };

  const runTests = () => {
    if (!question.testCases) return;

    setIsRunning(true);
    const results = question.testCases.map((testCase: { input: string; expectedOutput: string }) => {
      try {
        // Create a function from the user's code
        const userFunction = new Function('input', code);
        const output = userFunction(testCase.input);
        return output === testCase.expectedOutput;
      } catch (error) {
        console.error('Error running test:', error);
        return false;
      }
    });

    setTestResults(results);
    setIsRunning(false);
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium">{question.text}</div>
      
      <div className="border rounded-lg overflow-hidden">
        <Editor
          height="300px"
          defaultLanguage="javascript"
          value={code}
          onChange={handleCodeChange}
          options={{
            minimap: { enabled: false },
            readOnly: isReviewMode,
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>

      {!isReviewMode && (
        <button
          onClick={runTests}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <FaPlay className="w-4 h-4" />
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </button>
      )}

      {testResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Test Results:</h4>
          {question.testCases?.map((testCase: { input: string; expectedOutput: string }, index: number) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                testResults[index]
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Test Case {index + 1}</p>
                  <p className="text-sm text-gray-600">
                    Input: {testCase.input}
                  </p>
                  <p className="text-sm text-gray-600">
                    Expected: {testCase.expectedOutput}
                  </p>
                </div>
                {testResults[index] ? (
                  <FaCheck className="text-green-500" />
                ) : (
                  <FaTimes className="text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isReviewMode && question.explanation && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Explanation:</h4>
          <p className="text-gray-700">{question.explanation}</p>
        </div>
      )}
    </div>
  );
} 