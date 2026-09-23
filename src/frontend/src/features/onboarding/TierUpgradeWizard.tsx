import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  MapPin,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const ONBOARDING_KEY = "moneydrive_onboarding_tier2_complete";

interface TierUpgradeWizardProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

const SA_CITIES = [
  "Johannesburg",
  "Cape Town",
  "Durban",
  "Pretoria",
  "Port Elizabeth",
];

const MOCK_LEADS = [
  { name: "FastFleet Logistics", industry: "Logistics", hiring: true },
  { name: "MTN Business SA", industry: "Telecoms", hiring: false },
  { name: "FNB Corporate", industry: "Finance", hiring: true },
];

export function TierUpgradeWizard({
  open,
  onClose,
  onNavigate,
}: TierUpgradeWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedCity, setSelectedCity] = useState("");

  function handleDone() {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onClose();
  }

  function handleSkip() {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onClose();
  }

  function handleNavigate(tab: string) {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onNavigate(tab);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleSkip()}>
      <DialogContent
        className="max-w-sm w-full p-0 overflow-hidden rounded-2xl border-0"
        data-ocid="tier_wizard.dialog"
      >
        {/* Header */}
        <div
          className="px-5 pt-5 pb-4"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.52 0.20 35) 0%, oklch(0.45 0.22 35) 100%)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? "24px" : "8px",
                    background:
                      i === step ? "#D4AF37" : "rgba(255,255,255,0.3)",
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleSkip}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.8)",
              }}
              aria-label="Skip wizard"
              data-ocid="tier_wizard.skip.button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="header-0"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: "#D4AF37" }}
                >
                  Step 1 of 3
                </p>
                <h2 className="font-display text-xl font-bold text-white">
                  You're now a Pro Driver
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  Make your first R530 back — before your first month is up
                </p>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div
                key="header-1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: "#D4AF37" }}
                >
                  Step 2 of 3
                </p>
                <h2 className="font-display text-xl font-bold text-white">
                  Your first leads are ready
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  Nduna found companies near {selectedCity || "your area"}
                </p>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="header-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: "#D4AF37" }}
                >
                  Step 3 of 3
                </p>
                <h2 className="font-display text-xl font-bold text-white">
                  Your first pitch takes 2 minutes
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  Nduna creates a branded PDF you can email today
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Set city */}
            {step === 0 && (
              <motion.div
                key="body-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> Where do you
                    drive?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nduna will search for advertising leads in your city.
                  </p>
                </div>
                <div
                  className="grid grid-cols-2 gap-2"
                  data-ocid="tier_wizard.city_picker"
                >
                  {SA_CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setSelectedCity(city)}
                      className="rounded-xl border px-3 py-2.5 text-sm font-medium text-left transition-all"
                      style={{
                        background:
                          selectedCity === city
                            ? "oklch(0.52 0.20 35 / 0.1)"
                            : "transparent",
                        borderColor:
                          selectedCity === city
                            ? "oklch(0.52 0.20 35)"
                            : "oklch(0.85 0.02 240)",
                        color:
                          selectedCity === city
                            ? "oklch(0.52 0.20 35)"
                            : "inherit",
                      }}
                      data-ocid={`tier_wizard.city.${city.toLowerCase().replace(" ", "_")}.button`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Preview leads */}
            {step === 1 && (
              <motion.div
                key="body-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {MOCK_LEADS.map((lead, idx) => (
                  <div
                    key={lead.name}
                    className="rounded-xl border border-border p-3 flex items-center gap-3"
                    data-ocid={`tier_wizard.lead_preview.item.${idx + 1}`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {lead.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lead.industry}
                      </p>
                    </div>
                    {lead.hiring && (
                      <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px] shrink-0">
                        Hiring
                      </Badge>
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground text-center pt-1">
                  Your full list of 10 leads is in the Advertising tab. Nduna
                  refreshes them every week.
                </p>
              </motion.div>
            )}

            {/* Step 3: Generate pitch */}
            {step === 2 && (
              <motion.div
                key="body-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {/* Pitch deck preview card */}
                <div
                  className="rounded-2xl p-4 relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.15 0.05 250) 0%, oklch(0.20 0.04 250) 100%)",
                    border: "1px solid oklch(0.30 0.06 250)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-white font-semibold text-sm">
                      MoneyDrive Pitch Deck
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      "Your Exposure Stats",
                      "Why Advertise With You",
                      "Pricing Options",
                      "Call to Action",
                    ].map((s) => (
                      <div
                        key={s}
                        className="h-3 rounded-full"
                        style={{
                          background: "rgba(255,255,255,0.07)",
                          width: `${60 + Math.random() * 30}%`,
                        }}
                      />
                    ))}
                  </div>
                  <div
                    className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full opacity-20"
                    style={{ background: "#D4AF37" }}
                  />
                </div>

                <div className="rounded-xl bg-muted/60 p-3 space-y-1.5">
                  {[
                    {
                      icon: TrendingUp,
                      text: "Includes your real passenger & exposure data",
                    },
                    {
                      icon: Sparkles,
                      text: "Nduna writes personalized pitch copy",
                    },
                    {
                      icon: CheckCircle2,
                      text: "Download as PDF, email in minutes",
                    },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-xs">
                      <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-muted-foreground">{text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA buttons */}
          <div className="space-y-2 pt-1">
            {step === 0 && (
              <>
                <Button
                  className="w-full gap-2"
                  onClick={() => setStep(1)}
                  data-ocid="tier_wizard.next.button"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full text-center text-xs text-muted-foreground py-1.5"
                  data-ocid="tier_wizard.skip_text.button"
                >
                  Skip for now
                </button>
              </>
            )}
            {step === 1 && (
              <>
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={() => handleNavigate("advertising")}
                  data-ocid="tier_wizard.go_to_leads.button"
                >
                  <Building2 className="w-4 h-4" /> Go to My Leads
                </Button>
                <Button
                  className="w-full gap-2"
                  onClick={() => setStep(2)}
                  data-ocid="tier_wizard.next_step2.button"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full text-center text-xs text-muted-foreground py-1.5"
                  data-ocid="tier_wizard.skip_step2.button"
                >
                  Skip for now
                </button>
              </>
            )}
            {step === 2 && (
              <>
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={() => handleNavigate("advertising")}
                  data-ocid="tier_wizard.go_to_pitch.button"
                >
                  <FileText className="w-4 h-4" /> Go to Pitch Generator
                </Button>
                <Button
                  className="w-full"
                  onClick={handleDone}
                  data-ocid="tier_wizard.done.button"
                >
                  Done — I'm ready!
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function shouldShowTierWizard(tier: number): boolean {
  if (tier < 2) return false;
  return !localStorage.getItem(ONBOARDING_KEY);
}
