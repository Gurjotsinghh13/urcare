'use client';

import * as React from 'react';
import { 
  UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      <div className="bg-white p-5 rounded-lg border border-[#EAE3E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202124] tracking-tight">Staff Governance & Permissions</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Manage clinical and operational user credentials, role permissions, and access status.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-1.5">
          <UserPlus className="w-3.5 h-3.5" />
          Add Staff Member
        </Button>
      </div>

      {/* Staff Table */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Authorized Personnel Roster</CardTitle>
          <span className="text-xs text-[#6B7280]">{staff.length} registered accounts</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EAE3E5] bg-[#FAF8F8] text-[#6B7280] font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Email Address</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Phone</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3E5]/60">
                {staff.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAF8F8]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#202124]">{u.full_name}</td>
                    <td className="py-3 px-4 text-[#6B7280] font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getRoleBadgeColor(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#6B7280]">{u.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                        u.is_active ? 'bg-[#F0F7F4] text-[#27805B] border-[#D1E7DD]' : 'bg-[#FDF2F2] text-[#C04444] border-[#F8D7DA]'
                      }`}>
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
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
            <div className="p-3 bg-[#FDF2F2] border border-[#F8D7DA] rounded-md text-xs text-[#C04444] font-medium">
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
            <label className="block text-xs font-medium text-[#202124]">Role & System Permissions *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full h-9 rounded-md border border-[#EAE3E5] bg-white px-3 py-1 text-sm text-[#202124] focus:outline-none focus:border-[#E88770]"
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

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#EAE3E5]">
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
