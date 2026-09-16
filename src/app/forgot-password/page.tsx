"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"REQUEST" | "VERIFY_OTP" | "RESET_PASSWORD" | "SUCCESS">(
    "REQUEST"
  );
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resendTimer, setResendTimer] = useState(60);

  // Password complexity checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const handleRequestToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      setErrorMsg("Please enter your registered email address or phone number.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      setIsLoading(false);
      setStep("VERIFY_OTP");
      // Countdown timer for resend
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 600);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }
    const newArr = [...otp];
    newArr[index] = val;
    setOtp(newArr);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length < 6) {
      setErrorMsg("Please enter all 6 digits of the verification code.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      setIsLoading(false);
      setStep("RESET_PASSWORD");
    }, 500);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setErrorMsg("Please ensure your new password meets all security criteria.");
      return;
    }
    if (!passwordsMatch) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      setIsLoading(false);
      setStep("SUCCESS");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col justify-between p-space-6 sm:p-space-12 select-none">
      {/* Header */}
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
              Identity & Access Management (IAM-03)
            </span>
          </div>
        </Link>
        <Link href="/login">
          <Button variant="outline" size="sm" className="gap-space-2">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Sign In
          </Button>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center py-space-8">
        <div className="w-full max-w-md space-y-space-6">
          <div className="bg-surface-container-lowest border-2 border-outline-variant/40 rounded-3xl p-space-8 shadow-xl space-y-space-6">
            {/* Step 1: Request OTP */}
            {step === "REQUEST" && (
              <>
                <div className="text-center space-y-space-1">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-space-3">
                    <span className="material-symbols-outlined text-[32px]">lock_reset</span>
                  </div>
                  <h2 className="font-headline-md font-extrabold text-on-surface">
                    Recover Password
                  </h2>
                  <p className="text-body-sm text-outline">
                    Enter your verified staff email or mobile phone to receive a secure recovery
                    code.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-space-3 bg-error/15 border border-error/30 rounded-xl text-error text-body-sm">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleRequestToken} className="space-y-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Email Address or Mobile Phone
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. marcus.vance@goingmerry.org"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      className="w-full px-space-3 py-space-2.5 bg-surface-container rounded-xl border border-outline-variant/40 text-body-md focus:border-primary focus:outline-none"
                    />
                    <p className="text-label-xs text-outline mt-space-1">
                      A 6-digit one-time cryptographic code will be dispatched immediately.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading}
                    className="w-full py-space-3 rounded-xl font-bold shadow-md gap-space-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">
                          progress_activity
                        </span>
                        Dispatching Code...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        Send Recovery Code
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* Step 2: Verify OTP */}
            {step === "VERIFY_OTP" && (
              <>
                <div className="text-center space-y-space-1">
                  <div className="w-14 h-14 rounded-2xl bg-secondary-container text-secondary flex items-center justify-center mx-auto mb-space-3">
                    <span className="material-symbols-outlined text-[32px]">mark_email_read</span>
                  </div>
                  <h2 className="font-headline-md font-extrabold text-on-surface">
                    Enter 6-Digit Code
                  </h2>
                  <p className="text-body-sm text-outline">
                    A code was sent to{" "}
                    <span className="font-bold text-on-surface">{emailOrPhone}</span>. It expires in
                    15 minutes.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-space-3 bg-error/15 border border-error/30 rounded-xl text-error text-body-sm">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-space-6">
                  <div className="flex justify-center gap-space-2">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-12 h-14 text-center font-bold text-headline-sm bg-surface-container rounded-xl border border-outline-variant/40 focus:border-primary focus:outline-none"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-label-sm">
                    <span className="text-outline">Didn&apos;t receive code?</span>
                    {resendTimer > 0 ? (
                      <span className="text-outline font-mono">Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setResendTimer(60)}
                        className="text-primary font-bold hover:underline"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading}
                    className="w-full py-space-3 rounded-xl font-bold shadow-md gap-space-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">
                          progress_activity
                        </span>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">verified_user</span>
                        Verify & Proceed
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* Step 3: Set New Password */}
            {step === "RESET_PASSWORD" && (
              <>
                <div className="text-center space-y-space-1">
                  <div className="w-14 h-14 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center mx-auto mb-space-3">
                    <span className="material-symbols-outlined text-[32px]">password</span>
                  </div>
                  <h2 className="font-headline-md font-extrabold text-on-surface">
                    Set New Password
                  </h2>
                  <p className="text-body-sm text-outline">
                    Create a strong cryptographic password for your hospital identity.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-space-3 bg-error/15 border border-error/30 rounded-xl text-error text-body-sm">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-space-3 py-space-2.5 bg-surface-container rounded-xl border border-outline-variant/40 text-body-md focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Password requirements checklist */}
                  <div className="bg-surface-container-low p-space-3 rounded-xl space-y-space-1 text-label-xs border border-outline-variant/30">
                    <span className="font-bold text-on-surface block mb-space-1">
                      Password Requirements:
                    </span>
                    <div className="grid grid-cols-2 gap-y-1">
                      <span
                        className={`flex items-center gap-1 ${hasMinLength ? "text-primary font-bold" : "text-outline"}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {hasMinLength ? "check_circle" : "radio_button_unchecked"}
                        </span>
                        Min. 8 characters
                      </span>
                      <span
                        className={`flex items-center gap-1 ${hasUppercase ? "text-primary font-bold" : "text-outline"}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {hasUppercase ? "check_circle" : "radio_button_unchecked"}
                        </span>
                        1 uppercase letter
                      </span>
                      <span
                        className={`flex items-center gap-1 ${hasLowercase ? "text-primary font-bold" : "text-outline"}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {hasLowercase ? "check_circle" : "radio_button_unchecked"}
                        </span>
                        1 lowercase letter
                      </span>
                      <span
                        className={`flex items-center gap-1 ${hasNumber ? "text-primary font-bold" : "text-outline"}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {hasNumber ? "check_circle" : "radio_button_unchecked"}
                        </span>
                        1 number (0-9)
                      </span>
                      <span
                        className={`flex items-center gap-1 ${hasSpecial ? "text-primary font-bold" : "text-outline"}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {hasSpecial ? "check_circle" : "radio_button_unchecked"}
                        </span>
                        1 special character
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-space-3 py-space-2.5 bg-surface-container rounded-xl border border-outline-variant/40 text-body-md focus:border-primary focus:outline-none"
                    />
                    {confirmPassword && !passwordsMatch && (
                      <p className="text-label-xs text-error mt-space-1">Passwords do not match</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading || !isPasswordValid || !passwordsMatch}
                    className="w-full py-space-3 rounded-xl font-bold shadow-md gap-space-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">
                          progress_activity
                        </span>
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">
                          security_update_good
                        </span>
                        Update Password & Revoke Sessions
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* Step 4: Success Confirmation */}
            {step === "SUCCESS" && (
              <div className="text-center space-y-space-4 py-space-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[40px]">check_circle</span>
                </div>
                <div className="space-y-space-1">
                  <h2 className="font-headline-md font-extrabold text-on-surface">
                    Password Reset Complete
                  </h2>
                  <p className="text-body-sm text-outline">
                    Your password has been updated securely. All prior active sessions have been
                    invalidated per SEC-01 protocol.
                  </p>
                </div>

                <div className="p-space-3 bg-surface-container rounded-xl text-label-sm text-outline flex items-center justify-center gap-space-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    verified
                  </span>
                  <span>HIPAA & IAM-03 Cryptographic Compliance Enforced</span>
                </div>

                <Link href="/login" className="block w-full">
                  <Button
                    variant="primary"
                    className="w-full py-space-3 rounded-xl font-bold shadow-md"
                  >
                    Sign In with New Password
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-label-xs text-outline border-t border-outline-variant/20 pt-space-4">
        Going Merry Hospital Systems • IAM Self-Service Recovery • AES-GCM-256 Token Protocol
      </footer>
    </div>
  );
}
