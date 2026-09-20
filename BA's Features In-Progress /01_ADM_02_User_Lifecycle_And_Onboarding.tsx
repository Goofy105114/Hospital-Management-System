/**
 * ADM-02 — User Lifecycle, Staff Onboarding and Administrative Approvals
 * 
 * Component & Service for Hospital Staff Provisioning, Lifecycle State Machine, and Admin Approvals.
 */

"use client";

import React, { useState } from "react";

export type UserRole =
  | "SYSTEM_ADMIN"
  | "HOSPITAL_ADMIN"
  | "DOCTOR"
  | "NURSE"
  | "PHARMACIST"
  | "LAB_TECHNICIAN"
  | "RECEPTIONIST"
  | "BILLING_CLERK"
  | "WARD_ADMIN"
  | "PATIENT";

export type UserLifecycleStatus = "INVITED" | "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED" | "DEACTIVATED";

export interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
  licenseNumber?: string;
  status: UserLifecycleStatus;
  createdAt: string;
  lastLoginAt?: string;
  requiresElevatedApproval?: boolean;
}

export interface StaffOnboardingInput {
  fullName: string;
  email: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
  licenseNumber?: string;
  tempPassword?: string;
}

const INITIAL_STAFF_USERS: StaffUser[] = [
  {
    id: "usr-01",
    fullName: "Dr. Marcus Vance",
    email: "marcus.vance@goingmerry.hms",
    role: "DOCTOR",
    departmentId: "dep-cardio",
    departmentName: "Cardiology & CCU",
    licenseNumber: "MED-LIC-99401",
    status: "ACTIVE",
    createdAt: "2026-08-01",
    lastLoginAt: "2026-10-24 08:30 AM",
  },
  {
    id: "usr-02",
    fullName: "Elena Rostova",
    email: "elena.r@goingmerry.hms",
    role: "NURSE",
    departmentId: "dep-icu",
    departmentName: "Intensive Care Unit",
    licenseNumber: "NUR-LIC-44812",
    status: "ACTIVE",
    createdAt: "2026-08-15",
    lastLoginAt: "2026-10-24 07:00 AM",
  },
  {
    id: "usr-03",
    fullName: "Kavita Sharma",
    email: "kavita.s@goingmerry.hms",
    role: "PHARMACIST",
    departmentId: "dep-pharm",
    departmentName: "Central Pharmacy Dispensary",
    licenseNumber: "PHM-LIC-11093",
    status: "ACTIVE",
    createdAt: "2026-09-01",
    lastLoginAt: "2026-10-24 09:15 AM",
  },
  {
    id: "usr-04",
    fullName: "David Sterling",
    email: "david.s@goingmerry.hms",
    role: "HOSPITAL_ADMIN",
    departmentId: "dep-admin",
    departmentName: "Executive Administration",
    status: "PENDING_APPROVAL",
    requiresElevatedApproval: true,
    createdAt: "2026-10-23",
  },
];

export const StaffUserLifecycleManager: React.FC = () => {
  const [users, setUsers] = useState<StaffUser[]>(INITIAL_STAFF_USERS);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [formData, setFormData] = useState<StaffOnboardingInput>({
    fullName: "",
    email: "",
    role: "NURSE",
    departmentId: "dep-gen",
    departmentName: "General Medicine",
    licenseNumber: "",
  });

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: StaffUser = {
      id: `usr-${Date.now()}`,
      fullName: formData.fullName,
      email: formData.email,
      role: formData.role,
      departmentId: formData.departmentId,
      departmentName: formData.departmentName,
      licenseNumber: formData.licenseNumber || undefined,
      status: formData.role === "HOSPITAL_ADMIN" || formData.role === "SYSTEM_ADMIN" ? "PENDING_APPROVAL" : "ACTIVE",
      requiresElevatedApproval: formData.role === "HOSPITAL_ADMIN" || formData.role === "SYSTEM_ADMIN",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setUsers([newUser, ...users]);
    setShowModal(false);
    setFormData({
      fullName: "",
      email: "",
      role: "NURSE",
      departmentId: "dep-gen",
      departmentName: "General Medicine",
      licenseNumber: "",
    });
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus: UserLifecycleStatus = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const approveElevatedUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, status: "ACTIVE", requiresElevatedApproval: false };
        }
        return u;
      })
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600">manage_accounts</span>
            ADM-02: Staff User Lifecycle & Administrative Approvals
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Admin-initiated staff onboarding, clinical licensing verification, status transitions, and role approvals.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          Provision New Staff User (ADM-02)
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <input
          type="text"
          placeholder="Search staff by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
        />

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {["ALL", "DOCTOR", "NURSE", "PHARMACIST", "HOSPITAL_ADMIN"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                roleFilter === r
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3">Staff Name & Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Department</th>
              <th className="p-3">License No</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Administrative Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="p-3">
                  <span className="font-bold text-slate-900 dark:text-white block">{user.fullName}</span>
                  <span className="text-slate-400 font-mono">{user.email}</span>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded">
                    {user.role}
                  </span>
                </td>
                <td className="p-3 text-slate-600 dark:text-slate-300">{user.departmentName}</td>
                <td className="p-3 font-mono text-slate-500">{user.licenseNumber || "N/A"}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                      user.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : user.status === "PENDING_APPROVAL"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  {user.status === "PENDING_APPROVAL" ? (
                    <button
                      onClick={() => approveElevatedUser(user.id)}
                      className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs"
                    >
                      Authorize Account
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                        user.status === "ACTIVE"
                          ? "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                      }`}
                    >
                      {user.status === "ACTIVE" ? "Suspend" : "Re-activate"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Provision Staff */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Provision New Staff User (ADM-02)
            </h3>
            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Dr. Sarah Jenkins"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Hospital Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. sarah.j@goingmerry.hms"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Assigned Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  >
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="NURSE">NURSE</option>
                    <option value="PHARMACIST">PHARMACIST</option>
                    <option value="LAB_TECHNICIAN">LAB_TECHNICIAN</option>
                    <option value="RECEPTIONIST">RECEPTIONIST</option>
                    <option value="BILLING_CLERK">BILLING_CLERK</option>
                    <option value="HOSPITAL_ADMIN">HOSPITAL_ADMIN (Requires Approval)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">License No (Optional)</label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    placeholder="e.g. MED-88401"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Confirm Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
