import { useCallback, useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { translations } from "../i18n"
import type { Language } from "../lib/types"

// Configurazione sicura del worker locale tramite Vite per evitare blocchi CDN su mobile
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    
    let text = ""
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map((item: any) => item.str).join(" ") + "\n"
    }
    return text.trim()
  } catch (error) {
    console.error("Errore durante l'estrazione del PDF:", error)
    throw new Error("Impossibile leggere il file PDF. Assicurati che non sia protetto o danneggiato.")
  }
}

export default function CVDropZone({
  label = "",
  onFileLoaded,
  language = "en",
}: {
  label?: string
  onFileLoaded: (text: string) => void
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
  const [loadingFile, setLoadingFile] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const processFile = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      setErrorMessage("Formato non valido. Carica un file PDF.")
      return
    }
    setLoadingFile(true)
    setErrorMessage(null)

    try {
      const text = await extractTextFromPDF(file)
      onFileLoaded(text)
      setFileName(file.name)
    } catch (err: any) {
      setErrorMessage(err.message || "Errore di lettura")
      setFileName("")
    } finally {
      setLoadingFile(false)
    }
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }, [])

  const textMap = {
    it: {
      reading: "lettura PDF in corso…",
      drop: "Trascina qui il tuo CV",
      only: "Solo PDF, oppure",
      upload: "Carica PDF",
      change: "Cambia PDF",
    },
    es: {
      reading: "leyendo PDF…",
      drop: "Arrastra tu CV aquí",
      only: "Solo PDF, o",
      upload: "Subir PDF",
      change: "Cambiar PDF",
    },
    en: {
      reading: "reading PDF…",
      drop: "Drop your CV here",
      only: "PDF only, or",
      upload: "Upload PDF",
      change: "Change PDF",
    }
  }

  const currentTexts = textMap[langKey as keyof typeof textMap] || textMap.en

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
        {loadingFile && (
          <div className="flex items-center space-x-2">
           <div className="w-4 h-4 border-2 border-[#5993ef] border-t-transparent rounded-full animate-spin" /> 
            <p className="text-[#5993ef] text-sm font-medium">
              {t.readingPdf || currentTexts.reading}
            </p>
          </div>
        )}

        {!loadingFile && errorMessage && (
          <p className="text-red-500 text-xs font-semibold text-center px-2">
            {errorMessage}
          </p>
        )}

        {!loadingFile && !errorMessage && fileName && (
          <div className="flex flex-col items-center space-y-1 text-center">
            <span className="text-emerald-500 font-bold text-lg">✓</span>
            <p className="text-text-main text-sm font-semibold break-all px-2">
              {fileName}
            </p>
          </div>
        )}

        {!loadingFile && !fileName && !errorMessage && (
          <>
            <p className="text-text-main text-sm font-medium text-center">
              {t.dropCv || currentTexts.drop}
            </p>
            <p className="text-text-muted text-xs">
              {t.pdfOnly || currentTexts.only}
            </p>
          </>
        )}

        {!loadingFile && (
          <label className="cursor-pointer bg-background hover:bg-surface-2 text-text-main border border-border text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs">
            {fileName ? (t.changePdf || currentTexts.change) : (t.uploadPdf || currentTexts.upload)}
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            />
          </label>
        )}
      </div>
    </div>
  )
}