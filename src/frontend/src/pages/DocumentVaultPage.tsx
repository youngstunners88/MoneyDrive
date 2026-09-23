/**
 * DocumentVaultPage.tsx — Secure driver document storage.
 * Tier 2+ feature. Upload, view, annotate, and delete personal documents.
 * Includes Nduna readability banner and markdown preview integration.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  BookOpen,
  Lock,
  Shield,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import type { UserProfile } from "../backend";
import { DocumentList } from "../features/documents/DocumentList";
import { DocumentUpload } from "../features/documents/DocumentUpload";
import { useDocuments } from "../features/documents/useDocuments";

interface Props {
  profile?: UserProfile | null;
  tier?: number;
  isAdmin?: boolean;
  onAskNduna?: (message: string) => void;
}

const NDUNA_BANNER_KEY = "nduna_doc_banner_dismissed";

// ─── Upgrade prompt (Tier 1) ──────────────────────────────────────────────────

function UpgradePrompt() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] p-6"
      data-ocid="document_vault.upgrade_prompt"
    >
      <Card className="bg-card shadow-card border-border rounded-2xl p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <Badge className="mb-4 bg-primary/15 text-primary border-primary/30 text-xs font-semibold">
          Pro Driver — Tier 2
        </Badge>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Upgrade to Unlock Document Vault
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          Upgrade to{" "}
          <span className="font-semibold text-foreground">
            Tier 2 (Pro Driver)
          </span>{" "}
          to safely store your Vehicle Registration, Operating Licence, Tax
          Invoices, and more. Nduna can access your documents anytime.
        </p>
        <div className="space-y-2 text-sm text-left mb-6">
          {[
            "Store your key documents securely on the blockchain",
            "Nduna references your docs in chat automatically",
            "Download anytime, on any device",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2.5 text-muted-foreground"
            >
              <ShieldCheck className="w-4 h-4 text-success shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <Button
          className="w-full font-semibold"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("navigate-tab", { detail: "settings" }),
            )
          }
          data-ocid="document_vault.upgrade_button"
        >
          View Plans &amp; Upgrade — R530/month
        </Button>
      </Card>
    </div>
  );
}

// ─── Nduna awareness banner ───────────────────────────────────────────────────

function NdunaBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="relative flex items-start gap-3 px-4 py-3.5 bg-card border-l-4 border-burnt-orange rounded-xl shadow-sm"
      data-ocid="document_vault.nduna_banner"
    >
      <div className="shrink-0 mt-0.5 w-8 h-8 rounded-full bg-burnt-orange/15 flex items-center justify-center">
        <BookOpen className="w-4 h-4 text-burnt-orange" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-relaxed">
          <span className="font-semibold text-burnt-orange">
            Nduna can read your documents.
          </span>{" "}
          Upload a contract, invoice, or registration — then tap{" "}
          <span className="font-medium text-foreground">
            "Ask Nduna to read"
          </span>{" "}
          and he'll understand the full content to help you with negotiations,
          claims, and planning.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        aria-label="Dismiss banner"
        data-ocid="document_vault.nduna_banner_dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DocumentVaultPage({
  tier = 1,
  isAdmin = false,
  onAskNduna,
}: Props) {
  const effectiveTier = isAdmin ? 3 : tier;
  const { documents, isLoading } = useDocuments();

  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem(NDUNA_BANNER_KEY) === "true";
    } catch {
      return false;
    }
  });

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    try {
      localStorage.setItem(NDUNA_BANNER_KEY, "true");
    } catch {
      // ignore storage errors
    }
  };

  if (effectiveTier < 2) {
    return <UpgradePrompt />;
  }

  return (
    <div
      className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6"
      data-ocid="document_vault.page"
    >
      {/* Header with Nduna avatar */}
      <div className="flex items-start gap-3">
        <img
          src="https://i.imgur.com/u98U7S6.png"
          alt="Nduna"
          className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-primary/30 mt-1"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl font-bold text-foreground">
              My Documents
            </h1>
            <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Secure Vault
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
            Keep your important papers safe — Nduna can access these anytime
          </p>
        </div>
      </div>

      {/* Nduna awareness banner — dismissible */}
      {!bannerDismissed && <NdunaBanner onDismiss={handleDismissBanner} />}

      {/* Upload section */}
      <Card
        className="bg-card border-border shadow-card rounded-2xl overflow-hidden"
        data-ocid="document_vault.upload_section"
      >
        <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm text-foreground uppercase tracking-wide">
            Upload Document
          </h2>
        </div>
        <div className="p-5">
          <DocumentUpload />
        </div>
      </Card>

      {/* Documents section */}
      <div data-ocid="document_vault.documents_section">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-display font-bold text-lg text-foreground">
            Your Documents
          </h2>
          {documents.length > 0 && (
            <Badge className="bg-muted/60 text-muted-foreground border-border text-xs">
              {documents.length}
            </Badge>
          )}
        </div>
        <DocumentList
          docs={documents}
          isLoading={isLoading}
          onAskNduna={onAskNduna}
          onUploadClick={() => {
            document
              .querySelector<HTMLButtonElement>(
                "[data-ocid='document_upload.browse_button']",
              )
              ?.click();
          }}
        />
      </div>

      {/* Nduna awareness footer */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-primary/5 border border-primary/15 rounded-xl text-sm text-muted-foreground">
        <img
          src="https://i.imgur.com/u98U7S6.png"
          alt="Nduna"
          className="w-6 h-6 rounded-full object-cover shrink-0"
        />
        <p>
          <span className="font-semibold text-foreground">Nduna</span> can
          reference your documents in chat when you need help with renewals, tax
          queries, or compliance.
        </p>
      </div>

      {/* Blockchain security note */}
      <Card className="bg-muted/20 border-border/50">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Documents are stored with end-to-end encryption on the Internet
            Computer blockchain. Only you can access them using your Internet
            Identity.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
