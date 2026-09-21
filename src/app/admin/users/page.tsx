"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export type UserRole =
  | "DOCTOR"
  | "NURSE"
  | "PHARMACIST"
  | "LAB_TECH"
  | "RADIOLOGIST"
  | "INVENTORY_MANAGER"
  | "BILLING_STAFF"
  | "RECEPTIONIST"
  | "ADMIN"
  | "MANAGEMENT"
  | "SUPER_ADMIN";

export type UserLifecycleStatus = "ACTIVE" | "LOCKED" | "SUSPENDED" | "PENDING_VERIFICATION";

export interface StaffUser {
  id: string;
  fullName: string;
  name?: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  departmentName?: string;
  licenseNumber?: string;
  status: UserLifecycleStatus;
  requiresElevatedApproval?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

const INITIAL_STAFF_USERS: StaffUser[] = [
  {
    id: "usr-01",
    fullName: "Dr. Marcus Vance",
    email: "marcus.vance@goingmerry.org",
    phone: "+1 (555) 100-2001",
    role: "DOCTOR",
    department: "Cardiology",
    departmentName: "Cardiology & CCU",
    licenseNumber: "MED-LIC-99401",
    status: "ACTIVE",
    requiresElevatedApproval: false,
    lastLoginAt: "Today, 08:30 AM",
    createdAt: "2026-08-01",
  },
  {
    id: "usr-02",
    fullName: "Elena Rostova",
    email: "elena.rostova@goingmerry.org",
    phone: "+1 (555) 100-3001",
    role: "NURSE",
    department: "Intensive Care Unit",
    departmentName: "Intensive Care Unit",
    licenseNumber: "NUR-LIC-44812",
    status: "ACTIVE",
    requiresElevatedApproval: false,
    lastLoginAt: "Today, 07:00 AM",
    createdAt: "2026-08-15",
  },
  {
    id: "usr-03",
    fullName: "Kavita Sharma",
    email: "kavita.s@goingmerry.org",
    phone: "+1 (555) 100-3002",
    role: "PHARMACIST",
    department: "Central Pharmacy",
    departmentName: "Central Pharmacy Dispensary",
    licenseNumber: "PHM-LIC-11093",
    status: "ACTIVE",
    requiresElevatedApproval: false,
    lastLoginAt: "Today, 09:15 AM",
    createdAt: "2026-09-01",
  },
  {
    id: "usr-04",
    fullName: "David Sterling",
    email: "david.s@goingmerry.org",
    phone: "+1 (555) 100-7002",
    role: "ADMIN",
    department: "Hospital Administration",
    departmentName: "Executive Administration",
    licenseNumber: "ADM-88210",
    status: "PENDING_VERIFICATION",
    requiresElevatedApproval: true,
    lastLoginAt: "Never",
    createdAt: "2026-10-23",
  },
  {
    id: "usr-05",
    fullName: "Alex Morgan",
    email: "alex.morgan@goingmerry.org",
    phone: "+1 (555) 100-4001",
    role: "LAB_TECH",
    department: "Diagnostics Laboratory",
    departmentName: "Diagnostics Laboratory",
    licenseNumber: "LAB-LIC-55019",
    status: "ACTIVE",
    requiresElevatedApproval: false,
    lastLoginAt: "Yesterday, 04:20 PM",
    createdAt: "2026-08-20",
  },
  {
    id: "usr-06",
    fullName: "Rachel Zane",
    email: "rachel.zane@goingmerry.org",
    phone: "+1 (555) 100-6001",
    role: "BILLING_STAFF",
    department: "Cashier & Billing",
    departmentName: "Cashier & Billing",
    licenseNumber: "BIL-LIC-99014",
    status: "ACTIVE",
    requiresElevatedApproval: false,
    lastLoginAt: "Today, 09:10 AM",
    createdAt: "2026-09-10",
  },
];

export default function StaffUsersManagementPage() {
  const [users, setUsers] = useState<StaffUser[]>(INITIAL_STAFF_USERS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tempPasswordModal, setTempPasswordModal] = useState<{
    name: string;
    email: string;
    pass: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "DOCTOR",
    departmentName: "Cardiology",
    licenseNumber: "",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/users");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUsers(json.data);
      }
    } catch (e) {
      console.error("Failed to load staff list", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone || "+1 (555) 100-9999",
          role: formData.role,
          department: formData.departmentName,
          departmentName: formData.departmentName,
          licenseNumber: formData.licenseNumber || undefined,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const createdUser: StaffUser = json.data.user || json.data;
        const tempPassword = json.data.tempPassword || "Temp#Pass2026!";

        setUsers((prev) => [createdUser, ...prev]);
        setShowModal(false);
        setTempPasswordModal({
          name: formData.fullName,
          email: formData.email,
          pass: tempPassword,
        });
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          role: "DOCTOR",
          departmentName: "Cardiology",
          licenseNumber: "",
        });
      }
    } catch (err) {
      console.error("Error creating staff account", err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: nextStatus as UserLifecycleStatus } : u))
    );

    try {
      await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          status: nextStatus,
          reason: nextStatus === "SUSPENDED" ? "Administrative suspension" : "Administrative re-activation",
        }),
      });
    } catch (err) {
      console.error("Failed to update status", err);
      fetchUsers();
    }
  };

  const approveElevatedUser = async (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: "ACTIVE", requiresElevatedApproval: false } : u
      )
    );

    try {
      await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          approveElevated: true,
          reason: "Administrative elevated authorization approved",
        }),
      });
    } catch (err) {
      console.error("Failed to approve elevated user", err);
      fetchUsers();
    }
  };

  const filteredUsers = users.filter((u) => {
    const name = u.fullName || u.name || "";
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <AppLayout>
      <div className="space-y-space-6 max-w-7xl mx-auto pb-space-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-space-2 text-label-md text-outline">
          <Link href="/admin" className="hover:text-primary transition-colors">
            Administration & Policies
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">Staff Lifecycle & RBAC</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Staff User Lifecycle & Administrative Approvals (ADM-02, IAM-04)
            </h1>
            <p className="font-body-md text-body-md text-outline mt-space-1">
              Admin-initiated onboarding, clinical licensing verification, status transitions, and role approvals.
            </p>
          </div>

          <div className="flex items-center gap-space-2">
            <Link href="/admin/departments">
              <Button variant="outline" className="gap-space-1">
                <span className="material-symbols-outlined text-[18px]">domain</span>
                Departments & Facilities (ADM-01)
              </Button>
            </Link>
            <Button variant="primary" onClick={() => setShowModal(true)} className="gap-space-2">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Provision Staff Account
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-space-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <span className="material-symbols-outlined absolute left-space-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search staff by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-space-10 pr-space-4 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-space-2 overflow-x-auto w-full sm:w-auto">
            {["ALL", "DOCTOR", "NURSE", "PHARMACIST", "LAB_TECH", "BILLING_STAFF", "ADMIN"].map(
              (r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-space-3 py-space-1.5 rounded-lg text-label-md font-semibold transition-colors ${
                    roleFilter === r
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container text-outline hover:text-on-surface"
                  }`}
                >
                  {r.replace(/_/g, " ")}
                </button>
              )
            )}
          </div>
        </div>

        {/* Staff Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Staff Directory & Approvals ({filteredUsers.length})</CardTitle>
                <CardDescription>
                  Managed RBAC personnel, licensing validation, and elevated role approvals (SEC-01).
                </CardDescription>
              </div>
              {loading && (
                <span className="text-label-xs text-outline animate-pulse flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  Syncing directory...
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-body-sm text-left border-collapse">
              <thead className="bg-surface-container text-label-sm font-semibold text-outline uppercase border-y border-outline-variant/30">
                <tr>
                  <th className="py-space-3 px-space-4">Staff Member</th>
                  <th className="py-space-3 px-space-4">Canonical Role</th>
                  <th className="py-space-3 px-space-4">Department</th>
                  <th className="py-space-3 px-space-4">License No</th>
                  <th className="py-space-3 px-space-4">Status</th>
                  <th className="py-space-3 px-space-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredUsers.map((user) => {
                  const name = user.fullName || user.name || "Staff Member";
                  const dept = user.departmentName || user.department || "General";
                  const isPendingApproval =
                    user.status === "PENDING_VERIFICATION" || user.requiresElevatedApproval;

                  return (
                    <tr key={user.id} className="hover:bg-surface-container-high/40">
                      <td className="py-space-3 px-space-4">
                        <span className="font-bold text-on-surface block">{name}</span>
                        <span className="text-outline text-label-xs font-mono">{user.email}</span>
                      </td>
                      <td className="py-space-3 px-space-4">
                        <Badge variant="secondary" className="font-mono text-label-xs">
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-space-3 px-space-4 text-on-surface font-medium">{dept}</td>
                      <td className="py-space-3 px-space-4 font-mono text-label-xs text-outline">
                        {user.licenseNumber || "N/A"}
                      </td>
                      <td className="py-space-3 px-space-4">
                        <Badge
                          variant="outline"
                          className={
                            user.status === "ACTIVE"
                              ? "bg-success/15 text-success border-success/30 font-semibold"
                              : isPendingApproval
                              ? "bg-amber-500/15 text-amber-600 border-amber-500/30 font-semibold"
                              : "bg-error/15 text-error border-error/30 font-semibold"
                          }
                        >
                          {isPendingApproval ? "PENDING_APPROVAL" : user.status}
                        </Badge>
                      </td>
                      <td className="py-space-3 px-space-4 text-right space-x-2">
                        {isPendingApproval ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => approveElevatedUser(user.id)}
                            className="bg-success text-white hover:bg-success/90 text-xs gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">verified</span>
                            Authorize Account
                          </Button>
                        ) : (
                          <Button
                            variant={user.status === "ACTIVE" ? "outline" : "primary"}
                            size="sm"
                            onClick={() => toggleUserStatus(user.id, user.status)}
                            className={
                              user.status === "ACTIVE"
                                ? "border-error/40 text-error hover:bg-error/10 text-xs"
                                : "text-xs"
                            }
                          >
                            {user.status === "ACTIVE" ? "Suspend" : "Re-activate"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Modal: Temporary Password Confirmation */}
        {tempPasswordModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border border-success/30 rounded-2xl p-space-6 max-w-md w-full shadow-2xl space-y-space-4">
              <div className="flex items-center gap-2 text-success font-bold text-headline-sm">
                <span className="material-symbols-outlined text-[28px]">check_circle</span>
                Staff Account Created
              </div>
              <p className="text-body-sm text-on-surface">
                Account for <strong>{tempPasswordModal.name}</strong> ({tempPasswordModal.email}) is provisioned.
              </p>
              <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30 space-y-1">
                <span className="text-label-xs text-outline uppercase font-semibold block">
                  Temporary Single-Use Password
                </span>
                <span className="font-mono text-title-md font-bold text-primary select-all">
                  {tempPasswordModal.pass}
                </span>
              </div>
              <p className="text-label-xs text-outline">
                The staff member must change this temporary password upon first login.
              </p>
              <div className="flex justify-end pt-2">
                <Button variant="primary" onClick={() => setTempPasswordModal(null)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Provision Staff (ADM-02) */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-space-6 max-w-lg w-full shadow-2xl space-y-space-4">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Provision New Staff User (ADM-02)
              </h3>
              <form onSubmit={handleCreateStaff} className="space-y-space-4">
                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Staff Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jennifer Adams"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Corporate Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jennifer.adams@goingmerry.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Assigned Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    >
                      <option value="DOCTOR">DOCTOR</option>
                      <option value="NURSE">NURSE</option>
                      <option value="PHARMACIST">PHARMACIST</option>
                      <option value="LAB_TECH">LAB_TECH</option>
                      <option value="RADIOLOGIST">RADIOLOGIST</option>
                      <option value="INVENTORY_MANAGER">INVENTORY_MANAGER</option>
                      <option value="BILLING_STAFF">BILLING_STAFF</option>
                      <option value="RECEPTIONIST">RECEPTIONIST</option>
                      <option value="ADMIN">ADMIN (Requires Approval)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Department
                    </label>
                    <select
                      value={formData.departmentName}
                      onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    >
                      <option value="Cardiology">Cardiology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Central Pharmacy">Central Pharmacy</option>
                      <option value="Diagnostics Lab">Diagnostics Lab</option>
                      <option value="Emergency Triage">Emergency Triage</option>
                      <option value="Cashier & Billing">Cashier & Billing</option>
                      <option value="Hospital Administration">Hospital Administration</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Clinical License Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MED-LIC-88401"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30 text-label-sm text-outline">
                  A temporary single-use password conforming to IAM-03 policy will be generated for initial onboarding.
                </div>

                <div className="flex items-center justify-end gap-space-2 pt-space-2">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? "Provisioning..." : "Confirm Provisioning"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
