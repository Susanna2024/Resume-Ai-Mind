import { useCallback, useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { translations } from "../i18n"
import type { Language } from "../lib/types"

// Configurazione sicura del worker locale tramite Vite per dispositivi mobili
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onerror = () => reject("readError")
    
    reader.onload = async () => {
      try {
        const typedArray = new Uint8Array(reader.result as ArrayBuffer)
        const loadingTask = pdfjsLib.getDocument({ data: typedArray })
        const pdf = await loadingTask.promise
        
        let text = ""
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items.map((item: any) => item.str).join(" ") + "\n"
        }
        
        const trimmed = text.trim()
        if (!trimmed) {
          // Se è vuoto, restituiamo un'indicazione speciale ma non blocchiamo brutalmente
          resolve("[FILE_GREZZO_DA_BACKEND]")
          return
        }
        resolve(trimmed)
      } catch (error) {
        console.warn("Parsing client fallito, delego al backend:", error)
        // Fallback: se il client fallisce (es. file da cloud mobile), passiamo il controllo al backend
        resolve("[FILE_GREZZO_DA_BACKEND]")
      }
    }

    reader.readAsArrayBuffer(file)
  })
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
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const textMap = {
    it: {
      reading: "lettura PDF in corso…",
      drop: "Trascina qui il tuo CV",
      only: "Solo PDF, oppure",
      upload: "Carica PDF",
      change: "Cambia PDF",
      invalidFormat: "Formato non valido. Carica un file PDF."
    },
    es: {
      reading: "leyendo PDF…",
      drop: "Arrastra tu CV aquí",
      only: "Solo PDF, o",
      upload: "Subir PDF",
      change: "Cambiar PDF",
      invalidFormat: "Formato no válido. Por favor, sube un archivo PDF."
    },
    en: {
      reading: "reading PDF…",
      drop: "Drop your CV here",
      only: "PDF only, or",
      upload: "Upload PDF",
      change: "Change PDF",
      invalidFormat: "Invalid format. Please upload a PDF file."
    }
  }

  const currentTexts = textMap[langKey as keyof typeof textMap] || textMap.en

  const processFile = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      setErrorKey("invalidFormat")
      return
    }
    setLoadingFile(true)
    setErrorKey(null)

    try {
      const text = await extractTextFromPDF(file)
      // Se il client ha delegato, passiamo un'etichetta o il nome file gestibile dal backend
      onFileLoaded(text === "[FILE_GREZZO_DA_BACKEND]" ? `[FILE:${file.name}]` : text)
      setFileName(file.name)
    } catch (errKey: any) {
      setErrorKey(errKey || "invalidFormat")
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

        {!loadingFile && errorKey && (
          <p className="text-red-500 text-xs font-semibold text-center px-2">
            {(currentTexts as any)[errorKey] || currentTexts.invalidFormat}
          </p>
        )}

        {!loadingFile && !errorKey && fileName && (
          <div className="flex flex-col items-center space-y-1 text-center">
            <span className="text-emerald-500 font-bold text-lg">✓</span>
            <p className="text-text-main text-sm font-semibold break-all px-2">
              {fileName}
            </p>
          </div>
        )}

        {!loadingFile && !fileName && !errorKey && (
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