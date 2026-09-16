import {
  PrismaClient,
  UserRole,
  UserStatus,
  Gender,
  AppointmentType,
  AppointmentStatus,
  QueueTokenStatus,
  PriorityTier,
  QueueSource,
  MedicineForm,
  InventoryCategory,
  StockLocationType,
  BatchStatus,
  DiagnosticCategory,
  DiagnosticOrderStatus,
  WardType,
  BedStatus,
  InvoiceStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Going Merry Hospital Management System database...");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Seed Staff Users
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@goingmerry.hms" },
    update: {},
    create: {
      name: "Hospital Super Admin",
      email: "admin@goingmerry.hms",
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const drVanceUser = await prisma.user.upsert({
    where: { email: "dr.vance@goingmerry.hms" },
    update: {},
    create: {
      name: "Dr. Marcus Vance, MD, FACC",
      email: "dr.vance@goingmerry.hms",
      phone: "+1-800-555-4101",
      passwordHash,
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
    },
  });

  const drRamosUser = await prisma.user.upsert({
    where: { email: "dr.ramos@goingmerry.hms" },
    update: {},
    create: {
      name: "Dr. Elena Ramos, MD",
      email: "dr.ramos@goingmerry.hms",
      phone: "+1-800-555-4108",
      passwordHash,
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
    },
  });

  const drMillerUser = await prisma.user.upsert({
    where: { email: "dr.miller@goingmerry.hms" },
    update: {},
    create: {
      name: "Dr. David Miller, MD",
      email: "dr.miller@goingmerry.hms",
      phone: "+1-800-555-4112",
      passwordHash,
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
    },
  });

  const pharmacistUser = await prisma.user.upsert({
    where: { email: "pharmacy@goingmerry.org" },
    update: {},
    create: {
      name: "David Miller, RPh",
      email: "pharmacy@goingmerry.org",
      phone: "+1-800-555-4200",
      passwordHash,
      role: UserRole.PHARMACIST,
      status: UserStatus.ACTIVE,
    },
  });

  const receptionistUser = await prisma.user.upsert({
    where: { email: "reception@goingmerry.org" },
    update: {},
    create: {
      name: "Sarah Connor",
      email: "reception@goingmerry.org",
      phone: "+1-800-555-4300",
      passwordHash,
      role: UserRole.RECEPTIONIST,
      status: UserStatus.ACTIVE,
    },
  });

  // 2. Seed Departments
  const cardioDept = await prisma.department.upsert({
    where: { code: "CARD" },
    update: {},
    create: {
      name: "Cardiology & Vascular Health",
      code: "CARD",
      description:
        "Comprehensive cardiovascular care, interventional cardiology, and heart rhythm management.",
    },
  });

  const neuroDept = await prisma.department.upsert({
    where: { code: "NEUR" },
    update: {},
    create: {
      name: "Neurology",
      code: "NEUR",
      description: "Advanced neurological diagnostics, brain and spinal care.",
    },
  });

  const dermDept = await prisma.department.upsert({
    where: { code: "DERM" },
    update: {},
    create: {
      name: "Dermatology",
      code: "DERM",
      description: "Clinical and surgical dermatology.",
    },
  });

  const orthoDept = await prisma.department.upsert({
    where: { code: "ORTH" },
    update: {},
    create: {
      name: "Orthopedics",
      code: "ORTH",
      description: "Musculoskeletal health, joint replacement, and sports trauma.",
    },
  });

  const genDept = await prisma.department.upsert({
    where: { code: "GEN" },
    update: {},
    create: {
      name: "General Medicine",
      code: "GEN",
      description: "Primary care, ambulatory evaluation, and family health.",
    },
  });

  const pediDept = await prisma.department.upsert({
    where: { code: "PEDI" },
    update: {},
    create: {
      name: "Pediatrics",
      code: "PEDI",
      description: "Specialized newborn, child, and adolescent healthcare.",
    },
  });

  // 3. Seed Doctors
  const drVance = await prisma.doctor.upsert({
    where: { userId: drVanceUser.id },
    update: {},
    create: {
      userId: drVanceUser.id,
      departmentId: cardioDept.id,
      specialization: "Senior Interventional Cardiologist",
      qualifications: "MD, FACC, Board Certified Cardiologist",
      licenseNumber: "MD-849204910",
      consultationFee: 120.0,
      roomNumber: "Consultation Room 304, East Wing (3rd Floor)",
      photoUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuASMiD_yIVTlPeVGR7BMhyNEBY4UL5xU-OoFzIFeJzBj4GmKdxC0eh0O4xcyAS3CeXQ8NnQ0gvEJtDPR7t5t1JjDePFWPhcRLZp7XojtXi3GXzaHG2TEhrMGeUo60Zagx_dPuYjl9yycKazLAPMm422VDhdlpJWf5p52tJw9hokXGmV5eJKYysRs8n32VNtjWqaxUdA2CEbErmKL4Y7-Qo8a6D-QSVTBbeSyA9KcMLyiD4Dunv2el8b",
      bio: "15 years experience in complex coronary interventions, structural heart disease, and preventative lipidology.",
    },
  });

  const drRamos = await prisma.doctor.upsert({
    where: { userId: drRamosUser.id },
    update: {},
    create: {
      userId: drRamosUser.id,
      departmentId: genDept.id,
      specialization: "Family Medicine & Preventive Health",
      qualifications: "MD, FAAFP",
      licenseNumber: "MD-718293011",
      consultationFee: 90.0,
      roomNumber: "Clinic Room 102, Ambulatory Wing",
      photoUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDCvHI2z7pNpbP2RW1JQXUYImd2zTMB99RPVL0Y12qTD4dS8w_YBA-SYZltDmRePjXmlydIGV-yRp8NuIbK8yyke96hR9QzHO0SPo9noTWl3IEbLpVMxVBX50R5Wh9PK0GgKqSh4E4Y6SQdyfhrJILFW0HpZHsipSF_yxD8o96_JSDvTtZ_hDcit_Qhu3EIOfmfPlKX7cmncPApS3pQEnCJZOrUuV_zgPezWz2OmoVyyX5tSVxWmFma",
      bio: "Primary Care Physician leading preventive care programs, chronic disease coordination, and community health.",
    },
  });

  const drMiller = await prisma.doctor.upsert({
    where: { userId: drMillerUser.id },
    update: {},
    create: {
      userId: drMillerUser.id,
      departmentId: neuroDept.id,
      specialization: "Consultant Neurologist",
      qualifications: "MD, FAAN",
      licenseNumber: "MD-629104822",
      consultationFee: 140.0,
      roomNumber: "Consultation Room 410, West Wing",
      bio: "Specializing in headache disorders, cerebrovascular evaluation, and neuro-rehabilitation.",
    },
  });

  // 4. Seed Patients Master Index
  const patientUsersData = [
    {
      name: "Eleanor Vance",
      email: "eleanor.vance@example.com",
      phone: "+1-555-234-8901",
      mrn: "GM-84920",
      dob: new Date("1988-04-15"),
      gender: Gender.FEMALE,
      bloodGroup: "O+",
      address: "742 Evergreen Terrace, Springfield",
      allergy: "Penicillin allergy (hives & moderate swelling).",
    },
    {
      name: "Sofia Rodriguez",
      email: "sofia.rodriguez@example.com",
      phone: "+1-555-345-6789",
      mrn: "MRN-2026-001802",
      dob: new Date("1981-09-22"),
      gender: Gender.FEMALE,
      bloodGroup: "A+",
      address: "124 Oak Street, Springfield",
      allergy: "Sulfa antibiotics.",
    },
    {
      name: "Arthur Pendelton",
      email: "arthur.p@example.com",
      phone: "+1-555-456-7890",
      mrn: "MRN-2026-001789",
      dob: new Date("1964-11-05"),
      gender: Gender.MALE,
      bloodGroup: "B+",
      address: "88 Maple Ave, Springfield",
      allergy: null,
    },
    {
      name: "David Chen",
      email: "david.chen@example.com",
      phone: "+1-555-567-8901",
      mrn: "MRN-2026-001815",
      dob: new Date("1974-03-12"),
      gender: Gender.MALE,
      bloodGroup: "AB+",
      address: "512 Pine Lane, Springfield",
      allergy: "Latex allergy.",
    },
    {
      name: "James Wilson",
      email: "j.wilson@example.com",
      phone: "+1-555-678-9012",
      mrn: "MRN-2026-001850",
      dob: new Date("1985-07-30"),
      gender: Gender.MALE,
      bloodGroup: "O-",
      address: "303 Elm Road, Springfield",
      allergy: "Aspirin & NSAIDs.",
    },
  ];

  const seededPatients = [];

  for (const p of patientUsersData) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        name: p.name,
        email: p.email,
        phone: p.phone,
        passwordHash,
        role: UserRole.PATIENT,
        status: UserStatus.ACTIVE,
      },
    });

    const patientProfile = await prisma.patient.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        mrn: p.mrn,
        dob: p.dob,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        address: p.address,
      },
    });

    if (p.allergy) {
      await prisma.patientAlert.deleteMany({ where: { patientId: patientProfile.id } });
      await prisma.patientAlert.create({
        data: {
          patientId: patientProfile.id,
          type: "ALLERGY_ON_FILE",
          note: p.allergy,
          isActive: true,
        },
      });
    }

    seededPatients.push({ user, profile: patientProfile });
  }

  const eleanor = seededPatients[0].profile;
  const sofia = seededPatients[1].profile;
  const arthur = seededPatients[2].profile;

  // 5. Seed Eleanor's Vitals Baseline
  await prisma.vitalSign.deleteMany({ where: { patientId: eleanor.id } });
  await prisma.vitalSign.create({
    data: {
      patientId: eleanor.id,
      systolicBp: 118,
      diastolicBp: 76,
      heartRate: 72,
      respiratoryRate: 16,
      temperatureCelsius: 36.8,
      oxygenSaturation: 99,
      fastingGlucose: 94,
      bmi: 22.4,
    },
  });

  // 6. Seed Appointments
  const today = new Date();
  const today1000 = new Date(today);
  today1000.setHours(10, 0, 0, 0);

  const today1130 = new Date(today);
  today1130.setHours(11, 30, 0, 0);
  const today1215 = new Date(today1130.getTime() + 45 * 60 * 1000);

  const apptEleanor = await prisma.appointment.upsert({
    where: { appointmentNumber: "APT-20241024-0014" },
    update: {},
    create: {
      appointmentNumber: "APT-20241024-0014",
      patientId: eleanor.id,
      doctorId: drVance.id,
      departmentId: cardioDept.id,
      appointmentType: AppointmentType.FOLLOW_UP,
      slotStart: today1130,
      slotEnd: today1215,
      status: AppointmentStatus.CONFIRMED,
      notes: "Follow-up Arrhythmia & Resting ECG Review. Online check-in completed.",
    },
  });

  const apptSofia = await prisma.appointment.upsert({
    where: { appointmentNumber: "APT-20241024-0010" },
    update: {},
    create: {
      appointmentNumber: "APT-20241024-0010",
      patientId: sofia.id,
      doctorId: drVance.id,
      departmentId: cardioDept.id,
      appointmentType: AppointmentType.NEW,
      slotStart: today1000,
      slotEnd: new Date(today1000.getTime() + 30 * 60 * 1000),
      status: AppointmentStatus.IN_PROGRESS,
      notes: "Hypertension evaluation and baseline laboratory diagnostics.",
    },
  });

  // 7. Seed Live Queue Tokens
  await prisma.queueToken.upsert({
    where: { appointmentId: apptSofia.id },
    update: {},
    create: {
      tokenNumber: "#A-21",
      doctorId: drVance.id,
      patientId: sofia.id,
      appointmentId: apptSofia.id,
      source: QueueSource.APPOINTMENT,
      priorityTier: PriorityTier.NORMAL,
      status: QueueTokenStatus.CALLED,
      position: 0,
      estimatedWaitMinutes: 0,
      checkedInAt: today1000,
      calledAt: new Date(),
    },
  });

  await prisma.queueToken.upsert({
    where: { appointmentId: apptEleanor.id },
    update: {},
    create: {
      tokenNumber: "#A-24",
      doctorId: drVance.id,
      patientId: eleanor.id,
      appointmentId: apptEleanor.id,
      source: QueueSource.APPOINTMENT,
      priorityTier: PriorityTier.NORMAL,
      status: QueueTokenStatus.WAITING,
      position: 3,
      estimatedWaitMinutes: 18,
      checkedInAt: new Date(),
    },
  });

  // 8. Seed Medicines & Inventory
  const atorvastatin = await prisma.medicine.upsert({
    where: { id: "med-atorvastatin-20" },
    update: {},
    create: {
      id: "med-atorvastatin-20",
      name: "Atorvastatin 20mg",
      genericName: "Atorvastatin Calcium",
      manufacturer: "Pfizer / Viatris",
      form: MedicineForm.TABLET,
      strength: "20mg",
      unit: "Tablet",
      unitPrice: 1.5,
    },
  });

  const lisinopril = await prisma.medicine.upsert({
    where: { id: "med-lisinopril-10" },
    update: {},
    create: {
      id: "med-lisinopril-10",
      name: "Lisinopril 10mg",
      genericName: "Lisinopril Dihydrate",
      manufacturer: "AstraZeneca",
      form: MedicineForm.TABLET,
      strength: "10mg",
      unit: "Tablet",
      unitPrice: 0.95,
    },
  });

  const amoxicillin = await prisma.medicine.upsert({
    where: { id: "med-amoxicillin-500" },
    update: {},
    create: {
      id: "med-amoxicillin-500",
      name: "Amoxicillin 500mg",
      genericName: "Amoxicillin Trihydrate",
      manufacturer: "Sandoz / Novartis",
      form: MedicineForm.CAPSULE,
      strength: "500mg",
      unit: "Capsule",
      unitPrice: 0.85,
    },
  });

  // Stock Locations
  const pharmacyStore = await prisma.stockLocation.upsert({
    where: { name: "Main Pharmacy Store" },
    update: {},
    create: {
      name: "Main Pharmacy Store",
      type: StockLocationType.PHARMACY,
    },
  });

  // Inventory Items
  const invAtorva = await prisma.inventoryItem.upsert({
    where: { id: "inv-atorva-20" },
    update: {},
    create: {
      id: "inv-atorva-20",
      medicineId: atorvastatin.id,
      name: "Atorvastatin 20mg",
      category: InventoryCategory.MEDICINE,
      unit: "Box of 30",
      reorderThreshold: 50,
      currentStockOnHand: 340,
    },
  });

  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  await prisma.stockBatch.upsert({
    where: { id: "batch-lot-8841" },
    update: {},
    create: {
      id: "batch-lot-8841",
      itemId: invAtorva.id,
      locationId: pharmacyStore.id,
      lotNumber: "LOT-2024-8841",
      expiryDate: nextYear,
      quantityAvailable: 340,
      unitCost: 0.65,
      status: BatchStatus.ACTIVE,
    },
  });

  // 9. Diagnostics Catalog
  await prisma.diagnosticCatalog.upsert({
    where: { code: "LAB-CMP" },
    update: {},
    create: {
      name: "Comprehensive Metabolic Panel (CMP)",
      code: "LAB-CMP",
      category: DiagnosticCategory.LABORATORY,
      sampleType: "Venous Blood",
      referenceRange: "Normal Adult Standards (Sodium, Potassium, Glucose, BUN, Creatinine)",
      price: 65.0,
    },
  });

  await prisma.diagnosticCatalog.upsert({
    where: { code: "RAD-XRAY-CHEST" },
    update: {},
    create: {
      name: "Chest X-Ray (PA & Lateral)",
      code: "RAD-XRAY-CHEST",
      category: DiagnosticCategory.RADIOLOGY,
      sampleType: "N/A",
      referenceRange: "Clear bilateral lung fields, normal cardiothoracic ratio",
      price: 110.0,
    },
  });

  await prisma.diagnosticCatalog.upsert({
    where: { code: "CARD-ECG-12" },
    update: {},
    create: {
      name: "12-Lead Electrocardiogram (Resting ECG)",
      code: "CARD-ECG-12",
      category: DiagnosticCategory.CARDIOLOGY,
      sampleType: "Surface Tracing",
      referenceRange: "Normal Sinus Rhythm at 60-100 bpm",
      price: 95.0,
    },
  });

  // 10. Inpatient Wards & Beds
  const ccuWard = await prisma.ward.upsert({
    where: { name: "Coronary Care Unit (CCU)" },
    update: {},
    create: {
      name: "Coronary Care Unit (CCU)",
      type: WardType.ICU,
      totalBeds: 8,
    },
  });

  const icuWard = await prisma.ward.upsert({
    where: { name: "Intensive Care Unit (ICU-1)" },
    update: {},
    create: {
      name: "Intensive Care Unit (ICU-1)",
      type: WardType.ICU,
      totalBeds: 10,
    },
  });

  const generalWard = await prisma.ward.upsert({
    where: { name: "Main Clinical Ward 3B" },
    update: {},
    create: {
      name: "Main Clinical Ward 3B",
      type: WardType.MALE_GENERAL,
      totalBeds: 12,
    },
  });

  // Seed CCU Beds
  for (let i = 1; i <= 6; i++) {
    const bedNum = `CCU-0${i}`;
    await prisma.bed.upsert({
      where: { wardId_bedNumber: { wardId: ccuWard.id, bedNumber: bedNum } },
      update: {},
      create: {
        wardId: ccuWard.id,
        bedNumber: bedNum,
        status: i <= 2 ? BedStatus.OCCUPIED : BedStatus.AVAILABLE,
        dailyRate: 650.0,
      },
    });
  }

  // Seed General Ward Beds
  for (let i = 1; i <= 8; i++) {
    const bedNum = `BED-30${i}-A`;
    await prisma.bed.upsert({
      where: { wardId_bedNumber: { wardId: generalWard.id, bedNumber: bedNum } },
      update: {},
      create: {
        wardId: generalWard.id,
        bedNumber: bedNum,
        status: i === 1 ? BedStatus.OCCUPIED : BedStatus.AVAILABLE,
        dailyRate: 250.0,
      },
    });
  }

  // 11. Invoices
  await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-20241024-0032" },
    update: {},
    create: {
      invoiceNumber: "INV-20241024-0032",
      patientId: eleanor.id,
      totalAmount: 120.0,
      discountAmount: 100.0,
      taxAmount: 0.0,
      netAmount: 20.0,
      paidAmount: 20.0,
      balanceAmount: 0.0,
      status: InvoiceStatus.PAID,
    },
  });

  await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2026-0042" },
    update: {},
    create: {
      invoiceNumber: "INV-2026-0042",
      patientId: eleanor.id,
      totalAmount: 420.0,
      discountAmount: 336.0,
      taxAmount: 0.0,
      netAmount: 84.0,
      paidAmount: 0.0,
      balanceAmount: 84.0,
      status: InvoiceStatus.ISSUED,
    },
  });

  console.log("✅ Database seeding complete with full enterprise clinical dataset!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
