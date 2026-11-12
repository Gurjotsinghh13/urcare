'use client';

import * as React from 'react';
import { 
  Settings, 
  Save, 
  ShieldAlert, 
  CheckCircle2, 
  Sliders, 
  Clock, 
  Bed
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<any>(null);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [feverThreshold, setFeverThreshold] = React.useState('38.0');
  const [requireApproval, setRequireApproval] = React.useState(true);
  const [capacity, setCapacity] = React.useState('74');
  const [isSaving, setIsSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchSettings = async () => {
    try {
      const [setRes, meRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/auth/me'),
      ]);
      if (setRes.ok) {
        const json = await setRes.json();
        setSettings(json.settings);
        setFeverThreshold(String(json.settings.fever_threshold));
        setRequireApproval(json.settings.require_doctor_approval);
        setCapacity(String(json.settings.capacity));
      }
      if (meRes.ok) {
        const meJson = await meRes.json();
        setCurrentUser(meJson.user);
      }
    } catch {}
    setLoading(false);
  };

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fever_threshold: parseFloat(feverThreshold),
          require_doctor_approval: requireApproval,
          capacity: parseInt(capacity, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      setMessage({ text: 'Facility clinical parameters successfully updated and applied.', type: 'success' });
      fetchSettings();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'doctor';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Facility Settings & Clinical Protocols</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure quarantine operational limits, clinical fever threshold, and discharge authorization policies.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-xs font-medium border flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-red-600" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Clinical Parameters Card */}
        <Card>
          <CardHeader>
            <CardTitle>Clinical Thresholds & Criteria</CardTitle>
            <span className="text-xs text-slate-500">Configured based on Chief Medical Officer directive</span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Fever Threshold (°C) *"
                  type="number"
                  step="0.1"
                  value={feverThreshold}
                  onChange={(e) => setFeverThreshold(e.target.value)}
                  disabled={!canEdit}
                  helperText="Standard quarantine criteria: 38.0°C. Valid range: 36.5°C – 40.0°C."
                  required
                />
              </div>

              <div>
                <Input
                  label="Mandatory Consecutive Fever-Free Days"
                  value="3 Full Calendar Days"
                  disabled
                  helperText="Fixed quarantine rule: 3 complete calendar days required for discharge."
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireApproval}
                  onChange={(e) => setRequireApproval(e.target.checked)}
                  disabled={!canEdit}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900">
                    Require Attending Physician Discharge Approval
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    When enabled, after 3 fever-free days, a patient requires explicit sign-off from Dr. Vance before Administrator final discharge can release the bed.
                  </p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Facility Operational Capacity Card */}
        <Card>
          <CardHeader>
            <CardTitle>Facility Bed Capacity & Governance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Maximum Facility Bed Capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  disabled={currentUser?.role !== 'admin'}
                  helperText="Maximum allowed quarantine beds (Default: 74)."
                  required
                />
              </div>

              <div>
                <Input
                  label="Facility Timezone"
                  value={settings?.timezone || 'Asia/Kolkata'}
                  disabled
                  helperText="Used for daily calendar midnight boundaries and routine measurement tracking."
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Minimum Sample Benchmark:</span> 20 completed patient outcomes required before statistical success rate is considered reliable.
            </div>
          </CardContent>
        </Card>

        {canEdit && (
          <div className="flex justify-end">
            <Button type="submit" size="md" isLoading={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              Save Facility Settings
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
