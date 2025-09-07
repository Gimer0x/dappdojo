'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface Lesson {
  id: string
  type: string
  title: string
  order: number
}

interface Module {
  id: string
  title: string
  description: string
  order: number
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  language: string
  goals: string
  level: string
  access: string
  status: string
  thumbnail: string | null
  createdAt: string
  modules: Module[]
  _count: {
    progress: number
  }
}

export default function CoursesList() {
  const [user, setUser] = useState<User | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/admin/login')
      return
    }

    try {
      const user = JSON.parse(userData)
      setUser(user)
      fetchCourses()
    } catch (error) {
      router.push('/admin/login')
    }
  }, [router])

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses)
      } else {
        setError('Failed to fetch courses')
      }
    } catch (err) {
      setError('An error occurred while fetching courses')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/admin/login')
  }

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`)) {
      return
    }

    setDeletingCourseId(courseId)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Remove course from local state
        setCourses(courses.filter(course => course.id !== courseId))
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete course')
      }
    } catch (err) {
      setError('An error occurred while deleting the course')
    } finally {
      setDeletingCourseId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'deactivated':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getAccessColor = (access: string) => {
    switch (access.toLowerCase()) {
      case 'free':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'paid':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  if (!user) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gray-333 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-yellow-500">
                  DappDojo
                </h1>
              </Link>
              <nav className="ml-10 flex space-x-8">
                <Link href="/admin/dashboard" className="text-white hover:text-gray-300 px-3 py-2 text-sm font-medium transition-colors">
                  Dashboard
                </Link>
                <span className="text-white px-3 py-2 text-sm font-medium">
                  Courses
                </span>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm">
                Welcome, {user.name || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-white hover:text-gray-300 text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Course Management
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your courses, modules, and lessons
                </p>
              </div>
              <Link
                href="/admin/courses/create"
                className="bg-yellow-500 text-black px-4 py-2 rounded-md font-medium hover:bg-yellow-600 transition-colors"
              >
                Create New Course
              </Link>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-md bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No courses yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Get started by creating your first course
                </p>
                <Link
                  href="/admin/courses/create"
                  className="bg-yellow-500 text-black px-6 py-3 rounded-md font-medium hover:bg-yellow-600 transition-colors"
                >
                  Create Your First Course
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div key={course.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                    {/* Thumbnail */}
                    <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                      <img
                        src={course.thumbnail || '/uploads/thumbnails/placeholder.svg'}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                          {course.status.toLowerCase()}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2">
                        {course.title}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Language:</span>
                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {course.language}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Level:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                            {course.level.toLowerCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Access:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccessColor(course.access)}`}>
                            {course.access.toLowerCase()}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <span>📚 {course.modules.length} modules</span>
                          <span>📝 {course.modules.reduce((total, module) => total + module.lessons.length, 0)} lessons</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(course.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex space-x-2">
                            <Link
                              href={`/admin/courses/${course.id}/edit`}
                              className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 text-sm font-medium"
                            >
                              Edit
                            </Link>
                            <button 
                              onClick={() => handleDeleteCourse(course.id, course.title)}
                              disabled={deletingCourseId === course.id}
                              className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                            >
                              {deletingCourseId === course.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
