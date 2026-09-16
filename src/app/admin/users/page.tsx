"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: "ACTIVE" | "LOCKED" | "SUSPENDED";
  lastLoginAt: string;
}

const INITIAL_STAFF: StaffUser[] = [
  {
    id: "usr-01",
    name: "Dr. Marcus Vance",
    email: "marcus.vance@goingmerry.org",
    phone: "+1 (555) 100-2001",
    role: "DOCTOR",
    department: "Cardiology",
    status: "ACTIVE",
    lastLoginAt: "Today, 08:30 AM",
  },
  {
    id: "usr-02",
    name: "Dr. Sarah Jenkins",
    email: "sarah.jenkins@goingmerry.org",
    phone: "+1 (555) 100-2002",
    role: "DOCTOR",
    department: "Pediatrics",
    status: "ACTIVE",
    lastLoginAt: "Today, 08:45 AM",
  },
  {
    id: "usr-03",
    name: "Elena Rostova",
    email: "elena.rostova@goingmerry.org",
    phone: "+1 (555) 100-3001",
    role: "PHARMACIST",
    department: "Central Pharmacy",
    status: "ACTIVE",
    lastLoginAt: "Today, 07:50 AM",
  },
  {
    id: "usr-04",
    name: "Alex Morgan",
    email: "alex.morgan@goingmerry.org",
    phone: "+1 (555) 100-4001",
    role: "LAB_TECH",
    department: "Diagnostics Laboratory",
    status: "ACTIVE",
    lastLoginAt: "Yesterday, 04:20 PM",
  },
  {
    id: "usr-05",
    name: "David Ross",
    email: "david.ross@goingmerry.org",
    phone: "+1 (555) 100-5001",
    role: "NURSE",
    department: "Emergency Triage",
    status: "ACTIVE",
    lastLoginAt: "Today, 07:00 AM",
  },
  {
    id: "usr-06",
    name: "Rachel Zane",
    email: "rachel.zane@goingmerry.org",
    phone: "+1 (555) 100-6001",
    role: "BILLING_STAFF",
    department: "Cashier & Billing",
    status: "ACTIVE",
    lastLoginAt: "Today, 09:10 AM",
  },
  {
    id: "usr-07",
    name: "Arthur Pendelton (Former)",
    email: "arthur.pendelton@goingmerry.org",
    phone: "+1 (555) 100-7001",
    role: "ADMIN",
    department: "Hospital Administration",
    status: "LOCKED",
    lastLoginAt: "Oct 10, 2026",
  },
];

export default function StaffUsersManagementPage() {
  const [staffList, setStaffList] = useState<StaffUser[]>(INITIAL_STAFF);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Staff State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("DOCTOR");
  const [newDept, setNewDept] = useState("Cardiology");

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: StaffUser = {
      id: `usr-${Date.now()}`,
      name: newName,
      email: newEmail,
      phone: "+1 (555) 100-9999",
      role: newRole,
      department: newDept,
      status: "ACTIVE",
      lastLoginAt: "Pending first login",
    };
    setStaffList([...staffList, newUser]);
    setShowAddModal(false);
    setNewName("");
    setNewEmail("");
  };

  const handleToggleLock = (userId: string) => {
    setStaffList(
      staffList.map((u) =>
        u.id === userId ? { ...u, status: u.status === "ACTIVE" ? "LOCKED" : "ACTIVE" } : u
      )
    );
  };

  const filtered = staffList.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
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
              Staff User Lifecycle & RBAC Provisioning (ADM-02, IAM-04)
            </h1>
            <p className="font-body-md text-body-md text-outline mt-space-1">
              Onboard clinical and administrative personnel, enforce canonical RBAC roles, and
              manage session status locks.
            </p>
          </div>

          <div className="flex items-center gap-space-2">
            <Link href="/admin/departments">
              <Button variant="outline" className="gap-space-1">
                <span className="material-symbols-outlined text-[18px]">domain</span>
                Departments & Facilities (ADM-01)
              </Button>
            </Link>
            <Button variant="primary" onClick={() => setShowAddModal(true)} className="gap-space-2">
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <CardTitle>Staff User Directory ({filtered.length})</CardTitle>
            <CardDescription>
              All accounts are bound to least-privilege RBAC scopes (SEC-01).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-body-sm text-left border-collapse">
              <thead className="bg-surface-container text-label-sm font-semibold text-outline uppercase border-y border-outline-variant/30">
                <tr>
                  <th className="py-space-3 px-space-4">Staff Name</th>
                  <th className="py-space-3 px-space-4">Email & Phone</th>
                  <th className="py-space-3 px-space-4">Canonical Role</th>
                  <th className="py-space-3 px-space-4">Assigned Department</th>
                  <th className="py-space-3 px-space-4">Last Activity</th>
                  <th className="py-space-3 px-space-4">Status</th>
                  <th className="py-space-3 px-space-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-container-high/40">
                    <td className="py-space-3 px-space-4 font-bold text-on-surface">{user.name}</td>
                    <td className="py-space-3 px-space-4">
                      <span className="text-on-surface block font-mono text-label-sm">
                        {user.email}
                      </span>
                      <span className="text-outline text-label-xs font-mono">{user.phone}</span>
                    </td>
                    <td className="py-space-3 px-space-4">
                      <Badge variant="secondary" className="font-mono text-label-xs">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-space-3 px-space-4 text-on-surface font-medium">
                      {user.department}
                    </td>
                    <td className="py-space-3 px-space-4 text-outline font-mono text-label-xs">
                      {user.lastLoginAt}
                    </td>
                    <td className="py-space-3 px-space-4">
                      <Badge
                        variant="outline"
                        className={
                          user.status === "ACTIVE"
                            ? "bg-success/15 text-success border-success/30 font-semibold"
                            : "bg-error/15 text-error border-error/30 font-semibold"
                        }
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-space-3 px-space-4 text-right">
                      <Button
                        variant={user.status === "ACTIVE" ? "outline" : "primary"}
                        size="sm"
                        onClick={() => handleToggleLock(user.id)}
                        className={
                          user.status === "ACTIVE"
                            ? "border-error/40 text-error hover:bg-error/10 text-xs"
                            : "text-xs"
                        }
                      >
                        {user.status === "ACTIVE" ? "Lock Account" : "Unlock"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Modal: Provision Staff (ADM-02) */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-space-4">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-space-6 max-w-lg w-full shadow-2xl space-y-space-4">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Provision New Staff User (ADM-02)
              </h3>
              <form onSubmit={handleAddStaff} className="space-y-space-4">
                <div>
                  <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                    Staff Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jennifer Adams"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
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
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-space-4">
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Canonical RBAC Role
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    >
                      <option value="DOCTOR">Doctor</option>
                      <option value="NURSE">Nurse</option>
                      <option value="PHARMACIST">Pharmacist</option>
                      <option value="LAB_TECH">Lab Technician</option>
                      <option value="RADIOLOGIST">Radiologist</option>
                      <option value="INVENTORY_MANAGER">Inventory Manager</option>
                      <option value="BILLING_STAFF">Billing Staff</option>
                      <option value="RECEPTIONIST">Receptionist</option>
                      <option value="ADMIN">Administrator</option>
                      <option value="MANAGEMENT">Hospital Management</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-label-md font-semibold text-on-surface mb-space-1">
                      Department
                    </label>
                    <select
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="w-full px-space-3 py-space-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-body-md focus:outline-none focus:border-primary"
                    >
                      <option value="Cardiology">Cardiology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Central Pharmacy">Central Pharmacy</option>
                      <option value="Diagnostics Lab">Diagnostics Lab</option>
                      <option value="Emergency Triage">Emergency Triage</option>
                      <option value="Cashier & Billing">Cashier & Billing</option>
                      <option value="Administration">Administration</option>
                    </select>
                  </div>
                </div>

                <div className="p-space-3 bg-surface-container rounded-lg border border-outline-variant/30 text-label-sm text-outline">
                  A temporary single-use password will be securely dispatched to the user via
                  SMS/Email (NOT-02).
                </div>

                <div className="flex items-center justify-end gap-space-2 pt-space-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Create Account
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
