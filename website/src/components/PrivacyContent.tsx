// Single source of truth for the Privacy Policy body. Rendered by
// the standalone /privacy page. Mirrors the structure of
// TermsContent.tsx so both pages render identically.

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
      { kind: "text", body: "Welcome to Tweaxly (“Tweaxly”, “Company”, “we”, “our”, or “us”)." },
      { kind: "text", body: "This Privacy Policy explains how we collect, use, store, process, disclose, and protect personal information when you access or use our website, applications, software, APIs, dashboards, AI-powered tools, integrations, and related services (collectively, the “Services”)." },
      { kind: "text", body: "By accessing or using the Services, you acknowledge that you have read and understood this Privacy Policy." },
    ],
  },
  {
    id: "information-collected", n: 1, title: "Information We Collect",
    blocks: [
      { kind: "text", body: "We may collect the following categories of information:" },
      { kind: "sub", title: "1.1 Information You Provide Directly" },
      { kind: "text", body: "Including, without limitation:" },
      { kind: "list", items: [
        "full name;",
        "business name;",
        "email address;",
        "phone number;",
        "billing details;",
        "login credentials;",
        "uploaded files and documents;",
        "financial and operational business data;",
        "support requests;",
        "communication content; and",
        "information submitted through forms, onboarding flows, or consultations.",
      ] },
    ],
  },
  {
    id: "financial-data", n: 2, title: "Financial and Business Data",
    blocks: [
      { kind: "text", body: "When using the Services, you may choose to connect or upload business-related information, including:" },
      { kind: "list", items: [
        "bank transaction data;",
        "accounting data;",
        "invoices;",
        "payment processor information;",
        "payroll-related data;",
        "revenue and expense information;",
        "business forecasts;",
        "operational metrics; and",
        "other financial or business records.",
      ] },
      { kind: "text", body: "This information is processed solely for the purpose of providing the Services, generating analytics, forecasts, alerts, AI-powered insights, and improving platform functionality." },
    ],
  },
  {
    id: "auto-collected", n: 3, title: "Automatically Collected Information",
    blocks: [
      { kind: "text", body: "When you use the Services, we may automatically collect certain technical and usage information, including:" },
      { kind: "list", items: [
        "IP address;",
        "browser type;",
        "operating system;",
        "device identifiers;",
        "language settings;",
        "referral URLs;",
        "pages visited;",
        "session duration;",
        "clicks and interactions;",
        "crash reports;",
        "diagnostic information; and",
        "usage analytics.",
      ] },
    ],
  },
  {
    id: "cookies", n: 4, title: "Cookies and Tracking Technologies",
    blocks: [
      { kind: "text", body: "We use cookies and similar technologies, including pixels, tags, scripts, SDKs, and local storage technologies." },
      { kind: "text", body: "These technologies help us:" },
      { kind: "list", items: [
        "operate and secure the Services;",
        "remember preferences and login sessions;",
        "analyze traffic and usage patterns;",
        "improve functionality and user experience;",
        "personalize content;",
        "measure marketing performance;",
        "optimize advertising campaigns; and",
        "provide remarketing and advertising services.",
      ] },
      { kind: "text", body: "Cookies may be categorized as:" },
      { kind: "list", items: [
        "essential cookies;",
        "functionality cookies;",
        "analytics cookies;",
        "performance cookies;",
        "advertising cookies; and",
        "remarketing cookies.",
      ] },
    ],
  },
  {
    id: "analytics", n: 5, title: "Analytics and Advertising Technologies",
    blocks: [
      { kind: "text", body: "We may use third-party analytics and advertising providers, including, without limitation:" },
      { kind: "list", items: [
        "Google Analytics",
        "Google Ads",
        "Meta Ads",
        "LinkedIn Ads",
        "TikTok Ads",
        "advertising pixels;",
        "conversion tracking tools; and",
        "remarketing technologies.",
      ] },
      { kind: "text", body: "These providers may use cookies and tracking technologies to:" },
      { kind: "list", items: [
        "analyze user behavior;",
        "measure campaign effectiveness;",
        "build audience segments;",
        "provide targeted advertising;",
        "display personalized advertisements; and",
        "perform remarketing across websites and platforms.",
      ] },
      { kind: "text", body: "Third-party providers may collect information directly in accordance with their own privacy policies." },
    ],
  },
  {
    id: "ai", n: 6, title: "AI and Automated Processing",
    blocks: [
      { kind: "text", body: "Certain Services utilize artificial intelligence, machine learning models, automated categorization systems, forecasting tools, and decision-support technologies." },
      { kind: "text", body: "Your information may be processed automatically to:" },
      { kind: "list", items: [
        "generate business insights;",
        "classify transactions;",
        "identify trends and anomalies;",
        "generate forecasts and recommendations;",
        "improve system performance; and",
        "personalize platform functionality.",
      ] },
      { kind: "text", body: "AI-generated outputs may involve automated analysis of uploaded or connected business data." },
    ],
  },
  {
    id: "use", n: 7, title: "How We Use Information",
    blocks: [
      { kind: "text", body: "We may use collected information to:" },
      { kind: "list", items: [
        "provide and operate the Services;",
        "create and manage accounts;",
        "authenticate users;",
        "process payments and subscriptions;",
        "generate dashboards, reports, forecasts, and insights;",
        "provide support and customer service;",
        "improve and develop features;",
        "personalize user experience;",
        "monitor security and fraud prevention;",
        "conduct analytics and research;",
        "communicate updates and service notifications;",
        "send marketing communications;",
        "perform advertising and remarketing campaigns;",
        "comply with legal obligations; and",
        "enforce our agreements and policies.",
      ] },
    ],
  },
  {
    id: "marketing", n: 8, title: "Marketing Communications",
    blocks: [
      { kind: "text", body: "We may send:" },
      { kind: "list", items: [
        "service-related notices;",
        "onboarding communications;",
        "product updates;",
        "newsletters;",
        "promotional offers;",
        "educational materials; and",
        "marketing communications.",
      ] },
      { kind: "text", body: "You may opt out of marketing emails at any time using the unsubscribe link included in such communications." },
      { kind: "text", body: "Service-related communications may still be sent where necessary for account or operational purposes." },
    ],
  },
  {
    id: "sharing", n: 9, title: "Sharing of Information",
    blocks: [
      { kind: "text", body: "We may share information with:" },
      { kind: "list", items: [
        "hosting providers;",
        "infrastructure providers;",
        "analytics providers;",
        "payment processors;",
        "cloud service providers;",
        "customer support systems;",
        "advertising and marketing platforms;",
        "AI and automation providers;",
        "subcontractors and service providers;",
        "legal advisors; and",
        "governmental or regulatory authorities where required by law.",
      ] },
      { kind: "text", body: "We do not sell personal information to third parties." },
    ],
  },
  {
    id: "third-party", n: 10, title: "Third-Party Services and Integrations",
    blocks: [
      { kind: "text", body: "The Services may integrate with third-party platforms including banks, accounting systems, payment providers, APIs, and software tools." },
      { kind: "text", body: "We are not responsible for the privacy practices, content, or security of third-party services." },
      { kind: "text", body: "Your use of third-party services is subject to their own terms and privacy policies." },
    ],
  },
  {
    id: "retention", n: 11, title: "Data Retention",
    blocks: [
      { kind: "text", body: "We retain information for as long as reasonably necessary to:" },
      { kind: "list", items: [
        "provide the Services;",
        "maintain business operations;",
        "comply with legal obligations;",
        "resolve disputes;",
        "enforce agreements; and",
        "improve platform functionality.",
      ] },
      { kind: "text", body: "We may retain aggregated or anonymized information indefinitely." },
    ],
  },
  {
    id: "security", n: 12, title: "Data Security",
    blocks: [
      { kind: "text", body: "We implement commercially reasonable administrative, technical, and organizational measures designed to protect information against unauthorized access, disclosure, alteration, or destruction." },
      { kind: "text", body: "However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security." },
    ],
  },
  {
    id: "transfers", n: 13, title: "International Data Transfers",
    blocks: [
      { kind: "text", body: "Your information may be processed and stored in countries outside your jurisdiction, including countries that may have different data protection laws than your country of residence." },
      { kind: "text", body: "By using the Services, you consent to such transfers." },
    ],
  },
  {
    id: "rights", n: 14, title: "Your Rights",
    blocks: [
      { kind: "text", body: "Depending on applicable law, you may have rights including:" },
      { kind: "list", items: [
        "access to your information;",
        "correction of inaccurate information;",
        "deletion of information;",
        "restriction of processing;",
        "objection to processing;",
        "data portability; and",
        "withdrawal of consent where processing is based on consent.",
      ] },
      { kind: "text", body: "To exercise such rights, please contact us using the contact details below." },
    ],
  },
  {
    id: "children", n: 15, title: "Children’s Privacy",
    blocks: [
      { kind: "text", body: "The Services are not intended for individuals under the age of 18." },
      { kind: "text", body: "We do not knowingly collect personal information from children." },
    ],
  },
  {
    id: "transfers-business", n: 16, title: "Business Transfers",
    blocks: [
      { kind: "text", body: "In the event of a merger, acquisition, financing, restructuring, sale of assets, or similar transaction, information may be transferred as part of the transaction." },
    ],
  },
  {
    id: "dnt", n: 17, title: "Do Not Track",
    blocks: [
      { kind: "text", body: "Some browsers may transmit “Do Not Track” signals. The Services may not respond to such signals." },
    ],
  },
  {
    id: "changes", n: 18, title: "Changes to This Privacy Policy",
    blocks: [
      { kind: "text", body: "We may update this Privacy Policy from time to time." },
      { kind: "text", body: "Updated versions become effective upon posting." },
      { kind: "text", body: "Continued use of the Services after updates constitutes acceptance of the revised Privacy Policy." },
    ],
  },
  {
    id: "law", n: 19, title: "Governing Law",
    blocks: [
      { kind: "text", body: "This Privacy Policy shall be governed by the laws of the State of Israel." },
      { kind: "text", body: "Any disputes relating to this Privacy Policy shall be subject to the exclusive jurisdiction of the competent courts located in Israel." },
    ],
  },
  {
    id: "contact", n: 20, title: "Contact Information",
    blocks: [
      { kind: "text", body: "For questions regarding this Privacy Policy or data practices, please contact:" },
      { kind: "text", body: "Tweaxly" },
      { kind: "text", body: "Email: privacy@tweaxly.com" },
      { kind: "text", body: "Website: Tweaxly" },
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
