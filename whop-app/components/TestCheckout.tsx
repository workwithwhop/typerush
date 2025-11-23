"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createGameContinuePayment } from '@/lib/whop-sdk'

export default function TestCheckout() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const testCheckout = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Testing Whop in-app purchase
      
      const inAppPurchaseSession = await createGameContinuePayment({
        userId: 'test_user_' + Date.now(),
        gameSessionId: 'test_session_' + Date.now()
      })

      // In-app purchase session created
      setSuccess('In-app purchase session created successfully! This would open the payment modal.')
      
      // Note: In a real app, you would use iframeSdk.inAppPurchase(inAppPurchaseSession) here
      // For testing, we just show the success message
      
    } catch (error) {
      // In-app purchase test failed
      setError(`In-app purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test Whop In-App Purchase</CardTitle>
          <CardDescription>
            Test the $2 game continue in-app purchase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p><strong>Type:</strong> In-App Purchase</p>
            <p><strong>Amount:</strong> $2.00</p>
            <p><strong>Purpose:</strong> Game Continue</p>
          </div>

          <Button 
            onClick={testCheckout}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating In-App Purchase...' : 'Test $2 In-App Purchase'}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p>This will create an in-app purchase session.</p>
            <p>In the actual game, this would open the payment modal.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
