'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Bed, 
  Calendar, 
  CheckCircle2, 
  Thermometer, 
  Stethoscope, 
  Clock, 
  ShieldCheck, 
  DoorOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getStatusBadge } from '@/lib/utils';
import { RecordTempModal } from '@/components/modals/RecordTempModal';
import { DoctorVisitModal } from '@/components/modals/DoctorVisitModal';
import { DischargeModal } from '@/components/modals/DischargeModal';
import { formatTime } from '@/lib/rules';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

export default function PatientDetailPage() {
  const params = useParams();
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
        <div className="w-7 h-7 border-2 border-[#E88770] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || !data.patient) {
    return (
      <div className="p-8 text-center text-xs text-[#6B7280]">
        Patient record not found. <Link href="/patients" className="text-[#E88770] underline">Back to registry</Link>
      </div>
    );
  }

  const { patient, clinical, temperatures, visits, treatmentNotes, outcome } = data;
  const statusInfo = getStatusBadge(patient.status);
  const role = currentUser?.role;

  // Chart data from temperature history (reversed to chronological)
  const chartData = [...temperatures].reverse().map((t: any) => ({
    date: t.measurement_date.substring(5),
    temp: t.temp_celsius,
    fever: 38.0,
  }));

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link 
          href="/patients" 
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#202124] mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Patient Registry
        </Link>

        {/* Patient Header Card */}
        <div className="bg-white p-6 rounded-lg border border-[#EAE3E5] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[#202124] tracking-tight">{patient.full_name}</h1>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#FAF8F8] text-[#202124] border border-[#EAE3E5]">
                {patient.patient_code}
              </span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280] mt-2">
              <span>{patient.age} yrs • {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
                Admitted: {patient.admission_date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium text-[#202124]">
                <Bed className="w-3.5 h-3.5 text-[#E88770]" />
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
                    <Thermometer className="w-3.5 h-3.5" />
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
                    <Stethoscope className="w-3.5 h-3.5" />
                    {clinical.todayVisit ? 'Rounds Done Today' : 'Conduct Doctor Rounds'}
                  </Button>
                )}

                {/* Doctor Discharge Review */}
                {role === 'doctor' && clinical.isDischargeEligible && patient.status === 'discharge_eligible' && (
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setDischargeMode('doctor_review');
                      setShowDischargeModal(true);
                    }}
                    className="gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
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
                    className="gap-1.5 bg-[#27805B] hover:bg-[#1E6B4B]"
                  >
                    <DoorOpen className="w-3.5 h-3.5" />
                    Finalize Discharge & Release Bed
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Afebrile Streak Tracker Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#202124]">Consecutive Fever-Free Progress</h3>
                <span className="text-[11px] text-[#6B7280]">(Discharge Protocol: 3 complete calendar days &lt; 38.0°C)</span>
              </div>
              <p className="text-xs text-[#6B7280] mt-1">
                A missing routine measurement stops streak accumulation. Any fever spike (≥ 38.0°C) resets the count to 0 immediately.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-2xl font-bold text-[#202124]">{clinical.feverFreeStreak}</span>
                <span className="text-xs text-[#6B7280]"> / {clinical.daysRequired} Days</span>
              </div>
              <div className={`p-2 rounded-md border ${
                clinical.feverFreeStreak >= clinical.daysRequired 
                  ? 'bg-[#F0F7F4] border-[#D1E7DD] text-[#27805B]' 
                  : 'bg-[#FAF8F8] border-[#EAE3E5] text-[#6B7280]'
              }`}>
                {clinical.feverFreeStreak >= clinical.daysRequired ? (
                  <CheckCircle2 className="w-5 h-5 text-[#27805B]" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-[#EAE3E5] flex items-center gap-4">
        {[
          { id: 'vitals', label: `Temperatures (${temperatures.length})` },
          { id: 'visits', label: `Doctor Visits (${visits.length})` },
          { id: 'notes', label: `Nursing & Notes (${treatmentNotes.length})` },
          { id: 'discharge', label: 'Discharge & Outcome' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#E88770] text-[#E88770]'
                : 'border-transparent text-[#6B7280] hover:text-[#202124]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Temperatures with Chart */}
      {activeTab === 'vitals' && (
        <div className="space-y-4">
          {chartData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Temperature Trendline (°C)</CardTitle>
                <span className="text-xs text-[#6B7280]">Fever threshold: 38.0°C</span>
              </CardHeader>
              <CardContent>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE3E5" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAE3E5' }} />
                      <YAxis domain={[35.5, 40]} tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAE3E5' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #EAE3E5', fontSize: '11px', boxShadow: 'none' }} />
                      <Line type="monotone" dataKey="temp" name="Reading" stroke="#E88770" strokeWidth={2} dot={{ r: 3, fill: '#E88770' }} />
                      <Line type="monotone" dataKey="fever" name="Fever Threshold" stroke="#C04444" strokeDasharray="4 4" strokeWidth={1} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Temperature Log History</CardTitle>
              <span className="text-xs text-[#6B7280]">Chronological vital signs entries</span>
            </CardHeader>
            <CardContent className="p-0">
              {temperatures.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#6B7280]">No temperature records logged yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#EAE3E5] bg-[#FAF8F8] text-[#6B7280] font-semibold uppercase text-[10px]">
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Time</th>
                        <th className="py-2.5 px-4">Reading (°C)</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4">Recorded By</th>
                        <th className="py-2.5 px-4">Clinical Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3E5]/60">
                      {temperatures.map((r: any) => (
                        <tr key={r.id} className="hover:bg-[#FAF8F8]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-[#202124]">{r.measurement_date}</td>
                          <td className="py-2.5 px-4 text-[#6B7280]">{formatTime(r.measurement_time)}</td>
                          <td className="py-2.5 px-4 font-semibold">
                            <span className={r.is_fever ? 'text-[#C04444]' : 'text-[#202124]'}>
                              {r.temp_celsius.toFixed(1)}°C
                            </span>
                            {r.is_fever && (
                              <span className="ml-1.5 text-[10px] font-bold bg-[#FDF2F2] text-[#C04444] px-1.5 py-0.2 rounded border border-[#F8D7DA]">
                                Fever
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                              r.is_routine ? 'bg-[#FAF8F8] text-[#202124] border-[#EAE3E5]' : 'bg-[#FDF8F0] text-[#B7791F] border-[#F3E5D0]'
                            }`}>
                              {r.is_routine ? 'Routine' : 'Extra Check'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[#6B7280]">{r.recorded_by_name || 'Staff Nurse'}</td>
                          <td className="py-2.5 px-4 text-[#6B7280] italic">{r.notes || r.reason_for_extra || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Doctor Visits */}
      {activeTab === 'visits' && (
        <Card>
          <CardHeader>
            <CardTitle>Doctor Clinical Rounds</CardTitle>
            <span className="text-xs text-[#6B7280]">Evaluations and treatment orders</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {visits.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#6B7280]">No physician rounds documented yet</div>
            ) : (
              visits.map((v: any) => (
                <div key={v.id} className="p-4 rounded-md border border-[#EAE3E5] bg-[#FAF8F8] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-3.5 h-3.5 text-[#E88770]" />
                      <span className="text-xs font-bold text-[#202124]">{v.doctor_name || 'Attending Physician'}</span>
                      <span className="text-[10px] text-[#6B7280]">• {v.visit_date} at {formatTime(v.visit_time)}</span>
                    </div>
                    {v.temperature_reading && (
                      <span className="text-xs font-semibold text-[#202124] bg-white px-2 py-0.5 rounded border border-[#EAE3E5]">
                        Vitals: {v.temperature_reading.toFixed(1)}°C
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[#6B7280]">Observations:</span>
                    <p className="text-xs text-[#202124] leading-relaxed mt-0.5">{v.clinical_observations}</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[#6B7280]">Treatment Plan:</span>
                    <p className="text-xs text-[#202124] leading-relaxed mt-0.5">{v.treatment_plan}</p>
                  </div>

                  {v.follow_up_instructions && (
                    <div>
                      <span className="text-[11px] font-semibold text-[#6B7280]">Follow-up:</span>
                      <p className="text-xs text-[#6B7280] italic mt-0.5">{v.follow_up_instructions}</p>
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
          <CardContent className="space-y-2.5">
            {treatmentNotes.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#6B7280]">No notes recorded</div>
            ) : (
              treatmentNotes.map((n: any) => (
                <div key={n.id} className="p-3 rounded-md border border-[#EAE3E5] bg-white space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#202124]">{n.author_name} ({n.author_role})</span>
                    <span className="text-[#6B7280]">{formatTime(n.created_at)}</span>
                  </div>
                  <p className="text-xs text-[#202124] leading-relaxed">{n.content}</p>
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
            <div className="p-4 rounded-md border border-[#EAE3E5] bg-[#FAF8F8] space-y-3">
              <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider">Discharge Workflow Status</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded bg-white border border-[#EAE3E5]">
                  <span className="text-[#6B7280] text-[11px]">Step 1: Clinical Streak</span>
                  <div className="font-semibold mt-1">
                    {clinical.feverFreeStreak >= 3 ? (
                      <span className="text-[#27805B] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Met (3/3 days)
                      </span>
                    ) : (
                      <span className="text-[#B7791F] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {clinical.feverFreeStreak}/3 days
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded bg-white border border-[#EAE3E5]">
                  <span className="text-[#6B7280] text-[11px]">Step 2: Doctor Approval</span>
                  <div className="font-semibold mt-1">
                    {patient.status === 'discharge_approved' || patient.status === 'discharged' ? (
                      <span className="text-[#27805B] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                      </span>
                    ) : (
                      <span className="text-[#6B7280]">Pending Physician</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded bg-white border border-[#EAE3E5]">
                  <span className="text-[#6B7280] text-[11px]">Step 3: Admin Finalization</span>
                  <div className="font-semibold mt-1">
                    {patient.status === 'discharged' ? (
                      <span className="text-[#27805B] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Discharged & Released
                      </span>
                    ) : (
                      <span className="text-[#6B7280]">Awaiting Finalization</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {outcome && (
              <div className="p-4 rounded-md border border-[#EAE3E5] bg-white space-y-1">
                <h4 className="text-xs font-bold text-[#202124]">Official Outcome Record</h4>
                <div className="text-xs text-[#202124]">Outcome Type: <span className="font-semibold uppercase">{outcome.outcome_type}</span></div>
                <div className="text-xs text-[#6B7280]">Certified by: {outcome.recorded_by_name} on {outcome.outcome_date}</div>
                {outcome.cause_of_death && (
                  <div className="text-xs text-[#C04444] font-medium">Cause of Death: {outcome.cause_of_death}</div>
                )}
                {outcome.notes && <div className="text-xs text-[#6B7280] italic">{outcome.notes}</div>}
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
