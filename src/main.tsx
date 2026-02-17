import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "./app/context/AuthContext.tsx";
import { ViewSwitcher } from "./app/ViewSwitcher.tsx";
import { LoginPage } from "./app/pages/LoginPage.tsx";
import { AudioAnalysisPage } from "./app/pages/AudioAnalysisPage.tsx";
import { ErrorBoundary } from "./app/components/ErrorBoundary.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ViewSwitcher />} />
          <Route path="/audio-analysis" element={<AudioAnalysisPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
  