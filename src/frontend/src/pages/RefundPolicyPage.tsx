import { ArrowLeft, RefreshCcw } from "lucide-react";

export default function RefundPolicyPage() {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.08 0.01 85)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3 border-b"
        style={{
          background: "rgba(12,14,20,0.95)",
          borderColor: "oklch(0.22 0.02 85)",
          backdropFilter: "blur(10px)",
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
          style={{
            background: "oklch(0.15 0.01 85)",
            color: "oklch(0.65 0.03 85)",
          }}
          aria-label="Go back"
          data-ocid="refund.back.button"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "oklch(0.75 0.12 85)",
              color: "oklch(0.08 0.01 85)",
            }}
          >
            <RefreshCcw className="w-4 h-4" />
          </div>
          <div>
            <p
              className="font-bold text-sm"
              style={{ color: "oklch(0.75 0.12 85)" }}
            >
              MoneyDrive
            </p>
            <p
              className="text-xs leading-none"
              style={{ color: "oklch(0.65 0.03 85)" }}
            >
              Refund &amp; Returns Policy
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-10 pb-16">
        <div className="mb-8">
          <h1
            className="text-3xl font-extrabold mb-2"
            style={{
              color: "oklch(0.96 0.005 85)",
              fontFamily: "BricolageGrotesque, sans-serif",
            }}
          >
            Refund &amp; Returns Policy
          </h1>
          <p style={{ color: "oklch(0.65 0.03 85)" }} className="text-sm">
            Last updated: April 2026 · MoneyDrive, South Africa
          </p>
          <div
            className="mt-4 rounded-xl p-4 text-sm"
            style={{
              background: "rgba(212,175,55,0.08)",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "oklch(0.75 0.12 85)",
            }}
          >
            We want you to be happy driving with MoneyDrive. If something went
            wrong, here's exactly how we handle refunds — plain and simple.
          </div>
        </div>

        <div className="space-y-8">
          <Section title="1. Subscription Refunds — 14-Day Window">
            <p>
              MoneyDrive offers a <strong>14-day money-back guarantee</strong>{" "}
              on paid subscriptions for first-time subscribers. If you are not
              satisfied within 14 days of your first payment, you may request a
              full refund.
            </p>
            <div className="mt-3 space-y-2">
              <RefundBox
                tier="Pro Driver — R530/month"
                eligible="Yes — full refund within 14 days of first purchase"
                note="Monthly renewals are not eligible for refunds. Cancel before renewal to avoid being charged."
              />
              <RefundBox
                tier="Elite Driver — R800/month"
                eligible="Yes — full refund within 14 days of first purchase"
                note="Monthly renewals are not eligible for refunds. Cancel before renewal to avoid being charged."
              />
              <RefundBox
                tier="Hustler (Free)"
                eligible="Not applicable — no charge"
                note="The Hustler plan is free and requires no payment."
              />
            </div>
          </Section>

          <Section title="2. How Stripe Processes Subscription Refunds">
            <p>
              All subscription payments are processed by{" "}
              <strong>Stripe, Inc.</strong> Refunds are credited back to the
              original payment method.
            </p>
            <ul className="mt-2 space-y-1">
              <li>
                Refund requests are reviewed within{" "}
                <strong>5 business days</strong>
              </li>
              <li>
                Once approved, Stripe typically processes the refund within 5–10
                business days depending on your bank
              </li>
              <li>
                Refunds are issued in South African Rand (ZAR) to the original
                card or payment method
              </li>
              <li>
                We cannot refund to a different card or bank account than the
                one used for purchase
              </li>
            </ul>
            <p
              className="mt-3 text-xs"
              style={{ color: "oklch(0.55 0.02 85)" }}
            >
              By subscribing, you also agree to Stripe's terms of service at
              stripe.com/za/legal.
            </p>
          </Section>

          <Section title="3. SnapScan Passenger Payments">
            <p>
              SnapScan payments made by passengers via the QR menu flow{" "}
              <strong>directly</strong> between the passenger and the driver's
              SnapScan merchant account. MoneyDrive does not hold, process, or
              receive these funds.
            </p>
            <p className="mt-3">
              Drivers who receive SnapScan payments and believe there is a
              dispute must:
            </p>
            <ul className="mt-2 space-y-1">
              <li>
                Log in to their SnapScan merchant portal to confirm or dispute
                transactions
              </li>
              <li>
                Contact SnapScan support directly at support@snapscan.io for
                unresolved disputes
              </li>
              <li>
                MoneyDrive cannot intervene in or reverse SnapScan transactions
              </li>
            </ul>
          </Section>

          <Section title="4. Cryptocurrency Payments — No Refunds Possible">
            <p>
              Cryptocurrency transactions (Bitcoin, Ethereum, Solana, BNB, USDC,
              Base, USDT) are processed <strong>on-chain</strong> and are{" "}
              <strong>irreversible by design</strong>.
            </p>
            <p className="mt-3">
              MoneyDrive has no access to your crypto wallets and cannot
              reverse, cancel, or refund any on-chain transaction. If a
              passenger sends crypto to the wrong address or sends an incorrect
              amount, MoneyDrive is not able to assist. Drivers and passengers
              must verify all wallet addresses carefully before sending.
            </p>
            <p className="mt-3">
              <strong>
                No refunds are available for cryptocurrency payments.
              </strong>
            </p>
          </Section>

          <Section title="5. ICP Staking — Cannot Be Reversed">
            <p>
              The ICP staking feature is educational and informational. If you
              choose to stake ICP tokens via the NNS (Network Nervous System),
              you are interacting directly with the Internet Computer protocol.
            </p>
            <p className="mt-3">
              <strong>
                Locked neurons cannot be dissolved before their dissolve delay
                expires.
              </strong>{" "}
              MoneyDrive cannot unlock staked ICP, reverse staking transactions,
              or issue any refunds related to ICP staking. You take full
              responsibility for staking decisions made using information in
              this app.
            </p>
          </Section>

          <Section title="6. Denied Refund Scenarios">
            <p>Refunds will not be issued in the following circumstances:</p>
            <ul className="mt-2 space-y-1">
              <li>
                <strong>Fraud or misuse</strong> — accounts suspended for policy
                violations
              </li>
              <li>
                <strong>Requests after 14 days</strong> — beyond the refund
                window for initial subscriptions
              </li>
              <li>
                <strong>Renewal charges</strong> — recurring monthly
                subscription renewals
              </li>
              <li>
                <strong>Cryptocurrency transactions</strong> — irreversible by
                nature
              </li>
              <li>
                <strong>Downgrade requests</strong> — switching from a higher to
                a lower plan does not generate a partial refund for unused days
              </li>
              <li>
                <strong>Feature dissatisfaction after 14 days</strong> — we
                encourage you to review features on the free Hustler plan before
                upgrading
              </li>
            </ul>
          </Section>

          <Section title="7. How to Request a Refund">
            <p>
              To request a refund within the 14-day window, contact us through
              the in-app support channel in Settings. Please include:
            </p>
            <ul className="mt-2 space-y-1">
              <li>Your MoneyDrive display name or principal ID</li>
              <li>
                The subscription tier purchased (Pro Driver or Elite Driver)
              </li>
              <li>The date of purchase</li>
              <li>The reason for your refund request</li>
            </ul>
            <p className="mt-3">
              We aim to respond to all refund requests within{" "}
              <strong>5 business days (Monday to Friday, SAST)</strong>. If
              approved, the Stripe refund will be processed shortly after
              approval.
            </p>
            <div
              className="mt-3 rounded-xl p-3 text-sm"
              style={{
                background: "oklch(0.12 0.01 85)",
                border: "1px solid oklch(0.22 0.02 85)",
              }}
            >
              <p style={{ color: "oklch(0.65 0.03 85)" }}>
                <strong style={{ color: "oklch(0.96 0.005 85)" }}>
                  Pro tip:
                </strong>{" "}
                You can avoid being charged by cancelling your subscription
                before the monthly renewal date. Downgrading to the free Hustler
                plan takes effect immediately.
              </p>
            </div>
          </Section>

          <Section title="8. Consumer Rights (SA)">
            <p>
              South African consumers are protected under the Consumer
              Protection Act (CPA), Act 68 of 2008. This policy is designed to
              be consistent with your rights under the CPA.
            </p>
            <p className="mt-3">
              If you believe your refund request was unfairly denied, you may
              escalate to the National Consumer Commission (NCC) at ncc.gov.za
              or contact the Consumer Goods and Services Ombud.
            </p>
          </Section>
        </div>

        {/* Navigation */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <a
            href="/terms"
            className="text-sm underline transition-opacity hover:opacity-70"
            style={{ color: "oklch(0.75 0.12 85)" }}
            data-ocid="refund.terms.link"
          >
            View Terms &amp; Conditions →
          </a>
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: "oklch(0.65 0.03 85)" }}
            data-ocid="refund.back_bottom.button"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <p
          className="text-center text-xs mt-8"
          style={{ color: "oklch(0.45 0.02 85)" }}
        >
          &copy; {new Date().getFullYear()} MoneyDrive. All rights reserved.
        </p>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="text-lg font-bold mb-3"
        style={{
          color: "oklch(0.75 0.12 85)",
          fontFamily: "BricolageGrotesque, sans-serif",
        }}
      >
        {title}
      </h2>
      <div
        className="text-sm leading-relaxed"
        style={{ color: "oklch(0.75 0.03 85)" }}
      >
        {children}
      </div>
    </div>
  );
}

function RefundBox({
  tier,
  eligible,
  note,
}: {
  tier: string;
  eligible: string;
  note: string;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: "oklch(0.12 0.01 85)",
        border: "1px solid oklch(0.22 0.02 85)",
      }}
    >
      <p
        className="font-semibold text-sm mb-0.5"
        style={{ color: "oklch(0.96 0.005 85)" }}
      >
        {tier}
      </p>
      <p
        className="text-xs font-medium mb-1"
        style={{ color: "oklch(0.75 0.12 85)" }}
      >
        {eligible}
      </p>
      <p className="text-xs" style={{ color: "oklch(0.55 0.02 85)" }}>
        {note}
      </p>
    </div>
  );
}
