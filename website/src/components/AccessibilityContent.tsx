// Single source of truth for the Accessibility Statement body.
// Rendered by the standalone /accessibility page. Mirrors the
// structure of TermsContent.tsx / PrivacyContent.tsx.

export const ACCESSIBILITY_LAST_UPDATED = "May 19, 2026";

type ListBlock  = { kind: "list"; items: string[] };
type TextBlock  = { kind: "text"; body: string };
type Block = ListBlock | TextBlock;
type Section = { id: string; title: string | null; blocks: Block[] };

export const ACCESSIBILITY_SECTIONS: Section[] = [
  {
    id: "intro",
    title: null,
    blocks: [
      { kind: "text", body: "Tweaxly (“Tweaxly”, “we”, “our”, or “us”) is committed to making our website, platform, applications, and digital services accessible to as many users as possible, including individuals with disabilities." },
      { kind: "text", body: "We believe that accessibility is an important part of providing an inclusive and user-friendly experience for all users." },
    ],
  },
  {
    id: "commitment",
    title: "Our Commitment",
    blocks: [
      { kind: "text", body: "We strive to improve the accessibility and usability of our Services and aim to follow generally accepted accessibility standards and best practices." },
      { kind: "text", body: "Our primary target is conformance with the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA where reasonably applicable, and compatibility with WCAG 2.1 AA and WCAG 2.0 AA principles. We follow the four core WCAG principles: Perceivable, Operable, Understandable, and Robust." },
      { kind: "text", body: "Our goal is to continuously improve the user experience for all visitors and users of the platform, including individuals using assistive technologies such as screen readers, screen magnifiers, voice control, and keyboard-only navigation." },
    ],
  },
  {
    id: "widget",
    title: "Accessibility Toolbar",
    blocks: [
      { kind: "text", body: "Every page of the Services includes a floating accessibility button (bottom corner of the screen) that opens an accessibility toolbar. The toolbar lets you adjust the experience without leaving the page, including:" },
      { kind: "list", items: [
        "text size scaling (100%–200%);",
        "contrast modes including high contrast, dark high contrast, light high contrast, monochrome, and inverted;",
        "readable and dyslexia-friendly font modes;",
        "wider letter spacing and looser line height;",
        "highlight links and headings;",
        "pause animations, reduce motion, and stop flashing elements;",
        "reading guide and reading mask aids;",
        "enhanced focus outline and keyboard navigation mode;",
        "larger clickable areas and enlarged cursor; and",
        "a one-click reset to defaults.",
      ] },
      { kind: "text", body: "Your preferences are remembered on your device and applied automatically on future visits." },
    ],
  },
  {
    id: "features",
    title: "Accessibility Features",
    blocks: [
      { kind: "text", body: "The Services may include accessibility-related features such as:" },
      { kind: "list", items: [
        "keyboard navigation support;",
        "readable typography and scalable text;",
        "responsive layouts;",
        "semantic structure and headings;",
        "color contrast considerations;",
        "alternative text for certain visual elements;",
        "compatibility efforts with assistive technologies; and",
        "ongoing usability improvements.",
      ] },
      { kind: "text", body: "Because the platform is continuously evolving, certain areas or functionalities may not yet fully conform to all accessibility standards at all times." },
    ],
  },
  {
    id: "third-party",
    title: "Third-Party Content and Integrations",
    blocks: [
      { kind: "text", body: "Certain areas of the Services may rely on third-party tools, integrations, embedded content, APIs, or external platforms that are not fully controlled by Tweaxly." },
      { kind: "text", body: "We cannot guarantee the accessibility of third-party services or content." },
    ],
  },
  {
    id: "improvements",
    title: "Ongoing Improvements",
    blocks: [
      { kind: "text", body: "Tweaxly continuously works to improve accessibility as part of product development and ongoing platform updates." },
      { kind: "text", body: "Accessibility considerations may evolve over time as technologies, standards, and user needs change." },
    ],
  },
  {
    id: "feedback",
    title: "Feedback and Accessibility Requests",
    blocks: [
      { kind: "text", body: "If you encounter an accessibility issue, require assistance, or have suggestions regarding accessibility improvements, we encourage you to contact us." },
      { kind: "text", body: "We will make reasonable efforts to review and address accessibility-related requests where feasible." },
      { kind: "text", body: "Contact Information:" },
      { kind: "text", body: "Tweaxly" },
      { kind: "text", body: "Email: accessibility@tweaxly.com" },
      { kind: "text", body: "Website: Tweaxly" },
    ],
  },
  {
    id: "limitation",
    title: "Limitation",
    blocks: [
      { kind: "text", body: "While we strive to maintain accessible Services, we do not guarantee that all parts of the Services will always be fully accessible, uninterrupted, or error-free for every user or assistive technology." },
      { kind: "text", body: "Accessibility efforts are provided on a reasonable-efforts basis and may be limited by technological constraints, third-party systems, or platform changes." },
    ],
  },
  {
    id: "law",
    title: "Governing Law",
    blocks: [
      { kind: "text", body: "This Accessibility Statement shall be governed by the laws of the State of Israel." },
      { kind: "text", body: "Any disputes relating to this Accessibility Statement shall be subject to the exclusive jurisdiction of the competent courts located in Israel." },
    ],
  },
];

export default function AccessibilityContent() {
  return (
    <div className="space-y-8 text-slate-700 leading-relaxed">
      {ACCESSIBILITY_SECTIONS.map((s) => (
        <section key={s.id} id={s.id}>
          {s.title ? (
            <h2 className="text-lg font-semibold text-[color:var(--color-ink-strong)] mb-3">{s.title}</h2>
          ) : null}
          <div className="space-y-3 text-sm">
            {s.blocks.map((b, i) => {
              if (b.kind === "text") {
                return <p key={i}>{b.body}</p>;
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
