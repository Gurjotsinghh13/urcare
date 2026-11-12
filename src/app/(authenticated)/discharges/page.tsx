'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  DoorOpen, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight,
  Eye,
  FileCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DischargeModal } from '@/components/modals/DischargeModal';

export default function DischargesPage() {
  const [data, setData] = React.useState<any>(null);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [modalState, setModalState] = React.useState<{
    isOpen: boolean;
    mode: 'doctor_review' | 'admin_finalize';
    patient: any;
    requestId?: string;
  }>({
    isOpen: false,
    mode: 'doctor_review',
    patient: null,
  });

  const fetchData = async () => {
    try {
      const [dischRes, meRes] = await Promise.all([
        fetch('/api/discharges'),
        fetch('/api/auth/me'),
      ]);
      if (dischRes.ok) {
        const json = await dischRes.json();
        setData(json);
      }
      if (meRes.ok) {
        const meJson = await meRes.json();
        setCurrentUser(meJson.user);
      }
    } catch {}
    setLoading(false);
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDoctorReview = (item: any) => {
    setModalState({
      isOpen: true,
      mode: 'doctor_review',
      patient: item.patient,
      requestId: item.dischargeRequest?.id,
    });
  };

  const handleOpenAdminFinalize = (item: any) => {
    setModalState({
      isOpen: true,
      mode: 'admin_finalize',
      patient: item.patient,
      requestId: item.dischargeRequest?.id,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { awaitingDoctorReview = [], approvedAwaitingAdmin = [], completedDischarges = [] } = data || {};
  const role = currentUser?.role;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Quarantine Discharge Management Hub</h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard Operating Procedure: 3 consecutive calendar fever-free days &gt; Doctor Clinical Approval &gt; Administrator Finalization & Bed Release.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="font-semibold text-slate-900">Rule:</span>
          <span>≥ 3 Complete Afebrile Days Required</span>
        </div>
      </div>

      {/* 2-Step Workflow Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Doctor Review Queue */}
        <Card className="border-t-4 border-t-blue-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Step 1: Doctor Clinical Review</CardTitle>
                <span className="text-xs text-slate-500">Patients with 3+ fever-free days awaiting physician clearance</span>
              </div>
              <Badge variant="info">{awaitingDoctorReview.length} Pending</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {awaitingDoctorReview.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No patients currently awaiting doctor review.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {awaitingDoctorReview.map((item: any) => (
                  <div key={item.patient.id} className="py-3.5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{item.patient.full_name}</span>
                          <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            Bed {item.patient.bed_number}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Streak: <span className="font-semibold text-emerald-700">{item.streak} days afebrile</span> • Admitted: {item.patient.admission_date}
                        </div>
                      </div>

                      {/* Doctor Action Button */}
                      {(role === 'doctor' || role === 'admin') ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenDoctorReview(item)}
                          className="text-xs gap-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Doctor Review</span>
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Doctor Action Required</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Administrator Finalization & Bed Release */}
        <Card className="border-t-4 border-t-emerald-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Step 2: Administrator Finalization</CardTitle>
                <span className="text-xs text-slate-500">Doctor-approved patients awaiting formal administrative bed release</span>
              </div>
              <Badge variant="success">{approvedAwaitingAdmin.length} Approved</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {approvedAwaitingAdmin.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No approved discharges awaiting administrative finalization.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {approvedAwaitingAdmin.map((item: any) => (
                  <div key={item.patient.id} className="py-3.5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{item.patient.full_name}</span>
                          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                            Cleared for Discharge
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1">
                          Current Bed: <span className="font-semibold text-slate-900">Bed {item.patient.bed_number}</span> (Will be released upon sign-off)
                        </div>
                        {item.dischargeRequest?.doctor_notes && (
                          <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 p-2 rounded">
                            &ldquo;{item.dischargeRequest.doctor_notes}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Admin Action Button */}
                      {role === 'admin' ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenAdminFinalize(item)}
                          className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <DoorOpen className="w-3.5 h-3.5" />
                          <span>Finalize & Free Bed</span>
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Admin Action Required</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completed Discharges Log */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Discharge Log</CardTitle>
          <span className="text-xs text-slate-500">Recovered patients successfully completed quarantine</span>
        </CardHeader>
        <CardContent>
          {completedDischarges.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No completed discharges yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Discharge Date</th>
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Finalized By</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">Bed Release Status</th>
                    <th className="py-2.5 px-3">Discharge Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedDischarges.map((d: any) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-800">{d.discharge_date}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{d.patient_id}</td>
                      <td className="py-2.5 px-3 text-slate-600">{d.finalized_by_name || 'Administrator'}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Recovered
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-emerald-600 font-medium">Released to Pool</td>
                      <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">{d.discharge_summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discharge Modal */}
      {modalState.patient && (
        <DischargeModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ isOpen: false, mode: 'doctor_review', patient: null })}
          onSuccess={fetchData}
          mode={modalState.mode}
          patientId={modalState.patient.id}
          patientName={modalState.patient.full_name}
          patientCode={modalState.patient.patient_code}
          bedNumber={modalState.patient.bed_number}
          requestId={modalState.requestId}
        />
      )}
    </div>
  );
}
