import TestCheckout from '@/components/TestCheckout'

// Force dynamic rendering to prevent build-time issues with Whop SDK
export const dynamic = 'force-dynamic';

export default function TestCheckoutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <TestCheckout />
    </div>
  )
}
