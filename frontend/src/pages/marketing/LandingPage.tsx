import { FeatureGrid } from '@/pages/marketing/sections/FeatureGrid'
import { FinalCta } from '@/pages/marketing/sections/FinalCta'
import { Hero } from '@/pages/marketing/sections/Hero'
import { HowItWorks } from '@/pages/marketing/sections/HowItWorks'
import { MarketingFooter } from '@/pages/marketing/sections/MarketingFooter'
import { MarketingNav } from '@/pages/marketing/sections/MarketingNav'
import { Personas } from '@/pages/marketing/sections/Personas'
import { ProblemNarrative } from '@/pages/marketing/sections/ProblemNarrative'
import { ProofPoints } from '@/pages/marketing/sections/ProofPoints'

export function LandingPage() {
  return (
    <div className="min-h-svh">
      <MarketingNav />
      <Hero />
      <ProofPoints />
      <ProblemNarrative />
      <HowItWorks />
      <FeatureGrid />
      <Personas />
      <FinalCta />
      <MarketingFooter />
    </div>
  )
}
