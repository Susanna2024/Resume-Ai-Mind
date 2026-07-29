import { useCallback, useState } from "react"
import { translations } from "../i18n"
import type { Language } from "../lib/types"

export default function CVDropZone({
  label = "",
  onFileLoaded,
  language = "en",
}: {
  label?: string
  // Modificato: ora restituisce direttamente l'oggetto File grezzo al genitore
  onFileLoaded: (file: File) => void
  language?: Language | string | any
}) {
  const langString = 
    typeof language === "string" ? language :
    (language && typeof language === "object" && typeof language.code === "string" ? language.code : 
    (typeof window !== "undefined" ? localStorage.getItem("language") || "en" : "en"))

  const langKey = ["it", "es", "en"].includes(langString?.toLowerCase()) ? langString.toLowerCase() : "en"
  const t = (translations as any)[langKey] || translations.en

  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState("")
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const textMap = {
    it: {
      drop: "Trascina qui il tuo CV",
      only: "Solo PDF, oppure",
      upload: "Carica PDF",
      change: "Cambia PDF",
      invalidFormat: "Formato non valido. Carica un file PDF."
    },
    es: {
      drop: "Arrastra tu CV aquí",
      only: "Solo PDF, o",
      upload: "Subir PDF",
      change: "Cambiar PDF",
      invalidFormat: "Formato no válido. Por favor, sube un archivo PDF."
    },
    en: {
      drop: "Drop your CV here",
      only: "PDF only, or",
      upload: "Upload PDF",
      change: "Change PDF",
      invalidFormat: "Invalid format. Please upload a PDF file."
    }
  }

  const currentTexts = textMap[langKey as keyof typeof textMap] || textMap.en

  const processFile = (file: File) => {
    // Controllo rigoroso sul tipo MIME o sull'estensione per i dispositivi mobili
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    
    if (!file || !isPdf) {
      setErrorKey("invalidFormat")
      setFileName("")
      return
    }

    setErrorKey(null)
    setFileName(file.name)
    // Passiamo il file grezzo al genitore per l'invio via FormData al backend
    onFileLoaded(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }, [])

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-text-main mb-2">
        {label}
      </label>
      
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative w-full h-48 bg-surface border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-3 px-4 shadow-sm ${
          dragging ? "border-[#5993ef] bg-[#5993ef]/10" : "border-border hover:border-[#5993ef]/50"
        }`}
      >
        {errorKey && (
          <p className="text-red-500 text-xs font-semibold text-center px-2">
            {(currentTexts as any)[errorKey] || currentTexts.invalidFormat}
          </p>
        )}

        {!errorKey && fileName && (
          <div className="flex flex-col items-center space-y-1 text-center">
            <span className="text-emerald-500 font-bold text-lg">✓</span>
            <p className="text-text-main text-sm font-semibold break-all px-2">
              {fileName}
            </p>
          </div>
        )}

        {!fileName && !errorKey && (
          <>
            <p className="text-text-main text-sm font-medium text-center">
              {t.dropCv || currentTexts.drop}
            </p>
            <p className="text-text-muted text-xs">
              {t.pdfOnly || currentTexts.only}
            </p>
          </>
        )}

        <label className="cursor-pointer bg-background hover:bg-surface-2 text-text-main border border-border text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs">
          {fileName ? (t.changePdf || currentTexts.change) : (t.uploadPdf || currentTexts.upload)}
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          />
        </label>
      </div>
    </div>
  )
}