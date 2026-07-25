import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

export const Route = createFileRoute("/")({
  component: Portfolio,
});

/* ---------------- Utilities ---------------- */

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useCountUp(target: number, start: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setValue(Math.floor(p * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, start, duration]);
  return value;
}

/* ---------------- Nav ---------------- */

const NAV = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "certifications", label: "Certifications" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
];

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    NAV.forEach((n) => {
      const el = document.getElementById(n.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0b1120]/85 backdrop-blur-md border-b border-[#1e293b]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button
          onClick={() => scrollTo("home")}
          className="mono text-sm text-[#22d3ee] tracking-tight"
        >
          &lt;MZT/&gt;
        </button>
        <nav className="hidden lg:flex items-center gap-7">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => scrollTo(n.id)}
              className={`text-sm transition-colors ${
                active === n.id
                  ? "text-[#22d3ee]"
                  : "text-[#94a3b8] hover:text-[#f1f5f9]"
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="/CV_Muhammad_Zharfan.pdf"
            download
            className="hidden sm:inline-flex items-center gap-2 rounded-[8px] bg-[#22d3ee] px-4 py-2 text-sm font-semibold text-[#0b1120] transition-all hover:bg-[#67e8f9] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          >
            Download CV
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden text-[#f1f5f9] p-2"
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div
          className="lg:hidden border-t border-[#1e293b] bg-[#0b1120]/95 backdrop-blur-md"
          style={{ animation: "slideDown 200ms ease" }}
        >
          <div className="flex flex-col p-4">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => scrollTo(n.id)}
                className={`py-3 text-left text-sm ${
                  active === n.id ? "text-[#22d3ee]" : "text-[#f1f5f9]"
                }`}
              >
                {n.label}
              </button>
            ))}
            <a
              href="/CV_Muhammad_Zharfan.pdf"
              download
              className="mt-2 inline-flex items-center justify-center rounded-[8px] bg-[#22d3ee] px-4 py-2 text-sm font-semibold text-[#0b1120]"
            >
              Download CV
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------------- Uploadable Image (localStorage) ---------------- */

function useLocalImage(key: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    try {
      const v = localStorage.getItem(`img:${key}`);
      if (v) setUrl(v);
    } catch {}
  }, [key]);
  const onFile = (file: File) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 4MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result);
      try {
        localStorage.setItem(`img:${key}`, data);
      } catch {
        alert("Gagal menyimpan gambar (storage penuh).");
        return;
      }
      setUrl(data);
    };
    reader.readAsDataURL(file);
  };
  const clear = () => {
    localStorage.removeItem(`img:${key}`);
    setUrl(null);
  };
  return { url, onFile, clear };
}

function UploadableImage({
  storageKey,
  aspect = "16/10",
  label = "Upload foto",
  color = "#22d3ee",
}: {
  storageKey: string;
  aspect?: string;
  label?: string;
  color?: string;
}) {
  const { url, onFile, clear } = useLocalImage(storageKey);
  const inputId = `up-${storageKey}`;
  return (
    <div
      className="relative w-full overflow-hidden bg-[#0b1120] border-b border-[#1e293b] group/img"
      style={{ aspectRatio: aspect }}
    >
      {url ? (
        <>
          <img src={url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover/img:opacity-100">
            <label
              htmlFor={inputId}
              className="cursor-pointer mono text-[11px] rounded-md px-3 py-1.5 bg-[#0b1120]/80 border border-[#22d3ee]/50 text-[#22d3ee] hover:bg-[#22d3ee]/10"
            >
              Ganti
            </label>
            <button
              type="button"
              onClick={clear}
              className="mono text-[11px] rounded-md px-3 py-1.5 bg-[#0b1120]/80 border border-[#ef4444]/50 text-[#ef4444] hover:bg-[#ef4444]/10"
            >
              Hapus
            </button>
          </div>
        </>
      ) : (
        <label
          htmlFor={inputId}
          className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-[#111827]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 40%, rgba(34,211,238,0.08), transparent 60%)",
          }}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center border"
            style={{ borderColor: `${color}55`, background: `${color}18`, color }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <span className="mono text-[11px] text-[#94a3b8]">{label}</span>
        </label>
      )}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}

/* ---------------- Hero ---------------- */

const FULL_NAME = "Muhammad Zharfan\nTashbir Thariqi";

function Typewriter() {
  const [text, setText] = useState("");
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setText(FULL_NAME.slice(0, i));
      if (i >= FULL_NAME.length) clearInterval(id);
    }, 55);
    return () => clearInterval(id);
  }, []);
  return (
    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] whitespace-pre-line min-h-[2.4em]">
      {text}
      <span
        className="inline-block w-[3px] h-[0.9em] align-middle bg-[#22d3ee] ml-1"
        style={{ animation: "blink 1s step-end infinite" }}
      />
    </h1>
  );
}

function Hero() {
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 400);
    return () => clearTimeout(t);
  }, []);
  const certs = useCountUp(9, started);
  const devices = useCountUp(12, started);

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-28 pb-16 overflow-hidden">
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(34,211,238,0.12), transparent 45%), radial-gradient(circle at 80% 70%, rgba(59,130,246,0.10), transparent 45%)",
        }}
      />
      <div className="mx-auto max-w-4xl w-full px-6 text-center relative">
        <div className="mono text-sm text-[#22d3ee] mb-5">&lt; Welcome to My Portfolio &gt;</div>
        <div className="flex justify-center">
          <Typewriter />
        </div>
        <p className="mt-6 text-[#94a3b8] text-lg">
          Building Reliable Networks · MikroTik & Cisco Certified
          <br />
          Network and Computer Engineering student
        </p>
        <p className="mt-5 text-[#94a3b8] max-w-2xl mx-auto leading-relaxed">
          D4 Network & Computer Engineering student at Politeknik IDN Bogor with
          dual vendor certifications (MTCNA · MTCRE · CCNA). Experienced in enterprise
          routing, switching, and network security. Passionate about building efficient,
          fault-tolerant network infrastructure.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <button
            onClick={() =>
              document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })
            }
            className="inline-flex items-center gap-2 rounded-[8px] bg-[#22d3ee] px-5 py-3 text-sm font-semibold text-[#0b1120] transition-all hover:bg-[#67e8f9] hover:shadow-[0_0_28px_rgba(34,211,238,0.45)]"
          >
            → View My Projects
          </button>
          <a
            href="/CV_Muhammad_Zharfan.pdf"
            download
            className="inline-flex items-center gap-2 rounded-[8px] border border-[#22d3ee] px-5 py-3 text-sm font-semibold text-[#22d3ee] transition-all hover:bg-[#22d3ee]/10"
          >
            Download CV
          </a>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-6 max-w-sm mx-auto">
          {[
            { n: certs, s: "9", l: "Certifications" },
            { n: devices, s: "12+", l: "Projects" },
          ].map((it, i) => (
            <div key={i}>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#22d3ee] mono">
                {it.n}
                {it.s.endsWith("+") ? "+" : ""}
              </div>
              <div className="text-xs text-[#94a3b8] mt-1">{it.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Section wrappers ---------------- */

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mono text-xs tracking-[0.25em] text-[#22d3ee] uppercase mb-3">
      {children}
    </div>
  );
}
function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#f1f5f9]">
      {children}
    </h2>
  );
}

/* ---------------- About ---------------- */

function About() {
  return (
    <section id="about" className="py-24 bg-[#0b1120]">
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-[280px_1fr] gap-12 items-start">
        <div className="reveal" data-reveal>
          <div className="relative w-[240px] h-[240px] mx-auto md:mx-0 rounded-full p-[3px] bg-gradient-to-br from-[#22d3ee] to-[#3b82f6] glow-cyan-strong">
            <div className="w-full h-full rounded-full bg-[#111827] overflow-hidden flex items-center justify-center">
              <img
                src="/Profile.jpeg"
                alt="Muhammad Zharfan"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center mono text-[#22d3ee] text-sm pointer-events-none">
              </div>
            </div>
          </div>
        </div>
        <div className="reveal" data-reveal>
          <SectionLabel>About Me</SectionLabel>
          <SectionHeading>
            Aspiring Network Engineer
            <br />
            with a Hands-On Foundation
          </SectionHeading>
          <div className="mt-6 space-y-4 text-[#94a3b8] leading-relaxed text-justify">
            <p>
             I'm Muhammad Zharfan, a Computer and Network Engineering student at Politeknik IDN Bogor with hands-on experience in enterprise networking, IT support, and technical training. I hold three industry certifications (MTCNA, MTCRE, and Cisco CCNA Academy) and enjoy building reliable network infrastructure using Cisco and MikroTik technologies.
            </p>
            <p>
              During my internship, I assembled 15+ custom PCs, and participated in LAN infrastructure, IP CCTV deployment, and operating system installation across multiple client sites. I also served as a Bootcamp Instructor, mentoring 25 participants and helping improve their average post-test scores by 40% through hands-on networking labs.
            </p>
            <p>
              Beyond practical experience, I have authored an MTCNA study guide and developed 10 CCNA enterprise laboratory scenarios, reinforcing both my technical expertise and documentation skills. I am seeking opportunities as a Network Engineer or NOC Engineer, where I can contribute to building, maintaining, and troubleshooting reliable network infrastructures.
            </p>
          </div>
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {[
              { i: "🎓", l: "Education", v: "Politeknik IDN Bogor (D4)" },
              { i: "📍", l: "Location", v: "Balikpapan, East Kalimantan" },
              { i: "🏆", l: "Certifications", v: "MTCNA · MTCRE · CCNA" },
              { i: "💼", l: "Open To", v: "Network Engineer · NOC Engineer" },
            ].map((c) => (
              <div
                key={c.l}
                className="rounded-[12px] border border-[#1e293b] bg-[#111827] p-4 flex items-start gap-3 transition-all hover:border-[#22d3ee]/50 hover:glow-cyan"
              >
                <span className="text-2xl">{c.i}</span>
                <div className="min-w-0">
                  <div className="mono text-[11px] uppercase tracking-wider text-[#94a3b8]">
                    {c.l}
                  </div>
                  <div className="text-sm font-semibold text-[#f1f5f9] mt-1">{c.v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Skills ---------------- */

const SKILL_GROUPS = [
  {
    icon: "🌐",
    title: "Infrastructure & Routing",
    tags: [
      "TCP/IP", "OSPF", "EIGRP", "RIP", "Static Routing",
      "Dynamic Routing IPv6", "Subnetting", "VLSM", "GRE Tunneling",
      "VPN Tunneling", "QoS",
    ],
  },
  {
    icon: "🔀",
    title: "Switching & LAN",
    tags: [
      "VLAN", "Inter-VLAN Routing", "STP", "VTP", "Trunking", "EtherChannel",
      "HSRP", "VRRP", "DHCP", "NAT", "PAT", "ACL", "Port Security",
    ],
  },
  {
    icon: "🛡️",
    title: "Network Security",
    tags: [
      "Firewall Rules", "MikroTik Firewall Chain", "ACL",
      "Network Diagnostics", "Port Security",
    ],
  },
  {
    icon: "🔧",
    title: "Tools & Platforms",
    tags: [
      "MikroTik (Winbox)", "Cisco IOS", "Cisco Packet Tracer", "GNS3", "Pnetlab",
      "VMware", "Wireshark", "PuTTY", "Torch", "Traceroute", "Microsoft Office",
    ],
  },
  {
    icon: "💻",
    title: "Operating Systems",
    tags: ["Windows Networking Fundamentals", "Ubuntu Linux"],
  },
];

function Skills() {
  return (
    <section id="skills" className="py-24 bg-[#0f172a] border-y border-[#1e293b]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="reveal" data-reveal>
          <SectionLabel>Technical Skills</SectionLabel>
          <SectionHeading>What I Work With</SectionHeading>
        </div>
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {SKILL_GROUPS.map((g) => (
            <div
              key={g.title}
              className="reveal rounded-[12px] border border-[#1e293b] bg-[#111827] p-6 transition-all hover:border-[#22d3ee]/40 hover:glow-cyan"
              data-reveal
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{g.icon}</span>
                <h3 className="text-base font-semibold text-[#f1f5f9]">{g.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {g.tags.map((t) => (
                  <span
                    key={t}
                    className="mono text-[11px] rounded-full px-3 py-1 text-[#22d3ee] border border-[#22d3ee]/20 transition-all hover:-translate-y-0.5 hover:border-[#22d3ee]/60 hover:glow-cyan"
                    style={{ background: "rgba(34,211,238,0.08)" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Certifications ---------------- */

const CERTS = [
  {
    id: "ccna-ensa",
    color: "#0EA5E9",
    title: "Cisco CCNA: ENSA",
    full: "Enterprise Networking, Security, and Automation",
    issuer: "Cisco Networking Academy",
    year: "2026",
    desc: "Multi-area OSPF implementation, WAN architecture, network security hardening, QoS, and network automation fundamentals.",
    image: "/certs/ccna-ensa.jpeg",
  },
  {
    id: "ccna-srwe",
    color: "#16A34A",
    title: "Cisco CCNA: SRWE",
    full: "Switching, Routing, and Wireless Essentials",
    issuer: "Cisco Networking Academy",
    year: "2026",
    desc: "VLAN segmentation, STP/RSTP topology, EtherChannel bundling, Inter-VLAN routing, DHCP, WLAN, and FHRP redundancy.",
    image: "/Certificate/CCNA ENSA Certificate.jpg",
  },
  {
    id: "ccna-itn",
    color: "#c52274",
    title: "Cisco CCNA: ITN",
    full: "Introduction to Networks",
    issuer: "Cisco Networking Academy",
    year: "2026",
    desc: "Core networking fundamentals, OSI & TCP/IP stack analysis, IPv4/IPv6 subnetting, Ethernet switching, and CLI initialization.",
    image: "/certs/ccna-itn.png",
  },
  {
    id: "mtcre",
    color: "#3B82F6",
    title: "MikroTik MTCRE",
    full: "MikroTik Certified Routing Engineer",
    issuer: "ID-Networkers",
    year: "2025",
    desc: "Advanced static/dynamic routing, single & multi-area OSPF design, site-to-site VPN tunnels, and traffic engineering.",
    image: "/certs/mtcre.png",
  },
  {
    id: "mtcna",
    color: "#E53E3E",
    title: "MikroTik MTCNA",
    full: "MikroTik Certified Network Associate",
    issuer: "MikroTik · Politeknik IDN",
    year: "2025",
    desc: "RouterOS administration, wireless deployment, basic firewall filtering, NAT rules, queues, and network troubleshooting.",
    image: "/certs/mtcna.png",
  },
  {
    id: "internship-pmt",
    color: "#F59E0B",
    title: "Industrial Internship",
    full: "CV. Putra Mahkota Technology Internship Certificate",
    issuer: "CV. Putra Mahkota Technology",
    year: "2024",
    desc: "Hands-on experience in LAN infrastructure deployment, IP CCTV integration, hardware provisioning, and client maintenance.",
    image: "/certs/magang-pmt.png",
  },
  {
    id: "bnsp-network-support",
    color: "#A855F7",
    title: "BNSP Competency Standard",
    full: "Certified Lead Network Support Technician",
    issuer: "LSP · BNSP Indonesia",
    year: "2025",
    desc: "Certified technical proficiency in enterprise network installation, system maintenance, and operational troubleshooting.",
    image: "/certs/bnsp-network.png",
  },
  {
    id: "bnsp-computer-support",
    color: "#55F7E1",
    title: "BNSP Competency Standard",
    full: "Certified Data Center Computer Support Specialist",
    issuer: "LSP · BNSP Indonesia",
    year: "2025",
    desc: "Assessed technical capability in computer system maintenance, hardware diagnostics, and data center infrastructure support.",
    image: "/certs/bnsp-computer.png",
  },
  {
    id: "aguna-network-fundamental",
    color: "#AECA32",
    title: "Network Fundamentals",
    full: "Aguna Course Network Fundamentals Certification",
    issuer: "Aguna Course",
    year: "2025",
    desc: "Foundational networking concepts, IP addressing schemes, subnetting, and network layer operational fundamentals.",
    image: "/certs/aguna-course.png",
  },
];

function Certifications() {
  return (
    <section id="certifications" className="py-24 bg-[#0b1120]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="reveal" data-reveal>
          <SectionLabel>Credentials</SectionLabel>
          <SectionHeading>Certified & Verified</SectionHeading>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {CERTS.map((c) => (
            <div
              key={c.title}
              className="reveal group rounded-[12px] border border-[#1e293b] bg-[#111827] overflow-hidden transition-all"
              data-reveal
              style={{ ["--cc" as string]: c.color }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = c.color;
                e.currentTarget.style.boxShadow = `0 0 30px ${c.color}33`;
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1e293b";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <UploadableImage
                storageKey={`cert-${c.id}`}
                aspect="4/3"
                label="Upload foto sertifikat"
                color={c.color}
              />
              <div className="p-6">
                <div
                  className="w-14 h-14 rounded-[12px] flex items-center justify-center mb-5"
                  style={{ background: `${c.color}22`, border: `1px solid ${c.color}55` }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2">
                    <rect x="3" y="4" width="18" height="12" rx="2" />
                    <path d="M7 20h10M12 16v4" />
                    <circle cx="8" cy="10" r="1.2" fill={c.color} />
                    <circle cx="12" cy="10" r="1.2" fill={c.color} />
                    <circle cx="16" cy="10" r="1.2" fill={c.color} />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#f1f5f9]">{c.title}</h3>
                <div className="text-sm text-[#94a3b8] mt-1">{c.full}</div>
                <div className="mono text-[11px] text-[#94a3b8] mt-3">
                  {c.issuer} · {c.year}
                </div>
                <p className="text-sm text-[#94a3b8] mt-4 leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Projects ---------------- */

const PROJECTS = [
  {
    id: "p1",
    color: "#F97316",
    name: "ISP Backbone MPLS & Route Redistribution (Multi-Vendor)",
    desc: "Implemented a multi-vendor core backbone lab configuring MPLS topology and complex route redistribution between Cisco IOS and MikroTik RouterOS.",
    tags: ["MPLS", "Label Switching", "Redistribution", "OSPF", "BGP", "Multi-Vendor"],
    tool: "PuTTY (Cisco CLI) · Winbox (MikroTik)",
    details: "Constructed an MPLS core using a hybrid setup (2x Cisco Switches as PE/P routers and 1x MikroTik Router as CE/PE). Configured LDP, established BGP VPNv4 peering, and performed metric-aware route redistribution between dynamic protocols for seamless core-to-edge connectivity."
  },
  {
    id: "p2",
    color: "#A855F7",
    name: "FTTH Infrastructure & HTB Bandwidth Management (RT/RW Net)",
    desc: "Deployed and managed a small-scale FTTH community network serving multiple clients, featuring Fiber Media Converters and advanced HTB traffic shaping.",
    tags: ["FTTH", "Traffic Shaping (HTB)", "QoS", "Bandwidth Management", "Network Monitoring"],
    tool: "MikroTik Winbox · The Dude · FTTx Hardware",
    details: "Built an end-to-end FTTH network utilizing 3 FTTH Media Converters (HTB) for client access. Implemented Hierarchical Token Bucket (HTB) for precise QoS per client, and deployed MikroTik The Dude for real-time latency and uptime monitoring."
  },
  {
    id: "p3",
    color: "#14B8A6",
    name: "Server Room CCTV & L2 Access Provisioning",
    desc: "Provisioned Layer 2 switches and deployed batch IP CCTV cameras within a server room environment for multi-floor surveillance.",
    tags: ["Layer 2 Switching", "VLAN Provisioning", "IP Addressing", "SADP", "Physical Security"],
    tool: "SADP (Hikvision) · Real Hardware · L2 Switches",
    details: "Configured switch port access, designated CCTV VLANs, and utilized SADP for batch IP address allocation and activation of network cameras to ensure stable video feeds to the central NVR."
  },
    {
    id: "p4",
    color: "#EC4899",
    name: "Hardware Maintenance & Peripheral Troubleshooting",
    desc: "Performed hardware diagnostic, mechanical repair, and network connectivity configuration for enterprise printing units.",
    tags: ["Hardware Diagnostics", "Preventive Maintenance", "Peripheral Connectivity"],
    tool: "Diagnostic Kits · Hardware Tools",
    details: "Diagnosed hardware faults, replaced mechanical components, updated system drivers/firmware, and verified network availability for shared office peripherals."
  },
 {
    id: "p5",
    color: "#3B82F6",
    name: "PT. HAMBALI GROUP — Enterprise Corporate Network",
    desc: "Designed an enterprise multi-department network topology for PT. Hambali Group featuring OSPF Multi-Area, HSRP redundancy, and L2/L3 security controls.",
    tags: [
      "ROAS",
      "SVI",
      "HSRP",
      "VTP",
      "STP",
      "DHCP",
      "OSPF Multi-Area",
      "VLAN Trunking",
      "Port-Security",
      "EtherChannel",
      "SSH"
    ],
    tool: "Cisco Packet Tracer",
    details: "Enterprise network topology for PT. Hambali Group featuring OSPF Multi-Area (Area 0 & 1), HSRP gateway redundancy, EtherChannel link aggregation for Data Center servers, VTP/VLAN segmentation across departments, DHCP services, Port-Security, and SSH management."
  },{
    id: "p6",
    color: "#E53E3E",
    name: "PT. SINAR MAKMUR — Multi-Area OSPF & Multi-Site Corporate Network",
    desc: "Designed an enterprise multi-site network topology for PT. Sinar Makmur featuring 3-Area OSPF routing, Internet WAN gateway, DHCP Relay, and Wireless LAN integration.",
    tags: [
      "SVI",
      "VTP",
      "VLAN Trunking",
      "STP",
      "DHCP Server & Relay",
      "OSPF Multi-Area",
      "Wireless LAN",
      "EtherChannel",
      "Static Route"
    ],
    tool: "Cisco Packet Tracer",
    details: "Multi-site enterprise topology for PT. Sinar Makmur featuring 3-Area OSPF routing (Area 0, 1, 2), Static Routing to WAN/Google.com, central Data Center servers, DHCP Relay for remote clients, EtherChannel, and integrated Wireless Access Points."
  },{
    id: "p7",
    color: "#8B5CF6",
    name: "WARNET SANJAYA MAKMUR — Hybrid Routing & Redistribution Network",
    desc: "Designed an enterprise network topology for Warnet Sanjaya Makmur featuring hybrid routing (EIGRP & OSPF), route redistribution, and custom Allowed Trunking.",
    tags: [
      "EIGRP",
      "OSPF",
      "Route Redistribution",
      "Allowed Trunk",
      "SVI",
      "EtherChannel",
      "Wireless LAN",
      "Telnet",
      "DHCP"
    ],
    tool: "Cisco Packet Tracer",
    details: "Multi-branch hybrid topology for Warnet Sanjaya Makmur connecting EIGRP and OSPF routing domains via central Route Redistribution, featuring Allowed Trunking security, EtherChannel link aggregation, Wireless Access Points, SVI routing, and Telnet remote management."
  },
  {
    id: "p8",
    color: "#0EA5E9",
    name: "NASIR CORPORATION — Centralized EIGRP Infrastructure",
    desc: "Designed a centralized enterprise network topology for Nasir Corporation featuring EIGRP routing backbone, dedicated DNS/Web servers, and Inter-VLAN routing.",
    tags: [
      "EIGRP",
      "SVI",
      "Inter-VLAN Routing",
      "VLAN Trunking",
      "VTP",
      "STP",
      "DHCP",
      "DNS & Web Server",
      "SSH"
    ],
    tool: "Cisco Packet Tracer",
    details: "Centralized enterprise topology for Nasir Corporation featuring EIGRP backbone routing centered on R-Utama, dedicated DNS and Web Server infrastructure, L3 SVI Inter-VLAN routing, VTP/STP management, DHCP distribution, and SSH remote management."
  },
{
    id: "p9",
    color: "#22C55E",
    name: "PT. INDAH MULIA — EIGRP Backbone & HSRP Redundancy Network",
    desc: "Designed an enterprise network topology for PT. Indah Mulia featuring EIGRP backbone routing, HSRP gateway redundancy, and Data Center EtherChannel bundling.",
    tags: [
      "EIGRP",
      "HSRP",
      "SVI",
      "EtherChannel",
      "Wireless LAN",
      "VLAN Trunking",
      "Port-Security",
      "VTP",
      "STP",
      "DHCP"
    ],
    tool: "Cisco Packet Tracer",
    details: "Enterprise network topology for PT. Indah Mulia built on EIGRP 10 backbone routing, HSRP gateway redundancy across core switches, EtherChannel link aggregation for Data Center servers, Wireless Access Points, VTP/STP management, DHCP services, and Port-Security."
  },
{
    id: "p10",
    color: "#F59E0B",
    name: "POLITEKNIK INDAH MULIA — Multi-Area OSPF Campus Infrastructure",
    desc: "Designed a multi-department campus network topology for Politeknik Indah Mulia featuring Multi-Area OSPF, extensive VLAN segmentation, and dedicated campus servers.",
    tags: [
      "OSPF Multi-Area",
      "Inter-VLAN Routing",
      "SVI",
      "Wireless LAN",
      "DNS & Web Server",
      "EtherChannel",
      "VLAN Trunking",
      "VTP",
      "STP",
      "DHCP"
    ],
    tool: "Cisco Packet Tracer",
    details: "Large-scale campus network topology for Politeknik Indah Mulia using OSPF Multi-Area (Area 0 & 1) connecting academic units, integrated Wireless Access Points, 10+ department VLAN segments, SVI Inter-VLAN routing, and centralized DNS/Web Server infrastructure."
  },
  {
    id: "p11",
    color: "#06B6D4",
    name: "PT NUSANET EDUKASI INDONESIA — Multi-Site OSPF Infrastructure",
    desc: "Designed a multi-site network topology for PT Nusanet Edukasi Indonesia featuring OSPF Multi-Area routing, central server farm, and L2 Port-Security.",
    tags: [
      "OSPF Multi-Area",
      "Inter-VLAN Routing",
      "SVI",
      "Port-Security",
      "Wireless LAN",
      "DNS & Web Server",
      "VTP",
      "STP",
      "DHCP"
    ],
    tool: "Cisco Packet Tracer",
    details: "Multi-site enterprise topology for PT Nusanet Edukasi Indonesia connecting Head Office and Branch sites using OSPF Multi-Area (Area 0 & 1), centralized DNS and Web Server infrastructure, SVI Inter-VLAN routing, Wireless Access Points, and access-port Port-Security."
  },{
    id: "p12",
    color: "#84CC16",
    name: "PT ANTON STORE — Enterprise Site-to-Site Tunnel & NAT Network",
    desc: "Designed a secure multi-site enterprise network for PT Anton Store utilizing GRE Tunnel across WAN, dual-domain EIGRP routing, and NAT translation.",
    tags: [
      "GRE Tunnel",
      "NAT",
      "EIGRP",
      "SVI",
      "VLAN Trunking",
      "DNS & Web Server",
      "VTP",
      "STP",
      "DHCP"
    ],
    tool: "Cisco Packet Tracer",
    details: "Site-to-site enterprise topology for PT Anton Store connecting Kantor-1 and Kantor-2 via GRE Tunnel across simulated WAN, featuring isolated EIGRP 10 & 20 routing domains, Network Address Translation (NAT), central DNS/Web Server farm, and SVI VLAN management."
  },
];

function ProjectCard({ p }: { p: (typeof PROJECTS)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="reveal group rounded-[12px] border border-[#1e293b] bg-[#111827] overflow-hidden transition-all hover:-translate-y-1"
      data-reveal
      style={{ ["--pc" as string]: p.color }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 28px ${p.color}30`)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      <div className="h-1.5" style={{ background: p.color }} />
      <UploadableImage
        storageKey={`proj-${p.id}`}
        aspect="16/10"
        label="Upload foto proyek"
        color={p.color}
      />
      <div className="p-6">
        <h3 className="text-lg font-bold text-[#f1f5f9]">{p.name}</h3>
        <p className="text-sm text-[#94a3b8] mt-3 leading-relaxed">{p.desc}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {p.tags.map((t) => (
            <span
              key={t}
              className="mono text-[10px] rounded-full px-2 py-0.5 text-[#22d3ee] border border-[#22d3ee]/20"
              style={{ background: "rgba(34,211,238,0.08)" }}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mono text-[11px] text-[#94a3b8] mt-4">
          Tool: <span className="text-[#f1f5f9]">{p.tool}</span>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
          style={{ color: p.color }}
        >
          {open ? "Hide Details ↑" : "View Details →"}
        </button>
        <div
          className="overflow-hidden transition-all duration-300"
          style={{ maxHeight: open ? 400 : 0 }}
        >
          <p className="text-sm text-[#94a3b8] mt-4 pt-4 border-t border-[#1e293b] leading-relaxed">
            {p.details}
          </p>
        </div>
      </div>
    </div>
  );
}

function Projects() {
  return (
    <section id="projects" className="py-24 bg-[#0f172a] border-y border-[#1e293b]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="reveal" data-reveal>
          <SectionLabel>Lab Work & Projects</SectionLabel>
          <SectionHeading>Network Implementations</SectionHeading>
        </div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROJECTS.map((p) => (
            <ProjectCard key={p.name} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Experience & Education ---------------- */

const WORK = [
  {
    role: "Bootcamp Instructor — MTCRE Curriculum",
    company: "Politeknik IDN",
    period: "2025",
    badge: "Teaching",
    bullets: [
      "Delivered MTCRE bootcamp curriculum to participants",
      "Guided hands-on lab sessions covering advanced MikroTik routing",
      "Achieved 40% improvement in participant post-test scores",
    ],
  },
  {
    role: "IT Support & Network Technician Intern",
    company: "CV. Putra Mahkota Technology",
    period: "April – June 2024",
    location: "Balikpapan, East Kalimantan",
    badge: "Internship",
    bullets: [
      "Installed and configured LAN networks and CCTV systems for business clients",
      "Serviced and repaired 50+ hardware units (PCs, laptops, printers)",
      "Created documentation for maintenance reports and device configurations",
    ],
  },
];

const EDU = [
  {
    inst: "Politeknik IDN Bogor",
    degree: "D4 — Computer and Network Engineering (TRKJ)",
    period: "July 2025 – 2029 (Active)",
    focus: "Enterprise Networking · Cisco & MikroTik Routing · Network Security Basics",
    badge: "Current",
  },
  {
    inst: "SMKN 1 Balikpapan",
    degree: "Vocational — Computer & Network Engineering (TKJ)",
    period: "2022 – 2025",
    focus: "Network Installation · Configuration & Maintenance · Computer Assembly",
    badge: "Graduated",
  },
];

function TimelineItem({
  title,
  subtitle,
  period,
  badge,
  extra,
  children,
}: {
  title: string;
  subtitle: string;
  period: string;
  badge: string;
  extra?: string;
  children?: ReactNode;
}) {
  return (
    <div className="reveal relative pl-8" data-reveal>
      <span className="absolute left-0 top-2 w-3 h-3 rounded-full bg-[#22d3ee] glow-cyan-strong" />
      <span className="absolute left-[5px] top-6 bottom-[-24px] w-px bg-[#1e293b]" />
      <div className="rounded-[12px] border border-[#1e293b] bg-[#111827] p-5 transition-all hover:border-[#22d3ee]/40 hover:glow-cyan">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-bold text-[#f1f5f9]">{title}</h4>
            <div className="text-sm text-[#22d3ee]">{subtitle}</div>
          </div>
          <span className="mono text-[10px] uppercase tracking-wider rounded-full px-2 py-1 text-[#22d3ee] border border-[#22d3ee]/40 bg-[#22d3ee]/10 shrink-0">
            {badge}
          </span>
        </div>
        <div className="mono text-[11px] text-[#94a3b8] mt-2">
          {period}
          {extra ? ` · ${extra}` : ""}
        </div>
        {children && <div className="mt-3 text-sm text-[#94a3b8]">{children}</div>}
      </div>
    </div>
  );
}

function Experience() {
  return (
    <section id="experience" className="py-24 bg-[#0b1120]">
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12">
        <div>
          <div className="reveal" data-reveal>
            <SectionLabel>Work Experience</SectionLabel>
            <SectionHeading>Where I've Worked</SectionHeading>
          </div>
          <div className="mt-10 space-y-6">
            {WORK.map((w) => (
              <TimelineItem
                key={w.role}
                title={w.role}
                subtitle={w.company}
                period={w.period}
                badge={w.badge}
                extra={w.location}
              >
                <ul className="space-y-1.5">
                  {w.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="text-[#22d3ee]">·</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </TimelineItem>
            ))}
          </div>
        </div>
        <div>
          <div className="reveal" data-reveal>
            <SectionLabel>Education</SectionLabel>
            <SectionHeading>Academic Background</SectionHeading>
          </div>
          <div className="mt-10 space-y-6">
            {EDU.map((e) => (
              <TimelineItem
                key={e.inst}
                title={e.inst}
                subtitle={e.degree}
                period={e.period}
                badge={e.badge}
              >
                <div className="text-[#94a3b8]">{e.focus}</div>
              </TimelineItem>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Contact ---------------- */

function Toast({ show, onDone }: { show: boolean; onDone: () => void }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [show, onDone]);
  if (!show) return null;
  return (
    <div
      className="fixed bottom-6 right-6 z-[60] rounded-[8px] border border-[#22d3ee]/50 bg-[#111827] px-4 py-3 text-sm text-[#f1f5f9] glow-cyan-strong"
      style={{ animation: "slideDown 250ms ease" }}
    >
      ✓ Message sent! I'll respond within 24 hours.
    </div>
  );
}

const CONTACT_ITEMS = [
  { i: "📱", l: "Phone / WhatsApp", v: "+62 858-1472-0186", href: "https://wa.me/6285814720186" },
  { i: "📧", l: "Email", v: "zharfantbt@gmail.com", href: "mailto:zharfantbt@gmail.com" },
  { i: "💼", l: "LinkedIn", v: "linkedin.com/in/zharfan-tashbir", href: "https://linkedin.com/in/zharfan-tashbir" },
  { i: "📍", l: "Location", v: "Balikpapan, East Kalimantan · Open to relocation", href: null },
];

function Contact() {
  const [toast, setToast] = useState(false);
  return (
    <section id="contact" className="py-24 bg-[#0f172a] border-t border-[#1e293b]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="reveal" data-reveal>
          <SectionLabel>Get in Touch</SectionLabel>
          <SectionHeading>Let's Build Something Together</SectionHeading>
        </div>
        <div className="mt-12 grid lg:grid-cols-2 gap-10">
          <div className="reveal space-y-4" data-reveal>
            {CONTACT_ITEMS.map((c) => {
              const inner = (
                <div className="rounded-[12px] border border-[#1e293b] bg-[#111827] p-5 flex items-start gap-4 transition-all hover:border-[#22d3ee]/50 hover:glow-cyan">
                  <div
                    className="w-11 h-11 rounded-[8px] flex items-center justify-center text-xl shrink-0"
                    style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)" }}
                  >
                    {c.i}
                  </div>
                  <div className="min-w-0">
                    <div className="mono text-[11px] uppercase tracking-wider text-[#94a3b8]">
                      {c.l}
                    </div>
                    <div className="text-sm text-[#f1f5f9] mt-1 break-words">{c.v}</div>
                  </div>
                </div>
              );
              return c.href ? (
                <a
                  key={c.l}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="block"
                >
                  {inner}
                </a>
              ) : (
                <div key={c.l}>{inner}</div>
              );
            })}
          </div>
          <form
            className="reveal rounded-[12px] border border-[#1e293b] bg-[#111827] p-6 space-y-4"
            data-reveal
            onSubmit={(e) => {
              e.preventDefault();
              (e.currentTarget as HTMLFormElement).reset();
              setToast(true);
            }}
          >
            {[
              { n: "name", l: "Full Name", req: true, type: "text" },
              { n: "email", l: "Email", req: true, type: "email" },
              { n: "company", l: "Company / Organization (optional)", req: false, type: "text" },
              { n: "subject", l: "Subject", req: true, type: "text" },
            ].map((f) => (
              <div key={f.n}>
                <label className="mono text-[11px] uppercase tracking-wider text-[#94a3b8] block mb-2">
                  {f.l}
                </label>
                <input
                  type={f.type}
                  required={f.req}
                  className="w-full rounded-[8px] bg-[#0b1120] border border-[#1e293b] px-4 py-2.5 text-sm text-[#f1f5f9] outline-none transition-colors focus:border-[#22d3ee]"
                />
              </div>
            ))}
            <div>
              <label className="mono text-[11px] uppercase tracking-wider text-[#94a3b8] block mb-2">
                Message
              </label>
              <textarea
                required
                rows={5}
                className="w-full rounded-[8px] bg-[#0b1120] border border-[#1e293b] px-4 py-2.5 text-sm text-[#f1f5f9] outline-none transition-colors focus:border-[#22d3ee] resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-[8px] bg-[#22d3ee] px-5 py-3 text-sm font-semibold text-[#0b1120] transition-all hover:bg-[#67e8f9] hover:shadow-[0_0_24px_rgba(34,211,238,0.4)]"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
      <Toast show={toast} onDone={() => setToast(false)} />
    </section>
  );
}

/* ---------------- Footer ---------------- */

function Footer() {
  return (
    <footer className="bg-[#0b1120] border-t border-[#1e293b] py-10">
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-3 gap-6 items-center">
        <div className="text-sm text-[#94a3b8]">
          <span className="text-[#f1f5f9] font-semibold">Muhammad Zharfan Tashbir Thariqi</span> — Network Engineer
        </div>
        <div className="flex flex-wrap justify-center gap-5 text-sm text-[#94a3b8]">
          {["about", "skills", "projects", "contact"].map((id) => (
            <button
              key={id}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
              className="hover:text-[#22d3ee] transition-colors capitalize"
            >
              {id}
            </button>
          ))}
        </div>
        <div className="flex md:justify-end gap-3">
          <a
            href="https://linkedin.com/in/zharfan-tashbir"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="w-10 h-10 rounded-[8px] border border-[#1e293b] bg-[#111827] flex items-center justify-center text-[#22d3ee] transition-all hover:border-[#22d3ee]/50 hover:glow-cyan"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.98 3.5a2.5 2.5 0 11.02 5 2.5 2.5 0 01-.02-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.04 0 4.78 2.66 4.78 6.12V21h-4v-5.36c0-1.28-.02-2.92-1.78-2.92-1.79 0-2.06 1.4-2.06 2.83V21h-4z"/>
            </svg>
          </a>
          <a
            href="https://wa.me/6285814720186"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="w-10 h-10 rounded-[8px] border border-[#1e293b] bg-[#111827] flex items-center justify-center text-[#22d3ee] transition-all hover:border-[#22d3ee]/50 hover:glow-cyan"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.5 3.5A11.9 11.9 0 0012.05 0C5.5 0 .2 5.3.2 11.85c0 2.1.55 4.15 1.6 5.95L0 24l6.35-1.66a11.85 11.85 0 005.7 1.46h.01c6.55 0 11.85-5.3 11.85-11.85 0-3.16-1.23-6.14-3.41-8.45zM12.06 21.8h-.01a9.9 9.9 0 01-5.05-1.39l-.36-.21-3.77.99 1-3.67-.23-.38a9.9 9.9 0 01-1.52-5.29c0-5.46 4.44-9.9 9.9-9.9a9.85 9.85 0 019.9 9.9c0 5.46-4.44 9.95-9.86 9.95zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.34.22-.63.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.04-.17-.3-.02-.46.13-.6.13-.13.3-.34.44-.5.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.91-2.19-.24-.57-.48-.5-.66-.5h-.56c-.2 0-.52.07-.79.37-.27.3-1.03 1-1.03 2.45s1.06 2.84 1.2 3.04c.15.2 2.09 3.2 5.07 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.56-.35z"/>
            </svg>
          </a>
        </div>
        <div className="md:col-span-3 text-center text-xs text-[#94a3b8] pt-4 border-t border-[#1e293b]">
          © 2025 Muhammad Zharfan. Built for Network Engineering opportunities.
        </div>
      </div>
    </footer>
  );
}

/* ---------------- Back to top ---------------- */

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-6 left-6 z-50 w-11 h-11 rounded-full bg-[#22d3ee] text-[#0b1120] flex items-center justify-center font-bold shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all hover:scale-110"
      style={{ animation: "slideDown 250ms ease" }}
    >
      ↑
    </button>
  );
}

/* ---------------- Root ---------------- */

function Portfolio() {
  useReveal();
  return (
    <div className="min-h-screen bg-[#0b1120] text-[#f1f5f9]">
      <Nav />
      <main>
        <Hero />
        <About />
        <Skills />
        <Certifications />
        <Projects />
        <Experience />
        <Contact />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
