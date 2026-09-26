import {
  UserRole,
  AppointmentType,
  AppointmentStatus,
  QueueTokenStatus,
  PriorityTier,
  EncounterStatus,
  PrescriptionStatus,
  MedicineForm,
  InventoryCategory,
  DiagnosticOrderStatus,
  InvoiceStatus,
  BedStatus,
  AdmissionStatus,
} from "@prisma/client";

export interface DoctorDTO {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  specialization: string;
  qualifications?: string | null;
  consultationFee: number;
  roomNumber?: string | null;
  photoUrl?: string | null;
  bio?: string | null;
  isActive: boolean;
}

export interface DepartmentDTO {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  doctorsCount?: number;
}

export interface AppointmentDTO {
  id: string;
  appointmentNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorId: string;
  doctorName: string;
  departmentName: string;
  appointmentType: AppointmentType;
  slotStart: string;
  slotEnd: string;
  status: AppointmentStatus;
  notes?: string | null;
  queueToken?: {
    id: string;
    tokenNumber: string;
    status: QueueTokenStatus;
    position: number;
    estimatedWaitMinutes: number;
  } | null;
}

export interface QueueTokenDTO {
  id: string;
  tokenNumber: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  priorityTier: PriorityTier;
  status: QueueTokenStatus;
  position: number;
  estimatedWaitMinutes: number;
  checkedInAt: string;
  calledAt?: string | null;
  completedAt?: string | null;
  roomNumber?: string | null;
}

export interface VitalSignDTO {
  id: string;
  patientId: string;
  systolicBp?: number | null;
  diastolicBp?: number | null;
  heartRate?: number | null;
  respiratoryRate?: number | null;
  temperatureCelsius?: number | null;
  oxygenSaturation?: number | null;
  fastingGlucose?: number | null;
  bmi?: number | null;
  recordedAt: string;
}

export interface PrescriptionDTO {
  id: string;
  prescriptionNumber: string;
  encounterId: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorId: string;
  doctorName: string;
  status: PrescriptionStatus;
  createdAt: string;
  items: Array<{
    id: string;
    medicineId: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    quantityPrescribed: number;
    quantityDispensed: number;
    instructions?: string | null;
  }>;
}

export interface InventoryItemDTO {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  reorderThreshold: number;
  currentStockOnHand: number;
  isActive: boolean;
  batches?: Array<{
    id: string;
    lotNumber: string;
    expiryDate: string;
    quantityAvailable: number;
    status: string;
  }>;
}

export interface DiagnosticOrderDTO {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  status: DiagnosticOrderStatus;
  createdAt: string;
  items: Array<{
    id: string;
    testName: string;
    price: number;
  }>;
  results?: Array<{
    id: string;
    testName: string;
    numericValue?: number | null;
    textValue?: string | null;
    referenceRange?: string | null;
    isAbnormal: boolean;
    reportFileUrl?: string | null;
  }>;
}

export interface InvoiceDTO {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  createdAt: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export interface BedDTO {
  id: string;
  wardId: string;
  wardName: string;
  bedNumber: string;
  status: BedStatus;
  dailyRate: number;
  patientName?: string | null;
}

export interface TraceabilityItemDTO {
  id: string;
  code: string;
  featureId: string;
  domain: string;
  title: string;
  category: string;
  sprint: string;
  status: string;
  testCoverage?: string | null;
  apiPath?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TraceabilitySummaryDTO {
  totalItems: number;
  byDomain: Record<string, number>;
  bySprint: Record<string, number>;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface NoShowPredictionDTO {
  appointmentId?: string | null;
  patientId?: string | null;
  riskScore: number;
  level: "LOW" | "MODERATE" | "HIGH";
  factors: string[];
  suggestedMitigations: string[];
  recommendedReminderFrequency: "STANDARD" | "ENHANCED" | "INTENSIVE";
  advisoryNotice: string;
  source: "heuristic" | "ai" | "fallback";
}

export interface AppointmentOptimizationDTO {
  doctorId?: string | null;
  clinicDate?: string | null;
  scheduledSlots: number;
  historicalNoShowRate: number;
  suggestedBufferSlots: number;
  targetUtilizationPercent: number;
  estimatedPatientAttendance: number;
  riskAdjustedCapacity: number;
  isAdvisory: true;
}

export interface DischargeSummaryDTO {
  id: string;
  admissionId: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorId: string;
  doctorName: string;
  admittingDiagnosis: string;
  finalDiagnosis: string;
  treatmentSummary: string;
  dischargeCondition: string;
  followUpInstructions?: string | null;
  followUpDate?: string | null;
  createdAt: string;
}

export interface DischargeResultDTO {
  admissionId: string;
  patientId: string;
  status: "DISCHARGED";
  dischargedAt: string;
  stayDays: number;
  releasedBedId?: string | null;
  finalInvoiceId?: string | null;
  totalCharges: number;
}

export interface AdmissionRequestDTO {
  id?: string;
  patientId: string;
  encounterId?: string;
  admittingDoctorId: string;
  reasonForAdmission: string;
  admittingDiagnosis?: string;
  preferredWardType?: string;
  priority?: "ROUTINE" | "URGENT" | "EMERGENCY";
  notes?: string;
}

export interface AdmissionApprovalDTO {
  bedId: string;
  admittingDoctorId?: string;
  approverRole?: string;
  approverId?: string;
  initialNotes?: string;
}

export interface AdmissionDetailDTO {
  id: string;
  admissionNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  admittingDoctorId: string;
  doctorName: string;
  bedId: string;
  bedNumber: string;
  wardName: string;
  dailyRate: number;
  admissionDate: string;
  dischargeDate?: string | null;
  admissionDiagnosis?: string | null;
  dischargeSummary?: string | null;
  status: AdmissionStatus;
  createdAt: string;
}

export interface PaymentReceiptDTO {
  receiptNumber: string;
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  amount: number;
  paymentMethod: string;
  transactionReference?: string | null;
  collectedBy?: string | null;
  invoiceTotal: number;
  remainingBalance: number;
  paymentDate: string;
}

export interface PatientStatementDTO {
  patientId: string;
  patientName: string;
  patientMrn: string;
  generatedAt: string;
  totalInvoiced: number;
  totalPaid: number;
  totalAdjustments: number;
  outstandingBalance: number;
  aging: {
    current: number;
    days30: number;
    days60: number;
    days90Plus: number;
    totalOutstanding: number;
  };
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: string;
  }>;
  payments: Array<{
    id: string;
    receiptNumber: string;
    invoiceNumber: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    collectedBy?: string | null;
  }>;
}

export interface FinancialReconciliationDTO {
  asOfDate: string;
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  transactionCount: number;
  collectionsByMethod: Record<string, number>;
  generatedBy?: string | null;
}

export interface SpecimenCollectionDTO {
  orderId: string;
  specimenType: string;
  barcode: string;
  collectedBy: string;
  collectedAt: string;
  notes?: string;
}

export interface DiagnosticWorkQueueItemDTO {
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  status: DiagnosticOrderStatus;
  category?: string;
  tests: string[];
  priority: "ROUTINE" | "URGENT" | "STAT";
  orderedAt: string;
  specimenBarcode?: string | null;
  specimenCollectedAt?: string | null;
  slaRemainingHours: number;
  isSlaBreached: boolean;
}

export interface DiagnosticCatalogDTO {
  id: string;
  code: string;
  name: string;
  category: "LABORATORY" | "RADIOLOGY" | "CARDIOLOGY" | "PATHOLOGY";
  sampleType?: string | null;
  referenceRange?: string | null;
  price: number;
  turnaroundTimeHours?: number;
  preparationInstructions?: string | null;
  isActive: boolean;
}

export interface DiagnosticCatalogInputDTO {
  code: string;
  name: string;
  category: "LABORATORY" | "RADIOLOGY" | "CARDIOLOGY" | "PATHOLOGY";
  sampleType?: string;
  referenceRange?: string;
  price: number;
  turnaroundTimeHours?: number;
  preparationInstructions?: string;
  isActive?: boolean;
}

export interface StockAdjustmentInputDTO {
  itemId: string;
  locationId: string;
  batchId?: string;
  quantityDelta: number;
  reason: "DISPENSE" | "TRANSFER_OUT" | "TRANSFER_IN" | "GOODS_RECEIPT" | "ADJUSTMENT" | "RETURN";
  justification?: string;
  refType?: string;
  refId?: string;
  createdBy?: string;
}

export interface StockLedgerEntryDTO {
  id: string;
  itemId: string;
  itemName: string;
  unit: string;
  batchId?: string | null;
  batchLotNumber?: string | null;
  locationId: string;
  locationName: string;
  quantityDelta: number;
  reason: string;
  refType?: string | null;
  refId?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface InventoryAuditReportDTO {
  asOfDate: string;
  totalItemsAudited: number;
  itemsWithDiscrepancyCount: number;
  totalDiscrepancyQty: number;
  totalVarianceValue: number;
  discrepancies: Array<{
    itemId: string;
    itemName: string;
    category: string;
    systemStockOnHand: number;
    physicalCount: number;
    varianceQty: number;
    estimatedVarianceCost: number;
  }>;
}

export interface PrescriptionSafetyCheckDTO {
  patientId?: string;
  medicines: string[];
  allergies?: Array<{ allergen: string; severity: string }>;
  existingMedications?: string[];
}

export interface PrescriptionSafetyCheckResultDTO {
  hasConflicts: boolean;
  requiresClinicalOverride: boolean;
  allergyConflicts: Array<{
    medicineName: string;
    allergen: string;
    severity: string;
    warning: string;
  }>;
  interactionWarnings: Array<{
    drugA: string;
    drugB: string;
    severity: "MILD" | "MODERATE" | "SEVERE";
    description: string;
  }>;
  duplicateTherapies: Array<{
    class: string;
    drugA: string;
    drugB: string;
    warning: string;
  }>;
}

export interface AllergyInputDTO {
  patientId: string;
  allergen: string;
  severity?: "MILD" | "MODERATE" | "SEVERE" | "LIFE_THREATENING";
  reaction?: string;
}

export interface MedicalHistoryInputDTO {
  patientId: string;
  condition: string;
  diagnosedYear?: number;
  notes?: string;
}

export interface PatientClinicalHistoryDTO {
  patientId: string;
  patientName: string;
  patientMrn: string;
  allergiesCount: number;
  medicalConditionsCount: number;
  activeMedicationsCount: number;
  allergies: Array<{
    id: string;
    allergen: string;
    severity: string;
    reaction?: string | null;
    recordedAt: string;
  }>;
  medicalHistory: Array<{
    id: string;
    condition: string;
    diagnosedYear?: number | null;
    notes?: string | null;
  }>;
  medicationHistory: Array<{
    prescriptionId: string;
    prescriptionNumber: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    prescribedDate: string;
  }>;
}

export interface StaffOnboardingDTO {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  departmentId?: string;
  specialization?: string;
  consultationFee?: number;
}

export interface UserStatusUpdateDTO {
  userId: string;
  status: "ACTIVE" | "SUSPENDED" | "LOCKED" | "PENDING_VERIFICATION";
  reason?: string;
  actorRole?: string;
}

export interface AdministrativeApprovalDTO {
  id: string;
  approvalType: string;
  referenceId: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  requestedBy: string;
  approvedBy?: string | null;
  reason: string;
  createdAt: string;
  approvedAt?: string | null;
}



