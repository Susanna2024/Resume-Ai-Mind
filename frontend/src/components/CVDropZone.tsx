import { useCallback, useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import pdfWorker from "pdfjs-dist/build/pdf.worker?url"

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

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
}

export default function CVDropZone({
  label = "Your CV",
  onFileLoaded,
}: {
  label?: string
  onFileLoaded: (text: string) => void
}) {
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

  return (
    <div>
      <label className="block text-sm font-medium text-ink-muted mb-2">{label}</label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative w-full h-48 bg-surface border-2 border-dashed rounded-xl transition-colors flex flex-col items-center justify-center gap-3 px-4 ${
          dragging ? "border-match bg-match-soft" : "border-border"
        }`}
      >
        {loadingFile && (
          <p className="text-coach text-sm font-mono">reading PDF…</p>
        )}
        {!loadingFile && fileName && (
          <p className="text-good text-sm font-medium text-center break-all px-2">✓ {fileName}</p>
        )}
        {!loadingFile && !fileName && (
          <>
            <p className="text-ink-muted text-sm text-center">Drop your CV here</p>
            <p className="text-ink-faint text-xs">PDF only, or</p>
          </>
        )}
        {!loadingFile && (
          <label className="cursor-pointer bg-surface-2 hover:bg-border text-ink-muted text-sm px-4 py-2 rounded-lg transition-colors">
            {fileName ? "Change PDF" : "Upload PDF"}
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
