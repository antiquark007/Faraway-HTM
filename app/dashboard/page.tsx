'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from '@/app/theme-provider'
import { LogOut } from 'lucide-react'

interface DashboardUser {
  name: string
  goal: string
  userType: string
  problems: string[]
}

export default function Dashboard(): JSX.Element {
  const router = useRouter()
  const { theme } = useTheme()

  // Get user data from localStorage or session
  const userDataStr = typeof window !== 'undefined' ? localStorage.getItem('userOnboardingData') : null
  const userData: DashboardUser | null = userDataStr ? JSON.parse(userDataStr) : null

  const bgColor: string = theme === 'dark' ? '#1a1a1a' : '#fffefb'
  const cardBgColor: string = theme === 'dark' ? '#2a2a2a' : '#f8f4f0'
  const textColor: string = theme === 'dark' ? '#f5f5f0' : '#201515'
  const labelColor: string = theme === 'dark' ? '#d0d0c5' : '#605d52'

  const handleLogout = (): void => {
    localStorage.removeItem('userOnboardingData')
    router.push('/')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: theme === 'dark' ? '#2a2a2a' : '#e0ddd8' }}>
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold" style={{ color: textColor }}>
            Interview Arena Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: cardBgColor,
              color: '#ff4f00'
            }}
            type="button"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {userData ? (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="p-8 rounded-2xl" style={{ backgroundColor: cardBgColor }}>
              <h2 className="text-2xl font-semibold mb-4" style={{ color: textColor }}>
                Welcome, {userData.name}! 👋
              </h2>
              <p style={{ color: labelColor }} className="text-lg">
                You&apos;re all set to start your interview preparation journey.
              </p>
            </div>

            {/* User Profile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Goal Card */}
              <div className="p-6 rounded-xl" style={{ backgroundColor: cardBgColor }}>
                <h3 className="text-sm font-semibold mb-3 uppercase" style={{ color: labelColor }}>
                  Your Goal
                </h3>
                <p className="text-lg font-medium" style={{ color: textColor }}>
                  {userData.goal}
                </p>
              </div>

              {/* User Type Card */}
              <div className="p-6 rounded-xl" style={{ backgroundColor: cardBgColor }}>
                <h3 className="text-sm font-semibold mb-3 uppercase" style={{ color: labelColor }}>
                  Background
                </h3>
                <p className="text-lg font-medium" style={{ color: textColor }}>
                  {userData.userType.charAt(0).toUpperCase() + userData.userType.slice(1)}
                </p>
              </div>
            </div>

            {/* Problems/Challenges */}
            <div className="p-6 rounded-xl" style={{ backgroundColor: cardBgColor }}>
              <h3 className="text-sm font-semibold mb-4 uppercase" style={{ color: labelColor }}>
                Areas to Focus On
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {userData.problems.map((problem) => (
                  <div
                    key={problem}
                    className="px-4 py-3 rounded-lg text-center text-sm font-medium"
                    style={{ backgroundColor: '#ff4f0015', color: '#ff4f00', border: '1px solid #ff4f00' }}
                  >
                    {problem.charAt(0).toUpperCase() + problem.slice(1).replace('-', ' ')}
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="p-8 rounded-2xl" style={{ backgroundColor: '#ff4f0015', border: '2px solid #ff4f00' }}>
              <h3 className="text-xl font-semibold mb-4" style={{ color: textColor }}>
                Next Steps
              </h3>
              <ul className="space-y-3" style={{ color: labelColor }}>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold">1.</span>
                  <span>Take a practice interview based on your goal</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold">2.</span>
                  <span>Get AI-powered feedback on your performance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold">3.</span>
                  <span>Focus on the areas that need improvement</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold">4.</span>
                  <span>Track your progress and improve over time</span>
                </li>
              </ul>
            </div>

            {/* Start Button */}
            <button
              className="w-full py-4 rounded-xl font-semibold text-white transition-colors"
              style={{ backgroundColor: '#ff4f00' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e64500')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ff4f00')}
              type="button"
            >
              Start Your First Practice Interview
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <p style={{ color: labelColor }} className="text-lg mb-6">
              Loading your profile...
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-lg font-semibold"
              style={{ backgroundColor: '#ff4f00', color: '#ffffff' }}
              type="button"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
