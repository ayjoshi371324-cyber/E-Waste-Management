import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from './theme';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { FindCentersPage } from './pages/FindCentersPage';
import { AIClassifyPage } from './pages/AIClassifyPage';
import { CatalogGuidePage } from './pages/CatalogGuidePage';
import { SubmitEvidencePage } from './pages/SubmitEvidencePage';
import { RewardsPage } from './pages/RewardsPage';
import { AdminQueuePage } from './pages/AdminQueuePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="about" element={<Navigate to="/" replace />} />
              <Route path="services" element={<Navigate to="/" replace />} />
              <Route path="centers" element={<FindCentersPage />} />
              <Route path="ai-classify" element={<AIClassifyPage />} />
              <Route path="guide" element={<CatalogGuidePage />} />
              <Route path="submit" element={<SubmitEvidencePage />} />
              <Route path="rewards" element={<RewardsPage />} />
              <Route path="admin" element={<AdminQueuePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};
export default App;
