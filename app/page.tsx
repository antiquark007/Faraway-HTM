'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { HowItWorks } from '@/components/how-it-works'
import { Stats } from '@/components/stats'
import { CTA } from '@/components/cta'
import { Footer } from '@/components/footer'
import { AuthModal } from '@/components/auth-modal'
import { OnboardingFlow, OnboardingData } from '@/components/onboarding-flow'
import { useTheme } from '@/app/theme-provider'

export default function Home(): JSX.Element {
  const router = useRouter()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)
  const [userName, setUserName] = useState<string>('')
  const { theme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignInClick = (): void => {
    setIsAuthModalOpen(true)
  }

  const handleCloseAuthModal = (): void => {
    setIsAuthModalOpen(false)
  }

  const handleAuthSuccess = (userData: { email: string; name: string }): void => {
    setUserName(userData.name)
    setIsOnboardingOpen(true)
  }

  const handleOnboardingComplete = (data: OnboardingData): void => {
    // Save user data to localStorage
    const userOnboardingData = {
      name: userName,
      goal: data.goal,
      userType: data.userType,
      problems: data.problems
    }
    localStorage.setItem('userOnboardingData', JSON.stringify(userOnboardingData))
    setIsOnboardingOpen(false)
    // Redirect to dashboard
    router.push('/dashboard')
  }

  const handleOnboardingSkip = (): void => {
    setIsOnboardingOpen(false)
    // Redirect to dashboard anyway
    const userOnboardingData = {
      name: userName,
      goal: 'Not specified',
      userType: 'Not specified',
      problems: []
    }
    localStorage.setItem('userOnboardingData', JSON.stringify(userOnboardingData))
    router.push('/dashboard')
  }

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
        <Navbar onSignInClick={handleSignInClick} />
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <CTA />
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Navbar onSignInClick={handleSignInClick} />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseAuthModal} theme={theme} onAuthSuccess={handleAuthSuccess} />
      <OnboardingFlow isOpen={isOnboardingOpen} onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />
    </main>
  )
}
