'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '@/components/ErrorBoundary';
import SocketProvider from '@/components/SocketProvider';
import LoginPage from '@/components/LoginPage';
import { getLoggedInUser } from '@/lib/userIdentity';
import { UserInfo } from '@/types';

const Board = dynamic(() => import('@/components/Board'), { ssr: false });

export default function Home() {
  const [loggedInUser, setLoggedInUser] = useState<UserInfo | null>(null);
  const [checked, setChecked] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    setLoggedInUser(getLoggedInUser());
    setChecked(true);
  }, []);

  // Don't flash anything until we've checked localStorage
  if (!checked) return null;

  // Not logged in → show login page
  if (!loggedInUser) {
    return (
      <ErrorBoundary>
        <LoginPage onLogin={(user) => setLoggedInUser(user)} />
      </ErrorBoundary>
    );
  }

  // Logged in → show board
  return (
    <ErrorBoundary>
      <SocketProvider user={loggedInUser} onLogout={() => setLoggedInUser(null)}>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1c28',
              color: '#fff',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.85rem',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
              duration: 5000,
            },
          }}
        />
        <main>
          <Board />
        </main>
      </SocketProvider>
    </ErrorBoundary>
  );
}
