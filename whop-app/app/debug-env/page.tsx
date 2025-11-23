import DebugEnv from '@/components/DebugEnv'

// Force dynamic rendering to prevent build-time issues
export const dynamic = 'force-dynamic';

export default function DebugEnvPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <DebugEnv />
    </div>
  )
}
