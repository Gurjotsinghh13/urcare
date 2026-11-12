'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Bed, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Thermometer, 
  Stethoscope, 
  Clock, 
  FileText, 
  Plus,
  ShieldCheck,
  DoorOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getStatusBadge } from '@/lib/utils';
import { RecordTempModal } from '@/components/modals/RecordTempModal';
import { DoctorVisitModal } from '@/components/modals/DoctorVisitModal';
import { DischargeModal } from '@/components/modals/DischargeModal';
import { formatTime, formatDate } from '@/lib/rules';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [data, setData] = React.useState<any>(null);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'vitals' | 'visits' | 'notes' | 'discharge'>('vitals');

  // Modals
  const [showTempModal, setShowTempModal] = React.useState(false);
  const [showVisitModal, setShowVisitModal] = React.useState(false);
  const [showDischargeModal, setShowDischargeModal] = React.useState(false);
  const [dischargeMode, setDischargeMode] = React.useState<'doctor_review' | 'admin_finalize'>('doctor_review');

  const fetchPatientDetails = async () => {
    try {
      const [patRes, meRes] = await Promise.all([
        fetch(`/api/patients/${patientId}`),
        fetch('/api/auth/me'),
      ]);
      if (patRes.ok) {
        const json = await patRes.json();
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
    fetchPatientDetails();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || !data.patient) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Patient record not found. <Link href="/patients" className="text-blue-600 underline">Back to registry</Link>
      </div>
    );
  }

  const { patient, clinical, temperatures, visits, treatmentNotes, dischargeRequests, outcome } = data;
  const statusInfo = getStatusBadge(patient.status);
  const role = currentUser?.role;

  return (
    <div className="space-y-6">
      {/* Back button & Patient Header Card */}
      <div>
        <Link 
          href="/patients" 
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Patient Registry
        </Link>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">{patient.full_name}</h1>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {patient.patient_code}
              </span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              <span>{patient.age} years old • {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Admitted: {patient.admission_date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium text-slate-800">
                <Bed className="w-3.5 h-3.5 text-blue-600" />
                {patient.bed_number ? `Bed ${patient.bed_number}` : 'Bed Released'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {patient.status !== 'discharged' && patient.status !== 'deceased' && (
              <>
                {(role === 'nurse' || role === 'admin') && (
                  <Button size="sm" onClick={() => setShowTempModal(true)} className="gap-1.5">
                    <Thermometer className="w-4 h-4" />
                    Record Vitals
                  </Button>
                )}

                {(role === 'doctor' || role === 'admin') && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowVisitModal(true)}
                    disabled={!clinical.canDoctorVisitToday && !clinical.todayVisit}
                    className="gap-1.5"
                  >
                    <Stethoscope className="w-4 h-4" />
                    {clinical.todayVisit ? 'Rounds Done Today' : 'Conduct Doctor Rounds'}
                  </Button>
                )}

                {/* Doctor Discharge Review */}
                {role === 'doctor' && clinical.isDischargeEligible && patient.status === 'discharge_eligible' && (
                  <Button 
                    size="sm" 
                    variant="primary"
                    onClick={() => {
                      setDischargeMode('doctor_review');
                      setShowDischargeModal(true);
                    }}
                    className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Approve Discharge Readiness
                  </Button>
                )}

                {/* Admin Finalize Discharge */}
                {role === 'admin' && patient.status === 'discharge_approved' && (
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setDischargeMode('admin_finalize');
                      setShowDischargeModal(true);
                    }}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <DoorOpen className="w-4 h-4" />
                    Finalize Discharge & Release Bed
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Clinical Afebrile Streak Tracker Card */}
      <Card className="border-l-4 border-l-blue-600">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Consecutive Fever-Free Progress</h3>
                <span className="text-[11px] text-slate-500">(Discharge Criteria: 3 consecutive complete days &lt; 38.0°C)</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                A missing routine measurement stops streak accumulation. Any fever spike (≥ 38.0°C) resets the count to 0 immediately.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-2xl font-extrabold text-slate-900">{clinical.feverFreeStreak}</span>
                <span className="text-xs text-slate-400"> / {clinical.daysRequired} Days</span>
              </div>
              <div className={`p-2 rounded-lg border ${
                clinical.feverFreeStreak >= clinical.daysRequired 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                {clinical.feverFreeStreak >= clinical.daysRequired ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-4">
        {[
          { id: 'vitals', label: `Temperatures (${temperatures.length})` },
          { id: 'visits', label: `Doctor Visits (${visits.length})` },
          { id: 'notes', label: `Nursing & Notes (${treatmentNotes.length})` },
          { id: 'discharge', label: 'Discharge & Outcome' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Temperatures */}
      {activeTab === 'vitals' && (
        <Card>
          <CardHeader>
            <CardTitle>Temperature Log History</CardTitle>
            <span className="text-xs text-slate-500">Chronological vital signs entries</span>
          </CardHeader>
          <CardContent>
            {temperatures.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No temperature records logged yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Reading (°C)</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Recorded By</th>
                      <th className="py-2.5 px-3">Clinical Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {temperatures.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-medium text-slate-800">{r.measurement_date}</td>
                        <td className="py-2.5 px-3 text-slate-500">{formatTime(r.measurement_time)}</td>
                        <td className="py-2.5 px-3 font-semibold">
                          <span className={r.is_fever ? 'text-red-600 font-bold' : 'text-slate-900'}>
                            {r.temp_celsius.toFixed(1)}°C
                          </span>
                          {r.is_fever && (
                            <span className="ml-1.5 text-[10px] font-bold bg-red-50 text-red-700 px-1.5 py-0.2 rounded border border-red-200">
                              Fever
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            r.is_routine ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {r.is_routine ? 'Routine' : 'Extra Check'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{r.recorded_by_name || 'Staff Nurse'}</td>
                        <td className="py-2.5 px-3 text-slate-500 italic">{r.notes || r.reason_for_extra || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Doctor Visits */}
      {activeTab === 'visits' && (
        <Card>
          <CardHeader>
            <CardTitle>Doctor Clinical Rounds</CardTitle>
            <span className="text-xs text-slate-500">Evaluations, diagnostic impressions, and treatment orders</span>
          </CardHeader>
          <CardContent className="space-y-4">
            {visits.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No physician rounds documented yet</div>
            ) : (
              visits.map((v: any) => (
                <div key={v.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-900">{v.doctor_name || 'Attending Physician'}</span>
                      <span className="text-[10px] text-slate-400">• {v.visit_date} at {formatTime(v.visit_time)}</span>
                    </div>
                    {v.temperature_reading && (
                      <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Vitals on Rounds: {v.temperature_reading.toFixed(1)}°C
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-500">Observations:</span>
                    <p className="text-xs text-slate-800 leading-relaxed mt-0.5">{v.clinical_observations}</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-500">Treatment Plan:</span>
                    <p className="text-xs text-slate-800 leading-relaxed mt-0.5">{v.treatment_plan}</p>
                  </div>

                  {v.follow_up_instructions && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500">Follow-up:</span>
                      <p className="text-xs text-slate-600 italic mt-0.5">{v.follow_up_instructions}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Nursing & Treatment Notes */}
      {activeTab === 'notes' && (
        <Card>
          <CardHeader>
            <CardTitle>Multidisciplinary Treatment Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {treatmentNotes.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No notes recorded</div>
            ) : (
              treatmentNotes.map((n: any) => (
                <div key={n.id} className="p-3 rounded-lg border border-slate-100 bg-white space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">{n.author_name} ({n.author_role})</span>
                    <span className="text-slate-400">{formatTime(n.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{n.content}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Discharge & Outcome */}
      {activeTab === 'discharge' && (
        <Card>
          <CardHeader>
            <CardTitle>Discharge & Outcome Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Discharge Workflow Status</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded bg-white border border-slate-200">
                  <span className="text-slate-500 text-[11px]">Step 1: Clinical Streak</span>
                  <div className="font-semibold mt-1">
                    {clinical.feverFreeStreak >= 3 ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Met (3/3 days)
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {clinical.feverFreeStreak}/3 days
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded bg-white border border-slate-200">
                  <span className="text-slate-500 text-[11px]">Step 2: Doctor Approval</span>
                  <div className="font-semibold mt-1">
                    {patient.status === 'discharge_approved' || patient.status === 'discharged' ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                      </span>
                    ) : (
                      <span className="text-slate-500">Pending Physician Review</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded bg-white border border-slate-200">
                  <span className="text-slate-500 text-[11px]">Step 3: Admin Finalization</span>
                  <div className="font-semibold mt-1">
                    {patient.status === 'discharged' ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Discharged & Released
                      </span>
                    ) : (
                      <span className="text-slate-500">Awaiting Finalization</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {outcome && (
              <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-1">
                <h4 className="text-xs font-bold text-slate-900">Official Outcome Record</h4>
                <div className="text-xs text-slate-700">Outcome Type: <span className="font-semibold uppercase">{outcome.outcome_type}</span></div>
                <div className="text-xs text-slate-500">Certified by: {outcome.recorded_by_name} on {outcome.outcome_date}</div>
                {outcome.cause_of_death && (
                  <div className="text-xs text-red-700 font-medium">Cause of Death: {outcome.cause_of_death}</div>
                )}
                {outcome.notes && <div className="text-xs text-slate-600 italic">{outcome.notes}</div>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <RecordTempModal
        isOpen={showTempModal}
        onClose={() => setShowTempModal(false)}
        onSuccess={fetchPatientDetails}
        initialPatientId={patient.id}
        patientName={patient.full_name}
        bedNumber={patient.bed_number}
      />

      <DoctorVisitModal
        isOpen={showVisitModal}
        onClose={() => setShowVisitModal(false)}
        onSuccess={fetchPatientDetails}
        patientId={patient.id}
        patientName={patient.full_name}
        bedNumber={patient.bed_number}
        todayTemperature={clinical.todayTemperature?.temp_celsius}
        nurseName={clinical.todayTemperature?.recorded_by_name}
      />

      <DischargeModal
        isOpen={showDischargeModal}
        onClose={() => setShowDischargeModal(false)}
        onSuccess={fetchPatientDetails}
        mode={dischargeMode}
        patientId={patient.id}
        patientName={patient.full_name}
        patientCode={patient.patient_code}
        bedNumber={patient.bed_number}
        streakCount={clinical.feverFreeStreak}
      />
    </div>
  );
}
