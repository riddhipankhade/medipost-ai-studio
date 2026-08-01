import { createFileRoute, Link } from "@tanstack/react-router";
import { Brand } from "@/components/brand";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({ meta: [{ title: "Refund Policy — Medipost AI" }] }),
  component: RefundPolicy,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground mb-3">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-1 pl-2">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <Brand to="/" />
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground">Refund Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <strong>Last Updated:</strong> July 30, 2026 &nbsp;|&nbsp; <strong>Effective Date:</strong> July 30, 2026
        </p>

        <Section title="1. Introduction">
          <p>
            This Refund Policy explains the billing, cancellation, and refund practices for the Medipost AI application and related services, operated by Medipost AI (SID Clinic Pvt. Ltd.). Medipost AI is a subscription-based, AI-powered platform that helps healthcare professionals and marketers create digital content.
          </p>
          <p>
            By subscribing to or purchasing any paid plan, you agree to this Refund Policy, which forms part of our{" "}
            <Link to="/terms" className="text-primary underline">Terms and Conditions</Link>.
          </p>
        </Section>

        <Section title="2. Subscription & Billing Terms">
          <SubSection title="2.1 Subscription Plans">
            <p>Access to certain features requires a paid subscription. The available plans, prices, features, and billing cycles are shown at the point of purchase.</p>
          </SubSection>
          <SubSection title="2.2 Auto-Debit & Recurring Billing">
            <p>Our subscriptions operate on an automatic recurring-billing (auto-debit) basis:</p>
            <Ul items={[
              "When you subscribe, you authorize us and our payment providers to automatically charge your selected payment method at the start of each billing cycle.",
              "Your subscription renews automatically at the end of each cycle at the then-current price, unless you cancel before the renewal date.",
              "You will continue to be charged until you cancel.",
            ]} />
          </SubSection>
          <SubSection title="2.3 Your Consent">
            <p>By subscribing, you expressly consent to recurring charges. We will make the renewal terms and pricing clear before you confirm your purchase.</p>
          </SubSection>
          <SubSection title="2.4 Price Changes">
            <p>We may change subscription prices with reasonable advance notice. Any change will apply only to future billing cycles.</p>
          </SubSection>
        </Section>

        <Section title="3. No-Refund Policy">
          <p>
            Because Medipost AI provides <strong className="text-foreground">digital, non-tangible services that are delivered and consumed immediately</strong>, all payments and subscription fees are generally non-refundable, except as expressly stated in Section 4 or as required by applicable law.
          </p>
          <Ul items={[
            "Fees already paid for a billing cycle are non-refundable, even if you do not use the Service or use it only partially.",
            "Cancelling a subscription stops future charges but does not refund the current or past billing periods.",
            "Refunds are not provided for dissatisfaction with AI-generated output, change of mind, or failure to cancel before renewal.",
          ]} />
          <p>
            Each time you use the Service, computational and AI-processing resources are consumed in real time. Because these digital services are rendered immediately and cannot be "returned," we operate on a no-refund basis apart from the verified exceptions below.
          </p>
        </Section>

        <Section title="4. Exceptions — When Refunds May Be Granted">
          <p>We may, at our discretion and after verification, provide a refund or credit in the following cases:</p>
          <SubSection title="4.1 Verified Technical Failure">
            <p>A confirmed technical fault on our side that prevented you from accessing or using the core Service for a significant period, where we were unable to resolve it within a reasonable time.</p>
          </SubSection>
          <SubSection title="4.2 Duplicate or Double Charges">
            <p>You were charged more than once for the same subscription or transaction due to a billing error.</p>
          </SubSection>
          <SubSection title="4.3 Billing / System Errors">
            <p>You were charged an incorrect amount, or a charge occurred due to a verified system error on our side.</p>
          </SubSection>
          <SubSection title="4.4 Unauthorized Charges">
            <p>A charge was made without authorization due to a proven fault in our billing system (subject to investigation and verification).</p>
          </SubSection>
          <p className="font-medium text-foreground">Not covered by these exceptions:</p>
          <Ul items={[
            "Dissatisfaction with the quality, tone, accuracy, or style of AI-generated content",
            "Failure to cancel before an auto-renewal",
            "Change of mind or no longer needing the Service",
            "Issues caused by your device, network, or third-party platforms",
            "Violations of our Terms resulting in suspension or termination",
          ]} />
        </Section>

        <Section title="5. Refund Request Process & Timelines">
          <p>If you believe you qualify for a refund under Section 4:</p>
          <Ul items={[
            "Submit a request to office@sayitdoc.com within 7 days of the charge.",
            "Include: your account email, transaction ID / order number, date and amount of the charge, and a clear description of the issue (with screenshots if possible).",
            "We will review and may request additional information to verify the issue.",
            "We aim to respond within 5–7 business days of receiving all required information.",
            "If approved, refunds are issued to your original payment method and typically take 5–10 business days to process.",
          ]} />
          <p>
            <strong className="text-foreground">Purchases made through Google Play:</strong> Refunds for subscriptions purchased via Google Play are subject to Google's refund policies and may need to be requested directly through Google Play.
          </p>
        </Section>

        <Section title="6. Cancellation Policy">
          <SubSection title="6.1 If You Subscribed Through Google Play">
            <p>Manage or cancel via: Google Play Store → Profile → Payments & subscriptions → Subscriptions → Medipost AI → Cancel subscription.</p>
          </SubSection>
          <SubSection title="6.2 If You Subscribed Directly (Web/App)">
            <p>Cancel via your account settings in the Service, or contact <a href="mailto:office@sayitdoc.com" className="text-primary underline">office@sayitdoc.com</a>.</p>
          </SubSection>
          <SubSection title="6.3 Effect of Cancellation">
            <Ul items={[
              "Cancellation stops the next and all future charges.",
              "You will retain access to paid features until the end of your current billing period.",
              "Cancelling does not automatically refund the current period.",
              "We recommend cancelling at least 24 hours before your renewal date.",
            ]} />
          </SubSection>
        </Section>

        <Section title="7. Digital & AI Service Disclaimer">
          <p>Medipost AI delivers digital, AI-generated services and content — an intangible product. You acknowledge that:</p>
          <Ul items={[
            "The Service is provided and consumed electronically and in real time.",
            "AI-generated content may vary in quality and may not be unique; this variability is inherent to AI services and is not grounds for a refund.",
            "You are responsible for reviewing all generated content before use.",
            "No physical goods are shipped, and standard 'return of goods' concepts do not apply.",
          ]} />
        </Section>

        <Section title="8. Compliance with App-Store & Consumer Laws">
          <p>
            This Refund Policy is designed to comply with UPI/Google Play billing and refund guidelines and applicable app-store policies. Nothing in this Refund Policy limits any non-waivable statutory rights you may have under consumer-protection laws in your country.
          </p>
        </Section>

        <Section title="9. Contact & Support for Billing Issues">
          <p>
            <strong className="text-foreground">SID Clinic Pvt. Ltd.</strong><br />
            Billing / Support Email: <a href="mailto:office@sayitdoc.com" className="text-primary underline">office@sayitdoc.com</a><br />
            Support Hours: Monday–Friday, 10:00 AM–6:00 PM IST
          </p>
        </Section>

        <Section title="10. Changes to This Refund Policy">
          <p>We may update this Refund Policy from time to time. Material changes will be reflected in the "Last Updated" date. Continued use of the Service after changes take effect constitutes acceptance of the updated policy.</p>
        </Section>

        <div className="mt-12 pt-6 border-t border-border flex gap-4 text-xs text-muted-foreground">
          <Link to="/privacy-policy" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms & Conditions</Link>
          <Link to="/" className="hover:text-foreground">Home</Link>
        </div>
      </main>
    </div>
  );
}