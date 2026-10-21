"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileCheck,
  FileText,
  Info,
  Link as LinkIcon,
  Loader2,
  Plus,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type ImportTab = "paste" | "upload" | "url";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

const INPUT_CLASS =
  "h-9 border-input bg-well text-sm text-zinc-50 placeholder:text-zinc-500";
const TAB_TRIGGER_CLASS =
  "gap-1.5 text-xs font-medium text-muted-foreground transition-colors data-[state=active]:bg-secondary data-[state=active]:text-white";

/* -------------------------------------------------------------------------- */
/* Shared field blocks (module level so inputs keep focus between renders)     */
/* -------------------------------------------------------------------------- */

function NameField({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}): React.JSX.Element {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-zinc-300">
        Candidate name <span className="text-zinc-500">(optional)</span>
      </label>
      <Input
        id={id}
        type="text"
        placeholder="e.g. Jane Doe"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={INPUT_CLASS}
      />
    </div>
  );
}

function FormFooter({
  isLoading,
  submitLabel,
  loadingLabel,
  onCancel,
}: {
  isLoading: boolean;
  submitLabel: string;
  loadingLabel: string;
  onCancel: () => void;
}): React.JSX.Element {
  return (
    <DialogFooter className="gap-2 pt-2 sm:gap-2">
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        disabled={isLoading}
        className="cursor-pointer text-muted-foreground hover:text-white"
      >
        Cancel
      </Button>
      <Button type="submit" disabled={isLoading} className="min-w-[150px] cursor-pointer gap-2">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            {loadingLabel}
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </DialogFooter>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ImportCandidateButton() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ImportTab>("paste");

  // Paste state machine
  const [pasteName, setPasteName] = useState("");
  const [pasteText, setPasteText] = useState("");

  // Upload state machine (never shares fields with paste)
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState("");
  const [filePdf, setFilePdf] = useState("");
  const [dragging, setDragging] = useState(false);

  // URL state
  const [url, setUrl] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Guards against a slow read finishing after the person picked a different file.
  const readToken = useRef(0);

  const clearFile = () => {
    readToken.current += 1;
    setFile(null);
    setFileText("");
    setFilePdf("");
    setDragging(false);
  };

  const resetForm = () => {
    setPasteName("");
    setPasteText("");
    setFileName("");
    clearFile();
    setUrl("");
    setTab("paste");
  };

  const handleOpenChange = (next: boolean) => {
    // Don't let the dialog close mid-request; the result would be easy to miss.
    if (!next && isLoading) return;
    setOpen(next);
  };

  const closeDialog = () => handleOpenChange(false);

  /** Reads a PDF as a data URL or a TXT file as text. Clears whatever was loaded before. */
  const loadFile = (picked: File) => {
    const lower = picked.name.toLowerCase();
    const isPdf = picked.type === "application/pdf" || lower.endsWith(".pdf");
    const isTxt = picked.type === "text/plain" || lower.endsWith(".txt");

    if (!isPdf && !isTxt) {
      toast.error("Unsupported file type. Upload a .pdf or .txt resume.");
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      toast.error("That file is larger than 8 MB. Upload a smaller one or paste the text instead.");
      return;
    }

    readToken.current += 1;
    const token = readToken.current;

    setFile(picked);
    setFileText("");
    setFilePdf("");
    if (!fileName.trim()) {
      setFileName(picked.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " "));
    }

    const reader = new FileReader();
    reader.onerror = () => {
      if (token !== readToken.current) return;
      setFile(null);
      toast.error("Could not read that file. Try another one.");
    };
    if (isPdf) {
      reader.onload = () => {
        if (token === readToken.current) setFilePdf(String(reader.result));
      };
      reader.readAsDataURL(picked);
    } else {
      reader.onload = () => {
        if (token === readToken.current) setFileText(String(reader.result));
      };
      reader.readAsText(picked);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) loadFile(picked);
    // Allow picking the same file again after clearing.
    e.target.value = "";
  };

  const submit = async (payload: Record<string, unknown>, fallbackError: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || fallbackError);

      toast.success(data?.message || "Candidate imported and scored.");
      setOpen(false);
      resetForm();
      router.refresh();
      if (data?.itemId) router.push(`/items/${data.itemId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteText.trim()) {
      toast.error("Paste the candidate's profile or resume text first.");
      return;
    }
    void submit(
      { rawText: pasteText.trim(), name: pasteName.trim() || undefined },
      "Failed to import candidate.",
    );
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Choose a PDF or TXT resume first.");
      return;
    }
    const name = fileName.trim() || undefined;
    if (filePdf) {
      void submit({ pdfBase64: filePdf, name }, "Failed to process resume.");
    } else if (fileText.trim()) {
      void submit({ rawText: fileText.trim(), name }, "Failed to process resume.");
    } else {
      toast.error("The file is still loading or contains no text.");
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = url.trim();
    if (!value) {
      toast.error("Enter a LinkedIn profile URL.");
      return;
    }

    let isValidLinkedInUrl = false;
    try {
      const parsedUrl = new URL(value);
      const hostname = parsedUrl.hostname.toLowerCase();
      isValidLinkedInUrl =
        (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:") &&
        (hostname === "linkedin.com" || hostname.endsWith(".linkedin.com"));
    } catch {
      isValidLinkedInUrl = false;
    }

    if (!isValidLinkedInUrl) {
      toast.error("Enter a valid LinkedIn URL, e.g. https://linkedin.com/in/username");
      return;
    }
    void submit({ url: value }, "Failed to scrape candidate.");
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-9 cursor-pointer gap-2 rounded-lg border border-white/20 bg-white px-4 text-xs font-sans font-medium text-zinc-950 shadow-sm transition-all hover:bg-zinc-200"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Import candidate</span>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-xl border border-border bg-card text-white shadow-2xl sm:max-w-[560px]">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 space-y-1.5 text-left">
            <DialogTitle className="font-serif text-2xl font-normal tracking-tight text-white">
              Import candidate
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-zinc-400">
              Add a profile and score it against your active job criteria.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 pt-5">
            <Tabs value={tab} onValueChange={(v) => setTab(v as ImportTab)}>
            <TabsList className="grid w-full grid-cols-3 rounded-md bg-well p-1">
              <TabsTrigger value="paste" className={TAB_TRIGGER_CLASS}>
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                Paste text
              </TabsTrigger>
              <TabsTrigger value="upload" className={TAB_TRIGGER_CLASS}>
                <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />
                PDF / Resume
              </TabsTrigger>
              <TabsTrigger value="url" className={TAB_TRIGGER_CLASS}>
                <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                URL scrape
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: paste text (default) */}
            <TabsContent value="paste">
              <form onSubmit={handlePasteSubmit} className="space-y-4 pt-4">
                <NameField
                  id="paste-candidate-name"
                  value={pasteName}
                  onChange={setPasteName}
                  disabled={isLoading}
                />

                <div className="space-y-1.5">
                  <label htmlFor="paste-raw-text" className="text-xs font-medium text-zinc-300">
                    Profile or resume text <span className="text-rose-400">*</span>
                  </label>
                  <Textarea
                    id="paste-raw-text"
                    rows={7}
                    placeholder="Paste the headline, about section, experience history and skills from LinkedIn, or the text of a resume."
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    disabled={isLoading}
                    className="min-h-[160px] resize-y border-input bg-well text-sm leading-relaxed text-zinc-50 placeholder:text-zinc-500"
                  />
                </div>

                <FormFooter
                  isLoading={isLoading}
                  submitLabel="Evaluate profile"
                  loadingLabel="Scoring candidate..."
                  onCancel={closeDialog}
                />
              </form>
            </TabsContent>

            {/* Tab 2: PDF or TXT resume, including LinkedIn "Save to PDF" exports */}
            <TabsContent value="upload">
              <form onSubmit={handleUploadSubmit} className="space-y-4 pt-4">
                <div className="flex items-start gap-2.5 rounded-md border border-border bg-well p-3 text-xs leading-relaxed text-zinc-400">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-steel" aria-hidden="true" />
                  <p>
                    For the most complete data, open a LinkedIn profile and choose{" "}
                    <span className="font-medium text-zinc-200">More, then Save to PDF</span>. The export
                    keeps full job descriptions, dates and skills. Drop that file here, or upload a resume.
                  </p>
                </div>

                <NameField
                  id="file-candidate-name"
                  value={fileName}
                  onChange={setFileName}
                  disabled={isLoading}
                />

                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-zinc-300">
                    Resume file (.pdf or .txt) <span className="text-rose-400">*</span>
                  </span>
                  <label
                    htmlFor="file-upload-input"
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!isLoading) setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      if (isLoading) return;
                      const dropped = e.dataTransfer.files?.[0];
                      if (dropped) loadFile(dropped);
                    }}
                    className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-7 text-center transition-all duration-200 motion-reduce:transition-none focus-within:ring-2 focus-within:ring-blue-500/40 ${
                      dragging
                        ? "border-blue-500/80 bg-blue-950/20 shadow-[0_0_20px_rgba(59,130,246,0.12)]"
                        : "border-zinc-700 bg-well hover:border-blue-500/80 hover:bg-blue-950/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.12)]"
                    }`}
                  >
                    <UploadCloud
                      className={`mb-2 h-8 w-8 transition-colors duration-200 group-hover:text-blue-400 ${
                        dragging ? "text-blue-400" : "text-zinc-400"
                      }`}
                      aria-hidden="true"
                    />
                    {file ? (
                      <span className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                        <FileCheck className="h-4 w-4" aria-hidden="true" />
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-zinc-300 transition-colors duration-200 group-hover:text-white">
                          Click to browse or drop a file here
                        </span>
                        <span className="mt-1 text-[11px] text-zinc-500 transition-colors duration-200 group-hover:text-zinc-400">
                          PDF or TXT, up to 8 MB
                        </span>
                      </>
                    )}
                    <input
                      id="file-upload-input"
                      type="file"
                      accept=".pdf,.txt,application/pdf,text/plain"
                      onChange={handleFileChange}
                      disabled={isLoading}
                      className="sr-only"
                    />
                  </label>
                  {file && (
                    <button
                      type="button"
                      onClick={clearFile}
                      disabled={isLoading}
                      className="cursor-pointer text-[11px] font-medium text-zinc-500 underline underline-offset-2 transition-colors hover:text-white disabled:cursor-not-allowed"
                    >
                      Remove file
                    </button>
                  )}
                </div>

                <FormFooter
                  isLoading={isLoading}
                  submitLabel="Evaluate resume"
                  loadingLabel="Extracting and scoring..."
                  onCancel={closeDialog}
                />
              </form>
            </TabsContent>

            {/* Tab 3: automated LinkedIn scrape */}
            <TabsContent value="url">
              <form onSubmit={handleUrlSubmit} className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <label htmlFor="url-input" className="text-xs font-medium text-zinc-300">
                    LinkedIn profile URL <span className="text-rose-400">*</span>
                  </label>
                  <Input
                    id="url-input"
                    type="url"
                    placeholder="https://www.linkedin.com/in/username"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isLoading}
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="flex items-start gap-2.5 rounded-md border border-amber-900/50 bg-amber-950/20 p-3 text-xs leading-relaxed text-zinc-400">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                  <p>
                    LinkedIn blocks most automated requests (HTTP 999). If the scrape fails, use{" "}
                    <button
                      type="button"
                      onClick={() => setTab("paste")}
                      className="cursor-pointer font-medium text-zinc-200 underline underline-offset-2 hover:text-white"
                    >
                      Paste text
                    </button>{" "}
                    or{" "}
                    <button
                      type="button"
                      onClick={() => setTab("upload")}
                      className="cursor-pointer font-medium text-zinc-200 underline underline-offset-2 hover:text-white"
                    >
                      PDF / Resume
                    </button>{" "}
                    for complete data.
                  </p>
                </div>

                <FormFooter
                  isLoading={isLoading}
                  submitLabel="Scrape and evaluate"
                  loadingLabel="Scraping and scoring..."
                  onCancel={closeDialog}
                />
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-5 rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 p-3 text-xs text-amber-200/90 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-amber-400 shrink-0" />
              <span>Want to automatically scout & scrape candidates from LinkedIn?</span>
            </div>
            <span className="shrink-0 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
              Use AI Scout (PRO)
            </span>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
