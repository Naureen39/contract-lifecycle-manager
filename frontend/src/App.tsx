import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ContractsListPage } from '@/pages/contracts/ContractsListPage'
import { ContractDetailPage } from '@/pages/contracts/ContractDetailPage'
import { ReviewQueuePage } from '@/pages/ReviewQueuePage'
import { CalendarPage } from '@/pages/CalendarPage'
import { PrecedentSearchPage } from '@/pages/PrecedentSearchPage'
import { LLMUsagePage } from '@/pages/admin/LLMUsagePage'
import { AuditLogPage } from '@/pages/admin/AuditLogPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/contracts" element={<ContractsListPage />} />
          <Route path="/contracts/:contractId" element={<ContractDetailPage />} />
          <Route path="/review-queue" element={<ReviewQueuePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/precedents" element={<PrecedentSearchPage />} />
          <Route path="/admin/llm-usage" element={<LLMUsagePage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
