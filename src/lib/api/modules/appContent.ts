import { api } from "@/lib/api/client";
import { unwrapEnvelope, ApiEnvelope } from "@/lib/api/contracts";

export type PrivacyPolicySection = {
  title: string;
  body: string;
};

export type HelpSupportChannel = {
  type: "email" | "phone" | "whatsapp";
  title: string;
  subtitle: string;
  value: string;
  enabled: boolean;
};

export type AppContentData = {
  privacyPolicy: {
    sections: PrivacyPolicySection[];
  };
  helpSupport: {
    introTitle: string;
    introBody: string;
    channels: HelpSupportChannel[];
  };
};

function unwrapContent(data: unknown): AppContentData {
  const unwrapped = unwrapEnvelope<{ data?: AppContentData } | AppContentData>(
    data as ApiEnvelope<{ data?: AppContentData } | AppContentData>
  );
  const payload =
    unwrapped && typeof unwrapped === "object" && "data" in unwrapped
      ? (unwrapped as { data?: AppContentData }).data
      : (unwrapped as AppContentData);
  if (!payload?.privacyPolicy || !payload?.helpSupport) {
    throw new Error("Invalid app content response");
  }
  return payload;
}

export const appContentApi = {
  async get() {
    const { data } = await api.get("/admin/app-content");
    return unwrapContent(data);
  },

  async update(payload: AppContentData) {
    const { data } = await api.put("/admin/app-content", payload);
    return unwrapContent(data);
  },
};
