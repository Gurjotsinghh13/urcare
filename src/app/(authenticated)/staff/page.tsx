'use client';

import * as React from 'react';
import { 
  UserCog, 
  UserPlus, 
  ShieldCheck, 
  Stethoscope, 
  Thermometer, 
  Building2, 
  Check, 
  X,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { getRoleBadgeColor } from '@/lib/utils';
import { UserProfile, UserRole } from '@/lib/types';

export default function StaffPage() {
  const [staff, setStaff] = React.useState<UserProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // New staff form state
  const [email, setEmail] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [role, setRole] = React.useState<UserRole>('nurse');
  const [phone, setPhone] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const json = await res.json();
        setStaff(json.staff || []);
      }
    } catch {}
    setLoading(false);
  };

  React.useEffect(() => {
    fetchStaff();
  }, []);

  const handleToggleStatus = async (user: UserProfile) => {
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_status', user_id: user.id }),
      });
      if (res.ok) {
        fetchStaff();
      } else {
        const json = await res.json();
        alert(json.error || 'Failed to update user status');
      }
    } catch {}
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          email,
          full_name: fullName,
          role,
          phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create staff');

      setShowAddModal(false);
      setEmail('');
      setFullName('');
      setPhone('');
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff Governance & Role-Based Access Control</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage clinical and operational user credentials, role permissions, and access status.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-1.5">
          <UserPlus className="w-4 h-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Authorized Personnel Roster</CardTitle>
          <span className="text-xs text-slate-500">{staff.length} registered accounts</span>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold text-slate-900">{u.full_name}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getRoleBadgeColor(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{u.phone || '—'}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        u.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        variant={u.is_active ? 'outline' : 'primary'}
                        onClick={() => handleToggleStatus(u)}
                        className="text-xs"
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Provision New Staff Member"
        description="Create account and assign role-based access permissions."
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <Input
            label="Full Name *"
            placeholder="e.g. Dr. Jennifer Adams"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="e.g. jadams@urcare.demo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">Role & System Permissions *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="nurse">Nurse (Record vitals, view patients)</option>
              <option value="doctor">Doctor (Clinical rounds, treatment notes, approve discharge readiness)</option>
              <option value="admin">Administrator (Full facility oversight, bed management, final discharge)</option>
              <option value="manager">Facility Manager (Read-only operational analytics & CSV reports)</option>
            </select>
          </div>

          <Input
            label="Phone Number (Optional)"
            placeholder="e.g. +1 (555) 019-3382"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Provision Staff Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
