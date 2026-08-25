import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { LoginPage } from './auth/login-page';
import { RequireAdmin } from './auth/require-admin';
import { LoadingState } from './components/feedback';
import { AppShell } from './layout/app-shell';

const DashboardPage = lazy(() => import('./pages/dashboard-page').then((module) => ({ default: module.DashboardPage })));
const DivisionTemplateFormPage = lazy(() => import('./pages/division-template-form-page').then((module) => ({ default: module.DivisionTemplateFormPage })));
const DivisionTemplatesPage = lazy(() => import('./pages/division-templates-page').then((module) => ({ default: module.DivisionTemplatesPage })));
const EquipmentPage = lazy(() => import('./pages/equipment-page').then((module) => ({ default: module.EquipmentPage })));
const ExerciseFormPage = lazy(() => import('./pages/exercise-form-page').then((module) => ({ default: module.ExerciseFormPage })));
const ExercisesPage = lazy(() => import('./pages/exercises-page').then((module) => ({ default: module.ExercisesPage })));
const UsersPage = lazy(() => import('./pages/users-page').then((module) => ({ default: module.UsersPage })));

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAdmin />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Suspense fallback={<LoadingState />}><DashboardPage /></Suspense>} />
          <Route path="/usuarios" element={<Suspense fallback={<LoadingState />}><UsersPage /></Suspense>} />
          <Route path="/exercicios" element={<Suspense fallback={<LoadingState />}><ExercisesPage /></Suspense>} />
          <Route path="/exercicios/novo" element={<Suspense fallback={<LoadingState />}><ExerciseFormPage /></Suspense>} />
          <Route path="/exercicios/:documentId/editar" element={<Suspense fallback={<LoadingState />}><ExerciseFormPage /></Suspense>} />
          <Route path="/equipamentos" element={<Suspense fallback={<LoadingState />}><EquipmentPage /></Suspense>} />
          <Route path="/divisoes-prontas" element={<Suspense fallback={<LoadingState />}><DivisionTemplatesPage /></Suspense>} />
          <Route path="/divisoes-prontas/nova" element={<Suspense fallback={<LoadingState />}><DivisionTemplateFormPage /></Suspense>} />
          <Route path="/divisoes-prontas/:templateId/editar" element={<Suspense fallback={<LoadingState />}><DivisionTemplateFormPage /></Suspense>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
