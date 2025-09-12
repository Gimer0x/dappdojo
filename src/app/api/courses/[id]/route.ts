import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for course update
const updateCourseSchema = z.object({
  title: z.string().min(1, 'Course title is required').max(200, 'Title too long'),
  language: z.string().min(1, 'Language is required'),
  goals: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  access: z.enum(['free', 'paid']),
  status: z.enum(['active', 'deactivated']),
  thumbnail: z.string().nullable().optional(),
  modules: z.array(z.object({
    id: z.string(),
    title: z.string().min(1, 'Module title is required'),
    description: z.string().optional(),
    order: z.number(),
    lessons: z.array(z.object({
      id: z.string(),
      type: z.enum(['intro', 'quiz', 'challenge']),
      title: z.string().min(1, 'Lesson title is required'),
      contentMarkdown: z.string().optional(),
      youtubeUrl: z.string().nullable().optional(),
      initialCode: z.string().nullable().optional(),
      solutionCode: z.string().nullable().optional(),
      tests: z.string().nullable().optional(),
      order: z.number(),
    }))
  }))
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication using NextAuth.js
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: courseId } = await params

    // Get course with modules and lessons
    const course = await prisma.course.findUnique({
      where: {
        id: courseId
      },
      include: {
        modules: {
          include: {
            lessons: {
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if user is admin or course creator
    if (session.user.role !== 'ADMIN' && course.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ course })

  } catch (error) {
    console.error('Get course error:', error)
    return NextResponse.json({
      error: 'Failed to fetch course'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication using NextAuth.js
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: courseId } = await params

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    console.log('Received body:', JSON.stringify(body, null, 2))
    const validatedData = updateCourseSchema.parse(body)

    // Update course with modules and lessons
    // First, delete existing modules and lessons (cascade will handle lessons)
    await prisma.module.deleteMany({
      where: { courseId }
    })

    // Then create new modules and lessons
    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        title: validatedData.title,
        language: validatedData.language,
        goals: validatedData.goals || '',
        level: validatedData.level.toUpperCase() as any,
        access: validatedData.access.toUpperCase() as any,
        status: validatedData.status.toUpperCase() as any,
        thumbnail: validatedData.thumbnail || null,
        modules: {
          create: validatedData.modules.map((module) => ({
            title: module.title,
            description: module.description || '',
            order: module.order,
            lessons: {
              create: module.lessons.map((lesson) => ({
                type: lesson.type.toUpperCase() as any,
                title: lesson.title,
                contentMarkdown: lesson.contentMarkdown || '',
                youtubeUrl: lesson.youtubeUrl || null,
                initialCode: lesson.initialCode || '',
                solutionCode: lesson.solutionCode || '',
                tests: lesson.tests || '',
                order: lesson.order,
              }))
            }
          }))
        }
      },
      include: {
        modules: {
          include: {
            lessons: {
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Course updated successfully',
      course
    })

  } catch (error) {
    console.error('Course update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Failed to update course'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication using NextAuth.js
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: courseId } = await params

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Delete course (cascade will handle modules and lessons)
    await prisma.course.delete({
      where: { id: courseId }
    })

    return NextResponse.json({
      message: 'Course deleted successfully'
    })

  } catch (error) {
    console.error('Course deletion error:', error)
    return NextResponse.json({
      error: 'Failed to delete course'
    }, { status: 500 })
  }
}
