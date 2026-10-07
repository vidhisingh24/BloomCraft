import React from 'react';

/** Shown instead of the shop when the deployment is missing its Supabase settings. */
export const SetupNotice: React.FC = () => (
  <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6 text-[#3D272A]">
    <div className="max-w-lg bg-white rounded-3xl border border-[#F0E6E8] shadow-sm p-8 space-y-4">
      <div className="text-3xl">🌸</div>
      <h1 className="font-serif text-2xl font-bold">BloomCraft is almost ready</h1>
      <p className="text-sm text-[#7A5B62]">
        This deployment is not connected to its database yet. Add these environment variables (Vercel →
        Project → Settings → Environment Variables, or <code>frontend/.env.local</code> when running locally)
        and redeploy:
      </p>
      <pre className="text-xs bg-[#FAF8F5] rounded-xl p-4 overflow-x-auto">{`VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<public anon / publishable key>`}</pre>
      <p className="text-xs text-[#A4838B]">Step-by-step guide: docs/SUPABASE_SETUP.md in the repository.</p>
    </div>
  </div>
);
