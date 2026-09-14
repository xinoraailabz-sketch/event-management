import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  QrCode,
  CheckCircle2,
  Zap,
  Users,
  Shield,
  BarChart3,
  ArrowRight,
  Smartphone,
  Sparkles,
  Ticket,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PRICING_PLANS } from '../../lib/constants';
import { formatCurrency } from '../../lib/utils';

export const LandingPage: React.FC = () => {
  const { events, navigateTo } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">EventFlow</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#scanner" className="hover:text-indigo-600 transition-colors">QR Scanner</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#demo" className="hover:text-indigo-600 transition-colors">Live Preview</a>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigateTo('/login')}>
              Sign In
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigateTo('/app')}>
              Open Organizer App
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Event Registration & QR Check-in Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Seamless Event Registration, <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-600">
                Instant QR Check-ins.
              </span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Create branded event registration forms, issue unique digital QR passes, eliminate entrance queues with high-speed mobile scanning, and track live attendance in real-time.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Button
                size="lg"
                variant="primary"
                onClick={() => navigateTo('/app')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto shadow-md"
              >
                Launch Organizer Dashboard
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigateTo(events[0] ? `/e/${events[0].slug}` : '/app/events/new')}
                leftIcon={<Ticket className="w-4 h-4 text-indigo-600" />}
                className="w-full sm:w-auto"
              >
                {events[0] ? 'View Live Event Page' : 'Create First Event'}
              </Button>
            </div>

            {/* Quick Metrics */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t border-slate-200">
              <div>
                <p className="text-2xl font-extrabold text-slate-900">0.3s</p>
                <p className="text-xs text-slate-500 mt-0.5">Scan & Check-in speed</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">100%</p>
                <p className="text-xs text-slate-500 mt-0.5">Duplicate fraud prevention</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">150k+</p>
                <p className="text-xs text-slate-500 mt-0.5">Delegates checked in</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">99.9%</p>
                <p className="text-xs text-slate-500 mt-0.5">Uptime reliability</p>
              </div>
            </div>
          </div>

          {/* Interactive UI Mockup Showcase */}
          <div className="mt-14 relative max-w-5xl mx-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xl p-4 sm:p-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-400 font-mono ml-2">app.eventflow.in/app/events/evt-business-summit-2026/check-in</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigateTo('/app/events/evt-business-summit-2026/scanner')}>
                Open Live Scanner UI
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase">Live Checked In</p>
                <h4 className="text-3xl font-extrabold text-slate-900 mt-1">876</h4>
                <p className="text-xs text-emerald-600 font-medium mt-1">70.2% total attendance</p>
                <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-600 h-2 rounded-full w-[70%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase">Remaining Capacity</p>
                <h4 className="text-3xl font-extrabold text-slate-900 mt-1">252</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">1,248 / 1,500 registered</p>
                <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-indigo-600 h-2 rounded-full w-[83%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase">Active Scanners</p>
                <h4 className="text-3xl font-extrabold text-slate-900 mt-1">3 Gates</h4>
                <p className="text-xs text-indigo-600 font-medium mt-1">Gate A: 312 • Gate B: 284</p>
                <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-sky-600 h-2 rounded-full w-[95%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section id="features" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Engineered for flawless event operations
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              From the initial registration form to the final exit report, EventFlow powers every moment of your summit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <Ticket className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Custom Form Builder</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drag-and-drop custom questions, delegate tiers, dietary preferences, and document uploads. Mobile-responsive and high-converting.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Instant Digital QR Passes</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Auto-generate cryptographically signed event passes sent instantly via WhatsApp and Email. Compatible with mobile wallets & print badges.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Multi-Entrance Live Scanner</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Equip staff with camera scanners across Entrance A, B, and VIP gates. Instant warning audio cues prevent duplicate badge re-entry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section id="pricing" className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Simple, transparent pricing for all event sizes
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Start free, then upgrade seamlessly as your attendee registrations scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 border flex flex-col justify-between bg-white ${
                  plan.popular ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-md relative' : 'border-slate-200 shadow-xs'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white font-bold text-[10px] rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <div>
                  <h4 className="text-base font-bold text-slate-900">{plan.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.tagline}</p>
                  <div className="mt-4 mb-6">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {plan.monthlyPrice === 0 ? 'Free' : formatCurrency(plan.monthlyPrice)}
                    </span>
                    {plan.monthlyPrice > 0 && <span className="text-xs text-slate-500"> /month</span>}
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{plan.eventsAllowed} active events</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{plan.registrationLimit === 'Unlimited' ? 'Unlimited' : plan.registrationLimit.toLocaleString()} registrations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{plan.staffSeats} staff scanner seats</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{plan.whatsappMessages.toLocaleString()} WhatsApp messages</span>
                    </li>
                    {plan.customBranding && (
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Custom event branding & logo</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="mt-6 pt-4">
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    size="sm"
                    className="w-full"
                    onClick={() => navigateTo('/app')}
                  >
                    {plan.monthlyPrice === 0 ? 'Get Started Free' : 'Choose Plan'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              EF
            </div>
            <span className="font-bold text-slate-800">EventFlow</span>
            <span>— Multi-Tenant SaaS Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => navigateTo('/app')} className="hover:text-indigo-600">Organizer Portal</button>
            <button onClick={() => navigateTo('/admin')} className="hover:text-indigo-600">Platform Admin</button>
            <button onClick={() => navigateTo('/e/business-summit-2026')} className="hover:text-indigo-600">Sample Registration</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
