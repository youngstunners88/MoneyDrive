import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bitcoin,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  QrCode,
  Receipt,
  ShoppingBag,
  Smartphone,
  Trash2,
  Wallet,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  DriverPaymentConfig,
  backendInterface as FullBackend,
  UserProfile,
} from "../backend.d";
import { useActor } from "../hooks/useActor";

interface Props {
  profile: UserProfile | null | undefined;
  tier: number;
}

const PAYMENT_FIELDS: Array<{
  key: keyof DriverPaymentConfig;
  label: string;
  placeholder: string;
  icon: string;
}> = [
  {
    key: "btcAddress",
    label: "Bitcoin (BTC) Address",
    placeholder: "bc1q...",
    icon: "₿",
  },
  {
    key: "ethAddress",
    label: "Ethereum (ETH) Address",
    placeholder: "0x...",
    icon: "Ξ",
  },
  {
    key: "solAddress",
    label: "Solana (SOL) Address",
    placeholder: "...",
    icon: "◎",
  },
  { key: "bnbAddress", label: "BNB Address", placeholder: "0x...", icon: "⬡" },
  {
    key: "usdcAddress",
    label: "USDC Address",
    placeholder: "0x...",
    icon: "$",
  },
  {
    key: "baseAddress",
    label: "Base (BASE) Address",
    placeholder: "0x...",
    icon: "BASE",
  },
  {
    key: "usdtAddress",
    label: "USDT Address",
    placeholder: "0x...",
    icon: "₮",
  },
  {
    key: "bankName",
    label: "Bank Name",
    placeholder: "FNB, Standard Bank...",
    icon: "BNK",
  },
  {
    key: "bankAccount",
    label: "Bank Account Number",
    placeholder: "1234567890",
    icon: "#",
  },
  {
    key: "bankReference",
    label: "Payment Reference",
    placeholder: "Your name or ID...",
    icon: "REF",
  },
];

const EMPTY_CONFIG: DriverPaymentConfig = {
  btcAddress: "",
  ethAddress: "",
  solAddress: "",
  bnbAddress: "",
  usdcAddress: "",
  baseAddress: "",
  usdtAddress: "",
  bankName: "",
  bankAccount: "",
  bankReference: "",
  snapScanMerchantId: "",
};

function formatOrderDate(timestamp: bigint) {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleString();
}

// SnapScan onboarding guide steps
const SNAPSCAN_STEPS = [
  {
    num: 1,
    title: "Create Your SnapScan Merchant Account",
    bullets: [
      "Go to snapscan.co.za or download the SnapScan Business app",
      "Register with your SA bank account details (any major SA bank works)",
      "You'll get an approval SMS within 24 hours",
    ],
    link: {
      label: "Open SnapScan →",
      url: "https://www.snapscan.co.za/",
    },
  },
  {
    num: 2,
    title: "Get Your SnapCode",
    bullets: [
      "Once approved, check your welcome email from SnapScan",
      "Your SnapCode looks like: rQ1psbyq (short alphanumeric — NOT your account number like PXW251106)",
      "You can also find it in your SnapScan merchant portal under Profile → My QR Code",
    ],
    link: null,
  },
  {
    num: 3,
    title: "Enter It Here",
    bullets: [
      "Paste your SnapCode (e.g. rQ1psbyq) in the Payment Settings field below",
      "MoneyDrive generates your QR menu link — share with passengers or print the QR",
    ],
    link: null,
  },
  {
    num: 4,
    title: "Start Earning",
    bullets: [
      "Passengers scan your QR code and pay directly to your SnapScan account",
      "You receive funds same-day in your linked bank account",
      "Sell WiFi (R5), Water (R15), Candy (R2–R5), Perfume Shot (R10) and more",
    ],
    link: null,
  },
];

function SnapScanOnboardingGuide({ merchantId }: { merchantId: string }) {
  const [expanded, setExpanded] = useState(!merchantId);
  const isSetup = !!merchantId;

  return (
    <Card className="shadow-card" data-ocid="qr_menu.snapscan_guide.card">
      <CardHeader className="pb-2">
        <button
          type="button"
          className="w-full flex items-center justify-between"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          data-ocid="qr_menu.snapscan_guide.toggle"
        >
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" />
            Set Up SnapScan to Accept Payments
          </CardTitle>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        {isSetup && !expanded && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5" />✓ You're set up! SnapCode
            configured.
          </div>
        )}
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {isSetup && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-3.5 h-3.5" />✓ You're set up! SnapCode
              is configured. Passengers can already pay you via SnapScan.
            </div>
          )}
          <div className="space-y-4">
            {SNAPSCAN_STEPS.map((step) => (
              <div key={step.num} className="flex gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white mt-0.5"
                  style={{ background: "oklch(0.52 0.20 35)" }}
                >
                  {step.num}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground mb-1">
                    {step.title}
                  </p>
                  <ul className="space-y-0.5">
                    {step.bullets.map((b) => (
                      <li
                        key={b}
                        className="text-xs text-muted-foreground flex gap-1.5"
                      >
                        <span className="text-primary mt-0.5 shrink-0">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  {step.link && (
                    <a
                      href={step.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold mt-2"
                      style={{ color: "oklch(0.52 0.20 35)" }}
                    >
                      {step.link.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function QRMenuPage({ profile }: Props) {
  const { actor: _actor } = useActor();
  const actor = _actor as unknown as FullBackend | null;
  const queryClient = useQueryClient();
  const imgRef = useRef<HTMLImageElement>(null);
  const driverName = encodeURIComponent(profile?.displayName ?? "driver");
  const menuUrl = `${window.location.origin}/menu/${driverName}`;

  const qrSrc = `https://chart.googleapis.com/chart?chs=256x256&cht=qr&chl=${encodeURIComponent(menuUrl)}&choe=UTF-8`;

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => actor!.getProducts(),
    enabled: !!actor,
  });

  const { data: existingConfig, isLoading: configLoading } = useQuery({
    queryKey: ["payment-config"],
    queryFn: () => actor!.getMyPaymentConfig(),
    enabled: !!actor,
  });

  const { data: snapScanMerchantIdFromBackend } = useQuery({
    queryKey: ["snapscan-merchant-id"],
    queryFn: () => actor!.getMySnapScanMerchantId(),
    enabled: !!actor,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["passenger-orders"],
    queryFn: () => actor!.getPassengerOrders(),
    enabled: !!actor,
  });

  const [payConfig, setPayConfig] = useState<DriverPaymentConfig>(EMPTY_CONFIG);
  const [configInitialized, setConfigInitialized] = useState(false);
  const [snapScanMerchantId, setSnapScanMerchantId] = useState<string>("");

  if (existingConfig !== undefined && !configInitialized) {
    const baseConfig = existingConfig ?? EMPTY_CONFIG;
    // Strip any legacy SNAPSCAN encoding from bankReference (migration cleanup)
    const cleanRef =
      baseConfig.bankReference?.replace(/\|\|SNAPSCAN:[^|]*/g, "").trim() ?? "";
    setPayConfig({ ...baseConfig, bankReference: cleanRef });
    setConfigInitialized(true);
  }

  // Sync snapScanMerchantId from backend query result (one-way, on first load)
  const [merchantIdInitialized, setMerchantIdInitialized] = useState(false);
  if (snapScanMerchantIdFromBackend !== undefined && !merchantIdInitialized) {
    const backendId =
      snapScanMerchantIdFromBackend != null &&
      Array.isArray(snapScanMerchantIdFromBackend) &&
      snapScanMerchantIdFromBackend.length > 0
        ? (snapScanMerchantIdFromBackend[0] as string)
        : typeof snapScanMerchantIdFromBackend === "string"
          ? snapScanMerchantIdFromBackend
          : "";
    if (backendId) setSnapScanMerchantId(backendId);
    setMerchantIdInitialized(true);
  }

  const saveConfigMutation = useMutation({
    mutationFn: async (config: DriverPaymentConfig) => {
      if (!actor) throw new Error("No actor");
      const merchantId = snapScanMerchantId.trim();
      // Save merchant ID to backend directly (no localStorage)
      await (
        actor as unknown as {
          saveMySnapScanMerchantId: (id: string) => Promise<void>;
        }
      ).saveMySnapScanMerchantId(merchantId);
      // Save the rest of the payment config (strip any legacy encoding)
      const cleanConfig: DriverPaymentConfig = {
        ...config,
        bankReference: config.bankReference
          .replace(/\|\|SNAPSCAN:[^|]*/g, "")
          .trim(),
      };
      await actor.saveDriverPaymentConfig(cleanConfig);
    },
    onSuccess: () => {
      toast.success("Payment settings saved!");
      queryClient.invalidateQueries({ queryKey: ["payment-config"] });
      queryClient.invalidateQueries({ queryKey: ["snapscan-merchant-id"] });
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!actor) throw new Error("No actor");
      await actor.deletePassengerOrder(orderId);
    },
    onSuccess: () => {
      toast.success("Order deleted");
      queryClient.invalidateQueries({ queryKey: ["passenger-orders"] });
    },
    onError: () => toast.error("Failed to delete order"),
  });

  const inStockProducts = (products ?? []).filter(
    (p) => Number(p.currentStock) > 0,
  );

  const downloadQR = useCallback(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 256;
      canvas.height = img.naturalHeight || 256;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Could not generate QR image. Try again.");
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = "moneydrive-menu-qr.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      }, "image/png");
    };
    img.onerror = () => toast.error("Could not load QR image. Try again.");
    img.src = qrSrc;
  }, [qrSrc]);

  const copyLink = () => {
    navigator.clipboard
      .writeText(menuUrl)
      .then(() => toast.success("Link copied!"))
      .catch(() => toast.error("Failed to copy link"));
  };

  function handleConfigChange(key: keyof DriverPaymentConfig, value: string) {
    setPayConfig((prev) => ({ ...prev, [key]: value }));
  }

  // Live SnapScan preview URL using driver's own merchant ID
  const snapScanPreviewUrl = snapScanMerchantId
    ? `https://pos.snapscan.io/qr/${encodeURIComponent(snapScanMerchantId)}`
    : null;
  const snapScanPreviewQr = snapScanPreviewUrl
    ? `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(snapScanPreviewUrl)}&choe=UTF-8`
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="mb-2">
        <h1 className="font-display text-2xl font-bold">QR Code Menu</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Passengers scan this code to browse your in-car menu
        </p>
      </div>

      {/* SnapScan Onboarding Guide */}
      <SnapScanOnboardingGuide merchantId={snapScanMerchantId} />

      {/* SnapScan Payment Preview — only shown when merchant ID is configured */}
      {snapScanPreviewUrl && (
        <Card
          className="shadow-card border-primary/20"
          data-ocid="qr_menu.snapscan_preview.card"
        >
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              Your SnapScan Payment QR
              <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px] ml-auto">
                Active
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              This is what passengers scan to pay you directly via SnapScan
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-border">
              <img
                src={snapScanPreviewQr!}
                alt="Your SnapScan QR Code"
                width={200}
                height={200}
                className="rounded"
              />
            </div>
            <p className="text-xs text-muted-foreground font-mono text-center">
              Merchant: {snapScanMerchantId}
            </p>
            <div className="flex gap-2 w-full">
              <Button
                className="flex-1 gap-2"
                onClick={() => window.open(snapScanPreviewUrl, "_blank")}
                data-ocid="qr_menu.snapscan_preview.test_button"
              >
                <ExternalLink className="w-4 h-4" />
                Test Your QR
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => {
                  navigator.clipboard
                    .writeText(snapScanPreviewUrl)
                    .then(() => toast.success("SnapScan link copied!"))
                    .catch(() => toast.error("Failed to copy"));
                }}
                data-ocid="qr_menu.snapscan_preview.copy_button"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Tap "Test Your QR" to verify your SnapScan page is working before
              showing it to passengers.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Menu QR Code */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <QrCode className="w-4 h-4 text-primary" /> Your Menu QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <img
                ref={imgRef}
                src={qrSrc}
                alt="QR Code for your menu"
                width={256}
                height={256}
                className="rounded"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center break-all">
              {menuUrl}
            </p>
            <div className="flex gap-2 w-full">
              <Button
                onClick={downloadQR}
                className="gap-2 flex-1"
                data-ocid="qr_menu.download.button"
              >
                <Download className="w-4 h-4" /> Download QR
              </Button>
              <Button
                variant="outline"
                onClick={copyLink}
                className="gap-2 flex-1"
                data-ocid="qr_menu.copy_link.button"
              >
                <Copy className="w-4 h-4" /> Copy Link
              </Button>
            </div>
            {/* SnapScan registration notice */}
            {!snapScanMerchantId && (
              <div className="w-full rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <p className="font-semibold mb-0.5 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" /> Need a SnapScan
                  account?
                </p>
                You need a SnapScan merchant account to accept QR payments. Sign
                up free at{" "}
                <a
                  href="https://merchant.getsnapscan.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold"
                >
                  merchant.getsnapscan.com
                </a>
                , then enter your SnapCode below.
              </div>
            )}
            <div className="w-full rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground mb-0.5 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-primary" /> About this QR
                code
              </p>
              This code shows passengers your product menu. For SnapScan
              payments, enter your{" "}
              <span className="font-semibold text-foreground">SnapCode</span> in
              Payment Settings below.
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" /> Menu Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : inStockProducts.length === 0 ? (
              <div
                className="text-center py-8"
                data-ocid="qr_menu.items.empty_state"
              >
                <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  {(products ?? []).length === 0
                    ? "No products yet. Add products in the Sales tab."
                    : "All products are currently out of stock."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {inStockProducts.map((p, idx) => (
                  <div
                    key={p.productId}
                    className="py-3 flex items-center justify-between"
                    data-ocid={`qr_menu.items.item.${idx + 1}`}
                  >
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Stock: {Number(p.currentStock)}
                      </p>
                    </div>
                    <span className="font-bold text-primary">
                      {profile?.currencyCode ?? "ZAR"}{" "}
                      {p.sellingPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Settings */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" /> Payment Settings
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add your payment details so passengers can pay you directly.
          </p>
        </CardHeader>
        <CardContent>
          {configLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* SnapScan section — FIRST and most prominent */}
              <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" /> SnapScan (SA QR
                  Payments)
                </p>
                <div className="space-y-2">
                  <Label htmlFor="pay-snapscan" className="text-xs font-medium">
                    📱 SnapCode
                  </Label>
                  <Input
                    id="pay-snapscan"
                    value={snapScanMerchantId}
                    onChange={(e) => setSnapScanMerchantId(e.target.value)}
                    placeholder="e.g. rQ1psbyq"
                    className="border-primary/30 focus:border-primary"
                    data-ocid="qr_menu.payment.snapscan.input"
                  />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your <strong className="text-foreground">SnapCode</strong>{" "}
                    (e.g. <span className="font-mono">rQ1psbyq</span>) is
                    different from your Merchant ID/SnapCode number (e.g.{" "}
                    <span className="font-mono">PXW251106</span>). Use the
                    SnapCode sent to you by SnapScan in your welcome email — it
                    is a short alphanumeric code. Find it in your SnapScan
                    merchant portal at{" "}
                    <a
                      href="https://merchant.getsnapscan.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-primary"
                    >
                      merchant.getsnapscan.com
                    </a>
                  </p>
                </div>
              </div>

              {/* Bank section */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" /> EFT / Bank
                  Details
                </p>
                <div className="space-y-3">
                  {PAYMENT_FIELDS.filter((f) =>
                    ["bankName", "bankAccount", "bankReference"].includes(
                      f.key,
                    ),
                  ).map((field) => (
                    <div key={field.key}>
                      <Label htmlFor={`pay-${field.key}`} className="text-xs">
                        <span className="mr-1">{field.icon}</span>
                        {field.label}
                      </Label>
                      <Input
                        id={`pay-${field.key}`}
                        value={payConfig[field.key] as string}
                        onChange={(e) =>
                          handleConfigChange(field.key, e.target.value)
                        }
                        placeholder={field.placeholder}
                        className="mt-1"
                        data-ocid={`qr_menu.payment.${field.key}.input`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Crypto section */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Bitcoin className="w-3.5 h-3.5 text-primary" /> Crypto
                  Wallets
                </p>
                <div className="space-y-3">
                  {PAYMENT_FIELDS.filter((f) =>
                    [
                      "btcAddress",
                      "ethAddress",
                      "solAddress",
                      "bnbAddress",
                      "usdcAddress",
                      "baseAddress",
                      "usdtAddress",
                    ].includes(f.key),
                  ).map((field) => (
                    <div key={field.key}>
                      <Label htmlFor={`pay-${field.key}`} className="text-xs">
                        <span className="mr-1">{field.icon}</span>
                        {field.label}
                      </Label>
                      <Input
                        id={`pay-${field.key}`}
                        value={payConfig[field.key] as string}
                        onChange={(e) =>
                          handleConfigChange(field.key, e.target.value)
                        }
                        placeholder={field.placeholder}
                        className="mt-1 font-mono text-xs"
                        data-ocid={`qr_menu.payment.${field.key}.input`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => saveConfigMutation.mutate(payConfig)}
                disabled={saveConfigMutation.isPending}
                className="w-full mt-2"
                data-ocid="qr_menu.payment_settings.save_button"
              >
                {saveConfigMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Bank & Crypto Settings"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Passenger Orders */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" /> Passenger Orders
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Orders submitted by passengers after scanning your QR code.
          </p>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : !orders || orders.length === 0 ? (
            <div
              className="text-center py-8"
              data-ocid="qr_menu.orders.empty_state"
            >
              <Receipt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                No passenger orders yet. Share your QR code to start receiving
                orders.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order, idx) => (
                <div
                  key={order.orderId}
                  className="rounded-xl border border-border p-4"
                  data-ocid={`qr_menu.orders.item.${idx + 1}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {formatOrderDate(order.timestamp)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {order.paymentMethod.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="font-bold text-primary text-sm mt-1">
                        R{order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-destructive hover:bg-destructive/10 h-8 w-8"
                          data-ocid={`qr_menu.orders.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent data-ocid="qr_menu.orders.delete.dialog">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Order?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this passenger order.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-ocid="qr_menu.orders.delete.cancel_button">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              deleteOrderMutation.mutate(order.orderId)
                            }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            data-ocid="qr_menu.orders.delete.confirm_button"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div
                        key={`${item.productName}-${item.unitPrice}`}
                        className="flex justify-between text-xs text-muted-foreground"
                      >
                        <span>
                          {item.productName} x {Number(item.quantity)}
                        </span>
                        <span className="font-medium text-foreground">
                          R{(item.unitPrice * Number(item.quantity)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {order.passengerNote && (
                    <p className="text-xs text-muted-foreground mt-2 italic border-t border-border pt-2">
                      Note: {order.passengerNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-4 rounded-xl bg-muted/40 border border-border p-3 text-center">
        <p className="text-[11px] text-muted-foreground">
          Bank transfers use South African EFT. <strong>FAIS:</strong> Not
          financial advice. <strong>POPIA:</strong> Your data is protected.
        </p>
      </div>
    </div>
  );
}
