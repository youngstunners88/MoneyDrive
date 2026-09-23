import { ArrowLeft, Scale } from "lucide-react";

export default function TermsPage() {
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
          data-ocid="terms.back.button"
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
            <Scale className="w-4 h-4" />
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
              Terms &amp; Conditions
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
            Terms &amp; Conditions
          </h1>
          <p style={{ color: "oklch(0.65 0.03 85)" }} className="text-sm">
            Last updated: April 2026 · Effective immediately
          </p>
          <div
            className="mt-4 rounded-xl p-4 text-sm"
            style={{
              background: "rgba(212,175,55,0.08)",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "oklch(0.75 0.12 85)",
            }}
          >
            Please read these Terms &amp; Conditions carefully before using
            MoneyDrive. By accessing or using the app, you agree to be bound by
            these terms.
          </div>
        </div>

        <div className="space-y-8">
          <Section title="1. About MoneyDrive">
            <p>
              MoneyDrive is a driver command center application designed for
              independent Uber and Bolt drivers operating primarily in South
              Africa, with global scalability planned. The app provides tools
              for earnings tracking, expense logging, shift scheduling, in-car
              sales management, and driver productivity.
            </p>
            <p className="mt-3">
              MoneyDrive is not affiliated with, endorsed by, or officially
              connected to Uber Technologies Inc. or Bolt Technology OÜ. It is
              an independent third-party productivity tool for drivers who
              operate on those platforms.
            </p>
          </Section>

          <Section title="2. Your Responsibilities as an Independent Contractor">
            <p>
              You acknowledge that you are an independent contractor, not an
              employee of MoneyDrive, Uber, or Bolt. You are solely responsible
              for:
            </p>
            <ul className="mt-2 space-y-1">
              <li>
                Your compliance with all applicable South African laws and
                regulations
              </li>
              <li>Filing and paying your own income tax with SARS</li>
              <li>Maintaining your vehicle, license, insurance, and permits</li>
              <li>Your conduct toward passengers and third parties</li>
              <li>
                Ensuring all earnings you log are accurate for your own records
              </li>
            </ul>
          </Section>

          <Section title="3. Account &amp; Internet Identity">
            <p>
              Authentication is handled exclusively via Internet Identity, a
              decentralized, blockchain-based identity protocol on the Internet
              Computer. We do not collect email addresses or passwords. Your
              identity is cryptographically secured — you are responsible for
              maintaining access to your authentication device (phone/hardware
              key).
            </p>
            <p className="mt-3">
              If you lose access to your Internet Identity anchor, MoneyDrive
              cannot recover your account. We strongly recommend registering
              multiple devices with your Internet Identity anchor.
            </p>
          </Section>

          <Section title="4. Subscription Tiers">
            <p>MoneyDrive offers three subscription tiers:</p>
            <div className="mt-3 space-y-2">
              <TierBox
                name="Hustler — 14-day free trial, then R350/month"
                desc="Core earnings tracking, dashboard, expense logging, voice trial (500 chars/month), event calendar."
              />
              <TierBox
                name="Pro Driver — R530/month"
                desc="All Hustler features plus In-Car Sales, QR Code Menu, shift scheduling, and full AI voice via ElevenLabs (unlimited)."
              />
              <TierBox
                name="Elite Driver — R800/month"
                desc="All Pro features plus Nduna (exclusive), advanced analytics, AI-powered insights, and priority support."
              />
            </div>
            <p className="mt-3">
              Subscription fees are charged in South African Rand (ZAR). Prices
              may change with 30 days' notice. Payments are processed via
              Stripe.
            </p>
          </Section>

          <Section title="5. Payment &amp; Refund Framework">
            <p>
              Subscription payments are processed by Stripe, Inc. on our behalf.
              By subscribing, you agree to Stripe's terms of service. All
              amounts are in ZAR unless stated otherwise.
            </p>
            <p className="mt-3">
              Refunds are governed by our separate{" "}
              <a
                href="/refund"
                style={{ color: "oklch(0.75 0.12 85)" }}
                className="underline"
              >
                Refund &amp; Returns Policy
              </a>
              . The 14-day refund window applies to paid subscriptions only.
            </p>
          </Section>

          <Section title="6. ICP Staking — Educational Disclaimer">
            <p>
              The ICP Staking section of MoneyDrive is provided for{" "}
              <strong>educational purposes only</strong>. It helps drivers
              understand how to acquire and stake ICP tokens on the Internet
              Computer's Network Nervous System (NNS).
            </p>
            <p className="mt-3">
              <strong>This is NOT investment advice.</strong> Cryptocurrency
              values are highly volatile. Staking involves locking up assets for
              extended periods with no guaranteed return. Always conduct your
              own research and consult a qualified financial advisor before
              making any investment decisions. MoneyDrive is not a registered
              financial services provider under the Financial Advisory and
              Intermediary Services Act (FAIS), Act 37 of 2002.
            </p>
          </Section>

          <Section title="7. Cryptocurrency Payments &amp; Volatility Warning">
            <p>
              The Passenger QR Menu supports payments in multiple
              cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), Solana
              (SOL), BNB, USDC, Base (BASE), and USDT.
            </p>
            <p className="mt-3">
              <strong>Cryptocurrency volatility warning:</strong> Crypto values
              can change significantly between the time of order and time of
              receipt. MoneyDrive does not guarantee exchange rates or the value
              of crypto received. Drivers accept all cryptocurrency payment
              risk. On-chain transactions are irreversible once confirmed.
            </p>
          </Section>

          <Section title="8. SnapScan Payments">
            <p>
              The Passenger QR Menu optionally integrates with SnapScan, a South
              African QR payment service operated by SnapScan (Pty) Ltd. When
              enabled, passengers can scan a SnapScan QR code to pay the driver
              directly.
            </p>
            <p className="mt-3">
              MoneyDrive does not process SnapScan transactions — it only
              generates the payment QR code. All funds flow directly between the
              passenger and the driver's SnapScan merchant account. You are
              responsible for maintaining your SnapScan merchant account in
              compliance with SnapScan's terms.
            </p>
          </Section>

          <Section title="9. Passenger QR Menu System">
            <p>
              Drivers may activate a public QR code menu that allows passengers
              to browse products and submit payment requests. By enabling this
              feature, you agree that:
            </p>
            <ul className="mt-2 space-y-1">
              <li>
                Your product listings and prices are accurate and comply with
                all applicable laws
              </li>
              <li>
                You are solely responsible for fulfilling orders received via
                the menu
              </li>
              <li>You will not list illegal, harmful, or prohibited items</li>
              <li>
                Passenger data submitted through the menu is handled in
                accordance with POPIA
              </li>
            </ul>
          </Section>

          <Section title="10. Data &amp; Privacy (POPIA Compliance)">
            <p>
              MoneyDrive is committed to compliance with the Protection of
              Personal Information Act (POPIA), Act 4 of 2013. Your personal
              data — including your display name, earnings records, and trip
              logs — is stored securely on the Internet Computer blockchain.
            </p>
            <p className="mt-3">
              We do not sell your personal data to third parties. API keys
              (ElevenLabs, OpenRouter) entered by administrators are stored
              encrypted and never exposed to end users or remixers.
            </p>
            <p className="mt-3">
              You have the right to request access to, correction of, or
              deletion of your personal data. Contact us through in-app support
              to exercise these rights.
            </p>
          </Section>

          <Section title="11. FAIS Regulatory Context">
            <p>
              MoneyDrive is a <strong>productivity and tracking tool</strong>{" "}
              only. Nothing in this application constitutes financial advice,
              investment recommendations, or financial intermediary services as
              defined by the Financial Advisory and Intermediary Services Act
              (FAIS), Act 37 of 2002.
            </p>
            <p className="mt-3">
              Drivers remain solely responsible for their own tax obligations,
              income declarations to SARS, and any financial decisions made
              using data from this app. Consult a registered financial advisor
              or tax professional for financial guidance.
            </p>
          </Section>

          <Section title="12. FICA — Know Your Customer">
            <p>
              As a driver operating on Uber or Bolt, you may be subject to
              Financial Intelligence Centre Act (FICA) requirements when
              accepting payments, particularly for high-value cryptocurrency
              transactions. Drivers are solely responsible for their own FICA
              compliance obligations.
            </p>
            <p className="mt-3">
              MoneyDrive does not perform KYC verification on drivers or
              passengers and does not act as an accountable institution under
              FICA.
            </p>
          </Section>

          <Section title="13. Limitation of Liability">
            <p>
              To the maximum extent permitted by South African law, MoneyDrive
              and its operators shall not be liable for any direct, indirect,
              incidental, consequential, or punitive damages arising from your
              use of this app, including but not limited to loss of income, data
              loss, or errors in earnings calculations.
            </p>
            <p className="mt-3">
              The app is provided "as is" without warranties of any kind. We do
              not guarantee 100% uptime or error-free operation. Always maintain
              your own records as a backup.
            </p>
          </Section>

          <Section title="14. Changes to These Terms">
            <p>
              We reserve the right to update these Terms &amp; Conditions at any
              time. Material changes will be communicated at least{" "}
              <strong>30 days in advance</strong> through in-app notifications.
              Continued use of MoneyDrive after the effective date of changes
              constitutes acceptance of the updated terms.
            </p>
          </Section>

          <Section title="15. Termination">
            <p>
              You may stop using MoneyDrive at any time. We reserve the right to
              suspend or terminate access to accounts that violate these Terms,
              engage in fraud, or misuse the platform.
            </p>
            <p className="mt-3">
              Upon termination, your data stored on the Internet Computer
              blockchain may remain for a period consistent with our data
              retention policy and blockchain immutability constraints.
            </p>
          </Section>

          <Section title="16. Governing Law">
            <p>
              These Terms are governed by the laws of the Republic of South
              Africa. Any disputes shall be resolved in the courts of South
              Africa.
            </p>
          </Section>
        </div>

        {/* Back to top / navigation */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <a
            href="/refund"
            className="text-sm underline transition-opacity hover:opacity-70"
            style={{ color: "oklch(0.75 0.12 85)" }}
            data-ocid="terms.refund_policy.link"
          >
            View Refund &amp; Returns Policy →
          </a>
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: "oklch(0.65 0.03 85)" }}
            data-ocid="terms.back_bottom.button"
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

function TierBox({ name, desc }: { name: string; desc: string }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: "oklch(0.12 0.01 85)",
        border: "1px solid oklch(0.22 0.02 85)",
      }}
    >
      <p
        className="font-semibold text-sm mb-1"
        style={{ color: "oklch(0.96 0.005 85)" }}
      >
        {name}
      </p>
      <p className="text-xs" style={{ color: "oklch(0.65 0.03 85)" }}>
        {desc}
      </p>
    </div>
  );
}
