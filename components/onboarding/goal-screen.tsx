'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

interface GoalScreenProps {
  theme: 'light' | 'dark'
  onNext: (goal: string) => void
  onSkip: () => void
}

interface Testimonial {
  name: string
  role: string
  company: string
  message: string
  logo: string
}

export function GoalScreen({ theme, onNext, onSkip }: GoalScreenProps): JSX.Element {
  const [goal, setGoal] = useState<string>('')

  const bgColor: string = theme === 'dark' ? '#1a1a1a' : '#f5f0ed'
  const textColor: string = theme === 'dark' ? '#f5f5f0' : '#201515'
  const inputBgColor: string = theme === 'dark' ? '#2a2a2a' : '#ffffff'
  const inputBorderColor: string = theme === 'dark' ? '#6a6a60' : '#e0ddd8'
  const labelColor: string = theme === 'dark' ? '#d0d0c5' : '#605d52'

  const testimonials: Testimonial[] = [
    {
      name: 'Sarah Chen',
      role: 'Landed my dream PM role at',
      company: 'Google',
      message: 'after 3 weeks of prep.',
      logo: '🔴'
    },
    {
      name: 'Marcus Rivera',
      role: 'Got 3 FANGs in',
      company: 'Meta',
      message: '3 months. The cal...',
      logo: '🔵'
    }
  ]

  const handleSubmit = (): void => {
    if (goal.trim()) {
      onNext(goal)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor }}>
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4">
        <div className="text-sm font-medium" style={{ color: labelColor }}>9:41</div>
        <button
          onClick={onSkip}
          className="text-sm font-semibold px-4 py-2 rounded-full transition-colors"
          style={{ color: '#ff4f00' }}
          type="button"
        >
          Skip
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-8 flex flex-col">
        {/* Icon and Title */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl">🔥</span>
          <h1 className="text-4xl font-serif" style={{ color: textColor }}>
            What&apos;s Your Goal?
          </h1>
        </div>

        {/* Input Area */}
        <div className="mb-12">
          <textarea
            value={goal}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGoal(e.target.value)}
            placeholder="Type your target role & company"
            className="w-full min-h-40 p-6 rounded-2xl border-2 font-sans resize-none focus:outline-none transition-colors"
            style={{
              backgroundColor: inputBgColor,
              borderColor: inputBorderColor,
              color: textColor
            }}
          />
        </div>

        {/* Testimonials Section */}
        <div className="mb-8">
          <p className="text-sm font-medium mb-4" style={{ color: labelColor }}>
            People like you landed roles at:
          </p>
          <div className="space-y-4">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="flex gap-3 p-4 rounded-lg"
                style={{ backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f4f0' }}
              >
                <div className="text-2xl">{testimonial.logo}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: textColor }}>
                    {testimonial.role}
                  </p>
                  <p className="text-xs font-semibold" style={{ color: '#ff4f00' }}>
                    {testimonial.company}
                  </p>
                  <p className="text-xs mt-1" style={{ color: labelColor }}>
                    {testimonial.message}
                  </p>
                  <p className="text-xs font-medium mt-2" style={{ color: labelColor }}>
                    {testimonial.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Button */}
      <div className="px-6 py-6 border-t" style={{ borderColor: theme === 'dark' ? '#2a2a2a' : '#e0ddd8' }}>
        <button
          onClick={handleSubmit}
          disabled={!goal.trim()}
          className="w-full py-4 rounded-[12px] font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          style={{
            backgroundColor: goal.trim() ? '#ff4f00' : '#ccc',
            color: '#ffffff'
          }}
          type="button"
        >
          Next
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
