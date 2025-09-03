import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePasswordResetToken } from '@/lib/auth'
import { createMockEmailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ message: 'If an account exists, a password reset email has been sent' })
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save reset token to database
    await prisma.passwordReset.create({
      data: {
        email: user.email,
        token: resetToken,
        expiresAt
      }
    })

    // Send reset email
    const emailService = createMockEmailService()
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password`
    
    const emailSent = await emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      resetUrl
    )

    if (emailSent) {
      return NextResponse.json({ 
        message: 'If an account exists, a password reset email has been sent' 
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send reset email' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
