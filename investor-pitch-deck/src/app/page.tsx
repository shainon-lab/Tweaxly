import DeckNav from "@/components/DeckNav";
import Slide01Cover from "@/components/slides/Slide01Cover";
import Slide02Problem from "@/components/slides/Slide02Problem";
import Slide03Insight from "@/components/slides/Slide03Insight";
import Slide04ToolsFail from "@/components/slides/Slide04ToolsFail";
import Slide05Solution from "@/components/slides/Slide05Solution";
import Slide06Philosophy from "@/components/slides/Slide06Philosophy";
import Slide07Product from "@/components/slides/Slide07Product";
import Slide08Signals from "@/components/slides/Slide08Signals";
import Slide09AiCfo from "@/components/slides/Slide09AiCfo";
import Slide10Icp from "@/components/slides/Slide10Icp";
import Slide11WhyNow from "@/components/slides/Slide11WhyNow";
import Slide12Market from "@/components/slides/Slide12Market";
import Slide13Competition from "@/components/slides/Slide13Competition";
import Slide14Moat from "@/components/slides/Slide14Moat";
import Slide15Roadmap from "@/components/slides/Slide15Roadmap";
import Slide16Vision from "@/components/slides/Slide16Vision";

const TOTAL = 16;

export default function Deck() {
  return (
    <div className="deck">
      <Slide01Cover total={TOTAL} />
      <Slide02Problem total={TOTAL} />
      <Slide03Insight total={TOTAL} />
      <Slide04ToolsFail total={TOTAL} />
      <Slide05Solution total={TOTAL} />
      <Slide06Philosophy total={TOTAL} />
      <Slide07Product total={TOTAL} />
      <Slide08Signals total={TOTAL} />
      <Slide09AiCfo total={TOTAL} />
      <Slide10Icp total={TOTAL} />
      <Slide11WhyNow total={TOTAL} />
      <Slide12Market total={TOTAL} />
      <Slide13Competition total={TOTAL} />
      <Slide14Moat total={TOTAL} />
      <Slide15Roadmap total={TOTAL} />
      <Slide16Vision total={TOTAL} />
      <DeckNav total={TOTAL} />
    </div>
  );
}
