import { createFileRoute, Link } from "@tanstack/react-router";
import { Brand } from "@/components/brand";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Medipost AI" }] }),
  component: PrivacyPolicy,
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

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <Brand to="/" />
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <strong>Last Updated:</strong> July 30, 2026 &nbsp;|&nbsp; <strong>Effective Date:</strong> July 30, 2026
        </p>

        <Section title="1. Introduction">
          <p>
            This Privacy Policy explains how Medipost AI (SID Clinic Pvt. Ltd.) collects, uses, stores, shares, and protects information when you use the Medipost AI application and related website, services, and features (collectively, the "Service").
          </p>
          <p>
            Medipost AI is an artificial-intelligence platform that helps healthcare professionals — including doctors, clinics, hospitals, and healthcare marketers — create social media and educational content such as posts, carousels, reels, blogs, and patient-education materials.
          </p>
          <p>
            We are committed to protecting your privacy and handling your information transparently and responsibly. By downloading, accessing, or using the Service, you agree to the practices described in this Privacy Policy. If you do not agree, please do not use the Service.
          </p>
          <p className="font-medium text-foreground">
            Important — This is not a medical records or clinical service. Medipost AI is a content-creation tool. It is not designed to collect, store, or process individual patient medical records or protected health information (PHI). You must not enter identifiable patient health information into the Service.
          </p>
        </Section>

        <Section title="2. Scope">
          <p>
            This Privacy Policy applies to all users of the Service worldwide. Because Medipost AI is available globally, additional rights and disclosures for specific regions (such as the European Economic Area, the United Kingdom, India, and California) are described in Sections 12–14.
          </p>
        </Section>

        <Section title="3. Information We Collect">
          <SubSection title="3.1 Account & Identity Information">
            <Ul items={["Name of the user", "Email address", "Password (stored in encrypted/hashed form)", "Phone number (if provided)", "Profile photo (if provided)"]} />
          </SubSection>
          <SubSection title="3.2 Professional & Business Information">
            <Ul items={["Clinic, hospital, or practice name", "Doctor or practitioner name", "Medical specialty or area of practice", "Business address, website, and contact details", "Logo, branding assets, and business social-media handles"]} />
          </SubSection>
          <SubSection title="3.3 Content Inputs">
            <Ul items={["Topics, prompts, and instructions", "Tone, style, and language preferences", "Draft text, captions, and notes", "Images or media you upload for use in content"]} />
          </SubSection>
          <SubSection title="3.4 Usage & Technical Data">
            <Ul items={["Device information (model, operating system, unique device identifiers)", "App version and settings", "Log data (access times, features used, actions taken, crash reports)", "Approximate location derived from IP address", "General analytics on how features are used"]} />
          </SubSection>
          <SubSection title="3.5 Payment Information">
            <p>Payment is processed by third-party payment providers. We do not store full card numbers or bank credentials on our servers. We may retain limited billing records (e.g., plan, transaction ID, invoice history).</p>
          </SubSection>
          <SubSection title="3.6 Communications">
            <p>Records of your correspondence with our support or sales teams, including feedback and inquiries.</p>
          </SubSection>
        </Section>

        <Section title="4. How We Use Your Information">
          <Ul items={[
            "Provide the core service — generate posts, carousels, reels, blogs, and educational content based on your inputs.",
            "Personalize your experience — remember your preferences, tone, branding, and past content.",
            "Operate and maintain your account — authentication, subscription management, and support.",
            "Process payments and manage billing.",
            "Improve the Service — analyze usage, fix bugs, develop new features.",
            "Communicate with you — respond to inquiries and send service-related notices.",
            "Ensure security and prevent misuse — detect fraud, abuse, and violations of our Terms.",
            "Comply with legal obligations and enforce our agreements.",
          ]} />
          <SubSection title="4.1 AI Model Training">
            <p>We do <strong>not</strong> use your content inputs to train our own or third-party foundational AI models. Your inputs are used only to generate your requested output and to operate the Service.</p>
          </SubSection>
        </Section>

        <Section title="5. Legal Bases for Processing (EEA / UK Users)">
          <Ul items={[
            "Performance of a contract — to provide the Service you request.",
            "Consent — for optional features, marketing, or non-essential cookies.",
            "Legitimate interests — to improve, secure, and maintain the Service.",
            "Legal obligation — to comply with applicable laws.",
          ]} />
        </Section>

        <Section title="6. Data Storage, Security & Retention">
          <SubSection title="6.1 Storage">
            <p>Your data is stored on secure servers operated by us and/or our cloud infrastructure providers.</p>
          </SubSection>
          <SubSection title="6.2 Security Measures">
            <Ul items={[
              "Encryption of data in transit (TLS/HTTPS) and at rest where applicable",
              "Hashed and salted password storage",
              "Access controls and authentication for internal systems",
              "Regular security reviews and monitoring",
              "Restricted employee access on a need-to-know basis",
            ]} />
          </SubSection>
          <SubSection title="6.3 Retention">
            <Ul items={[
              "Account data — retained while your account is active.",
              "Content and inputs — retained until you delete them or close your account.",
              "Billing records — retained as required by tax and accounting laws.",
              "Logs and analytics — retained for a limited period, then deleted or anonymized.",
            ]} />
          </SubSection>
        </Section>

        <Section title="7. Third-Party Services & Integrations">
          <p>To operate the Service, we work with trusted third-party providers in the following categories:</p>
          <Ul items={[
            "AI / model providers — Content generation (e.g., Google Gemini, Cloudflare AI)",
            "Cloud hosting & storage — Running the Service (e.g., Vercel, Supabase)",
            "Analytics — Usage insights & crash reporting",
            "Payment processing — Billing (e.g., PayU, Google Play Billing)",
            "Communications — Email / support (e.g., Resend)",
          ]} />
        </Section>

        <Section title="8. Your Rights & Choices">
          <Ul items={[
            "Access the personal data we hold about you",
            "Correct inaccurate or incomplete data",
            "Delete your data ("right to erasure")",
            "Restrict or object to certain processing",
            "Data portability — receive your data in a portable format",
            "Withdraw consent at any time",
            "Opt out of marketing communications",
            "Lodge a complaint with a data-protection authority",
          ]} />
          <p>Contact us at <a href="mailto:office@sayitdoc.com" className="text-primary underline">office@sayitdoc.com</a> to exercise these rights.</p>
        </Section>

        <Section title="9. Healthcare Data & Prohibited Content">
          <p>Medipost AI is a marketing and content-creation tool, not a clinical, diagnostic, or medical-records system.</p>
          <p className="font-medium text-foreground">Do not enter identifiable patient information — including patient names, contact details, medical record numbers, images that identify a patient, or individual diagnoses, treatments, or health conditions.</p>
          <p>The Service is not intended to be a HIPAA-covered service, and we do not enter into Business Associate Agreements unless separately agreed in writing.</p>
        </Section>

        <Section title="10. Cookies & Tracking Technologies">
          <p>Our website and app may use cookies and similar technologies to keep you signed in, remember preferences, understand usage, and provide analytics. You can control cookies through your browser or device settings.</p>
        </Section>

        <Section title="11. Data Sharing & Disclosure">
          <p>We do <strong>not</strong> sell your personal information. We may share information only in the following circumstances:</p>
          <Ul items={[
            "With service providers who process data on our behalf.",
            "With your consent or at your direction.",
            "For legal reasons — to comply with law or valid government requests.",
            "To protect rights and safety — to prevent fraud or harm.",
            "In a business transfer — in connection with a merger, acquisition, or sale of assets.",
            "Aggregated or de-identified data that cannot reasonably identify you.",
          ]} />
        </Section>

        <Section title="12. Children's Privacy">
          <p>The Service is intended for healthcare professionals and business users and is not directed to children under the age of 18. We do not knowingly collect personal data from children. If you believe a child has provided us personal information, please contact us and we will delete it promptly.</p>
        </Section>

        <Section title="13. International Data Transfers">
          <p>Your information may be transferred to, stored in, and processed in countries other than your own. Where we transfer personal data from the EEA, UK, or other regulated regions, we use Standard Contractual Clauses or other lawful transfer mechanisms.</p>
        </Section>

        <Section title="14. Regional Privacy Disclosures">
          <SubSection title="14.1 EEA & United Kingdom (GDPR / UK GDPR)">
            <p>You have the rights described in Section 8 and may lodge a complaint with your local supervisory authority.</p>
          </SubSection>
          <SubSection title="14.2 India (Digital Personal Data Protection Act, 2023)">
            <p>We process personal data lawfully for specified purposes, obtain consent where required, and honor your rights to access, correction, and erasure. Contact: <a href="mailto:office@sayitdoc.com" className="text-primary underline">office@sayitdoc.com</a>.</p>
          </SubSection>
          <SubSection title="14.3 California (CCPA/CPRA)">
            <p>California residents have the right to know, delete, and correct personal information, and to opt out of "sale" or "sharing." We do not sell personal information. Contact: <a href="mailto:office@sayitdoc.com" className="text-primary underline">office@sayitdoc.com</a>.</p>
          </SubSection>
        </Section>

        <Section title="15. Google Play & Data Safety">
          <p>Our data-collection and sharing practices are disclosed in the app's Data Safety section on Google Play, reflecting the practices described in this Privacy Policy.</p>
        </Section>

        <Section title="16. Changes to This Privacy Policy">
          <p>We may update this Privacy Policy from time to time. Material changes will be reflected in the "Last Updated" date. Continued use of the Service after changes take effect constitutes acceptance of the updated policy.</p>
        </Section>

        <Section title="17. Contact Us">
          <p>
            <strong className="text-foreground">Medipost AI (SID Clinic Pvt. Ltd.)</strong><br />
            Email: <a href="mailto:office@sayitdoc.com" className="text-primary underline">office@sayitdoc.com</a><br />
            Address: HRF Incubation Centre, Shela Off, Sardar Patel Ring Rd, Opp. Vraj Gardens, Ahmedabad, Gujarat 380057
          </p>
        </Section>

        <div className="mt-12 pt-6 border-t border-border flex gap-4 text-xs text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground">Terms & Conditions</Link>
          <Link to="/refund-policy" className="hover:text-foreground">Refund Policy</Link>
          <Link to="/" className="hover:text-foreground">Home</Link>
        </div>
      </main>
    </div>
  );
}
