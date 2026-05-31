// Single source of truth for the Terms of Service body. Rendered by
// the standalone /terms page and reusable from anywhere else that
// needs to display the full text (no modal on the website today, but
// the product app uses an identical mirror).

export const TERMS_LAST_UPDATED = "May 31, 2026";

// Each section is rendered as <h2> + structured paragraphs / lists.
// Keeping the data structured (rather than one big markdown blob)
// lets us style consistently and search-index sensibly.
type ListBlock       = { kind: "list"; items: string[] };
type TextBlock       = { kind: "text"; body: string };
type PreBlock        = { kind: "pre"; body: string };  // all-caps legal blocks
// Inline subheading inside a section - lets a long section split
// into named sub-clauses (e.g. Section 8: Workspace-Based Billing,
// Subscription Upgrades, Subscription Downgrades, etc.) without
// fracturing the existing section numbering.
type SubheadingBlock = { kind: "subheading"; text: string };
type Block = ListBlock | TextBlock | PreBlock | SubheadingBlock;
type Section = { id: string; n: number | null; title: string; blocks: Block[] };

export const TERMS_SECTIONS: Section[] = [
  {
    id: "intro",
    n: null,
    title: "Welcome",
    blocks: [
      { kind: "text", body: "Welcome to Tweaxly (“Tweaxly”, “Company”, “we”, “our”, or “us”)." },
      { kind: "text", body: "These Terms of Service (“Terms”) govern your access to and use of the Tweaxly platform, website, applications, software, dashboards, APIs, integrations, analytics tools, AI-powered features, reports, forecasts, alerts, notifications, consultation tools, and related services (collectively, the “Services”)." },
      { kind: "text", body: "By accessing, registering for, subscribing to, or using the Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use the Services." },
    ],
  },
  {
    id: "eligibility", n: 1, title: "Eligibility",
    blocks: [
      { kind: "text", body: "You may use the Services only if:" },
      { kind: "list", items: [
        "you are at least 18 years old;",
        "you have the legal authority to enter into these Terms;",
        "you are using the Services on behalf of yourself or a legal entity you are authorized to represent; and",
        "your use of the Services complies with all applicable laws and regulations.",
      ] },
      { kind: "text", body: "If you are using the Services on behalf of a company or organization, you represent and warrant that you are authorized to bind such entity to these Terms." },
    ],
  },
  {
    id: "description", n: 2, title: "Description of Services",
    blocks: [
      { kind: "text", body: "Tweaxly provides AI-powered business intelligence and analytics tools designed to assist businesses in understanding financial and operational data." },
      { kind: "text", body: "The Services may include, without limitation:" },
      { kind: "list", items: [
        "dashboards;",
        "business insights;",
        "forecasts and projections;",
        "trend analysis;",
        "AI-generated recommendations;",
        "alerts and notifications;",
        "consultation and AI chat tools;",
        "scenario simulations;",
        "transaction categorization;",
        "integrations with banks, payment providers, accounting systems, and third-party platforms;",
        "reporting tools;",
        "financial and operational monitoring tools; and",
        "related software and services.",
      ] },
      { kind: "text", body: "The Services are intended solely as informational and operational support tools." },
    ],
  },
  {
    id: "no-advice", n: 3, title: "No Professional Advice",
    blocks: [
      { kind: "text", body: "Tweaxly does not provide accounting, tax, legal, financial, investment, insurance, employment, or other professional advice." },
      { kind: "text", body: "Any information, insight, recommendation, alert, forecast, projection, simulation, trend analysis, categorization, or AI-generated output provided through the Services is for informational purposes only." },
      { kind: "text", body: "You acknowledge and agree that:" },
      { kind: "list", items: [
        "the Services are not a substitute for professional judgment;",
        "you remain solely responsible for all business and financial decisions;",
        "you should consult qualified professionals where appropriate; and",
        "you should independently verify all information before relying on it.",
      ] },
    ],
  },
  {
    id: "forecasts", n: 4, title: "Forecasts and AI-Generated Outputs",
    blocks: [
      { kind: "text", body: "The Services may generate forecasts, predictions, recommendations, simulations, classifications, or insights using automated systems, machine learning models, artificial intelligence, historical information, assumptions, and third-party data." },
      { kind: "text", body: "You acknowledge and agree that:" },
      { kind: "list", items: [
        "forecasts and projections are inherently uncertain;",
        "AI-generated outputs may contain inaccuracies, omissions, errors, incorrect assumptions, or misleading conclusions;",
        "business conditions constantly change;",
        "historical performance does not guarantee future results; and",
        "Tweaxly makes no guarantee regarding accuracy, completeness, profitability, reliability, or future outcomes.",
      ] },
      { kind: "text", body: "The Services are designed to assist users in identifying possible trends, anomalies, risks, and opportunities, but not to replace human oversight or decision-making." },
    ],
  },
  {
    id: "user-responsibility", n: 5, title: "User Responsibility",
    blocks: [
      { kind: "text", body: "You remain solely and exclusively responsible for:" },
      { kind: "list", items: [
        "all decisions made based on the Services;",
        "all accounting, tax, financial, operational, legal, strategic, employment, vendor, and investment decisions;",
        "verifying the accuracy of your data;",
        "reviewing alerts, reports, forecasts, and recommendations independently;",
        "maintaining backups of your records; and",
        "complying with applicable laws and regulations.",
      ] },
      { kind: "text", body: "Failure of the Services to generate alerts, warnings, recommendations, or notifications shall not create liability for Tweaxly." },
    ],
  },
  {
    id: "third-party", n: 6, title: "Third-Party Data and Integrations",
    blocks: [
      { kind: "text", body: "The Services may connect to third-party services including, without limitation:" },
      { kind: "list", items: [
        "banks;",
        "payment processors;",
        "accounting platforms;",
        "payroll providers;",
        "APIs;",
        "financial institutions; and",
        "external software providers.",
      ] },
      { kind: "text", body: "Tweaxly does not control third-party services and is not responsible for:" },
      { kind: "list", items: [
        "service interruptions;",
        "API failures;",
        "delayed synchronization;",
        "inaccurate data;",
        "unavailable integrations;",
        "duplicated transactions;",
        "corrupted information; or",
        "third-party security incidents.",
      ] },
      { kind: "text", body: "Your use of third-party services is subject to the terms and policies of those third parties." },
    ],
  },
  {
    id: "accounts", n: 7, title: "Accounts and Security",
    blocks: [
      { kind: "text", body: "You are responsible for:" },
      { kind: "list", items: [
        "maintaining the confidentiality of your login credentials;",
        "restricting access to your account;",
        "all activities conducted under your account; and",
        "promptly notifying us of unauthorized access or security breaches.",
      ] },
      { kind: "text", body: "Tweaxly may suspend or terminate accounts suspected of unauthorized, fraudulent, abusive, or unlawful activity." },
    ],
  },
  {
    id: "billing", n: 8, title: "Subscription Plans and Billing",
    blocks: [
      { kind: "text", body: "Certain Services require payment of subscription fees." },
      { kind: "text", body: "By subscribing to a paid plan, you agree to pay all applicable fees, taxes, and charges associated with your subscription." },
      { kind: "text", body: "Pricing, plan features, usage limits, credit allocations, member limits, and subscription availability may change from time to time." },
      { kind: "text", body: "Unless otherwise stated:" },
      { kind: "list", items: [
        "subscriptions are billed in advance;",
        "fees are non-refundable except where required by applicable law;",
        "taxes may be added where applicable; and",
        "failure to pay may result in suspension or termination of access.",
      ] },

      { kind: "subheading", text: "Workspace-Based Billing" },
      { kind: "text", body: "Tweaxly subscriptions are managed on a per-workspace basis." },
      { kind: "text", body: "Each workspace is treated as an independent subscription environment. Subscription plans, features, usage limits, credits, members, renewals, upgrades, downgrades, and billing events apply only to the specific workspace associated with the subscription." },
      { kind: "text", body: "Changes made to one workspace do not affect any other workspace owned or managed by the same user or account." },

      { kind: "subheading", text: "Subscription Upgrades" },
      { kind: "text", body: "Users may upgrade a workspace subscription at any time." },
      { kind: "text", body: "When a workspace is upgraded:" },
      { kind: "list", items: [
        "access to the upgraded features becomes available immediately;",
        "only the prorated difference between the current plan and the upgraded plan may be charged;",
        "the remaining value of the current subscription period may be applied toward the upgraded subscription; and",
        "the existing subscription renewal date will generally remain unchanged unless required by the billing provider or subscription infrastructure.",
      ] },
      { kind: "text", body: "No refunds are provided in connection with subscription upgrades." },

      { kind: "subheading", text: "Subscription Downgrades" },
      { kind: "text", body: "Users may request a downgrade at any time." },
      { kind: "text", body: "Downgrades do not become effective immediately." },
      { kind: "text", body: "Instead:" },
      { kind: "list", items: [
        "the current subscription plan and associated features remain active until the end of the current billing period;",
        "the downgrade becomes effective upon the next renewal date; and",
        "no refund, credit, or partial reimbursement is provided for any unused portion of the current subscription period.",
      ] },
      { kind: "text", body: "Upon the effective downgrade date, the workspace will become subject to the limits, features, restrictions, and allocations of the downgraded plan." },

      { kind: "subheading", text: "Subscription Cancellation" },
      { kind: "text", body: "Users may cancel automatic renewal at any time." },
      { kind: "text", body: "Cancellation prevents future renewal charges but does not immediately terminate the active subscription." },
      { kind: "text", body: "The workspace will continue to receive access to the subscribed plan and associated features until the end of the current billing period." },
      { kind: "text", body: "Upon expiration of the subscription term, the workspace may be moved to a free plan or limited-access plan, and certain premium features may become unavailable." },

      { kind: "subheading", text: "Credits and Usage Allowances" },
      { kind: "text", body: "Included credits, usage allowances, AI requests, reports, analyses, or other consumption-based features are governed by the applicable subscription plan." },
      { kind: "text", body: "Unless expressly stated otherwise:" },
      { kind: "list", items: [
        "unused credits do not roll over to future billing periods;",
        "promotional credits, bonus credits, trial credits, and free-plan credits have no cash value;",
        "credits are non-refundable; and",
        "Tweaxly reserves the right to modify credit allocations and usage limits as part of future plan updates.",
      ] },

      { kind: "subheading", text: "Failed Payments" },
      { kind: "text", body: "If payment cannot be successfully processed, Tweaxly may:" },
      { kind: "list", items: [
        "retry payment collection;",
        "notify the user;",
        "suspend access to premium features;",
        "restrict functionality;",
        "downgrade the workspace; or",
        "terminate the subscription after reasonable notice.",
      ] },

      { kind: "subheading", text: "Billing Providers" },
      { kind: "text", body: "Subscription billing may be processed by third-party payment providers." },
      { kind: "text", body: "Users agree to comply with the terms, conditions, and policies of the applicable payment processor used by Tweaxly." },
    ],
  },
  {
    id: "renewal", n: 9, title: "Automatic Renewal",
    blocks: [
      { kind: "text", body: "Unless canceled before the renewal date, subscriptions automatically renew for successive subscription periods equal to the original term." },
      { kind: "text", body: "You authorize Tweaxly and its payment providers to automatically charge your payment method for renewal fees, applicable taxes, and related charges." },
      { kind: "text", body: "You may cancel your subscription at any time through your account settings or by contacting support. Cancellation will take effect at the end of the current billing period." },
      { kind: "text", body: "No refunds or credits shall be provided for partial subscription periods unless required by applicable law." },
    ],
  },
  {
    id: "payment", n: 10, title: "Payment Processing",
    blocks: [
      { kind: "text", body: "Payments may be processed by third-party payment providers." },
      { kind: "text", body: "Tweaxly does not store full payment card information and is not responsible for payment processor errors, outages, declined payments, or banking issues." },
      { kind: "text", body: "You authorize us to charge all amounts due using your selected payment method." },
    ],
  },
  {
    id: "acceptable", n: 11, title: "Acceptable Use",
    blocks: [
      { kind: "text", body: "You agree not to:" },
      { kind: "list", items: [
        "use the Services unlawfully;",
        "reverse engineer or copy the Services;",
        "attempt unauthorized access;",
        "interfere with system operation;",
        "upload malicious code;",
        "misuse APIs or integrations;",
        "use the Services to violate laws or third-party rights;",
        "resell or sublicense the Services without authorization; or",
        "use the Services for fraudulent, abusive, or deceptive purposes.",
      ] },
    ],
  },
  {
    id: "ip", n: 12, title: "Intellectual Property",
    blocks: [
      { kind: "text", body: "All rights, title, and interest in the Services, including software, algorithms, interfaces, designs, trademarks, content, reports, and technology, are owned by Tweaxly or its licensors." },
      { kind: "text", body: "No ownership rights are transferred to you." },
      { kind: "text", body: "Subject to these Terms, Tweaxly grants you a limited, non-exclusive, non-transferable, revocable license to use the Services for internal business purposes." },
    ],
  },
  {
    id: "user-data", n: 13, title: "User Data",
    blocks: [
      { kind: "text", body: "You retain ownership of your uploaded and connected business data." },
      { kind: "text", body: "You grant Tweaxly a worldwide, non-exclusive license to process, host, store, analyze, and use such data solely for:" },
      { kind: "list", items: [
        "providing the Services;",
        "improving system functionality;",
        "generating analytics and insights;",
        "maintaining security;",
        "complying with legal obligations; and",
        "operating the platform.",
      ] },
      { kind: "text", body: "Aggregated and anonymized data may be used for analytics, benchmarking, product improvement, and research purposes." },
    ],
  },
  {
    id: "availability", n: 14, title: "Availability and Service Interruptions",
    blocks: [
      { kind: "text", body: "Tweaxly does not guarantee uninterrupted or error-free operation." },
      { kind: "text", body: "The Services may occasionally become unavailable due to:" },
      { kind: "list", items: [
        "maintenance;",
        "updates;",
        "outages;",
        "cyber incidents;",
        "third-party failures;",
        "infrastructure issues; or",
        "events beyond our control.",
      ] },
      { kind: "text", body: "We may modify, suspend, or discontinue features at any time." },
    ],
  },
  {
    id: "disclaimer", n: 15, title: "Disclaimer of Warranties",
    blocks: [
      { kind: "pre", body: "THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE”." },
      { kind: "pre", body: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, TWEAXLY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:" },
      { kind: "list", items: [
        "MERCHANTABILITY;",
        "FITNESS FOR A PARTICULAR PURPOSE;",
        "NON-INFRINGEMENT;",
        "ACCURACY;",
        "RELIABILITY;",
        "AVAILABILITY;",
        "SECURITY; AND",
        "UNINTERRUPTED OPERATION.",
      ] },
      { kind: "text", body: "Tweaxly does not guarantee that the Services will:" },
      { kind: "list", items: [
        "detect all risks or anomalies;",
        "prevent losses;",
        "produce accurate forecasts;",
        "increase profitability; or",
        "meet your expectations or business objectives.",
      ] },
    ],
  },
  {
    id: "liability", n: 16, title: "Limitation of Liability",
    blocks: [
      { kind: "pre", body: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, TWEAXLY AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, CONTRACTORS, LICENSORS, AND SERVICE PROVIDERS SHALL NOT BE LIABLE FOR:" },
      { kind: "list", items: [
        "INDIRECT DAMAGES;",
        "INCIDENTAL DAMAGES;",
        "CONSEQUENTIAL DAMAGES;",
        "SPECIAL DAMAGES;",
        "PUNITIVE DAMAGES;",
        "LOSS OF PROFITS;",
        "LOSS OF REVENUE;",
        "LOSS OF BUSINESS;",
        "LOSS OF DATA;",
        "BUSINESS INTERRUPTION;",
        "TAX LIABILITIES;",
        "MISSED OPPORTUNITIES;",
        "OPERATIONAL LOSSES; OR",
        "DECISIONS MADE BASED ON THE SERVICES.",
      ] },
      { kind: "pre", body: "THIS LIMITATION APPLIES EVEN IF TWEAXLY WAS ADVISED OF THE POSSIBILITY OF SUCH DAMAGES." },
      { kind: "pre", body: "IN ALL CASES, TWEAXLY’S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THE SERVICES SHALL NOT EXCEED THE TOTAL AMOUNT PAID BY YOU TO TWEAXLY DURING THE THREE (3) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM." },
    ],
  },
  {
    id: "indemnification", n: 17, title: "Indemnification",
    blocks: [
      { kind: "text", body: "You agree to indemnify and hold harmless Tweaxly and its affiliates, officers, employees, and partners from and against any claims, damages, liabilities, losses, costs, or expenses arising out of:" },
      { kind: "list", items: [
        "your use of the Services;",
        "your violation of these Terms;",
        "your data;",
        "your decisions or actions;",
        "your violation of applicable laws; or",
        "claims brought by third parties relating to your business activities.",
      ] },
    ],
  },
  {
    id: "termination", n: 18, title: "Termination",
    blocks: [
      { kind: "text", body: "Tweaxly may suspend or terminate your access to the Services at any time, with or without notice, if:" },
      { kind: "list", items: [
        "you violate these Terms;",
        "payment fails;",
        "fraudulent or unlawful activity is suspected; or",
        "continued access may create legal or security risks.",
      ] },
      { kind: "text", body: "You may stop using the Services at any time." },
      { kind: "text", body: "Sections intended by their nature to survive termination shall remain in effect." },
    ],
  },
  {
    id: "changes", n: 19, title: "Changes to the Services and Terms",
    blocks: [
      { kind: "text", body: "Tweaxly may modify the Services or these Terms from time to time." },
      { kind: "text", body: "Updated Terms will become effective upon posting." },
      { kind: "text", body: "Continued use of the Services after updates constitutes acceptance of the revised Terms." },
    ],
  },
  {
    id: "privacy", n: 20, title: "Privacy",
    blocks: [
      { kind: "text", body: "Your use of the Services is also governed by our Privacy Policy." },
    ],
  },
  {
    id: "jurisdiction", n: 21, title: "Governing Law and Jurisdiction",
    blocks: [
      { kind: "text", body: "These Terms shall be governed exclusively by the laws of the State of Israel, without regard to conflict of law principles." },
      { kind: "text", body: "Any dispute, claim, or controversy arising out of or relating to these Terms or the Services shall be subject to the exclusive jurisdiction of the competent courts located in Israel." },
    ],
  },
  {
    id: "contact", n: 22, title: "Contact Information",
    blocks: [
      { kind: "text", body: "For questions regarding these Terms, please contact:" },
      { kind: "text", body: "Tweaxly" },
      { kind: "text", body: "Email: support@tweaxly.com" },
      { kind: "text", body: "Website: www.Tweaxly.com" },
    ],
  },
];

export default function TermsContent() {
  return (
    <div className="space-y-8 text-slate-300 leading-relaxed">
      {TERMS_SECTIONS.map((s) => (
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
              if (b.kind === "pre") {
                return (
                  <p key={i} className="text-slate-200 font-medium tracking-wide">
                    {b.body}
                  </p>
                );
              }
              if (b.kind === "subheading") {
                return (
                  <h3
                    key={i}
                    className="text-sm font-semibold text-white tracking-wide pt-3 mt-2"
                  >
                    {b.text}
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
