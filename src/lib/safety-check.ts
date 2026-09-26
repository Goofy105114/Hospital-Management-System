export interface AllergyConflict {
  medicineName: string;
  allergen: string;
  severity: string;
  warning: string;
}

export interface InteractionWarning {
  drugA: string;
  drugB: string;
  severity: "MILD" | "MODERATE" | "SEVERE";
  description: string;
}

export interface DuplicateTherapyWarning {
  class: string;
  drugA: string;
  drugB: string;
  warning: string;
}

export interface SafetyCheckResult {
  hasConflicts: boolean;
  requiresClinicalOverride: boolean;
  allergyConflicts: AllergyConflict[];
  interactionWarnings: InteractionWarning[];
  duplicateTherapies: DuplicateTherapyWarning[];
}

const DRUG_CLASSES: Array<{ className: string; drugs: string[] }> = [
  { className: "NSAID", drugs: ["aspirin", "ibuprofen", "naproxen", "diclofenac", "celecoxib", "meloxicam", "ketorolac"] },
  { className: "ACE_INHIBITOR", drugs: ["lisinopril", "ramipril", "enalapril", "captopril", "benazepril"] },
  { className: "STATIN", drugs: ["atorvastatin", "simvastatin", "rosuvastatin", "pravastatin"] },
  { className: "BENZODIAZEPINE", drugs: ["diazepam", "lorazepam", "alprazolam", "clonazepam"] },
  { className: "BETA_BLOCKER", drugs: ["metoprolol", "atenolol", "propranolol", "bisoprolol", "carvedilol"] },
];

// Known clinical drug-drug interactions database
const KNOWN_INTERACTIONS: Array<{
  keywordsA: string[];
  keywordsB: string[];
  severity: "MILD" | "MODERATE" | "SEVERE";
  description: string;
}> = [
  {
    keywordsA: ["warfarin", "coumadin"],
    keywordsB: ["aspirin", "ibuprofen", "naproxen"],
    severity: "SEVERE",
    description: "Concomitant use increases major hemorrhage and gastrointestinal bleeding risk.",
  },
  {
    keywordsA: ["atorvastatin", "simvastatin"],
    keywordsB: ["clarithromycin", "erythromycin", "itraconazole"],
    severity: "SEVERE",
    description:
      "CYP3A4 inhibition drastically increases statin plasma levels, raising risk of rhabdomyolysis.",
  },
  {
    keywordsA: ["lisinopril", "ramipril", "enalapril"],
    keywordsB: ["spironolactone", "potassium"],
    severity: "MODERATE",
    description: "Combined therapy can induce clinically significant hyperkalemia.",
  },
  {
    keywordsA: ["metformin"],
    keywordsB: ["contrast", "iodine"],
    severity: "SEVERE",
    description: "Risk of lactic acidosis in the presence of contrast-induced renal impairment.",
  },
  {
    keywordsA: ["metoprolol", "atenolol"],
    keywordsB: ["verapamil", "diltiazem"],
    severity: "SEVERE",
    description:
      "Synergistic negative inotropic and dromotropic effects can trigger profound bradycardia or heart block.",
  },
];

export class SafetyCheckService {
  /**
   * Check for allergy conflicts, drug-drug interactions, and duplicate therapies
   */
  static checkPrescriptionSafety(
    newMedicines: string[],
    patientAllergies: Array<{ allergen: string; severity: string }>,
    existingMedications: string[] = []
  ): SafetyCheckResult {
    const allergyConflicts: AllergyConflict[] = [];
    const interactionWarnings: InteractionWarning[] = [];
    const duplicateTherapies: DuplicateTherapyWarning[] = [];

    const allDrugs = [...newMedicines, ...existingMedications].map((d) => d.toLowerCase());

    // 1. Check patient allergies against new medicines
    for (const med of newMedicines) {
      const medLower = med.toLowerCase();
      for (const allergy of patientAllergies) {
        const allergenLower = allergy.allergen.toLowerCase();
        if (medLower.includes(allergenLower) || allergenLower.includes(medLower)) {
          allergyConflicts.push({
            medicineName: med,
            allergen: allergy.allergen,
            severity: allergy.severity,
            warning: `Patient has documented allergy to ${allergy.allergen} (${allergy.severity} severity).`,
          });
        }
      }
    }

    // 2. Check drug-drug interactions among all prescribed & active drugs
    for (let i = 0; i < allDrugs.length; i++) {
      for (let j = i + 1; j < allDrugs.length; j++) {
        const drug1 = allDrugs[i];
        const drug2 = allDrugs[j];

        for (const rule of KNOWN_INTERACTIONS) {
          const match1 =
            rule.keywordsA.some((k) => drug1.includes(k)) &&
            rule.keywordsB.some((k) => drug2.includes(k));
          const match2 =
            rule.keywordsB.some((k) => drug1.includes(k)) &&
            rule.keywordsA.some((k) => drug2.includes(k));

          if (match1 || match2) {
            interactionWarnings.push({
              drugA: allDrugs[i],
              drugB: allDrugs[j],
              severity: rule.severity,
              description: rule.description,
            });
          }
        }
      }
    }

    // 3. Check duplicate therapeutic class duplication
    for (let i = 0; i < allDrugs.length; i++) {
      for (let j = i + 1; j < allDrugs.length; j++) {
        const drug1 = allDrugs[i];
        const drug2 = allDrugs[j];

        for (const drugClass of DRUG_CLASSES) {
          const match1 = drugClass.drugs.some((d) => drug1.includes(d));
          const match2 = drugClass.drugs.some((d) => drug2.includes(d));

          if (match1 && match2 && drug1 !== drug2) {
            duplicateTherapies.push({
              class: drugClass.className,
              drugA: allDrugs[i],
              drugB: allDrugs[j],
              warning: `Duplicate therapy detected: both belong to the ${drugClass.className} class.`,
            });
          }
        }
      }
    }

    const hasSevereAllergy = allergyConflicts.some(
      (a) => a.severity.toUpperCase() === "SEVERE" || a.severity.toUpperCase() === "LIFE_THREATENING"
    );
    const hasSevereInteraction = interactionWarnings.some(
      (w) => w.severity === "SEVERE"
    );

    const requiresClinicalOverride = hasSevereAllergy || hasSevereInteraction;
    const hasConflicts =
      allergyConflicts.length > 0 ||
      interactionWarnings.length > 0 ||
      duplicateTherapies.length > 0;

    return {
      hasConflicts,
      requiresClinicalOverride,
      allergyConflicts,
      interactionWarnings,
      duplicateTherapies,
    };
  }
}

