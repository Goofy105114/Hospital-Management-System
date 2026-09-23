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

const adminRegisterSchema = z
  .object({
    name: z.string().min(2, "Full name is required"),
    email: z.string().email("Valid institutional administrative email is required"),
    department: z.string().min(2, "Department is required"),
    securityKey: z.string().min(4, "Admin master enrollment key is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type AdminRegisterFormValues = z.infer<typeof adminRegisterSchema>;

export default function AdminRegisterPage() {
  const router = useRouter();
  const { setAuth, setActiveRole } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AdminRegisterFormValues>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      department: "Hospital Administration & Governance",
      securityKey: "GOINGMERRY-ADMIN-2026",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: AdminRegisterFormValues) => {
    setErrorMsg("");
    try {
      if (values.securityKey !== "GOINGMERRY-ADMIN-2026") {
        throw new Error("Invalid security authorization key. Contact hospital director.");
      }

      await signUpWithSupabase(values.email, values.password, {
        name: values.name,
        role: "ADMIN",
      });

      const adminId = `admin-${Date.now()}`;
      setAuth(
        {
          id: adminId,
          name: values.name,
          email: values.email,
          role: "ADMIN",
        },
        `token-${Date.now()}`
      );
      setActiveRole("ADMIN");
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to register administrator account.");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/40 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900/15 text-slate-900 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[36px]">shield_person</span>
          </div>
          <h2 className="text-2xl font-black text-on-surface">Admin Privileges Granted</h2>
          <p className="text-xs text-outline mt-1">
            Your administrative profile has been authorized for IAM, auditing, and system
            operations.
          </p>

          <Button
            variant="primary"
            className="w-full h-11 font-bold rounded-xl mt-6 bg-slate-900 hover:bg-slate-800 text-white"
            onClick={() => router.push("/admin")}
          >
            Launch Admin Console
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-outline hover:text-slate-900 transition-colors mb-4"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Admin Sign In</span>
        </Link>

        <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-900/10 text-slate-900 flex items-center justify-center shadow-xs mb-3">
          <span className="material-symbols-outlined text-[32px]">admin_panel_settings</span>
        </div>

        <h1 className="text-2xl font-black text-on-surface tracking-tight">Admin Onboarding</h1>
        <p className="text-xs text-outline mt-1 max-w-sm mx-auto">
          Enroll administrative staff with governance, facility configuration, and audit privileges.
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
                Full Administrative Name
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="Hospital Director / Ops Officer"
                className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-slate-800 text-sm font-medium"
              />
              {errors.name && <p className="text-[11px] text-error mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Institutional Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="admin.name@goingmerry.hms"
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-slate-800 text-sm font-medium"
                />
                {errors.email && (
                  <p className="text-[11px] text-error mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Admin Department
                </label>
                <input
                  type="text"
                  {...register("department")}
                  placeholder="Operations & Governance"
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-slate-800 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <div className="mb-1">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Admin Master Passkey / Secret Key
                </label>
              </div>
              <input
                type="password"
                {...register("securityKey")}
                placeholder="Enter authorized administrator key"
                className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-slate-800 text-sm font-medium font-mono"
              />
              {errors.securityKey && (
                <p className="text-[11px] text-error mt-1">{errors.securityKey.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  {...register("password")}
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-slate-800 text-sm font-medium"
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
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-slate-800 text-sm font-medium"
                />
                {errors.confirmPassword && (
                  <p className="text-[11px] text-error mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 font-bold rounded-xl mt-4 bg-slate-900 hover:bg-slate-800 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Authorizing Admin..." : "Enroll Administrator Profile"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-outline-variant/20 text-center">
            <p className="text-xs text-outline">
              Already have an administrative account?{" "}
              <Link href="/admin/login" className="font-bold text-slate-800 hover:underline">
                Sign In to Admin Console
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
