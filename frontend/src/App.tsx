import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import CompaniesPage from './pages/CompaniesPage';
import EmployeesPage from './pages/EmployeesPage';
import ExposureFactorsPage from './pages/ExposureFactorsPage';
import ReferralsPage from './pages/ReferralsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/exposure-factors" element={<ExposureFactorsPage />} />
          <Route path="/referrals" element={<ReferralsPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
