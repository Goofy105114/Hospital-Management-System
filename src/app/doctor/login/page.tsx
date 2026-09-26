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
import { isValidEmail } from "@/lib/utils";
import api from "@/lib/axios";

const doctorLoginSchema = z.object({
  identifier: z
    .string()
    .min(3, "Please enter your hospital clinician email or Doctor ID")
    .refine((val) => {
      if (val.includes("@")) {
        return isValidEmail(val);
      }
      return true;
    }, "Email username cannot consist of only numbers or start with a number"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

type DoctorLoginFormValues = z.infer<typeof doctorLoginSchema>;

export default function DoctorLoginPage() {
  const router = useRouter();
  const { setAuth, setActiveRole } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DoctorLoginFormValues>({
    resolver: zodResolver(doctorLoginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (values: DoctorLoginFormValues) => {
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
        throw new Error(res.data?.error?.message || "Invalid doctor credentials.");
      }

      const authUser = res.data.data.user;
      const token = res.data.data.accessToken;

      setAuth(authUser, token);
      setActiveRole("DOCTOR");
      router.push("/doctor/dashboard");
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        "Invalid doctor credentials. Please verify your email and password.";
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
          className="inline-flex items-center gap-2 text-xs font-semibold text-outline hover:text-sky-600 transition-colors mb-4"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Portal Selection</span>
        </Link>

        <div className="mx-auto w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center shadow-xs mb-3">
          <span className="material-symbols-outlined text-[32px]">stethoscope</span>
        </div>

        <h1 className="text-2xl font-black text-on-surface tracking-tight">
          Clinician Workspace Login
        </h1>
        <p className="text-xs text-outline mt-1 max-w-sm mx-auto">
          Access the EMR encounter queue, clinical SOAP documentation, ICD-10 codings, and
          e-prescribing.
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
                Hospital Email or Doctor ID
              </label>
              <input
                type="text"
                {...register("identifier")}
                placeholder="dr.vance@goingmerry.hms"
                className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm font-medium"
              />
              {errors.identifier && (
                <p className="text-[11px] text-error mt-1">{errors.identifier.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                {...register("password")}
                className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm font-medium"
              />
              {errors.password && (
                <p className="text-[11px] text-error mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 font-bold rounded-xl mt-2 bg-sky-600 hover:bg-sky-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying Credentials..." : "Enter Doctor Workspace"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-outline-variant/20 text-center">
            <p className="text-xs text-outline">
              New clinician joining the hospital?{" "}
              <Link href="/doctor/register" className="font-bold text-sky-600 hover:underline">
                Register Clinician Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
