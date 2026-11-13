'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ChevronDown, CheckCircle2, Menu } from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';
import { UserProfile } from '@/lib/types';

interface NavbarProps {
  user: UserProfile;
  onToggleMobileMenu?: () => void;
}

export function Navbar({ user, onToggleMobileMenu }: NavbarProps) {
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
    <header className="h-16 border-b border-[#EAE3E5] bg-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Left controls & Facility Status */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded-md text-[#6B7280] hover:text-[#202124] hover:bg-[#FAF8F8] border border-[#EAE3E5]"
          title="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="text-xs font-medium text-[#6B7280]">
          Facility: <span className="font-semibold text-[#202124]">URCARE Quarantine Center</span>
        </div>
        <span className="text-[#EAE3E5] hidden sm:inline">|</span>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#202124] bg-[#FAF8F8] px-2.5 py-1 rounded-md border border-[#EAE3E5]">
          <span className="w-2 h-2 rounded-full bg-[#27805B]" />
          <span>80 Bed Capacity</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5">
        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            disabled={isSwitching}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border border-[#EAE3E5] bg-[#FAF8F8] hover:bg-[#F7F0F1] text-[#202124] transition-colors"
          >
            <span className="text-[#6B7280]">Role:</span>
            <span className="font-semibold capitalize text-[#202124]">{user.role}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-[#EAE3E5] shadow-[0_10px_25px_-5px_rgba(32,33,36,0.1)] z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                Switch Assessment Account
              </div>
              {demoRoles.map((r) => (
                <button
                  key={r.role}
                  onClick={() => handleRoleSwitch(r.role)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                    user.role === r.role ? 'bg-[#FCEEF1] text-[#202124] font-semibold' : 'text-[#202124] hover:bg-[#FAF8F8]'
                  }`}
                >
                  <div>
                    <div>{r.label}</div>
                    <div className="text-[10px] text-[#6B7280]">{r.email}</div>
                  </div>
                  {user.role === r.role && <CheckCircle2 className="w-3.5 h-3.5 text-[#E88770]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reset Demo Data (Admin only) */}
        {user.role === 'admin' && (
          <button
            onClick={handleResetData}
            title="Restore Assessment Data"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#6B7280] hover:text-[#202124] hover:bg-[#FAF8F8] transition-colors border border-transparent hover:border-[#EAE3E5]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>Reset Demo</span>
          </button>
        )}

        {/* Notifications */}
        <NotificationsDropdown />
      </div>
    </header>
  );
}
