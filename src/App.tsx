import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { MobileNav } from './components/layout/MobileNav';
import { CommandPalette } from './components/layout/CommandPalette';
import { ToastContainer } from './components/common/ToastContainer';
import { cn } from './lib/utils';

// Public Pages
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
  const { currentPath, setActiveEventId, events, currentRole, currentUser, activeEvent, navigateTo } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = React.useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });

  // Sync activeEventId when navigating to an event-scoped route
  React.useEffect(() => {
    if (currentPath.startsWith('/app/events/')) {
      const parts = currentPath.split('/');
      const eventId = parts[3];
      if (eventId && eventId !== 'new' && eventId !== activeEvent?.id) {
        const found = events.find((e) => e.id === eventId);
        if (found) {
          setActiveEventId(eventId);
        }
      }
    }
  }, [currentPath, events, activeEvent, setActiveEventId]);

  // Normalize currentPath (strip query strings, hash, and trailing slashes for routing matches)
  const cleanPath = (currentPath || '').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';

  // 1. Public Routes:
  if (cleanPath === '/' || cleanPath === '/login' || cleanPath === '/signup') {
    return <LoginPage />;
  }

  // Public Pass URL: /e/:slug/pass/:attendeeId
  if (cleanPath.startsWith('/e/') && cleanPath.includes('/pass/')) {
    const parts = cleanPath.split('/');
    const eventSlug = parts[2];
    const attendeeId = parts[4];
    return <DigitalEventPassPage eventSlug={eventSlug} attendeeId={attendeeId} />;
  }

  // Public Registration Form URL: /e/:slug
  if (cleanPath.startsWith('/e/')) {
    const parts = cleanPath.split('/');
    const eventSlug = parts[2];
    return <PublicRegistrationPage eventSlug={eventSlug} />;
  }

  // 2. Authentication Guard: Protected routes require logged in user
  if (!currentUser) {
    return <LoginPage />;
  }

  // 2. Admin Portal: Strictly for admin & organizer
  if (currentPath.startsWith('/admin')) {
    if (currentRole !== 'admin' && currentRole !== 'organizer') {
      return (
        <div className="min-h-screen bg-[#F5F3EE] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl border border-[#E8E5DF] text-center max-w-md shadow-[0_2px_12px_rgba(0,0,0,0.06)] space-y-4">
            <div className="w-12 h-12 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <span className="font-bold text-lg">🛡️</span>
            </div>
            <h3 className="text-base font-bold text-[#1A1A1A]">Admin Console Restricted</h3>
            <p className="text-sm text-[#6B6B6B]">
              You are currently signed in as <strong className="capitalize text-[#1A1A1A]">Check-in Staff</strong>. This console requires Administrator privileges.
            </p>
            <button
              onClick={() => {
                const evId = activeEvent?.id || events[0]?.id;
                if (evId) navigateTo(`/app/events/${evId}/scanner`);
                else navigateTo('/app/scanner');
              }}
              className="w-full py-2.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Return to Scanner Desk
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F5F3EE] text-[#1A1A1A] flex selection:bg-amber-200 selection:text-amber-950 font-sans antialiased">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isExpanded={isSidebarExpanded}
          onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
        />
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out',
            isSidebarExpanded ? 'lg:ml-60' : 'lg:ml-[68px]'
          )}
        >
          <Topbar
            onToggleSidebar={() => {
              if (window.innerWidth < 1024) {
                setIsSidebarOpen(!isSidebarOpen);
              } else {
                setIsSidebarExpanded(!isSidebarExpanded);
              }
            }}
          />
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

  // 3. Application Portal (Admin & Staff):
  const renderOrganizerView = () => {
    // Staff Persona Navigation Defaults
    if (currentRole === 'staff') {
      if (
        currentPath === '/app' ||
        currentPath === '/app/' ||
        currentPath === '/app/events' ||
        currentPath === '/app/events/'
      ) {
        return <QRScannerPage />;
      }
    }

    // Direct Clean Routes:
    if (currentPath === '/app' || currentPath === '/app/') {
      return <DashboardPage />;
    }

    if (currentPath === '/app/events' || currentPath === '/app/events/') {
      return <EventsListPage />;
    }

    if (currentPath === '/app/events/new') {
      if (currentRole === 'staff') return <QRScannerPage />;
      return <CreateEventWizard />;
    }

    if (currentPath === '/app/attendees' || currentPath === '/app/attendees/') {
      if (currentRole === 'staff') return <QRScannerPage />;
      return <AttendeeListPage />;
    }

    if (currentPath === '/app/check-in' || currentPath === '/app/check-in/') {
      return <CheckInOperationsPage />;
    }

    if (currentPath === '/app/scanner' || currentPath === '/app/scanner/') {
      return <QRScannerPage />;
    }

    if (currentPath === '/app/staff' || currentPath === '/app/staff/') {
      if (currentRole === 'staff') return <QRScannerPage />;
      return <StaffManagementPage />;
    }

    if (
      currentPath === '/app/broadcasts' ||
      currentPath === '/app/broadcasts/' ||
      currentPath === '/app/messages' ||
      currentPath === '/app/messages/'
    ) {
      if (currentRole === 'staff') return <QRScannerPage />;
      return <MessagesPage />;
    }

    if (
      currentPath === '/app/analytics' ||
      currentPath === '/app/analytics/' ||
      currentPath === '/app/reports' ||
      currentPath === '/app/reports/'
    ) {
      if (currentRole === 'staff') return <QRScannerPage />;
      return <ReportsPage />;
    }

    if (currentPath === '/app/settings' || currentPath.startsWith('/app/settings')) {
      if (currentRole === 'staff') return <QRScannerPage />;
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
          // Check-in and Scanner are accessible by both staff and organizers
          if (subRoute === 'scanner') return <QRScannerPage />;
          if (subRoute === 'check-in') return <CheckInOperationsPage />;

          // If staff, restrict access to organizer tools
          if (currentRole === 'staff') {
            return <QRScannerPage />;
          }

          if (!subRoute) return <EventOverviewPage />;
          if (subRoute === 'registrations') return <AttendeeListPage />;
          if (subRoute === 'staff') return <StaffManagementPage />;
          if (subRoute === 'messages') return <MessagesPage />;
          if (subRoute === 'reports') return <ReportsPage />;
          if (subRoute === 'settings') return <EventSettingsPage />;
        }
      }

      return currentRole === 'staff' ? <QRScannerPage /> : <EventsListPage />;
    }

    return currentRole === 'staff' ? <QRScannerPage /> : <DashboardPage />;
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#1A1A1A] flex selection:bg-amber-200 selection:text-amber-950 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isExpanded={isSidebarExpanded}
        onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      {/* Main Container — dynamic offset based on collapsed/expanded sidebar */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out',
          isSidebarExpanded ? 'lg:ml-60' : 'lg:ml-[68px]'
        )}
      >
        <Topbar
          onToggleSidebar={() => {
            // On mobile, toggle the mobile drawer. On desktop, toggle expand/collapse
            if (window.innerWidth < 1024) {
              setIsSidebarOpen(!isSidebarOpen);
            } else {
              setIsSidebarExpanded(!isSidebarExpanded);
            }
          }}
        />

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
