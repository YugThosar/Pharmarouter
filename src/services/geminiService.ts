import { GoogleGenAI, Type } from "@google/genai";
import { DrugProperties, OptimizationReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function autofillDrugProperties(drugName: string): Promise<Partial<DrugProperties>> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide complete pharmaceutical properties for ${drugName} as JSON. 
      Include known polymorphs, pKa with % deionized fraction in GIT, pH dependent solubility profile, and maximum GIT absorption window in the physicochemical section.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["synthetic", "phytochemical", "biological"] },
            physicochemical: {
              type: Type.OBJECT,
              properties: {
                solubility: { type: Type.STRING },
                logP: { type: Type.STRING },
                molecularWeight: { type: Type.STRING },
                meltingPoint: { type: Type.STRING },
                pKa: { type: Type.STRING },
                uvLambdaMax: { type: Type.STRING, description: "UV-Visible absorbance maxima reported in USP, BP, or IP" },
                dissolutionMedia: { type: Type.STRING, description: "Dissolution media for oral tablet dosage form reported in USP, BP, or IP" },
                polymorphs: { type: Type.STRING, description: "Known polymorphs of the drug substance" },
                pKaDeionizedFraction: { type: Type.STRING, description: "pKa and % Deionized fraction in GIT" },
                gitAbsorptionWindow: { type: Type.STRING, description: "Maximum absorption window in GIT" },
                phDependentSolubility: { type: Type.STRING, description: "pH dependent solubility profile" },
              }
            },
            pharmacokinetic: {
              type: Type.OBJECT,
              properties: {
                halfLife: { type: Type.STRING },
                bioavailability: { type: Type.STRING },
                clearance: { type: Type.STRING },
                volumeOfDistribution: { type: Type.STRING },
              }
            },
            pharmacology: {
              type: Type.OBJECT,
              properties: {
                targetSite: { type: Type.STRING },
                mechanismOfAction: { type: Type.STRING },
                therapeuticIndex: { type: Type.STRING },
              }
            },
            stability: {
              type: Type.OBJECT,
              properties: {
                pH: { type: Type.STRING },
                temperature: { type: Type.STRING },
                light: { type: Type.STRING },
                moisture: { type: Type.STRING },
              }
            },
            prescribedDoseStrength: { type: Type.STRING }
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response from AI");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error in autofillDrugProperties:", error);
    throw error;
  }
}

export async function optimizeDrugDelivery(properties: DrugProperties): Promise<OptimizationReport> {
  try {
    const prompt = `
      As a pharmaceutical formulator, analyze the drug: ${properties.name} (${properties.type}).
      Dose: ${properties.prescribedDoseStrength}
      Props: ${JSON.stringify(properties.physicochemical)}, ${JSON.stringify(properties.pharmacokinetic)}, ${JSON.stringify(properties.pharmacology)}, ${JSON.stringify(properties.stability)}
      
      Recommend 3-5 appropriate dosage forms (conventional to novel).
      Include:
      - Advanced systems: Vesicular, Microparticulate, Multiple Emulsions.
      - Solubility Enhancement: SMEDDS, SEDDS, Microemulsions, Liquid Dispersions, Micellar, Inclusion complexes, Solid dispersions.
      - Quality tests, marketed brands, physicochemical challenges, and improvement methods.
      - UV λmax and Dissolution media (USP/BP/IP).
      - Polymorphs, pKa & % Deionized fraction in GIT, pH dependent solubility profile, and GIT absorption window.
      - Compatible excipients and patent potential.
      - Compatibility score (%) for each.
      
      Return structured JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            drugName: { type: Type.STRING },
            summary: { type: Type.STRING },
            marketedForms: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of currently marketed dosage forms and brands" },
            uvLambdaMax: { type: Type.STRING, description: "UV-Visible absorbance maxima reported in USP, BP, or IP" },
            dissolutionMedia: { type: Type.STRING, description: "Dissolution media for oral tablet dosage form reported in USP, BP, or IP" },
            polymorphs: { type: Type.STRING },
            pKaDeionizedFraction: { type: Type.STRING },
            gitAbsorptionWindow: { type: Type.STRING },
            phDependentSolubility: { type: Type.STRING },
            physicochemicalChallenges: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific physicochemical challenges that need addressing" },
            improvementMethods: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific methods to improve physicochemical properties" },
            existingResearch: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Summary of key existing research work" },
            patentPotential: { type: Type.STRING, description: "Assessment of patentability for a new formulation" },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  route: { type: Type.STRING },
                  dosageForm: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                  advantages: { type: Type.ARRAY, items: { type: Type.STRING } },
                  limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
                  isNovel: { type: Type.BOOLEAN },
                  isVesicular: { type: Type.BOOLEAN },
                  isMicroparticulate: { type: Type.BOOLEAN },
                  isTargeted: { type: Type.BOOLEAN },
                  isLiquidDispersion: { type: Type.BOOLEAN },
                  isSolidDispersion: { type: Type.BOOLEAN },
                  isMultipleEmulsion: { type: Type.BOOLEAN },
                  isSEDDS: { type: Type.BOOLEAN },
                  isSMEDDS: { type: Type.BOOLEAN },
                  isMicroemulsion: { type: Type.BOOLEAN },
                  isMicellar: { type: Type.BOOLEAN },
                  isInclusionComplex: { type: Type.BOOLEAN },
                  compatibleExcipients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of most compatible excipients for the formulation" },
                  qualityTests: { type: Type.ARRAY, items: { type: Type.STRING } },
                  compatibilityScore: { type: Type.NUMBER, description: "Compatibility score as a percentage (0-100)" }
                },
                required: ["route", "dosageForm", "rationale", "advantages", "limitations", "isNovel", "qualityTests", "compatibleExcipients", "compatibilityScore"]
              }
            }
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response from AI");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error in optimizeDrugDelivery:", error);
    throw error;
  }
}
