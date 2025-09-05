# DappDojo Setup Guide

## 🚀 Quick Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the root directory with the following content:

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

### 2. Database Setup

#### Option A: Local PostgreSQL
1. Install PostgreSQL on your system
2. Create a database named `dappdojo`
3. Update the DATABASE_URL in your `.env` file

#### Option B: Docker PostgreSQL
```bash
docker run --name dappdojo-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=dappdojo \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Operations
```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed database with admin user
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```

## 🔐 Default Admin Access

- **URL**: http://localhost:3000/admin/login
- **Email**: gimer@dappdojo.com
- **Password**: Admin123!

## 📱 Available Routes

- **Landing Page**: http://localhost:3000/
- **Admin Login**: http://localhost:3000/admin/login
- **Admin Dashboard**: http://localhost:3000/admin/dashboard
- **Password Reset**: http://localhost:3000/reset-password

## 🛠️ Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL format in `.env`
- Verify database exists and is accessible

### Prisma Issues
- Run `npm run db:generate` after schema changes
- Use `npm run db:push` for development (not migrations)
- Check Prisma Studio with `npm run db:studio`

### Build Issues
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## 📚 Next Steps

After successful setup:
1. Login to admin dashboard
2. Change default password
3. Test password recovery functionality
4. Explore the mockup dashboard interface

## 🆘 Need Help?

Check the main README.md for comprehensive documentation and project structure information.
