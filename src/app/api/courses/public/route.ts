import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all active courses for public access
    const courses = await prisma.course.findMany({
      where: {
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
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            modules: true,
            progress: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to include lesson count per module
    const transformedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      language: course.language,
      goals: course.goals,
      level: course.level,
      access: course.access,
      thumbnail: course.thumbnail,
      moduleCount: course._count.modules,
      totalLessons: course.modules.reduce((total, module) => total + module.lessons.length, 0),
      createdAt: course.createdAt
    }))

    return NextResponse.json({ courses: transformedCourses })

  } catch (error) {
    console.error('Get public courses error:', error)
    return NextResponse.json({
      error: 'Failed to fetch courses'
    }, { status: 500 })
  }
}
