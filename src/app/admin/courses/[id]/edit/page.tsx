'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface Lesson {
  id: string
  type: 'intro' | 'quiz' | 'challenge'
  title: string
  contentMarkdown?: string
  youtubeUrl?: string
  initialCode?: string
  solutionCode?: string
  tests?: string
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
  modules: Module[]
}

export default function EditCourse() {
  const [user, setUser] = useState<User | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set())
  const [selectedLesson, setSelectedLesson] = useState<{moduleId: string, lessonId: string} | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSavingModule, setIsSavingModule] = useState<string | null>(null)
  const [isSavingLesson, setIsSavingLesson] = useState<string | null>(null)
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true)
  const [activeTab, setActiveTab] = useState<'instructions' | 'initialCode' | 'solutionCode' | 'tests'>('instructions')
  const [introTab, setIntroTab] = useState<'edit' | 'preview'>('edit')
  
  // Drag and drop state
  const [draggedLesson, setDraggedLesson] = useState<{moduleId: string, lessonId: string} | null>(null)
  const [dragOverModule, setDragOverModule] = useState<string | null>(null)
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null)
  const [dragOverLessonId, setDragOverLessonId] = useState<string | null>(null)
  
  // Module drag and drop state
  const [draggedModule, setDraggedModule] = useState<string | null>(null)
  const [dragOverModulePosition, setDragOverModulePosition] = useState<'before' | 'after' | null>(null)
  const [dragOverTargetModule, setDragOverTargetModule] = useState<string | null>(null)
  
  // Course metadata
  const [courseTitle, setCourseTitle] = useState('')
  const [courseLanguage, setCourseLanguage] = useState('solidity')
  const [courseGoals, setCourseGoals] = useState('')
  const [courseLevel, setCourseLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [courseAccess, setCourseAccess] = useState<'free' | 'paid'>('free')
  const [courseStatus, setCourseStatus] = useState<'active' | 'deactivated'>('active')
  const [courseThumbnail, setCourseThumbnail] = useState<string | null>(null)
  const [thumbnailError, setThumbnailError] = useState<string | null>(null)
  
  // Modules
  const [modules, setModules] = useState<Module[]>([])
  
  // Tree interface helper functions
  const toggleModuleCollapse = (moduleId: string) => {
    const newCollapsed = new Set(collapsedModules)
    if (newCollapsed.has(moduleId)) {
      newCollapsed.delete(moduleId)
    } else {
      newCollapsed.add(moduleId)
    }
    setCollapsedModules(newCollapsed)
  }

  const toggleHeaderCollapse = () => {
    setIsHeaderCollapsed(!isHeaderCollapsed)
  }

  const selectLesson = (moduleId: string, lessonId: string) => {
    setSelectedLesson({ moduleId, lessonId })
  }

  const getSelectedLesson = () => {
    if (!selectedLesson) return null
    const module = modules.find(m => m.id === selectedLesson.moduleId)
    if (!module) return null
    return module.lessons.find(l => l.id === selectedLesson.lessonId) || null
  }

  const getSelectedModule = () => {
    if (!selectedLesson) return null
    return modules.find(m => m.id === selectedLesson.moduleId) || null
  }

  // Helper function to get lesson number within a module (starts from 1 per module)
  const getModuleLessonNumber = (targetModuleId: string, targetLessonId: string) => {
    const module = modules.find(m => m.id === targetModuleId)
    if (!module) return 0
    
    const lessonIndex = module.lessons.findIndex(l => l.id === targetLessonId)
    return lessonIndex + 1
  }

  // Comprehensive Markdown renderer with syntax highlighting
  const renderMarkdown = (markdown: string): string => {
    if (!markdown) return ''
    
    let html = markdown
    
    // First, extract and replace code blocks with placeholders to prevent them from being processed as paragraphs
    const codeBlocks: string[] = []
    
    // Handle Solidity code blocks first
    html = html.replace(/```solidity\n?([\s\S]*?)```/g, (match, code) => {
      const highlighted = highlightSolidityCode(code.trim())
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`
      codeBlocks.push(`<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4" style="line-height: 1.5 !important; margin: 0 !important; padding: 1rem !important; font-size: 14px !important;"><code class="language-solidity" style="line-height: 1.5 !important; margin: 0 !important; padding: 0 !important; display: block !important; font-size: 14px !important;">${highlighted}</code></pre>`)
      return placeholder
    })
    
    // Handle other code blocks
    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
      if (lang === 'solidity') return match // Already handled above
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`
      codeBlocks.push(`<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4" style="line-height: 1.0 !important; margin: 0 !important; padding: 1rem !important; font-size: 14px !important;"><code class="language-${lang || 'text'}" style="line-height: 1.0 !important; margin: 0 !important; padding: 0 !important; display: block !important; font-size: 14px !important;">${code.trim()}</code></pre>`)
      return placeholder
    })
    
    // Handle inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono">$1</code>')
    
    // Handle headings
    html = html.replace(/^######\s+(.*)$/gm, '<h6 class="text-sm font-bold text-gray-900 dark:text-white mb-2 mt-4">$1</h6>')
    html = html.replace(/^#####\s+(.*)$/gm, '<h5 class="text-base font-bold text-gray-900 dark:text-white mb-2 mt-4">$1</h5>')
    html = html.replace(/^####\s+(.*)$/gm, '<h4 class="text-lg font-bold text-gray-900 dark:text-white mb-2 mt-4">$1</h4>')
    html = html.replace(/^###\s+(.*)$/gm, '<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 mt-4">$1</h3>')
    html = html.replace(/^##\s+(.*)$/gm, '<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-3 mt-6">$1</h2>')
    html = html.replace(/^#\s+(.*)$/gm, '<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4 mt-8">$1</h1>')
    
    // Handle blockquotes with nested content
    html = html.replace(/^(> .*(\n> .*)*)$/gm, (match) => {
      let content = match.replace(/^> /gm, '').trim()
      
      // Process nested markdown within blockquote
      content = content.replace(/^######\s+(.*)$/gm, '<h6 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">$1</h6>')
      content = content.replace(/^#####\s+(.*)$/gm, '<h5 class="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">$1</h5>')
      content = content.replace(/^####\s+(.*)$/gm, '<h4 class="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">$1</h4>')
      content = content.replace(/^###\s+(.*)$/gm, '<h3 class="text-xl font-bold text-gray-700 dark:text-gray-300 mb-1">$1</h3>')
      content = content.replace(/^##\s+(.*)$/gm, '<h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">$1</h2>')
      content = content.replace(/^#\s+(.*)$/gm, '<h1 class="text-3xl font-bold text-gray-700 dark:text-gray-300 mb-2">$1</h1>')
      
      // Handle lists within blockquotes
      content = content.replace(/^\* (.*)$/gm, '<li class="ml-4">$1</li>')
      content = content.replace(/^- (.*)$/gm, '<li class="ml-4">$1</li>')
      content = content.replace(/^(\d+)\. (.*)$/gm, '<li class="ml-4">$2</li>')
      content = content.replace(/(<li.*<\/li>\s*)+/g, '<ul class="list-disc list-inside mb-2 space-y-1">$&</ul>')
      
      // Handle bold and italic within blockquotes
      content = content.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>')
      content = content.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
      
      // Wrap remaining text in paragraphs
      content = content.replace(/^(?!<[hlu])(.*)$/gm, '<p class="mb-2 text-gray-700 dark:text-gray-300">$1</p>')
      
      return `<blockquote class="border-l-4 border-amber-400 pl-4 py-2 my-4 bg-amber-50 dark:bg-amber-900/20 rounded-r-md">${content}</blockquote>`
    })
    
    // Handle images (including video thumbnails)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4 shadow-md" />')
    
    // Handle video embeds (YouTube thumbnail pattern)
    html = html.replace(/\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g, '<a href="$3" target="_blank" rel="noopener noreferrer" class="inline-block my-4"><img src="$2" alt="$1" class="max-w-full h-auto rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-amber-400" /></a>')
    
    // Handle links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline font-medium">$1</a>')
    
    // Handle unordered lists
    html = html.replace(/^\* (.*)$/gm, '<li class="mb-1">$1</li>')
    html = html.replace(/^- (.*)$/gm, '<li class="mb-1">$1</li>')
    html = html.replace(/(<li class="mb-1">.*<\/li>\s*)+/g, '<ul class="list-disc list-inside mb-4 ml-4 space-y-1">$&</ul>')
    
    // Handle ordered lists
    html = html.replace(/^(\d+)\. (.*)$/gm, '<li class="mb-1">$2</li>')
    html = html.replace(/(<li class="mb-1">.*<\/li>\s*)+/g, (match) => {
      // Check if this is part of an unordered list already
      if (match.includes('list-disc')) return match
      return `<ol class="list-decimal list-inside mb-4 ml-4 space-y-1">${match}</ol>`
    })
    
    // Handle bold and italic text
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-gray-800 dark:text-gray-200">$1</em>')
    
    // Handle paragraphs (wrap remaining text)
    html = html.replace(/^(?!<[hlupo])(.+)$/gm, '<p class="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">$1</p>')
    
    // Reduce margin between paragraphs and lists
    html = html.replace(/(<p class="mb-4[^"]*">[^<]*<\/p>)\s*(<ul|<ol)/g, (match, pTag, listTag) => {
      const newPTag = pTag.replace('mb-4', 'mb-2')
      return newPTag + listTag
    })
    
    // Clean up extra whitespace and empty paragraphs
    html = html.replace(/<p[^>]*>\s*<\/p>/g, '')
    html = html.replace(/\n\s*\n/g, '\n')
    
    // Restore code blocks
    codeBlocks.forEach((codeBlock, index) => {
      html = html.replace(`__CODE_BLOCK_${index}__`, codeBlock)
    })
    
    return html.trim()
  }

  // Solidity syntax highlighting function
  const highlightSolidityCode = (code: string): string => {
    let highlighted = code
    
    // Process line by line to avoid conflicts
    const lines = highlighted.split('\n')
    const processedLines = lines.map((line, index) => {
      let processedLine = line
      
      // Handle comments first (single line and multi-line)
      processedLine = processedLine.replace(/(\/\/.*$)/g, '<span class="text-gray-500 dark:text-gray-400 italic">$1</span>')
      processedLine = processedLine.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-gray-500 dark:text-gray-400 italic">$1</span>')
      
      // Handle strings (but not if they're inside comments)
      if (!processedLine.includes('<span class="text-gray-500')) {
        processedLine = processedLine.replace(/(".*?")/g, '<span class="text-green-400">$1</span>')
        processedLine = processedLine.replace(/('.*?')/g, '<span class="text-green-400">$1</span>')
      }
      
      // Handle numbers (but not if they're inside strings or comments)
      if (!processedLine.includes('<span class="text-green-400') && !processedLine.includes('<span class="text-gray-500')) {
        processedLine = processedLine.replace(/\b(\d+\.?\d*)\b/g, '<span class="text-blue-300">$1</span>')
      }
      
      // Handle Solidity keywords (but not if they're inside strings or comments)
      if (!processedLine.includes('<span class="text-green-400') && !processedLine.includes('<span class="text-gray-500')) {
        const keywords = [
          'contract', 'pragma', 'solidity', 'function', 'modifier', 'event', 'struct', 'enum',
          'mapping', 'address', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uint128', 'uint256',
          'int', 'int8', 'int16', 'int32', 'int64', 'int128', 'int256', 'bool', 'string', 'bytes',
          'bytes1', 'bytes2', 'bytes4', 'bytes8', 'bytes16', 'bytes32',
          'public', 'private', 'internal', 'external', 'pure', 'view', 'payable', 'nonpayable',
          'memory', 'storage', 'calldata', 'constant', 'immutable',
          'if', 'else', 'for', 'while', 'do', 'break', 'continue', 'return', 'try', 'catch',
          'require', 'assert', 'revert', 'throw',
          'msg', 'tx', 'block', 'now', 'this', 'super',
          'wei', 'gwei', 'ether', 'seconds', 'minutes', 'hours', 'days', 'weeks', 'years',
          'true', 'false', 'null', 'undefined'
        ]
        
        keywords.forEach(keyword => {
          const regex = new RegExp(`\\b(${keyword})\\b`, 'g')
          processedLine = processedLine.replace(regex, '<span class="text-blue-400 font-semibold">$1</span>')
        })
      }
      
      // No extra spacing needed - let the natural line breaks handle it
      
      return processedLine
    })
    
    return processedLines.join('\n')
  }

  // Drag and drop helper functions
  const handleLessonDragStart = (e: React.DragEvent, moduleId: string, lessonId: string) => {
    setDraggedLesson({ moduleId, lessonId })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '') // Required for Firefox
  }

  const handleLessonDragEnd = () => {
    // Clean up drag state when drag operation ends
    clearDragState()
  }

  const handleLessonDragOver = (e: React.DragEvent, moduleId: string, lessonId: string, position: 'before' | 'after') => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDragOverModule(moduleId)
    setDragOverLessonId(lessonId)
    setDragOverPosition(position)
  }

  const handleLessonDragLeave = (e: React.DragEvent) => {
    // Simple drag leave - clear the drop zone state
    setDragOverModule(null)
    setDragOverLessonId(null)
    setDragOverPosition(null)
  }

  const handleLessonDrop = (e: React.DragEvent, targetModuleId: string, targetLessonId: string, position: 'before' | 'after') => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!draggedLesson) return
    
    const sourceModuleId = draggedLesson.moduleId
    const sourceLessonId = draggedLesson.lessonId
    
    // Don't allow dropping on itself
    if (sourceModuleId === targetModuleId && sourceLessonId === targetLessonId) {
      clearDragState()
      return
    }
    
    // Reorder lessons
    reorderLessons(sourceModuleId, sourceLessonId, targetModuleId, targetLessonId, position)
    clearDragState()
  }

  const clearDragState = () => {
    setDraggedLesson(null)
    setDragOverModule(null)
    setDragOverLessonId(null)
    setDragOverPosition(null)
  }

  const clearModuleDragState = () => {
    setDraggedModule(null)
    setDragOverModulePosition(null)
    setDragOverTargetModule(null)
  }

  // Module drag and drop helper functions
  const handleModuleDragStart = (e: React.DragEvent, moduleId: string) => {
    setDraggedModule(moduleId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '') // Required for Firefox
  }

  const handleModuleDragEnd = () => {
    clearModuleDragState()
  }

  const handleModuleDragOver = (e: React.DragEvent, targetModuleId: string, position: 'before' | 'after') => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDragOverTargetModule(targetModuleId)
    setDragOverModulePosition(position)
  }

  const handleModuleDragLeave = (e: React.DragEvent) => {
    setDragOverTargetModule(null)
    setDragOverModulePosition(null)
  }

  const handleModuleDrop = (e: React.DragEvent, targetModuleId: string, position: 'before' | 'after') => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!draggedModule) return
    
    // Don't allow dropping on itself
    if (draggedModule === targetModuleId) {
      clearModuleDragState()
      return
    }
    
    // Reorder modules
    reorderModules(draggedModule, targetModuleId, position)
    clearModuleDragState()
  }

  const reorderModules = (sourceModuleId: string, targetModuleId: string, position: 'before' | 'after') => {
    setModules(prevModules => {
      const newModules = [...prevModules]
      
      // Find source module
      const sourceModule = newModules.find(m => m.id === sourceModuleId)
      if (!sourceModule) return prevModules
      
      // Remove source module
      const modulesWithoutSource = newModules.filter(m => m.id !== sourceModuleId)
      
      // Find target module index
      const targetIndex = modulesWithoutSource.findIndex(m => m.id === targetModuleId)
      if (targetIndex === -1) return prevModules
      
      // Calculate insert index
      const insertIndex = position === 'before' ? targetIndex : targetIndex + 1
      
      // Insert source module at new position
      const reorderedModules = [
        ...modulesWithoutSource.slice(0, insertIndex),
        sourceModule,
        ...modulesWithoutSource.slice(insertIndex)
      ]
      
      // Update order numbers
      return reorderedModules.map((module, index) => ({
        ...module,
        order: index + 1
      }))
    })
    
    setHasUnsavedChanges(true)
  }

  const reorderLessons = (sourceModuleId: string, sourceLessonId: string, targetModuleId: string, targetLessonId: string, position: 'before' | 'after') => {
    setModules(prevModules => {
      const newModules = [...prevModules]
      
      // Find source module and lesson
      const sourceModule = newModules.find(m => m.id === sourceModuleId)
      if (!sourceModule) return prevModules
      
      const sourceLesson = sourceModule.lessons.find(l => l.id === sourceLessonId)
      if (!sourceLesson) return prevModules
      
      // Find target module
      const targetModule = newModules.find(m => m.id === targetModuleId)
      if (!targetModule) return prevModules
      
      // If moving within the same module
      if (sourceModuleId === targetModuleId) {
        const lessons = [...sourceModule.lessons]
        const sourceIndex = lessons.findIndex(l => l.id === sourceLessonId)
        const targetIndex = lessons.findIndex(l => l.id === targetLessonId)
        
        // Remove source lesson
        lessons.splice(sourceIndex, 1)
        
        // Calculate new insert index (accounting for removal)
        let insertIndex = lessons.findIndex(l => l.id === targetLessonId)
        if (position === 'after') insertIndex += 1
        
        // Insert at new position
        lessons.splice(insertIndex, 0, sourceLesson)
        
        // Update the module
        const updatedModule = {
          ...sourceModule,
          lessons: lessons.map((lesson, index) => ({
            ...lesson,
            order: index + 1
          }))
        }
        
        return newModules.map(module => 
          module.id === sourceModuleId ? updatedModule : module
        )
      } else {
        // Moving between different modules
        const updatedSourceModule = {
          ...sourceModule,
          lessons: sourceModule.lessons.filter(l => l.id !== sourceLessonId)
        }
        
        // Insert lesson at new position in target module
        const targetIndex = targetModule.lessons.findIndex(l => l.id === targetLessonId)
        const insertIndex = position === 'before' ? targetIndex : targetIndex + 1
        
        const updatedTargetModule = {
          ...targetModule,
          lessons: [
            ...targetModule.lessons.slice(0, insertIndex),
            sourceLesson,
            ...targetModule.lessons.slice(insertIndex)
          ]
        }
        
        // Update modules array
        const result = newModules.map(module => {
          if (module.id === sourceModuleId) return updatedSourceModule
          if (module.id === targetModuleId) return updatedTargetModule
          return module
        })
        
        // Update order numbers
        return result.map(module => ({
          ...module,
          lessons: module.lessons.map((lesson, index) => ({
            ...lesson,
            order: index + 1
          }))
        }))
      }
    })
    
    setHasUnsavedChanges(true)
  }

  // Save individual module
  const saveModule = async (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId)
    if (!module) return

    setIsSavingModule(moduleId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: courseTitle,
          language: courseLanguage,
          goals: courseGoals,
          level: courseLevel,
          access: courseAccess,
          status: courseStatus,
          thumbnail: courseThumbnail,
          modules
        }),
      })

      if (response.ok) {
        setMessage('Module saved successfully!')
        setMessageType('success')
        setHasUnsavedChanges(false)
        setTimeout(() => setMessage(''), 2000)
      } else {
        const data = await response.json()
        setMessage(data.error || 'Failed to save module')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error saving module:', error)
      setMessage('Error saving module')
      setMessageType('error')
    } finally {
      setIsSavingModule(null)
    }
  }

  // Save individual lesson
  const saveLesson = async (moduleId: string, lessonId: string) => {
    setIsSavingLesson(lessonId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: courseTitle,
          language: courseLanguage,
          goals: courseGoals,
          level: courseLevel,
          access: courseAccess,
          status: courseStatus,
          thumbnail: courseThumbnail,
          modules
        }),
      })

      if (response.ok) {
        setMessage('Lesson saved successfully!')
        setMessageType('success')
        setHasUnsavedChanges(false)
        setTimeout(() => setMessage(''), 2000)
      } else {
        const data = await response.json()
        setMessage(data.error || 'Failed to save lesson')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error saving lesson:', error)
      setMessage('Error saving lesson')
      setMessageType('error')
    } finally {
      setIsSavingLesson(null)
    }
  }
  
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/admin/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/admin/login')
      return
    }

    // Fetch course data
    fetchCourse()
  }, [router, courseId])

  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const courseData = data.course
        
        setCourse(courseData)
        setCourseTitle(courseData.title)
        setCourseLanguage(courseData.language)
        setCourseGoals(courseData.goals || '')
        setCourseLevel(courseData.level.toLowerCase())
        setCourseAccess(courseData.access.toLowerCase())
        setCourseStatus(courseData.status.toLowerCase())
        setCourseThumbnail(courseData.thumbnail || null)
        
        // Process modules and lessons to ensure proper format
        const processedModules = (courseData.modules || []).map((module: any) => ({
          ...module,
          lessons: module.lessons.map((lesson: any) => ({
            ...lesson,
            type: lesson.type.toLowerCase() as 'intro' | 'quiz' | 'challenge'
          }))
        }))
        setModules(processedModules)
        
        // Collapse all modules by default
        const allModuleIds = new Set<string>(processedModules.map((module: any) => module.id))
        setCollapsedModules(allModuleIds)
      } else {
        setMessage('Failed to fetch course')
        setMessageType('error')
      }
    } catch (err) {
      console.error('Error fetching course:', err)
      setMessage('Error fetching course')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const addModule = () => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: `Module ${modules.length + 1}`,
      description: '',
      order: modules.length + 1,
      lessons: []
    }
    setModules([...modules, newModule])
  }

  const removeModule = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId)
    if (!module) return

    const moduleTitle = module.title || `Module ${modules.indexOf(module) + 1}`
    const lessonCount = module.lessons.length
    
    const confirmMessage = lessonCount > 0 
      ? `Are you sure you want to delete "${moduleTitle}"? This will also delete ${lessonCount} lesson${lessonCount === 1 ? '' : 's'} in this module. This action cannot be undone.`
      : `Are you sure you want to delete "${moduleTitle}"? This action cannot be undone.`

    if (window.confirm(confirmMessage)) {
      setModules(modules.filter(m => m.id !== moduleId))
      // Clear selection if selected lesson was in this module
      if (selectedLesson?.moduleId === moduleId) {
        setSelectedLesson(null)
      }
      setHasUnsavedChanges(true)
    }
  }

  const updateModule = (moduleId: string, field: keyof Module, value: string) => {
    setModules(modules.map(module => 
      module.id === moduleId 
        ? { ...module, [field]: value }
        : module
    ))
    setHasUnsavedChanges(true)
  }

  const addLesson = (moduleId: string, type: 'intro' | 'quiz' | 'challenge') => {
    const module = modules.find(m => m.id === moduleId)
    if (!module) return

    const lessonTypeNames = {
      intro: 'Introduction',
      quiz: 'Quiz',
      challenge: 'Challenge'
    }

    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      type,
      title: `${lessonTypeNames[type]} ${module.lessons.length + 1}`,
      contentMarkdown: '',
      initialCode: '',
      solutionCode: '',
      tests: '',
      order: module.lessons.length + 1
    }

    setModules(modules.map(m => 
      m.id === moduleId 
        ? { ...m, lessons: [...m.lessons, newLesson] }
        : m
    ))

    // Auto-select the new lesson
    selectLesson(moduleId, newLesson.id)
  }

  const removeLesson = (moduleId: string, lessonId: string) => {
    const module = modules.find(m => m.id === moduleId)
    if (!module) return

    const lesson = module.lessons.find(l => l.id === lessonId)
    if (!lesson) return

    const lessonTitle = lesson.title || 'Untitled Lesson'
    const lessonType = lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)
    
    const confirmMessage = `Are you sure you want to delete the ${lessonType} lesson "${lessonTitle}"? This action cannot be undone.`

    if (window.confirm(confirmMessage)) {
      setModules(modules.map(module => 
        module.id === moduleId 
          ? { ...module, lessons: module.lessons.filter(l => l.id !== lessonId) }
          : module
      ))
      
      // Clear selection if this lesson was selected
      if (selectedLesson?.moduleId === moduleId && selectedLesson?.lessonId === lessonId) {
        setSelectedLesson(null)
      }
      setHasUnsavedChanges(true)
    }
  }

  const updateLesson = (moduleId: string, lessonId: string, field: keyof Lesson, value: string) => {
    setModules(modules.map(module => 
      module.id === moduleId 
        ? {
            ...module,
            lessons: module.lessons.map(lesson =>
              lesson.id === lessonId 
                ? { ...lesson, [field]: value }
                : lesson
            )
          }
        : module
    ))
    setHasUnsavedChanges(true)
  }

  const handleThumbnailSelect = async (file: File | null) => {
    setThumbnailError(null)
    
    if (!file) {
      setCourseThumbnail(null)
      setHasUnsavedChanges(true)
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/thumbnail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setCourseThumbnail(data.url)
        setHasUnsavedChanges(true)
      } else {
        setThumbnailError(data.error || 'Failed to upload thumbnail')
      }
    } catch (error) {
      setThumbnailError('Failed to upload thumbnail')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!courseTitle.trim()) {
      setMessage('Course title is required')
      setMessageType('error')
      return
    }

    if (modules.length === 0) {
      setMessage('At least one module is required')
      setMessageType('error')
      return
    }

    // Validate modules
    for (const module of modules) {
      if (!module.title.trim()) {
        setMessage(`Module ${modules.indexOf(module) + 1} title is required`)
        setMessageType('error')
        return
      }
      
      // Validate lessons within each module
      for (const lesson of module.lessons) {
        if (!lesson.title.trim()) {
          setMessage(`Lesson title is required in Module ${modules.indexOf(module) + 1}`)
          setMessageType('error')
          return
        }
      }
    }

    setIsSaving(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      
      // Debug: Log the data being sent
      const requestData = {
        title: courseTitle,
        language: courseLanguage,
        goals: courseGoals,
        level: courseLevel,
        access: courseAccess,
        status: courseStatus,
        thumbnail: courseThumbnail,
        modules
      }
      console.log('Sending data:', JSON.stringify(requestData, null, 2))
      
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Course updated successfully!')
        setMessageType('success')
        setTimeout(() => {
          router.push('/admin/courses')
        }, 1500)
      } else {
        setMessage(data.error || 'Failed to update course')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error updating course:', error)
      setMessage('Error updating course')
      setMessageType('error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-full mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit Course
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Update course information and structure
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
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

            <form id="course-form" onSubmit={handleSubmit} className="h-full">
              <div className="flex h-[calc(100vh-180px)]">
                {/* Left Sidebar - Tree Navigation */}
                <div className="w-1/3 border-r border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex flex-col">
                  <div className="border-b border-gray-300 dark:border-gray-600 flex-shrink-0">
                    {/* Header Toggle */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Course Structure
                        </h3>
                        <button
                          type="button"
                          onClick={toggleHeaderCollapse}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                        >
                          {isHeaderCollapsed ? '▼' : '▲'} {isHeaderCollapsed ? 'Show' : 'Hide'} Details
                        </button>
                      </div>
                    </div>
                    
                    {/* Course Metadata - Collapsible */}
                    {!isHeaderCollapsed && (
                      <div className="p-3">
                        <div className="space-y-2 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Course Title
                        </label>
                        <input
                          type="text"
                          value={courseTitle}
                          onChange={(e) => {
                            setCourseTitle(e.target.value)
                            setHasUnsavedChanges(true)
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Course title"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Level
                          </label>
                          <select
                            value={courseLevel}
                            onChange={(e) => {
                              setCourseLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')
                              setHasUnsavedChanges(true)
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Access
                          </label>
                          <select
                            value={courseAccess}
                            onChange={(e) => {
                              setCourseAccess(e.target.value as 'free' | 'paid')
                              setHasUnsavedChanges(true)
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="free">Free</option>
                            <option value="paid">Paid</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Status
                        </label>
                        <select
                          value={courseStatus}
                          onChange={(e) => {
                            setCourseStatus(e.target.value as 'active' | 'deactivated')
                            setHasUnsavedChanges(true)
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="active">Active</option>
                          <option value="deactivated">Deactivated</option>
                        </select>
                      </div>
                    </div>

                    {/* Thumbnail Upload */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Course Thumbnail
                      </label>
                      <ImageUpload
                        onImageSelect={handleThumbnailSelect}
                        currentImage={courseThumbnail}
                        error={thumbnailError || undefined}
                        disabled={isSaving}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 mb-3">
                      <Link
                        href="/admin/courses"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-center"
                      >
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        form="course-form"
                        disabled={isSaving}
                        className={`flex-1 px-3 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
                          hasUnsavedChanges 
                            ? 'bg-yellow-700 text-white hover:bg-yellow-800' 
                            : 'bg-yellow-600 text-white hover:bg-yellow-700'
                        }`}
                      >
                        {isSaving ? 'Saving...' : hasUnsavedChanges ? '⚠️ Save' : 'Save'}
                      </button>
                    </div>

                      </div>
                    )}
                  </div>

                  {/* Add Module Button - Always Visible */}
                  <div className="p-3 border-b border-gray-300 dark:border-gray-600 flex-shrink-0">
                    <button
                      type="button"
                      onClick={addModule}
                      className="w-full px-3 py-2 bg-yellow-600 text-white rounded-md font-medium hover:bg-yellow-700 transition-colors text-sm"
                    >
                      + Add New Module
                    </button>
                  </div>

                  {/* Tree Navigation */}
                  <div className="p-3 overflow-y-auto flex-1 min-h-0">
                    {modules.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <div className="mb-4">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <p className="text-sm mb-2">No modules yet.</p>
                        <p className="text-xs">Add your first module to start building your course content.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {modules.map((module, moduleIndex) => (
                          <div key={module.id}>
                            {/* Drop zone before module */}
                            <div
                              className={`h-1 transition-colors ${
                                dragOverTargetModule === module.id && 
                                dragOverModulePosition === 'before'
                                  ? 'bg-blue-500' 
                                  : 'bg-transparent'
                              }`}
                              onDragOver={(e) => handleModuleDragOver(e, module.id, 'before')}
                              onDragLeave={handleModuleDragLeave}
                              onDrop={(e) => handleModuleDrop(e, module.id, 'before')}
                            />
                            
                            {/* Module Container */}
                            <div className={`border border-gray-200 dark:border-gray-600 rounded transition-colors ${
                              draggedModule === module.id ? 'opacity-50 bg-gray-200 dark:bg-gray-600' : ''
                            }`}>
                              {/* Module Header */}
                              <div 
                                draggable
                                onDragStart={(e) => handleModuleDragStart(e, module.id)}
                                onDragEnd={handleModuleDragEnd}
                                className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 cursor-move"
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-400 dark:text-gray-500 cursor-move mr-1">⋮⋮</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleModuleCollapse(module.id)
                                    }}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                  >
                                    {collapsedModules.has(module.id) ? '▶' : '▼'}
                                  </button>
                                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                                    Module {moduleIndex + 1}
                                  </span>
                                </div>
                              <div className="flex space-x-1">
                                <button
                                  type="button"
                                  onClick={() => addLesson(module.id, 'intro')}
                                  className="text-xs px-2 py-1 bg-sky-600 text-white rounded hover:bg-sky-700"
                                  title="Add Intro Lesson"
                                >
                                  +I
                                </button>
                                <button
                                  type="button"
                                  onClick={() => addLesson(module.id, 'challenge')}
                                  className="text-xs px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                  title="Add Challenge Lesson"
                                >
                                  +C
                                </button>
                                <button
                                  type="button"
                                  onClick={() => addLesson(module.id, 'quiz')}
                                  className="text-xs px-2 py-1 bg-violet-600 text-white rounded hover:bg-violet-700"
                                  title="Add Quiz Lesson"
                                >
                                  +Q
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveModule(module.id)}
                                  disabled={isSavingModule === module.id}
                                  className="text-xs px-2 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50"
                                  title="Save Module"
                                >
                                  {isSavingModule === module.id ? '...' : '💾'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeModule(module.id)}
                                  className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                  title="Remove Module"
                                >
                                  ×
                                </button>
                              </div>
                            </div>

                            {/* Module Content */}
                            {!collapsedModules.has(module.id) && (
                              <div className="bg-gray-50 dark:bg-gray-800">
                                {/* Module Info */}
                                <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                                  <div className="space-y-1">
                                    <input
                                      type="text"
                                      value={module.title}
                                      onChange={(e) => updateModule(module.id, 'title', e.target.value)}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                                      placeholder="Module title"
                                    />
                                    <input
                                      type="text"
                                      value={module.description}
                                      onChange={(e) => updateModule(module.id, 'description', e.target.value)}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                                      placeholder="Module description"
                                    />
                                  </div>
                                </div>

                                {/* Lessons */}
                                <div className="p-1">
                                  {module.lessons.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                                      No lessons yet
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      {module.lessons.map((lesson, lessonIndex) => (
                                        <div key={lesson.id}>
                                          {/* Drop zone before lesson */}
                                          <div
                                            className={`h-1 transition-colors ${
                                              dragOverModule === module.id && 
                                              dragOverLessonId === lesson.id && 
                                              dragOverPosition === 'before'
                                                ? 'bg-blue-500' 
                                                : 'bg-transparent'
                                            }`}
                                            onDragOver={(e) => handleLessonDragOver(e, module.id, lesson.id, 'before')}
                                            onDragLeave={handleLessonDragLeave}
                                            onDrop={(e) => handleLessonDrop(e, module.id, lesson.id, 'before')}
                                          />
                                          
                                          {/* Lesson item */}
                                          <div
                                            draggable
                                            onDragStart={(e) => handleLessonDragStart(e, module.id, lesson.id)}
                                            onDragEnd={handleLessonDragEnd}
                                            className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                              selectedLesson?.moduleId === module.id && selectedLesson?.lessonId === lesson.id
                                                ? 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-600'
                                                : draggedLesson?.moduleId === module.id && draggedLesson?.lessonId === lesson.id
                                                ? 'opacity-50 bg-gray-200 dark:bg-gray-600'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                            onClick={() => selectLesson(module.id, lesson.id)}
                                          >
                                            <div className="flex items-center space-x-2">
                                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[20px]">
                                                {getModuleLessonNumber(module.id, lesson.id)}.
                                              </span>
                                              <span className="text-gray-400 dark:text-gray-500 cursor-move mr-1">⋮⋮</span>
                                              <span className={`text-xs font-medium px-2 py-1 rounded text-white ${
                                                lesson.type === 'intro' ? 'bg-sky-600' :
                                                lesson.type === 'quiz' ? 'bg-violet-600' :
                                                'bg-emerald-600'
                                              }`}>
                                                {lesson.type === 'intro' ? 'I' : lesson.type === 'quiz' ? 'Q' : 'C'}
                                              </span>
                                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                                {lesson.title || `${lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)} ${lessonIndex + 1}`}
                                              </span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                removeLesson(module.id, lesson.id)
                                              }}
                                              className="text-red-500 hover:text-red-700 text-xs px-1"
                                            >
                                              ×
                                            </button>
                                          </div>
                                          
                                          {/* Drop zone after lesson (only for last lesson) */}
                                          {lessonIndex === module.lessons.length - 1 && (
                                            <div
                                              className={`h-1 transition-colors ${
                                                dragOverModule === module.id && 
                                                dragOverLessonId === lesson.id && 
                                                dragOverPosition === 'after'
                                                  ? 'bg-blue-500' 
                                                  : 'bg-transparent'
                                              }`}
                                              onDragOver={(e) => handleLessonDragOver(e, module.id, lesson.id, 'after')}
                                              onDragLeave={handleLessonDragLeave}
                                              onDrop={(e) => handleLessonDrop(e, module.id, lesson.id, 'after')}
                                            />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            </div>
                            
                            {/* Drop zone after module (only for last module) */}
                            {moduleIndex === modules.length - 1 && (
                              <div
                                className={`h-1 transition-colors ${
                                  dragOverTargetModule === module.id && 
                                  dragOverModulePosition === 'after'
                                    ? 'bg-blue-500' 
                                    : 'bg-transparent'
                                }`}
                                onDragOver={(e) => handleModuleDragOver(e, module.id, 'after')}
                                onDragLeave={handleModuleDragLeave}
                                onDrop={(e) => handleModuleDrop(e, module.id, 'after')}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Content Area - Lesson Editor */}
                <div className="flex-1 bg-white dark:bg-gray-900">
                  {selectedLesson && getSelectedLesson() ? (
                    <div className="h-full flex flex-col">
                      {/* Lesson Header */}
                      <div className="p-4 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              {selectedLesson ? getModuleLessonNumber(selectedLesson.moduleId, selectedLesson.lessonId) : 0}.
                            </span>
                            <span className={`text-sm font-medium px-3 py-1 rounded text-white ${
                              getSelectedLesson()?.type === 'intro' ? 'bg-sky-600' :
                              getSelectedLesson()?.type === 'quiz' ? 'bg-violet-600' :
                              'bg-emerald-600'
                            }`}>
                              {getSelectedLesson()?.type.toUpperCase()}
                            </span>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {getSelectedLesson()?.title || 'Untitled Lesson'}
                            </h3>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedLesson) {
                                  saveLesson(selectedLesson.moduleId, selectedLesson.lessonId)
                                }
                              }}
                              disabled={isSavingLesson === selectedLesson?.lessonId}
                              className="px-3 py-1 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {isSavingLesson === selectedLesson?.lessonId ? 'Saving...' : '💾 Save Lesson'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const module = getSelectedModule()
                                if (module) {
                                  addLesson(module.id, getSelectedLesson()?.type || 'intro')
                                }
                              }}
                              className="px-3 py-1 bg-amber-500 text-white rounded text-sm font-medium hover:bg-amber-600"
                            >
                              + Add Similar Lesson
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedLesson) {
                                  removeLesson(selectedLesson.moduleId, selectedLesson.lessonId)
                                  setSelectedLesson(null)
                                }
                              }}
                              className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600"
                            >
                              Delete Lesson
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Lesson Content */}
                      <div className="flex-1 p-6 overflow-y-auto">
                        {getSelectedLesson() && (
                          <div className="space-y-6">
                            {/* Lesson Title */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Lesson Title *
                              </label>
                              <input
                                type="text"
                                value={getSelectedLesson()?.title || ''}
                                onChange={(e) => {
                                  if (selectedLesson) {
                                    updateLesson(selectedLesson.moduleId, selectedLesson.lessonId, 'title', e.target.value)
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Enter lesson title"
                                required
                              />
                            </div>

                            {/* Lesson Type Specific Content */}
                            {getSelectedLesson()?.type === 'intro' && (
                              <div>
                                {/* Tab Navigation */}
                                <div className="border-b border-gray-200 dark:border-gray-600 mb-4">
                                  <nav className="-mb-px flex space-x-8">
                                    {[
                                      { id: 'edit', label: 'Edit', icon: '✏️' },
                                      { id: 'preview', label: 'Preview', icon: '👀' }
                                    ].map((tab) => (
                                      <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setIntroTab(tab.id as 'edit' | 'preview')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                          introTab === tab.id
                                            ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                        }`}
                                      >
                                        <span className="mr-2">{tab.icon}</span>
                                        {tab.label}
                                      </button>
                                    ))}
                                  </nav>
                                </div>

                                {/* Tab Content */}
                                {introTab === 'edit' && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      Introduction Content (Markdown) *
                                    </label>
                                    <textarea
                                      value={getSelectedLesson()?.contentMarkdown || ''}
                                      onChange={(e) => {
                                        if (selectedLesson) {
                                          updateLesson(selectedLesson.moduleId, selectedLesson.lessonId, 'contentMarkdown', e.target.value)
                                        }
                                      }}
                                      rows={20}
                                      maxLength={5000}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white text-sm font-mono"
                                      placeholder="Write your introduction content in Markdown format..."
                                    />
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {(getSelectedLesson()?.contentMarkdown?.length || 0)}/5000 characters
                                    </div>
                                  </div>
                                )}

                                {introTab === 'preview' && (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Markdown Preview
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const content = getSelectedLesson()?.contentMarkdown || ''
                                          if (!content.trim()) {
                                            alert('No content to preview. Please add some markdown content first.')
                                            return
                                          }
                                          
                                          const html = renderMarkdown(content)
                                          const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes')
                                          if (newWindow) {
                                            newWindow.document.write(`
                                              <!DOCTYPE html>
                                              <html lang="en">
                                              <head>
                                                <meta charset="UTF-8">
                                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                                <title>Markdown Preview</title>
                                                <script src="https://cdn.tailwindcss.com"></script>
                                                <style>
                                                  body { 
                                                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                                    min-height: 100vh;
                                                    padding: 2rem;
                                                  }
                                                  .preview-container {
                                                    background: rgba(255, 255, 255, 0.95);
                                                    backdrop-filter: blur(10px);
                                                    border-radius: 1rem;
                                                    padding: 2rem;
                                                    max-width: 4xl;
                                                    margin: 0 auto;
                                                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                                                  }
                                                  @media (prefers-color-scheme: dark) {
                                                    .preview-container {
                                                      background: rgba(31, 41, 55, 0.95);
                                                      color: #f9fafb;
                                                    }
                                                  }
                                                  pre {
                                                    line-height: 1.2 !important;
                                                    margin: 0 !important;
                                                    padding: 1rem !important;
                                                    font-size: 14px !important;
                                                  }
                                                  code {
                                                    line-height: 1.2 !important;
                                                    margin: 0 !important;
                                                    padding: 0 !important;
                                                    display: block !important;
                                                    font-size: 14px !important;
                                                  }
                                                </style>
                                              </head>
                                              <body>
                                                <div class="preview-container">
                                                  ${html}
                                                </div>
                                              </body>
                                              </html>
                                            `)
                                            newWindow.document.close()
                                          }
                                        }}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                                      >
                                        🚀 Open in New Window
                                      </button>
                                    </div>
                                    <div className="border border-gray-300 dark:border-gray-600 rounded-md p-4 bg-white dark:bg-gray-800 max-h-96 overflow-y-auto">
                                      {getSelectedLesson()?.contentMarkdown ? (
                                        <div 
                                          className="prose prose-sm max-w-none dark:prose-invert"
                                          dangerouslySetInnerHTML={{ 
                                            __html: renderMarkdown(getSelectedLesson()?.contentMarkdown || '') 
                                          }}
                                        />
                                      ) : (
                                        <div className="text-gray-500 dark:text-gray-400 italic text-center py-8">
                                          No content to preview. Switch to Edit tab to add markdown content.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {getSelectedLesson()?.type === 'quiz' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Quiz Content (Markdown) *
                                </label>
                                <textarea
                                  value={getSelectedLesson()?.contentMarkdown || ''}
                                  onChange={(e) => {
                                    if (selectedLesson) {
                                      updateLesson(selectedLesson.moduleId, selectedLesson.lessonId, 'contentMarkdown', e.target.value)
                                    }
                                  }}
                                  rows={10}
                                  maxLength={3000}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white text-sm font-mono"
                                  placeholder="Write your quiz questions in Markdown format..."
                                />
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {(getSelectedLesson()?.contentMarkdown?.length || 0)}/3000 characters
                                </div>
                              </div>
                            )}

                            {getSelectedLesson()?.type === 'challenge' && (
                              <div className="space-y-4">
                                {/* Tab Navigation */}
                                <div className="border-b border-gray-200 dark:border-gray-600">
                                  <nav className="-mb-px flex space-x-8">
                                    {[
                                      { id: 'instructions', label: 'Instructions', icon: '📝' },
                                      { id: 'initialCode', label: 'Initial Code', icon: '💻' },
                                      { id: 'solutionCode', label: 'Solution Code', icon: '✅' },
                                      { id: 'tests', label: 'Test Cases', icon: '🧪' }
                                    ].map((tab) => (
                                      <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                          activeTab === tab.id
                                            ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                        }`}
                                      >
                                        <span className="mr-2">{tab.icon}</span>
                                        {tab.label}
                                      </button>
                                    ))}
                                  </nav>
                                </div>

                                {/* Tab Content */}
                                <div className="h-[calc(100vh-400px)]">
                                  {activeTab === 'instructions' && (
                                    <div className="h-full">
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Instructions (Markdown) *
                                      </label>
                                      <textarea
                                        value={getSelectedLesson()?.contentMarkdown || ''}
                                        onChange={(e) => {
                                          if (selectedLesson) {
                                            updateLesson(selectedLesson.moduleId, selectedLesson.lessonId, 'contentMarkdown', e.target.value)
                                          }
                                        }}
                                        maxLength={2000}
                                        className="w-full h-[calc(100%-40px)] px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white text-sm font-mono resize-none"
                                        placeholder="Write the challenge instructions in Markdown format..."
                                      />
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {(getSelectedLesson()?.contentMarkdown?.length || 0)}/2000 characters
                                      </div>
                                    </div>
                                  )}

                                  {activeTab === 'initialCode' && (
                                    <div className="h-full">
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Initial Code (Solidity) *
                                      </label>
                                      <textarea
                                        value={getSelectedLesson()?.initialCode || ''}
                                        onChange={(e) => {
                                          if (selectedLesson) {
                                            updateLesson(selectedLesson.moduleId, selectedLesson.lessonId, 'initialCode', e.target.value)
                                          }
                                        }}
                                        className="w-full h-[calc(100%-40px)] px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white text-sm font-mono resize-none"
                                        placeholder="// Initial code template for students..."
                                      />
                                    </div>
                                  )}

                                  {activeTab === 'solutionCode' && (
                                    <div className="h-full">
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Solution Code (Solidity) *
                                      </label>
                                      <textarea
                                        value={getSelectedLesson()?.solutionCode || ''}
                                        onChange={(e) => {
                                          if (selectedLesson) {
                                            updateLesson(selectedLesson.moduleId, selectedLesson.lessonId, 'solutionCode', e.target.value)
                                          }
                                        }}
                                        className="w-full h-[calc(100%-40px)] px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white text-sm font-mono resize-none"
                                        placeholder="// Complete solution code..."
                                      />
                                    </div>
                                  )}

                                  {activeTab === 'tests' && (
                                    <div className="h-full">
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Test Cases (Solidity) *
                                      </label>
                                      <textarea
                                        value={getSelectedLesson()?.tests || ''}
                                        onChange={(e) => {
                                          if (selectedLesson) {
                                            updateLesson(selectedLesson.moduleId, selectedLesson.lessonId, 'tests', e.target.value)
                                          }
                                        }}
                                        className="w-full h-[calc(100%-40px)] px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white text-sm font-mono resize-none"
                                        placeholder="// Test cases for the contract..."
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-gray-400 dark:text-gray-500 mb-4">
                          {modules.length === 0 ? (
                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          ) : (
                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          {modules.length === 0 ? 'Add Your First Module' : 'Select a Lesson'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {modules.length === 0 
                            ? 'Start building your course by adding modules and lessons'
                            : 'Choose a lesson from the tree on the left to start editing'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  )
}