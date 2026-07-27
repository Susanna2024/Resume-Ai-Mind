import { translations } from "../i18n"
import type { Language } from "../lib/types"

export default function JobOfferInput({
  value,
  onChange,
  language,
}: {
  value: string
  onChange: (v: string) => void
  language: Language
}) {
  const t = translations[language]

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-text-main">
        {t.jobOffer}
      </label>
      <textarea
        className="w-full h-48 bg-surface border border-border rounded-xl p-3 text-ink resize-none focus:outline-none focus:border-match text-sm placeholder:text-ink-faint"
        placeholder={t.jobDescriptionPlaceholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}