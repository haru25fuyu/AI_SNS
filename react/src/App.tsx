// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

//import MainLayout from "./components/layout/MainLayout";
import { UserProvider } from "./context/UserContext";

import AuthPage from "./pages/AuthPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import DashboardPage from "./pages/DashboardPage";
//import OnboardingPage from "./pages/OnboardingPage";
import TermsPage from "./pages/TermsPage";

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          {/* 2. 最初に表示されるのはここ！ */}
          <Route path="/terms" element={<TermsPage />} />

          {/* 3. 規約に同意した後に飛んでくる場所 */}
          <Route path="/auth" element={<AuthPage />} />

          <Route path="/setup" element={<ProfileSetupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* 4. どこにも当てはまらない、または最初に来た人を /terms へ誘導 */}
          <Route path="*" element={<Navigate to="/terms" replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
