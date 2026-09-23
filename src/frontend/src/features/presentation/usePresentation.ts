import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "../../hooks/useActor";
import {
  type PresentationData,
  type PresentationInput,
  parsePresentationResponse,
} from "./types";

const STORAGE_KEY = "moneydrive_presentations";

function loadPresentations(): PresentationData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PresentationData[]) : [];
  } catch {
    return [];
  }
}

function savePresentation(presentation: PresentationData): void {
  const all = loadPresentations();
  const existing = all.findIndex((p) => p.id === presentation.id);
  if (existing >= 0) {
    all[existing] = presentation;
  } else {
    all.unshift(presentation);
  }
  // Keep latest 20 presentations
  const trimmed = all.slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

function generateShareToken(): string {
  return (
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10)
  );
}

function buildPresentationPrompt(input: PresentationInput): string {
  return `You are Nduna, an AI assistant for MoneyDrive that helps Uber/Bolt drivers land advertising deals.

Generate a professional 5-slide presentation pitch for a driver to present to a company.

Driver details:
- Name: ${input.driverName}
- City: ${input.city}
- Vehicle: ${input.vehicleModel || "sedan"}
- Primary routes: ${input.routes.join(", ") || input.city}
- Trips per month: ${input.tripsPerMonth}
- Average passengers per trip: ${input.avgPassengers}
- Estimated monthly exposure: ${input.estimatedMonthlyExposure.toLocaleString()} impressions

Target company:
- Company: ${input.targetCompanyName}
- Industry: ${input.targetIndustry}
- Proposed deal value: R${input.proposedDealValue.toLocaleString()}/month

Return ONLY a valid JSON array of exactly 5 slides. Each slide must match this exact structure:
{
  "slideType": "title" | "value-proposition" | "audience-data" | "pricing-options" | "call-to-action",
  "title": "slide title",
  "bullets": ["bullet 1", "bullet 2", "bullet 3"],
  "speakerNotes": "coaching tip for the driver",
  "dataPoint": "key stat or number to highlight"
}

Make the content specific, compelling, and data-driven. Speak to ${input.targetCompanyName}'s likely goals (brand awareness, customer reach, ROI).`;
}

export function useGeneratePresentation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PresentationInput): Promise<PresentationData> => {
      if (!actor) throw new Error("Not connected");

      const prompt = buildPresentationPrompt(input);
      const result = await actor.queryAIAgent(prompt, null);

      let rawContent = "";
      if ("ok" in result && result.__kind__ === "ok") {
        rawContent = result.ok;
      } else if ("err" in result) {
        throw new Error(
          typeof result.err === "string"
            ? result.err
            : "Failed to generate presentation",
        );
      }

      const slides = parsePresentationResponse(rawContent, input);
      const id = generateShareToken();
      const shareToken = generateShareToken();

      const presentation: PresentationData = {
        id,
        slides,
        generatedAt: Date.now(),
        shareToken,
        companyName: input.targetCompanyName,
        driverName: input.driverName,
      };

      savePresentation(presentation);
      return presentation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presentations"] });
    },
  });
}

export function useGetPresentation(shareToken: string) {
  return useQuery<PresentationData | null>({
    queryKey: ["presentation", shareToken],
    queryFn: () => {
      const all = loadPresentations();
      return all.find((p) => p.shareToken === shareToken) ?? null;
    },
    enabled: !!shareToken,
  });
}

export function useMyPresentations() {
  return useQuery<PresentationData[]>({
    queryKey: ["presentations"],
    queryFn: () => loadPresentations(),
  });
}
