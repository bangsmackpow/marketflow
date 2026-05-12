import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Target, Layers, ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { authClient } from "../../lib/auth-client";
import { getDesignProfile, applyDesignProfile } from "../../lib/design-system";
import { apiFetch } from "../../lib/api";

interface WizardData {
  companyName: string;
  slug: string;
  industry: string;
  audience: string;
  goal: string;
  selectedLevel: string;
}

const INDUSTRIES = [
  { value: "technology", label: "Technology / Software" },
  { value: "saas", label: "SaaS / Cloud" },
  { value: "ecommerce", label: "E-commerce / Retail" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance / Insurance" },
  { value: "legal", label: "Legal Services" },
  { value: "education", label: "Education / Training" },
  { value: "hospitality", label: "Hospitality / Travel" },
  { value: "real-estate", label: "Real Estate" },
  { value: "construction", label: "Construction / Contractor" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "nonprofit", label: "Nonprofit / Charity" },
  { value: "creative", label: "Creative / Design Agency" },
  { value: "consulting", label: "Consulting" },
  { value: "wellness", label: "Wellness / Fitness" },
  { value: "food", label: "Food & Beverage" },
  { value: "transportation", label: "Transportation / Logistics" },
  { value: "energy", label: "Energy / Utilities" },
  { value: "media", label: "Media / Publishing" },
  { value: "other", label: "Other" },
];

const LEVEL_RECOMMENDATIONS: Record<string, { level: string; reason: string }> = {
  construction: { level: "basic", reason: "Local businesses typically start with foundational marketing tools like Google Business Profile and local SEO." },
  realestate: { level: "basic", reason: "Real estate professionals benefit most from building a strong local presence first." },
  hospitality: { level: "basic", reason: "Hospitality businesses see quick wins with basic listing optimization and review management." },
  healthcare: { level: "pro", reason: "Healthcare providers need a balance of foundational setup and content marketing for patient education." },
  finance: { level: "pro", reason: "Financial services require authority building through content while maintaining compliance." },
  saas: { level: "advanced", reason: "SaaS companies need full-funnel marketing from SEO through conversion optimization." },
  technology: { level: "advanced", reason: "Tech companies benefit from the full suite of marketing skills for competitive advantage." },
  ecommerce: { level: "pro", reason: "E-commerce businesses need a mix of SEO, paid ads, and conversion rate optimization." },
};

const STEPS = [
  { id: "business", label: "Business", icon: Building2 },
  { id: "audience", label: "Audience", icon: Target },
  { id: "level", label: "Level", icon: Layers },
];

export default function WelcomeWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<WizardData>({
    companyName: "",
    slug: "",
    industry: "",
    audience: "",
    goal: "",
    selectedLevel: "basic",
  });

  function update(fields: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...fields }));
  }

  async function handleFinish() {
    setLoading(true);
    setError("");

    const { data: org, error: orgError } = await authClient.organization.create({
      name: data.companyName,
      slug: data.slug,
    });

    if (orgError) {
      setError(orgError.message || "Failed to create company");
      setLoading(false);
      return;
    }

    if (org?.id) {
      await authClient.organization.setActive({ organizationId: org.id });
    }

    const profile = getDesignProfile(data.industry);
    applyDesignProfile(profile);

    navigate("/");
  }

  function handleNameChange(val: string) {
    const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    update({ companyName: val, slug });
  }

  const recommendation = LEVEL_RECOMMENDATIONS[data.industry];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold" style={{ color: "var(--clr-surface-foreground, #212529)" }}>
            Welcome to MarketFlow
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--clr-muted-foreground, #868e96)" }}>
            Let's get your marketing engine started
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      i < step
                        ? "bg-green-600 text-white"
                        : i === step
                        ? "text-white"
                        : "bg-surface-200 text-surface-500"
                    }`}
                    style={i === step ? { backgroundColor: "var(--clr-primary, #0070c4)" } : {}}
                  >
                    {i < step ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className="mt-1 text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--clr-muted-foreground, #868e96)" }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="mx-3 h-px w-16 bg-surface-200" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 h-1 w-full rounded-full bg-surface-200">
            <div
              className="h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: "var(--clr-primary, #0070c4)" }}
            />
          </div>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="h-5 w-5" style={{ color: "var(--clr-primary, #0070c4)" }} />
                <h3 className="text-lg font-semibold" style={{ color: "var(--clr-surface-foreground, #212529)" }}>
                  Tell us about your business
                </h3>
              </div>
              <div>
                <label className="label">Company name</label>
                <input type="text" className="input" placeholder="Acme Marketing Co." value={data.companyName} onChange={(e) => handleNameChange(e.target.value)} />
              </div>
              <div>
                <label className="label">URL slug</label>
                <div className="flex items-center rounded-lg border border-surface-300 bg-surface-50 px-3 text-sm text-surface-500">
                  <span>marketflow.app/</span>
                  <input type="text" className="input flex-1 border-0 bg-transparent px-0" placeholder="acme-co" value={data.slug} onChange={(e) => update({ slug: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Industry</label>
                <select className="input" value={data.industry} onChange={(e) => update({ industry: e.target.value })}>
                  <option value="">Select your industry</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.value} value={ind.value}>{ind.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-5 w-5" style={{ color: "var(--clr-primary, #0070c4)" }} />
                <h3 className="text-lg font-semibold" style={{ color: "var(--clr-surface-foreground, #212529)" }}>
                  Define your audience & goals
                </h3>
              </div>
              <div>
                <label className="label">Target audience</label>
                <textarea className="input min-h-[80px] resize-y" placeholder="Describe your ideal customer: industry, company size, job titles, pain points..." value={data.audience} onChange={(e) => update({ audience: e.target.value })} />
              </div>
              <div>
                <label className="label">Primary marketing goal</label>
                <select className="input" value={data.goal} onChange={(e) => update({ goal: e.target.value })}>
                  <option value="">Select your primary goal</option>
                  <option value="brand-awareness">Build brand awareness</option>
                  <option value="lead-generation">Generate leads</option>
                  <option value="sales">Increase sales / revenue</option>
                  <option value="seo">Improve search rankings</option>
                  <option value="retention">Customer retention</option>
                  <option value="community">Build a community</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-5 w-5" style={{ color: "var(--clr-primary, #0070c4)" }} />
                <h3 className="text-lg font-semibold" style={{ color: "var(--clr-surface-foreground, #212529)" }}>
                  Choose your marketing level
                </h3>
              </div>

              {recommendation && (
                <div
                  className="rounded-lg border bg-blue-50 border-blue-200 px-4 py-3 text-sm text-blue-800"
                >
                  <p className="font-medium">Recommendation: {recommendation.level.charAt(0).toUpperCase() + recommendation.level.slice(1)}</p>
                  <p className="mt-1 text-blue-700">{recommendation.reason}</p>
                </div>
              )}

              <div className="space-y-3">
                {[
                  { id: "basic", label: "Basic", desc: "Essential marketing foundation. Google Business, local SEO, basic analytics." },
                  { id: "pro", label: "Pro", desc: "Growth-oriented. Content marketing, email sequences, paid ads." },
                  { id: "advanced", label: "Advanced", desc: "Full marketing maturity. CRO, automation, advanced analytics." },
                ].map((level) => (
                  <button
                    key={level.id}
                    onClick={() => update({ selectedLevel: level.id })}
                    className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                      data.selectedLevel === level.id
                        ? "border-[var(--clr-primary,#0070c4)] bg-[var(--clr-primary,#0070c4)]/5"
                        : "border-surface-200 hover:border-surface-300"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        data.selectedLevel === level.id
                          ? "border-[var(--clr-primary,#0070c4)]"
                          : "border-surface-300"
                      }`}
                    >
                      {data.selectedLevel === level.id && (
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--clr-primary, #0070c4)" }} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-900">{level.label}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{level.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-surface-100 pt-5">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="btn-ghost flex items-center gap-2 text-sm">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 0 && (!data.companyName || !data.slug || !data.industry)) ||
                  (step === 1 && (!data.audience || !data.goal))
                }
                className="btn-primary flex items-center gap-2"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading || !data.selectedLevel}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Complete Setup
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
