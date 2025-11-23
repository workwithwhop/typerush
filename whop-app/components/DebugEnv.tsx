"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugEnv() {
  const [envCheck, setEnvCheck] = useState<any>(null)

  const checkEnvironment = async () => {
    try {
      const response = await fetch('/api/debug-env')
      const data = await response.json()
      setEnvCheck(data)
    } catch (error) {
      setEnvCheck({ error: 'Failed to check environment' })
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Environment Debug</CardTitle>
          <CardDescription>
            Check if your Whop environment variables are properly configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkEnvironment} className="w-full">
            Check Environment Variables
          </Button>

          {envCheck && (
            <div className="space-y-2">
              <h3 className="font-semibold">Environment Status:</h3>
              <div className="bg-gray-100 p-4 rounded-md text-sm font-mono">
                <pre>{JSON.stringify(envCheck, null, 2)}</pre>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <h4 className="font-semibold mb-2">Required Environment Variables:</h4>
            <ul className="space-y-1">
              <li>✅ <code>WHOP_API_KEY</code> - Your Whop API key</li>
              <li>✅ <code>WHOP_GAME_CONTINUE_PRODUCT_ID</code> - Plan ID (plan_l7PoADRRTXgVM)</li>
              <li>✅ <code>NEXT_PUBLIC_APP_URL</code> - Your app URL</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
