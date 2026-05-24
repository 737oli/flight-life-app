import type { ProviderReadiness, SystemReadinessResponse } from "@/services/backendApi";

export type ReadinessTone = "success" | "warning" | "neutral";

export type ProviderReadinessModel = {
  id: string;
  label: string;
  statusLabel: string;
  tone: ReadinessTone;
  detailLabel: string;
};

export type SystemReadinessModel = {
  titleLabel: string;
  generatedAtLabel: string | null;
  providers: ProviderReadinessModel[];
  needsAttention: boolean;
};

export const buildSystemReadinessModel = (
  response: SystemReadinessResponse | null
): SystemReadinessModel | null => {
  if (!response) {
    return null;
  }

  return {
    titleLabel: response.readiness === "ready" ? "Operational readiness ready" : "Operational readiness needs attention",
    generatedAtLabel: formatGeneratedAt(response.generated_at),
    providers: response.providers.map(buildProviderReadinessModel),
    needsAttention: response.readiness !== "ready",
  };
};

export const buildProviderReadinessModel = (
  provider: ProviderReadiness
): ProviderReadinessModel => {
  const statusLabel = providerStatusLabel(provider.status);
  const missingLabel = provider.missing.map(formatMissingInput).join(", ");
  const modelLabel = provider.model ? `Model: ${provider.model}` : null;
  const noteLabel = provider.notes[0] ?? null;
  const detailParts = [
    missingLabel ? `Missing: ${missingLabel}` : null,
    modelLabel,
    !missingLabel ? noteLabel : null,
  ].filter((part): part is string => Boolean(part));

  return {
    id: provider.id,
    label: provider.label,
    statusLabel,
    tone: provider.status === "ready" ? "success" : "warning",
    detailLabel: detailParts.join(" · ") || "No extra context",
  };
};

const providerStatusLabel = (status: string) => {
  switch (status) {
    case "ready":
      return "Ready";
    case "partial":
      return "Partial";
    case "not_configured":
      return "Not configured";
    default:
      return status.replace(/_/g, " ");
  }
};

const formatMissingInput = (input: string) => {
  switch (input) {
    case "home_coordinates":
      return "home coordinates";
    default:
      return input;
  }
};

const formatGeneratedAt = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};
