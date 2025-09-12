'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'

interface Course {
  id: string
  title: string
  language: string
  goals: string
  level: string
  access: string
  thumbnail: string | null
  modules: Module[]
}

interface Module {
  id: string
  title: string
  description: string
  order: number
  lessons: Lesson[]
}

interface Lesson {
  id: string
  type: string
  title: string
  order: number
}

async function getCourse(id: string): Promise<Course | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/courses/public/${id}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data.course
  } catch (error) {
    console.error('Error fetching course:', error)
    return null
  }
}

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set())
  const { data: session, status } = useSession()
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set()) // Mock completion status

  useEffect(() => {
    async function fetchCourse() {
      try {
        const resolvedParams = await params
        const courseData = await getCourse(resolvedParams.id)
        setCourse(courseData)
        if (!courseData) {
          notFound()
        } else {
          // Initialize all modules as collapsed by default
          const allModuleIds = new Set(courseData.modules.map(module => module.id))
          setCollapsedModules(allModuleIds)
          
          // Initialize empty completion state (no lessons completed by default)
          setCompletedLessons(new Set())
        }
      } catch (error) {
        console.error('Error fetching course:', error)
        notFound()
      } finally {
        setLoading(false)
      }
    }
    
    fetchCourse()
  }, [params])


  const toggleModule = (moduleId: string) => {
    const newCollapsed = new Set(collapsedModules)
    if (newCollapsed.has(moduleId)) {
      newCollapsed.delete(moduleId)
    } else {
      newCollapsed.add(moduleId)
    }
    setCollapsedModules(newCollapsed)
  }

  const collapseAllModules = () => {
    if (course) {
      const allModuleIds = new Set(course.modules.map(module => module.id))
      setCollapsedModules(allModuleIds)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    notFound()
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getAccessColor = (access: string) => {
    return access.toLowerCase() === 'free' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                DappDojo
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {status === 'loading' ? (
                <div className="text-gray-500">Loading...</div>
              ) : session ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700 dark:text-gray-300">
                    Welcome, {session.user?.name || session.user?.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/auth/signin"
                    className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Course Header */}
        <section className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center mb-6">
              <Link 
                href="/"
                className="text-gray-600 dark:text-gray-400 hover:text-yellow-500 transition-colors"
              >
                ← Back to Courses
              </Link>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Course Info */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-6">
                  {course.title}
                </h1>
                
                {/* Course Info */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(course.level)}`}>
                      {course.level}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {course.modules.length} Modules • {course.modules.reduce((total, module) => total + module.lessons.length, 0)} Lessons
                    </span>
                  </div>
                </div>
                
                {/* Start Learning Button */}
                <div className="flex items-center gap-4 mb-8">
                  <button 
                    className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                    onClick={() => {
                      if (!session) {
                        window.location.href = '/auth/signin'
                      } else if (!session.user.isPremium) {
                        // Redirect to upgrade page or show upgrade modal
                        alert('Upgrade to premium to access all modules!')
                      } else {
                        alert('Starting course...')
                      }
                    }}
                  >
                    {!session ? 'Upgrade to Premium' : !session.user.isPremium ? 'Upgrade to Premium' : 'Start Learning'}
                  </button>
                </div>
              </div>
              
              {/* Course Thumbnail */}
              {course.thumbnail ? (
                <div className="lg:w-80">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <div className="lg:w-80">
                  <div className="w-full h-48 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-lg flex items-center justify-center">
                    <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <span className="text-4xl">🔧</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Course Modules
              </h2>
              <button
                onClick={collapseAllModules}
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Collapse All
              </button>
            </div>
            
            <div className="space-y-4">
              {course.modules.map((module, index) => {
                const completedInModule = module.lessons.filter(lesson => completedLessons.has(lesson.id)).length
                const totalLessons = module.lessons.length
                const isFirstModule = index === 0
                const isLocked = !session || (!session.user.isPremium && !isFirstModule)
                
                return (
                  <div key={module.id} className={`bg-gray-50 dark:bg-gray-800 rounded-lg ${isLocked ? 'opacity-60' : ''}`}>
                    <div 
                      className={`flex items-center justify-between p-4 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'} transition-colors`}
                      onClick={() => !isLocked && toggleModule(module.id)}
                    >
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                          Module {index + 1}: {module.title}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {completedInModule} of {totalLessons} completed
                        </span>
                        {isLocked && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-1 rounded-full">
                            🔒 Premium Only
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isLocked ? (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            🔒 Locked
                          </span>
                        ) : (
                          <>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {collapsedModules.has(module.id) ? 'Click to expand' : 'Click to collapse'}
                            </span>
                            <svg 
                              className={`w-5 h-5 text-gray-500 transition-transform ${collapsedModules.has(module.id) ? 'rotate-180' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </div>
                    </div>
                  
                  {!collapsedModules.has(module.id) && (
                    <div className="px-4 pt-4 pb-4">
                      <div className="space-y-2">
                        {module.lessons.map((lesson, lessonIndex) => {
                          const isCompleted = completedLessons.has(lesson.id)
                          const isLessonLocked = isLocked
                          
                          return (
                            <div key={lesson.id} className={`flex items-center gap-3 p-2 bg-white dark:bg-gray-700 rounded ${isLessonLocked ? 'opacity-60' : ''}`}>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                isCompleted 
                                  ? 'bg-green-500' 
                                  : isLessonLocked
                                  ? 'bg-gray-200 dark:bg-gray-500'
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}>
                                <span className={`text-xs ${
                                  isCompleted 
                                    ? 'text-white' 
                                    : isLessonLocked
                                    ? 'text-gray-400 dark:text-gray-600'
                                    : 'text-gray-600 dark:text-gray-300'
                                }`}>
                                  {isLessonLocked ? '🔒' : lessonIndex + 1}
                                </span>
                              </div>
                              <div className="flex-1">
                                <span className={`text-sm font-medium ${isLessonLocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                                  {lesson.title}
                                </span>
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 capitalize">
                                  ({lesson.type})
                                </span>
                                {isLessonLocked && (
                                  <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                                    Premium Only
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {isLessonLocked ? '🔒' : lesson.type === 'intro' ? '📖' : lesson.type === 'quiz' ? '❓' : '💻'}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  </div>
                )
              })}
            </div>
            
            {/* Start Learning Button */}
            <div className="mt-8 text-center">
              <button 
                className="bg-yellow-500 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                onClick={() => {
                  if (!session) {
                    window.location.href = '/auth/signin'
                  } else if (!session.user.isPremium) {
                    // Redirect to upgrade page or show upgrade modal
                    alert('Upgrade to premium to access all modules!')
                  } else {
                    alert('Starting course...')
                  }
                }}
              >
                {!session ? 'Upgrade to Premium' : !session.user.isPremium ? 'Upgrade to Premium' : 'Start Learning'}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-333 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold text-yellow-500 mb-4">
                DappDojo
              </h3>
              <p className="text-gray-300 max-w-md">
                Your gateway to becoming a professional Web3 developer through hands-on learning and practical exercises.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-yellow-500 transition-colors">About</a></li>
                <li><a href="#" className="text-gray-300 hover:text-yellow-500 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-yellow-500 transition-colors">Terms of Use</a></li>
                <li><a href="#" className="text-gray-300 hover:text-yellow-500 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-600 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 DappDojo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
