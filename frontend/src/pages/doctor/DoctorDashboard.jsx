import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorApi, reportApi, appointmentApi } from '../../services/api';
import { 
  Stethoscope, Users, FileText, CheckCircle2, Clock, Sparkles, 
  Search, TrendingUp, Calendar, AlertCircle, ChevronRight, PenTool, X, Shield 
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientRecords, setPatientRecords] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('patients'); // 'patients', 'workspace', 'followups'

  // Consultation Note Authoring State
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [observations, setObservations] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [rxName, setRxName] = useState('');
  const [rxDosage, setRxDosage] = useState('');
  const [rxFrequency, setRxFrequency] = useState('Once daily');
  const [rxTiming, setRxTiming] = useState('With meal');
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [signedSuccess, setSignedSuccess] = useState('');

  // Dual Report Comparison in Doctor View
  const [compareId1, setCompareId1] = useState('');
  const [compareId2, setCompareId2] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const [pts, fus] = await Promise.all([
        doctorApi.getPatients(),
        doctorApi.getFollowUps()
      ]);
      setPatients(pts || []);
      setFollowUps(fus || []);

      if (pts && pts.length > 0) {
        setSelectedPatientId(pts[0].id);
        await loadPatientRecords(pts[0].id);
      }
    } catch (err) {
      console.error('Doctor data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientRecords = async (patientId) => {
    setRecordsLoading(true);
    try {
      const records = await doctorApi.getPatientRecords(patientId);
      setPatientRecords(records);
      // Pre-set comparison reports if >= 2 reports
      if (records.reports && records.reports.length >= 2) {
        setCompareId1(records.reports[1].id);
        setCompareId2(records.reports[0].id);
        const comp = await reportApi.compareReports(records.reports[1].id, records.reports[0].id);
        setComparisonResult(comp);
      } else {
        setComparisonResult(null);
      }
    } catch (err) {
      console.error('Error loading patient records:', err);
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, []);

  const handleSelectPatient = async (patientId) => {
    setSelectedPatientId(patientId);
    await loadPatientRecords(patientId);
    setActiveTab('workspace');
  };

  // 1. Create Consultation Draft (with AI Assistance)
  const handleCreateDraft = async (e) => {
    e.preventDefault();
    if (!selectedPatientId || !chiefComplaint) return;

    try {
      const payload = {
        patient_id: selectedPatientId,
        chief_complaint: chiefComplaint,
        clinical_observations: observations,
        follow_up_date: followUpDate || null,
        medications: rxName ? [{
          name: rxName,
          dosage: rxDosage,
          frequency: rxFrequency,
          timing: rxTiming,
          duration: '30 days'
        }] : null,
        prescription_instructions: rxName ? `Take ${rxName} as indicated by Dr. ${user.full_name}.` : null
      };

      const res = await doctorApi.createConsultation(payload);
      setActiveConsultation(res);
      setSignedSuccess('AI-assisted consultation draft created! Physician signature required below.');
      await loadPatientRecords(selectedPatientId);
    } catch (err) {
      alert('Error creating consultation: ' + err.message);
    }
  };

  // 2. Doctor Official Sign-off & Approval
  const handleApproveNote = async (consultationId, finalNotesText) => {
    try {
      const res = await doctorApi.approveConsultation(consultationId, {
        final_notes: finalNotesText,
        follow_up_date: followUpDate || null
      });
      setSignedSuccess(res.message);
      setActiveConsultation(null);
      setChiefComplaint('');
      setObservations('');
      setRxName('');
      await loadPatientRecords(selectedPatientId);
    } catch (err) {
      alert('Approval error: ' + err.message);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Doctor Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  Doctor Clinical Studio
                </span>
                <span className="text-xs text-slate-400">License: {user?.doctor_profile?.license_number || 'MD-ACTIVE'}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                {user?.full_name || 'Dr. Robert Vance, MD'}
              </h1>
              <p className="text-xs text-slate-500">
                Department: <strong>{user?.doctor_profile?.department || 'Cardiology & Internal Medicine'}</strong>
              </p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('patients')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
                  activeTab === 'patients' ? 'bg-blue-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Patients Directory ({patients.length})
              </button>
              <button
                onClick={() => setActiveTab('workspace')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
                  activeTab === 'workspace' ? 'bg-blue-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Clinical Workspace
              </button>
              <button
                onClick={() => setActiveTab('followups')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
                  activeTab === 'followups' ? 'bg-blue-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Follow-ups ({followUps.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {signedSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{signedSuccess}</span>
            </div>
            <button onClick={() => setSignedSuccess('')} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TAB 1: PATIENTS DIRECTORY */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">Authorized Patient Directory</h2>
              <span className="text-xs text-slate-500">Select any patient to review history and author consultation notes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patients.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => handleSelectPatient(p.id)}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-bold text-slate-900">{p.full_name}</h3>
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {p.blood_group || 'O+'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 space-y-1">
                      <p><strong>DOB:</strong> {p.dob || 'N/A'}</p>
                      <p><strong>Allergies:</strong> {p.allergies || 'None reported'}</p>
                      <p><strong>Conditions:</strong> {p.chronic_conditions || 'None'}</p>
                      <p><strong>Recent Lab:</strong> {p.recent_report_title} ({p.recent_report_date || 'None'})</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
                    <span>{p.reports_count} reports filed</span>
                    <span className="flex items-center space-x-1">
                      <span>Open Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CLINICAL WORKSPACE & REPORT COMPARISON STUDIO */}
        {activeTab === 'workspace' && patientRecords && (
          <div className="space-y-6">
            {/* Active Patient Summary Banner */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap justify-between items-center gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Patient Case</span>
                <h2 className="text-lg font-bold text-slate-900">{patientRecords.patient.full_name}</h2>
                <div className="flex gap-4 text-xs text-slate-600 mt-0.5">
                  <span>DOB: {patientRecords.patient.dob}</span>
                  <span>Blood: <strong className="text-red-600">{patientRecords.patient.blood_group}</strong></span>
                  <span>Allergies: <strong className="text-amber-700">{patientRecords.patient.allergies || 'None'}</strong></span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('patients')}
                className="text-xs text-slate-600 hover:text-slate-800 underline"
              >
                Change Patient
              </button>
            </div>

            {/* Side-by-Side Dual-Report Comparison Studio */}
            {comparisonResult && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-blue-800" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Side-by-Side Lab Comparison ({comparisonResult.report_previous?.report_date} vs {comparisonResult.report_current?.report_date})
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Units Validated
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Biomarker</th>
                        <th className="p-3">Reference Range</th>
                        <th className="p-3">Previous ({comparisonResult.report_previous?.report_date})</th>
                        <th className="p-3">Current ({comparisonResult.report_current?.report_date})</th>
                        <th className="p-3">Delta</th>
                        <th className="p-3">Clinical Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {comparisonResult.comparisons?.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-900">{c.test_name}</td>
                          <td className="p-3 text-slate-500">{c.reference_range}</td>
                          <td className="p-3 text-slate-700">{c.previous_value} {c.unit}</td>
                          <td className="p-3 font-bold text-slate-900">{c.current_value} {c.unit}</td>
                          <td className="p-3 font-mono">{c.delta > 0 ? `+${c.delta}` : c.delta} {c.unit}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.trend === 'stable' ? 'bg-slate-100 text-slate-700' :
                              c.trend === 'decreased' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {c.trend}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Consultation Note Authoring & Physician Sign-Off */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 6 cols: Consultation Creator */}
              <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                  <PenTool className="w-4 h-4 text-blue-800" />
                  <span>Author Consultation & Treatment Plan</span>
                </div>

                <form onSubmit={handleCreateDraft} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Complaint</label>
                    <textarea
                      required
                      rows={2}
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="e.g. 6-month cardiovascular and lipid follow-up. Patient reports good tolerance of diet."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Observations / Vitals</label>
                    <textarea
                      rows={2}
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="e.g. BP 124/80 mmHg, HR 68 bpm. Lungs clear, no peripheral edema."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Prescription Medication</label>
                      <input
                        type="text"
                        value={rxName}
                        onChange={(e) => setRxName(e.target.value)}
                        placeholder="e.g. Atorvastatin"
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage & Frequency</label>
                      <input
                        type="text"
                        value={rxDosage}
                        onChange={(e) => setRxDosage(e.target.value)}
                        placeholder="e.g. 10 mg at bedtime"
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Date</label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition shadow-xs flex items-center justify-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                    <span>Generate AI-Assisted Clinical Draft</span>
                  </button>
                </form>
              </div>

              {/* Right 6 cols: Clinical Note Approval Gate */}
              <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                    <Shield className="w-4 h-4 text-teal-600" />
                    <span>Physician Approval Gate</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Mandatory Sign-off
                  </span>
                </div>

                {activeConsultation ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      Review the draft note below. As the authorized physician, edit or confirm the documentation before signing.
                    </p>

                    <textarea
                      rows={8}
                      defaultValue={activeConsultation.ai_draft}
                      id="clinical-note-final-text"
                      className="w-full text-xs p-3 font-mono border border-slate-300 rounded-xl bg-slate-50/60 leading-relaxed"
                    />

                    <button
                      onClick={() => {
                        const textarea = document.getElementById('clinical-note-final-text');
                        handleApproveNote(activeConsultation.id, textarea.value);
                      }}
                      className="w-full py-2.5 px-4 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition shadow-xs flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Formally Sign Clinical Note</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">No Pending Clinical Note in Draft</p>
                    <p className="text-[11px] text-slate-500">
                      Fill out the consultation form on the left to create an AI-assisted draft for review and sign-off.
                    </p>
                  </div>
                )}

                {/* Past Approved Notes for this patient */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Signed Clinical History ({patientRecords.consultations?.length || 0})
                  </span>
                  {patientRecords.consultations?.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">{c.created_at?.split('T')[0]}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Doctor Signed ✓
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-normal">{c.final_notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FOLLOW-UPS MANAGEMENT */}
        {activeTab === 'followups' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Scheduled Patient Follow-ups</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Patient Name</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">Chief Complaint</th>
                    <th className="p-3.5">Target Follow-up Date</th>
                    <th className="p-3.5">Approval Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {followUps.map((f, i) => (
                    <tr key={i}>
                      <td className="p-3.5 font-bold text-slate-900">{f.patient_name}</td>
                      <td className="p-3.5 text-slate-500">{f.patient_phone || 'N/A'}</td>
                      <td className="p-3.5 text-slate-700">{f.chief_complaint}</td>
                      <td className="p-3.5 font-semibold text-blue-800">{f.follow_up_date}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Signed into Record
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

