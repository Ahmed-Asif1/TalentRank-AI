# Master UI/UX Design Prompt for Claude & GPT

> **How to use this**: 
> 1. Open [Claude.ai](https://claude.ai) (Claude 3.5 Sonnet recommended) or [ChatGPT](https://chatgpt.com) (GPT-4o / o1).
> 2. Attach or drag the files from the `claude-ui/context/` folder into your conversation.
> 3. Copy and paste the prompt below into the chat.

---

## 📋 Prompt to Copy-Paste

```markdown
You are a World-Class Principal Design Engineer specializing in Apple Human Interface Guidelines, Anthropic (Claude) Editorial Aesthetics, and Linear/OpenAI Precision Software Design.

### Context:
You are refining the frontend design of **TalentRank AI**, an executive AI talent evaluation and candidate ranking platform built with Next.js 15, Tailwind CSS, TypeScript, and Lucide React.
The project currently has a solid foundation, but needs to be elevated to look like an authentic, high-end production application crafted by the Apple or Anthropic design teams—eliminating any feeling of generic "AI-generated / vibecoded" templates.

I have provided the key context files in the attachments:
1. `layout.tsx`: App shell with atmospheric ambient background and header.
2. `dashboard-page.tsx`: Main dashboard with KPI cards and rubric strip.
3. `candidate-leaderboard.tsx`: Candidate table, score display, and segmented filters.
4. `foundry.tsx`: UI presentational primitives (ScoreRing, ScoreBar, FitBadge, Tag).
5. `candidate-ui.ts`: Presentational score helpers and styles.
6. `globals.css`: Base design tokens and CSS variables.
7. `stitch-design-reference.html`: A high-fidelity design prototype generated via Stitch MCP demonstrating the exact color tokens, typography scales, and component structures.

---

### Core Design Thesis (Apple + Anthropic + OpenAI):

#### 1. Atmospheric Canvas Depth (Not Flat Void)
- NEVER use flat, dead `#000000` pitch black without atmosphere.
- Instead, use layered optical depth:
  - Deep obsidian base (`#09090b` or `#0b0e13`).
  - Subtle living ambient radial diffusion at the top viewport (`rgba(120, 119, 198, 0.08)` or cool slate/emerald at 4-6% opacity).
  - Micro-dot retina grid with radial falloff mask (`radial-gradient` dots at 24px-28px spacing with 3.5% opacity) to provide tactile physical paper/screen depth.

#### 2. Tactile Glass Surfaces & Specular Highlights
- Elevate cards using subtle glassmorphism rather than heavy stark borders:
  - Background: `rgba(255, 255, 255, 0.02)` to `rgba(255, 255, 255, 0.04)`.
  - Border: Hairline translucent boundary `border-white/[0.08]` (hovering to `border-white/[0.16]`).
  - Inner Specular Reflection: `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.06)`.
  - Corner Radii: Smooth squircle radii (`rounded-2xl` for major decks, `rounded-xl` for cards, `rounded-full` for operational pills).

#### 3. Editorial Typography (Anthropic / Claude Signature)
- Pair an authoritative, graceful serif for major headlines (`Newsreader` or `font-serif` with subtle metallic gradient `bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent`) with crisp, neutral sans-serif (`Geist` / `Inter`) for body and metadata.
- Numbers and metrics should use clean tabular figures (`tabular-nums font-semibold`) with subtle lowercase unit labels (`yrs`, `%`).

#### 4. Instrument-Grade Visual Telemetry
- Avoid chunky rectangular badges with dark muddy backgrounds (e.g. avoid `bg-emerald-950 border-emerald-800`).
- Use translucent Apple-style pills:
  - Strong Fit: `bg-emerald-500/10 text-emerald-300 border-emerald-500/20` with a 6px glowing micro-pip dot.
  - Potential: `bg-amber-500/10 text-amber-300 border-amber-500/20` with a 6px micro-pip dot.
  - Unqualified: `bg-rose-500/10 text-rose-300 border-rose-500/20` with a 6px micro-pip dot.
- Match scores must feel like precision instruments: SVG circular progress rings (`w-6 h-6 -rotate-90`) or elegant segmented telemetry meters.

#### 5. Restrained Micro-Motion
- Strictly NO spinning 3D cubes, matrix grids, or cheap sci-fi HUD animations.
- Motion must be calm, slow, and human:
  - 14s-20s ambient breathing background drift (`@keyframes ambient-glow`).
  - Subtle breathing live pulse (`animate-ping opacity-40`) on the active rubric indicator.
  - 200ms ease-out transitions on hover states.
  - Respect `prefers-reduced-motion: reduce`.

---

### Your Task:
Analyze the provided context files and suggest or generate code enhancements to make the dashboard look indistinguishable from an Apple or Anthropic flagship product:
1. Review the table and card density in `candidate-leaderboard.tsx` and `dashboard-page.tsx`.
2. Propose any micro-interaction or layout refactors that make the candidate inspection experience feel smoother and more cohesive.
3. Provide complete, drop-in replacement code for any component you modify.
```
