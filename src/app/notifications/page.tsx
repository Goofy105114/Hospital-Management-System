"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface NotificationItem {
  id: string;
  category: "APPOINTMENT" | "QUEUE" | "PHARMACY" | "LAB" | "BILLING";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: "HIGH" | "NORMAL" | "URGENT";
  actionUrl: string;
  actionLabel: string;
}

import api from "@/lib/axios";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "ALL" | "QUEUE" | "APPOINTMENT" | "LAB" | "PHARMACY" | "SETTINGS"
  >("ALL");
  const [preferences, setPreferences] = useState({
    smsAlerts: true,
    emailNotifications: true,
    inAppAlerts: true,
    whatsAppConsent: false,
    doctorDelayAlerts: true,
    prescriptionRefillAlerts: true,
    labResultsAlerts: true,
    billingReminders: true,
  });
  const [prefSaved, setPrefSaved] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api
      .get("/users/me/notifications")
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.data;
        if (Array.isArray(list)) {
          setNotifications(list);
        } else {
          setNotifications([]);
        }
      })
      .catch(() => {
        if (isMounted) setNotifications([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    api
      .get("/users/me/notification-preferences")
      .then((res) => {
        if (!isMounted) return;
        const prefs = res.data?.data;
        if (prefs) {
          setPreferences((prev) => ({ ...prev, ...prefs }));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put("/users/me/notification-preferences", preferences);
    } catch {
      // Handled
    }
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 3000);
  };

  const filteredNotifications =
    activeTab === "ALL" ? notifications : notifications.filter((n) => n.category === activeTab);

  const getCategoryIcon = (cat: NotificationItem["category"]) => {
    switch (cat) {
      case "QUEUE":
        return "timelapse";
      case "APPOINTMENT":
        return "calendar_month";
      case "LAB":
        return "science";
      case "PHARMACY":
        return "medication";
      case "BILLING":
        return "receipt_long";
      default:
        return "notifications";
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-space-6 pb-space-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 border-b border-outline-variant/30 pb-space-4">
          <div>
            <div className="flex items-center gap-space-3">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                Patient Notification Center
              </h1>
              {unreadCount > 0 && (
                <Badge variant="primary" className="text-xs">
                  {unreadCount} Unread
                </Badge>
              )}
            </div>
            <p className="font-body-md text-on-surface-variant mt-1">
              Real-time Queue Alerts, Appointment Reminders & Clinical Updates (NOT-01..03)
            </p>
          </div>

          <div className="flex items-center gap-space-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-1.5">
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                Mark All as Read
              </Button>
            )}
            <Button
              variant={activeTab === "SETTINGS" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveTab(activeTab === "SETTINGS" ? "ALL" : "SETTINGS")}
              className="gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              Preferences
            </Button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        {activeTab !== "SETTINGS" && (
          <div className="flex items-center gap-space-2 overflow-x-auto pb-1 border-b border-outline-variant/20">
            {[
              { id: "ALL", label: "All Alerts", count: notifications.length },
              {
                id: "QUEUE",
                label: "Queue & Delays",
                count: notifications.filter((n) => n.category === "QUEUE").length,
              },
              {
                id: "APPOINTMENT",
                label: "Appointments",
                count: notifications.filter((n) => n.category === "APPOINTMENT").length,
              },
              {
                id: "LAB",
                label: "Diagnostic Labs",
                count: notifications.filter((n) => n.category === "LAB").length,
              },
              {
                id: "PHARMACY",
                label: "Pharmacy",
                count: notifications.filter((n) => n.category === "PHARMACY").length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-space-3 py-1.5 rounded-lg text-label-md font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-label-xs px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id
                      ? "bg-on-primary/20 text-on-primary"
                      : "bg-outline-variant/40 text-on-surface"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Notifications List */}
        {activeTab !== "SETTINGS" ? (
          <div className="space-y-space-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-space-12 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 space-y-space-2">
                <span className="material-symbols-outlined text-outline text-[48px]">
                  notifications_paused
                </span>
                <p className="font-label-lg text-on-surface font-bold">
                  No Notifications in this Category
                </p>
                <p className="text-body-sm text-outline">
                  You are up to date on all clinical events.
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`p-space-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-space-4 ${
                    n.read
                      ? "bg-surface-container-lowest border-outline-variant/30"
                      : "bg-primary/5 border-primary/40 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-space-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        n.category === "QUEUE"
                          ? "bg-amber-100 text-amber-800"
                          : n.category === "LAB"
                            ? "bg-blue-100 text-blue-800"
                            : n.category === "PHARMACY"
                              ? "bg-teal-100 text-teal-800"
                              : "bg-primary/10 text-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {getCategoryIcon(n.category)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-space-2">
                        <span className="font-label-lg text-on-surface font-bold">{n.title}</span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                        <span className="text-label-xs text-outline">• {n.timestamp}</span>
                      </div>
                      <p className="font-body-md text-on-surface-variant max-w-2xl leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    <Link href={n.actionUrl}>
                      <Button variant="outline" size="sm" className="gap-1 font-bold">
                        <span>{n.actionLabel}</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Settings / Preferences View (NOT-01) */
          <Card className="border-outline-variant/30">
            <CardHeader className="border-b border-outline-variant/20">
              <CardTitle className="flex items-center gap-space-2 text-headline-sm">
                <span className="material-symbols-outlined text-primary text-[24px]">tune</span>
                Notification Channels & Communication Consent (NOT-01)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-space-6 space-y-space-6">
              {prefSaved && (
                <div className="p-space-3 bg-primary/15 border border-primary/30 rounded-xl text-primary font-semibold text-body-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  Your notification channel preferences have been saved securely.
                </div>
              )}

              <form onSubmit={handleSavePreferences} className="space-y-space-6">
                <div className="space-y-space-3">
                  <h3 className="font-label-lg text-on-surface font-bold uppercase tracking-wider text-[12px]">
                    Delivery Channels
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-3">
                    <label className="flex items-center justify-between p-space-4 rounded-xl border border-outline-variant/30 bg-surface-container-low cursor-pointer hover:bg-surface-container">
                      <div className="space-y-0.5">
                        <span className="font-label-md text-on-surface font-bold block">
                          SMS Text Messages
                        </span>
                        <span className="text-body-sm text-outline">
                          Real-time alerts to registered mobile phone
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.smsAlerts}
                        onChange={(e) =>
                          setPreferences({ ...preferences, smsAlerts: e.target.checked })
                        }
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-space-4 rounded-xl border border-outline-variant/30 bg-surface-container-low cursor-pointer hover:bg-surface-container">
                      <div className="space-y-0.5">
                        <span className="font-label-md text-on-surface font-bold block">
                          Email Notifications
                        </span>
                        <span className="text-body-sm text-outline">
                          Clinical summaries and itemized PDF statements
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={(e) =>
                          setPreferences({ ...preferences, emailNotifications: e.target.checked })
                        }
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-space-4 rounded-xl border border-outline-variant/30 bg-surface-container-low cursor-pointer hover:bg-surface-container">
                      <div className="space-y-0.5">
                        <span className="font-label-md text-on-surface font-bold block">
                          In-App Push Alerts
                        </span>
                        <span className="text-body-sm text-outline">
                          Queue turn countdown and arrival chime notices
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.inAppAlerts}
                        onChange={(e) =>
                          setPreferences({ ...preferences, inAppAlerts: e.target.checked })
                        }
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-space-4 rounded-xl border border-outline-variant/30 bg-surface-container-low cursor-pointer hover:bg-surface-container">
                      <div className="space-y-0.5">
                        <span className="font-label-md text-on-surface font-bold block">
                          WhatsApp Triage Consent
                        </span>
                        <span className="text-body-sm text-outline">
                          Opt-in for instant appointment slips & QR tokens
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.whatsAppConsent}
                        onChange={(e) =>
                          setPreferences({ ...preferences, whatsAppConsent: e.target.checked })
                        }
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-space-3">
                  <h3 className="font-label-lg text-on-surface font-bold uppercase tracking-wider text-[12px]">
                    Clinical Alert Categories
                  </h3>
                  <div className="space-y-2">
                    {[
                      {
                        key: "doctorDelayAlerts",
                        label: "Doctor Schedule Delay Warnings",
                        desc: "Notify me if the clinician is running >15 minutes behind schedule",
                      },
                      {
                        key: "prescriptionRefillAlerts",
                        label: "Prescription Refill & Adherence Reminders",
                        desc: "Notify me when maintenance medications are ready or running low",
                      },
                      {
                        key: "labResultsAlerts",
                        label: "Diagnostic Results & Critical Lab Alerts",
                        desc: "Immediate notification when pathologist releases test findings",
                      },
                      {
                        key: "billingReminders",
                        label: "Invoice & Insurance Co-Pay Reminders",
                        desc: "Alerts for pending deductible statements and payment receipts",
                      },
                    ].map((cat) => (
                      <label
                        key={cat.key}
                        className="flex items-center justify-between p-space-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest cursor-pointer hover:bg-surface-container-low"
                      >
                        <div>
                          <span className="font-label-md text-on-surface font-semibold block">
                            {cat.label}
                          </span>
                          <span className="text-body-sm text-outline">{cat.desc}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={(preferences as any)[cat.key]}
                          onChange={(e) =>
                            setPreferences({ ...preferences, [cat.key]: e.target.checked })
                          }
                          className="w-5 h-5 accent-primary cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-space-3 pt-space-4 border-t border-outline-variant/20">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("ALL")}>
                    Back to Inbox
                  </Button>
                  <Button type="submit" variant="primary" className="font-bold">
                    Save Communication Preferences
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
