import React from "react";

function SidebarItem({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-500"}`} />
      {label}
    </button>
  );
}

export default SidebarItem;
