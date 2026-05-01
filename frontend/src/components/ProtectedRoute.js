import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { Spinner } from "./UI";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;

  if (!isAuthenticated) return <Navigate to="/register" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow p-8 text-center max-w-sm w-full">
          <p className="text-4xl mb-4">🚫</p>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Access Denied</h2>
          <p className="text-sm text-gray-500 mb-4">
            Your account (<strong>{user.name}</strong> · <span className="capitalize">{user.role}</span>) does not have permission to view this page.
          </p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => window.history.back()} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Go back</button>
            <button onClick={logout} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Logout</button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
