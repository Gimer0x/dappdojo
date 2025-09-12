const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createSampleData() {
  try {
    console.log('Creating sample modules and lessons...')
    
    // Get the existing course
    const course = await prisma.course.findFirst({
      where: { title: 'Solidity Fundamentals' }
    })
    
    if (!course) {
      console.log('No course found')
      return
    }
    
    console.log('Found course:', course.title)
    
    // Create Module 1: Introduction to Solidity
    const module1 = await prisma.module.create({
      data: {
        title: 'Introduction to Solidity',
        description: 'Learn the basics of Solidity programming language',
        order: 1,
        courseId: course.id
      }
    })
    
    console.log('Created module 1:', module1.title)
    
    // Create lessons for Module 1
    const lesson1 = await prisma.lesson.create({
      data: {
        type: 'INTRO',
        title: 'What is Solidity?',
        contentMarkdown: '# What is Solidity?\n\nSolidity is a programming language for writing smart contracts on Ethereum.',
        order: 1,
        moduleId: module1.id
      }
    })
    
    const lesson2 = await prisma.lesson.create({
      data: {
        type: 'CHALLENGE',
        title: 'Your First Smart Contract',
        contentMarkdown: '# Your First Smart Contract\n\nCreate a simple Hello World contract.',
        initialCode: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract HelloWorld {\n    string public message;\n    \n    constructor() {\n        message = "Hello, World!";\n    }\n}',
        order: 2,
        moduleId: module1.id
      }
    })
    
    const lesson3 = await prisma.lesson.create({
      data: {
        type: 'QUIZ',
        title: 'Solidity Basics Quiz',
        contentMarkdown: '# Solidity Basics Quiz\n\nTest your knowledge of Solidity fundamentals.',
        order: 3,
        moduleId: module1.id
      }
    })
    
    console.log('Created lessons for module 1')
    
    // Create Module 2: Variables and Data Types
    const module2 = await prisma.module.create({
      data: {
        title: 'Variables and Data Types',
        description: 'Understanding Solidity data types and variable declarations',
        order: 2,
        courseId: course.id
      }
    })
    
    console.log('Created module 2:', module2.title)
    
    // Create lessons for Module 2
    const lesson4 = await prisma.lesson.create({
      data: {
        type: 'INTRO',
        title: 'Data Types in Solidity',
        contentMarkdown: '# Data Types in Solidity\n\nLearn about different data types available in Solidity.',
        order: 1,
        moduleId: module2.id
      }
    })
    
    const lesson5 = await prisma.lesson.create({
      data: {
        type: 'CHALLENGE',
        title: 'Working with Variables',
        contentMarkdown: '# Working with Variables\n\nPractice declaring and using different variable types.',
        initialCode: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract Variables {\n    // Add your variables here\n}',
        order: 2,
        moduleId: module2.id
      }
    })
    
    console.log('Created lessons for module 2')
    
    console.log('✅ Sample data created successfully!')
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleData()
