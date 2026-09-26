import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { validateStaffOnboardingInput } from "@/server/domain/system-config";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const users = await prisma.user.findMany({
      where: {
        role: role ? (role.toUpperCase() as UserRole) : { not: "PATIENT" },
        ...(status ? { status: status.toUpperCase() as any } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      successResponse(users, `Retrieved ${users.length} staff users`)
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse("ADM_USERS_FETCH_FAILED", "Failed to retrieve staff users", {
        error: error.message || String(error),
      }),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = validateStaffOnboardingInput({
      name: body.name,
      email: body.email,
      phone: body.phone,
      role: body.role,
      departmentId: body.departmentId,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        errorResponse(
          validation.errorCode || "VALIDATION_FAILED",
          validation.errorMessage || "Invalid staff onboarding input"
        ),
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        errorResponse(
          "ADM_EMAIL_EXISTS",
          "A user with this email address already exists"
        ),
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(body.password || "Password123!");

    const created = await prisma.user.create({
      data: {
        name: body.name.trim(),
        email: body.email.toLowerCase().trim(),
        phone: body.phone || "+1 (555) 000-0000",
        role: body.role.toUpperCase() as UserRole,
        passwordHash,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(
      successResponse(
        {
          id: created.id,
          name: created.name,
          email: created.email,
          phone: created.phone,
          role: created.role,
          status: created.status,
          createdAt: created.createdAt.toISOString(),
          message: "Staff member onboarded successfully",
        },
        "Staff member onboarded successfully"
      ),
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse("ADM_USER_CREATE_FAILED", "Failed to onboard staff user", {
        error: error.message || String(error),
      }),
      { status: 500 }
    );
  }
}
