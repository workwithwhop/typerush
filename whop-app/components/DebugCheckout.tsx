"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useIframeSdk } from '@whop/react'

export default function DebugCheckout() {
  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const iframeSdk = useIframeSdk()

  const testApiRoute = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/test-route')
      const data = await response.json()
      setResults((prev: any) => ({ ...prev, apiRoute: data }))
    } catch (error) {
      setResults((prev: any) => ({ ...prev, apiRoute: { error: error instanceof Error ? error.message : String(error) } }))
    }
    setIsLoading(false)
  }

  const testCreateCheckout = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test_user_' + Date.now(),
          gameSessionId: 'test_session_' + Date.now()
        })
      })
      
      const data = await response.json()
      setResults((prev: any) => ({ ...prev, createCheckout: { status: response.status, data } }))
    } catch (error) {
      setResults((prev: any) => ({ ...prev, createCheckout: { error: error instanceof Error ? error.message : String(error) } }))
    }
    setIsLoading(false)
  }

  const testWhopSdk = async () => {
    setIsLoading(true)
    try {
      // Import the function dynamically to avoid SSR issues
      const { createGameContinuePayment } = await import('@/lib/whop-sdk')
      
      // Step 1: Create charge
      const checkoutSession = await createGameContinuePayment({
        userId: 'test_user_' + Date.now(),
        gameSessionId: 'test_session_' + Date.now()
      })
      
      // Step 2: Open checkout page
      const result = await iframeSdk.inAppPurchase(checkoutSession)
      
      setResults((prev: any) => ({ ...prev, whopSdk: { success: true, result } }))
    } catch (error) {
      setResults((prev: any) => ({ ...prev, whopSdk: { error: error instanceof Error ? error.message : String(error) } }))
    }
    setIsLoading(false)
  }

  const clearResults = () => {
    setResults(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug Checkout Flow</CardTitle>
          <CardDescription>
            Test each step of the checkout process to identify issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={testApiRoute} disabled={isLoading}>
              Test API Route
            </Button>
            <Button onClick={testCreateCheckout} disabled={isLoading}>
              Test Create Charge
            </Button>
            <Button onClick={testWhopSdk} disabled={isLoading}>
              Test iframe SDK
            </Button>
            <Button onClick={clearResults} variant="outline">
              Clear Results
            </Button>
          </div>

          {results && (
            <div className="space-y-4">
              <h3 className="font-semibold">Test Results:</h3>
              
              {results.apiRoute && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-semibold text-blue-800">API Route Test:</h4>
                  <pre className="text-sm text-blue-700 mt-2 overflow-auto">
                    {JSON.stringify(results.apiRoute, null, 2)}
                  </pre>
                </div>
              )}

              {results.createCheckout && (
                <div className="bg-green-50 p-4 rounded-md">
                  <h4 className="font-semibold text-green-800">Create Checkout Test:</h4>
                  <pre className="text-sm text-green-700 mt-2 overflow-auto">
                    {JSON.stringify(results.createCheckout, null, 2)}
                  </pre>
                </div>
              )}

              {results.whopSdk && (
                <div className="bg-purple-50 p-4 rounded-md">
                  <h4 className="font-semibold text-purple-800">Whop SDK Test:</h4>
                  <pre className="text-sm text-purple-700 mt-2 overflow-auto">
                    {JSON.stringify(results.whopSdk, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="text-sm text-gray-600">
            <h4 className="font-semibold mb-2">Test Steps:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>Test API Route:</strong> Check if basic API routes work</li>
              <li><strong>Test Create Charge:</strong> Test the server-side charge creation (same as your previous project)</li>
              <li><strong>Test iframe SDK:</strong> Test the complete two-step payment flow</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
