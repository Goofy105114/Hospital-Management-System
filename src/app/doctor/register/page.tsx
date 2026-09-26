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

const doctorRegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, "Full legal title & name is required (e.g. Dr. Jane Smith, MD)")
      .refine(isValidName, "Full name must contain letters and cannot be purely numbers"),
    email: z
      .string()
      .email("Valid hospital or institutional email is required")
      .refine(
        isValidEmail,
        "Email username cannot consist of only numbers or start with a number"
      ),
    medicalLicenseNumber: z.string().min(4, "State medical license number is required"),
    department: z.string().min(2, "Department is required"),
    specialization: z.string().min(2, "Specialization / sub-specialty is required"),
    roomNumber: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type DoctorRegisterFormValues = z.infer<typeof doctorRegisterSchema>;

export default function DoctorRegisterPage() {
  const router = useRouter();
  const { setAuth, setActiveRole } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DoctorRegisterFormValues>({
    resolver: zodResolver(doctorRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      medicalLicenseNumber: "MD-99420-CA",
      department: "Cardiology",
      specialization: "Interventional Cardiology",
      roomNumber: "Clinic 304",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: DoctorRegisterFormValues) => {
    setErrorMsg("");
    try {
      await signUpWithSupabase(values.email, values.password, {
        name: values.name,
        role: "DOCTOR",
      });

      const doctorId = `doc-${Date.now()}`;
      setAuth(
        {
          id: doctorId,
          name: values.name,
          email: values.email,
          role: "DOCTOR",
          doctorId: doctorId,
        },
        `token-${Date.now()}`
      );
      setActiveRole("DOCTOR");
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to register clinician profile.");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/40 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/15 text-sky-600 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[36px]">verified_user</span>
          </div>
          <h2 className="text-2xl font-black text-on-surface">Clinician Onboarded</h2>
          <p className="text-xs text-outline mt-1">
            Your clinical workstation credentials and EMR profile have been created.
          </p>

          <Button
            variant="primary"
            className="w-full h-11 font-bold rounded-xl mt-6 bg-sky-600 hover:bg-sky-700 text-white"
            onClick={() => router.push("/doctor")}
          >
            Launch Doctor Workstation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <Link
          href="/doctor/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-outline hover:text-sky-600 transition-colors mb-4"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Clinician Sign In</span>
        </Link>

        <div className="mx-auto w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center shadow-xs mb-3">
          <span className="material-symbols-outlined text-[32px]">medical_services</span>
        </div>

        <h1 className="text-2xl font-black text-on-surface tracking-tight">Clinician Onboarding</h1>
        <p className="text-xs text-outline mt-1 max-w-sm mx-auto">
          Register new attending physician, consultant, or resident into the clinical EMR directory.
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
                Full Legal Name & Title
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="Dr. Jonathan Miller, MD, FACC"
                className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-sky-500 text-sm font-medium"
              />
              {errors.name && <p className="text-[11px] text-error mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Hospital Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="dr.name@goingmerry.hms"
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-sky-500 text-sm font-medium"
                />
                {errors.email && (
                  <p className="text-[11px] text-error mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  {...register("medicalLicenseNumber")}
                  placeholder="MD-88123"
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-sky-500 text-sm font-medium font-mono"
                />
                {errors.medicalLicenseNumber && (
                  <p className="text-[11px] text-error mt-1">
                    {errors.medicalLicenseNumber.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  {...register("department")}
                  className="w-full h-10 px-2.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-sky-500 text-xs"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Specialty
                </label>
                <input
                  type="text"
                  {...register("specialization")}
                  placeholder="Cardiologist"
                  className="w-full h-10 px-2.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-sky-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                  Room / Clinic #
                </label>
                <input
                  type="text"
                  {...register("roomNumber")}
                  placeholder="Suite 302"
                  className="w-full h-10 px-2.5 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-sky-500 text-xs"
                />
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
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-sky-500 text-sm font-medium"
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
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 focus:border-sky-500 text-sm font-medium"
                />
                {errors.confirmPassword && (
                  <p className="text-[11px] text-error mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 font-bold rounded-xl mt-4 bg-sky-600 hover:bg-sky-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enrolling Clinician..." : "Enroll Clinician Profile"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-outline-variant/20 text-center">
            <p className="text-xs text-outline">
              Already enrolled as a physician?{" "}
              <Link href="/doctor/login" className="font-bold text-sky-600 hover:underline">
                Sign In to Doctor Desk
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
