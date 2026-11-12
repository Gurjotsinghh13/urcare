'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Thermometer, 
  Stethoscope, 
  DoorOpen, 
  BarChart3, 
  UserCog, 
  Settings, 
  LogOut,
  Bell,
  X,
  HeartPulse
} from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { getRoleBadgeColor } from '@/lib/utils';

interface SidebarProps {
  user: UserProfile;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ user, isOpenMobile = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  // Structured Navigation Groups as specified in Section 4
  const navGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor', 'nurse', 'manager'] },
      ],
    },
    {
      group: 'OPERATIONS',
      items: [
        { label: 'Patients', href: '/patients', icon: Users, roles: ['admin', 'doctor', 'nurse', 'manager'] },
        { label: 'Temperature Records', href: '/temperatures', icon: Thermometer, roles: ['admin', 'doctor', 'nurse', 'manager'] },
        { label: 'Doctor Rounds', href: '/rounds', icon: Stethoscope, roles: ['admin', 'doctor', 'nurse', 'manager'] },
        { label: 'Discharge Management', href: '/discharges', icon: DoorOpen, roles: ['admin', 'doctor', 'nurse', 'manager'] },
      ],
    },
    {
      group: 'MANAGEMENT',
      items: [
        { label: 'Staff', href: '/staff', icon: UserCog, roles: ['admin'] },
        { label: 'Analytics & Reports', href: '/analytics', icon: BarChart3, roles: ['admin', 'doctor', 'nurse', 'manager'] },
        { label: 'Facility Settings', href: '/settings', icon: Settings, roles: ['admin', 'doctor', 'manager'] },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-[#202124]/20 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-[#EAE3E5] flex flex-col justify-between shrink-0 select-none transition-transform duration-200 ease-in-out
        ${isOpenMobile ? 'translate-x-0 shadow-lg' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#EAE3E5]/70 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E88770] flex items-center justify-center text-white shadow-xs">
                <HeartPulse className="w-4 h-4 text-white stroke-[2.5]" />
              </div>
              <div>
                <span className="font-bold text-[15px] tracking-tight text-[#202124]">URCARE</span>
                <p className="text-[11px] text-[#6B7280] font-medium leading-none mt-0.5">Facility Management</p>
              </div>
            </div>

            {/* Mobile close button */}
            {isOpenMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1 rounded-md text-[#6B7280] hover:text-[#202124] hover:bg-[#F7F0F1]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Groups */}
          <div className="p-3.5 space-y-5">
            {navGroups.map((group) => {
              const allowedItems = group.items.filter((item) => item.roles.includes(user.role));
              if (allowedItems.length === 0) return null;

              return (
                <div key={group.group} className="space-y-1">
                  <div className="px-3 text-[10px] font-bold text-[#6B7280] tracking-wider uppercase">
                    {group.group}
                  </div>
                  <nav className="space-y-0.5 mt-1">
                    {allowedItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onCloseMobile}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                            isActive
                              ? 'bg-[#FCEEF1] text-[#202124] font-semibold border border-[#F4C7D3]/40'
                              : 'text-[#6B7280] hover:text-[#202124] hover:bg-[#F7F0F1]'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#E88770]' : 'text-[#6B7280]'}`} />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Footer Profile & Role */}
        <div className="p-3 border-t border-[#EAE3E5]/70 bg-[#FAF8F8]/60 shrink-0">
          <div className="p-2.5 rounded-lg border border-[#EAE3E5] bg-white">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="text-[#6B7280] hover:text-[#C04444] p-1 rounded hover:bg-[#FDF2F2] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xs font-semibold text-[#202124] truncate" title={user.full_name}>
              {user.full_name}
            </div>
            <div className="text-[11px] text-[#6B7280] truncate font-mono mt-0.5" title={user.email}>
              {user.email}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
