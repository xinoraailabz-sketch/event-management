import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  QrCode,
  Volume2,
  VolumeX,
  Flashlight,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  MapPin,
  Sparkles,
  ArrowLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { playScanSound, playErrorSound } from '../../lib/utils';
import confetti from 'canvas-confetti';
import { Attendee } from '../../types';

export const QRScannerPage: React.FC = () => {
  const {
    activeEvent,
    attendees,
    processCheckIn,
    checkInLogs,
    currentStaff,
    navigateTo,
  } = useApp();

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>('');
  const [isSearchingManual, setIsSearchingManual] = useState<boolean>(false);

  // Scan outcome banner state
  const [lastScanResult, setLastScanResult] = useState<{
    status: 'success' | 'duplicate' | 'invalid' | 'wrong_event' | null;
    message: string;
    attendee?: Attendee;
  }>({ status: null, message: '' });

  const eventAttendees = attendees.filter((a) => a.eventId === activeEvent?.id);
  const recentLogs = checkInLogs.filter((l) => l.eventId === activeEvent?.id).slice(0, 5);

  const handleScanPayload = (tokenOrId: string) => {
    if (!activeEvent) return;

    const result = processCheckIn(
      tokenOrId,
      'Universal Scanner Desk',
      currentStaff?.name || 'Scanner Staff'
    );

    if (result.success) {
      if (soundEnabled) playScanSound();
      setLastScanResult({
        status: 'success',
        message: result.message,
        attendee: result.attendee,
      });

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {}
    } else if (result.reason === 'already_checked_in' || result.type === 'duplicate') {
      if (soundEnabled) playErrorSound();
      setLastScanResult({
        status: 'duplicate',
        message: result.message || 'Already checked in',
        attendee: result.attendee,
      });
    } else {
      if (soundEnabled) playErrorSound();
      setLastScanResult({
        status: 'invalid',
        message: result.message || 'Invalid or unregistered QR pass',
      });
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleScanPayload(manualInput.trim());
    setManualInput('');
  };

  if (!activeEvent) {
    return <div className="p-8 text-center text-slate-500">Please select an event first.</div>;
  }

  // Pre-selected demo tickets
  const sampleValid1 = eventAttendees.find((a) => a.status === 'registered') || eventAttendees[0];
  const sampleVIP = eventAttendees.find((a) => a.ticketType.includes('VIP')) || eventAttendees[1];
  const sampleChecked = eventAttendees.find((a) => a.status === 'checked_in') || eventAttendees[0];

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="High-Speed QR Scanner"
        subtitle={`Live verification terminal for ${activeEvent.name}`}
        breadcrumbs={[
          { label: 'Events', onClick: () => navigateTo('/app/events') },
          { label: activeEvent.name, onClick: () => navigateTo(`/app/events/${activeEvent.id}`) },
          { label: 'Scanner' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo(`/app/events/${activeEvent.id}/check-in`)}
            >
              Open Live Station
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Camera Viewfinder & Scan Card (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Scanner Controls Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
            {/* Universal Mode Indicator */}
            <div className="flex items-center gap-2 flex-1">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                Universal Scanner (Any Place)
              </span>
            </div>

            {/* Audio & Flash buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl border transition-colors ${
                  soundEnabled ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
                title={soundEnabled ? 'Audio Feedback On' : 'Audio Muted'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setTorchEnabled(!torchEnabled)}
                className={`p-2 rounded-xl border transition-colors ${
                  torchEnabled ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
                title="Toggle Viewfinder Flash"
              >
                <Flashlight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Camera Viewfinder Box */}
          <div className="relative rounded-3xl bg-slate-950 border-2 border-slate-800 aspect-[4/3] sm:aspect-[16/11] overflow-hidden shadow-2xl flex flex-col items-center justify-center p-6 text-white text-center">
            {/* Animated Laser Beam */}
            <div className="absolute inset-x-8 top-12 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-pulse shadow-[0_0_15px_#818cf8]" />

            {/* Viewfinder Target Framing Box */}
            <div className="w-56 h-56 rounded-2xl border-2 border-indigo-400/70 relative flex items-center justify-center p-4">
              {/* Corner Reticles */}
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />

              <QrCode className="w-20 h-20 text-indigo-400/40 animate-pulse" />
            </div>

            <p className="mt-4 text-xs font-semibold text-slate-300">
              Align Attendee QR Pass within the target square
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live scanning enabled at 0.3s speed
            </p>

            {/* Active Staff info banner */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl backdrop-blur-xs border border-slate-800">
              <span>Scanner Gate: <strong className="text-white">{selectedGate}</strong></span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Sync
              </span>
            </div>
          </div>

          {/* Quick Demo Scan Buttons */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                1-Click Quick Scan Simulation
              </span>
              <span className="text-[11px] text-indigo-600 font-medium">Test Scanner</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {sampleValid1 && (
                <button
                  onClick={() => handleScanPayload(sampleValid1.qrToken)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left text-xs transition-colors"
                >
                  <p className="font-bold text-slate-900 truncate">Scan Valid</p>
                  <p className="text-[10px] text-slate-500 truncate">{(sampleValid1.fullName || 'Guest').split(' ')[0]}</p>
                </button>
              )}

              {sampleVIP && (
                <button
                  onClick={() => handleScanPayload(sampleVIP.qrToken)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-left text-xs transition-colors"
                >
                  <p className="font-bold text-indigo-900 truncate">Scan VIP</p>
                  <p className="text-[10px] text-indigo-600 truncate">{(sampleVIP.fullName || 'VIP').split(' ')[0]}</p>
                </button>
              )}

              {sampleChecked && (
                <button
                  onClick={() => handleScanPayload(sampleChecked.qrToken)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-left text-xs transition-colors"
                >
                  <p className="font-bold text-rose-900 truncate">Scan Duplicate</p>
                  <p className="text-[10px] text-rose-600 truncate">Trigger warning</p>
                </button>
              )}

              <button
                onClick={() => handleScanPayload('INVALID-TOKEN-999')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-left text-xs transition-colors"
              >
                <p className="font-bold text-amber-900 truncate">Scan Invalid</p>
                <p className="text-[10px] text-amber-600 truncate">Fake QR token</p>
              </button>
            </div>
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSearch} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex gap-2">
            <input
              type="text"
              placeholder="Or enter Registration ID (e.g. EVT26-000101) or Phone..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <Button type="submit" variant="primary" size="sm" leftIcon={<Search className="w-3.5 h-3.5" />}>
              Verify
            </Button>
          </form>
        </div>

        {/* Right: Instant Scan Verification Card & Recent Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Result Card */}
          <div
            className={`p-6 rounded-3xl border shadow-md transition-all duration-300 ${
              lastScanResult.status === 'success'
                ? 'bg-emerald-500 text-white border-emerald-600'
                : lastScanResult.status === 'duplicate'
                ? 'bg-rose-600 text-white border-rose-700'
                : lastScanResult.status === 'invalid'
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {lastScanResult.status === 'success' ? (
              <div className="space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                      Valid Admission
                    </span>
                    <h3 className="text-xl font-extrabold mt-1">{lastScanResult.attendee?.fullName}</h3>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="opacity-80">Registration ID:</span>
                    <span className="font-mono font-bold">{lastScanResult.attendee?.registrationId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Ticket Tier:</span>
                    <span className="font-bold">{lastScanResult.attendee?.ticketType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Company:</span>
                    <span className="font-medium">{lastScanResult.attendee?.company || 'Individual'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Verification Mode:</span>
                    <span className="font-bold">Instant Pass Validated</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-semibold bg-white text-emerald-800 py-2.5 rounded-xl shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Delegate Verified</span>
                </div>
              </div>
            ) : lastScanResult.status === 'duplicate' ? (
              <div className="space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white text-rose-600 flex items-center justify-center shadow-xs">
                    <XCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                      Duplicate Pass Warning
                    </span>
                    <h3 className="text-xl font-extrabold mt-1">{lastScanResult.attendee?.fullName}</h3>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="opacity-80">Registration ID:</span>
                    <span className="font-mono font-bold">{lastScanResult.attendee?.registrationId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">First Checked In:</span>
                    <span className="font-bold">
                      {lastScanResult.attendee?.checkedInAt?.split('T')[1]?.substring(0, 5) || 'Earlier'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Status:</span>
                    <span className="font-bold text-rose-200">Badge Already Used</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-semibold bg-white text-rose-800 py-2.5 rounded-xl shadow-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Duplicate Check-in Rejected</span>
                </div>
              </div>
            ) : lastScanResult.status === 'invalid' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Unrecognized QR Pass</h3>
                    <p className="text-xs opacity-90">{lastScanResult.message}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <QrCode className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Ready to Scan</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Point camera at delegate QR pass or use the quick simulation triggers.
                </p>
              </div>
            )}
          </div>

          {/* Recent Scans Stream */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Recent Scans Log
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Live</span>
            </div>

            <div className="divide-y divide-slate-100">
              {recentLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{log.attendeeName}</p>
                    <p className="text-[10px] text-slate-400">Scanned by {log.staffName || 'Staff'}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.result === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {log.result === 'success' ? 'Admitted' : 'Duplicate'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
