import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbUsers = await prisma.user.findMany({
      where: {
        role: {
          not: "PATIENT",
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(successResponse(dbUsers));
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
    const { name, email, phone, role, password } = body;

    const passwordHash = await hashPassword(password || "Password123!");

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || "+1 (555) 000-0000",
        role: role || "NURSE",
        status: "ACTIVE",
        passwordHash,
      },
    });

    return NextResponse.json(
      successResponse({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      }),
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
