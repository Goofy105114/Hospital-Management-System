"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { signUpWithSupabase } from "@/lib/supabase";
import { isValidEmail, isValidName } from "@/lib/utils";
import api from "@/lib/axios";

const inventoryRegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, "Full legal name is required")
      .refine(isValidName, "Full name must contain letters and cannot be purely numbers"),
    email: z
      .string()
      .email("Valid hospital email is required")
      .refine(
        isValidEmail,
        "Email username cannot consist of only numbers or start with a number"
      ),
    depotId: z.string().min(2, "Depot / central warehouse unit ID is required"),
    employeeCode: z.string().min(3, "Supply chain employee ID is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type InventoryRegisterFormValues = z.infer<typeof inventoryRegisterSchema>;

export default function InventoryRegisterPage() {
  const router = useRouter();
  const { setAuth, setActiveRole } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InventoryRegisterFormValues>({
    resolver: zodResolver(inventoryRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      depotId: "CENTRAL-LOGISTICS-DEPOT",
      employeeCode: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: InventoryRegisterFormValues) => {
    setErrorMsg("");
    try {
      try {
        await signUpWithSupabase(values.email, values.password, {
          name: values.name,
          role: "INVENTORY_MANAGER",
        });
      } catch {
        // Non-blocking if offline/mock
      }

      try {
        await api.post("/admin/users", {
          name: values.name,
          email: values.email,
          role: "INVENTORY_MANAGER",
          password: values.password,
        });
      } catch {
        // Fallback
      }

      const invId = `inv-${Date.now()}`;
      setAuth(
        {
          id: invId,
          name: values.name,
          email: values.email,
          role: "INVENTORY_MANAGER",
        },
        `token-${Date.now()}`
      );
      setActiveRole("INVENTORY_MANAGER");
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to register inventory manager profile.");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/40 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-600/15 text-orange-700 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[36px]">inventory_2</span>
          </div>
          <h2 className="text-2xl font-black text-on-surface">Supply Chain Officer Enrolled</h2>
          <p className="text-xs text-outline mt-1">
            Warehouse privileges, FIFO batch management, purchase orders, and stock transfers unlocked.
          </p>

          <Button
            variant="primary"
            className="w-full h-11 font-bold rounded-xl mt-6 bg-orange-700 hover:bg-orange-800 text-white"
            onClick={() => router.push("/inventory-manager")}
          >
            Launch Supply & Inventory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <Link
          href="/inventory-manager/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-outline hover:text-orange-700 transition-colors mb-4"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Inventory Sign In</span>
        </Link>

        <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-600/10 text-orange-700 flex items-center justify-center shadow-xs mb-3">
          <span className="material-symbols-outlined text-[32px]">inventory_2</span>
        </div>

        <h1 className="text-2xl font-black text-on-surface tracking-tight">
          Supply Chain Onboarding
        </h1>
        <p className="text-xs text-outline mt-1 max-w-sm mx-auto">
          Register warehouse officers, procurement coordinators, and medical stock controllers.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-surface-container-lowest py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-outline-variant/40">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {errorMsg && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                Full Legal Name
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="Franky Logistics"
                className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-orange-600 focus:ring-1 focus:ring-orange-600 text-sm font-medium"
              />
              {errors.name && (
                <p className="text-[11px] text-error mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                Supply Chain Work Email
              </label>
              <input
                type="email"
                {...register("email")}
                placeholder="franky.stock@goingmerry.hms"
                className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-orange-600 focus:ring-1 focus:ring-orange-600 text-sm font-medium"
              />
              {errors.email && (
                <p className="text-[11px] text-error mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Depot / Warehouse ID
                </label>
                <input
                  type="text"
                  {...register("depotId")}
                  placeholder="CENTRAL-LOGISTICS-DEPOT"
                  className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-orange-600 focus:ring-1 focus:ring-orange-600 text-sm font-medium"
                />
                {errors.depotId && (
                  <p className="text-[11px] text-error mt-1">{errors.depotId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Employee Code
                </label>
                <input
                  type="text"
                  {...register("employeeCode")}
                  placeholder="SCM-2026-09"
                  className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-orange-600 focus:ring-1 focus:ring-orange-600 text-sm font-medium"
                />
                {errors.employeeCode && (
                  <p className="text-[11px] text-error mt-1">{errors.employeeCode.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  {...register("password")}
                  className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-orange-600 focus:ring-1 focus:ring-orange-600 text-sm font-medium"
                />
                {errors.password && (
                  <p className="text-[11px] text-error mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  {...register("confirmPassword")}
                  className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-orange-600 focus:ring-1 focus:ring-orange-600 text-sm font-medium"
                />
                {errors.confirmPassword && (
                  <p className="text-[11px] text-error mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 font-bold rounded-xl mt-4 bg-orange-700 hover:bg-orange-800 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enrolling Officer..." : "Register Inventory Account"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-outline-variant/20 text-center">
            <p className="text-xs text-outline">
              Already enrolled?{" "}
              <Link href="/inventory-manager/login" className="font-bold text-orange-700 hover:underline">
                Sign In to Supply & Inventory
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
