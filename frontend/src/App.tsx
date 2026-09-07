import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingState } from '@/components/QueryState'
import { LoginPage } from '@/pages/auth/LoginPage'

// Code-split everything behind the login gate — an unauthenticated visitor
// (or one who's just signing in) never needs the dashboard's chart
// library, the calendar, or any of the rest of it in their initial bundle.
// The landing page is split the same way in the other direction: an
// authenticated user never re-fetches its bundle after their first visit.
const HomeRoute = lazy(() =>
  import('@/pages/marketing/HomeRoute').then((m) => ({ default: m.HomeRoute })),
)
const RegisterPage = lazy(() =>
  import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const ContractsListPage = lazy(() =>
  import('@/pages/contracts/ContractsListPage').then((m) => ({ default: m.ContractsListPage })),
)
const ContractDetailPage = lazy(() =>
  import('@/pages/contracts/ContractDetailPage').then((m) => ({
    default: m.ContractDetailPage,
  })),
)
const ContractPreviewPage = lazy(() =>
  import('@/pages/contracts/ContractPreviewPage').then((m) => ({
    default: m.ContractPreviewPage,
  })),
)
const ChatPage = lazy(() => import('@/pages/ChatPage').then((m) => ({ default: m.ChatPage })))
const ReviewQueuePage = lazy(() =>
  import('@/pages/ReviewQueuePage').then((m) => ({ default: m.ReviewQueuePage })),
)
const CalendarPage = lazy(() =>
  import('@/pages/CalendarPage').then((m) => ({ default: m.CalendarPage })),
)
const PrecedentSearchPage = lazy(() =>
  import('@/pages/PrecedentSearchPage').then((m) => ({ default: m.PrecedentSearchPage })),
)
const LLMUsagePage = lazy(() =>
  import('@/pages/admin/LLMUsagePage').then((m) => ({ default: m.LLMUsagePage })),
)
const AuditLogPage = lazy(() =>
  import('@/pages/admin/AuditLogPage').then((m) => ({ default: m.AuditLogPage })),
)

function RouteFallback() {
  return <LoadingState label="Loading..." />
}

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/contracts" element={<ContractsListPage />} />
            <Route path="/contracts/:contractId" element={<ContractDetailPage />} />
            <Route path="/review-queue" element={<ReviewQueuePage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/precedents" element={<PrecedentSearchPage />} />
            <Route path="/admin/llm-usage" element={<LLMUsagePage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
          </Route>
          {/* Deliberately outside AppShell — no sidebar/header chrome, so
              the document (or, for chat, the session list + thread)
              gets the entire viewport. */}
          <Route path="/contracts/:contractId/preview" element={<ContractPreviewPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:sessionId" element={<ChatPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
