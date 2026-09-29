import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import ScrollRestoration from '@/lib/ScrollRestoration'
import { pagesConfig } from './pages.config'
import { createBrowserRouter, RouterProvider, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AccountSuspendedScreen from '@/components/AccountSuspendedScreen';
import Join from './pages/Join';
import Auth from './pages/Auth';
import Terms from './pages/Terms';
import AdminUserManagement from './pages/AdminUserManagement';
import HowItWorks from './pages/HowItWorks';
import Privacy from './pages/Privacy';
import CommunityGuidelines from './pages/CommunityGuidelines';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'account_suspended') {
      return <AccountSuspendedScreen banned={authError.banned} />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <NavigationTracker />
      <ScrollRestoration />
      <Routes>
        <Route path="/" element={<MainPage />} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route key={path} path={`/${path}`} element={<Page />} />
        ))}
        <Route path="/join" element={<Join />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/adminusermanagement" element={<AdminUserManagement />} />
        <Route path="/howitworks" element={<HowItWorks />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/communityguidelines" element={<CommunityGuidelines />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </LayoutWrapper>
  );
};


// Data router (single catch-all route) — required for the useBlocker-based
// unsaved-changes protection; the inner <Routes> still handle page matching.
const router = createBrowserRouter([
  { path: "*", element: <AuthenticatedApp /> }
]);

function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <RouterProvider router={router} />
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App