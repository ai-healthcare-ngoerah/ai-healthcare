import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardAnalysis from './pages/DashboardAnalysis';
import DocumentChecking from './pages/DocumentChecking';
import DocumentCheckingHistory from './pages/DocumentCheckingHistory';
import MedicalScribe from './pages/MedicalScribe';
import ScribeList from './components/scribe/ScribeList';
import ScribeCustomization from './pages/ScribeCustomization';
import AIKnowledge from './pages/AIKnowledge';
import RadiologyASR from './pages/RadiologyASR';
import KnowledgeBase from './pages/KnowledgeBase';
import AddKnowledge from './pages/AddKnowledge';
import ClaimVerification from './pages/ClaimVerification';
import Quota from './pages/Quota';
import Login from './pages/Login';
import Register from './pages/Register';
import Guide from './pages/Guide';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastContainer } from './components/common/ToastContainer';
import { ConfirmDialogModal } from './components/common/ConfirmDialogModal';
import ErrorBoundary from './components/common/ErrorBoundary';

import Landing from './pages/Landing';
import ArticleDetail from './pages/ArticleDetail';
import ArticlesList from './pages/ArticlesList';
import Options from './pages/Options';
import WhatsappReminder from './pages/WhatsappReminder';
import WhatsappSummarization from './pages/WhatsappSummarization';
import PatientReservation from './pages/PatientReservation';
import ControlSchedule from './pages/ControlSchedule';
import ReservationForm from './pages/ReservationForm';
import PatientPortal from './pages/PatientPortal';
import SuperAdmin from './pages/SuperAdmin';
import RawatJalan from './pages/RawatJalan';
import RawatInap from './pages/RawatInap';
import JadwalDokter from './pages/JadwalDokter';
import DaftarRawatJalan from './pages/DaftarRawatJalan';
import DaftarRawatInap from './pages/DaftarRawatInap';
import ConnectWhatsapp from './pages/ConnectWhatsapp';
import ConnectReservation from './pages/ConnectReservation';
import ModelManagement from './pages/ModelManagement';
import SuperAdminPanel from './pages/SuperAdminPanel';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ToastContainer />
        <ConfirmDialogModal />
        <ErrorBoundary>
          <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/artikel" element={<ArticlesList />} />
            <Route path="/articles" element={<ArticlesList />} />
            <Route path="/artikel/:slug" element={<ArticleDetail />} />
            <Route path="/articles/:slug" element={<ArticleDetail />} />
            <Route path="/options" element={<Options />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes (Bypassed) */}
            <Route path="/claim-verification" element={<ClaimVerification />} />
            {/* Standalone Reservation Forms (Without Sidebar/Layout) */}
            <Route path="/reservasi" element={<ReservationForm />} />
            <Route path="/app/reservation" element={<ReservationForm />} />
            <Route path="/patient/portal/:portalToken" element={<PatientPortal />} />

            {/* Antrean & Jadwal Dokter Workspaces */}
            <Route path="/antrean/rawat-jalan" element={<RawatJalan />} />
            <Route path="/app/antrean/rawat-jalan" element={<RawatJalan />} />
            <Route path="/antrean/rawat-jalan/semua" element={<DaftarRawatJalan />} />
            <Route path="/app/antrean/rawat-jalan/semua" element={<DaftarRawatJalan />} />
            <Route path="/antrean/rawat-inap" element={<RawatInap />} />
            <Route path="/app/antrean/rawat-inap" element={<RawatInap />} />
            <Route path="/antrean/rawat-inap/semua" element={<DaftarRawatInap />} />
            <Route path="/app/antrean/rawat-inap/semua" element={<DaftarRawatInap />} />
            <Route path="/jadwal-dokter" element={<JadwalDokter />} />
            <Route path="/app/jadwal-dokter" element={<JadwalDokter />} />

            {/* Admission & Queue Redirects */}
            <Route path="/antrean/reservasi" element={<Navigate to="/app/ai-agent/reservasi" replace />} />
            <Route path="/connect-reservation" element={<Navigate to="/app/connect-reservation" replace />} />
            <Route path="/dashboard-analisis" element={<Navigate to="/app/dashboard-analisis" replace />} />
            <Route path="/dashboard" element={<Navigate to="/app/dashboard-analisis" replace />} />

            {/* Streamlined Workspace Redirects */}
            <Route path="/connect-whatsapp" element={<Navigate to="/app/connect-reservation" replace />} />
            <Route path="/app/connect-whatsapp" element={<Navigate to="/app/connect-reservation" replace />} />

            {/* Authenticated Application Workspaces (With Layout & Sidebar) */}
            <Route path="/app" element={<Layout />}>
              <Route index element={<Navigate to="/options" replace />} />
              <Route path="dashboard-analisis" element={<DashboardAnalysis />} />
              <Route path="dashboard" element={<DashboardAnalysis />} />
              <Route path="asisten-medis" element={<MedicalScribe />} />
              <Route path="asisten-medis/riwayat" element={<ScribeList />} />
              <Route path="asisten-medis/kustomisasi" element={<ScribeCustomization />} />
              <Route path="asisten-medis/ai-knowledge" element={<AIKnowledge />} />
              <Route path="basis-pengetahuan" element={<AIKnowledge />} />
              <Route path="bpjs-claim" element={<DocumentChecking />} />
              <Route path="bpjs-claim/history" element={<DocumentCheckingHistory />} />
              <Route path="bpjs-claim/knowledge" element={<KnowledgeBase />} />
              <Route path="bpjs-claim/knowledge/tambah" element={<AddKnowledge />} />
              <Route path="pengecekan-dokumen" element={<Navigate to="/app/bpjs-claim" replace />} />
              <Route path="claim-verification" element={<ClaimVerification />} />
              <Route path="asr-radiologi" element={<RadiologyASR />} />
              <Route path="ai-agent/reservasi" element={<PatientReservation />} />
              <Route path="connect-reservation" element={<ErrorBoundary><ConnectReservation /></ErrorBoundary>} />
              <Route path="ai-agent/kontrol" element={<ControlSchedule />} />
              <Route path="ai-agent/diagnosis" element={<Navigate to="/app/asisten-medis" replace />} />
              <Route path="admin" element={<SuperAdmin />} />
              <Route path="superadmin" element={<SuperAdminPanel />} />
              <Route path="model-management" element={<ModelManagement />} />
              <Route path="panduan" element={<Guide />} />
              <Route path="pengaturan" element={<Quota />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </NotificationProvider>
    </AuthProvider>
  );
}

export default App;

