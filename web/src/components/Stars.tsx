export function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={`text-lg leading-none ${n <= value ? "text-accent-500" : "text-brand-200"} ${onChange ? "cursor-pointer" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
