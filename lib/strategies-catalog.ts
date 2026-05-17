import type { LucideIcon } from "lucide-react"
import {
  Zap,
  MessageSquare,
  Camera,
  Film,
  Users,
  Music,
} from "lucide-react"

export interface AdStrategyTemplate {
  id: string
  name: string
  description: string
  icon: LucideIcon
  avgRoi: number
  successRate: number
  bestFor: string
  tips: string[]
  color: string
  bgColor: string
  /** Which customer experience goals this strategy supports best */
  cxFit: string[]
}

export const AD_STRATEGIES: AdStrategyTemplate[] = [
  {
    id: "flash",
    name: "Flash Sale Urgency",
    description:
      "Time-limited offers that drive immediate action with countdowns, scarcity, and bold pricing in the first 2 seconds.",
    icon: Zap,
    avgRoi: 420,
    successRate: 87,
    bestFor: "Product launches, clearance, seasonal sales",
    tips: [
      "Use countdown text overlay in the first frame",
      "Show original price crossed out with sale price",
      "Add 'Limited Time' or 'Only X Left' urgency markers",
      "End with a direct 'Shop Now' CTA",
    ],
    color: "text-accent",
    bgColor: "bg-accent/10",
    cxFit: ["value-focused", "fast-friendly"],
  },
  {
    id: "social-proof",
    name: "Social Proof / Testimonials",
    description:
      "Real customer reactions and reviews to build trust and credibility with new audiences.",
    icon: MessageSquare,
    avgRoi: 380,
    successRate: 82,
    bestFor: "Trust building, new audiences, repeat customers",
    tips: [
      "Start with the customer's reaction, not your product",
      "Include real names and faces for authenticity",
      "Show before/after results when applicable",
      "Keep testimonials under 10 seconds each",
    ],
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
    cxFit: ["premium-experience", "support-first", "community-driven"],
  },
  {
    id: "product-demo",
    name: "Product Demo Showcase",
    description:
      "Quick demonstrations that show value instantly and educate buyers on key benefits.",
    icon: Camera,
    avgRoi: 350,
    successRate: 79,
    bestFor: "New products, feature highlights, education",
    tips: [
      "Show the product in use within the first 2 seconds",
      "Highlight the problem it solves immediately",
      "Use close-up shots for detail and quality",
      "Include pricing and a link at the end",
    ],
    color: "text-primary",
    bgColor: "bg-primary/10",
    cxFit: ["premium-experience", "fast-friendly"],
  },
  {
    id: "behind-scenes",
    name: "Behind the Scenes",
    description:
      "Human side of your business—process, team, and story—to create emotional connection.",
    icon: Film,
    avgRoi: 320,
    successRate: 75,
    bestFor: "Brand awareness, community building, storytelling",
    tips: [
      "Keep it raw and authentic—no over-production",
      "Show your face or team members for connection",
      "Tell a micro-story within 15 seconds",
      "End with a question to encourage engagement",
    ],
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
    cxFit: ["community-driven", "premium-experience"],
  },
  {
    id: "ugc",
    name: "UGC Style Content",
    description:
      "Native, phone-shot creative that feels organic to the feed and earns higher engagement.",
    icon: Users,
    avgRoi: 400,
    successRate: 85,
    bestFor: "High engagement, viral potential, younger audiences",
    tips: [
      "Film with a phone, not professional equipment",
      "Use natural lighting and casual settings",
      "Start with a hook question or surprising statement",
      "Mirror popular creator formats and trends",
    ],
    color: "text-primary",
    bgColor: "bg-primary/10",
    cxFit: ["fast-friendly", "community-driven", "value-focused"],
  },
  {
    id: "trending",
    name: "Trending Audio / Hook",
    description:
      "Ride trending sounds and viral formats for maximum algorithmic reach.",
    icon: Music,
    avgRoi: 360,
    successRate: 73,
    bestFor: "Reach expansion, discovery, viral potential",
    tips: [
      "Use currently trending audio from Reels explore page",
      "Adapt the trend to fit your product naturally",
      "Post within 48 hours of trend emergence",
      "Keep your product visible throughout the video",
    ],
    color: "text-accent",
    bgColor: "bg-accent/10",
    cxFit: ["fast-friendly", "value-focused"],
  },
]

export const CX_GOAL_OPTIONS = [
  { id: "premium-experience", label: "Premium experience", description: "White-glove feel, quality-first messaging" },
  { id: "fast-friendly", label: "Fast & friendly", description: "Quick answers, warm tone, easy buying" },
  { id: "value-focused", label: "Value focused", description: "Clear savings, bundles, and ROI for the buyer" },
  { id: "support-first", label: "Support first", description: "Trust, guarantees, and help-before-sale" },
  { id: "community-driven", label: "Community driven", description: "Belonging, UGC, and shared identity" },
] as const

export type CustomerExperienceGoal = (typeof CX_GOAL_OPTIONS)[number]["id"]

export function getStrategyById(id: string): AdStrategyTemplate | undefined {
  return AD_STRATEGIES.find((s) => s.id === id)
}

export function strategiesForCxGoal(goal: string): AdStrategyTemplate[] {
  return AD_STRATEGIES.filter((s) => s.cxFit.includes(goal))
}
