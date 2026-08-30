import '../styles/globals.css';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export default function App({ Component, pageProps }) {
  const { initAuth, fetchProfile, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, fetchProfile]);

  return <Component {...pageProps} />;
}
