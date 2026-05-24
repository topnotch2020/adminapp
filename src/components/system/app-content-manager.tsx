"use client";

import { useToast } from "@/components/providers/toast-provider";
import {
  appContentApi,
  type AppContentData,
  type HelpSupportChannel,
  type PrivacyPolicySection,
} from "@/lib/api/modules/appContent";
import { getApiErrorMessage } from "@/lib/admin-auth";
import {
  FileText,
  GripVertical,
  Headphones,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Save,
  Shield,
  Trash2,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState, type ReactNode } from "react";

const EMPTY_SECTION: PrivacyPolicySection = { title: "", body: "" };

const CHANNEL_META: Record<
  HelpSupportChannel["type"],
  { label: string; icon: typeof Mail; hint: string }
> = {
  email: {
    label: "Email",
    icon: Mail,
    hint: "e.g. support@brokerloop.app",
  },
  phone: {
    label: "Phone call",
    icon: Phone,
    hint: "e.g. +919876543210",
  },
  whatsapp: {
    label: "WhatsApp",
    icon: MessageCircle,
    hint: "Digits only, e.g. 919876543210",
  },
};

type TabId = "privacy" | "help";

function FieldLabel({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5">
      <label className="text-xs font-semibold tracking-wide text-[var(--foreground)]">
        {children}
      </label>
      {hint ? <p className="mt-0.5 text-[11px] muted">{hint}</p> : null}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className="absolute inset-0 rounded-full bg-[var(--surface-3)] transition peer-checked:bg-[var(--primary)]"
          aria-hidden
        />
        <span
          className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5"
          aria-hidden
        />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}

export function AppContentManager() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<TabId>("privacy");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<AppContentData | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await appContentApi.get();
      setContent(data);
    } catch (error) {
      showToast({
        type: "error",
        title: "Unable to load app content",
        description: getApiErrorMessage(error, "Check API connectivity."),
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!content) return;

    setSaving(true);
    try {
      const saved = await appContentApi.update(content);
      setContent(saved);
      showToast({
        type: "success",
        title: "Saved",
        description: "Mobile app content updated successfully.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Save failed",
        description: getApiErrorMessage(error, "Please review the form and try again."),
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (index: number, patch: Partial<PrivacyPolicySection>) => {
    if (!content) return;
    const sections = [...content.privacyPolicy.sections];
    sections[index] = { ...sections[index], ...patch };
    setContent({ ...content, privacyPolicy: { sections } });
  };

  const addSection = () => {
    if (!content) return;
    setContent({
      ...content,
      privacyPolicy: {
        sections: [...content.privacyPolicy.sections, { ...EMPTY_SECTION }],
      },
    });
  };

  const removeSection = (index: number) => {
    if (!content) return;
    setContent({
      ...content,
      privacyPolicy: {
        sections: content.privacyPolicy.sections.filter((_, i) => i !== index),
      },
    });
  };

  const updateChannel = (index: number, patch: Partial<HelpSupportChannel>) => {
    if (!content) return;
    const channels = [...content.helpSupport.channels];
    channels[index] = { ...channels[index], ...patch };
    setContent({ ...content, helpSupport: { ...content.helpSupport, channels } });
  };

  if (loading) {
    return (
      <div className="panel flex min-h-[280px] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
          <p className="text-sm muted">Loading mobile app content…</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-sm muted">Content unavailable. Check API connection.</p>
        <button type="button" className="btn-secondary mt-4" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: typeof Shield; count: number }[] = [
    {
      id: "privacy",
      label: "Privacy Policy",
      icon: Shield,
      count: content.privacyPolicy.sections.length,
    },
    {
      id: "help",
      label: "Help & Support",
      icon: Headphones,
      count: content.helpSupport.channels.filter((c) => c.enabled).length,
    },
  ];

  return (
    <form onSubmit={save} className="panel overflow-hidden">
      {/* Header */}
      <div
        className="border-b px-6 py-5"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--accent))",
                color: "var(--primary-foreground)",
              }}
            >
              <FileText size={20} />
            </span>
            <div>
              <h3 className="panel-title">Mobile App Content</h3>
              <p className="mt-1 max-w-xl text-sm muted">
                Edit text shown in Profile → Privacy Policy and Help &amp; Support on the broker
                app.
              </p>
            </div>
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>

        {/* Tabs */}
        <div
          className="mt-5 inline-flex rounded-xl p-1"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          role="tablist"
        >
          {tabs.map(({ id, label, icon: Icon, count }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "text-[var(--primary-foreground)] shadow-sm"
                    : "muted hover:text-[var(--foreground)]"
                }`}
                style={
                  active
                    ? {
                        background: "linear-gradient(135deg, var(--primary), var(--accent))",
                      }
                    : undefined
                }
              >
                <Icon size={16} />
                {label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    active ? "bg-white/25" : "bg-[var(--surface-2)]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {tab === "privacy" ? (
          <div className="animate-fade-in space-y-4">
            <p className="text-sm muted">
              Each section appears as a card on the privacy screen. Keep titles short and bodies
              clear for brokers.
            </p>

            <div className="space-y-3">
              {content.privacyPolicy.sections.map((section, index) => (
                <article
                  key={`privacy-${index}`}
                  className="group rounded-2xl border transition hover:border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface)",
                  }}
                >
                  <div
                    className="flex items-center justify-between gap-3 border-b px-4 py-3"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical
                        size={16}
                        className="muted opacity-40"
                        aria-hidden
                      />
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
                        style={{
                          background: "color-mix(in srgb, var(--primary) 14%, transparent)",
                          color: "var(--primary)",
                        }}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold">
                        {section.title.trim() || `Section ${index + 1}`}
                      </span>
                    </div>
                    {content.privacyPolicy.sections.length > 1 ? (
                      <button
                        type="button"
                        className="btn-ghost flex items-center gap-1.5 text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]"
                        onClick={() => removeSection(index)}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-4 p-4 md:grid-cols-1">
                    <div>
                      <FieldLabel>Section title</FieldLabel>
                      <input
                        className="input w-full"
                        placeholder="Information We Use"
                        value={section.title}
                        onChange={(e) => updateSection(index, { title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <FieldLabel hint="Shown as paragraph text below the title">
                        Section body
                      </FieldLabel>
                      <textarea
                        className="input min-h-[120px] w-full resize-y leading-relaxed"
                        placeholder="Describe what data is collected and why…"
                        value={section.body}
                        onChange={(e) => updateSection(index, { body: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              className="btn-secondary flex w-full items-center justify-center gap-2 border-dashed md:w-auto"
              onClick={addSection}
            >
              <Plus size={16} />
              Add section
            </button>
          </div>
        ) : (
          <div className="animate-fade-in space-y-6">
            {/* Intro */}
            <section>
              <h4 className="mb-3 text-sm font-semibold">Introduction</h4>
              <div
                className="rounded-2xl border p-5"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <FieldLabel>Headline</FieldLabel>
                    <input
                      className="input w-full"
                      placeholder="Need a hand?"
                      value={content.helpSupport.introTitle}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          helpSupport: {
                            ...content.helpSupport,
                            introTitle: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel>Description</FieldLabel>
                    <textarea
                      className="input min-h-[88px] w-full resize-y leading-relaxed"
                      placeholder="Short message before contact options…"
                      value={content.helpSupport.introBody}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          helpSupport: {
                            ...content.helpSupport,
                            introBody: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Channels */}
            <section>
              <h4 className="mb-3 text-sm font-semibold">Contact channels</h4>
              <div className="grid gap-4 lg:grid-cols-1">
                {content.helpSupport.channels.map((channel, index) => {
                  const meta = CHANNEL_META[channel.type];
                  const Icon = meta.icon;
                  return (
                    <article
                      key={`channel-${index}`}
                      className="rounded-2xl border"
                      style={{
                        borderColor: channel.enabled
                          ? "color-mix(in srgb, var(--primary) 30%, var(--border))"
                          : "var(--border)",
                        background: "var(--surface)",
                        opacity: channel.enabled ? 1 : 0.72,
                      }}
                    >
                      <div
                        className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{
                              background:
                                "color-mix(in srgb, var(--primary) 12%, transparent)",
                              color: "var(--primary)",
                            }}
                          >
                            <Icon size={18} />
                          </span>
                          <div>
                            <p className="text-sm font-semibold">{meta.label}</p>
                            <p className="text-xs muted">Tap action in mobile app</p>
                          </div>
                        </div>
                        <Toggle
                          checked={channel.enabled}
                          onChange={(enabled) => updateChannel(index, { enabled })}
                          label={channel.enabled ? "Visible" : "Hidden"}
                        />
                      </div>

                      <div className="grid gap-4 p-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <FieldLabel>Channel type</FieldLabel>
                          <select
                            className="input w-full"
                            value={channel.type}
                            onChange={(e) =>
                              updateChannel(index, {
                                type: e.target.value as HelpSupportChannel["type"],
                              })
                            }
                          >
                            {(Object.keys(CHANNEL_META) as HelpSupportChannel["type"][]).map(
                              (type) => (
                                <option key={type} value={type}>
                                  {CHANNEL_META[type].label}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                        <div>
                          <FieldLabel>Button title</FieldLabel>
                          <input
                            className="input w-full"
                            placeholder="Email Support"
                            value={channel.title}
                            onChange={(e) => updateChannel(index, { title: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <FieldLabel>Subtitle</FieldLabel>
                          <input
                            className="input w-full"
                            placeholder="Shown under the title"
                            value={channel.subtitle}
                            onChange={(e) => updateChannel(index, { subtitle: e.target.value })}
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <FieldLabel hint={meta.hint}>Contact value</FieldLabel>
                          <input
                            className="input w-full font-mono text-[13px]"
                            placeholder={meta.hint}
                            value={channel.value}
                            onChange={(e) => updateChannel(index, { value: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      >
        <p className="text-xs muted">
          Changes apply after brokers reopen Privacy Policy or Help &amp; Support in the app.
        </p>
        <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
