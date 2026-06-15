import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

type AssistantMetric = {
  label: string;
  value: string | number;
};

type AssistantAction = {
  label: string;
  href: string;
};

type RoyaltyAssistantPanelProps = {
  title?: string;
  subtitle?: string;
  metrics: AssistantMetric[];
  insights: string[];
  actions: AssistantAction[];
};

export function RoyaltyAssistantPanel({
  title = "Buenos dias.",
  subtitle = "Royalty Assistant encontro estas senales para ayudarte a decidir rapido.",
  metrics,
  insights,
  actions,
}: RoyaltyAssistantPanelProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-950 text-white shadow-[0_24px_80px_rgba(28,25,23,0.14)]">
      <div className="grid gap-6 p-5 md:p-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="flex flex-col justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
              <Sparkles size={14} />
              Royalty Assistant
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-normal md:text-4xl">{title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300">{subtitle}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-3xl font-semibold">{metric.value}</p>
                <p className="mt-1 text-sm text-stone-300">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-white p-4 text-stone-950 md:p-5">
          <p className="text-sm font-semibold">Lectura rapida</p>
          <div className="mt-4 grid gap-2">
            {insights.map((insight) => (
              <div key={insight} className="rounded-2xl bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
                {insight}
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {actions.map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                className={[
                  "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition",
                  index === 0
                    ? "bg-stone-950 text-white hover:bg-stone-800"
                    : "border border-stone-200 bg-white text-stone-800 hover:bg-stone-50",
                ].join(" ")} prefetch={false}>
                {action.label}
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
