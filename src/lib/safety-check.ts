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

export interface SafetyCheckResult {
  hasConflicts: boolean;
  allergyConflicts: AllergyConflict[];
  interactionWarnings: InteractionWarning[];
}

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
   * Check for allergy conflicts and drug-drug interactions
   */
  static checkPrescriptionSafety(
    newMedicines: string[],
    patientAllergies: Array<{ allergen: string; severity: string }>,
    existingMedications: string[] = []
  ): SafetyCheckResult {
    const allergyConflicts: AllergyConflict[] = [];
    const interactionWarnings: InteractionWarning[] = [];

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

    return {
      hasConflicts: allergyConflicts.length > 0 || interactionWarnings.length > 0,
      allergyConflicts,
      interactionWarnings,
    };
  }
}
