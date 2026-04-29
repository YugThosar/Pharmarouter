export type DrugType = 'synthetic' | 'phytochemical' | 'biological';

export interface DrugProperties {
  name: string;
  type: DrugType;
  physicochemical: {
    solubility: string;
    logP: string;
    molecularWeight: string;
    meltingPoint?: string;
    pKa?: string;
    uvLambdaMax?: string;
    dissolutionMedia?: string;
    polymorphs?: string;
    pKaDeionizedFraction?: string;
    gitAbsorptionWindow?: string;
    phDependentSolubility?: string;
  };
  pharmacokinetic: {
    halfLife: string;
    bioavailability: string;
    clearance?: string;
    volumeOfDistribution?: string;
  };
  pharmacology: {
    targetSite: string;
    mechanismOfAction: string;
    therapeuticIndex?: string;
  };
  stability: {
    pH: string;
    temperature: string;
    light: string;
    moisture?: string;
  };
  prescribedDoseStrength: string;
}

export interface Recommendation {
  route: string;
  dosageForm: string;
  rationale: string;
  advantages: string[];
  limitations: string[];
  isNovel: boolean;
  isVesicular?: boolean;
  isMicroparticulate?: boolean;
  isTargeted?: boolean;
  isLiquidDispersion?: boolean;
  isSolidDispersion?: boolean;
  isMultipleEmulsion?: boolean;
  isSEDDS?: boolean;
  isSMEDDS?: boolean;
  isMicroemulsion?: boolean;
  isMicellar?: boolean;
  isInclusionComplex?: boolean;
  compatibleExcipients: string[];
  qualityTests: string[];
  compatibilityScore: number;
}

export interface OptimizationReport {
  drugName: string;
  summary: string;
  marketedForms?: string[];
  uvLambdaMax?: string;
  dissolutionMedia?: string;
  polymorphs?: string;
  pKaDeionizedFraction?: string;
  gitAbsorptionWindow?: string;
  phDependentSolubility?: string;
  physicochemicalChallenges?: string[];
  improvementMethods?: string[];
  existingResearch?: string[];
  patentPotential?: string;
  recommendations: Recommendation[];
}
