'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Stethoscope, 
  Thermometer, 
  Building2, 
  ArrowRight,
  Lock,
  Mail,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = React.useState<string | null>(null);

  const demoAccounts = [
    {
      role: 'admin',
      title: 'Administrator',
      email: 'admin@urcare.demo',
      password: 'URcareDemo!2026',
      icon: ShieldCheck,
      description: 'Full facility oversight, bed management & final discharges',
      color: 'border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-purple-900',
    },
    {
      role: 'doctor',
      title: 'Doctor',
      email: 'doctor@urcare.demo',
      password: 'URcareDemo!2026',
      icon: Stethoscope,
      description: 'Clinical rounds, treatment notes & discharge readiness approval',
      color: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-900',
    },
    {
      role: 'nurse',
      title: 'Nurse',
      email: 'nurse@urcare.demo',
      password: 'URcareDemo!2026',
      icon: Thermometer,
      description: 'Daily routine vitals logging & fever case identification',
      color: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900',
    },
    {
      role: 'manager',
      title: 'Facility Manager',
      email: 'manager@urcare.demo',
      password: 'URcareDemo!2026',
      icon: Building2,
      description: 'Read-only capacity monitoring & operational CSV analytics',
      color: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-900',
    },
  ];

  const handleSelectDemo = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setSelectedDemoRole(acc.role);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-click Demo Log in
  const handleInstantDemoLogin = async (role: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Demo login failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo & Name */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-extrabold text-2xl shadow-md mb-3">
          U
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">URCARE</h1>
        <p className="text-xs font-semibold text-blue-600 mt-0.5 uppercase tracking-wide">
          Smart Quarantine Facility Management System
        </p>
        <p className="text-xs text-slate-500 mt-1 italic">
          &ldquo;Better Coordination. Faster Recovery. Smarter Care.&rdquo;
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200 rounded-xl space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                label="Staff Email Address"
                type="email"
                placeholder="name@urcare.demo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" size="md" className="w-full gap-2" isLoading={loading}>
              <span>Sign In to URCARE</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Demo Login Quick Panel */}
          <div className="pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Campus Assessment Demo Accounts
              </span>
              <span className="text-[11px] text-slate-400">Click to autofill or login</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                const isSelected = selectedDemoRole === acc.role;
                return (
                  <div
                    key={acc.role}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${acc.color} ${
                      isSelected ? 'ring-2 ring-blue-600' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">{acc.title}</span>
                        <Icon className="w-4 h-4 opacity-70" />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight mb-2">
                        {acc.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => handleSelectDemo(acc)}
                        className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white/80 px-2 py-1 rounded border border-slate-200 flex-1 text-center"
                      >
                        Autofill
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInstantDemoLogin(acc.role)}
                        disabled={loading}
                        className="text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded shadow-xs"
                      >
                        Login →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-400 mt-6">
          URCARE Healthcare System • Protected by Role-Based Access Control & Row Level Security
        </p>
      </div>
    </div>
  );
}
