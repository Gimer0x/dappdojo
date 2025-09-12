import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params

    // Get course with modules and lessons for public access
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        status: 'ACTIVE'
      },
      include: {
        modules: {
          include: {
            lessons: {
              select: {
                id: true,
                type: true,
                title: true,
                order: true
              },
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

    return NextResponse.json({ course })

  } catch (error) {
    console.error('Get public course error:', error)
    return NextResponse.json({
      error: 'Failed to fetch course'
    }, { status: 500 })
  }
}
