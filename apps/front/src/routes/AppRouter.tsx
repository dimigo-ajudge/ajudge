import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";

const LoginPage = lazy(() => import("../pages/LoginPage"));
const AuthCallbackPage = lazy(() => import("../pages/AuthCallbackPage"));
const LoanReturnPage = lazy(() => import("../pages/LoanReturn"));
const HomePage = lazy(() => import("../pages/HomePage"));
const MembersPage = lazy(() => import("../pages/MembersPage"));
const ProjectsPage = lazy(() => import("../pages/ProjectsPage"));
const UIKitPage = lazy(() => import("../pages/UIKitPage"));
const BookPage = lazy(() => import("../pages/BookPage"));
const BookManagePage = lazy(() => import("../pages/BookManagePage"));

const Loading = styled.div`
  flex: 1;
  display: grid;
  min-height: 240px;
  place-items: center;
  color: var(--text);
`;

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function AppRouter() {
  return (
    <Suspense fallback={<Loading>Loading...</Loading>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/callback" element={<AuthCallbackPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/loanreturn" element={<LoanReturnPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/book/manage" element={<BookManagePage />} />
          {import.meta.env.DEV && <Route path="/uikit" element={<UIKitPage />} />}
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRouter;
