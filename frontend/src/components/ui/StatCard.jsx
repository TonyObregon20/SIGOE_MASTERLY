export default function StatCard({ label, value, icon: Icon, trend, color }) {
  const needsAttention = color === 'rose';
  return (
    <article className="flex min-w-0 flex-col justify-between gap-5 border border-shop-line bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs leading-5 text-shop-muted">{label}</p>
        {Icon && <Icon size={18} strokeWidth={1.5} className={needsAttention ? 'shrink-0 text-rose-700' : 'shrink-0 text-shop-blue'} />}
      </div>
      <div>
        <p className="break-words text-[clamp(23px,2.3vw,30px)] leading-tight font-medium tracking-tight tabular-nums">{value}</p>
        {trend && <p className={`mt-2 text-[11px] leading-5 ${needsAttention ? 'text-rose-700' : 'text-shop-muted'}`}>{trend}</p>}
      </div>
    </article>
  );
}
