'use client';

import { DebugEnvVars } from '@/components/DebugEnvVars';

export default function TestEnvPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Environment Variables Test Page</h1>
        <DebugEnvVars />
        
        <div className="mt-8 p-4 bg-white rounded-lg max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Start the development server with <code className="bg-gray-200 px-1 rounded">npm run dev</code></li>
            <li>Navigate to <code className="bg-gray-200 px-1 rounded">/test-env</code></li>
            <li>Check if all environment variables show as "Present"</li>
            <li>Click the test buttons to verify API calls work</li>
            <li>Check browser console for detailed logs</li>
            <li>If variables show as "Missing", restart the dev server</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">
            <p className="text-sm"><strong>Note:</strong> Environment variables with <code>NEXT_PUBLIC_</code> prefix should be accessible in the browser. If they're not showing, check your .env.local file and restart the server.</p>
          </div>
        </div>
      </div>
    </div>
  );
}