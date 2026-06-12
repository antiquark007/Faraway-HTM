'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  theme: 'light' | 'dark'
  onAuthSuccess?: (userData: { email: string; name: string }) => void
}

export function AuthModal({ isOpen, onClose, theme, onAuthSuccess }: AuthModalProps): JSX.Element | null {
  const [isSignUp, setIsSignUp] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [fullName, setFullName] = useState<string>('')

  if (!isOpen) return null

  const bgColor: string = theme === 'dark' ? '#1a1a1a' : '#fffefb'
  const textColor: string = theme === 'dark' ? '#f5f5f0' : '#201515'
  const inputBgColor: string = theme === 'dark' ? '#2a2a2a' : '#f8f4f0'
  const inputBorderColor: string = theme === 'dark' ? '#6a6a60' : '#c5c0b1'
  const labelColor: string = theme === 'dark' ? '#d0d0c5' : '#605d52'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    // Hardcoded sign-in - simulate successful authentication
    if (onAuthSuccess) {
      onAuthSuccess({
        email: email || 'user@example.com',
        name: fullName || 'User'
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="relative w-full max-w-md rounded-[16px] p-8 shadow-2xl" 
        style={{ backgroundColor: bgColor }}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 transition-colors"
          style={{ color: theme === 'dark' ? '#a0a090' : '#605d52' }}
          type="button"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-semibold mb-6" style={{ color: textColor }}>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name Field (Sign Up Only) */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-[8px] border-2 transition-colors focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: inputBgColor,
                  borderColor: inputBorderColor,
                  color: textColor,
                  '--tw-ring-color': '#ff4f00'
                } as React.CSSProperties}
              />
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-[8px] border-2 transition-colors focus:outline-none focus:ring-2"
              style={{
                backgroundColor: inputBgColor,
                borderColor: inputBorderColor,
                color: textColor,
                '--tw-ring-color': '#ff4f00'
              } as React.CSSProperties}
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-[8px] border-2 transition-colors focus:outline-none focus:ring-2"
              style={{
                backgroundColor: inputBgColor,
                borderColor: inputBorderColor,
                color: textColor,
                '--tw-ring-color': '#ff4f00'
              } as React.CSSProperties}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-[12px] font-semibold text-white transition-colors mt-6"
            style={{ backgroundColor: '#ff4f00' }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#e64500')}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#ff4f00')}
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle Sign In / Sign Up */}
        <div className="mt-6 text-center text-sm" style={{ color: labelColor }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-semibold transition-colors"
            style={{ color: '#ff4f00' }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.opacity = '1')}
            type="button"
          >
            Click here to {isSignUp ? 'sign in' : 'sign up'}
          </button>
        </div>
      </div>
    </div>
  )
}
