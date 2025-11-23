"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  subscribeToAllTableChanges, 
  subscribeToUserChanges,
  subscribeToSpendingStatsChanges,
  subscribeToGameScoresChanges,
  subscribeToUserPaymentChanges,
  subscribeToUserPurchasesChanges,
  subscribeToTopSpenderChanges,
  unsubscribeFromChannel,
  createOrUpdateUser,
  recordPayment,
  saveGameScore,
  updateUserLives
} from '@/lib/database-optimized'
import { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeEvent {
  id: string
  timestamp: string
  table: string
  event: string
  data: any
}

export default function RealtimeMonitor() {
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [channels, setChannels] = useState<RealtimeChannel[]>([])
  const [testUserId] = useState('test_user_' + Date.now())

  const addEvent = (table: string, eventType: string, data: any) => {
    const newEvent: RealtimeEvent = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      table,
      event: eventType,
      data: data
    }
    setEvents(prev => [newEvent, ...prev.slice(0, 49)]) // Keep last 50 events
  }

  const startMonitoring = () => {
    if (isMonitoring) return

    // Silent logging('🚀 Starting real-time monitoring...')
    
    // Subscribe to all table changes
    const allTablesChannel = subscribeToAllTableChanges((tableName, eventType, payload) => {
      addEvent(tableName, eventType, payload)
    })

    // Subscribe to specific user changes
    const userChannel = subscribeToUserChanges(testUserId, (user) => {
      addEvent('users', 'USER_UPDATE', user)
    })

    // Subscribe to spending stats changes
    const spendingChannel = subscribeToSpendingStatsChanges(testUserId, (stats) => {
      addEvent('users', 'SPENDING_UPDATE', stats)
    })

    // Subscribe to game scores changes
    const scoresChannel = subscribeToGameScoresChanges((leaderboard) => {
      addEvent('users', 'SCORES_UPDATE', leaderboard)
    })

    // Subscribe to payment changes
    const paymentChannel = subscribeToUserPaymentChanges(testUserId, (paymentStats) => {
      addEvent('users', 'PAYMENT_UPDATE', paymentStats)
    })

    // Subscribe to top spender changes
    const topSpenderChannel = subscribeToTopSpenderChanges((topSpender) => {
      addEvent('users', 'TOP_SPENDER_UPDATE', topSpender)
    })

    setChannels([
      allTablesChannel,
      userChannel,
      spendingChannel,
      scoresChannel,
      paymentChannel,
      topSpenderChannel
    ])
    setIsMonitoring(true)
  }

  const stopMonitoring = () => {
    // Silent logging('🛑 Stopping real-time monitoring...')
    channels.forEach(channel => unsubscribeFromChannel(channel))
    setChannels([])
    setIsMonitoring(false)
  }

  const testCreateUser = async () => {
    try {
      // Silent logging('🧪 Testing CREATE user...')
      const result = await createOrUpdateUser({
        id: testUserId,
        username: testUserId,
        name: 'Test User'
      })
      // Silent logging('✅ User created:', result)
    } catch (error) {
      // Silent error handling('❌ Error creating user:', error)
    }
  }

  const testUpdateUser = async () => {
    try {
      // Silent logging('🧪 Testing UPDATE user...')
      const result = await updateUserLives(testUserId, 5)
      // Silent logging('✅ User updated:', result)
    } catch (error) {
      // Silent error handling('❌ Error updating user:', error)
    }
  }

  const testRecordPayment = async () => {
    try {
      // Silent logging('🧪 Testing payment recording...')
      const result = await recordPayment({
        user_id: testUserId,
        amount: 2.00
      })
      // Silent logging('✅ Payment recorded:', result)
    } catch (error) {
      // Silent error handling('❌ Error recording payment:', error)
    }
  }

  const testSaveScore = async () => {
    try {
      // Silent logging('🧪 Testing score saving...')
      const result = await saveGameScore({
        user_id: testUserId,
        score: Math.floor(Math.random() * 1000),
        combo: Math.floor(Math.random() * 10)
      })
      // Silent logging('✅ Score saved:', result)
    } catch (error) {
      // Silent error handling('❌ Error saving score:', error)
    }
  }

  const clearEvents = () => {
    setEvents([])
  }

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      channels.forEach(channel => unsubscribeFromChannel(channel))
    }
  }, [channels])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>🔄 Real-time Database Monitor</CardTitle>
          <CardDescription>
            Monitor all CRUD operations (Create, Read, Update, Delete) in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={startMonitoring} 
              disabled={isMonitoring}
              className="bg-green-600 hover:bg-green-700"
            >
              {isMonitoring ? '🟢 Monitoring' : '▶️ Start Monitoring'}
            </Button>
            <Button 
              onClick={stopMonitoring} 
              disabled={!isMonitoring}
              variant="destructive"
            >
              🛑 Stop Monitoring
            </Button>
            <Button onClick={clearEvents} variant="outline">
              🗑️ Clear Events
            </Button>
          </div>

          {/* Test Operations */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">🧪 Test CRUD Operations</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={testCreateUser} variant="outline">
                ➕ CREATE User
              </Button>
              <Button onClick={testUpdateUser} variant="outline">
                ✏️ UPDATE User
              </Button>
              <Button onClick={testRecordPayment} variant="outline">
                💳 Record Payment
              </Button>
              <Button onClick={testSaveScore} variant="outline">
                🏆 Save Score
              </Button>
            </div>
          </div>

          {/* Events Log */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">
              📊 Real-time Events ({events.length})
            </h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
              {events.length === 0 ? (
                <div className="text-gray-500">No events yet. Start monitoring to see real-time changes...</div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="mb-2 border-b border-gray-700 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400">[{event.timestamp}]</span>
                      <span className="text-yellow-400 font-bold">{event.event}</span>
                      <span className="text-purple-400">{event.table}</span>
                    </div>
                    <div className="text-gray-300 mt-1">
                      {JSON.stringify(event.data, null, 2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Status */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">📈 Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-semibold text-blue-800">Users Table</div>
                <div className="text-blue-600">✅ Monitored</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="font-semibold text-green-800">Payments Table</div>
                <div className="text-green-600">✅ Monitored</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="font-semibold text-purple-800">User Purchases</div>
                <div className="text-purple-600">✅ Monitored</div>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <div className="font-semibold text-orange-800">Real-time</div>
                <div className="text-orange-600">
                  {isMonitoring ? '🟢 Active' : '🔴 Inactive'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
