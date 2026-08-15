"use client";

import { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import type { ScanResult, Severity } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const SEVERITY_STYLE: Record<Severity, string> = {
  NONE: "bg-sage-100 text-sage-700",
  LOW: "bg-amber-100 text-amber-700",
  MEDIUM: "bg-orange-100 text-orange-700",
  HIGH: "bg-red-100 text-red-700",
};

function ScanResultCard({ scan }: { scan: ScanResult }) {
  return (
    <div className="rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${API_URL}${scan.imageUrl}`}
          alt="Scanned crop"
          className="h-24 w-24 rounded-md object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-heading font-semibold text-brand-800">{scan.diagnosis}</p>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLE[scan.severity]}`}>
              {scan.severity}
            </span>
          </div>
          <p className="text-xs text-brand-500">
            {scan.cropType ? `${scan.cropType} · ` : ""}
            {Math.round(scan.confidence * 100)}% confidence
          </p>
          <p className="mt-2 text-sm text-brand-700">
            <strong>Symptoms:</strong> {scan.symptoms}
          </p>
          <p className="mt-1 text-sm text-brand-700">
            <strong>Treatment:</strong> {scan.treatment}
          </p>
          {scan.notes && <p className="mt-1 text-xs text-brand-500">{scan.notes}</p>}
        </div>
      </div>
    </div>
  );
}

function ScannerPageContent() {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropType, setCropType] = useState("");
  const [status, setStatus] = useState<"idle" | "scanning" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);

  useEffect(() => {
    api.get<ScanResult[]>("/api/scanner/history", token).then(setHistory);
  }, [token]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setResult(null);
    setError(null);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleScan() {
    if (!file) return;
    setStatus("scanning");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      if (cropType) formData.append("cropType", cropType);
      const scan = await api.postForm<ScanResult>("/api/scanner/scan", formData, token);
      setResult(scan);
      setHistory((prev) => [scan, ...prev]);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-800">Crop disease scanner</h1>
      <p className="mt-1 text-sm text-brand-600">
        Take or upload a photo of a crop to get an AI diagnosis and treatment advice.
      </p>

      <div className="mt-6 rounded-lg border border-brand-200 bg-white p-5 shadow-sm">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={preview} alt="Selected crop photo" className="mx-auto max-h-64 rounded-md" />
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-brand-300 text-brand-500 hover:border-accent-400 hover:bg-accent-50/50"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path
                d="M9 3h6l1.5 3H19a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h2.5L9 3z M12 17a4 4 0 100-8 4 4 0 000 8z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Tap to take or choose a photo
          </button>
        )}

        {preview && (
          <button onClick={() => fileInputRef.current?.click()} className="mt-2 text-sm font-medium text-accent-600 underline">
            Choose a different photo
          </button>
        )}

        <input
          placeholder="Crop type (optional, e.g. tomato)"
          value={cropType}
          onChange={(e) => setCropType(e.target.value)}
          className="mt-4 w-full rounded-md border border-brand-300 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
        />

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 shrink-0">
              <path d="M12 9v4m0 4h.01M10.3 3.9L2.7 17a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={!file || status === "scanning"}
          className="mt-4 w-full rounded-md bg-accent-500 px-4 py-2.5 font-semibold text-brand-900 hover:bg-accent-400 disabled:opacity-50"
        >
          {status === "scanning" ? "Analyzing..." : "Scan for disease"}
        </button>
      </div>

      {result && (
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold text-brand-800">Result</h2>
          <ScanResultCard scan={result} />
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-lg font-semibold text-brand-800">Past scans</h2>
          <div className="space-y-3">
            {history
              .filter((s) => s.id !== result?.id)
              .map((scan) => (
                <ScanResultCard key={scan.id} scan={scan} />
              ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function ScannerPage() {
  return (
    <AuthGuard>
      <main>
        <Navbar />
        <ScannerPageContent />
      </main>
    </AuthGuard>
  );
}
