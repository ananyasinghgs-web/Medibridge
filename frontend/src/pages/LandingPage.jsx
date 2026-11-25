import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/common/Logo';
import { 
  ArrowRight, Activity, FileText, Stethoscope, Building2, 
  CheckCircle2, Shield, Sparkles, TrendingDown, Clock, 
  Layers, Users, Calendar, AlertCircle, ChevronRight, Lock
} from 'lucide-react';

export default function LandingPage() {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();
  const [activePreviewTab, setActivePreviewTab] = useState('explainer'); // 'timeline', 'explainer', 'admin'

  const handleLaunchPortal = async (role) => {
    await demoLogin(role);
    if (role === 'patient') navigate('/patient');
    if (role === 'doctor') navigate('/doctor');
    if (role === 'admin') navigate('/admin');
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200 bg-linear-to-b from-white via-slate-50/50 to-slate-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tagline Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-6 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              <span>Connecting Care. Simplifying Health.</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              The Intelligent Ecosystem for{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-900 via-teal-700 to-teal-500">
                Connected Healthcare
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed">
              MediBridge transforms complex medical reports into plain-language clarity, 
              unifies your complete health story chronologically, and coordinates clinical workflows 
              across patients, doctors, and hospital administration.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => handleLaunchPortal('patient')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-600/20 transition flex items-center justify-center space-x-2"
              >
                <span>Launch Patient Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleLaunchPortal('doctor')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition flex items-center justify-center space-x-2"
              >
                <Stethoscope className="w-4 h-4 text-blue-800" />
                <span>Doctor Clinical Studio</span>
              </button>
              <button
                onClick={() => handleLaunchPortal('admin')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition flex items-center justify-center space-x-2"
              >
                <Building2 className="w-4 h-4 text-slate-700" />
                <span>Hospital Admin Portal</span>
              </button>
            </div>

            {/* Trust & Policy Badges */}
            <div className="mt-10 flex flex-wrap justify-center items-center gap-3 text-xs text-slate-500">
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-teal-600" />
                <span>Privacy-focused design</span>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-blue-700" />
                <span>100% Synthetic test data</span>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Doctor-approved clinical notes</span>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                <span>Strict non-diagnostic AI</span>
              </div>
            </div>
          </div>

          {/* Interactive Feature Preview Stage */}
          <div className="mt-14 max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Tab Header */}
            <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 flex flex-wrap gap-2 justify-between items-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActivePreviewTab('explainer')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                    activePreviewTab === 'explainer' 
                      ? 'bg-white text-teal-800 shadow-xs border border-slate-200' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>AI Report Explainer</span>
                </button>
                <button
                  onClick={() => setActivePreviewTab('timeline')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                    activePreviewTab === 'timeline' 
                      ? 'bg-white text-teal-800 shadow-xs border border-slate-200' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-blue-700" />
                  <span>Patient Journey Intelligence</span>
                </button>
                <button
                  onClick={() => setActivePreviewTab('admin')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                    activePreviewTab === 'admin' 
                      ? 'bg-white text-teal-800 shadow-xs border border-slate-200' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-700" />
                  <span>Outpatient Queue & Ops</span>
                </button>
              </div>

              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
                Live Interactive Architecture Preview
              </span>
            </div>

            {/* Tab 1: AI Report Explainer Preview */}
            {activePreviewTab === 'explainer' && (
              <div className="p-6 lg:p-8 space-y-6">
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  {/* Left: Report Extraction Preview */}
                  <div className="w-full lg:w-1/2 bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Extracted PDF Biomarkers
                      </span>
                      <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Laboratory Reference Range Grounded
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <div className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-slate-900">Fasting Blood Glucose</p>
                          <p className="text-[11px] text-slate-500">Report interval: 70 - 99 mg/dL</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-900">94 mg/dL</span>
                          <span className="block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">
                            Within Reference Interval
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-slate-900">Total Cholesterol</p>
                          <p className="text-[11px] text-slate-500">Report interval: 125 - 200 mg/dL</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-900">188 mg/dL</span>
                          <span className="block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">
                            Improved (-30 mg/dL)
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-slate-900">Hemoglobin (Hb)</p>
                          <p className="text-[11px] text-slate-500">Report interval: 12.0 - 16.0 g/dL</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-900">14.1 g/dL</span>
                          <span className="block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">
                            Within Reference Interval
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Plain Language Translation */}
                  <div className="w-full lg:w-1/2 space-y-4">
                    <div className="bg-teal-50/60 rounded-xl p-5 border border-teal-200 space-y-3">
                      <div className="flex items-center space-x-2 text-teal-900 font-bold text-sm">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span>Plain-Language Educational Explanation</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        "Your Fasting Blood Glucose is 94 mg/dL. This measures blood sugar after fasting and falls comfortably 
                        within your laboratory's printed reference range (70–99 mg/dL). Compared to your previous test (108 mg/dL), 
                        your reading reflects a positive stabilizing trend."
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        "Total Cholesterol improved to 188 mg/dL from 218 mg/dL, returning within standard clinical reference bounds."
                      </p>
                    </div>

                    {/* Disclaimer Banner */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-2.5">
                      <AlertCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-blue-900 leading-normal">
                        <strong>Safety Guardrail:</strong> MediBridge AI strictly explains printed measurements and does not provide clinical diagnoses or medicinal prescriptions. Always discuss these findings with your doctor.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Patient Journey Timeline Preview */}
            {activePreviewTab === 'timeline' && (
              <div className="p-6 lg:p-8">
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="border-l-2 border-teal-500 pl-4 space-y-6">
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-teal-500 ring-4 ring-white"></div>
                      <span className="text-[11px] font-bold text-teal-700 uppercase">November 10, 2024</span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">Medical Report: Follow-up Metabolic Panel</h4>
                      <p className="text-xs text-slate-600 mt-1">Extracted: Glucose 94 mg/dL, HbA1c 5.4%, Total Cholesterol 188 mg/dL.</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white"></div>
                      <span className="text-[11px] font-bold text-blue-800 uppercase">May 18, 2024</span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">Clinical Consultation — Dr. Robert Vance, MD</h4>
                      <p className="text-xs text-slate-600 mt-1">Doctor-approved clinical note: Lifestyle adjustments & dietary cardiovascular protocol initiated.</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-white"></div>
                      <span className="text-[11px] font-bold text-emerald-700 uppercase">May 18, 2024</span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">Doctor-Approved Prescription Issued</h4>
                      <p className="text-xs text-slate-600 mt-1">Atorvastatin 10mg once daily at bedtime. Feeds automatic daily medication reminder schedule.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Hospital Admin Queue Preview */}
            {activePreviewTab === 'admin' && (
              <div className="p-6 lg:p-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">Waiting Patients</span>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">6 Active</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">Consultations Today</span>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">18 Complete</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">Average Turnaround</span>
                    <p className="text-2xl font-extrabold text-teal-700 mt-1">3.8 Hours</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Token #</th>
                        <th className="p-3">Patient</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3 font-bold text-teal-700">CAR-101</td>
                        <td className="p-3 font-medium text-slate-900">Sarah Jenkins</td>
                        <td className="p-3 text-slate-600">Cardiology</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Waiting</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-teal-700">GEN-102</td>
                        <td className="p-3 font-medium text-slate-900">Marcus Chen</td>
                        <td className="p-3 text-slate-600">General Medicine</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">In Consultation</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Two Core Innovations Section */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold text-teal-700 tracking-wider uppercase">Groundbreaking Capabilities</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">Two Core Innovations</p>
            <p className="mt-3 text-sm text-slate-600">
              Engineered to bring transparency to patients and clinical precision to healthcare teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Innovation 1 */}
            <div className="p-8 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-teal-300 transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">1. Patient Journey Intelligence</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Healthcare is fragmented across clinics, labs, and pharmacies. Patient Journey Intelligence compiles 
                every diagnostic test, doctor consultation, prescription, and follow-up appointment into a unified, 
                searchable chronological health story.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Never lose context between different doctors or specialists</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Permission-controlled family member health record sharing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Doctor Visit Preparation Assistant creates customized questions for appointments</span>
                </li>
              </ul>
            </div>

            {/* Innovation 2 */}
            <div className="p-8 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-teal-300 transition space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100/70 text-blue-800 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">2. AI Medical Report Explainer</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Medical reports shouldn't read like code. Using PyMuPDF extraction, MediBridge pulls numerical biomarkers 
                and compares them directly against the laboratory's printed reference ranges, translating terminology into 
                clear, accessible educational summaries.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Strictly grounded in printed report reference ranges — no speculative abnormality claims</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Compatible unit matching: compares historical tests only when identical units exist</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Strict non-diagnostic guardrails: does not diagnose or prescribe treatments</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Three Purpose-Built Portals Section */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold text-teal-700 tracking-wider uppercase">Seamless Collaboration</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">Three Dedicated Portals</p>
            <p className="mt-3 text-sm text-slate-600">
              Each portal provides a specialized interface tailored to the responsibilities of each stakeholder.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Patient Portal Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Patient Companion</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Personal health profile, PDF report uploads, interactive AI explainer, historical report diffs, 
                  and doctor-approved medication schedules.
                </p>
                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                    <span>Health Journey Timeline</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                    <span>Report PDF Explainer & Diff</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                    <span>Doctor Visit Preparation</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleLaunchPortal('patient')}
                className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 transition flex items-center justify-center space-x-1"
              >
                <span>Enter as Patient</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Doctor Portal Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-4">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Doctor Clinical Studio</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Fast patient record lookup, side-by-side historical lab report comparisons, AI-assisted clinical documentation drafting, and official note sign-off.
                </p>
                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-700"></span>
                    <span>Authorized Patient Search</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-700"></span>
                    <span>Dual-Report Comparison Studio</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-700"></span>
                    <span>Physician Approval Gate</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleLaunchPortal('doctor')}
                className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 transition flex items-center justify-center space-x-1"
              >
                <span>Enter as Doctor</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 3. Hospital Admin Portal Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Hospital Admin Portal</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Hospital dashboard, patient & doctor management, appointment & queue token advancement, inter-department referral tracking, and workflow analytics.
                </p>
                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                    <span>Patient & Doctor Directory</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                    <span>Live Outpatient Queue Board</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                    <span>Hospital Workflow Analytics</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleLaunchPortal('admin')}
                className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition flex items-center justify-center space-x-1"
              >
                <span>Enter as Admin</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

