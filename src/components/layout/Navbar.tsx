'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, RefreshCw, ChevronDown, CheckCircle2 } from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';
import { UserProfile } from '@/lib/types';
import { getRoleBadgeColor } from '@/lib/utils';

interface NavbarProps {
  user: UserProfile;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [isSwitching, setIsSwitching] = React.useState(false);
  const [showRoleMenu, setShowRoleMenu] = React.useState(false);

  const demoRoles = [
    { role: 'admin', label: 'Administrator', email: 'admin@urcare.demo' },
    { role: 'doctor', label: 'Doctor', email: 'doctor@urcare.demo' },
    { role: 'nurse', label: 'Nurse', email: 'nurse@urcare.demo' },
    { role: 'manager', label: 'Facility Manager', email: 'manager@urcare.demo' },
  ];

  const handleRoleSwitch = async (role: string) => {
    setIsSwitching(true);
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setShowRoleMenu(false);
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
    } finally {
      setIsSwitching(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm('Reset assessment demo dataset to initial state? This restores the 20 patients and historical outcomes.')) {
      return;
    }
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        alert('Assessment demo dataset restored successfully!');
        router.refresh();
      }
    } catch {}
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-30 shadow-xs">
      {/* Left tag & Facility Info */}
      <div className="flex items-center gap-3">
        <div className="text-xs font-medium text-slate-500">
          Facility: <span className="font-semibold text-slate-800">URCARE Quarantine Center</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>74 Bed Capacity</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Quick Role Switcher for Campus Assessment */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            disabled={isSwitching}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <span className="text-slate-400">Role:</span>
            <span className="font-semibold capitalize text-slate-900">{user.role}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white border border-slate-200 shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Assessment Account
              </div>
              {demoRoles.map((r) => (
                <button
                  key={r.role}
                  onClick={() => handleRoleSwitch(r.role)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                    user.role === r.role ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div>{r.label}</div>
                    <div className="text-[10px] text-slate-400">{r.email}</div>
                  </div>
                  {user.role === r.role && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reset Demo Data (Admin only) */}
        {user.role === 'admin' && (
          <button
            onClick={handleResetData}
            title="Restore Original Demo Data"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Demo</span>
          </button>
        )}

        {/* Notifications */}
        <NotificationsDropdown />
      </div>
    </header>
  );
}
