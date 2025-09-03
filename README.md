# DappDojo - Web3 Learning Platform

A comprehensive Web3 learning platform designed to teach Solidity and smart contract development through hands-on exercises and interactive coding challenges.

## 🚀 Features

### Admin Application
- **Authentication System**: Secure login for administrators (gimer@dappdojo.com)
- **Password Management**: Change password and password recovery via email
- **Dashboard**: Mockup interface with navigation hints for future course management features
- **User Management**: Admin user creation and management

### Student Application (Coming Soon)
- **Course Catalog**: Browse available Web3 courses
- **Interactive Learning**: Hands-on coding exercises with Solidity
- **Progress Tracking**: Monitor learning progress and completion rates
- **AI Assistant**: AI-powered coding help and guidance
- **Premium Access**: Tiered access system for different course levels

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS with custom DappDojo color scheme
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication system
- **Email**: Nodemailer for password recovery
- **Password Security**: bcryptjs for password hashing

## 🎨 Design System

The platform uses a carefully crafted color scheme:
- **Yellow Base**: #F2B91D (Headings, Buttons, Links)
- **Body Text**: #4D4D4D (Main content)
- **Navigation**: #333333 (Dark Gray for fixed elements)
- **Responsive Design**: Desktop-first with mobile considerations

## 📋 Prerequisites

Before running this project, ensure you have:
- Node.js 18+ installed
- PostgreSQL database running
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
cd dappdojo
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/dappdojo"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Email Configuration (for password recovery)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# App Configuration
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed database with admin user
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🔐 Default Admin Credentials

- **Email**: gimer@dappdojo.com
- **Password**: admin

⚠️ **Important**: Change the default password after first login!

## 📚 Database Schema

The platform uses a comprehensive database structure:

- **Users**: Admin and student accounts with role-based access
- **Courses**: Learning paths with metadata and access controls
- **Modules**: Course sections containing multiple lessons
- **Lessons**: Individual learning units (intro, challenge, quiz)
- **Progress**: Student completion tracking and quiz results
- **Password Reset**: Secure token-based password recovery

## 🛣️ Project Structure

```
dappdojo/
├── src/
│   ├── app/
│   │   ├── admin/           # Admin application routes
│   │   │   ├── login/       # Admin authentication
│   │   │   └── dashboard/   # Admin dashboard
│   │   ├── api/             # API endpoints
│   │   │   └── auth/        # Authentication APIs
│   │   ├── reset-password/  # Password reset page
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Landing page
│   └── lib/                 # Utility libraries
│       ├── auth.ts          # Authentication utilities
│       ├── email.ts         # Email service
│       └── prisma.ts        # Database client
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Database seeding
└── package.json
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push database schema
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio

## 🚧 Current Status

### ✅ Completed
- [x] Project setup and structure
- [x] Database schema design
- [x] Admin authentication system
- [x] Password change functionality
- [x] Password recovery system
- [x] Landing page with DappDojo branding
- [x] Admin dashboard mockup
- [x] Responsive design with custom color scheme

### 🚧 In Progress
- [ ] Course creation interface
- [ ] Module and lesson management
- [ ] Student application
- [ ] Interactive code editor
- [ ] AI assistant integration

### 📋 Planned Features
- [ ] Course management system
- [ ] Student enrollment and progress tracking
- [ ] Interactive coding exercises
- [ ] Quiz system with scoring
- [ ] AI-powered learning assistance
- [ ] Payment integration for premium access

## 🤝 Contributing

This is the initial implementation of the DappDojo platform. The project is structured to be easily extensible for future features.

## 📄 License

This project is proprietary software for the DappDojo Web3 Learning Platform.

## 🆘 Support

For technical support or questions about the platform, please contact the development team.

---

**DappDojo** - Write code and become a Professional Web3 Developer! 🚀
