import { createFileRoute, Link } from "@tanstack/react-router";
import { Brand } from "@/components/brand";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions — Medipost AI" }] }),
  component: Terms,
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

function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <Brand to="/" />
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground">Terms & Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <strong>Last Updated:</strong> July 30, 2026 &nbsp;|&nbsp; <strong>Effective Date:</strong> July 30, 2026
        </p>

        <Section title="1. Introduction & Acceptance of Terms">
          <p>
            These Terms and Conditions form a legally binding agreement between you (User) and Medipost AI governing your access to and use of the Medipost AI application, website, and related services.
          </p>
          <p>
            By downloading, accessing, registering for, or using the Service, you confirm that you have read, understood, and agree to be bound by these Terms and by our{" "}
            <Link to="/privacy-policy" className="text-primary underline">Privacy Policy</Link>, which is incorporated by reference.{" "}
            <strong className="text-foreground">If you do not agree to these Terms, do not access or use the Service.</strong>
          </p>
        </Section>

        <Section title="2. Definitions">
          <Ul items={[
            '"Service" — the Medipost AI application, website, features, tools, and content-generation functionality.',
            '"User / Account Holder" — any individual or entity that registers for or uses the Service.',
            '"User Content" — any topics, prompts, tone preferences, text, images, or other materials you submit.',
            '"Generated Content" — social media posts, carousels, reels, blogs, and other output produced by the Service.',
            '"Subscription" — a paid plan providing access to specific features of the Service.',
            '"AI" — the artificial-intelligence models and systems used to generate content.',
          ]} />
        </Section>

        <Section title="3. Eligibility & Account Responsibilities">
          <SubSection title="3.1 Eligibility">
            <p>You must be at least 18 years old and capable of entering into a binding contract. The Service is intended for healthcare professionals, businesses, and marketers.</p>
          </SubSection>
          <SubSection title="3.2 Account Registration">
            <p>To use certain features, you must create an account and provide accurate, current, and complete information. You agree to keep your information updated.</p>
          </SubSection>
          <SubSection title="3.3 Account Security">
            <p>You are responsible for maintaining the confidentiality of your login credentials, all activity under your account, and notifying us immediately of any unauthorized use.</p>
          </SubSection>
        </Section>

        <Section title="4. Description of the Service">
          <p>
            Medipost AI is an AI-powered platform that helps healthcare professionals and marketers create social media posts, carousels, reels, blogs, and patient-education materials.
          </p>
          <p className="font-medium text-foreground">
            The Service is a content-creation and marketing tool only. It does not provide medical, clinical, diagnostic, legal, or professional advice, and is not a substitute for the professional judgment of a qualified healthcare provider.
          </p>
          <p>We may modify, enhance, suspend, or discontinue any part of the Service at any time, with or without notice.</p>
        </Section>

        <Section title="5. User Obligations & Acceptable Use Policy">
          <p>You agree to use the Service lawfully and responsibly. You must not:</p>
          <Ul items={[
            "Enter identifiable patient information or protected health information (PHI).",
            "Use the Service to create false, misleading, defamatory, or fraudulent content.",
            "Publish Generated Content that violates medical-advertising rules or professional-conduct standards.",
            "Upload content that infringes intellectual property, privacy, or publicity rights of others.",
            "Attempt to reverse-engineer, decompile, scrape, or gain unauthorized access to the Service.",
            "Introduce malware, disrupt the Service, or circumvent security or usage limits.",
            "Resell, sublicense, or commercially exploit the Service except as expressly permitted.",
          ]} />
          <p>You are solely responsible for the accuracy, legality, and appropriateness of your User Content and for reviewing all Generated Content before publishing.</p>
        </Section>

        <Section title="6. Intellectual Property Rights">
          <SubSection title="6.1 Our Intellectual Property">
            <p>The Service — including its software, design, branding, logos, trademarks, and underlying technology — is owned by us or our licensors. We grant you a limited, non-exclusive, non-transferable, revocable license to use the Service in accordance with these Terms.</p>
          </SubSection>
          <SubSection title="6.2 Your User Content">
            <p>You retain ownership of your User Content. By submitting it, you grant us a worldwide, non-exclusive, royalty-free license to use, process, store, and display it solely to operate and provide the Service to you.</p>
          </SubSection>
          <SubSection title="6.3 Generated Content">
            <p>Subject to your compliance with these Terms and payment of applicable fees, we assign to you the rights we hold in the Generated Content for your business and marketing purposes.</p>
            <Ul items={[
              "AI-generated content may not be unique, and similar content may be generated for other users.",
              "The legal status and copyrightability of AI-generated content varies by jurisdiction.",
              "You are responsible for reviewing Generated Content for accuracy, originality, and compliance before use.",
            ]} />
          </SubSection>
        </Section>

        <Section title="7. Payment Terms, Subscriptions & Refunds">
          <SubSection title="7.1 Fees & Subscriptions">
            <p>Certain features require a paid Subscription. Pricing, billing cycles, and features are described at the point of purchase. Subscriptions may auto-renew unless cancelled before the renewal date.</p>
          </SubSection>
          <SubSection title="7.2 Payment Processing">
            <p>Payments are processed by third-party providers (including, where applicable, UPI/Google Play Billing). By subscribing, you authorize the applicable charges.</p>
          </SubSection>
          <SubSection title="7.3 Auto-Renewal & Cancellation">
            <p>You may cancel at any time before the next billing date through your account settings or the relevant app store. Cancellation stops future charges; access continues until the end of the current billing period.</p>
          </SubSection>
          <SubSection title="7.4 Refunds">
            <p>Except where required by law or by the applicable app-store policy, fees are non-refundable. See our full{" "}
              <Link to="/refund-policy" className="text-primary underline">Refund Policy</Link> for details. To request a refund where eligible, contact <a href="mailto:office@sayitdoc.com" className="text-primary underline">office@sayitdoc.com</a>.
            </p>
          </SubSection>
          <SubSection title="7.5 Price Changes">
            <p>We may change prices with reasonable advance notice. Changes apply to subsequent billing periods.</p>
          </SubSection>
        </Section>

        <Section title="8. Healthcare Disclaimer & AI Content Disclaimer">
          <p className="font-medium text-foreground">PLEASE READ THIS SECTION CAREFULLY.</p>
          <p><strong className="text-foreground">Not medical advice.</strong> The Service and all Generated Content are for informational, educational, and marketing purposes only. They do not constitute medical, clinical, diagnostic, or professional advice.</p>
          <p><strong className="text-foreground">AI limitations.</strong> Generated Content is produced by AI and may contain inaccuracies, outdated information, errors, or omissions. You must independently review, verify, and edit all Generated Content before publishing or relying on it.</p>
          <p><strong className="text-foreground">Your responsibility.</strong> You are solely responsible for ensuring that any content you publish is accurate, appropriate, and compliant with applicable medical-advertising, professional, and legal standards in your jurisdiction.</p>
        </Section>

        <Section title="9. Data Usage & Privacy">
          <p>Your use of the Service is governed by our <Link to="/privacy-policy" className="text-primary underline">Privacy Policy</Link>. By using the Service, you consent to the practices described therein. You must not submit identifiable patient health information to the Service.</p>
        </Section>

        <Section title="10. Disclaimers & Limitation of Liability">
          <SubSection title="10.1 As Is Disclaimer">
            <p>The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, or uninterrupted availability.</p>
          </SubSection>
          <SubSection title="10.2 Limitation of Liability">
            <p>To the maximum extent permitted by law, our total aggregate liability shall not exceed the greater of (a) the amount you paid to us in the six (6) months preceding the claim, or (b) INR 3,000.</p>
          </SubSection>
          <SubSection title="10.3 Indemnification">
            <p>You agree to indemnify and hold harmless Medipost AI and its affiliates from any claims, damages, liabilities, and expenses arising from your User Content, Generated Content, use of the Service, or violation of these Terms.</p>
          </SubSection>
        </Section>

        <Section title="11. Third-Party Services & Links">
          <p>The Service may integrate with third-party services (e.g., AI providers, cloud hosting, payment processors, social-media platforms). We are not responsible for third-party services; your use of them is governed by their own terms and privacy policies.</p>
        </Section>

        <Section title="12. Termination & Suspension">
          <p>We may suspend or terminate your access if you violate these Terms, engage in unlawful activity, or create risk or legal exposure for us or other users. Upon termination, your right to use the Service ends.</p>
        </Section>

        <Section title="13. Google Play Store Compliance">
          <p>Your use of the Service through Google Play is also subject to the Google Play Terms of Service. These Terms are between you and us — not Google — and Google is not responsible for the Service or its support.</p>
        </Section>

        <Section title="14. Governing Law & Dispute Resolution">
          <p>These Terms are governed by the laws of India. Any disputes shall first be attempted to be resolved amicably; if unresolved, they shall be subject to the exclusive jurisdiction of the courts of Ahmedabad, Gujarat, India.</p>
        </Section>

        <Section title="15. Modifications to the Terms">
          <p>We may update these Terms from time to time. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.</p>
        </Section>

        <Section title="16. Contact Us">
          <p>
            <strong className="text-foreground">Medipost AI (SID Clinic Pvt. Ltd.)</strong><br />
            Email: <a href="mailto:office@sayitdoc.com" className="text-primary underline">office@sayitdoc.com</a><br />
            Address: HRF Incubation Centre, Shela Off, Sardar Patel Ring Rd, Opp. Vraj Gardens, Ahmedabad, Gujarat 380057
          </p>
        </Section>

        <div className="mt-12 pt-6 border-t border-border flex gap-4 text-xs text-muted-foreground">
          <Link to="/privacy-policy" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/refund-policy" className="hover:text-foreground">Refund Policy</Link>
          <Link to="/" className="hover:text-foreground">Home</Link>
        </div>
      </main>
    </div>
  );
}