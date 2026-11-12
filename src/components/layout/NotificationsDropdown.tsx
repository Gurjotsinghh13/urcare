'use client';

import * as React from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { AppNotification } from '@/lib/types';
import { formatTime } from '@/lib/rules';

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  };

  React.useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'all' }),
      });
      fetchNotifs();
    } catch {}
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md text-[#6B7280] hover:text-[#202124] hover:bg-[#F7F0F1] transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-[#E88770] ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-[#EAE3E5] shadow-[0_10px_25px_-5px_rgba(32,33,36,0.1)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between p-3.5 border-b border-[#EAE3E5]/70 bg-[#FAF8F8]/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#202124]">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-[#FCEEF1] text-[#E88770] px-1.5 py-0.2 rounded font-semibold border border-[#F4C7D3]">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-[#E88770] hover:text-[#D97660] font-medium flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#EAE3E5]/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B7280]">No active notifications</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 hover:bg-[#FAF8F8] transition-colors ${!n.is_read ? 'bg-[#FCEEF1]/25' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-[#202124]">{n.title}</p>
                    <span className="text-[10px] text-[#6B7280] whitespace-nowrap">
                      {formatTime(n.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{n.message}</p>
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#E88770] hover:text-[#D97660] mt-1.5"
                    >
                      View details <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
