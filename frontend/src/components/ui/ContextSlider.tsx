interface ContextSliderProps {
  technicalView: boolean;
  onToggle: () => void;
}

export default function ContextSlider({ technicalView, onToggle }: ContextSliderProps) {
  return (
    <button
      onClick={onToggle}
      className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 transition-colors"
      role="switch"
      aria-checked={technicalView}
    >
      <span className={technicalView ? "text-surface-900 font-medium" : ""}>Simple</span>
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
          technicalView ? "bg-brand-600" : "bg-surface-300"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
            technicalView ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      <span className={!technicalView ? "text-surface-900 font-medium" : ""}>Technical</span>
    </button>
  );
}
