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

const patientLoginSchema = z.object({
  identifier: z
    .string()
    .min(3, "Please enter your registered email or MRN")
    .refine((val) => {
      if (val.includes("@")) {
        return isValidEmail(val);
      }
      return true;
    }, "Email username cannot consist of only numbers or start with a number"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

type PatientLoginFormValues = z.infer<typeof patientLoginSchema>;

export default function PatientLoginPage() {
  const router = useRouter();
  const { setAuth, setActiveRole } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PatientLoginFormValues>({
    resolver: zodResolver(patientLoginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (values: PatientLoginFormValues) => {
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
        throw new Error(res.data?.error?.message || "Invalid email or password.");
      }

      const authUser = res.data.data.user;
      const token = res.data.data.accessToken;

      setAuth(authUser, token);
      setActiveRole("PATIENT");
      router.push("/");
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
    <div className="min-h-screen bg-surface-container-lowest flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-outline hover:text-primary transition-colors mb-4"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Portal Selection</span>
        </Link>

        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs mb-3">
          <span className="material-symbols-outlined text-[32px]">personal_injury</span>
        </div>

        <h1 className="text-2xl font-black text-on-surface tracking-tight">Patient Portal Login</h1>
        <p className="text-xs text-outline mt-1 max-w-sm mx-auto">
          Access your medical records, check live queue tokens, view lab findings, and pay clinic
          co-pays.
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-container-lowest py-6 sm:py-8 px-4 sm:px-10 shadow-xl rounded-2xl sm:rounded-3xl border border-outline-variant/40">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {errorMsg && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                Email or MRN
              </label>
              <input
                type="text"
                {...register("identifier")}
                placeholder="patient@example.com or MRN-12345"
                className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary text-sm font-medium"
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
                className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary text-sm font-medium"
              />
              {errors.password && (
                <p className="text-[11px] text-error mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 font-bold rounded-xl mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Authenticating..." : "Sign In to Patient Portal"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-outline-variant/20 text-center">
            <p className="text-xs text-outline">
              New patient without an account?{" "}
              <Link href="/patient/register" className="font-bold text-primary hover:underline">
                Create Patient Profile
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
