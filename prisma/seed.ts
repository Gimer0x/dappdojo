import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminEmail = 'gimer@dappdojo.com'
  const adminPassword = 'Admin123!' // Stronger default password
  
  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingAdmin) {
    const hashedPassword = await hashPassword(adminPassword)
    
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Gimer',
        password: hashedPassword,
        role: 'ADMIN',
        isPremium: true
      }
    })
    
    console.log('✅ Admin user created:', adminUser.email)
  } else {
    // Update existing admin user's password to ensure it's properly hashed
    const hashedPassword = await hashPassword(adminPassword)
    
    await prisma.user.update({
      where: { email: adminEmail },
      data: { password: hashedPassword }
    })
    
    console.log('✅ Admin user password updated:', existingAdmin.email)
  }

  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
