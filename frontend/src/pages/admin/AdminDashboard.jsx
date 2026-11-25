import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi, appointmentApi } from '../../services/api';
import { 
  Building2, Users, Stethoscope, Clock, Share2, BarChart3, 
  Plus, CheckCircle2, AlertCircle, RefreshCw, X, ChevronRight 
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'queue', 'patients', 'doctors', 'referrals'
  
  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [queue, setQueue] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);

  // New Doctor Form
  const [docName, setDocName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docPassword, setDocPassword] = useState('password123');
  const [docSpecialty, setDocSpecialty] = useState('Neurology');
  const [docDept, setDocDept] = useState('Neurology');
  const [docLicense, setDocLicense] = useState('');

  // New Referral Form
  const [refPatientId, setRefPatientId] = useState('');
  const [refDoctorId, setRefDoctorId] = useState('');
  const [refDept, setRefDept] = useState('Cardiology');
  const [refReason, setRefReason] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [anData, qData, pData, dData, rData] = await Promise.all([
        adminApi.getAnalytics(),
        adminApi.getQueue(),
        adminApi.getPatients(),
        adminApi.getDoctors(),
        adminApi.getReferrals()
      ]);

      setAnalytics(anData);
      setQueue(qData || []);
      setPatients(pData || []);
      setDoctors(dData || []);
      setReferrals(rData || []);

      if (pData?.length > 0) setRefPatientId(pData[0].id);
      if (dData?.length > 0) setRefDoctorId(dData[0].id);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Advance Queue Status
  const handleAdvanceQueue = async (queueId, nextStatus) => {
    try {
      await adminApi.updateQueueStatus(queueId, nextStatus);
      setSuccessMsg(`Queue token advanced to "${nextStatus}".`);
      await loadAdminData();
    } catch (err) {
      alert('Error updating queue status: ' + err.message);
    }
  };

  // Add Doctor
  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createDoctor({
        full_name: docName,
        email: docEmail,
        password: docPassword,
        specialization: docSpecialty,
        department: docDept,
        license_number: docLicense || `MD-${Date.now().toString().slice(-5)}`
      });
      setShowDoctorModal(false);
      setDocName('');
      setDocEmail('');
      setSuccessMsg('Doctor successfully registered in hospital roster.');
      await loadAdminData();
    } catch (err) {
      alert('Error creating doctor: ' + err.message);
    }
  };

  // Create Referral
  const handleCreateReferral = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createReferral({
        patient_id: refPatientId,
        from_doctor_id: refDoctorId,
        to_department: refDept,
        reason: refReason
      });
      setShowReferralModal(false);
      setRefReason('');
      setSuccessMsg('Inter-department referral created successfully.');
      await loadAdminData();
    } catch (err) {
      alert('Error creating referral: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center space-x-2 text-slate-700">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm font-semibold">Loading Hospital Command Center...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Admin Command Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-900/60 text-teal-300 border border-teal-700/60">
                  Hospital Admin Command
                </span>
                <span className="text-xs text-slate-400">Operations Console</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white mt-1">
                {user?.full_name || 'Elena Rostova'} — Operational Dashboard
              </h1>
              <p className="text-xs text-slate-400">
                Departmental coordination, outpatient queue tokens, physician roster, and workflow metrics.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'analytics' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Workflow Analytics
              </button>
              <button
                onClick={() => setActiveTab('queue')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'queue' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Queue Board ({queue.length})
              </button>
              <button
                onClick={() => setActiveTab('patients')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'patients' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Patients ({patients.length})
              </button>
              <button
                onClick={() => setActiveTab('doctors')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'doctors' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Doctors ({doctors.length})
              </button>
              <button
                onClick={() => setActiveTab('referrals')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'referrals' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Referrals ({referrals.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {successMsg && (
          <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-teal-700 hover:text-teal-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TAB 1: HOSPITAL WORKFLOW ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500">Registered Patients</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{analytics?.metrics?.total_patients || 0}</p>
                <span className="text-[10px] text-teal-700 font-bold">100% Synthetic sandbox data</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500">Physicians On Duty</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{analytics?.metrics?.total_doctors || 0}</p>
                <span className="text-[10px] text-blue-700 font-bold">Across 5 departments</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500">Diagnostic Reports Indexed</span>
                <p className="text-2xl font-extrabold text-teal-700 mt-1">{analytics?.metrics?.total_reports || 0}</p>
                <span className="text-[10px] text-slate-500">PyMuPDF automated extraction</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500">Signed Consultations</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{analytics?.metrics?.completed_consultations || 0}</p>
                <span className="text-[10px] text-emerald-700 font-bold">Doctor approved & signed</span>
              </div>
            </div>

            {/* Department Active Load Bars */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Hospital Department Workflow & Patient Load</h3>
              <div className="space-y-3">
                {analytics?.department_distribution?.map((d, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{d.department}</span>
                      <span>{d.active_patients} Outpatients</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-600 rounded-full" 
                        style={{ width: `${Math.min(d.active_patients * 20, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: APPOINTMENT & QUEUE MANAGEMENT */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">Outpatient Queue Management</h2>
                <p className="text-xs text-slate-500">Track department tokens and advance patients through consultation stages.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Token #</th>
                    <th className="p-3.5">Patient Name</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Advance Workflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.map((q) => (
                    <tr key={q.id}>
                      <td className="p-3.5 font-bold text-teal-700 font-mono text-sm">{q.token_number}</td>
                      <td className="p-3.5 font-bold text-slate-900">{q.patient_name}</td>
                      <td className="p-3.5 text-slate-600">{q.department}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          q.status === 'waiting' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          q.status === 'in_consultation' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {q.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {q.status === 'waiting' && (
                          <button
                            onClick={() => handleAdvanceQueue(q.id, 'in_consultation')}
                            className="px-2.5 py-1 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
                          >
                            Call into Exam Room
                          </button>
                        )}
                        {q.status === 'in_consultation' && (
                          <button
                            onClick={() => handleAdvanceQueue(q.id, 'completed')}
                            className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                          >
                            Mark Completed
                          </button>
                        )}
                        {q.status === 'completed' && (
                          <span className="text-[11px] text-slate-400 font-medium">Finished ✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PATIENT MANAGEMENT */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Hospital Patient Directory</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Patient Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">DOB</th>
                    <th className="p-3.5">Blood Group</th>
                    <th className="p-3.5">Reports Filed</th>
                    <th className="p-3.5">Appointments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((p) => (
                    <tr key={p.id}>
                      <td className="p-3.5 font-bold text-slate-900">{p.full_name}</td>
                      <td className="p-3.5 text-slate-500">{p.email}</td>
                      <td className="p-3.5 text-slate-600">{p.dob || 'N/A'}</td>
                      <td className="p-3.5 font-bold text-red-600">{p.blood_group}</td>
                      <td className="p-3.5 font-semibold text-teal-700">{p.reports_count} reports</td>
                      <td className="p-3.5 text-slate-600">{p.appointments_count} scheduled</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DOCTOR MANAGEMENT */}
        {activeTab === 'doctors' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">Hospital Physician Roster</h2>
              <button
                onClick={() => setShowDoctorModal(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Doctor</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Physician Name</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Specialization</th>
                    <th className="p-3.5">License #</th>
                    <th className="p-3.5">Fee</th>
                    <th className="p-3.5">Consultation Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map((d) => (
                    <tr key={d.id}>
                      <td className="p-3.5 font-bold text-slate-900">Dr. {d.full_name}</td>
                      <td className="p-3.5 font-semibold text-blue-800">{d.department}</td>
                      <td className="p-3.5 text-slate-600">{d.specialization}</td>
                      <td className="p-3.5 font-mono text-slate-500">{d.license_number}</td>
                      <td className="p-3.5 font-bold text-slate-800">${d.consultation_fee}</td>
                      <td className="p-3.5 text-slate-500">{d.available_days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: REFERRAL TRACKING */}
        {activeTab === 'referrals' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">Inter-Department Referral Tracking</h2>
              <button
                onClick={() => setShowReferralModal(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Referral</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Patient</th>
                    <th className="p-3.5">Referred By</th>
                    <th className="p-3.5">Target Department</th>
                    <th className="p-3.5">Clinical Reason</th>
                    <th className="p-3.5">Referral Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referrals.map((r) => (
                    <tr key={r.id}>
                      <td className="p-3.5 font-bold text-slate-900">{r.patient_name}</td>
                      <td className="p-3.5 text-slate-600">{r.from_doctor_name}</td>
                      <td className="p-3.5 font-semibold text-teal-700">{r.to_department}</td>
                      <td className="p-3.5 text-slate-700">{r.reason}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'accepted' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {r.status.toUpperCase()}
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

      {/* Modal 1: Register Doctor */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Physician to Hospital Roster</h3>
              <button onClick={() => setShowDoctorModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Name</label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="Dr. Gregory House"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={docEmail}
                  onChange={(e) => setDocEmail(e.target.value)}
                  placeholder="gregory.house@medibridge.demo"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={docDept}
                    onChange={(e) => setDocDept(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pathology & Lab">Pathology & Lab</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    required
                    value={docSpecialty}
                    onChange={(e) => setDocSpecialty(e.target.value)}
                    placeholder="e.g. Neurologist"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medical License Number</label>
                <input
                  type="text"
                  value={docLicense}
                  onChange={(e) => setDocLicense(e.target.value)}
                  placeholder="e.g. MD-78219-US"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
                >
                  Save Doctor Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Referral */}
      {showReferralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Create Inter-Department Referral</h3>
              <button onClick={() => setShowReferralModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient</label>
                <select
                  value={refPatientId}
                  onChange={(e) => setRefPatientId(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.dob})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Referring Physician</label>
                <select
                  value={refDoctorId}
                  onChange={(e) => setRefDoctorId(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>Dr. {d.full_name} ({d.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Department</label>
                <select
                  value={refDept}
                  onChange={(e) => setRefDept(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Pathology & Lab">Pathology & Lab</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Reason for Referral</label>
                <textarea
                  required
                  rows={3}
                  value={refReason}
                  onChange={(e) => setRefReason(e.target.value)}
                  placeholder="Indicate clinical rationale for referral..."
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReferralModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
                >
                  Create Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

