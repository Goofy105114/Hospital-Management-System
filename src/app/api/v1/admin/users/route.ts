import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FALLBACK_STAFF = [
  {
    id: "usr-01",
    name: "Dr. Marcus Vance",
    email: "marcus.vance@goingmerry.org",
    phone: "+1 (555) 100-2001",
    role: "DOCTOR",
    department: "Cardiology",
    status: "ACTIVE",
    lastLoginAt: "Today, 08:30 AM",
  },
  {
    id: "usr-02",
    name: "Dr. Sarah Jenkins",
    email: "sarah.jenkins@goingmerry.org",
    phone: "+1 (555) 100-2002",
    role: "DOCTOR",
    department: "Pediatrics",
    status: "ACTIVE",
    lastLoginAt: "Today, 08:45 AM",
  },
  {
    id: "usr-03",
    name: "Elena Rostova",
    email: "elena.rostova@goingmerry.org",
    phone: "+1 (555) 100-3001",
    role: "PHARMACIST",
    department: "Central Pharmacy",
    status: "ACTIVE",
    lastLoginAt: "Today, 07:50 AM",
  },
  {
    id: "usr-04",
    name: "Alex Morgan",
    email: "alex.morgan@goingmerry.org",
    phone: "+1 (555) 100-4001",
    role: "LAB_TECH",
    department: "Diagnostics Laboratory",
    status: "ACTIVE",
    lastLoginAt: "Yesterday, 04:20 PM",
  },
  {
    id: "usr-05",
    name: "David Ross",
    email: "david.ross@goingmerry.org",
    phone: "+1 (555) 100-5001",
    role: "NURSE",
    department: "Emergency Triage",
    status: "ACTIVE",
    lastLoginAt: "Today, 07:00 AM",
  },
  {
    id: "usr-06",
    name: "Rachel Zane",
    email: "rachel.zane@goingmerry.org",
    phone: "+1 (555) 100-6001",
    role: "BILLING_STAFF",
    department: "Cashier & Billing",
    status: "ACTIVE",
    lastLoginAt: "Today, 09:10 AM",
  },
  {
    id: "usr-07",
    name: "Arthur Pendelton (Former)",
    email: "arthur.pendelton@goingmerry.org",
    phone: "+1 (555) 100-7001",
    role: "ADMIN",
    department: "Hospital Administration",
    status: "LOCKED",
    lastLoginAt: "Oct 10, 2026",
  },
];

export async function GET() {
  try {
    try {
      const dbUsers = await prisma.user.findMany({
        where: {
          role: {
            not: "PATIENT",
          },
        },
      });
      if (dbUsers.length > 0) {
        return NextResponse.json(successResponse(dbUsers));
      }
    } catch {
      // Fallback
    }

    return NextResponse.json(successResponse(FALLBACK_STAFF));
  } catch (error) {
    return NextResponse.json(
      errorResponse("ADM_USERS_FETCH_FAILED", "Failed to retrieve staff users", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, role, department } = body;

    const newUser = {
      id: `usr-${Date.now()}`,
      name,
      email,
      phone: phone || "+1 (555) 000-0000",
      role: role || "NURSE",
      department: department || "General",
      status: "ACTIVE",
      lastLoginAt: "Never",
    };

    return NextResponse.json(successResponse(newUser), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      errorResponse("ADM_USER_CREATE_FAILED", "Failed to onboard staff user", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
