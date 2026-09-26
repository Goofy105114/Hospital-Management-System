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
import api from "@/lib/axios";

const patientRegisterSchema = z
  .object({
    name: z.string().min(2, "Full legal name is required"),
    dob: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["FEMALE", "MALE", "OTHER", "UNKNOWN"]),
    bloodGroup: z.string().optional(),
    phone: z.string().min(8, "Valid mobile phone number is required"),
    email: z.string().email("Valid email address is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PatientRegisterFormValues = z.infer<typeof patientRegisterSchema>;

export default function PatientRegisterPage() {
  const router = useRouter();
  const { setAuth, setActiveRole } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [newMrn, setNewMrn] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientRegisterFormValues>({
    resolver: zodResolver(patientRegisterSchema),
    defaultValues: {
      name: "",
      dob: "1995-04-12",
      gender: "FEMALE",
      bloodGroup: "O+",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: PatientRegisterFormValues) => {
    setErrorMsg("");
    try {
      await signUpWithSupabase(values.email, values.password, {
        name: values.name,
        phone: values.phone,
      });

      const res = await api.post("/auth/register", {
        name: values.name,
        email: values.email,
        phone: values.phone,
        dob: values.dob,
        gender: values.gender,
        password: values.password,
        bloodGroup: values.bloodGroup,
      });

      const data = res.data?.data;
      if (!data) {
        throw new Error("Registration response was invalid. Please try again.");
      }

      const registeredMrn = data.mrn || "";
      const userId = data.userId || data.id || "";

      setNewMrn(registeredMrn);
      setAuth(
        {
          id: userId,
          name: values.name,
          email: values.email,
          role: "PATIENT",
          mrn: registeredMrn,
        },
        data.token || ""
      );
      setActiveRole("PATIENT");
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error?.message || err?.message || "Failed to create patient account. Please verify your details.");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/40 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-success/15 text-success flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[36px]">verified</span>
          </div>
          <h2 className="text-2xl font-black text-on-surface">Registration Complete!</h2>
          <p className="text-xs text-outline mt-1">
            Your personal health record and permanent MRN have been created.
          </p>

          <div className="my-6 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider block">
              Permanent Medical Record Number (MRN)
            </span>
            <span className="font-mono text-2xl font-black text-primary tracking-wider mt-1 block">
              {newMrn}
            </span>
          </div>

          <Button
            variant="primary"
            className="w-full h-11 font-bold rounded-xl"
            onClick={() => router.push("/")}
          >
            Go to Patient Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <Link
          href="/patient/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-outline hover:text-primary transition-colors mb-4"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Patient Sign In</span>
        </Link>

        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs mb-3">
          <span className="material-symbols-outlined text-[32px]">person_add</span>
        </div>

        <h1 className="text-2xl font-black text-on-surface tracking-tight">
          Create Patient Account
        </h1>
        <p className="text-xs text-outline mt-1 max-w-sm mx-auto">
          Register to book doctor visits, monitor real-time queue tokens, and view clinical test
          reports.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
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
                Full Legal Name
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="e.g. Johnathan Doe"
                className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-primary text-sm font-medium"
              />
              {errors.name && <p className="text-[11px] text-error mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  {...register("dob")}
                  className="w-full h-10 px-2.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Gender
                </label>
                <select
                  {...register("gender")}
                  className="w-full h-10 px-2 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-primary text-xs"
                >
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="OTHER">Other</option>
                  <option value="UNKNOWN">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Blood Group
                </label>
                <select
                  {...register("bloodGroup")}
                  className="w-full h-10 px-2 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-primary text-xs"
                >
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Mobile Phone
                </label>
                <input
                  type="tel"
                  {...register("phone")}
                  placeholder="+1 (555) 000-0000"
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-primary text-sm font-medium"
                />
                {errors.phone && (
                  <p className="text-[11px] text-error mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="name@example.com"
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-primary text-sm font-medium"
                />
                {errors.email && (
                  <p className="text-[11px] text-error mt-1">{errors.email.message}</p>
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
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-primary text-sm font-medium"
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
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-primary text-sm font-medium"
                />
                {errors.confirmPassword && (
                  <p className="text-[11px] text-error mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 font-bold rounded-xl mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Generating Health Records & MRN..." : "Complete Registration"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-outline-variant/20 text-center">
            <p className="text-xs text-outline">
              Already have an account or MRN?{" "}
              <Link href="/patient/login" className="font-bold text-primary hover:underline">
                Sign In to Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
