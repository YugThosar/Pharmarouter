import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FlaskConical, 
  Search, 
  Zap, 
  ChevronRight, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  Microscope, 
  Dna, 
  Leaf, 
  Activity,
  ArrowRight,
  Loader2,
  Layers,
  Target,
  Box,
  Download,
  Smartphone
} from 'lucide-react';
import { cn } from './lib/utils';
import { DrugProperties, OptimizationReport, Recommendation } from './types';
import { autofillDrugProperties, optimizeDrugDelivery } from './services/geminiService';

const drugSchema = z.object({
  name: z.string().min(1, "Drug name is required"),
  type: z.enum(['synthetic', 'phytochemical', 'biological']),
  physicochemical: z.object({
    solubility: z.string().min(1),
    logP: z.string().min(1),
    molecularWeight: z.string().min(1),
    meltingPoint: z.string().optional(),
    pKa: z.string().optional(),
    uvLambdaMax: z.string().optional(),
    dissolutionMedia: z.string().optional(),
    polymorphs: z.string().optional(),
    pKaDeionizedFraction: z.string().optional(),
    gitAbsorptionWindow: z.string().optional(),
    phDependentSolubility: z.string().optional(),
  }),
  pharmacokinetic: z.object({
    halfLife: z.string().min(1),
    bioavailability: z.string().min(1),
    clearance: z.string().optional(),
    volumeOfDistribution: z.string().optional(),
  }),
  pharmacology: z.object({
    targetSite: z.string().min(1),
    mechanismOfAction: z.string().min(1),
    therapeuticIndex: z.string().optional(),
  }),
  stability: z.object({
    pH: z.string().min(1),
    temperature: z.string().min(1),
    light: z.string().min(1),
    moisture: z.string().optional(),
  }),
  prescribedDoseStrength: z.string().min(1, "Dose strength is required"),
});

type DrugFormData = z.infer<typeof drugSchema>;

export default function App() {
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [report, setReport] = useState<OptimizationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<DrugFormData>({
    resolver: zodResolver(drugSchema),
    defaultValues: {
      type: 'synthetic',
      physicochemical: { 
        solubility: '', 
        logP: '', 
        molecularWeight: '',
        polymorphs: '',
        pKaDeionizedFraction: '',
        gitAbsorptionWindow: '',
        phDependentSolubility: '',
      },
      pharmacokinetic: { halfLife: '', bioavailability: '' },
      pharmacology: { targetSite: '', mechanismOfAction: '' },
      stability: { pH: '', temperature: '', light: '' },
      prescribedDoseStrength: '',
    }
  });

  const drugName = watch('name');

  const handleAutofill = async () => {
    if (!drugName) {
      setError("Please enter a drug name first.");
      return;
    }

    setIsAutofilling(true);
    setError(null);
    try {
      const data = await autofillDrugProperties(drugName);
      
      if (data.type) setValue('type', data.type);
      if (data.physicochemical) {
        Object.entries(data.physicochemical).forEach(([key, val]) => {
          if (val) setValue(`physicochemical.${key as keyof typeof data.physicochemical}`, val);
        });
      }
      if (data.pharmacokinetic) {
        Object.entries(data.pharmacokinetic).forEach(([key, val]) => {
          if (val) setValue(`pharmacokinetic.${key as keyof typeof data.pharmacokinetic}`, val);
        });
      }
      if (data.pharmacology) {
        Object.entries(data.pharmacology).forEach(([key, val]) => {
          if (val) setValue(`pharmacology.${key as keyof typeof data.pharmacology}`, val);
        });
      }
      if (data.stability) {
        Object.entries(data.stability).forEach(([key, val]) => {
          if (val) setValue(`stability.${key as keyof typeof data.stability}`, val);
        });
      }
      if (data.prescribedDoseStrength) setValue('prescribedDoseStrength', data.prescribedDoseStrength);
      
    } catch (err) {
      setError("Failed to autofill properties. Please enter them manually.");
      console.error(err);
    } finally {
      setIsAutofilling(false);
    }
  };

  const onSubmit = async (data: DrugFormData) => {
    setIsOptimizing(true);
    setError(null);
    try {
      const result = await optimizeDrugDelivery(data as DrugProperties);
      setReport(result);
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError("Optimization failed. Please check your inputs and try again.");
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 safe-top">
      {/* Install Prompt */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-50 p-4 bg-blue-600 text-white shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5" />
              <p className="text-sm font-medium">Install PharmRoute as an app</p>
            </div>
            <button 
              onClick={handleInstallClick}
              className="px-4 py-1.5 bg-white text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider"
            >
              Install
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-blue-100 py-8 md:py-12 px-6 mb-8 md:mb-12 bg-blue-50/20">
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">
          {/* Lead Developer Info */}
          <div className="border-l-4 border-blue-600 pl-4 md:pl-6 py-1 md:py-2">
            <p className="mono text-blue-600 font-bold uppercase tracking-widest text-[9px] md:text-[10px] mb-1 md:mb-2">Lead Developer</p>
            <div className="space-y-0.5 md:space-y-1">
              <h2 className="text-xl md:text-2xl font-bold text-blue-900 leading-tight">DR. Milind M Thosar</h2>
              <div className="text-[11px] md:text-sm text-blue-800/70 font-mono italic space-y-0.5">
                <p>Assist. Professor</p>
                <p>Faculty of Pharmacy</p>
                <p className="not-italic font-bold">The Maharaja Sayajirao University of Baroda</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <FlaskConical className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                <span className="mono text-blue-700 opacity-100 font-bold bg-blue-100 px-2 py-0.5 rounded shadow-sm text-[9px] md:text-[11px]">PHARMRoute v2.5</span>
              </div>
              <h1 className="text-4xl md:text-7xl font-display text-blue-600 leading-[1.1] md:leading-tight">Drug Delivery <br className="hidden md:block" />Optimization</h1>
            </div>
            <div className="md:text-right max-w-md">
              <p className="text-[13px] md:text-sm text-blue-800/60 leading-relaxed italic border-l-2 md:border-l-0 md:border-r-2 border-blue-400 pl-4 md:pl-0 md:pr-4 py-1">
                Expert system for selecting optimal delivery routes and dosage forms based on 
                physicochemical, pharmacokinetic, and pharmacological drug profiles.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form Side */}
          <div className="lg:col-span-5">
            <div className="sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl">Drug Specification</h2>
                <button 
                  onClick={handleAutofill}
                  disabled={isAutofilling || !drugName}
                  className="flex items-center gap-2 px-3 py-1.5 bg-ink text-bg rounded-full text-xs font-mono uppercase tracking-wider hover:opacity-90 disabled:opacity-30 transition-all"
                >
                  {isAutofilling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  Autofill Properties
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Info */}
                <div className="space-y-4 p-6 bg-white/40 rounded-lg border border-line">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="mono text-ink/80 font-bold">Drug Name</label>
                      <input 
                        {...register('name')}
                        placeholder="e.g. Paclitaxel"
                        className="w-full bg-transparent border-b-2 border-line py-2 focus:outline-none focus:border-emerald-500 transition-colors font-medium text-emerald-950 placeholder:opacity-30"
                      />
                      {errors.name && <p className="text-[10px] text-red-500 uppercase font-mono">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="mono text-ink/80 font-bold">Drug Type</label>
                      <select 
                        {...register('type')}
                        className="w-full bg-transparent border-b-2 border-line py-2 focus:outline-none focus:border-emerald-500 transition-colors appearance-none font-medium text-emerald-900"
                      >
                        <option value="synthetic">Synthetic Molecule</option>
                        <option value="phytochemical">Phytochemical Extract</option>
                        <option value="biological">Biological/Macromolecule</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="mono text-ink/80 font-bold">Prescribed Dose Strength</label>
                    <input 
                      {...register('prescribedDoseStrength')}
                      placeholder="e.g. 100 mg/m² or 10 mcg"
                      className="w-full bg-transparent border-b-2 border-line py-2 focus:outline-none focus:border-emerald-500 transition-colors font-medium text-emerald-950 placeholder:opacity-30"
                    />
                    {errors.prescribedDoseStrength && <p className="text-[10px] text-red-500 uppercase font-mono">{errors.prescribedDoseStrength.message}</p>}
                  </div>
                </div>

                {/* Physicochemical */}
                <div className="p-6 border border-emerald-200 bg-emerald-50/30 rounded-lg space-y-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Microscope className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-lg text-emerald-900 font-bold">Physicochemical Profile</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="mono text-emerald-800">Solubility</label>
                      <input {...register('physicochemical.solubility')} className="w-full bg-transparent border-b border-emerald-200 py-1 text-sm focus:outline-none focus:border-emerald-600 text-emerald-950" />
                      {errors.physicochemical?.solubility && <p className="text-[10px] text-red-500 uppercase font-mono">Required</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="mono text-emerald-800">LogP</label>
                      <input {...register('physicochemical.logP')} className="w-full bg-transparent border-b border-emerald-200 py-1 text-sm focus:outline-none focus:border-emerald-600 text-emerald-950" />
                      {errors.physicochemical?.logP && <p className="text-[10px] text-red-500 uppercase font-mono">Required</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="mono text-emerald-800">Mol. Weight</label>
                      <input {...register('physicochemical.molecularWeight')} className="w-full bg-transparent border-b border-emerald-200 py-1 text-sm focus:outline-none focus:border-emerald-600 text-emerald-950" />
                      {errors.physicochemical?.molecularWeight && <p className="text-[10px] text-red-500 uppercase font-mono">Required</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="mono text-emerald-800">pKa (Optional)</label>
                      <input {...register('physicochemical.pKa')} className="w-full bg-transparent border-b border-emerald-200 py-1 text-sm focus:outline-none focus:border-emerald-600 text-emerald-900" />
                    </div>
                    <div className="space-y-1">
                      <label className="mono text-emerald-800">Melting Point</label>
                      <input {...register('physicochemical.meltingPoint')} className="w-full bg-transparent border-b border-emerald-200 py-1 text-sm focus:outline-none focus:border-emerald-600 text-emerald-900" />
                    </div>
                    <div className="space-y-1">
                      <label className="mono text-emerald-800">UV λmax (USP/BP/IP)</label>
                      <input {...register('physicochemical.uvLambdaMax')} className="w-full bg-transparent border-b border-emerald-200 py-1 text-sm focus:outline-none focus:border-emerald-600 text-emerald-900" />
                    </div>
                    <div className="space-y-1">
                      <label className="mono text-emerald-800">Dissolution Media</label>
                      <input {...register('physicochemical.dissolutionMedia')} className="w-full bg-transparent border-b border-emerald-200 py-1 text-sm focus:outline-none focus:border-emerald-600 text-emerald-900" />
                    </div>
                    <div className="space-y-1">
                      <label className="mono text-emerald-800">Polymorphs</label>
                      <input {...register('physicochemical.polymorphs')} className="w-full bg-transparent border-b border-emerald-200 py-1 text-sm focus:outline-none focus:border-emerald-600 text-emerald-900" />
                    </div>
                    <div className="space-y-1">
                      <label className="mono text-emerald-800">pKa & % Deionized (GIT)</label>
                      <input {...register('physicochemical.pKaDeionizedFraction')} className="w-full bg-transparent border-b border-emerald-200 py-1 text-sm focus:outline-none focus:border-emerald-600 text-emerald-900" />
                    </div>
                    <div className="space-y-1">
                      <label className="mono text-emerald-800">Absorption Window</label>
                      <input {...register('physicochemical.gitAbsorptionWindow')} className="w-full bg-transparent border-b border-emerald-200 py-1 text-sm focus:outline-none focus:border-emerald-600 text-emerald-900" />
                    </div>
                    <div className="space-y-1">
                      <label className="mono text-emerald-800">pH Dependent Solub.</label>
                      <input {...register('physicochemical.phDependentSolubility')} className="w-full bg-transparent border-b border-emerald-200 py-1 text-sm focus:outline-none focus:border-emerald-600 text-emerald-900" />
                    </div>
                  </div>
                </div>

                {/* Pharmacokinetic */}
                <div className="p-6 border border-sky-200 bg-sky-50/30 rounded-lg space-y-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-600" />
                    <h3 className="text-lg text-sky-900 font-bold">Pharmacokinetic Analysis</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="mono text-sky-800">Half-Life</label>
                      <input {...register('pharmacokinetic.halfLife')} className="w-full bg-transparent border-b border-sky-200 py-1 text-sm focus:outline-none focus:border-sky-600 text-sky-950" />
                      {errors.pharmacokinetic?.halfLife && <p className="text-[10px] text-red-500 uppercase font-mono">Required</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="mono text-sky-800">Bioavailability</label>
                      <input {...register('pharmacokinetic.bioavailability')} className="w-full bg-transparent border-b border-sky-200 py-1 text-sm focus:outline-none focus:border-sky-600 text-sky-950" />
                      {errors.pharmacokinetic?.bioavailability && <p className="text-[10px] text-red-500 uppercase font-mono">Required</p>}
                    </div>
                  </div>
                </div>

                {/* Pharmacology */}
                <div className="p-6 border border-indigo-200 bg-indigo-50/30 rounded-lg space-y-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-lg text-indigo-900 font-bold">Pharmacological Intent</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="mono text-indigo-800">Target Site</label>
                      <input {...register('pharmacology.targetSite')} className="w-full bg-transparent border-b border-indigo-200 py-1 text-sm focus:outline-none focus:border-indigo-600 text-indigo-950" />
                      {errors.pharmacology?.targetSite && <p className="text-[10px] text-red-500 uppercase font-mono">Required</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="mono text-indigo-800">Mechanism of Action</label>
                      <textarea {...register('pharmacology.mechanismOfAction')} rows={2} className="w-full bg-transparent border border-indigo-200 p-2 text-sm focus:outline-none focus:border-indigo-600 rounded bg-white/20 text-indigo-950" />
                      {errors.pharmacology?.mechanismOfAction && <p className="text-[10px] text-red-500 uppercase font-mono">Required</p>}
                    </div>
                  </div>
                </div>

                {/* Stability */}
                <div className="p-6 border border-amber-200 bg-amber-50/30 rounded-lg space-y-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <h3 className="text-lg text-amber-900 font-bold">Stability Constraints</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="mono text-amber-800">pH</label>
                      <input {...register('stability.pH')} className="w-full bg-transparent border-b border-amber-200 py-1 text-sm focus:outline-none focus:border-amber-600 text-amber-950" />
                      {errors.stability?.pH && <p className="text-[10px] text-red-500 uppercase font-mono">Required</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="mono text-amber-800">Temp</label>
                      <input {...register('stability.temperature')} className="w-full bg-transparent border-b border-amber-200 py-1 text-sm focus:outline-none focus:border-amber-600 text-amber-950" />
                      {errors.stability?.temperature && <p className="text-[10px] text-red-500 uppercase font-mono">Required</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="mono text-amber-800">Light</label>
                      <input {...register('stability.light')} className="w-full bg-transparent border-b border-amber-200 py-1 text-sm focus:outline-none focus:border-amber-600 text-amber-950" />
                      {errors.stability?.light && <p className="text-[10px] text-red-500 uppercase font-mono">Required</p>}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-mono uppercase rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isOptimizing}
                  className="w-full py-4 bg-ink text-bg font-display italic text-xl flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing Delivery Vectors...
                    </>
                  ) : (
                    <>
                      Run Optimization Engine
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Results Side */}
          <div className="lg:col-span-7 border-l border-line lg:pl-12 min-h-[600px]">
            <AnimatePresence mode="wait">
              {!report && !isOptimizing ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20"
                >
                  <Box className="w-16 h-16 mb-4 stroke-[1px]" />
                  <p className="mono">Awaiting drug specification input</p>
                </motion.div>
              ) : isOptimizing ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center py-20"
                >
                  <div className="relative w-24 h-24 mb-8">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-2 border-dashed border-ink/20 rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin opacity-40" />
                    </div>
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="mono animate-pulse">Evaluating pharmacokinetic interactions</p>
                    <p className="text-sm italic opacity-60">Gemini is simulating delivery pathways...</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  id="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-12 py-4"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <h2 className="text-4xl">Optimization Report</h2>
                    </div>
                    <p className="text-lg opacity-80 leading-relaxed italic">
                      {report?.summary}
                    </p>
                  </div>

                  {report?.marketedForms && report.marketedForms.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 border border-line rounded-lg bg-white/20">
                        <h3 className="text-sm mono mb-4 flex items-center gap-2">
                          <Search className="w-3 h-3" />
                          Marketed Reference Products
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {report.marketedForms.map((form, i) => (
                            <span key={i} className="px-3 py-1.5 bg-ink text-bg text-[11px] font-mono rounded-full">
                              {form}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-6 border border-line rounded-lg bg-white/20">
                        <h3 className="text-sm mono mb-4 flex items-center gap-2">
                          <Info className="w-3 h-3" />
                          Pharmacopeial Standards
                        </h3>
                        <div className="space-y-3">
                          {report.uvLambdaMax && (
                            <div>
                              <span className="text-[10px] mono opacity-40 block uppercase">UV λmax (USP/BP/IP)</span>
                              <span className="text-sm italic">{report.uvLambdaMax}</span>
                            </div>
                          )}
                          {report.dissolutionMedia && (
                            <div>
                              <span className="text-[10px] mono opacity-40 block uppercase">Dissolution Media (Tablets)</span>
                              <span className="text-sm italic">{report.dissolutionMedia}</span>
                            </div>
                          )}
                          {report.polymorphs && (
                            <div>
                              <span className="text-[10px] mono opacity-40 block uppercase">Polymorphs</span>
                              <span className="text-sm italic">{report.polymorphs}</span>
                            </div>
                          )}
                          {report.pKaDeionizedFraction && (
                            <div>
                              <span className="text-[10px] mono opacity-40 block uppercase">pKa & % Deionized (GIT)</span>
                              <span className="text-sm italic">{report.pKaDeionizedFraction}</span>
                            </div>
                          )}
                          {report.gitAbsorptionWindow && (
                            <div>
                              <span className="text-[10px] mono opacity-40 block uppercase">GIT Absorption Window</span>
                              <span className="text-sm italic">{report.gitAbsorptionWindow}</span>
                            </div>
                          )}
                          {report.phDependentSolubility && (
                            <div>
                              <span className="text-[10px] mono opacity-40 block uppercase">pH Dependent Solubility</span>
                              <span className="text-sm italic">{report.phDependentSolubility}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {report?.physicochemicalChallenges && report.physicochemicalChallenges.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 border border-line rounded-lg bg-red-50/30 border-red-200/50">
                        <h3 className="text-sm mono text-red-800 mb-4 flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" />
                          Physicochemical Challenges
                        </h3>
                        <ul className="space-y-2">
                          {report.physicochemicalChallenges.map((challenge, i) => (
                            <li key={i} className="text-sm italic opacity-80 flex gap-2">
                              <ChevronRight className="w-4 h-4 shrink-0 opacity-30" />
                              {challenge}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {report?.improvementMethods && report.improvementMethods.length > 0 && (
                        <div className="p-6 border border-line rounded-lg bg-green-50/30 border-green-200/50">
                          <h3 className="text-sm mono text-green-800 mb-4 flex items-center gap-2">
                            <Zap className="w-3 h-3" />
                            Improvement Methods
                          </h3>
                          <ul className="space-y-2">
                            {report.improvementMethods.map((method, i) => (
                              <li key={i} className="text-sm italic opacity-80 flex gap-2">
                                <ChevronRight className="w-4 h-4 shrink-0 opacity-30" />
                                {method}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {report?.existingResearch && report.existingResearch.length > 0 && (
                    <div className="p-6 border border-line rounded-lg bg-blue-50/30 border-blue-200/50">
                      <h3 className="text-sm mono text-blue-800 mb-4 flex items-center gap-2">
                        <Microscope className="w-3 h-3" />
                        Existing Research & Trends
                      </h3>
                      <ul className="space-y-2">
                        {report.existingResearch.map((research, i) => (
                          <li key={i} className="text-sm italic opacity-80 flex gap-2">
                            <ChevronRight className="w-4 h-4 shrink-0 opacity-30" />
                            {research}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {report?.patentPotential && (
                    <div className="p-6 border border-line rounded-lg bg-amber-50/30 border-amber-200/50">
                      <h3 className="text-sm mono text-amber-800 mb-4 flex items-center gap-2">
                        <Info className="w-3 h-3" />
                        Patent Filing Potential
                      </h3>
                      <p className="text-sm italic opacity-80 leading-relaxed">
                        {report.patentPotential}
                      </p>
                    </div>
                  )}

                  <div className="space-y-8">
                    {report?.recommendations.map((rec, idx) => (
                      <RecommendationCard key={idx} recommendation={rec} index={idx} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t-2 border-emerald-500 py-16 px-6 bg-white/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-600" />
                <span className="font-display italic text-xl">PHARMRoute</span>
              </div>
              <p className="text-sm opacity-60 leading-relaxed italic">
                Advanced expert system for intelligent formulation design and therapeutic optimization.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="mono text-emerald-700 font-bold opacity-100">Lead Developer</h4>
              <div className="space-y-1">
                <p className="font-display italic text-lg leading-tight">DR. Milind M Thosar</p>
                <p className="text-xs opacity-70">Assist. Professor</p>
                <p className="text-xs opacity-70">Faculty of Pharmacy</p>
                <p className="text-[10px] opacity-60 uppercase tracking-wider leading-tight">The Maharaja Sayajirao <br />University of Baroda</p>
              </div>
            </div>

            <div className="space-y-4 lg:col-span-2">
              <h4 className="mono text-emerald-700 font-bold opacity-100">Standard Note & Disclaimer</h4>
              <p className="text-[11px] opacity-60 leading-relaxed italic border-l border-emerald-200 pl-4">
                This application is a specialized expert system for pharmaceutical formulation design. 
                The information provided is generated through advanced AI modeling and should be used 
                as a supplementary tool for professional formulation research. Not intended for 
                clinical dosage determination without specialist verification. All pharmacopeial 
                standard data references (USP/BP/IP) are approximations based on scientific records.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-line flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <span className="mono text-emerald-800 font-bold">© 2026 PharmRoute AI Laboratory</span>
            </div>
            <div className="flex gap-8">
              <span className="mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Regulatory Compliant</span>
              <span className="mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Advanced Formulation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function RecommendationCard({ recommendation, index }: { recommendation: Recommendation, index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-8 h-8 rounded-full border border-ink flex items-center justify-center text-xs font-mono shrink-0">
          0{index + 1}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <h3 className="text-2xl">{recommendation.route} — {recommendation.dosageForm}</h3>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="mono text-[9px] opacity-40">Compatibility</span>
                <span className="text-xl font-display italic text-ink">{recommendation.compatibilityScore}%</span>
              </div>
              <div className="flex gap-2">
                {recommendation.isNovel && (
                  <span className="px-2 py-0.5 bg-ink text-bg text-[9px] font-mono uppercase tracking-tighter rounded">Novel</span>
                )}
                {recommendation.isVesicular && (
                  <span className="px-2 py-0.5 border border-ink text-ink text-[9px] font-mono uppercase tracking-tighter rounded flex items-center gap-1">
                    <Layers className="w-2 h-2" /> Vesicular
                  </span>
                )}
                {recommendation.isMicroparticulate && (
                  <span className="px-2 py-0.5 border border-ink text-ink text-[9px] font-mono uppercase tracking-tighter rounded flex items-center gap-1">
                    <Box className="w-2 h-2" /> Microparticulate
                  </span>
                )}
                {recommendation.isTargeted && (
                  <span className="px-2 py-0.5 border border-ink text-ink text-[9px] font-mono uppercase tracking-tighter rounded flex items-center gap-1">
                    <Target className="w-2 h-2" /> Targeted
                  </span>
                )}
                {recommendation.isLiquidDispersion && (
                  <span className="px-2 py-0.5 border border-ink text-ink text-[9px] font-mono uppercase tracking-tighter rounded flex items-center gap-1">
                    <Activity className="w-2 h-2" /> Liquid Dispersion
                  </span>
                )}
                {recommendation.isSolidDispersion && (
                  <span className="px-2 py-0.5 border border-ink text-ink text-[9px] font-mono uppercase tracking-tighter rounded flex items-center gap-1">
                    <Layers className="w-2 h-2" /> Solid Dispersion
                  </span>
                )}
                {recommendation.isMultipleEmulsion && (
                  <span className="px-2 py-0.5 border border-ink text-ink text-[9px] font-mono uppercase tracking-tighter rounded flex items-center gap-1">
                    <Activity className="w-2 h-2" /> Multiple Emulsion
                  </span>
                )}
                {recommendation.isSEDDS && (
                  <span className="px-2 py-0.5 border border-ink text-ink text-[9px] font-mono uppercase tracking-tighter rounded flex items-center gap-1">
                    <Zap className="w-2 h-2" /> SEDDS
                  </span>
                )}
                {recommendation.isSMEDDS && (
                  <span className="px-2 py-0.5 border border-ink text-ink text-[9px] font-mono uppercase tracking-tighter rounded flex items-center gap-1">
                    <Zap className="w-2 h-2" /> SMEDDS
                  </span>
                )}
                {recommendation.isMicroemulsion && (
                  <span className="px-2 py-0.5 border border-ink text-ink text-[9px] font-mono uppercase tracking-tighter rounded flex items-center gap-1">
                    <Activity className="w-2 h-2" /> Microemulsion
                  </span>
                )}
                {recommendation.isMicellar && (
                  <span className="px-2 py-0.5 border border-ink text-ink text-[9px] font-mono uppercase tracking-tighter rounded flex items-center gap-1">
                    <Target className="w-2 h-2" /> Micellar
                  </span>
                )}
                {recommendation.isInclusionComplex && (
                  <span className="px-2 py-0.5 border border-ink text-ink text-[9px] font-mono uppercase tracking-tighter rounded flex items-center gap-1">
                    <Layers className="w-2 h-2" /> Inclusion Complex
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <p className="text-sm opacity-70 mb-6 leading-relaxed">
            {recommendation.rationale}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h4 className="text-sm mono opacity-100 flex items-center gap-2">
                <div className="w-1 h-1 bg-green-600 rounded-full" />
                Strategic Advantages
              </h4>
              <ul className="space-y-2">
                {recommendation.advantages.map((adv, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <ChevronRight className="w-3 h-3 shrink-0 opacity-30" />
                    {adv}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm mono opacity-100 flex items-center gap-2">
                <div className="w-1 h-1 bg-red-600 rounded-full" />
                Formulation Constraints
              </h4>
              <ul className="space-y-2">
                {recommendation.limitations.map((lim, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <ChevronRight className="w-3 h-3 shrink-0 opacity-30" />
                    {lim}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 p-4 border border-line/40 rounded bg-ink/5">
            <h4 className="text-sm mono opacity-100 mb-4 flex items-center gap-2">
              <FlaskConical className="w-3 h-3" />
              Quality & Evaluation Tests
            </h4>
            <div className="flex flex-wrap gap-2">
              {recommendation.qualityTests.map((test, i) => (
                <span key={i} className="px-2 py-1 bg-bg border border-line text-[10px] font-mono rounded">
                  {test}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 p-4 border border-line/40 rounded bg-blue-50/20">
            <h4 className="text-sm mono opacity-100 mb-4 flex items-center gap-2">
              <Dna className="w-3 h-3" />
              Compatible Excipients
            </h4>
            <div className="flex flex-wrap gap-2">
              {recommendation.compatibleExcipients.map((excipient, i) => (
                <span key={i} className="px-2 py-1 bg-white border border-line text-[10px] font-mono rounded">
                  {excipient}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="h-px bg-line mt-8 group-last:hidden" />
    </motion.div>
  );
}
