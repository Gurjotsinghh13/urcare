'use client';

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
  ShieldAlert,
  Building2
} from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { getRoleBadgeColor } from '@/lib/utils';

interface SidebarProps {
  user: UserProfile;
}

export function Sidebar({ user }: SidebarProps) {
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

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor', 'nurse', 'manager'] },
    { label: 'Patients', href: '/patients', icon: Users, roles: ['admin', 'doctor', 'nurse', 'manager'] },
    { label: 'Temperatures', href: '/temperatures', icon: Thermometer, roles: ['admin', 'doctor', 'nurse', 'manager'] },
    { label: 'Doctor Rounds', href: '/rounds', icon: Stethoscope, roles: ['admin', 'doctor', 'nurse', 'manager'] },
    { label: 'Discharges', href: '/discharges', icon: DoorOpen, roles: ['admin', 'doctor', 'nurse', 'manager'] },
    { label: 'Analytics & Reports', href: '/analytics', icon: BarChart3, roles: ['admin', 'doctor', 'nurse', 'manager'] },
    { label: 'Staff Management', href: '/staff', icon: UserCog, roles: ['admin'] },
    { label: 'Facility Settings', href: '/settings', icon: Settings, roles: ['admin', 'doctor', 'manager'] },
  ];

  const allowedNav = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 select-none h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            U
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-slate-900">URCARE</span>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold border border-blue-200">PRO</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-none">Quarantine System</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Clinical Workspace
          </div>
          {allowedNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile & Role */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${getRoleBadgeColor(user.role)}`}>
              {user.role}
            </span>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-xs font-semibold text-slate-900 truncate" title={user.full_name}>
            {user.full_name}
          </div>
          <div className="text-[11px] text-slate-500 truncate" title={user.email}>
            {user.email}
          </div>
        </div>
      </div>
    </aside>
  );
}
