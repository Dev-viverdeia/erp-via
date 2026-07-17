import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useSeedCompanyData } from "@/hooks/useSeedCompanyData";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  useSeedCompanyData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
