import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gray-333 fixed w-full top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-yellow-500">
                DappDojo
              </h1>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link 
                  href="/admin/login" 
                  className="text-white hover:text-yellow-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Admin Login
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-800 dark:text-white mb-6">
              Write code and become a{' '}
              <span className="text-yellow-500">Professional Web3 Developer</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto">
              Learn by doing, stop tutorials, it&apos;s time to get your hands dirty!
            </p>
            
            <p className="text-lg text-gray-700 dark:text-gray-400 mb-12 max-w-3xl mx-auto">
              Find hundreds of guided exercises to create smart contracts.
            </p>

            {/* Pricing Banner */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto mb-12">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                One-time payment - 3 months access - Unlimited learning
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                Login and get premium access for $19.99
              </p>
              <Link
                href="/admin/login"
                className="inline-block bg-yellow-500 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>

        {/* Course Preview Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-12">
              Available Courses
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Solidity Fundamentals Course */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-2xl">🔧</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Solidity Fundamentals
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Learn the basics of Solidity and smart contract development
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Beginner Level
                  </span>
                  <span className="text-sm font-medium text-yellow-500">
                    Free Access
                  </span>
                </div>
              </div>

              {/* Security Patterns Course */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Security Patterns
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Master security best practices for smart contracts
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Intermediate Level
                  </span>
                  <span className="text-sm font-medium text-yellow-500">
                    Premium Access
                  </span>
                </div>
              </div>

              {/* Advanced DeFi Course */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Advanced DeFi
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Build complex DeFi protocols and yield strategies
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Advanced Level
                  </span>
                  <span className="text-sm font-medium text-yellow-500">
                    Premium Access
                  </span>
                </div>
              </div>
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
