import Link from 'next/link'
import { notFound } from 'next/navigation'

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

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const course = await getCourse(id)

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
      <header className="bg-gray-333 fixed w-full top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-yellow-500">
                DappDojo
              </Link>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link 
                  href="/courses" 
                  className="text-white hover:text-yellow-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Browse Courses
                </Link>
                <Link 
                  href="/about" 
                  className="text-white hover:text-yellow-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  About
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
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
                
                {/* Price and Start Learning Button */}
                <div className="flex items-center gap-4 mb-8">
                  <span className={`text-2xl font-bold ${getAccessColor(course.access)}`}>
                    {course.access === 'FREE' ? 'Free' : '$19.99'}
                  </span>
                  <button className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors">
                    Start Learning
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
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">
              Course Modules
            </h2>
            
            <div className="space-y-6">
              {course.modules.map((module, index) => (
                <div key={module.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                      Module {index + 1}: {module.title}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {module.lessons.length} lessons
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {module.description}
                  </p>
                  
                  <div className="space-y-2">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            {lessonIndex + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-800 dark:text-white">
                            {lesson.title}
                          </span>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 capitalize">
                            ({lesson.type})
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {lesson.type === 'intro' ? '📖' : lesson.type === 'quiz' ? '❓' : '💻'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Start Learning Button */}
            <div className="mt-8 text-center">
              <button className="bg-yellow-500 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors">
                Start Learning
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
