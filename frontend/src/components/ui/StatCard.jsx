const cardTones = {
  emerald: { panel: 'border-emerald-200/70 bg-emerald-50/45', icon: 'text-emerald-700' },
  blue: { panel: 'border-sky-200/70 bg-sky-50/50', icon: 'text-shop-blue' },
  indigo: { panel: 'border-indigo-200/65 bg-indigo-50/40', icon: 'text-indigo-600' },
  rose: { panel: 'border-rose-200/70 bg-rose-50/45', icon: 'text-rose-700' },
  teal: { panel: 'border-teal-200/70 bg-teal-50/45', icon: 'text-teal-700' },
};
const neutralTone = { panel: 'border-shop-line bg-white', icon: 'text-shop-blue' };

export default function StatCard({ label, value, icon: Icon, trend, color }) {
  const tone = cardTones[color] || neutralTone;
  const needsAttention = color === 'rose';
  return (
    <article className={`flex min-w-0 flex-col justify-between gap-5 border p-5 sm:p-6 ${tone.panel}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs leading-5 text-shop-muted">{label}</p>
        {Icon && <Icon size={18} strokeWidth={1.5} className={`shrink-0 ${tone.icon}`} />}
      </div>
      <div>
        <p className="break-words text-[clamp(23px,2.3vw,30px)] leading-tight font-medium tracking-tight tabular-nums">{value}</p>
        {trend && <p className={`mt-2 text-[11px] leading-5 ${needsAttention ? 'text-rose-700' : 'text-shop-muted'}`}>{trend}</p>}
      </div>
    </article>
  );
}
