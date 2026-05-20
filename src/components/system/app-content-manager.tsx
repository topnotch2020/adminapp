"use client";

import { useToast } from "@/components/providers/toast-provider";
import {
  appContentApi,
  type AppContentData,
  type HelpSupportChannel,
  type PrivacyPolicySection,
} from "@/lib/api/modules/appContent";
import { getApiErrorMessage } from "@/lib/admin-auth";
import { FormEvent, useCallback, useEffect, useState } from "react";

const EMPTY_SECTION: PrivacyPolicySection = { title: "", body: "" };

const CHANNEL_TYPES: HelpSupportChannel["type"][] = ["email", "phone", "whatsapp"];

export function AppContentManager() {
  const { showToast } = useToast();
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
        title: "Content saved",
        description: "Privacy Policy and Help & Support updated for the mobile app.",
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
      <div className="panel p-5">
        <p className="text-sm muted">Loading app content...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="panel p-5">
        <p className="text-sm muted">App content unavailable.</p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={save}>
      <div className="panel p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Privacy Policy
        </h3>
        <p className="mt-1 text-sm muted">
          Sections shown in the mobile app Profile → Privacy Policy screen.
        </p>

        <div className="mt-4 space-y-4">
          {content.privacyPolicy.sections.map((section, index) => (
            <div
              key={`privacy-${index}`}
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Section {index + 1}</p>
                {content.privacyPolicy.sections.length > 1 ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-rose-600"
                    onClick={() => removeSection(index)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <input
                className="input mb-2"
                placeholder="Section title"
                value={section.title}
                onChange={(e) => updateSection(index, { title: e.target.value })}
                required
              />
              <textarea
                className="input min-h-[100px]"
                placeholder="Section body"
                value={section.body}
                onChange={(e) => updateSection(index, { body: e.target.value })}
                required
              />
            </div>
          ))}
        </div>

        <button type="button" className="btn-secondary mt-3" onClick={addSection}>
          Add section
        </button>
      </div>

      <div className="panel p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Help &amp; Support
        </h3>
        <p className="mt-1 text-sm muted">
          Intro text and contact channels for Profile → Help &amp; Support.
        </p>

        <div className="mt-4 grid gap-3">
          <input
            className="input"
            placeholder="Intro title"
            value={content.helpSupport.introTitle}
            onChange={(e) =>
              setContent({
                ...content,
                helpSupport: { ...content.helpSupport, introTitle: e.target.value },
              })
            }
            required
          />
          <textarea
            className="input min-h-[80px]"
            placeholder="Intro description"
            value={content.helpSupport.introBody}
            onChange={(e) =>
              setContent({
                ...content,
                helpSupport: { ...content.helpSupport, introBody: e.target.value },
              })
            }
            required
          />
        </div>

        <div className="mt-4 space-y-4">
          {content.helpSupport.channels.map((channel, index) => (
            <div
              key={`channel-${channel.type}-${index}`}
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold capitalize">{channel.type} channel</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={channel.enabled}
                    onChange={(e) => updateChannel(index, { enabled: e.target.checked })}
                  />
                  Enabled
                </label>
              </div>
              <select
                className="input mb-2"
                value={channel.type}
                onChange={(e) =>
                  updateChannel(index, { type: e.target.value as HelpSupportChannel["type"] })
                }
              >
                {CHANNEL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input
                className="input mb-2"
                placeholder="Button title"
                value={channel.title}
                onChange={(e) => updateChannel(index, { title: e.target.value })}
                required
              />
              <input
                className="input mb-2"
                placeholder="Subtitle (shown under title)"
                value={channel.subtitle}
                onChange={(e) => updateChannel(index, { subtitle: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder={
                  channel.type === "email"
                    ? "Email address"
                    : "Phone / WhatsApp number (digits, e.g. 919876543210)"
                }
                value={channel.value}
                onChange={(e) => updateChannel(index, { value: e.target.value })}
                required
              />
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-5">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save Privacy & Help Content"}
        </button>
      </div>
    </form>
  );
}
