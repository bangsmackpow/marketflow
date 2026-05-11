import { Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "./lib/auth-client";
import { useDesignSystem } from "./stores/design-store";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import WelcomeWizard from "./pages/onboarding/WelcomeWizard";
import ProjectBoard from "./pages/ProjectBoard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AppLayout from "./components/layout/AppLayout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: session } = await authClient.getSession();
      return session;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--clr-primary,#0070c4)] border-t-transparent" />
      </div>
    );
  }

  if (!data) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function DesignSystemApplier({ children }: { children: React.ReactNode }) {
  useDesignSystem();
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <DesignSystemApplier>
              <WelcomeWizard />
            </DesignSystemApplier>
          </ProtectedRoute>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DesignSystemApplier>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/board" element={<ProjectBoard />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
              </AppLayout>
            </DesignSystemApplier>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
