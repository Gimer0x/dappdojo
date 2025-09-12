'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'

interface User {
  id: string
  email: string
  name: string
  role: string
}

export default function CreateCourse() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  
  // Course metadata
  const [courseTitle, setCourseTitle] = useState('')
  const [courseLanguage, setCourseLanguage] = useState('solidity')
  const [courseGoals, setCourseGoals] = useState('')
  const [courseLevel, setCourseLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [courseAccess, setCourseAccess] = useState<'free' | 'paid'>('free')
  const [courseStatus, setCourseStatus] = useState<'active' | 'deactivated'>('active')
  const [courseThumbnail, setCourseThumbnail] = useState<string | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailError, setThumbnailError] = useState<string | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/admin/login')
      return
    }
  }, [router, session, status])

  const handleThumbnailSelect = async (file: File | null) => {
    setThumbnailError(null)
    
    if (!file) {
      setThumbnailFile(null)
      setCourseThumbnail(null)
      return
    }

    // Check file size before processing (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setThumbnailError('File size must be less than 5MB')
      return
    }
    
    // Check if file is empty
    if (file.size === 0) {
      setThumbnailError('File is empty')
      return
    }
    
    // Validate file type more strictly
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setThumbnailError('Only JPG and PNG images are allowed')
      return
    }
    
    // Check if file is accessible
    if (!file.name || file.name.trim() === '') {
      setThumbnailError('Invalid file name')
      return
    }

    setThumbnailFile(file)
    
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        
        // Set up timeout for FileReader
        const readerTimeout = setTimeout(() => {
          reader.abort()
          reject(new Error('File reading timed out'))
        }, 10000)
        
        reader.onload = () => {
          clearTimeout(readerTimeout)
          const result = reader.result as string
          if (!result || result.length === 0) {
            reject(new Error('File reading resulted in empty data'))
            return
          }
          resolve(result)
        }
        
        reader.onerror = (error) => {
          clearTimeout(readerTimeout)
          reject(new Error(`Failed to read file: ${error.type || 'Unknown error'}`))
        }
        
        reader.onabort = () => {
          clearTimeout(readerTimeout)
          reject(new Error('File reading was aborted'))
        }
        
        reader.readAsDataURL(file)
      })
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      // Try base64 upload first, fallback to FormData if needed
      let response: Response
      try {
        response = await fetch('/api/upload/base64', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileData: base64
          }),
          signal: controller.signal
        })
      } catch (base64Error) {
        // Fallback to FormData upload
        const formData = new FormData()
        formData.append('file', file)
        
        response = await fetch('/api/upload/simple', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        })
      }

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        setThumbnailError(`Upload failed: ${response.status} ${errorText}`)
        return
      }

      const data = await response.json()

      if (data.success) {
        setCourseThumbnail(data.url)
        setThumbnailError(null)
      } else {
        setThumbnailError(data.error || 'Failed to upload thumbnail')
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setThumbnailError('Upload timed out. Please try again.')
        } else {
          setThumbnailError(`Upload failed: ${error.message}`)
        }
      } else {
        setThumbnailError('Upload failed. Please try again.')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!courseTitle.trim()) {
      setMessage('Course title is required')
      setMessageType('error')
      return
    }

    if (!courseGoals.trim()) {
      setMessage('Course goals are required')
      setMessageType('error')
      return
    }

    setIsCreating(true)
    setMessage('')

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: courseTitle,
          language: courseLanguage,
          goals: courseGoals,
          level: courseLevel,
          access: courseAccess,
          status: courseStatus,
          thumbnail: courseThumbnail,
          modules: [] // Start with no modules
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Course created successfully! Redirecting to edit page...')
        setMessageType('success')
        setTimeout(() => {
          router.push(`/admin/courses/${data.course.id}/edit`)
        }, 1500)
      } else {
        setMessage(data.error || 'Failed to create course')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error creating course:', error)
      setMessage('Error creating course')
      setMessageType('error')
    } finally {
      setIsCreating(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto py-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create New Course
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Start by creating the basic course information. You can add modules and lessons later.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {session.user.email}
                </span>
                <Link
                  href="/admin/courses"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  ← Back to Courses
                </Link>
              </div>
            </div>
          </div>

          <div className="p-6">
            {message && (
              <div className={`mb-6 p-4 rounded-md ${
                messageType === 'success' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Course Information */}
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Course Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-600 dark:text-white"
                      placeholder="e.g., Complete Solidity Course"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Programming Language
                    </label>
                    <select
                      value={courseLanguage}
                      onChange={(e) => setCourseLanguage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-600 dark:text-white"
                    >
                      <option value="solidity">Solidity</option>
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="go">Go</option>
                      <option value="rust">Rust</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Level
                    </label>
                    <select
                      value={courseLevel}
                      onChange={(e) => setCourseLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-600 dark:text-white"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Access Type
                    </label>
                    <select
                      value={courseAccess}
                      onChange={(e) => setCourseAccess(e.target.value as 'free' | 'paid')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-600 dark:text-white"
                    >
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={courseStatus}
                      onChange={(e) => setCourseStatus(e.target.value as 'active' | 'deactivated')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-600 dark:text-white"
                    >
                      <option value="active">Active</option>
                      <option value="deactivated">Deactivated</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course Goals *
                    </label>
                    <textarea
                      value={courseGoals}
                      onChange={(e) => setCourseGoals(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-600 dark:text-white"
                      placeholder="Describe what students will learn in this course..."
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course Thumbnail
                    </label>
                    <ImageUpload
                      onImageSelect={handleThumbnailSelect}
                      currentImage={courseThumbnail}
                      error={thumbnailError || undefined}
                      disabled={isCreating}
                    />
                  </div>
                </div>
              </div>


              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link
                  href="/admin/courses"
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2 bg-yellow-500 text-black rounded-md font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating Course...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}