export default function JobOfferInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-muted mb-2">Job offer</label>
      <textarea
        className="w-full h-48 bg-surface border border-border rounded-xl p-3 text-ink resize-none focus:outline-none focus:border-match text-sm placeholder:text-ink-faint"
        placeholder="Paste the job description here…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
