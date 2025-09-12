'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'

export default function DebugStripePage() {
  const { data: session, status } = useSession()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkStripeConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/stripe-config')
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      setDebugInfo({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testCheckoutSession = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: 'price_test',
          plan: 'MONTHLY',
        }),
      })
      
      const data = await response.json()
      setDebugInfo({ checkoutTest: data })
    } catch (error) {
      setDebugInfo({ checkoutError: error.message })
    } finally {
      setLoading(false)
    }
  }

  const verifyPriceId = async (priceId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/verify-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })
      
      const data = await response.json()
      setDebugInfo({ priceVerification: data })
    } catch (error) {
      setDebugInfo({ priceError: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Stripe Debug Information
        </h1>

        {/* Session Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {status}</p>
            <p><strong>User:</strong> {session?.user?.email || 'Not logged in'}</p>
            <p><strong>Name:</strong> {session?.user?.name || 'N/A'}</p>
          </div>
        </div>

        {/* Debug Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Actions</h2>
          <div className="space-x-4 mb-4">
            <button
              onClick={checkStripeConfig}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Stripe Config'}
            </button>
            <button
              onClick={testCheckoutSession}
              disabled={loading || !session}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Checkout Session'}
            </button>
          </div>
          
          <div className="space-x-4">
            <button
              onClick={() => verifyPriceId('price_1S6ffrCHMIPAdgAoEfxfri2x')}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Monthly Price ID'}
            </button>
            <button
              onClick={() => verifyPriceId(process.env.NEXT_PUBLIC_YEARLY_PRICE_ID || 'price_yearly_test')}
              disabled={loading}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Yearly Price ID'}
            </button>
          </div>
        </div>

        {/* Debug Results */}
        {debugInfo && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Results</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {/* Quick Fixes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">Quick Fixes</h2>
          <div className="space-y-2 text-yellow-700">
            <p>1. <strong>Not logged in?</strong> Go to <a href="/auth/signin" className="underline">Sign In</a></p>
            <p>2. <strong>Missing Stripe keys?</strong> Add them to your .env file</p>
            <p>3. <strong>Invalid Price IDs?</strong> Create products in Stripe Dashboard (Test mode)</p>
            <p>4. <strong>Server not running?</strong> Run <code className="bg-yellow-100 px-1 rounded">npm run dev</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}
