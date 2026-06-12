'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

interface UserTypeScreenProps {
  theme: 'light' | 'dark'
  onNext: (userType: string) => void
  onBack: () => void
}

type UserType = 'fresher' | 'student' | 'professional' | ''

interface Option {
  id: UserType
  label: string
  description: string
  icon: string
}

export function UserTypeScreen({ theme, onNext, onBack }: UserTypeScreenProps): JSX.Element {
  const [selectedType, setSelectedType] = useState<UserType>('')

  const bgColor: string = theme === 'dark' ? '#1a1a1a' : '#f5f0ed'
  const textColor: string = theme === 'dark' ? '#f5f5f0' : '#201515'
  const cardBgColor: string = theme === 'dark' ? '#2a2a2a' : '#ffffff'
  const cardBorderColor: string = theme === 'dark' ? '#6a6a60' : '#e0ddd8'
  const labelColor: string = theme === 'dark' ? '#d0d0c5' : '#605d52'

  const options: Option[] = [
    {
      id: 'fresher',
      label: 'Fresher',
      description: 'Just graduated or about to graduate',
      icon: '🎓'
    },
    {
      id: 'student',
      label: 'Student Looking for Internship',
      description: 'Currently studying, seeking internship opportunities',
      icon: '📚'
    },
    {
      id: 'professional',
      label: 'Professional',
      description: 'Working professional looking to switch or advance',
      icon: '💼'
    }
  ]

  const handleNext = (): void => {
    if (selectedType) {
      onNext(selectedType)
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
        <span className="text-xs font-medium" style={{ color: labelColor }}>Step 2 of 3</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-8 flex flex-col">
        <h1 className="text-4xl font-serif mb-2" style={{ color: textColor }}>
          Who Are You?
        </h1>
        <p className="text-sm mb-8" style={{ color: labelColor }}>
          Help us understand your background
        </p>

        {/* Options */}
        <div className="space-y-4 mb-12">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedType(option.id)}
              className="w-full p-6 rounded-2xl border-2 text-left transition-all"
              style={{
                backgroundColor: selectedType === option.id ? '#ff4f0015' : cardBgColor,
                borderColor: selectedType === option.id ? '#ff4f00' : cardBorderColor,
                cursor: 'pointer'
              }}
              type="button"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{option.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg" style={{ color: textColor }}>
                    {option.label}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: labelColor }}>
                    {option.description}
                  </p>
                </div>
                {selectedType === option.id && (
                  <div className="w-5 h-5 rounded-full mt-1" style={{ backgroundColor: '#ff4f00' }} />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Button */}
      <div className="px-6 py-6 border-t" style={{ borderColor: theme === 'dark' ? '#2a2a2a' : '#e0ddd8' }}>
        <button
          onClick={handleNext}
          disabled={!selectedType}
          className="w-full py-4 rounded-[12px] font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          style={{
            backgroundColor: selectedType ? '#ff4f00' : '#ccc',
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
