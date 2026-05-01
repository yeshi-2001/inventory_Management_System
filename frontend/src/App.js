import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import useAuth from "./hooks/useAuth";

// Pages
import LoginPage          from "./pages/LoginPage";
import RegisterPage       from "./pages/RegisterPage";
import VendorRegisterPage from "./pages/VendorRegisterPage";
import Dashboard          from "./pages/Dashboard";
import Inventory          from "./pages/Inventory";
import Analytics          from "./pages/Analytics";
import Alerts             from "./pages/Alerts";
import Billing            from "./pages/Billing";
import BillingHistory     from "./pages/BillingHistory";
import VendorPortalPage   from "./pages/VendorPortalPage";
import AdminVendorsPage   from "./pages/AdminVendorsPage";
import AdminUsersPage     from "./pages/AdminUsersPage";

// Layout wrapper — only shown when authenticated
function AppLayout({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return children; // show login/register without sidebar
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        {/* Public */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/register-vendor" element={<RegisterPage />} />

        {/* Admin only */}
        <Route path="/" element={<ProtectedRoute allowedRoles={["admin"]}><Dashboard /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute allowedRoles={["admin"]}><Inventory /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><Analytics /></ProtectedRoute>} />
        <Route path="/alerts"    element={<ProtectedRoute allowedRoles={["admin"]}><Alerts /></ProtectedRoute>} />
        <Route path="/admin/vendors" element={<ProtectedRoute allowedRoles={["admin"]}><AdminVendorsPage /></ProtectedRoute>} />
        <Route path="/admin/users"   element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsersPage /></ProtectedRoute>} />

        {/* Admin + Employee */}
        <Route path="/billing"         element={<ProtectedRoute allowedRoles={["admin","employee"]}><Billing /></ProtectedRoute>} />
        <Route path="/billing/history" element={<ProtectedRoute allowedRoles={["admin","employee"]}><BillingHistory /></ProtectedRoute>} />

        {/* Vendor only */}
        <Route path="/vendor/portal" element={<ProtectedRoute allowedRoles={["vendor"]}><VendorPortalPage /></ProtectedRoute>} />

        {/* Default landing → register page */}
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
