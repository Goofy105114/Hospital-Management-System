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

const receptionistRegisterSchema = z
  .object({
    name: z.string().min(2, "Full name is required"),
    email: z.string().email("Valid hospital email is required"),
    terminalId: z.string().min(2, "Reception terminal / desk ID is required"),
    shift: z.enum(["MORNING", "EVENING", "NIGHT", "ROTATING"]),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ReceptionistRegisterFormValues = z.infer<typeof receptionistRegisterSchema>;

export default function ReceptionistRegisterPage() {
  const router = useRouter();
  const { setAuth, setActiveRole } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReceptionistRegisterFormValues>({
    resolver: zodResolver(receptionistRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      terminalId: "DESK-A1-MAIN",
      shift: "MORNING",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ReceptionistRegisterFormValues) => {
    setErrorMsg("");
    try {
      await signUpWithSupabase(values.email, values.password, {
        name: values.name,
        role: "RECEPTIONIST",
      });

      const recId = `rec-${Date.now()}`;
      setAuth(
        {
          id: recId,
          name: values.name,
          email: values.email,
          role: "RECEPTIONIST",
        },
        `token-${Date.now()}`
      );
      setActiveRole("RECEPTIONIST");
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to register front desk account.");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/40 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600/15 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[36px]">badge</span>
          </div>
          <h2 className="text-2xl font-black text-on-surface">Receptionist Enrolled</h2>
          <p className="text-xs text-outline mt-1">
            Front desk workstation credentials and queue dispatch privileges have been created.
          </p>

          <Button
            variant="primary"
            className="w-full h-11 font-bold rounded-xl mt-6 bg-emerald-700 hover:bg-emerald-800 text-white"
            onClick={() => router.push("/patients")}
          >
            Launch Front Desk Directory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <Link
          href="/receptionist/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-outline hover:text-emerald-700 transition-colors mb-4"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Front Desk Sign In</span>
        </Link>

        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center shadow-xs mb-3">
          <span className="material-symbols-outlined text-[32px]">how_to_reg</span>
        </div>

        <h1 className="text-2xl font-black text-on-surface tracking-tight">Staff Registration</h1>
        <p className="text-xs text-outline mt-1 max-w-sm mx-auto">
          Enroll front office, intake coordination, and appointment scheduling desk staff.
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
                Full Staff Name
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="Sarah Connor"
                className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-emerald-600 text-sm font-medium"
              />
              {errors.name && <p className="text-[11px] text-error mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Hospital Work Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="reception.staff@goingmerry.hms"
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-emerald-600 text-sm font-medium"
                />
                {errors.email && (
                  <p className="text-[11px] text-error mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Desk / Station Code
                </label>
                <input
                  type="text"
                  {...register("terminalId")}
                  placeholder="DESK-A1-MAIN"
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-emerald-600 text-sm font-medium font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                Assigned Shift
              </label>
              <select
                {...register("shift")}
                className="w-full h-10 px-2.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-emerald-600 text-xs"
              >
                <option value="MORNING">Morning Shift (07:00 - 15:30)</option>
                <option value="EVENING">Evening Shift (15:00 - 23:30)</option>
                <option value="NIGHT">Night Shift (23:00 - 07:30)</option>
                <option value="ROTATING">Rotating Shift</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  {...register("password")}
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-emerald-600 text-sm font-medium"
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
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-emerald-600 text-sm font-medium"
                />
                {errors.confirmPassword && (
                  <p className="text-[11px] text-error mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 font-bold rounded-xl mt-4 bg-emerald-700 hover:bg-emerald-800 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enrolling Desk Staff..." : "Enroll Receptionist Profile"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-outline-variant/20 text-center">
            <p className="text-xs text-outline">
              Already enrolled at reception?{" "}
              <Link
                href="/receptionist/login"
                className="font-bold text-emerald-700 hover:underline"
              >
                Sign In to Front Desk
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
