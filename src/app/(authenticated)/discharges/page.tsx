'use client';

import * as React from 'react';
import { 
  DoorOpen, 
  ShieldCheck, 
  ChevronLeft,
  ChevronRight
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

  const [page, setPage] = React.useState(1);
  const pageSize = 10;

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
        <div className="w-7 h-7 border-2 border-[#E88770] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { awaitingDoctorReview = [], approvedAwaitingAdmin = [], completedDischarges = [] } = data || {};
  const role = currentUser?.role;

  // Pagination for completed log
  const totalCompleted = completedDischarges.length;
  const totalPages = Math.max(1, Math.ceil(totalCompleted / pageSize));
  const paginatedCompleted = completedDischarges.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-[#EAE3E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202124] tracking-tight">Quarantine Discharge Management Hub</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Standard Operating Procedure: 3 consecutive calendar fever-free days &gt; Doctor Clinical Approval &gt; Administrator Finalization & Bed Release.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#202124] bg-[#FAF8F8] px-3 py-1.5 rounded-md border border-[#EAE3E5]">
          <span className="font-semibold">Rule:</span>
          <span>≥ 3 Complete Afebrile Days Required</span>
        </div>
      </div>

      {/* 5-Step Process Progress Bar Visual Indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            {[
              { step: '1', title: 'Daily Vitals Tracking', desc: 'No fever (34–37.9°C)' },
              { step: '2', title: '3 Fever-Free Days', desc: 'Eligibility trigger' },
              { step: '3', title: 'Physician Review', desc: 'Clinical sign-off' },
              { step: '4', title: 'Admin Finalization', desc: 'Release bed' },
              { step: '5', title: 'Discharge Outcome', desc: 'Recovered certified' },
            ].map((s, idx) => (
              <div key={s.step} className="flex items-center gap-2 w-full sm:w-auto">
                <span className="w-6 h-6 rounded-full bg-[#FCEEF1] text-[#E88770] border border-[#F4C7D3] font-bold text-[11px] flex items-center justify-center shrink-0">
                  {s.step}
                </span>
                <div>
                  <div className="font-semibold text-[#202124] text-[11px]">{s.title}</div>
                  <div className="text-[10px] text-[#6B7280]">{s.desc}</div>
                </div>
                {idx < 4 && <div className="hidden lg:block w-6 h-[1px] bg-[#EAE3E5] mx-1" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2-Step Active Review Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Doctor Review Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Doctor Clinical Review Queue</CardTitle>
                <span className="text-xs text-[#6B7280]">Patients with 3+ fever-free days awaiting physician clearance</span>
              </div>
              <Badge variant="accent">{awaitingDoctorReview.length} Pending</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {awaitingDoctorReview.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#6B7280]">
                No patients currently awaiting doctor review.
              </div>
            ) : (
              <div className="divide-y divide-[#EAE3E5]/60">
                {awaitingDoctorReview.map((item: any) => (
                  <div key={item.patient.id} className="py-3.5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#202124]">{item.patient.full_name}</span>
                          <span className="text-[10px] font-medium bg-[#FAF8F8] text-[#202124] px-1.5 py-0.5 rounded border border-[#EAE3E5]">
                            Bed {item.patient.bed_number}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#6B7280] mt-0.5">
                          Streak: <span className="font-semibold text-[#27805B]">{item.streak} days afebrile</span> • Admitted: {item.patient.admission_date}
                        </div>
                      </div>

                      {/* Doctor Action Button */}
                      {(role === 'doctor' || role === 'admin') ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenDoctorReview(item)}
                          className="text-xs gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Doctor Review</span>
                        </Button>
                      ) : (
                        <span className="text-[11px] text-[#6B7280] italic">Physician Review Required</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Administrator Finalization & Bed Release */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Administrator Finalization</CardTitle>
                <span className="text-xs text-[#6B7280]">Doctor-approved patients awaiting formal bed release</span>
              </div>
              <Badge variant="success">{approvedAwaitingAdmin.length} Approved</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {approvedAwaitingAdmin.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#6B7280]">
                No approved discharges awaiting administrative finalization.
              </div>
            ) : (
              <div className="divide-y divide-[#EAE3E5]/60">
                {approvedAwaitingAdmin.map((item: any) => (
                  <div key={item.patient.id} className="py-3.5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#202124]">{item.patient.full_name}</span>
                          <span className="text-[10px] font-semibold bg-[#F0F7F4] text-[#27805B] border border-[#D1E7DD] px-1.5 py-0.5 rounded">
                            Cleared for Discharge
                          </span>
                        </div>
                        <div className="text-[11px] text-[#6B7280] mt-1">
                          Current Bed: <span className="font-semibold text-[#202124]">Bed {item.patient.bed_number}</span> (Will be released upon sign-off)
                        </div>
                        {item.dischargeRequest?.doctor_notes && (
                          <p className="text-[11px] text-[#6B7280] italic mt-1 bg-[#FAF8F8] p-2 rounded border border-[#EAE3E5]">
                            &ldquo;{item.dischargeRequest.doctor_notes}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Admin Action Button */}
                      {role === 'admin' ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenAdminFinalize(item)}
                          className="text-xs gap-1 bg-[#27805B] hover:bg-[#1E6B4B]"
                        >
                          <DoorOpen className="w-3.5 h-3.5" />
                          <span>Finalize & Free Bed</span>
                        </Button>
                      ) : (
                        <span className="text-[11px] text-[#6B7280] italic">Administrator Sign-off Required</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historical Discharge Log Table */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Historical Discharge Log</CardTitle>
          <span className="text-xs text-[#6B7280]">Recovered patients successfully completed quarantine</span>
        </CardHeader>
        <CardContent className="p-0">
          {completedDischarges.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#6B7280]">No completed discharges yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EAE3E5] bg-[#FAF8F8] text-[#6B7280] font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-4">Discharge Date</th>
                    <th className="py-2.5 px-4">Patient ID</th>
                    <th className="py-2.5 px-4">Finalized By</th>
                    <th className="py-2.5 px-4">Outcome</th>
                    <th className="py-2.5 px-4">Bed Release Status</th>
                    <th className="py-2.5 px-4">Discharge Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3E5]/60">
                  {paginatedCompleted.map((d: any) => (
                    <tr key={d.id} className="hover:bg-[#FAF8F8]/60 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-[#202124]">{d.discharge_date}</td>
                      <td className="py-2.5 px-4 font-semibold text-[#202124]">{d.patient_id}</td>
                      <td className="py-2.5 px-4 text-[#6B7280]">{d.finalized_by_name || 'Administrator'}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] font-semibold text-[#27805B] bg-[#F0F7F4] px-2 py-0.5 rounded border border-[#D1E7DD]">
                          Recovered
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#27805B] font-medium">Released to Pool</td>
                      <td className="py-2.5 px-4 text-[#6B7280] italic max-w-xs truncate">{d.discharge_summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="p-3 border-t border-[#EAE3E5] bg-[#FAF8F8]/50 flex items-center justify-between text-xs text-[#6B7280]">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)} className="h-7 px-2">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="h-7 px-2">
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
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
