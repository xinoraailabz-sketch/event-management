import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
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
  ShieldCheck,
  Camera,
  CameraOff,
  SwitchCamera,
  ArrowLeft,
  UserCheck,
  Building,
  Mail,
  Phone,
  Ticket,
  ChevronRight,
  X,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { playScanSound, playErrorSound } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { Attendee } from '@/types';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';

export const QRScannerPage: React.FC = () => {
  const {
    activeEvent,
    events,
    setActiveEventId,
    attendees,
    processCheckIn,
    checkInLogs,
    currentStaff,
    currentUser,
    selectedEntrance,
    currentRole,
    setIsChangePasswordOpen,
    setCurrentRole,
    addToast,
    navigateTo,
    refreshData,
    isLoading,
  } = useApp();

  // App & Camera View Modes:
  // 'hub': main mobile check-in desk overview
  // 'camera': full-screen live mobile camera viewfinder
  // 'confirm': scanned attendee detail confirmation screen
  const [viewMode, setViewMode] = useState<'hub' | 'camera' | 'confirm'>('hub');

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>('');

  // Camera State
  const [isCameraRunning, setIsCameraRunning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTokenRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  // Scanned Verification Data
  const [scannedAttendee, setScannedAttendee] = useState<Attendee | null>(null);
  const [scannedPayload, setScannedPayload] = useState<string>('');
  const [scanStatus, setScanStatus] = useState<'ready_to_admit' | 'already_checked_in' | 'invalid'>('ready_to_admit');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [confirmedSuccess, setConfirmedSuccess] = useState<boolean>(false);

  const eventAttendees = attendees.filter((a) => a.eventId === activeEvent?.id);
  const totalRegistrations = activeEvent?.stats?.totalRegistrations || eventAttendees.length || 0;
  const totalCheckedIn = activeEvent?.stats?.totalCheckedIn || eventAttendees.filter((a) => a.status === 'checked_in').length || 0;
  const recentLogs = checkInLogs.filter((l) => l.eventId === activeEvent?.id).slice(0, 8);

  // Fast staff token login URL check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const staffToken = params.get('staffToken');
    if (staffToken) {
      setCurrentRole('staff');
    }
  }, []);

  // Auto-activate event when events exist but none is currently selected
  useEffect(() => {
    if (!activeEvent && events.length > 0) {
      setActiveEventId(events[0].id);
      navigateTo(`/app/events/${events[0].id}/scanner`);
    }
  }, [activeEvent, events, setActiveEventId, navigateTo]);

  // 1. Process decoded raw QR token & prepare confirmation sheet
  const handleDecodedQR = (rawTokenOrId: string) => {
    if (!activeEvent || !rawTokenOrId.trim()) return;

    let cleanToken = rawTokenOrId.trim();
    if (cleanToken.includes('/pass/')) {
      const parts = cleanToken.split('/pass/');
      if (parts[1]) cleanToken = parts[1].split('?')[0].split('/')[0];
    }

    setScannedPayload(cleanToken);

    // Lookup attendee in local memory / supabase state
    const matched = eventAttendees.find(
      (a) =>
        a.qrToken === cleanToken ||
        a.qrToken === rawTokenOrId ||
        a.id === cleanToken ||
        (a.registrationId || '').toLowerCase() === cleanToken.toLowerCase() ||
        (a.registrationId || '').toLowerCase() === rawTokenOrId.toLowerCase() ||
        (a.phone || '').replace(/\s+/g, '') === cleanToken.replace(/\s+/g, '') ||
        (a.email || '').toLowerCase() === cleanToken.toLowerCase()
    );

    if (matched) {
      setScannedAttendee(matched);
      if (matched.status === 'checked_in') {
        setScanStatus('already_checked_in');
        if (soundEnabled) playErrorSound();
      } else {
        setScanStatus('ready_to_admit');
        if (soundEnabled) playScanSound('success');
      }
    } else {
      setScannedAttendee(null);
      setScanStatus('invalid');
      if (soundEnabled) playErrorSound();
    }

    // Pause camera and open confirmation sheet
    stopCamera();
    setViewMode('confirm');
    setConfirmedSuccess(false);
  };

  // 2. Staff confirms check-in for the attendee
  const handleConfirmAdmission = async () => {
    if (!scannedAttendee && !scannedPayload) return;

    setIsConfirming(true);
    const tokenToProcess = scannedAttendee
      ? (scannedAttendee.qrToken || scannedAttendee.registrationId)
      : scannedPayload;

    const result = await processCheckIn(
      tokenToProcess,
      'Universal Desk',
      currentStaff?.name || 'Scanner Staff'
    );

    setIsConfirming(false);

    if (result.success) {
      if (soundEnabled) playScanSound('success');
      setConfirmedSuccess(true);
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    } else {
      if (soundEnabled) playErrorSound();
      addToast({
        type: 'error',
        title: 'Check-In Issue',
        description: result.message || 'Could not complete check-in.',
      });
    }
  };

  // 3. Start scanning next attendee
  const handleScanNext = () => {
    setScannedAttendee(null);
    setScannedPayload('');
    setConfirmedSuccess(false);
    setViewMode('camera');
    startCamera();
  };

  // 4. Return to Hub
  const handleBackToHub = () => {
    stopCamera();
    setScannedAttendee(null);
    setScannedPayload('');
    setConfirmedSuccess(false);
    setViewMode('hub');
  };

  // Camera start / stop functions
  const startCamera = async (targetCamId?: string) => {
    setCameraError(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader-fullscreen');
      }

      const qrScanner = scannerRef.current;
      if (qrScanner.isScanning) {
        await qrScanner.stop();
      }

      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
          if (!targetCamId && !selectedCameraId) {
            const backCam = devices.find((d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment')
            );
            const chosen = backCam ? backCam.id : devices[devices.length - 1].id;
            setSelectedCameraId(chosen);
            targetCamId = chosen;
          }
        }
      } catch (e) {
        console.warn('Cameras list error:', e);
      }

      const config: Html5QrcodeCameraScanConfig = {
        fps: 15,
        qrbox: (w, h) => {
          const size = Math.min(w, h) * 0.72;
          return { width: Math.floor(size), height: Math.floor(size) };
        },
        aspectRatio: 1.0,
      };

      const cameraConstraint = targetCamId
        ? { deviceId: { exact: targetCamId } }
        : { facingMode: 'environment' };

      await qrScanner.start(
        cameraConstraint,
        config,
        (decoded) => {
          const now = Date.now();
          if (decoded === lastScannedTokenRef.current && now - lastScannedTimeRef.current < 2000) {
            return;
          }
          lastScannedTokenRef.current = decoded;
          lastScannedTimeRef.current = now;
          handleDecodedQR(decoded);
        },
        () => {}
      );

      setIsCameraRunning(true);
    } catch (err: any) {
      console.error('Camera startup error:', err);
      setCameraError(err?.message || 'Unable to open camera. Please grant camera permissions in your browser.');
      setIsCameraRunning(false);
    }
  };

  const stopCamera = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      setIsCameraRunning(false);
    } catch (e) {
      setIsCameraRunning(false);
    }
  };

  const toggleTorch = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        const nextTorch = !torchEnabled;
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: nextTorch } as any],
        });
        setTorchEnabled(nextTorch);
      }
    } catch (e) {
      addToast({
        type: 'info',
        title: 'Flashlight Unavailable',
        description: 'Torch is not supported by your camera hardware.',
      });
    }
  };

  const switchCamera = () => {
    if (availableCameras.length <= 1) return;
    const currIdx = availableCameras.findIndex((c) => c.id === selectedCameraId);
    const nextIdx = (currIdx + 1) % availableCameras.length;
    const nextCam = availableCameras[nextIdx];
    setSelectedCameraId(nextCam.id);
    startCamera(nextCam.id);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Handle manual input search
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecodedQR(manualInput.trim());
    setManualInput('');
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-[#1A1A1A] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
          Connecting to Scanner Desk...
        </p>
      </div>
    );
  }

  if (!activeEvent) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl border border-[#E8E5DF] p-8 text-center shadow-xs space-y-5">
          <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            🎫
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#1A1A1A]">
              {currentRole === 'staff' ? 'No Event Assigned' : 'No Active Event Selected'}
            </h3>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              {currentRole === 'staff'
                ? `Your staff account (${currentStaff?.name || currentUser?.fullName || 'Staff'}) is active, but no events are assigned to you yet. Please ask your organizer to assign you an event.`
                : 'Please create or select an event to launch the check-in scanner.'}
            </p>
          </div>
          {currentRole === 'staff' ? (
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => refreshData()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Access
            </Button>
          ) : (
            <Button
              className="w-full rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white"
              onClick={() => navigateTo('/app/events')}
            >
              Go to Events
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Sample quick test attendees
  const sampleValid = eventAttendees.find((a) => a.status === 'registered') || eventAttendees[0];
  const sampleVIP = eventAttendees.find((a) => a.ticketType?.includes('VIP')) || eventAttendees[1];
  const sampleChecked = eventAttendees.find((a) => a.status === 'checked_in') || eventAttendees[0];

  return (
    <div className="w-full max-w-5xl mx-auto pb-20 px-2 sm:px-4">
      {/* ─────────────────────────────────────────────────────────────
          SCREEN 1: SCANNER HUB VIEW (Mobile & Desktop App Overview)
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'hub' && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          {/* Mobile Header Bar */}
          <div className="flex items-center justify-between pb-1">
            <div className="truncate pr-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Live Scanner Desk
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 mt-1 tracking-tight truncate">
                {activeEvent.name}
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {currentRole === 'staff' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangePasswordOpen(true)}
                  leftIcon={<KeyRound className="w-3.5 h-3.5 text-[#C49A3C]" />}
                  className="text-xs rounded-xl border-[#E8E5DF] text-[#1A1A1A] hover:bg-white"
                >
                  Change Password
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTo(`/app/events/${activeEvent.id}/check-in`)}
                className="text-xs hidden sm:inline-flex shrink-0 rounded-xl"
              >
                Live Desk
              </Button>
            </div>
          </div>

          {/* Mobile App Camera Action Hero Card */}
          <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-xs truncate max-w-[190px] sm:max-w-xs">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Universal Check-In</span>
                </div>
                <span className="text-[11px] text-white/90 font-mono font-bold shrink-0">
                  {totalCheckedIn} / {totalRegistrations} In
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Tap to Scan QR Pass
                </h2>
                <p className="text-[11px] sm:text-xs text-blue-100 mt-0.5">
                  Opens camera with instant attendee preview & confirm.
                </p>
              </div>

              {/* Big Native-App Scan Button */}
              <button
                onClick={() => {
                  setViewMode('camera');
                  startCamera();
                }}
                className="w-full py-3.5 sm:py-4 px-5 rounded-2xl bg-white hover:bg-blue-50 text-blue-700 font-black text-sm sm:text-base shadow-lg shadow-black/10 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left">Launch Live Camera</span>
                <ChevronRight className="w-5 h-5 text-blue-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* Quick Manual Search Input */}
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search Ticket ID or Phone..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="pl-9 h-11 text-xs bg-white rounded-xl"
              />
            </div>
            <Button type="submit" variant="primary" size="md" className="h-11 rounded-xl px-4 text-xs font-bold shrink-0">
              Verify
            </Button>
          </form>

          {/* Attendance Stats Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Card className="rounded-2xl shadow-2xs border-slate-200">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 truncate">Registered</p>
                <p className="text-base sm:text-xl font-black text-slate-900 mt-0.5">{totalRegistrations}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-2xs border-slate-200 bg-emerald-50/60 border-emerald-100">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] uppercase font-bold text-emerald-700 truncate">Admitted</p>
                <p className="text-base sm:text-xl font-black text-emerald-700 mt-0.5">{totalCheckedIn}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-2xs border-slate-200">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 truncate">Remaining</p>
                <p className="text-base sm:text-xl font-black text-slate-700 mt-0.5">
                  {Math.max(0, totalRegistrations - totalCheckedIn)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Simulation Buttons */}
          <Card className="rounded-2xl shadow-2xs border-slate-200">
            <CardContent className="p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Simulations
                </span>
                <span className="text-[10px] text-blue-600 font-semibold">1-Click Test</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sampleValid && (
                  <button
                    onClick={() => handleDecodedQR(sampleValid.qrToken)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left text-xs transition-colors cursor-pointer"
                  >
                    <p className="font-bold text-slate-900 truncate">Valid Pass</p>
                    <p className="text-[10px] text-slate-500 truncate">{sampleValid.fullName}</p>
                  </button>
                )}
                {sampleVIP && (
                  <button
                    onClick={() => handleDecodedQR(sampleVIP.qrToken)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left text-xs transition-colors cursor-pointer"
                  >
                    <p className="font-bold text-blue-900 truncate">VIP Pass</p>
                    <p className="text-[10px] text-blue-600 truncate">{sampleVIP.fullName}</p>
                  </button>
                )}
                {sampleChecked && (
                  <button
                    onClick={() => handleDecodedQR(sampleChecked.qrToken)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 text-left text-xs transition-colors cursor-pointer"
                  >
                    <p className="font-bold text-rose-900 truncate">Duplicate</p>
                    <p className="text-[10px] text-rose-600 truncate">Trigger warning</p>
                  </button>
                )}
                <button
                  onClick={() => handleDecodedQR('INVALID-SAMPLE-TOKEN')}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 text-left text-xs transition-colors cursor-pointer"
                >
                  <p className="font-bold text-amber-900 truncate">Invalid Pass</p>
                  <p className="text-[10px] text-amber-600 truncate">Unrecognized</p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Scans Feed */}
          <Card className="rounded-2xl shadow-2xs border-slate-200">
            <CardContent className="p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Recent Admitted Passes
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Live</span>
              </div>
              <div className="divide-y divide-slate-100">
                {recentLogs.map((log) => (
                  <div key={log.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <p className="font-bold text-slate-900 truncate">{log.attendeeName}</p>
                      <p className="text-[10px] text-slate-400">
                        {log.timestamp} • {log.entrance}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                      Admitted ✓
                    </span>
                  </div>
                ))}
                {recentLogs.length === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">No check-ins recorded yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SCREEN 2: FULL-SCREEN IMMERSIVE MOBILE CAMERA VIEW
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'camera' && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between animate-in fade-in-50 duration-200">
          {/* Top Floating Controls Bar */}
          <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between">
            <button
              onClick={handleBackToHub}
              className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors cursor-pointer"
              title="Close Scanner"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <span className="text-xs font-bold text-white tracking-wide">Live QR Camera</span>
              <p className="text-[10px] text-white/70">Universal Scan Mode</p>
            </div>

            <div className="flex items-center gap-2">
              {availableCameras.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors cursor-pointer"
                  title="Flip Camera"
                >
                  <SwitchCamera className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={toggleTorch}
                className={`p-2.5 rounded-full backdrop-blur-md text-white transition-colors cursor-pointer ${
                  torchEnabled ? 'bg-amber-400 text-slate-950' : 'bg-white/20 hover:bg-white/30'
                }`}
                title="Toggle Torch"
              >
                <Flashlight className="w-5 h-5" />
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors cursor-pointer"
                title="Audio"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Camera Viewport */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            <div
              id="qr-reader-fullscreen"
              className="w-full h-full object-cover flex items-center justify-center [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
            />

            {cameraError && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-40 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <CameraOff className="w-7 h-7" />
                </div>
                <div className="max-w-xs space-y-1">
                  <h3 className="text-base font-bold text-white">Camera Access Required</h3>
                  <p className="text-xs text-slate-400">{cameraError}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => startCamera()}>
                    Retry Camera
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleBackToHub} className="text-white border-white/20">
                    Back to Hub
                  </Button>
                </div>
              </div>
            )}

            {isCameraRunning && !cameraError && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-20">
                <div className="w-60 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_#3b82f6] animate-bounce" />

                <div className="w-60 h-60 sm:w-72 sm:h-72 rounded-3xl border-2 border-blue-400/50 relative flex items-center justify-center">
                  <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-blue-400 rounded-tl-2xl" />
                  <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-blue-400 rounded-tr-2xl" />
                  <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-blue-400 rounded-bl-2xl" />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-blue-400 rounded-br-2xl" />
                </div>

                <p className="mt-4 text-xs font-semibold text-white/90 bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-sm">
                  Align delegate QR code inside frame
                </p>
              </div>
            )}
          </div>

          {/* Bottom Scanner Bar */}
          <div className="p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-30 flex items-center justify-center">
            <button
              onClick={handleBackToHub}
              className="px-6 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close & Back to Hub
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SCREEN 3: SCANNED ATTENDEE VERIFICATION & CONFIRMATION SHEET
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'confirm' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in-50 duration-200">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-6 duration-200">
            {/* Status Header Banner */}
            <div
              className={`p-6 text-white text-center relative ${
                confirmedSuccess
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                  : scanStatus === 'ready_to_admit'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                  : scanStatus === 'already_checked_in'
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600'
                  : 'bg-gradient-to-r from-amber-600 to-orange-600'
              }`}
            >
              <button
                onClick={handleScanNext}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-2.5 shadow-inner">
                {confirmedSuccess ? (
                  <CheckCircle2 className="w-8 h-8 text-white animate-bounce" />
                ) : scanStatus === 'ready_to_admit' ? (
                  <UserCheck className="w-8 h-8 text-white" />
                ) : scanStatus === 'already_checked_in' ? (
                  <XCircle className="w-8 h-8 text-white" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-white" />
                )}
              </div>

              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-black/20 px-3 py-0.5 rounded-full">
                {confirmedSuccess
                  ? 'ADMISSION CONFIRMED ✓'
                  : scanStatus === 'ready_to_admit'
                  ? 'PASS VERIFIED • READY TO ADMIT'
                  : scanStatus === 'already_checked_in'
                  ? 'DUPLICATE WARNING • ALREADY ADMITTED'
                  : 'UNRECOGNIZED PASS'}
              </span>

              <h2 className="text-xl sm:text-2xl font-black mt-1.5 tracking-tight truncate">
                {scannedAttendee ? scannedAttendee.fullName : 'Guest Delegate'}
              </h2>
            </div>

            {/* Attendee Details Body */}
            <div className="p-5 space-y-3.5 overflow-y-auto flex-1">
              {scannedAttendee ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Ticket className="w-3 h-3 text-blue-600" /> Ticket Tier
                      </span>
                      <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 truncate">
                        {scannedAttendee.ticketType || 'General Attendee'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Ticket ID</span>
                      <p className="text-xs sm:text-sm font-mono font-bold text-blue-600 mt-0.5 truncate">
                        {scannedAttendee.registrationId}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Building className="w-3.5 h-3.5" /> Company:
                      </span>
                      <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                        {scannedAttendee.company || 'Individual'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Mail className="w-3.5 h-3.5" /> Email:
                      </span>
                      <span className="font-medium text-slate-900 truncate max-w-[180px]">
                        {scannedAttendee.email}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Phone className="w-3.5 h-3.5" /> Phone:
                      </span>
                      <span className="font-medium text-slate-900">
                        {scannedAttendee.phone || 'N/A'}
                      </span>
                    </div>

                    {scannedAttendee.checkedInAt && (
                      <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-rose-700 font-semibold">
                        <span>First Checked In:</span>
                        <span>{scannedAttendee.checkedInAt}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs">
                  <p className="font-bold">Scanned Raw Payload:</p>
                  <p className="font-mono mt-1 break-all bg-white p-2 rounded-lg border border-amber-200">
                    {scannedPayload}
                  </p>
                  <p className="mt-2 text-slate-500">
                    No matching attendee found for this token in the active event registry.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
              {confirmedSuccess ? (
                <button
                  onClick={handleScanNext}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Scan Next Attendee →</span>
                </button>
              ) : scanStatus === 'ready_to_admit' ? (
                <>
                  <button
                    onClick={handleConfirmAdmission}
                    disabled={isConfirming}
                    className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{isConfirming ? 'Admitting...' : 'Confirm & Check-In Attendee'}</span>
                  </button>

                  <button
                    onClick={handleScanNext}
                    className="w-full py-2 text-slate-500 hover:text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel & Scan Next
                  </button>
                </>
              ) : scanStatus === 'already_checked_in' ? (
                <>
                  <button
                    onClick={handleConfirmAdmission}
                    disabled={isConfirming}
                    className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Override & Re-Admit Delegate</span>
                  </button>

                  <button
                    onClick={handleScanNext}
                    className="w-full py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Deny Entry & Scan Next
                  </button>
                </>
              ) : (
                <button
                  onClick={handleScanNext}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Try Again / Back to Camera</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
