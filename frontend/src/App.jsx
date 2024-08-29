import { Routes, Route, Navigate } from "react-router-dom";
import FloatingShape from "./components/FloatingShape";
import SignUp from "./pages/SignUp";
import LoginPage from "./pages/LoginPage";
import EmailVerification from "./pages/EmailVerification";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { checkAuth } from "./features/authStore/authSlice";
import Dashboard from "./pages/Dashboard";
import LoadingSpinner from "./components/LoadingSpinner";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Redirect un-authorized users to login page

const ProtectedRoutes = ({ children }) => {
  const state_obj = useSelector((state) => state.auth);

  const { isAuthenticated, user } = state_obj;

  if (!user) {
    return <Navigate to="/login" replace={true} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace={true} />;
  }

  if (!user.isVerified) {
    return <Navigate to="/verify-email" replace={true} />;
  }

  return children; //return the crrent page
};

// Redirect the authenticated users to the Home Page
const RedirectUsers = ({ children }) => {
  const state_obj = useSelector((state) => state.auth);

  const { isAuthenticated, user } = state_obj;

  if (isAuthenticated && user?.isVerified) {
    return <Navigate to="/" replace={true} />;
  }

  return children; //return the crrent page
};

function App() {
  const state_obj = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [checkAuth]);

  if (state_obj.isCheckingAuth) {
    return <LoadingSpinner />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 flex items-center justify-center relative overflow-hidden">
      <FloatingShape
        color="bg-green-500"
        size="w-64 h-64"
        top="-5%"
        left="10%"
        delay={0}
      />

      <FloatingShape
        color="bg-emerald-500"
        size="w-48 h-48"
        top="70%"
        left="80%"
        delay={5}
      />

      <FloatingShape
        color="bg-lime-500"
        size="w-32 h-32"
        top="40%"
        left="-10%"
        delay={2}
      />

      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoutes>
              <Dashboard />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/signup"
          element={
            <RedirectUsers>
              <SignUp />
            </RedirectUsers>
          }
        />
        <Route
          path="/login"
          element={
            <RedirectUsers>
              <LoginPage />
            </RedirectUsers>
          }
        />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route
          path="/forgot-password"
          element={
            <RedirectUsers>
              <ForgotPassword />
            </RedirectUsers>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <RedirectUsers>
              <ResetPassword />
            </RedirectUsers>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
