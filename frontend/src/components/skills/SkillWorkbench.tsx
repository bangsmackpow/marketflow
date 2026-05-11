import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, ArrowLeft } from "lucide-react";
import { apiFetch } from "../../lib/api";
import ContextSlider from "../ui/ContextSlider";
import ExportToolbar from "../shared/ExportToolbar";

interface Skill {
  id: string;
  slug: string;
  title: string;
  category: string;
  markdownContent: string;
  metadata: Record<string, unknown> | null;
}

interface SkillWorkbenchProps {
  skill: Skill;
  onBack: () => void;
}

interface FormField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: string[];
}

function extractFormFields(skill: Skill): FormField[] {
  const md = skill.markdownContent.toLowerCase();
  const fields: FormField[] = [];

  if (md.includes("target audience") || md.includes("audience")) {
    fields.push({ key: "target_audience", label: "Target Audience", type: "textarea", placeholder: "Describe your target audience..." });
  }
  if (md.includes("goal") || md.includes("objective")) {
    fields.push({ key: "goal", label: "Campaign Goal", type: "text", placeholder: "e.g., Increase conversions by 20%" });
  }
  if (md.includes("budget")) {
    fields.push({ key: "budget", label: "Budget", type: "text", placeholder: "e.g., $5,000/month" });
  }
  if (md.includes("channel") || md.includes("platform")) {
    fields.push({
      key: "channel", label: "Primary Channel", type: "select",
      options: ["Email", "Social Media", "Search", "Display", "Direct Mail", "Events"],
    });
  }
  if (md.includes("timeline") || md.includes("deadline")) {
    fields.push({ key: "timeline", label: "Timeline", type: "text", placeholder: "e.g., 2 weeks" });
  }
  if (md.includes("competitor")) {
    fields.push({ key: "competitors", label: "Key Competitors", type: "textarea", placeholder: "List main competitors..." });
  }
  if (md.includes("message") || md.includes("copy")) {
    fields.push({ key: "key_message", label: "Key Message", type: "textarea", placeholder: "What is the core message?" });
  }
  if (md.includes("offer") || md.includes("cta")) {
    fields.push({ key: "cta", label: "Call to Action", type: "text", placeholder: "e.g., Get Started Free" });
  }

  if (fields.length === 0) {
    fields.push({ key: "description", label: "Describe your needs", type: "textarea", placeholder: "What would you like help with?" });
    fields.push({ key: "goal", label: "What are you trying to achieve?", type: "text", placeholder: "Describe your goal..." });
  }

  return fields;
}

export default function SkillWorkbench({ skill, onBack }: SkillWorkbenchProps) {
  const [technicalView, setTechnicalView] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null);

  const fields = extractFormFields(skill);

  const generateMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiFetch<{ output: string; taskId: string }>("/generate", {
        method: "POST",
        body: JSON.stringify({ skillId: skill.id, formData: data }),
      }),
    onSuccess: (data) => {
      setGeneratedOutput(data.output);
    },
  });

  function handleFieldChange(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function handleGenerate() {
    generateMutation.mutate(formData);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost flex items-center gap-2 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to skills
        </button>
        <ContextSlider technicalView={technicalView} onToggle={() => setTechnicalView(!technicalView)} />
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-semibold text-surface-900">{skill.title}</h3>
          <span className="rounded-md bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-600">
            {skill.category}
          </span>
        </div>

        {technicalView ? (
          <div className="prose prose-sm max-w-none prose-headings:text-surface-900 prose-p:text-surface-700 prose-code:text-surface-900 prose-code:bg-surface-100 prose-code:px-1 prose-code:rounded">
            <Markdown remarkPlugins={[remarkGfm]}>{skill.markdownContent}</Markdown>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="label">{field.label}</label>
                  {field.type === "select" ? (
                    <select
                      className="input"
                      value={formData[field.key] || ""}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      className="input min-h-[80px] resize-y"
                      placeholder={field.placeholder}
                      value={formData[field.key] || ""}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    />
                  ) : (
                    <input
                      type="text"
                      className="input"
                      placeholder={field.placeholder}
                      value={formData[field.key] || ""}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {generateMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Asset
                </>
              )}
            </button>

            {generateMutation.isError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {generateMutation.error?.message || "Generation failed"}
              </div>
            )}

            {generatedOutput && (
              <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand-600" />
                    <span className="text-sm font-semibold text-surface-900">Generated Asset</span>
                  </div>
                  <ExportToolbar content={generatedOutput} platform="general" />
                </div>
                <div className="prose prose-sm max-w-none prose-headings:text-surface-900 prose-p:text-surface-700">
                  <Markdown remarkPlugins={[remarkGfm]}>{generatedOutput}</Markdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
