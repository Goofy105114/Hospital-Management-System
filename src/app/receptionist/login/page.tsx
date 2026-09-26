"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { signInWithSupabase } from "@/lib/supabase";
import api from "@/lib/axios";

const receptionistLoginSchema = z.object({
  identifier: z.string().min(3, "Please enter your front desk email or employee code"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

type ReceptionistLoginFormValues = z.infer<typeof receptionistLoginSchema>;

export default function ReceptionistLoginPage() {
  const router = useRouter();
  const { setAuth, setActiveRole } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReceptionistLoginFormValues>({
    resolver: zodResolver(receptionistLoginSchema),
    defaultValues: {
      identifier: "receptionist@goingmerry.hms",
      password: "Password123!",
    },
  });

  const onSubmit = async (values: ReceptionistLoginFormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      try {
        await signInWithSupabase(values.identifier, values.password);
      } catch {
        // Non-blocking if offline
      }

      const res = await api.post("/auth/login", {
        identifier: values.identifier,
        password: values.password,
      });

      if (!res.data?.success || !res.data?.data?.user) {
        throw new Error(res.data?.error?.message || "Invalid credentials.");
      }

      const authUser = res.data.data.user;
      const token = res.data.data.accessToken;

      setAuth(authUser, token);
      setActiveRole("RECEPTIONIST");
      router.push("/receptionist");
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        "Invalid credentials. Please verify your email and password.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-outline hover:text-emerald-700 transition-colors mb-4"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Portal Selection</span>
        </Link>

        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center shadow-xs mb-3">
          <span className="material-symbols-outlined text-[32px]">desk</span>
        </div>

        <h1 className="text-2xl font-black text-on-surface tracking-tight">
          Front Desk & Reception Login
        </h1>
        <p className="text-xs text-outline mt-1 max-w-sm mx-auto">
          OPD patient walk-in triage, live queue token dispensing, doctor roster scheduling, and
          kiosk supervision.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
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
                Desk Email or Staff ID
              </label>
              <input
                type="text"
                {...register("identifier")}
                placeholder="receptionist@goingmerry.hms"
                className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm font-medium"
              />
              {errors.identifier && (
                <p className="text-[11px] text-error mt-1">{errors.identifier.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-emerald-700 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                {...register("password")}
                className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm font-medium"
              />
              {errors.password && (
                <p className="text-[11px] text-error mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 font-bold rounded-xl mt-2 bg-emerald-700 hover:bg-emerald-800 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Open Reception Workstation"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-outline-variant/20 text-center">
            <p className="text-xs text-outline">
              New receptionist or front desk staff?{" "}
              <Link
                href="/receptionist/register"
                className="font-bold text-emerald-700 hover:underline"
              >
                Register Front Desk Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
