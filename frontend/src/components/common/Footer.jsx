import React from 'react';
import Logo from './Logo';
import { ShieldCheck, Lock, AlertCircle, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2 space-y-4">
            <Logo variant="dark" height={36} />
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              MediBridge is an intelligent healthcare platform connecting patients, clinical providers, 
              and hospital administrators through unified journey intelligence and grounded AI report assistance.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <div className="flex items-center space-x-1.5 text-xs text-teal-400 font-medium bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Privacy-Focused Architecture</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-blue-300 font-medium bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
                <Lock className="w-3.5 h-3.5" />
                <span>Synthetic Sandbox Environment</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Portals</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/login" className="hover:text-teal-400 transition">Patient Health Companion</a></li>
              <li><a href="/login" className="hover:text-teal-400 transition">Doctor Clinical Studio</a></li>
              <li><a href="/login" className="hover:text-teal-400 transition">Hospital Admin Operations</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Core Pillars</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Patient Journey Timeline</li>
              <li>Grounded Report Explainer</li>
              <li>Historical Lab Comparisons</li>
              <li>Clinical Note Approvals</li>
            </ul>
          </div>
        </div>

        {/* Safety & Non-Diagnostic Disclaimer Box */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-8 text-xs text-slate-400 leading-relaxed flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">Strict Clinical Guardrail & Safety Disclaimer: </span>
            MediBridge AI provides plain-language educational summaries grounded strictly in the printed numerical values 
            and reference ranges of uploaded diagnostic reports. The platform does not diagnose medical conditions, evaluate symptoms 
            independently, or prescribe medications. All clinical documentation and decisions require review and formal signature by 
            a licensed, qualified physician.
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>© 2026 MediBridge. Connecting Care. Simplifying Health. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center space-x-1">
            <span>Built for modern, transparent healthcare</span>
            <Heart className="w-3 h-3 text-teal-400 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}

