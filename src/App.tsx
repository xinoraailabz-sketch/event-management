import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { MobileNav } from './components/layout/MobileNav';
import { CommandPalette } from './components/layout/CommandPalette';
import { ToastContainer } from './components/common/ToastContainer';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { PublicRegistrationPage } from './pages/public/PublicRegistrationPage';
import { DigitalEventPassPage } from './pages/public/DigitalEventPassPage';

// Organizer Pages
import { DashboardPage } from './pages/organizer/DashboardPage';
import { EventsListPage } from './pages/organizer/EventsListPage';
import { CreateEventWizard } from './pages/organizer/CreateEventWizard';
import { EventOverviewPage } from './pages/organizer/EventOverviewPage';
import { AttendeeListPage } from './pages/organizer/AttendeeListPage';
import { QRScannerPage } from './pages/organizer/QRScannerPage';
import { CheckInOperationsPage } from './pages/organizer/CheckInOperationsPage';
import { StaffManagementPage } from './pages/organizer/StaffManagementPage';
import { MessagesPage } from './pages/organizer/MessagesPage';
import { ReportsPage } from './pages/organizer/ReportsPage';
import { EventSettingsPage } from './pages/organizer/EventSettingsPage';
import { AccountSettingsPage } from './pages/organizer/AccountSettingsPage';

// Admin Pages
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';

const AppRouter: React.FC = () => {
  const { currentPath, setActiveEventId, events } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Parse path and sub-paths
  // Routes matching:
  // 1. Public:
  if (currentPath === '/' || currentPath === '') {
    return <LandingPage />;
  }

  if (currentPath === '/login' || currentPath === '/signup') {
    return <LoginPage />;
  }

  // Public Pass URL: /e/:slug/pass/:attendeeId
  if (currentPath.startsWith('/e/') && currentPath.includes('/pass/')) {
    const parts = currentPath.split('/');
    const eventSlug = parts[2];
    const attendeeId = parts[4];
    return <DigitalEventPassPage eventSlug={eventSlug} attendeeId={attendeeId} />;
  }

  // Public Registration Form URL: /e/:slug
  if (currentPath.startsWith('/e/')) {
    const parts = currentPath.split('/');
    const eventSlug = parts[2];
    return <PublicRegistrationPage eventSlug={eventSlug} />;
  }

  // 2. Admin Portal:
  if (currentPath.startsWith('/admin')) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex selection:bg-purple-600 selection:text-white font-sans antialiased">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
            <AdminOverviewPage />
          </main>
          <MobileNav />
        </div>
        <CommandPalette />
        <ToastContainer />
      </div>
    );
  }

  // 3. Organizer Application Portal:
  // Layout with Sidebar, Topbar, and Active View
  const renderOrganizerView = () => {
    // Top Dashboard
    if (currentPath === '/app' || currentPath === '/app/') {
      return <DashboardPage />;
    }

    // Events List
    if (currentPath === '/app/events' || currentPath === '/app/events/') {
      return <EventsListPage />;
    }

    // Create New Event
    if (currentPath === '/app/events/new') {
      return <CreateEventWizard />;
    }

    // Workspace Settings
    if (currentPath === '/app/settings') {
      return <AccountSettingsPage />;
    }

    // Event Scoped Sub-routes: /app/events/:eventId/...
    if (currentPath.startsWith('/app/events/')) {
      const parts = currentPath.split('/');
      const eventId = parts[3];
      const subRoute = parts[4];

      if (eventId) {
        // Ensure active event is set if exists
        const matched = events.find((e) => e.id === eventId);
        if (matched) {
          // view matches
          if (!subRoute) return <EventOverviewPage />;
          if (subRoute === 'registrations') return <AttendeeListPage />;
          if (subRoute === 'scanner') return <QRScannerPage />;
          if (subRoute === 'check-in') return <CheckInOperationsPage />;
          if (subRoute === 'staff') return <StaffManagementPage />;
          if (subRoute === 'messages') return <MessagesPage />;
          if (subRoute === 'reports') return <ReportsPage />;
          if (subRoute === 'settings') return <EventSettingsPage />;
        }
      }

      return <EventOverviewPage />;
    }

    return <DashboardPage />;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex selection:bg-indigo-600 selection:text-white font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          {renderOrganizerView()}
        </main>

        <MobileNav />
      </div>

      {/* Global Modals & Notifications */}
      <CommandPalette />
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

export default App;
