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



