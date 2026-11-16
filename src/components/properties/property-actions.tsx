"use client";

import { propertiesApi, type AdminPropertyAction } from "@/lib/api/modules/properties";
import { useToast } from "@/components/providers/toast-provider";
import { IconButton } from "@/components/ui/icon-button";
import { useConfirm, type ConfirmOptions } from "@/components/ui/confirm-dialog";
import { propertyTitle } from "@/lib/labels";
import type { Property } from "@/types/domain";
import {
  CalendarPlus,
  CheckCircle2,
  Eye,
  HandCoins,
  RotateCcw,
  TimerOff,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState, type ReactNode } from "react";

type ActionKey = "VERIFY" | "REJECT" | AdminPropertyAction;

type ActionDef = {
  key: ActionKey;
  label: string;
  icon: ReactNode;
  tone: "default" | "primary" | "success" | "danger";
};

const extensionDays = (property: Property) => (property.listingType === "SALE" ? 60 : 30);

function actionsFor(property: Property): ActionDef[] {
  const list: ActionDef[] = [];
  if (property.status === "UNVERIFIED") {
    list.push(
      { key: "VERIFY", label: "Approve", icon: <CheckCircle2 size={15} />, tone: "success" },
      { key: "REJECT", label: "Reject", icon: <XCircle size={15} />, tone: "danger" }
    );
  }
  if (property.status === "VERIFIED") {
    list.push(
      { key: "EXTEND", label: `Extend ${extensionDays(property)} days`, icon: <CalendarPlus size={15} />, tone: "default" },
      { key: "MARK_SOLD", label: property.listingType === "RENT" ? "Mark rented out" : "Mark sold", icon: <HandCoins size={15} />, tone: "default" },
      { key: "EXPIRE", label: "Expire now", icon: <TimerOff size={15} />, tone: "default" }
    );
  }
  if (property.status === "EXPIRED") {
    list.push({ key: "EXTEND", label: "Reactivate", icon: <RotateCcw size={15} />, tone: "primary" });
  }
  list.push({ key: "SOFT_DELETE", label: "Delete", icon: <Trash2 size={15} />, tone: "danger" });
  return list;
}

function confirmFor(property: Property, key: ActionKey): ConfirmOptions | null {
  const name = propertyTitle(property);
  const project = property.address?.projectName ? ` at ${property.address.projectName}` : "";
  switch (key) {
    case "REJECT":
      return {
        title: "Reject this listing?",
        description: `${name}${project} won't go live.`,
        confirmLabel: "Reject listing",
        tone: "danger",
        reasonLabel: "Reason (optional)",
      };
    case "EXTEND":
      return {
        title: property.status === "EXPIRED" ? "Reactivate this listing?" : "Extend this listing?",
        description: `${name}${project} stays live for another ${extensionDays(property)} days.`,
        confirmLabel: property.status === "EXPIRED" ? "Reactivate" : "Extend",
      };
    case "MARK_SOLD":
      return {
        title: property.listingType === "RENT" ? "Mark as rented out?" : "Mark as sold?",
        description: `${name}${project} is taken off the app.`,
        confirmLabel: "Confirm",
      };
    case "EXPIRE":
      return {
        title: "Expire this listing now?",
        description: `${name}${project} is taken off the app until it is reactivated.`,
        confirmLabel: "Expire now",
        tone: "danger",
      };
    case "SOFT_DELETE":
      return {
        title: "Delete this listing?",
        description: `${name}${project} is removed from the app and the broker's listings.`,
        confirmLabel: "Delete",
        tone: "danger",
      };
    default:
      return null;
  }
}

const SUCCESS_TEXT: Partial<Record<ActionKey, string>> = {
  VERIFY: "Listing approved",
  REJECT: "Listing rejected",
  EXTEND: "Listing extended",
  MARK_SOLD: "Listing closed",
  EXPIRE: "Listing expired",
  SOFT_DELETE: "Listing deleted",
  RESTORE: "Listing restored",
};

/**
 * Admin actions for a listing, with a confirmation modal for each one that
 * changes what brokers or users see. Render {dialog} once in the page.
 */
export function usePropertyActions(onDone: () => void | Promise<void>) {
  const { showToast } = useToast();
  const { confirm, dialog } = useConfirm();
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = async (property: Property, key: ActionKey) => {
    const id = property.id || property._id;
    if (!id) return;
    const options = confirmFor(property, key);
    let reason: string | undefined;
    if (options) {
      const result = await confirm(options);
      if (!result.confirmed) return;
      reason = result.reason;
    }

    setBusyId(id);
    try {
      if (key === "VERIFY" || key === "REJECT") {
        await propertiesApi.verify(id, key, reason);
      } else {
        await propertiesApi.manage(id, key, key === "EXTEND" ? { extensionDays: extensionDays(property) } : undefined);
      }
      await onDone();
      showToast({ type: "success", title: SUCCESS_TEXT[key] ?? "Done" });
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast({ type: "error", title: "Action failed", description: message });
    } finally {
      setBusyId(null);
    }
  };

  /** Compact icon buttons with hover labels, for cards and table rows. */
  const iconActions = (property: Property, onView?: () => void) => {
    const busy = busyId === (property.id || property._id);
    return (
      <div className="flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
        {onView ? <IconButton label="View details" icon={<Eye size={15} />} onClick={onView} /> : null}
        {actionsFor(property).map((action) => (
          <IconButton
            key={action.key}
            label={action.label}
            icon={action.icon}
            tone={action.tone}
            disabled={busy}
            onClick={() => void run(property, action.key)}
          />
        ))}
      </div>
    );
  };

  /** Labelled buttons, for the detail panel where there is room. */
  const fullActions = (property: Property) => {
    const busy = busyId === (property.id || property._id);
    return (
      <div className="flex flex-wrap gap-2">
        {actionsFor(property).map((action) => (
          <button
            key={action.key}
            type="button"
            disabled={busy}
            onClick={() => void run(property, action.key)}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition hover:bg-[var(--surface-2)] disabled:opacity-50"
            style={{
              borderColor: "var(--border)",
              color:
                action.tone === "danger"
                  ? "var(--danger)"
                  : action.tone === "success"
                    ? "var(--success)"
                    : action.tone === "primary"
                      ? "var(--primary)"
                      : undefined,
            }}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    );
  };

  return { iconActions, fullActions, dialog };
}
