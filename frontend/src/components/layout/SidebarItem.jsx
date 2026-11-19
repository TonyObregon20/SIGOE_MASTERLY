export default function SidebarItem({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-10 w-full items-center gap-3 border-l-2 px-3 py-2 text-left text-[13px] transition-colors motion-reduce:transition-none ${active ? 'border-shop-sky bg-white/10 font-medium text-white' : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white'}`}
    >
      <Icon size={17} strokeWidth={1.6} className={active ? 'shrink-0 text-shop-sky' : 'shrink-0 text-slate-400'} />
      {label}
    </button>
  );
}
