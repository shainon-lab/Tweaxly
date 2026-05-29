// Shared "How Advisory works" help modal used by every page in the
// Advisory section (New Advisory, Suggested, History). One source of
// truth - if the explainer copy ever changes, all three pages stay
// in sync.

import HowItWorks from "@/components/HowItWorks";
import { MessageSquareText, Sparkles, History, Lightbulb } from "lucide-react";

export default function AdvisoryHelp() {
  return (
    <HowItWorks
      title="How Advisory works"
      intro="Free-form Q&A about your business. The advisor sees your full financial picture, business profile, and recent activity. Ask anything in plain business English; the advisor speaks the same back."
      cards={[
        { icon: <MessageSquareText size={16} strokeWidth={1.7} />, title: "New Advisory",     body: "Type a question, hit Analyze. Answers are grounded in YOUR numbers and YOUR business context, not generic templates. The advisor can talk about strategy, growth ideas, hiring, vendor choices, pricing - not just numbers." },
        { icon: <Lightbulb size={16} strokeWidth={1.7} />,         title: "Suggested",        body: "AI-curated questions worth asking right now, ranked by what's actionable or otherwise important in this workspace. Click Consult on any card to land directly on the answer." },
        { icon: <History size={16} strokeWidth={1.7} />,           title: "History",          body: "Every past consultation is kept. Scroll back through previous Q&As to compare what changed, revisit advice you acted on, or pick up a thread you started earlier." },
        { icon: <Sparkles size={16} strokeWidth={1.7} />,          title: "AI credits",       body: "A simple question costs 1 credit. A deep analysis on a signal costs 3. Generating a fresh forecast or running a scenario costs 5. Credits replenish per your plan." },
      ]}
      outro="If a topic isn't useful, ignore the response and ask differently. The advisor is best when you ask the kind of question you'd ask a human CFO - specific, contextual, decision-oriented."
    />
  );
}
