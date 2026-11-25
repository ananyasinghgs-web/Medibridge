import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientApi, reportApi, appointmentApi, adminApi } from '../../services/api';
import { 
  Activity, Clock, FileText, Upload, Sparkles, Calendar, Pill, 
  Users, CheckCircle2, AlertTriangle, ArrowRight, TrendingUp, TrendingDown, 
  Minus, RefreshCw, X, Shield, Plus, ChevronRight, AlertCircle, FileCheck
} from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline', 'reports', 'compare', 'appointments', 'medications', 'family'
  
  // State
  const [profile, setProfile] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [familyShares, setFamilyShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);

  // Form states
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('Comprehensive Metabolic Panel');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Compare states
  const [compareId1, setCompareId1] = useState('');
  const [compareId2, setCompareId2] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Booking states
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [bookDateTime, setBookDateTime] = useState('');
  const [bookReason, setBookReason] = useState('');

  // Family share state
  const [familyEmail, setFamilyEmail] = useState('');
  const [familyRelation, setFamilyRelation] = useState('Spouse');

  // Profile edit state
  const [allergies, setAllergies] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [profData, timeData, repData, apptData, docData, famData] = await Promise.all([
        patientApi.getProfile(),
        patientApi.getTimeline(),
        reportApi.getReports(),
        appointmentApi.getAppointments(),
        adminApi.getDoctors(),
        patientApi.getFamilyShares()
      ]);

      setProfile(profData);
      setAllergies(profData.allergies || '');
      setChronicConditions(profData.chronic_conditions || '');
      setEmergencyContact(profData.emergency_contact || '');

      setTimeline(timeData.events || []);
      setReports(repData || []);
      if (repData && repData.length > 0) {
        // Automatically select the latest report for details view
        const firstReportDetails = await reportApi.getReportDetails(repData[0].id);
        setSelectedReport(firstReportDetails);

        // Pre-select 2 reports for compare if available
        if (repData.length >= 2) {
          setCompareId1(repData[1].id);
          setCompareId2(repData[0].id);
        }
      }

      setAppointments(apptData || []);
      setDoctorsList(docData || []);
      if (docData && docData.length > 0) setSelectedDoctorId(docData[0].id);
      setFamilyShares(famData || []);

    } catch (err) {
      setError(err.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle PDF Upload
  const handleUploadReport = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a PDF report file.');
      return;
    }
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadTitle);
      formData.append('report_type', uploadType);
      formData.append('report_date', uploadDate);
      formData.append('file', uploadFile);

      const result = await reportApi.uploadReport(formData);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle('');
      setSuccessMsg(`Report "${result.title}" uploaded! Extracted ${result.metrics_extracted} biomarkers.`);
      await loadData();
      setActiveTab('reports');
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle Compare
  const handleRunComparison = async () => {
    if (!compareId1 || !compareId2) return;
    setCompareLoading(true);
    try {
      const res = await reportApi.compareReports(compareId1, compareId2);
      setComparisonResult(res);
    } catch (err) {
      alert('Comparison error: ' + err.message);
    } finally {
      setCompareLoading(false);
    }
  };

  // Handle Appointment Booking
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      await appointmentApi.bookAppointment({
        doctor_id: selectedDoctorId,
        scheduled_at: bookDateTime,
        reason: bookReason
      });
      setShowBookModal(false);
      setBookReason('');
      setSuccessMsg('Appointment scheduled successfully and added to your care timeline!');
      await loadData();
    } catch (err) {
      alert('Booking error: ' + err.message);
    }
  };

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await patientApi.updateProfile({
        allergies,
        chronic_conditions: chronicConditions,
        emergency_contact: emergencyContact
      });
      setShowProfileModal(false);
      setSuccessMsg('Personal health profile updated successfully.');
      await loadData();
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  };

  // Handle Family Share
  const handleAddFamilyShare = async (e) => {
    e.preventDefault();
    try {
      await patientApi.addFamilyShare({
        grantee_email: familyEmail,
        relationship_type: familyRelation,
        access_level: 'view_only'
      });
      setShowFamilyModal(false);
      setFamilyEmail('');
      setSuccessMsg('Family record access invitation created.');
      await loadData();
    } catch (err) {
      alert('Family share failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center space-x-2 text-teal-700">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm font-semibold">Loading Health Records...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Top Banner / Patient Profile Card */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  Patient Health Portal
                </span>
                <span className="text-xs text-slate-400">ID: {profile?.id?.slice(0, 8)}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Welcome, {profile?.full_name || user?.full_name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                <span><strong>DOB:</strong> {profile?.dob || 'Not set'}</span>
                <span>•</span>
                <span><strong>Blood Group:</strong> <span className="font-bold text-red-600">{profile?.blood_group || 'O+'}</span></span>
                <span>•</span>
                <span><strong>Allergies:</strong> {profile?.allergies || 'None reported'}</span>
                <span>•</span>
                <span><strong>Conditions:</strong> {profile?.chronic_conditions || 'None'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowProfileModal(true)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-xs transition flex items-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Report (PDF)</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg('')} className="text-teal-700 hover:text-teal-900">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="mt-6 flex space-x-1 border-b border-slate-200 overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center space-x-1.5 ${
                activeTab === 'timeline' 
                  ? 'border-teal-600 text-teal-800' 
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Journey Timeline ({timeline.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center space-x-1.5 ${
                activeTab === 'reports' 
                  ? 'border-teal-600 text-teal-800' 
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>AI Report Explainer ({reports.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('compare'); if (!comparisonResult && reports.length >= 2) handleRunComparison(); }}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center space-x-1.5 ${
                activeTab === 'compare' 
                  ? 'border-teal-600 text-teal-800' 
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Historical Report Comparison</span>
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center space-x-1.5 ${
                activeTab === 'appointments' 
                  ? 'border-teal-600 text-teal-800' 
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Appointments & Visit Prep ({appointments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('medications')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center space-x-1.5 ${
                activeTab === 'medications' 
                  ? 'border-teal-600 text-teal-800' 
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Medication Reminders</span>
            </button>

            <button
              onClick={() => setActiveTab('family')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center space-x-1.5 ${
                activeTab === 'family' 
                  ? 'border-teal-600 text-teal-800' 
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Family Sharing ({familyShares.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* TAB 1: PATIENT JOURNEY TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Patient Journey Intelligence</h2>
                <p className="text-xs text-slate-500">
                  Chronological health history linking diagnostic reports, consultations, prescriptions, and appointments.
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition"
              >
                + Add Lab Document
              </button>
            </div>

            {timeline.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No journey events recorded yet. Upload a lab report to start your timeline.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-teal-500/40 ml-4 pl-6 space-y-6">
                {timeline.map((event, idx) => (
                  <div key={event.id || idx} className="relative group">
                    {/* Circle Node */}
                    <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white ring-2 ${
                      event.event_type === 'report' ? 'bg-teal-600 ring-teal-200' :
                      event.event_type === 'consultation' ? 'bg-blue-800 ring-blue-200' :
                      event.event_type === 'prescription' ? 'bg-emerald-600 ring-emerald-200' :
                      'bg-slate-700 ring-slate-200'
                    }`}></div>

                    {/* Event Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {event.date}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          event.event_type === 'report' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                          event.event_type === 'consultation' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          event.event_type === 'prescription' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {event.category || event.event_type}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 mt-1">{event.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{event.description}</p>

                      {/* Event action shortcut */}
                      {event.event_type === 'report' && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">File: {event.meta?.file_name}</span>
                          <button
                            onClick={async () => {
                              const rep = await reportApi.getReportDetails(event.reference_id);
                              setSelectedReport(rep);
                              setActiveTab('reports');
                            }}
                            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1"
                          >
                            <span>Open in AI Explainer</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI MEDICAL REPORT EXPLAINER */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">AI Medical Report Explainer</h2>
                <p className="text-xs text-slate-500">
                  Biomarker values and laboratory reference intervals extracted using PyMuPDF and explained in clear, plain language.
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition flex items-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New PDF</span>
              </button>
            </div>

            {/* Reports Selector Bar */}
            {reports.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {reports.map((rep) => (
                  <button
                    key={rep.id}
                    onClick={async () => {
                      const repDetails = await reportApi.getReportDetails(rep.id);
                      setSelectedReport(repDetails);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-left border text-xs transition shrink-0 ${
                      selectedReport?.id === rep.id 
                        ? 'border-teal-600 bg-teal-50/60 shadow-2xs font-bold text-teal-900' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold">{rep.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{rep.report_date} • {rep.metrics_count} tests</p>
                  </button>
                ))}
              </div>
            )}

            {selectedReport ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 7 Cols: Extracted Lab Metrics Table */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{selectedReport.title}</h3>
                      <p className="text-xs text-slate-500">Date of Test: {selectedReport.report_date}</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                      {selectedReport.report_type}
                    </span>
                  </div>

                  {/* Metrics Cards */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Extracted Laboratory Biomarkers ({selectedReport.metrics?.length || 0})
                    </span>

                    {selectedReport.metrics?.map((m) => (
                      <div key={m.id} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-slate-900">{m.test_name}</span>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Report Reference Range: {m.reference_min !== null && m.reference_max !== null ? `${m.reference_min} - ${m.reference_max} ${m.unit}` : 'Not printed'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-slate-900">{m.value} {m.unit}</span>
                            <span className={`block text-[10px] font-bold px-2 py-0.5 rounded mt-1 text-center ${
                              m.status === 'normal' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              m.status === 'high' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                              m.status === 'low' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {m.status === 'normal' ? 'Normal Range' : 
                               m.status === 'high' ? 'Above Reference' : 
                               m.status === 'low' ? 'Below Reference' : 'Report Range Unspecified'}
                            </span>
                          </div>
                        </div>
                        {m.notes && (
                          <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60 leading-normal">
                            {m.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right 5 Cols: Grounded AI Explanation & Safety Disclaimer */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-teal-50/60 rounded-2xl border border-teal-200 p-6 space-y-4">
                    <div className="flex items-center space-x-2 text-teal-900 font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <span>Plain-Language Report Summary</span>
                    </div>

                    <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {selectedReport.ai_summary}
                    </div>
                  </div>

                  {/* Mandatory Clinical Disclaimer */}
                  <div className="bg-blue-50/80 rounded-2xl border border-blue-200 p-5 space-y-2">
                    <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs">
                      <Shield className="w-4 h-4 text-blue-700" />
                      <span>Mandatory Clinical Guardrail</span>
                    </div>
                    <p className="text-[11px] text-blue-900 leading-normal">
                      {selectedReport.ai_disclaimer}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No medical reports uploaded yet. Click "Upload Report" to begin.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HISTORICAL REPORT COMPARISON */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Historical Report Comparison</h2>
              <p className="text-xs text-slate-500">
                Compare test values over time. Mathematical deltas are calculated <strong>only when the same test and compatible units are available</strong>.
              </p>
            </div>

            {/* Select Reports to Compare */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Report 1 (Previous Test)</label>
                  <select
                    value={compareId1}
                    onChange={(e) => setCompareId1(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="">Select previous report...</option>
                    {reports.map((r) => (
                      <option key={r.id} value={r.id}>{r.title} ({r.report_date})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Report 2 (Current Test)</label>
                  <select
                    value={compareId2}
                    onChange={(e) => setCompareId2(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="">Select follow-up report...</option>
                    {reports.map((r) => (
                      <option key={r.id} value={r.id}>{r.title} ({r.report_date})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleRunComparison}
                disabled={compareLoading || !compareId1 || !compareId2}
                className="px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{compareLoading ? 'Comparing...' : 'Run Side-by-Side Comparison'}</span>
              </button>
            </div>

            {/* Comparison Results Table */}
            {comparisonResult && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Compatible Test Analysis: {comparisonResult.report_previous?.report_date} vs {comparisonResult.report_current?.report_date}
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {comparisonResult.comparisons?.length || 0} Matched Tests
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Biomarker</th>
                        <th className="p-3.5">Reference Range</th>
                        <th className="p-3.5">Previous Value ({comparisonResult.report_previous?.report_date})</th>
                        <th className="p-3.5">Current Value ({comparisonResult.report_current?.report_date})</th>
                        <th className="p-3.5">Delta (Change)</th>
                        <th className="p-3.5">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {comparisonResult.comparisons?.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-3.5 font-bold text-slate-900">{c.test_name}</td>
                          <td className="p-3.5 text-slate-500">{c.reference_range}</td>
                          <td className="p-3.5 text-slate-700">{c.previous_value} {c.unit}</td>
                          <td className="p-3.5 font-bold text-slate-900">{c.current_value} {c.unit}</td>
                          <td className="p-3.5 font-mono">
                            {c.delta > 0 ? `+${c.delta}` : c.delta} {c.unit} ({c.percentage_change}%)
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.trend === 'stable' ? 'bg-slate-100 text-slate-700' :
                              c.trend === 'decreased' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {c.trend === 'stable' && <Minus className="w-3 h-3" />}
                              {c.trend === 'decreased' && <TrendingDown className="w-3 h-3 text-emerald-600" />}
                              {c.trend === 'increased' && <TrendingUp className="w-3 h-3 text-amber-600" />}
                              <span className="capitalize">{c.trend}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Incompatible unit notice if any */}
                {comparisonResult.skipped_items?.length > 0 && (
                  <div className="p-4 bg-amber-50/60 border-t border-amber-200 text-xs text-amber-800 space-y-1">
                    <span className="font-bold flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Incompatible Units Skipped for Safety:</span>
                    </span>
                    {comparisonResult.skipped_items.map((s, idx) => (
                      <p key={idx} className="text-[11px] text-amber-700 pl-4.5">• {s.reason}</p>
                    ))}
                  </div>
                )}

                <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
                  {comparisonResult.disclaimer}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: APPOINTMENTS & VISIT PREP */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Appointments & Visit Prep Assistant</h2>
                <p className="text-xs text-slate-500">
                  Manage consultations and review AI-generated preparation questions to maximize your time with the doctor.
                </p>
              </div>
              <button
                onClick={() => setShowBookModal(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition shadow-xs flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book Appointment</span>
              </button>
            </div>

            <div className="space-y-4">
              {appointments.map((a) => (
                <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                        {a.doctor_department}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                        Consultation with Dr. {a.doctor_name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Scheduled for: <strong className="text-slate-800">{a.scheduled_at}</strong>
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      a.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      a.status === 'scheduled' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {a.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <strong>Reason for Visit:</strong> {a.reason || 'General health evaluation'}
                  </div>

                  {/* Visit Prep Assistant Notes */}
                  {a.visit_prep_notes && (
                    <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200 text-xs text-slate-700 space-y-2">
                      <div className="flex items-center space-x-1.5 font-bold text-teal-900">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        <span>Doctor Visit Preparation Assistant</span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                        {a.visit_prep_notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: MEDICATION REMINDERS */}
        {activeTab === 'medications' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Doctor-Approved Medication Schedule</h2>
              <p className="text-xs text-slate-500">
                Reminders are generated exclusively from prescriptions authored and signed by your licensed physician.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Atorvastatin</h3>
                    <p className="text-[11px] text-slate-500">Prescribed by Dr. Robert Vance, MD</p>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p><strong>Dosage:</strong> 10 mg</p>
                  <p><strong>Frequency:</strong> Once daily at bedtime</p>
                  <p><strong>Instructions:</strong> Take statin at bedtime with a glass of water.</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active Prescription
                  </span>
                  <button className="text-xs font-bold text-teal-600 hover:text-teal-700">
                    Mark Taken Today ✓
                  </button>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Omega-3 Fatty Acids</h3>
                    <p className="text-[11px] text-slate-500">Prescribed by Dr. Robert Vance, MD</p>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p><strong>Dosage:</strong> 1000 mg</p>
                  <p><strong>Frequency:</strong> Once daily with morning meal</p>
                  <p><strong>Instructions:</strong> Take with breakfast to support lipid management.</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active Prescription
                  </span>
                  <button className="text-xs font-bold text-teal-600 hover:text-teal-700">
                    Mark Taken Today ✓
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: FAMILY HEALTH SHARING */}
        {activeTab === 'family' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Permission-Based Family Health Sharing</h2>
                <p className="text-xs text-slate-500">
                  Securely grant trusted family members read-only access to your medical history and timeline.
                </p>
              </div>
              <button
                onClick={() => setShowFamilyModal(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition shadow-xs flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Grant Family Access</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Family Member Email</th>
                    <th className="p-3.5">Relationship</th>
                    <th className="p-3.5">Access Level</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {familyShares.map((f) => (
                    <tr key={f.id}>
                      <td className="p-3.5 font-bold text-slate-900">{f.grantee_email}</td>
                      <td className="p-3.5 text-slate-600">{f.relationship_type}</td>
                      <td className="p-3.5 text-slate-600 capitalize">{f.access_level.replace('_', ' ')}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {f.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={async () => {
                            await patientApi.revokeFamilyShare(f.id);
                            setSuccessMsg('Family member access revoked.');
                            await loadData();
                          }}
                          className="text-xs font-bold text-red-600 hover:text-red-700"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                  {familyShares.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No family members currently granted access.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Upload Report */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Upload Medical Diagnostic Report</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadReport} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Report Title</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Comprehensive Metabolic Panel (Annual)"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Report Type / Category</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Comprehensive Metabolic Panel">Comprehensive Metabolic Panel</option>
                  <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                  <option value="Lipid Panel">Lipid Panel</option>
                  <option value="Renal Function Test">Renal Function Test</option>
                  <option value="Thyroid Profile">Thyroid Profile</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Test Date</label>
                <input
                  type="date"
                  required
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select PDF Document</label>
                <input
                  type="file"
                  required
                  accept="application/pdf"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-slate-50"
                />
                <p className="text-[10px] text-slate-400 mt-1">PyMuPDF will automatically extract biomarkers and printed reference intervals.</p>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition disabled:opacity-50"
                >
                  {uploadLoading ? 'Extracting Text & Metrics...' : 'Upload & Process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Book Appointment */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Book Doctor Consultation</h3>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Physician</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                >
                  {doctorsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.full_name} ({d.specialization} — {d.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={bookDateTime}
                  onChange={(e) => setBookDateTime(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Consultation</label>
                <textarea
                  required
                  rows={3}
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  placeholder="Describe symptoms or routine follow-up goals..."
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
                <p className="text-[10px] text-teal-700 mt-1">
                  MediBridge AI will automatically prepare customized visit questions based on this reason.
                </p>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Profile */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Edit Personal Health Profile</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Known Allergies</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa drugs"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chronic Conditions</label>
                <input
                  type="text"
                  value={chronicConditions}
                  onChange={(e) => setChronicConditions(e.target.value)}
                  placeholder="e.g. Mild Hypertension, Asthma"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Information</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Name (Relationship) - Phone number"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Family Sharing */}
      {showFamilyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Grant Family Health Sharing</h3>
              <button onClick={() => setShowFamilyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFamilyShare} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Family Member Email</label>
                <input
                  type="email"
                  required
                  value={familyEmail}
                  onChange={(e) => setFamilyEmail(e.target.value)}
                  placeholder="family.member@example.com"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                <select
                  value={familyRelation}
                  onChange={(e) => setFamilyRelation(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Caregiver">Designated Caregiver</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowFamilyModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition"
                >
                  Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

