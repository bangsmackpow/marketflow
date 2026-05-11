import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { authClient } from "../lib/auth-client";
import { apiFetch } from "../lib/api";
import CircularCompletenessMeter from "../components/dashboard/CompletenessMeter";
import MarketingLevelSelector from "../components/dashboard/MarketingLevelSelector";
import SkillWorkbench from "../components/skills/SkillWorkbench";

interface Skill {
  id: string;
  slug: string;
  title: string;
  category: string;
  markdownContent: string;
  metadata: Record<string, unknown> | null;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedLevel, setSelectedLevel] = useState("basic");
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await authClient.getSession();
      return data;
    },
  });

  const activeCompanyId = session?.session.activeOrganizationId;

  const { data: skillsData } = useQuery({
    queryKey: ["skills"],
    queryFn: () => apiFetch<{ skills: Skill[] }>("/skills"),
  });

  const { data: scoreData } = useQuery({
    queryKey: ["score", activeCompanyId],
    queryFn: () =>
      apiFetch<{ score: number; completed: number; total: number }>("/tasks/score"),
    enabled: !!activeCompanyId,
    refetchInterval: 5000,
  });

  const { data: companyData } = useQuery({
    queryKey: ["company-settings", activeCompanyId],
    queryFn: () =>
      apiFetch<{
        settings: { industry: string | null };
        company: { id: string; name: string; slug: string };
      }>("/companies/settings"),
    enabled: !!activeCompanyId,
  });

  const toggleMutation = useMutation({
    mutationFn: (taskId: string) =>
      apiFetch("/tasks/toggle", {
        method: "POST",
        body: JSON.stringify({ taskId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["score"] });
    },
  });

  if (activeSkill) {
    return <SkillWorkbench skill={activeSkill} onBack={() => setActiveSkill(null)} />;
  }

  const categories = skillsData?.skills
    ? [...new Set(skillsData.skills.map((s) => s.category))]
    : [];

  const skillsByCategory = skillsData?.skills
    ? skillsData.skills.reduce<Record<string, Skill[]>>((acc, skill) => {
        if (!acc[skill.category]) acc[skill.category] = [];
        acc[skill.category].push(skill);
        return acc;
      }, {})
    : {};

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--clr-surface-foreground, #212529)" }}>
            Marketing Dashboard
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--clr-muted-foreground, #868e96)" }}>
            {companyData?.company.name || "Your company"}
          </p>
        </div>
        <button className="btn-ghost flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card flex flex-col items-center justify-center lg:col-span-1">
          <CircularCompletenessMeter score={scoreData?.score || 0} />
          <p className="mt-3 text-xs" style={{ color: "var(--clr-muted-foreground, #868e96)" }}>
            {scoreData?.completed || 0} of {scoreData?.total || 0} tasks complete
          </p>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--clr-surface-foreground, #212529)" }}>
            Marketing Level
          </h3>
          <MarketingLevelSelector selected={selectedLevel} onSelect={setSelectedLevel} />
        </div>
      </div>

      <div className="space-y-6">
        {categories.map((category) => {
          const skills = skillsByCategory[category] || [];
          return (
            <div key={category}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--clr-muted-foreground, #868e96)" }}>
                {category}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {skills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} onOpen={() => setActiveSkill(skill)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SkillCard({ skill, onOpen }: { skill: Skill; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="card !p-4 text-left transition-all duration-200 hover:shadow-md hover:border-[var(--clr-primary,#0070c4)] group"
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
          style={{
            backgroundColor: "var(--clr-muted, #f1f3f5)",
            color: "var(--clr-primary, #0070c4)",
          }}
        >
          {skill.title.charAt(0)}
        </div>
        <h4 className="text-sm font-semibold group-hover:text-[var(--clr-primary,#0070c4)] transition-colors"
          style={{ color: "var(--clr-surface-foreground, #212529)" }}>
          {skill.title}
        </h4>
      </div>
      <p className="text-xs line-clamp-2" style={{ color: "var(--clr-muted-foreground, #868e96)" }}>
        {(skill.metadata as Record<string, string>)?.description || ""}
      </p>
    </button>
  );
}
