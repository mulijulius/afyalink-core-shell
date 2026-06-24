import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users,
  ListOrdered,
  FlaskConical,
  Pill,
  Receipt,
  Share2,
  ShieldCheck,
  Activity,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AfyaLink HMS — Kapsabet County Referral Hospital" },
      {
        name: "description",
        content:
          "AfyaLink HMS is the digital hospital management system for Kapsabet County Referral Hospital — patients, OPD, pharmacy, lab, billing and referrals in one secure platform.",
      },
    ],
  }),
  component: LandingPage,
});

// ── Hero background slideshow ───────────────────────────────────────
// Images live in /public/landing (copied from the project's Imagery folder).
// Each slide is shown for SLIDE_DURATION_MS before crossfading to the next,
// looping continuously. SLIDE_DURATION_MS is well above the 800ms minimum.
const SLIDES: { src: string; alt: string }[] = [
  { src: "/landing/hospital-facade-01.jpg", alt: "Kapsabet County Referral Hospital main entrance" },
  { src: "/landing/waiting-area.jpg", alt: "Patient waiting area at the hospital" },
  { src: "/landing/radiology-room.jpg", alt: "Radiology imaging room" },
  { src: "/landing/mri-suite.jpeg", alt: "MRI imaging suite" },
  { src: "/landing/ward-bed.jpg", alt: "Inpatient ward bed" },
  { src: "/landing/mobile-clinic.webp", alt: "Beyond Zero mobile clinic outreach unit" },
  { src: "/landing/patient-care.jpeg", alt: "Nurse attending to a patient" },
  { src: "/landing/new-block-construction.jpeg", alt: "New hospital block under construction" },
  { src: "/landing/hospital-facade-03.webp", alt: "Hospital grounds and parking area" },
  { src: "/landing/hospital-facade-02.jpg", alt: "Hospital staff outside the main building" },
];

const SLIDE_DURATION_MS = 4000;

function HeroSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(id);
  }, []);

  const goTo = (i: number) => setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-900">
      {SLIDES.map((slide, i) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          style={{
            animation: i === index ? "afyalink-slow-pan 9s ease-in-out forwards" : undefined,
          }}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}
      {/* Dark gradient overlay so hero text stays readable over any photo */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f33]/80 via-[#0a1f33]/60 to-[#0a1f33]/90" />

      {/* Prev / next controls */}
      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => goTo(index - 1)}
        className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/30 bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20 sm:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => goTo(index + 1)}
        className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/30 bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20 sm:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Slide indicator dots */}
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      <style>{`
        @keyframes afyalink-slow-pan {
          0%   { transform: scale(1.02) translate(0, 0); }
          100% { transform: scale(1.1) translate(-1%, -1%); }
        }
      `}</style>
    </div>
  );
}

// ── Navbar ───────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Modules", href: "#modules" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-[#0057A8] shadow-md" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#home" className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#0057A8] font-bold shadow-sm">
            A
          </div>
          <span className="text-base font-semibold text-white sm:text-lg">
            AfyaLink HMS <span aria-label="Kenya">🇰🇪</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-white/90 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild className="bg-white text-[#0057A8] hover:bg-white/90">
            <Link to="/login">Staff Login</Link>
          </Button>
        </div>

        <button
          type="button"
          className="text-white md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 bg-[#0057A8] px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-white/90 hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <Button asChild className="mt-1 w-full bg-white text-[#0057A8] hover:bg-white/90">
              <Link to="/login">Staff Login</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section id="home" className="relative flex min-h-[640px] items-center overflow-hidden pt-16 sm:min-h-[720px]">
      <HeroSlideshow />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm sm:text-sm">
          <ShieldCheck className="h-4 w-4" /> Kapsabet County Referral Hospital · Level 5
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          Hospital care,<br className="hidden sm:block" /> connected digitally
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-white/90 sm:text-lg">
          AfyaLink HMS brings patient records, OPD queueing, pharmacy, laboratory,
          billing and referrals into one secure system — built for Kapsabet
          County Referral Hospital staff.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="w-full bg-[#0057A8] text-white hover:bg-[#004a8f] sm:w-auto"
          >
            <Link to="/login">Staff Login</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full border-white bg-white/10 text-white backdrop-blur-sm hover:bg-white hover:text-[#0057A8] sm:w-auto"
          >
            <a href="#modules">Explore the System</a>
          </Button>
        </div>
        <p className="mt-6 text-xs text-white/70">
          New staff account?{" "}
          <Link to="/login" className="font-medium text-white underline-offset-2 hover:underline">
            Request access
          </Link>{" "}
          — subject to Admin approval.
        </p>
      </div>
    </section>
  );
}

// ── Modules / features section ────────────────────────────────────────

type Feature = { title: string; description: string; icon: LucideIcon };

const FEATURES: Feature[] = [
  {
    title: "Patient Records",
    description: "Centralized patient profiles, visit history and clinical summaries available the moment a patient checks in.",
    icon: Users,
  },
  {
    title: "OPD Queueing",
    description: "Real-time triage and queue tracking so nurses, clinicians and doctors always know who's next.",
    icon: ListOrdered,
  },
  {
    title: "Laboratory",
    description: "Lab orders and results flow directly between technicians and clinicians — no paper, no delays.",
    icon: FlaskConical,
  },
  {
    title: "Pharmacy",
    description: "Live drug stock, dispensing and low-stock alerts keep the pharmacy counter running smoothly.",
    icon: Pill,
  },
  {
    title: "Billing & NHIF",
    description: "Transparent billing with NHIF claim tracking, built for Kenya's facility workflows.",
    icon: Receipt,
  },
  {
    title: "Referrals",
    description: "Track referrals in and out of the facility, including inter-hospital coordination.",
    icon: Share2,
  },
];

function Modules() {
  return (
    <section id="modules" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            One system, every department
          </h2>
          <p className="mt-4 text-muted-foreground">
            AfyaLink HMS gives every role — from reception to the lab to
            finance — a dashboard built specifically for their workflow, all
            backed by the same secure patient record.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0057A8] text-white shadow-lg shadow-[#0057A8]/20">
                <f.icon className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── About section ──────────────────────────────────────────────────

const STATS = [
  { label: "Clinical roles supported", value: "7" },
  { label: "Core hospital modules", value: "10+" },
  { label: "Built for", value: "Kapsabet CRH" },
  { label: "Role-based access", value: "100%" },
];

function About() {
  return (
    <section id="about" className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0057A8]">About the system</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for Kapsabet County Referral Hospital
          </h2>
          <p className="mt-5 text-muted-foreground">
            AfyaLink HMS replaces scattered paper trails and spreadsheets with
            a single, role-aware system. Every account is approved by a
            facility Admin, and every module — from the OPD queue to NHIF
            claims — runs on live data so staff are always working from the
            same source of truth.
          </p>
          <p className="mt-4 text-muted-foreground">
            The platform follows the Ministry of Health's facility colour
            standards and is designed to scale to other county referral
            hospitals across Kenya.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-[#0057A8]">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl shadow-xl">
            <img
              src="/landing/hospital-services-sign.webp"
              alt="County referral hospital services signage"
              className="h-80 w-full object-cover sm:h-[420px]"
              loading="lazy"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 hidden items-center gap-3 rounded-xl bg-white p-4 shadow-lg sm:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00A651]/10 text-[#00A651]">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Live clinical data</p>
              <p className="text-xs text-muted-foreground">Powered by Supabase</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CTA banner ───────────────────────────────────────────────────────

function CtaBanner() {
  return (
    <section className="bg-[#0057A8] py-14">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:text-left sm:px-6 lg:px-8">
        <div>
          <h3 className="text-2xl font-bold text-white">Ready to sign in?</h3>
          <p className="mt-1 text-white/80">
            Access your role's dashboard or request a new staff account.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-white text-[#0057A8] hover:bg-white/90">
            <Link to="/login">
              <Stethoscope className="mr-1.5 h-4 w-4" /> Staff Login
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer id="contact" className="bg-[#0a1f33] py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-[#0057A8] font-bold">
                A
              </div>
              <span className="text-base font-semibold">AfyaLink HMS</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-white/60">
              A digital hospital management system for Kapsabet County
              Referral Hospital, Republic of Kenya.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white/90">Facility</p>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" /> Kapsabet, Nandi County, Kenya
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" /> +254 (0) 53 522 0000
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" /> info@kapsabethospital.go.ke
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white/90">Quick links</p>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li><a href="#modules" className="hover:text-white">Modules</a></li>
              <li><a href="#about" className="hover:text-white">About</a></li>
              <li><Link to="/login" className="hover:text-white">Staff Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          Ministry of Health · Republic of Kenya — © {new Date().getFullYear()} AfyaLink HMS
        </div>
      </div>
    </footer>
  );
}

// ── Page ─────────────────────────────────────────────────────────────

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Modules />
      <About />
      <CtaBanner />
      <Footer />
    </div>
  );
}
