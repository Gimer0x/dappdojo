import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for course creation
const createCourseSchema = z.object({
  title: z.string().min(1, 'Course title is required').max(200, 'Title too long'),
  language: z.string().min(1, 'Language is required'),
  goals: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  access: z.enum(['free', 'paid']),
  status: z.enum(['active', 'deactivated']),
  thumbnail: z.string().optional(),
  modules: z.array(z.object({
    id: z.string(),
    title: z.string().min(1, 'Module title is required'),
    description: z.string().optional(),
    lessons: z.array(z.object({
      id: z.string(),
      type: z.enum(['intro', 'quiz', 'challenge']),
      title: z.string().min(1, 'Lesson title is required'),
      contentMarkdown: z.string().optional(),
      youtubeUrl: z.string().nullable().optional(),
      initialCode: z.string().optional(),
      solutionCode: z.string().optional(),
      tests: z.string().optional(),
    }))
  })).optional().default([])
})

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createCourseSchema.parse(body)

    // Create course with modules and lessons
    const course = await prisma.course.create({
      data: {
        title: validatedData.title,
        language: validatedData.language,
        goals: validatedData.goals || '',
        level: validatedData.level.toUpperCase() as any,
        access: validatedData.access.toUpperCase() as any,
        status: validatedData.status.toUpperCase() as any,
        thumbnail: validatedData.thumbnail || null,
        creatorId: payload.userId,
        modules: {
          create: validatedData.modules.map((module, moduleIndex) => ({
            title: module.title,
            description: module.description || '',
            order: moduleIndex + 1,
            lessons: {
              create: module.lessons.map((lesson, lessonIndex) => ({
                type: lesson.type.toUpperCase() as any,
                title: lesson.title,
                contentMarkdown: lesson.contentMarkdown || '',
                youtubeUrl: lesson.youtubeUrl || null,
                initialCode: lesson.initialCode || '',
                solutionCode: lesson.solutionCode || '',
                tests: lesson.tests || '',
                order: lessonIndex + 1,
              }))
            }
          }))
        }
      },
      include: {
        modules: {
          include: {
            lessons: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Course created successfully',
      course
    })

  } catch (error) {
    console.error('Course creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Failed to create course'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get courses
    const courses = await prisma.course.findMany({
      include: {
        modules: {
          include: {
            lessons: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            progress: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ courses })

  } catch (error) {
    console.error('Get courses error:', error)
    return NextResponse.json({
      error: 'Failed to fetch courses'
    }, { status: 500 })
  }
}
