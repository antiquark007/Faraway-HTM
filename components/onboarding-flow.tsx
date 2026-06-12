'use client'

import { useState } from 'react'
import { GoalScreen } from './onboarding/goal-screen'
import { UserTypeScreen } from './onboarding/user-type-screen'
import { ProblemsScreen } from './onboarding/problems-screen'
import { useTheme } from '@/app/theme-provider'

interface OnboardingFlowProps {
  isOpen: boolean
  onComplete: (data: OnboardingData) => void
  onSkip: () => void
}

export interface OnboardingData {
  goal: string
  userType: string
  problems: string[]
}

type OnboardingStep = 'goal' | 'userType' | 'problems'

export function OnboardingFlow({ isOpen, onComplete, onSkip }: OnboardingFlowProps): JSX.Element | null {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('goal')
  const [data, setData] = useState<Partial<OnboardingData>>({})
  const { theme } = useTheme()

  if (!isOpen) return null

  const handleGoalNext = (goal: string): void => {
    setData((prev) => ({ ...prev, goal }))
    setCurrentStep('userType')
  }

  const handleUserTypeNext = (userType: string): void => {
    setData((prev) => ({ ...prev, userType }))
    setCurrentStep('problems')
  }

  const handleProblemsNext = (problems: string[]): void => {
    const completeData: OnboardingData = {
      goal: data.goal || '',
      userType: data.userType || '',
      problems
    }
    onComplete(completeData)
  }

  const handleBack = (): void => {
    if (currentStep === 'userType') {
      setCurrentStep('goal')
    } else if (currentStep === 'problems') {
      setCurrentStep('userType')
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {currentStep === 'goal' && (
        <GoalScreen theme={theme} onNext={handleGoalNext} onSkip={onSkip} />
      )}
      {currentStep === 'userType' && (
        <UserTypeScreen theme={theme} onNext={handleUserTypeNext} onBack={handleBack} />
      )}
      {currentStep === 'problems' && (
        <ProblemsScreen theme={theme} onNext={handleProblemsNext} onBack={handleBack} />
      )}
    </div>
  )
}
