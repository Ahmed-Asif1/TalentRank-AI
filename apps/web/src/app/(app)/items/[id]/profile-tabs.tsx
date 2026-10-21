"use client";

import React, { useState } from "react";
import {
  Award,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Languages,
  MapPin,
  UserRound,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { ParsedProfile } from "@/lib/candidate-profile";

const TRIGGER_CLASS =
  "gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors data-[state=active]:bg-white/[0.08] data-[state=active]:text-zinc-50 data-[state=active]:shadow-2xs";

function Empty({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <p className="text-xs text-zinc-500 italic">{children}</p>;
}

/** Candidate profile split into editorial studio tabs: overview, experience, education, skills, certifications, languages, raw text. */
export function ProfileTabs({
  profile,
  rawText,
}: {
  profile: ParsedProfile;
  rawText: string;
}): React.JSX.Element {
  const [showRawText, setShowRawText] = useState(false);

  const tabs: { value: string; label: string; icon: LucideIcon; count?: number; show: boolean }[] = [
    { value: "overview", label: "Overview", icon: UserRound, show: true },
    { value: "experience", label: "Experience", icon: Briefcase, count: profile.experience.length, show: profile.experience.length > 0 },
    { value: "education", label: "Education", icon: GraduationCap, count: profile.education.length, show: profile.education.length > 0 },
    { value: "skills", label: "Skills", icon: Wrench, count: profile.skills.length, show: profile.skills.length > 0 },
    { value: "certifications", label: "Certifications", icon: Award, count: profile.certifications.length, show: profile.certifications.length > 0 },
    { value: "languages", label: "Languages", icon: Languages, count: profile.languages.length, show: profile.languages.length > 0 },
    { value: "raw", label: "Source text", icon: FileText, show: true },
  ];
  const visible = tabs.filter((t) => t.show);

  return (
    <Tabs defaultValue="overview">
      <TabsList aria-label="Profile sections" className="h-auto flex-wrap justify-start gap-1 rounded-lg border border-white/[0.07] bg-white/[0.02] p-1">
        {visible.map(({ value, label, icon: Icon, count }) => (
          <TabsTrigger key={value} value={value} className={TRIGGER_CLASS}>
            <Icon className="size-3.5" aria-hidden="true" />
            <span>{label}</span>
            {count !== undefined && <span className="text-[11px] opacity-60 tabular-nums">({count})</span>}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="mt-4 rounded-xl border border-white/[0.07] bg-card p-6 sm:p-7">
        <TabsContent value="overview" className="mt-0 space-y-5">
          {profile.headline ? (
            <p className="text-base font-normal leading-relaxed text-zinc-100">{profile.headline}</p>
          ) : (
            <p className="text-sm text-zinc-400">Profile candidate overview</p>
          )}

          <div className="flex flex-wrap gap-2">
            {profile.location && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <MapPin className="size-3 text-zinc-500" aria-hidden="true" />
                {profile.location}
              </span>
            )}
            {profile.openToWork && (
              <span className="inline-flex items-center rounded-md border border-sage/30 bg-sage/10 px-2.5 py-1 text-xs font-medium text-sage">
                Open to work
              </span>
            )}
            {profile.experience[0] && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300">
                <Briefcase className="size-3 text-zinc-500" aria-hidden="true" />
                {profile.experience[0].title}
                {profile.experience[0].company ? ` at ${profile.experience[0].company}` : ""}
              </span>
            )}
          </div>

          {profile.summary ? (
            <p className="max-w-3xl text-sm leading-relaxed whitespace-pre-line text-zinc-300">{profile.summary}</p>
          ) : (
            <p className="text-xs text-zinc-400">
              Candidate background extracted from uploaded resume and LinkedIn data.
            </p>
          )}
        </TabsContent>

        <TabsContent value="experience" className="mt-0">
          <ol className="relative space-y-7 border-l border-white/[0.07] pl-5">
            {profile.experience.map((role, i) => {
              const isPresent = role.end && /present/i.test(role.end);
              return (
                <li key={`${i}-${role.title}`} className="relative">
                  <span
                    className={`absolute top-1.5 -left-[25px] size-2 rounded-full ring-4 ring-card ${
                      isPresent ? "bg-sage shadow-xs" : "bg-zinc-600"
                    }`}
                    aria-hidden="true"
                  />
                  <h3 className="text-sm font-medium text-zinc-100">{role.title}</h3>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {[role.company, role.start && `${role.start} – ${role.end ?? "Present"}`, role.meta]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {role.description && (
                    <p className="mt-2 max-w-3xl text-xs leading-relaxed text-zinc-300 whitespace-pre-line">{role.description}</p>
                  )}
                </li>
              );
            })}
          </ol>
        </TabsContent>

        <TabsContent value="education" className="mt-0">
          <ul className="space-y-4">
            {profile.education.map((edu, i) => (
              <li key={`${i}-${edu.degree}`} className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-3.5">
                <h3 className="text-sm font-medium text-zinc-100">{edu.school || edu.degree}</h3>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {[edu.degree && edu.school ? edu.degree : null, edu.period].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="skills" className="mt-0">
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-md border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="certifications" className="mt-0">
          <ul className="space-y-2">
            {profile.certifications.map((cert) => (
              <li key={cert} className="flex items-center gap-2 text-xs text-zinc-300">
                <Award className="size-3.5 text-ochre" aria-hidden="true" />
                <span>{cert}</span>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="languages" className="mt-0">
          <div className="flex flex-wrap gap-2">
            {profile.languages.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center rounded-md border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-300"
              >
                {lang}
              </span>
            ))}
          </div>
        </TabsContent>

        {/* Source Text Tab: HIDDEN BY DEFAULT */}
        <TabsContent value="raw" className="mt-0 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
            <div>
              <p className="text-xs font-medium text-zinc-200">Original source payload</p>
              <p className="text-[11px] text-zinc-500">
                {rawText ? `${rawText.length.toLocaleString("en-US")} characters extracted from document` : "No raw text available"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRawText((prev) => !prev)}
              className="h-8 gap-1.5 rounded-lg border-white/10 bg-white/[0.04] text-xs text-zinc-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              {showRawText ? (
                <>
                  <EyeOff className="size-3.5 text-zinc-400" />
                  <span>Hide source text</span>
                  <ChevronUp className="size-3 text-zinc-500" />
                </>
              ) : (
                <>
                  <Eye className="size-3.5 text-zinc-400" />
                  <span>View source text</span>
                  <ChevronDown className="size-3 text-zinc-500" />
                </>
              )}
            </Button>
          </div>

          {showRawText ? (
            <pre className="max-h-96 overflow-auto rounded-lg border border-white/[0.04] bg-well p-4 font-mono text-xs leading-relaxed text-zinc-400 whitespace-pre-wrap select-all animate-in fade-in-50">
              {rawText || "No source text available for this candidate."}
            </pre>
          ) : (
            <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.01] p-6 text-center">
              <FileText className="mx-auto size-5 text-zinc-600 mb-1.5" />
              <p className="text-xs text-zinc-400">
                Source text is collapsed by default to keep the profile concise.
              </p>
              <button
                type="button"
                onClick={() => setShowRawText(true)}
                className="mt-2 text-xs font-medium text-steel hover:underline hover:text-white cursor-pointer"
              >
                Click to expand original source text
              </button>
            </div>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
}
