// Single source of truth for the Privacy Policy body. Rendered by
// the standalone /privacy page and the in-app legal modal during
// signup. Mirrors the structure of TermsContent.tsx so both pages
// render identically.

export const PRIVACY_LAST_UPDATED = "May 19, 2026";

type ListBlock  = { kind: "list"; items: string[] };
type TextBlock  = { kind: "text"; body: string };
type SubBlock   = { kind: "sub"; title: string };  // sub-heading inside a section
type Block = ListBlock | TextBlock | SubBlock;
type Section = { id: string; n: number | null; title: string; blocks: Block[] };

export const PRIVACY_SECTIONS: Section[] = [
  {
    id: "intro",
    n: null,
    title: "Welcome",
    blocks: [
      { kind: "text", body: "Welcome to Tweaxly (“Tweaxly”, “Company”, “we”, “our”, or “us”). Tweaxly provides an AI-powered business intelligence platform for owners and operators of small and medium businesses." },
      { kind: "text", body: "This Privacy Policy explains how we collect, use, store, process, disclose, and protect personal information when you access or use our website, applications, dashboards, APIs, AI-powered features, integrations, and related services (collectively, the “Services”)." },
      { kind: "text", body: "This Policy is part of a broader set of documents that govern your use of Tweaxly. Please also see our Terms of Service, our Accessibility Statement, and our Privacy Preferences (accessible from the footer of any page). Together they describe what you agree to when you use the Services and the choices you have." },
      { kind: "text", body: "By accessing or using the Services, you acknowledge that you have read and understood this Privacy Policy. We have aimed for clarity over legal density - if anything is unclear, we welcome questions at privacy@tweaxly.com." },
    ],
  },
  {
    id: "scope", n: 1, title: "Scope of this Policy",
    blocks: [
      { kind: "text", body: "This Policy applies to information we process when you visit our marketing website, register for an account, sign in to the Services, upload or connect business data, interact with our support team, or otherwise engage with Tweaxly." },
      { kind: "text", body: "This Policy does not apply to:" },
      { kind: "list", items: [
        "third-party websites or services that we link to but do not operate;",
        "platforms you connect to Tweaxly (banks, accounting systems, payment processors) - their data practices are governed by their own policies; or",
        "information processed by your employer or organization on its own behalf where Tweaxly merely acts as a processor on their instructions.",
      ] },
      { kind: "text", body: "In this Policy: “personal information” means information that identifies, relates to, or could reasonably be linked with an identified or identifiable natural person; “business data” means transactional, financial, and operational information about your business that you upload or connect to the Services; and “you” means the individual using the Services on your own behalf or on behalf of a business." },
    ],
  },
  {
    id: "information-collected", n: 2, title: "Information We Collect",
    blocks: [
      { kind: "text", body: "We collect the following categories of information." },
      { kind: "sub", title: "2.1 Information You Provide Directly" },
      { kind: "list", items: [
        "account details - full name, business name, email address, phone number, login credentials;",
        "billing details - billing address, payment method information (processed by our payment provider, not stored by us in full);",
        "uploaded files and documents - CSVs, statements, invoices, attachments, and other business records you import;",
        "communication content - support requests, messages to our team, feedback submissions; and",
        "information submitted through onboarding flows, configuration screens, consultations, and forms.",
      ] },
      { kind: "sub", title: "2.2 Business and Financial Data" },
      { kind: "text", body: "When you use the Services, you may choose to connect or upload business-related information, including:" },
      { kind: "list", items: [
        "bank transaction data;",
        "accounting data and ledger entries;",
        "invoices and receipts;",
        "payment processor information;",
        "payroll-related data;",
        "revenue and expense information;",
        "business forecasts and scenarios;",
        "operational metrics; and",
        "other financial or business records.",
      ] },
      { kind: "text", body: "This information is processed to provide the Services - generating analytics, forecasts, alerts, AI-powered insights, and improving platform functionality. We do not sell business data, and we do not use it to train shared models that benefit other customers without explicit, separate consent." },
      { kind: "sub", title: "2.3 Automatically Collected Information" },
      { kind: "text", body: "When you use the Services, we may automatically collect certain technical and usage information, including IP address, browser type, operating system, device identifiers, language and accessibility settings, referral URLs, pages visited, session duration, clicks and interactions, crash reports, diagnostic information, and usage analytics. Collection of analytics and marketing categories of this information is gated by your consent preferences (see Section 3)." },
    ],
  },
  {
    id: "cookies", n: 3, title: "Cookies, Tracking Technologies, and Consent Management",
    blocks: [
      { kind: "text", body: "We use cookies, pixels, tags, SDKs, and similar technologies to operate, secure, measure, and improve the Services. Some of these technologies are required for the Services to function; others are optional and depend on your consent." },
      { kind: "sub", title: "3.1 Consent Management Platform (CMP)" },
      { kind: "text", body: "Tweaxly operates a consent management system. On your first visit, you are presented with a clear choice: Accept All, Reject Non-Essential, or Manage Preferences. Your choice is recorded with the date, the policy version it was made against, and (where available) the region we detected you in, and it is honored across our sites." },
      { kind: "text", body: "You can review or change your consent at any time using the “Privacy Preferences” link in any page footer. Withdrawing consent is as easy as granting it - no dark patterns, no hidden controls. For analytics and advertising signals, we implement Google Consent Mode v2 with non-essential signals defaulting to denied until you opt in." },
      { kind: "sub", title: "3.2 Cookie Categories" },
      { kind: "text", body: "We organize cookies and similar technologies into four categories:" },
      { kind: "list", items: [
        "Strictly Necessary - required for the Services to function. Examples: authentication, session management, CSRF protection, load balancing, language preferences, accessibility settings. These cannot be disabled because the Services would not work without them.",
        "Analytics - help us understand how the Services are used so we can improve them. Examples: aggregated page views, performance metrics, session analytics, heatmaps. If disabled, we lose the ability to measure performance but no feature breaks for you.",
        "Marketing & Advertising - measure ad campaigns and let us reach relevant audiences. Examples: conversion tracking, remarketing, audience signals. If disabled, you may still see ads from us, but they will not be personalized and we will not measure their effectiveness.",
        "Personalization & AI Optimization - tailor the product experience and improve AI recommendations for you. Examples: adaptive onboarding, remembered preferences, personalized AI suggestions. If disabled, the Services still work but will not adapt to your usage over time.",
      ] },
      { kind: "sub", title: "3.3 Specific Tools" },
      { kind: "text", body: "Subject to your consent, we may use third-party analytics and advertising providers, including, without limitation:" },
      { kind: "list", items: [
        "Google Analytics (GA4);",
        "Google Ads;",
        "Meta (Facebook) Pixel;",
        "LinkedIn Insight Tag;",
        "TikTok Pixel;",
        "remarketing technologies;",
        "conversion-tracking tools; and",
        "future analytics and advertising providers we may adopt.",
      ] },
      { kind: "text", body: "These providers may use cookies and similar technologies to analyze user behavior, measure campaign effectiveness, build audience segments, display personalized advertisements, and perform remarketing across websites and platforms. Each provider operates under its own privacy policy in addition to ours." },
      { kind: "text", body: "Depending on the jurisdiction you are in, non-essential cookies will not be set until you grant consent, and you may withdraw consent at any time without affecting the lawfulness of prior processing." },
    ],
  },
  {
    id: "ai", n: 4, title: "AI and Automated Processing",
    blocks: [
      { kind: "text", body: "Tweaxly is an AI-powered platform. Several features rely on artificial intelligence, machine learning models, automated categorization, forecasting systems, and decision-support technologies." },
      { kind: "sub", title: "4.1 What AI does in Tweaxly" },
      { kind: "text", body: "Uploaded or connected business data may be processed automatically to:" },
      { kind: "list", items: [
        "categorize transactions into income and expense buckets;",
        "identify trends, anomalies, and risks;",
        "generate forecasts, projections, and scenarios;",
        "produce business insights and recommendations;",
        "answer questions you ask the AI advisor about your numbers;",
        "personalize the experience and prioritize what to surface; and",
        "improve system performance and platform functionality.",
      ] },
      { kind: "sub", title: "4.2 Limitations of AI Outputs" },
      { kind: "text", body: "AI-generated outputs may contain inaccuracies, omissions, biased classifications, incorrect assumptions, or misleading conclusions. Automated categorizations, forecasts, recommendations, and insights are intended as decision-support tools only - they are not a substitute for your own judgment or the judgment of qualified professionals. You should review and verify any AI output before relying on it for business, financial, tax, legal, or operational decisions." },
      { kind: "text", body: "Tweaxly does not make decisions producing legal or similarly significant effects about you solely on the basis of automated processing. Where AI processing materially affects an outcome, a human at your end remains the decision-maker." },
      { kind: "sub", title: "4.3 Third-Party AI Infrastructure" },
      { kind: "text", body: "Certain AI processing may involve third-party AI infrastructure or model providers operating under contractual obligations to us. Where such providers are used, we take commercially reasonable steps to apply appropriate safeguards - including contractual restrictions on the use of your data, data-minimization in what we send, and where applicable, requirements that your data not be used to train shared third-party models." },
    ],
  },
  {
    id: "use", n: 5, title: "How We Use Information",
    blocks: [
      { kind: "text", body: "We use the information we collect to:" },
      { kind: "list", items: [
        "provide and operate the Services;",
        "create and manage accounts and authenticate users;",
        "process payments and subscriptions;",
        "generate dashboards, reports, forecasts, alerts, and AI-powered insights;",
        "provide customer support and respond to your requests;",
        "improve and develop features;",
        "personalize the user experience (subject to your consent);",
        "monitor security, prevent fraud and abuse, and investigate incidents;",
        "conduct analytics and research (subject to your consent);",
        "send service-related communications and, where you have opted in, marketing communications;",
        "perform advertising and remarketing campaigns (subject to your consent);",
        "comply with legal obligations, respond to lawful requests, and enforce our agreements and policies; and",
        "exercise or defend legal claims.",
      ] },
    ],
  },
  {
    id: "legal-bases", n: 6, title: "Legal Bases for Processing",
    blocks: [
      { kind: "text", body: "Where applicable privacy law requires us to identify a legal basis for processing personal information (for example, under the EU/UK GDPR or similar frameworks), we rely on one or more of the following:" },
      { kind: "list", items: [
        "Performance of a contract - to provide the Services you have requested and operate your account;",
        "Consent - for processing that depends on your explicit opt-in, such as marketing communications and non-essential cookies;",
        "Legitimate interests - to secure the Services, prevent fraud, improve the product, and run our business in a way you would reasonably expect, provided your rights do not override those interests; and",
        "Legal obligation - to comply with applicable laws, tax and accounting record-keeping rules, and lawful requests from authorities.",
      ] },
      { kind: "text", body: "Where we rely on consent, you may withdraw it at any time. Withdrawal does not affect the lawfulness of processing carried out before the withdrawal." },
    ],
  },
  {
    id: "marketing", n: 7, title: "Marketing Communications and Consent",
    blocks: [
      { kind: "text", body: "We send two distinct kinds of communications, and we treat them differently." },
      { kind: "sub", title: "7.1 Service / Transactional Communications" },
      { kind: "text", body: "These are necessary to operate your account and remain enabled for as long as the account is active. They include:" },
      { kind: "list", items: [
        "billing notices, invoices, and renewal reminders;",
        "security alerts, password resets, and two-factor verification messages;",
        "operational notices about outages, maintenance, or incidents;",
        "account-related notifications such as signup confirmation, exports, and product limits; and",
        "legal and policy update notices.",
      ] },
      { kind: "sub", title: "7.2 Marketing Communications" },
      { kind: "text", body: "These are optional and depend on your explicit opt-in. They include:" },
      { kind: "list", items: [
        "newsletters;",
        "promotional offers and campaigns;",
        "webinars and events;",
        "product announcements about new features;",
        "educational materials and tips; and",
        "other commercial communications.",
      ] },
      { kind: "text", body: "We may send marketing via email, SMS, or other electronic communications channels. Marketing consent is captured separately from your acceptance of the Terms of Service - accepting the Terms does not opt you in to marketing, and declining marketing does not block your ability to use the Services." },
      { kind: "sub", title: "7.3 Changing Your Choice" },
      { kind: "text", body: "You can change your communication preferences at any time from Account → Communication Preferences inside the app, or by following the unsubscribe link included in every marketing email. Unsubscribing from marketing does not affect service or transactional communications, which remain required to operate the account." },
    ],
  },
  {
    id: "sharing", n: 8, title: "Sharing of Information",
    blocks: [
      { kind: "text", body: "We do not sell personal information. We may share information with the following categories of recipients, in each case under appropriate contractual and security obligations:" },
      { kind: "list", items: [
        "service providers and subcontractors that help us run the Services (see Section 9);",
        "payment processors that handle subscription billing;",
        "professional advisors (lawyers, accountants, auditors) where reasonably necessary;",
        "authorities, regulators, or law-enforcement bodies where we are legally required to do so or to protect rights, property, or safety;",
        "successors or acquirers in connection with a merger, acquisition, financing, restructuring, sale of assets, or similar transaction; and",
        "other parties with your direction or consent.",
      ] },
    ],
  },
  {
    id: "third-party", n: 9, title: "Third-Party Service Providers and Subprocessors",
    blocks: [
      { kind: "text", body: "To operate the Services, we engage trusted third parties (often called “subprocessors”) for functions including:" },
      { kind: "list", items: [
        "hosting and cloud infrastructure;",
        "databases and storage;",
        "AI and machine learning processing;",
        "analytics and product instrumentation;",
        "payment processing and billing;",
        "transactional and marketing email and SMS delivery;",
        "customer support and ticketing;",
        "monitoring, logging, and observability;",
        "security and fraud detection; and",
        "advertising and marketing measurement (subject to your consent).",
      ] },
      { kind: "text", body: "Each of these providers operates under written contractual obligations to process information only on documented instructions, maintain appropriate security measures, assist us in honouring data-subject rights, and notify us of incidents. As our customer base evolves we will publish a dedicated subprocessor list and notify in-product where appropriate." },
      { kind: "text", body: "Integrations you actively connect to Tweaxly - your bank, your accounting system, your payment processor - are not subprocessors of Tweaxly; they are independent services governed by their own terms and privacy policies. Tweaxly is not responsible for their practices." },
    ],
  },
  {
    id: "transfers", n: 10, title: "International Data Transfers",
    blocks: [
      { kind: "text", body: "Tweaxly and our service providers operate globally. Your information may be processed and stored in countries outside your jurisdiction, including countries that may have different data-protection laws from those of your country of residence." },
      { kind: "text", body: "Where required by applicable law, we apply appropriate safeguards to cross-border transfers, which may include reliance on adequacy decisions, the use of Standard Contractual Clauses (or equivalents), supplementary technical measures, or other lawful transfer mechanisms. By using the Services, you understand that your information may be transferred internationally." },
    ],
  },
  {
    id: "security", n: 11, title: "Data Security",
    blocks: [
      { kind: "text", body: "We implement commercially reasonable administrative, technical, and organizational measures designed to protect information against unauthorized access, disclosure, alteration, or destruction. These measures include, where appropriate:" },
      { kind: "list", items: [
        "encryption of data in transit using industry-standard TLS;",
        "encryption of sensitive data at rest;",
        "authentication and password-hashing controls;",
        "role-based access controls and the principle of least privilege;",
        "audit logging and monitoring of administrative actions;",
        "regular backups and disaster-recovery planning; and",
        "vendor security review for material subprocessors.",
      ] },
      { kind: "text", body: "No method of transmission or storage is completely secure, and we do not claim to provide perfect or absolute security. We work continuously to maintain and improve our security posture, and we treat security incidents that affect your information with appropriate seriousness, including notification where required by law." },
    ],
  },
  {
    id: "retention", n: 12, title: "Data Retention and Deletion",
    blocks: [
      { kind: "text", body: "We retain information only for as long as reasonably necessary for the purposes described in this Policy. The exact retention period depends on the type of data, the purpose for processing, your continued use of the Services, and applicable legal or accounting obligations." },
      { kind: "list", items: [
        "Active accounts: information is retained for as long as your account is active and as needed to provide the Services.",
        "Closed accounts: when you close your account, we delete or anonymize personal information within a reasonable period, subject to limited retention required for legal, accounting, tax, or security purposes (for example, financial records may be retained for the period mandated by applicable law).",
        "Backups: information in encrypted backups may persist for a limited additional period after deletion from production systems, until those backups expire on their normal rotation schedule.",
        "Aggregated or anonymized data: information that no longer identifies you may be retained indefinitely for analytics, benchmarking, and product improvement.",
        "Logs and audit records: security and operational logs are retained as needed to investigate incidents and meet compliance obligations.",
      ] },
      { kind: "text", body: "If you would like more information about retention for a specific type of data, please contact us at privacy@tweaxly.com." },
    ],
  },
  {
    id: "rights", n: 13, title: "Your Privacy Rights",
    blocks: [
      { kind: "text", body: "Depending on where you live and the applicable law, you may have the following rights with respect to your personal information:" },
      { kind: "list", items: [
        "the right to access information we hold about you;",
        "the right to correct inaccurate or incomplete information;",
        "the right to request deletion of your information;",
        "the right to restrict or object to certain processing;",
        "the right to data portability - to receive your data in a structured, commonly used format;",
        "the right to withdraw consent where processing is based on consent; and",
        "the right to lodge a complaint with your local data protection authority.",
      ] },
      { kind: "text", body: "You can exercise many of these rights directly from inside the Services - for example, by editing your account, downloading data from the dashboard exports, adjusting your communication preferences, or revisiting your consent choices via Privacy Preferences. For other requests, please contact us at privacy@tweaxly.com." },
      { kind: "text", body: "We will respond to verifiable requests within the timeframes required by applicable law. Some requests may be limited or refused where permitted by law - for example, where complying would conflict with legal obligations, our legitimate business interests in maintaining accurate records, or the rights of others." },
    ],
  },
  {
    id: "business-data", n: 14, title: "Business Intelligence and Financial Data Responsibility",
    blocks: [
      { kind: "text", body: "Tweaxly is a business-intelligence and analytics platform. It is not an accounting service, bookkeeping service, payroll service, tax preparation service, or regulated financial advisor." },
      { kind: "text", body: "You remain responsible for the accuracy, completeness, and lawfulness of the business data you upload or connect, for reviewing and verifying any insight or forecast we present, and for the business, financial, tax, legal, and operational decisions you make using the Services. Dashboards, charts, KPIs, alerts, and AI-generated insights depend on the quality of the data feeding them - where source data is incomplete, miscategorized, or outdated, the outputs will reflect that." },
      { kind: "text", body: "Please consult qualified professionals where appropriate, and treat Tweaxly as a decision-support tool that supplements (not replaces) your own judgment." },
    ],
  },
  {
    id: "children", n: 15, title: "Children’s Privacy",
    blocks: [
      { kind: "text", body: "The Services are intended for businesses and adults. We do not direct the Services to individuals under the age of 18, and we do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us so we can take appropriate action." },
    ],
  },
  {
    id: "accessibility", n: 16, title: "Accessibility",
    blocks: [
      { kind: "text", body: "Tweaxly is committed to making the Services accessible to as many users as possible. Our approach, our target standards, our accessibility toolbar, our reporting channel, and our known limitations are described in our Accessibility Statement, which is linked from the footer of every page." },
    ],
  },
  {
    id: "related", n: 17, title: "Related Policies and Settings",
    blocks: [
      { kind: "text", body: "This Privacy Policy works alongside the following:" },
      { kind: "list", items: [
        "Terms of Service - the contract governing your use of the Services;",
        "Accessibility Statement - our accessibility commitments and known limitations;",
        "Privacy Preferences - your cookie and consent controls, available from any footer; and",
        "Communication Preferences - your marketing channel controls, available inside the app under Account → Communication Preferences.",
      ] },
      { kind: "text", body: "As Tweaxly evolves we may publish additional, dedicated documents - for example a Subprocessor List, an AI Policy, a Cookie Policy, a Data Processing Addendum (DPA), or regional disclosures. When we do, we will link them from this Policy." },
    ],
  },
  {
    id: "changes", n: 18, title: "Changes to This Privacy Policy",
    blocks: [
      { kind: "text", body: "The Services evolve and so will this Privacy Policy. We may update this Policy from time to time to reflect changes to the Services, to our practices, to applicable law, or to industry expectations." },
      { kind: "text", body: "When we make material changes, we will communicate them through appropriate means - for example, by updating the “Last Updated” date and the policy version, by displaying an in-product notice, or where appropriate by sending a notification. Where the law requires it, material changes may require renewed consent before they take effect for you." },
      { kind: "text", body: "Continued use of the Services after updates take effect constitutes acceptance of the revised Policy, except where renewed consent is required." },
    ],
  },
  {
    id: "law", n: 19, title: "Governing Law and Jurisdiction",
    blocks: [
      { kind: "text", body: "This Privacy Policy is governed by the laws of the State of Israel, without regard to conflict-of-law principles. Any dispute relating to this Policy will be subject to the exclusive jurisdiction of the competent courts located in Israel - without prejudice to non-waivable rights you may have under the mandatory laws of your country of residence." },
    ],
  },
  {
    id: "contact", n: 20, title: "Contact Information",
    blocks: [
      { kind: "text", body: "For questions, comments, or requests regarding this Privacy Policy or our data practices, please contact:" },
      { kind: "text", body: "Tweaxly" },
      { kind: "text", body: "Email: privacy@tweaxly.com" },
      { kind: "text", body: "Website: tweaxly.com" },
      { kind: "text", body: "We will respond to your inquiry as promptly as we reasonably can." },
    ],
  },
];

export default function PrivacyContent() {
  return (
    <div className="space-y-8 text-slate-300 leading-relaxed">
      {PRIVACY_SECTIONS.map((s) => (
        <section key={s.id} id={s.id}>
          <h2 className="text-lg font-semibold text-white mb-3">
            {s.n != null ? <span className="text-slate-500 mr-2">{s.n}.</span> : null}
            {s.title}
          </h2>
          <div className="space-y-3 text-sm">
            {s.blocks.map((b, i) => {
              if (b.kind === "text") {
                return <p key={i}>{b.body}</p>;
              }
              if (b.kind === "sub") {
                return (
                  <h3 key={i} className="text-sm font-semibold text-slate-200 mt-2">
                    {b.title}
                  </h3>
                );
              }
              return (
                <ul key={i} className="list-disc list-inside space-y-1 ml-2 marker:text-slate-600">
                  {b.items.map((it, j) => <li key={j}>{it}</li>)}
                </ul>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
