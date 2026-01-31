import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    // Clear any stored session data and redirect to login
    localStorage.removeItem("token");
    // Add any other cleanup here if needed
    return <Navigate to="/" replace />;
  }

  return children;
}
