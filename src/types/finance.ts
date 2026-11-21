export type MainTab = "literacy" | "accounting" | "banking" | "assistant" | "practice";

export type LiteracyTabId = "budget" | "compound" | "inflation" | "mortgage" | "debts";

export type AccountingTabId = "trainer" | "oneC" | "osv" | "balance" | "opiu" | "dds";

export type BankingServiceId = "compare" | "accounts" | "acquiring" | "credit" | "guarantee" | "sync1c";

export type VisualDomainType = "literacy" | "balance" | "opiu" | "dds" | "osv_1c" | "banking";

export type MentorMood = "idle" | "explaining" | "celebrating" | "guiding";

export type SfxType = "coin" | "water" | "bricks" | "harvest" | "worm_shield" | "travel";

export interface ComparisonOption {
  name: string;
  costOrReturn: string;
  netBenefit: string;
  pros: string;
  cons: string;
  isWinner?: boolean;
}

export interface ComparisonBlock {
  title: string;
  winnerLabel: string;
  verdict: string;
  options: ComparisonOption[];
}

export interface CompassStructuredResponse {
  shortAnswer?: string;
  explanation: string;
  stepByStep?: string[];
  guidingQuestion?: string;
  guidingHint?: string;
  sceneDescription: string;
  sfxType: SfxType;
  expertSummary: string;
  visualType: VisualDomainType;
  journalEntry?: string;
  doc1C?: string;
  formulaLabel?: string;
  exampleCalculation?: string;
  keyMetricLabel?: string;
  keyMetricValue?: string;
  comparison?: ComparisonBlock;
}

export interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  question?: string;
  response?: CompassStructuredResponse;
  error?: string;
}
