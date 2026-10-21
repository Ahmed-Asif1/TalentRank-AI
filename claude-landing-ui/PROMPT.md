# Master Landing Page Redesign Prompt for Claude & GPT

> **How to use this**:
> 1. Open [Claude.ai](https://claude.ai) (Claude 3.5 Sonnet recommended) or [ChatGPT](https://chatgpt.com) (GPT-4o).
> 2. Attach or drag the 5 files from the `claude-landing-ui/context/` folder into your chat:
>    - `marketing-page.tsx`
>    - `globals.css`
>    - `foundry.tsx`
>    - `candidate-ui.ts`
>    - `domain.ts`
> 3. Copy and paste the prompt below.

---

## 📋 Copy-Paste Prompt

```markdown
You are a World-Class Principal Design Engineer specializing in Apple Product Landing Pages, Anthropic (Claude) Editorial Aesthetics, and Linear/Stripe Precision Software Design.

### Objective:
Elevate the landing page (`marketing-page.tsx`) of **TalentRank AI**, an executive candidate screening and talent intelligence platform built with Next.js 15, React 19, Tailwind CSS, and Lucide React.

### Current Problem:
Currently, the hero section looks like a flat, dark void with plain text and standard buttons. It feels static, barren, and AI-templated rather than a bespoke, high-conversion product crafted by Apple or Anthropic designers.

### Attached Context Files:
1. `marketing-page.tsx`: The active landing page component with scroll-driven animations and auth buttons.
2. `globals.css`: Base design tokens, CSS variables, and the `@utility shadow-raised`.
3. `foundry.tsx`: UI presentational primitives (ScoreRing, ScoreBar, FitBadge, Tag).
4. `candidate-ui.ts`: Score formatting and color styles.
5. `domain.ts`: Product branding, labels, and tagline.

---

### Core Design Principles to Apply:

#### 1. Atmospheric Hero Lighting & Radiant Depth (Not Flat Void)
- Introduce a subtle, radiant atmospheric ambient glow behind the hero title:
  - Soft top-center indigo/sky diffusion (`radial-gradient(1000px 500px at 50% -80px, rgba(99, 102, 241, 0.18), transparent 75%)` or floating luminous orbs).
  - Subtle micro-dot retina grid or fine mesh overlay to give tactile physical depth.

#### 2. Editorial Headline Typography (Anthropic / Claude Aesthetic)
- Refine the primary headline (`Candidate intelligence engineered for technical hiring`):
  - Use graceful serif (`font-serif`) with Anthropic-style metallic gradient: `bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent`.
  - Upgrade the top kicker badge: sleek translucent pill with a glowing emerald live pulse indicator (`span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"`).

#### 3. Interactive Hero Candidate Dossier Preview
- The best software landing pages (Linear, Stripe, Apple) don't just tell; they show the product immediately.
- Below the hero CTAs, introduce a sleek, high-fidelity **interactive product preview card**:
  - Displays a realistic candidate dossier: `Alex Rivera — Senior Frontend & Next.js Engineer`.
  - Precision circular score ring (`94% Match`).
  - Translucent Apple-style `Strong Fit` pill with glowing micro-pip.
  - Verified evidence badge with citation: `Coursera Experience § 2022–2024`.
  - Concrete strengths and clean tags (`React 19`, `Next.js App Router`, `TypeScript`, `Atlas Vector Search`).

#### 4. Tactile Glass Cards & Directional Specular Highlights
- In the "Problem", "Steps", and "Interactive Questions" sections:
  - Add top-lit hairline specular highlights: `before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent`.
  - Use the `shadow-raised` utility to separate interactive layers cleanly without muddy glow.
  - Refine question tabs with smooth state transitions.

#### 5. Strict Behavioral & Functional Preservation
- MUST preserve all existing interactive handlers and logic:
  - `handleStartAnonymous` (`authClient.signIn.anonymous()` -> `router.push('/dashboard')`)
  - `handleDemoLogin` (`fetch('/api/auth/demo', { method: 'POST' })` -> `router.push('/dashboard')`)
  - `loading` and `demoLoading` spinner states
  - Scroll progress bar (`barRef`)
  - IntersectionObserver hooks (`Reveal`, `Words`, `ScrollText`)

---

### Deliverable:
Provide the complete, updated code for `marketing-page.tsx` ready to drop directly into `apps/web/src/app/(marketing)/page.tsx`.
```
