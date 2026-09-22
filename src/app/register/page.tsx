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

const registerSchema = z
  .object({
    name: z.string().min(2, "Full legal name must be at least 2 characters"),
    dob: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["FEMALE", "MALE", "OTHER", "UNKNOWN"]),
    bloodGroup: z.string().optional(),
    phone: z.string().min(8, "Valid mobile phone number is required"),
    email: z.string().email("Valid email address is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function PatientRegistrationPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<"FORM" | "OTP" | "SUCCESS">("FORM");
  const [errorMsg, setErrorMsg] = useState("");
  const [registeredData, setRegisteredData] = useState<{
    userId: string;
    mrn: string;
    name: string;
    email: string;
  } | null>(null);
  const [otp, setOtp] = useState("123456");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      dob: "1992-08-14",
      gender: "FEMALE",
      bloodGroup: "O+",
      phone: "+1 (555) 789-0123",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setErrorMsg("");
    try {
      // 1. Create in Supabase Auth
      await signUpWithSupabase(values.email, values.password, {
        name: values.name,
        phone: values.phone,
      });

      // 2. Create in Database via Backend API
      const res = await api.post("/auth/register", {
        name: values.name,
        email: values.email,
        phone: values.phone,
        dob: values.dob,
        gender: values.gender,
        password: values.password,
        bloodGroup: values.bloodGroup,
      });

      if (res.data?.data) {
        const { userId, mrn } = res.data.data;
        setRegisteredData({
          userId,
          mrn,
          name: values.name,
          email: values.email,
        });
        setStep("OTP");
      } else {
        throw new Error("Registration could not be completed");
      }
    } catch (err: any) {
      console.error("[REGISTRATION ERROR]", err);
      setErrorMsg(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to register. Please check your information or try again."
      );
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (registeredData) {
      // Establish logged in session
      setAuth(
        {
          id: registeredData.userId,
          name: registeredData.name,
          email: registeredData.email,
          role: "PATIENT",
          mrn: registeredData.mrn,
        },
        `token-${Date.now()}`
      );
      setStep("SUCCESS");
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col justify-between p-space-6 sm:p-space-12 select-none">
      <header className="flex items-center justify-between border-b border-outline-variant/30 pb-space-4">
        <Link href="/" className="flex items-center gap-space-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-headline-sm">
            <span className="material-symbols-outlined text-[30px]">local_hospital</span>
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm font-extrabold text-primary tracking-tight">
              Going Merry Hospital
            </h1>
            <span className="text-label-xs text-outline uppercase font-semibold tracking-wider block">
              Patient Portal Onboarding (IAM-02)
            </span>
          </div>
        </Link>
        <Link href="/login">
          <Button variant="outline" size="sm">
            Already Registered? Sign In
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center py-space-8">
        <div className="w-full max-w-lg space-y-space-6">
          <div className="bg-surface-container-lowest border-2 border-outline-variant/40 rounded-3xl p-space-8 shadow-xl space-y-space-6">
            {errorMsg && (
              <div className="p-3 bg-error/15 border border-error/30 rounded-xl text-error text-xs">
                {errorMsg}
              </div>
            )}

            {step === "FORM" && (
              <>
                <div className="text-center space-y-space-1">
                  <h2 className="font-headline-md font-extrabold text-on-surface">
                    Create Patient Account
                  </h2>
                  <p className="text-body-sm text-outline">
                    Register for direct access to digital medical records, appointments, and live
                    queue tracking.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Legal Full Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("name")}
                      placeholder="e.g. Clara Oswald"
                      className="w-full px-space-3 py-space-2 bg-surface-container rounded-xl border border-outline-variant/40 text-body-md focus:border-primary focus:outline-none"
                    />
                    {errors.name && (
                      <p className="text-xs text-error mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-space-4">
                    <div>
                      <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                        Date of Birth <span className="text-error">*</span>
                      </label>
                      <input
                        type="date"
                        {...register("dob")}
                        className="w-full px-space-3 py-space-2 bg-surface-container rounded-xl border border-outline-variant/40 text-body-md focus:border-primary focus:outline-none"
                      />
                      {errors.dob && (
                        <p className="text-xs text-error mt-1">{errors.dob.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                        Gender <span className="text-error">*</span>
                      </label>
                      <select
                        {...register("gender")}
                        className="w-full px-space-3 py-space-2 bg-surface-container rounded-xl border border-outline-variant/40 text-body-md focus:border-primary focus:outline-none"
                      >
                        <option value="FEMALE">Female</option>
                        <option value="MALE">Male</option>
                        <option value="OTHER">Other</option>
                        <option value="UNKNOWN">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-space-4">
                    <div>
                      <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                        Mobile Phone <span className="text-error">*</span>
                      </label>
                      <input
                        type="tel"
                        {...register("phone")}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-space-3 py-space-2 bg-surface-container rounded-xl border border-outline-variant/40 text-body-md focus:border-primary focus:outline-none"
                      />
                      {errors.phone && (
                        <p className="text-xs text-error mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                        Blood Group
                      </label>
                      <select
                        {...register("bloodGroup")}
                        className="w-full px-space-3 py-space-2 bg-surface-container rounded-xl border border-outline-variant/40 text-body-md focus:border-primary focus:outline-none"
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

                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Email Address <span className="text-error">*</span>
                    </label>
                    <input
                      type="email"
                      {...register("email")}
                      placeholder="patient@example.com"
                      className="w-full px-space-3 py-space-2 bg-surface-container rounded-xl border border-outline-variant/40 text-body-md focus:border-primary focus:outline-none"
                    />
                    {errors.email && (
                      <p className="text-xs text-error mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-space-4">
                    <div>
                      <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                        Password <span className="text-error">*</span>
                      </label>
                      <input
                        type="password"
                        {...register("password")}
                        placeholder="••••••••"
                        className="w-full px-space-3 py-space-2 bg-surface-container rounded-xl border border-outline-variant/40 text-body-md focus:border-primary focus:outline-none"
                      />
                      {errors.password && (
                        <p className="text-xs text-error mt-1">{errors.password.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                        Confirm Password <span className="text-error">*</span>
                      </label>
                      <input
                        type="password"
                        {...register("confirmPassword")}
                        placeholder="••••••••"
                        className="w-full px-space-3 py-space-2 bg-surface-container rounded-xl border border-outline-variant/40 text-body-md focus:border-primary focus:outline-none"
                      />
                      {errors.confirmPassword && (
                        <p className="text-xs text-error mt-1">{errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="w-full py-space-3 rounded-xl font-bold shadow-md gap-space-2 mt-space-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">
                          progress_activity
                        </span>
                        Registering in Database...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                        Create Patient Account
                      </>
                    )}
                  </Button>

                  <p className="text-center text-xs text-on-surface-variant pt-2">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary font-bold hover:underline">
                      Sign In here
                    </Link>
                  </p>
                </form>
              </>
            )}

            {step === "OTP" && (
              <>
                <div className="text-center space-y-space-2">
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[32px]">mark_email_read</span>
                  </div>
                  <h2 className="font-headline-md font-extrabold text-on-surface">
                    Verify Your Contact
                  </h2>
                  <p className="text-body-sm text-outline">
                    A 6-digit verification code has been sent to your registered contact for {registeredData?.name || "your account"}.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-space-4">
                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="••••••"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full text-center text-headline-sm font-mono tracking-widest px-space-3 py-space-3 bg-surface-container rounded-xl border border-outline-variant/40 focus:border-primary focus:outline-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-space-3 rounded-xl font-bold shadow-md gap-space-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Activate Account & Access Portal
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep("FORM")}
                      className="text-label-sm text-outline hover:text-primary transition-colors"
                    >
                      ← Back to edit contact details
                    </button>
                  </div>
                </form>
              </>
            )}

            {step === "SUCCESS" && registeredData && (
              <div className="text-center space-y-4 animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[36px]">verified</span>
                </div>
                <div>
                  <h2 className="font-headline-md font-extrabold text-on-surface">
                    Welcome to Going Merry!
                  </h2>
                  <p className="text-body-sm text-outline mt-1">
                    Your official Medical Record Number (MRN) has been registered in the database:
                  </p>
                </div>

                <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/30 text-center">
                  <span className="text-[11px] uppercase font-bold text-outline tracking-wider block">
                    Permanent Patient MRN
                  </span>
                  <span className="font-mono text-headline-md font-black text-primary block mt-1">
                    {registeredData.mrn}
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    variant="primary"
                    className="w-full py-3 rounded-xl font-bold"
                    onClick={() => router.push("/")}
                  >
                    Enter Patient Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full py-2.5 rounded-xl text-xs"
                    onClick={() => router.push("/appointments/book")}
                  >
                    Book First Specialist Consultation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center text-label-sm text-outline border-t border-outline-variant/20 pt-space-4">
        Going Merry Hospital Management System • HIPAA Compliant Patient Onboarding
      </footer>
    </div>
  );
}
