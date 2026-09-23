import type { UserProfile } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Expand,
  Loader2,
  Maximize2,
  Plus,
  Presentation,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { TierGate } from "../../routing/TierGate";
import type { PresentationData, PresentationInput, Slide } from "./types";
import { useGeneratePresentation, useMyPresentations } from "./usePresentation";

const INDUSTRIES = [
  "Logistics & Transport",
  "Delivery & Courier",
  "Fleet Management",
  "Food & Beverage",
  "Telecommunications",
  "Financial Services",
  "Retail",
  "Insurance",
  "Real Estate",
  "Healthcare",
  "Technology",
  "Other",
];

interface PresentationBuilderProps {
  profile: UserProfile | null | undefined;
  tier: number;
  isAdmin: boolean;
  onSettings?: () => void;
}

export function PresentationBuilder({
  profile,
  tier,
  isAdmin,
  onSettings,
}: PresentationBuilderProps) {
  return (
    <TierGate
      feature="Nduna Presentation Builder"
      requiredTier={3}
      tier={tier}
      isAdmin={isAdmin}
      onSettings={onSettings ?? (() => {})}
    >
      <PresentationBuilderInner profile={profile} />
    </TierGate>
  );
}

function PresentationBuilderInner({
  profile,
}: {
  profile: UserProfile | null | undefined;
}) {
  const [presentation, setPresentation] = useState<PresentationData | null>(
    null,
  );
  const [form, setForm] = useState<Partial<PresentationInput>>({
    driverName: profile?.displayName ?? "",
    city: "",
    routes: [],
    tripsPerMonth: 200,
    avgPassengers: 3,
    vehicleModel: profile?.vehicleName ?? "",
    targetCompanyName: "",
    targetIndustry: "Logistics & Transport",
    estimatedMonthlyExposure: 600000,
    proposedDealValue: 20000,
  });
  const [routeInput, setRouteInput] = useState("");

  const generateMutation = useGeneratePresentation();
  const { data: savedPresentations = [] } = useMyPresentations();

  // Sync profile into form when it loads
  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        driverName: prev.driverName || profile.displayName,
        vehicleModel: prev.vehicleModel || profile.vehicleName,
      }));
    }
  }, [profile]);

  const handleGenerate = async () => {
    if (!form.driverName || !form.targetCompanyName || !form.city) {
      toast.error("Please fill in Driver Name, City, and Target Company.");
      return;
    }
    const input: PresentationInput = {
      driverName: form.driverName ?? "",
      city: form.city ?? "",
      routes: form.routes ?? [],
      tripsPerMonth: form.tripsPerMonth ?? 200,
      avgPassengers: form.avgPassengers ?? 3,
      vehicleModel: form.vehicleModel ?? "sedan",
      targetCompanyName: form.targetCompanyName ?? "",
      targetIndustry: form.targetIndustry ?? "Other",
      estimatedMonthlyExposure: form.estimatedMonthlyExposure ?? 600000,
      proposedDealValue: form.proposedDealValue ?? 20000,
    };

    try {
      const result = await generateMutation.mutateAsync(input);
      setPresentation(result);
      toast.success("Presentation ready! Swipe through your slides.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate presentation",
      );
    }
  };

  const addRoute = () => {
    const val = routeInput.trim();
    if (val && !(form.routes ?? []).includes(val)) {
      setForm((prev) => ({ ...prev, routes: [...(prev.routes ?? []), val] }));
      setRouteInput("");
    }
  };

  const removeRoute = (route: string) => {
    setForm((prev) => ({
      ...prev,
      routes: (prev.routes ?? []).filter((r) => r !== route),
    }));
  };

  if (presentation) {
    return (
      <SlideCarousel
        presentation={presentation}
        onReset={() => setPresentation(null)}
      />
    );
  }

  return (
    <div className="space-y-6" data-ocid="presentation-builder">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Presentation className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">
            Nduna Presentation Builder
          </h2>
          <p className="text-sm text-muted-foreground">
            AI-generated pitch deck for advertising deals
          </p>
        </div>
        <Badge className="ml-auto bg-primary/10 text-primary border-primary/20">
          Elite Only
        </Badge>
      </div>

      {/* Saved presentations shortcut */}
      {savedPresentations.length > 0 && (
        <div className="bg-muted/30 rounded-xl p-4 border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent Presentations
          </p>
          <div className="space-y-2">
            {savedPresentations.slice(0, 3).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPresentation(p)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors text-left"
                data-ocid="saved-presentation-row"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {p.driverName} × {p.companyName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.generatedAt).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <h3 className="text-base font-semibold text-foreground">
          Driver Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="driverName">Your Name</Label>
            <Input
              id="driverName"
              value={form.driverName ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, driverName: e.target.value }))
              }
              placeholder="e.g. Sipho Nkosi"
              data-ocid="form-driver-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">Primary City</Label>
            <Input
              id="city"
              value={form.city ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              placeholder="e.g. Johannesburg"
              data-ocid="form-city"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vehicleModel">Vehicle Model</Label>
            <Input
              id="vehicleModel"
              value={form.vehicleModel ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, vehicleModel: e.target.value }))
              }
              placeholder="e.g. Toyota Camry"
              data-ocid="form-vehicle"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tripsPerMonth">Trips Per Month</Label>
            <Input
              id="tripsPerMonth"
              type="number"
              value={form.tripsPerMonth ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  tripsPerMonth: Number(e.target.value),
                }))
              }
              placeholder="200"
              data-ocid="form-trips"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="avgPassengers">Avg Passengers/Trip</Label>
            <Input
              id="avgPassengers"
              type="number"
              value={form.avgPassengers ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  avgPassengers: Number(e.target.value),
                }))
              }
              placeholder="3"
              data-ocid="form-passengers"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="monthlyExposure">
              Monthly Exposure (impressions)
            </Label>
            <Input
              id="monthlyExposure"
              type="number"
              value={form.estimatedMonthlyExposure ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  estimatedMonthlyExposure: Number(e.target.value),
                }))
              }
              placeholder="600000"
              data-ocid="form-exposure"
            />
          </div>
        </div>

        {/* Routes */}
        <div className="space-y-2">
          <Label>Primary Routes (optional)</Label>
          <div className="flex gap-2">
            <Input
              value={routeInput}
              onChange={(e) => setRouteInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRoute()}
              placeholder="e.g. Sandton CBD"
              data-ocid="form-route-input"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRoute}
              data-ocid="form-route-add"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {(form.routes ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {(form.routes ?? []).map((r) => (
                <Badge
                  key={r}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {r}
                  <button
                    type="button"
                    onClick={() => removeRoute(r)}
                    className="ml-1"
                    aria-label={`Remove ${r}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Target Company */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h3 className="text-base font-semibold text-foreground">
          Target Company
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={form.targetCompanyName ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, targetCompanyName: e.target.value }))
              }
              placeholder="e.g. MTN South Africa"
              data-ocid="form-company-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="industry">Industry</Label>
            <Select
              value={form.targetIndustry ?? "Other"}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, targetIndustry: v }))
              }
            >
              <SelectTrigger id="industry" data-ocid="form-industry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="dealValue">Proposed Deal Value (R/month)</Label>
            <Input
              id="dealValue"
              type="number"
              value={form.proposedDealValue ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  proposedDealValue: Number(e.target.value),
                }))
              }
              placeholder="20000"
              data-ocid="form-deal-value"
            />
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <Button
        className="w-full h-14 text-base font-bold font-display"
        onClick={handleGenerate}
        disabled={generateMutation.isPending}
        data-ocid="generate-presentation-btn"
      >
        {generateMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Nduna is building your deck…
          </>
        ) : (
          <>
            <Presentation className="w-5 h-5 mr-2" />
            Generate Presentation
          </>
        )}
      </Button>

      {generateMutation.isPending && (
        <div className="space-y-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            Nduna is crafting your personalized pitch… (this takes ~10s)
          </p>
        </div>
      )}
    </div>
  );
}

/** Slide Carousel component — used in builder and public view */
export function SlideCarousel({
  presentation,
  onReset,
  readOnly = false,
}: {
  presentation: PresentationData;
  onReset?: () => void;
  readOnly?: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "right",
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const slides = presentation.slides;
  const current = slides[currentIndex];

  const go = useCallback(
    (direction: "prev" | "next") => {
      if (direction === "prev" && currentIndex > 0) {
        setSlideDirection("left");
        setCurrentIndex((i) => i - 1);
      } else if (direction === "next" && currentIndex < slides.length - 1) {
        setSlideDirection("right");
        setCurrentIndex((i) => i + 1);
      }
    },
    [currentIndex, slides.length],
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go("prev");
      if (e.key === "ArrowRight") go("next");
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go]);

  const handleShareLink = () => {
    const url = `${window.location.origin}/presentation/${presentation.shareToken}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied! Share it with your contact."))
      .catch(() => toast.error("Could not copy link"));
  };

  const SlideContent = ({ slide }: { slide: Slide }) => (
    <div className="slide-content" style={{ color: "oklch(0.1 0.01 70)" }}>
      {slide.dataPoint && (
        <div
          className="slide-highlight"
          style={{ fontSize: "1rem", marginBottom: "0.5rem" }}
        >
          {slide.dataPoint}
        </div>
      )}
      <h2 className="slide-title">{slide.title}</h2>
      <ul style={{ listStyle: "none", padding: 0, maxWidth: "75%" }}>
        {slide.bullets.map((b) => (
          <li
            key={b}
            className="slide-subtitle"
            style={{ marginBottom: "0.25rem" }}
          >
            {slide.slideType === "pricing-options" ? b : `• ${b}`}
          </li>
        ))}
      </ul>
      {/* Branding bar */}
      <div
        style={{
          position: "absolute",
          bottom: "3rem",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.75rem",
          color: "oklch(0.55 0.03 85)",
        }}
      >
        <span
          style={{
            width: "1.5rem",
            height: "2px",
            background: "oklch(0.6 0.22 35)",
            display: "inline-block",
          }}
        />
        <span style={{ fontWeight: 600 }}>MoneyDrive</span>
        <span style={{ color: "oklch(0.6 0.22 35)" }}>×</span>
        <span>Powered by Nduna</span>
        <span
          style={{
            width: "1.5rem",
            height: "2px",
            background: "oklch(0.6 0.22 35)",
            display: "inline-block",
          }}
        />
      </div>
    </div>
  );

  const CarouselCore = () => (
    <div className="slide-container" ref={containerRef}>
      <div
        key={`${currentIndex}-${slideDirection}`}
        style={{
          animation: `${slideDirection === "right" ? "slideInRight" : "slideInLeft"} 0.25s ease-out forwards`,
          height: "100%",
        }}
      >
        <SlideContent slide={current} />
      </div>

      {/* Nav buttons */}
      {currentIndex > 0 && (
        <button
          type="button"
          className="slide-nav-button prev"
          onClick={() => go("prev")}
          aria-label="Previous slide"
          data-ocid="slide-prev"
        >
          <ChevronLeft
            style={{ width: "1.25rem", height: "1.25rem", color: "#333" }}
          />
        </button>
      )}
      {currentIndex < slides.length - 1 && (
        <button
          type="button"
          className="slide-nav-button next"
          onClick={() => go("next")}
          aria-label="Next slide"
          data-ocid="slide-next"
        >
          <ChevronRight
            style={{ width: "1.25rem", height: "1.25rem", color: "#333" }}
          />
        </button>
      )}

      {/* Slide number */}
      <div
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          fontSize: "0.75rem",
          color: "oklch(0.5 0.02 85)",
          fontWeight: 600,
        }}
      >
        {currentIndex + 1} / {slides.length}
      </div>

      {/* Dot indicators */}
      <div className="slide-dots">
        {slides.map((slide, i) => (
          <button
            key={slide.slideType + String(i)}
            type="button"
            className={`slide-dot${i === currentIndex ? " active" : ""}`}
            onClick={() => setCurrentIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            data-ocid={`slide-dot-${i}`}
          />
        ))}
      </div>

      {/* Fullscreen toggle */}
      <button
        type="button"
        onClick={() => setIsFullscreen(true)}
        style={{
          position: "absolute",
          top: "1rem",
          left: "1rem",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "oklch(0.4 0.02 85)",
        }}
        aria-label="Enter fullscreen"
        data-ocid="slide-fullscreen"
      >
        <Maximize2 style={{ width: "1.1rem", height: "1.1rem" }} />
      </button>
    </div>
  );

  return (
    <>
      {/* Fullscreen overlay */}
      {isFullscreen && (
        <dialog
          open
          className="presentation-fullscreen"
          aria-label="Presentation fullscreen"
          style={{
            border: "none",
            padding: 0,
            maxWidth: "100vw",
            maxHeight: "100vh",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFullscreen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsFullscreen(false);
          }}
        >
          <button
            type="button"
            className="presentation-close-button"
            onClick={() => setIsFullscreen(false)}
            aria-label="Exit fullscreen"
          >
            <X style={{ width: "1.25rem", height: "1.25rem" }} />
          </button>
          <div style={{ width: "min(90vw, 960px)" }}>
            <CarouselCore />
          </div>
          <div
            className="slide-dots"
            style={{ position: "static", marginTop: "1rem" }}
          >
            {slides.map((slide, i) => (
              <button
                key={slide.slideType + String(i)}
                type="button"
                className={`slide-dot${i === currentIndex ? " active" : ""}`}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </dialog>
      )}

      <div className="space-y-4" data-ocid="slide-carousel">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Presentation
            </p>
            <h3 className="text-lg font-display font-bold text-foreground">
              {presentation.driverName} × {presentation.companyName}
            </h3>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20">
            {slides.length} slides
          </Badge>
        </div>

        {/* Carousel */}
        <CarouselCore />

        {/* Speaker notes */}
        {current.speakerNotes && (
          <div className="bg-muted/30 rounded-xl p-4 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Nduna's Coaching Tip
            </p>
            <p className="text-sm text-foreground/80">{current.speakerNotes}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="presentation-action-buttons">
          <button
            type="button"
            className="presentation-action-button primary"
            onClick={handleShareLink}
            data-ocid="share-link-btn"
          >
            <Copy style={{ width: "1rem", height: "1rem" }} />
            Share Link
          </button>
          <button
            type="button"
            className="presentation-action-button secondary"
            onClick={() => setIsFullscreen(true)}
            data-ocid="fullscreen-btn"
          >
            <Expand style={{ width: "1rem", height: "1rem" }} />
            Present
          </button>
          {!readOnly && onReset && (
            <button
              type="button"
              className="presentation-action-button secondary"
              onClick={onReset}
              data-ocid="new-presentation-btn"
            >
              <Plus style={{ width: "1rem", height: "1rem" }} />
              New Pitch
            </button>
          )}
        </div>
      </div>
    </>
  );
}
