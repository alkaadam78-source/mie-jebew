import { useState, useEffect, useCallback } from 'react';

export function useRouter() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    if (window.location.pathname !== to) {
      window.history.pushState({}, '', to);
      setCurrentPath(to);
      window.scrollTo(0, 0);
    }
  }, []);

  const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const isAdminDomain = hostname.startsWith('admin.') || hostname.startsWith('cms.');

  return {
    path: currentPath,
    navigate,
    isAdminRoute: currentPath.startsWith('/admin') || isAdminDomain,
  };
}
