import { useCallback, useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { translations } from "../i18n"
import type { Language } from "../lib/types"

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let text = ""
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((item: any) => item.str).join(" ") + "\n"
  }
  return text
}export default function CVDropZone({
  label = "",
  onFileLoaded,
  language = "en",
}: {
  label?: string
  onFileLoaded: (text: string) => void
  language?: Language | string | any
}) {
  // Estrae la stringa della lingua in modo sicuro indipendentemente da come viene passata
  const langString = 
    typeof language === "string" ? language :
    (language && typeof language === "object" && typeof language.code === "string" ? language.code : 
    (typeof window !== "undefined" ? localStorage.getItem("language") || "en" : "en"))

  const langKey = ["it", "es", "en"].includes(langString?.toLowerCase()) ? langString.toLowerCase() : "en"
  const t = (translations as any)[langKey] || translations.en

  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState("")
  const [loadingFile, setLoadingFile] = useState(false)

  const processFile = async (file: File) => {
    if (!file || file.type !== "application/pdf") return
    setLoadingFile(true)
    const text = await extractTextFromPDF(file)
    onFileLoaded(text)
    setFileName(file.name)
    setLoadingFile(false)
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files[0])
  }, [])

  // Testi diretti basati sulla lingua attiva calcolata (garantiti al 100%)
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
          dragging ? "border-amber-500 bg-amber-500/10" : "border-border hover:border-amber-500/50"
        }`}
      >
        {loadingFile && (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-text-main text-sm font-medium">
              {t.readingPdf || currentTexts.reading}
            </p>
          </div>
        )}

        {!loadingFile && fileName && (
          <div className="flex flex-col items-center space-y-1 text-center">
            <span className="text-emerald-500 font-bold text-lg">✓</span>
            <p className="text-text-main text-sm font-semibold break-all px-2">
              {fileName}
            </p>
          </div>
        )}

        {!loadingFile && !fileName && (
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