'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

interface ProblemsScreenProps {
  theme: 'light' | 'dark'
  onNext: (problems: string[]) => void
  onBack: () => void
}

interface Problem {
  id: string
  label: string
  icon: string
}

export function ProblemsScreen({ theme, onNext, onBack }: ProblemsScreenProps): JSX.Element {
  const [selectedProblems, setSelectedProblems] = useState<string[]>([])

  const bgColor: string = theme === 'dark' ? '#1a1a1a' : '#f5f0ed'
  const textColor: string = theme === 'dark' ? '#f5f5f0' : '#201515'
  const cardBgColor: string = theme === 'dark' ? '#2a2a2a' : '#ffffff'
  const cardBorderColor: string = theme === 'dark' ? '#6a6a60' : '#e0ddd8'
  const labelColor: string = theme === 'dark' ? '#d0d0c5' : '#605d52'

  const problems: Problem[] = [
    { id: 'communication', label: 'Communication Skills', icon: '💬' },
    { id: 'technical', label: 'Technical Knowledge', icon: '💻' },
    { id: 'confidence', label: 'Lack of Confidence', icon: '😟' },
    { id: 'nervousness', label: 'Nervousness During Interviews', icon: '😰' },
    { id: 'behavioral', label: 'Behavioral Questions', icon: '🎯' },
    { id: 'negotiation', label: 'Salary Negotiation', icon: '💰' },
    { id: 'research', label: 'Company Research', icon: '🔍' },
    { id: 'follow-up', label: 'Follow-up Strategy', icon: '📧' }
  ]

  const toggleProblem = (problemId: string): void => {
    setSelectedProblems((prev) =>
      prev.includes(problemId)
        ? prev.filter((id) => id !== problemId)
        : [...prev, problemId]
    )
  }

  const handleNext = (): void => {
    if (selectedProblems.length > 0) {
      onNext(selectedProblems)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor }}>
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4">
        <button
          onClick={onBack}
          className="text-sm font-semibold px-4 py-2 rounded-full transition-colors"
          style={{ color: labelColor }}
          type="button"
        >
          ← Back
        </button>
        <span className="text-xs font-medium" style={{ color: labelColor }}>Step 3 of 3</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-8 flex flex-col">
        <h1 className="text-4xl font-serif mb-2" style={{ color: textColor }}>
          What Problems Are You Facing?
        </h1>
        <p className="text-sm mb-8" style={{ color: labelColor }}>
          Select all that apply (select at least one)
        </p>

        {/* Problems Grid */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          {problems.map((problem) => (
            <button
              key={problem.id}
              onClick={() => toggleProblem(problem.id)}
              className="p-4 rounded-xl border-2 text-center transition-all"
              style={{
                backgroundColor: selectedProblems.includes(problem.id) ? '#ff4f0015' : cardBgColor,
                borderColor: selectedProblems.includes(problem.id) ? '#ff4f00' : cardBorderColor,
                cursor: 'pointer'
              }}
              type="button"
            >
              <div className="text-2xl mb-2">{problem.icon}</div>
              <p className="text-sm font-medium" style={{ color: textColor }}>
                {problem.label}
              </p>
            </button>
          ))}
        </div>

        {/* Selected count */}
        {selectedProblems.length > 0 && (
          <p className="text-xs text-center mb-4" style={{ color: labelColor }}>
            Selected: {selectedProblems.length} item{selectedProblems.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Footer Button */}
      <div className="px-6 py-6 border-t" style={{ borderColor: theme === 'dark' ? '#2a2a2a' : '#e0ddd8' }}>
        <button
          onClick={handleNext}
          disabled={selectedProblems.length === 0}
          className="w-full py-4 rounded-[12px] font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          style={{
            backgroundColor: selectedProblems.length > 0 ? '#ff4f00' : '#ccc',
            color: '#ffffff'
          }}
          type="button"
        >
          Complete Setup
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
