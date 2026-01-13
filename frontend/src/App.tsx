import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import Dashboard from './components/Dashboard';
import Header from './components/Header';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL || '';

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login/register pages
  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  
  if (!isAuthenticated) {
    if (path === '/register') {
      return <RegisterPage />;
    }
    if (path === '/reset-password' && searchParams.has('token')) {
      return <ResetPasswordPage />;
    }
    return <LoginPage />;
  }

  // Show authenticated dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Dashboard apiUrl={apiUrl} />
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;