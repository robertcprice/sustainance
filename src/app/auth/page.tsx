'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(data.hasCompany ? '/dashboard' : '/onboarding');
      } else {
        setError('Sign-in failed. Please try again.');
      }
    } catch {
      setError('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      const buttonDiv = document.getElementById('google-signin-button');
      if (buttonDiv) {
        window.google?.accounts.id.renderButton(buttonDiv, {
          theme: 'outline',
          size: 'large',
          width: 380,
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [handleCredentialResponse]);

  async function handleDemoMode() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo: true }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(data.hasCompany ? '/dashboard' : '/onboarding');
      } else {
        setError('Demo login failed.');
      }
    } catch {
      setError('Demo login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="mx-auto mb-6">
            <img src="/logo.svg" alt="Sustainance" className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Sustainance</h1>
          <p className="text-slate-500">
            Green Skills Gap Intelligence for the modern workforce
          </p>
        </div>

        <div className="panel rounded-2xl shadow-sm p-8 space-y-5">
          {GOOGLE_CLIENT_ID && (
            <>
              <div className="flex justify-center">
                <div id="google-signin-button" />
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-400">or</span>
                </div>
              </div>
            </>
          )}

          <button
            onClick={handleDemoMode}
            disabled={loading}
            className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : GOOGLE_CLIENT_ID ? 'Continue as Demo User' : 'Get Started'}
          </button>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Turn workforce sustainability gaps into dollar amounts, risk scores, and actionable business cases.
        </p>
      </div>
    </div>
  );
}
