import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "member" | "officer" | "admin";
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/40">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#F2DF74] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const roleHierarchy = { member: 1, officer: 2, admin: 3 };
    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};