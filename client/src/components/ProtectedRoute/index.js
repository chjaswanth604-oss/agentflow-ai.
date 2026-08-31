import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore';

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const { isAuthenticated, initAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('agentflow_token');
      if (token && !isAuthenticated) {
        initAuth();
      } else if (!token && !isAuthenticated) {
        router.push('/login');
      }
      setIsInitializing(false);
    }
  }, [isAuthenticated, initAuth, router]);

  const hasStoredToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('agentflow_token'));

  if (isInitializing || (!isAuthenticated && hasStoredToken)) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Authenticating...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !hasStoredToken) {
    return null;
  }

  return children;
}
