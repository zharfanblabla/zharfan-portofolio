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

/* ---------------- Network Canvas ---------------- */

type NodeT = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  label: string;
  role: string;
};

const NODE_META = [
  { label: "R1", role: "Core Router — OSPF" },
  { label: "R2", role: "Edge Router — BGP" },
  { label: "SW1", role: "L2 Switch — VTP" },
  { label: "SW2", role: "L3 Switch — HSRP" },
  { label: "FW", role: "Firewall — ACL" },
  { label: "AP", role: "Access Point" },
  { label: "MT", role: "MikroTik — MTCRE" },
  { label: "SRV", role: "NOC Server" },
];

function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let nodes: NodeT[] = [];
    let edges: [number, number][] = [];
    let hovered = -1;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      layout(r.width, r.height);
    };

    const layout = (w: number, h: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.36;
      nodes = NODE_META.map((m, i) => {
        const a = (i / NODE_META.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * R;
        const y = cy + Math.sin(a) * R;
        return {
          x,
          y,
          vx: 0,
          vy: 0,
          baseX: x,
          baseY: y,
          label: m.label,
          role: m.role,
        };
      });
      edges = [
        [0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5],
        [4, 6], [5, 6], [6, 7], [7, 0], [1, 4], [3, 7],
      ];
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const onMove = (ev: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const mx = ev.clientX - r.left;
      const my = ev.clientY - r.top;
      let found = -1;
      for (let i = 0; i < nodes.length; i++) {
        const dx = nodes[i].x - mx;
        const dy = nodes[i].y - my;
        if (dx * dx + dy * dy < 22 * 22) {
          found = i;
          break;
        }
      }
      hovered = found;
      if (found >= 0) {
        setTooltip({ x: nodes[found].x, y: nodes[found].y - 34, text: nodes[found].role });
      } else {
        setTooltip(null);
      }
    };
    const onLeave = () => {
      hovered = -1;
      setTooltip(null);
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    let t = 0;
    const draw = () => {
      t += 0.016;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Float
      nodes.forEach((n, i) => {
        n.x = n.baseX + Math.sin(t * 0.9 + i) * 4;
        n.y = n.baseY + Math.cos(t * 0.8 + i * 1.3) * 4;
      });

      // Edges (dashed) + packets
      edges.forEach(([a, b], idx) => {
        const na = nodes[a];
        const nb = nodes[b];
        ctx.strokeStyle = "rgba(34,211,238,0.18)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = -t * 20;
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // packet dot
        const p = ((t * 0.25) + idx * 0.13) % 1;
        const px = na.x + (nb.x - na.x) * p;
        const py = na.y + (nb.y - na.y) * p;
        ctx.fillStyle = "#22d3ee";
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Nodes
      nodes.forEach((n, i) => {
        const isHover = i === hovered;
        const r = isHover ? 16 : 12;
        // outer glow
        const grad = ctx.createRadialGradient(n.x, n.y, 2, n.x, n.y, r * 2.2);
        grad.addColorStop(0, "rgba(34,211,238,0.55)");
        grad.addColorStop(1, "rgba(34,211,238,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // node core
        ctx.fillStyle = isHover ? "#22d3ee" : "#0b1120";
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // label
        ctx.fillStyle = isHover ? "#0b1120" : "#22d3ee";
        ctx.font = "600 10px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.label, n.x, n.y);
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full h-[420px] sm:h-[500px]">
      <canvas ref={canvasRef} className="w-full h-full" />
      {tooltip && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full mono text-[11px] bg-[#0b1120] border border-[#22d3ee]/50 text-[#22d3ee] rounded-md px-2 py-1 glow-cyan"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
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
  const certs = useCountUp(3, started);
  const devices = useCountUp(50, started);
  const cctvs = useCountUp(77, started);

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-28 pb-16 overflow-hidden">
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(34,211,238,0.12), transparent 45%), radial-gradient(circle at 80% 70%, rgba(59,130,246,0.10), transparent 45%)",
        }}
      />
      <div className="mx-auto max-w-7xl w-full px-6 grid lg:grid-cols-[55fr_45fr] gap-10 items-center relative">
        <div>
          <div className="mono text-sm text-[#22d3ee] mb-5">&lt; Network Engineer /&gt;</div>
          <Typewriter />
          <p className="mt-6 text-[#94a3b8] text-lg">
            Building Reliable Networks · MikroTik & Cisco Certified
            <br />
            NOC Engineer · IT Infrastructure Specialist
          </p>
          <p className="mt-5 text-[#94a3b8] max-w-xl leading-relaxed">
            D4 Network & Computer Engineering student at Politeknik IDN Bogor with
            dual vendor certifications (MTCNA · MTCRE · CCNA). Experienced in enterprise
            routing, switching, and network security. Passionate about building efficient,
            fault-tolerant network infrastructure.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
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
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-lg">
            {[
              { n: certs, s: "3", l: "Certifications" },
              { n: devices, s: "50+", l: "Devices Serviced" },
              { n: cctvs, s: "77", l: "CCTV Installations" },
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
        <div className="relative rounded-[12px] border border-[#1e293b] bg-[#0f172a]/60 glow-cyan overflow-hidden">
          <div className="mono text-[11px] text-[#94a3b8] px-4 pt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22d3ee] animate-pulse" />
            network.topology · live
          </div>
          <NetworkCanvas />
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
                src="foto.jpeg"
                alt="Muhammad Zharfan"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center mono text-[#22d3ee] text-sm pointer-events-none">
                foto.jpeg
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
          <div className="mt-6 space-y-4 text-[#94a3b8] leading-relaxed">
            <p>
              I'm Muhammad Zharfan, a Computer and Network Engineering student
              currently enrolled at Politeknik IDN Bogor. My networking journey
              started at SMKN 1 Balikpapan, where I built a strong foundation
              in network systems and later earned dual MikroTik certifications
              (MTCNA and MTCRE) and completed all three CCNA curriculum modules
              through Cisco Networking Academy.
            </p>
            <p>
              I've gained real-world experience through an internship at
              CV. Putra Mahkota Technology, where I handled LAN installation,
              CCTV deployment, and hardware maintenance for business clients.
              I also served as a Bootcamp Instructor delivering MTCRE curriculum,
              helping participants achieve a 40% improvement in post-test scores.
            </p>
            <p>
              My target roles are Network Engineer and NOC Engineer, where I can
              apply my knowledge of routing protocols, switching, and network
              monitoring in a production environment.
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
      "TCP/IP", "OSPF", "EIGRP", "RIP", "BGP (Basic)", "Static Routing",
      "Dynamic Routing IPv6", "Subnetting", "VLSM", "GRE Tunneling", "MPLS",
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
    color: "#E53E3E",
    title: "MikroTik MTCNA",
    full: "MikroTik Certified Network Associate",
    issuer: "MikroTik · Politeknik IDN",
    year: "2025",
    desc: "RouterOS fundamentals, wireless, basic routing, firewall, and troubleshooting.",
  },
  {
    color: "#3B82F6",
    title: "MikroTik MTCRE",
    full: "MikroTik Certified Routing Engineer",
    issuer: "ID-Networkers",
    year: "2025",
    desc: "Advanced routing with OSPF, traffic engineering, complex multi-site network design.",
  },
  {
    color: "#22C55E",
    title: "Cisco CCNA Curriculum",
    full: "ITN · SRWE · ENSA (All 3 Modules)",
    issuer: "Cisco Networking Academy",
    year: "2026",
    desc: "Enterprise networking, routing & switching, security fundamentals, automation basics.",
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
              className="reveal group rounded-[12px] border border-[#1e293b] bg-[#111827] p-6 transition-all"
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
              <button
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: c.color }}
              >
                View Certificate →
              </button>
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
    color: "#3B82F6",
    name: "Multi-Area OSPF Campus Network",
    desc: "Designed and implemented a large-scale multi-site campus topology using OSPF multi-area, covering 10+ CCNA-level topics in a single SuperLab.",
    tags: ["OSPF", "Multi-Area", "EIGRP", "GRE Tunnel", "NAT/PAT", "EtherChannel", "VTP", "HSRP", "Port Security"],
    tool: "Cisco Packet Tracer",
    details:
      "SuperLab includes multi-area OSPF design, redistribution between EIGRP and OSPF, GRE tunneling between sites, NAT/PAT for internet edge, EtherChannel bundles between distribution/access, VTP domain propagation, HSRP first-hop redundancy, and Port Security on access ports.",
  },
  {
    color: "#E53E3E",
    name: "MikroTik MTCRE Lab — Advanced Routing",
    desc: "Built MTCRE exam-level lab scenarios covering OSPF on MikroTik, multi-path routing, traffic engineering, and tunnel configurations.",
    tags: ["MikroTik RouterOS", "OSPF", "GRE", "Policy Routing", "Traffic Engineering"],
    tool: "Winbox · Pnetlab",
    details:
      "MTCRE-focused lab: OSPF areas & virtual-link, ECMP and route selection, mangle-based policy routing, GRE + IPIP tunnels, and OSPF over tunnel scenarios simulated in Pnetlab.",
  },
  {
    color: "#8B5CF6",
    name: "Enterprise WAN & VLAN Topology",
    desc: "Multi-ISP WAN design with VLAN segmentation for different departments, QoS implementation, and network security policies.",
    tags: ["VLAN", "Inter-VLAN Routing", "NAT", "ACL", "QoS", "Firewall"],
    tool: "Cisco Packet Tracer · GNS3",
    details:
      "Dual-ISP edge with failover, VLAN-per-department segmentation, inter-VLAN routing on L3 switch, extended ACLs for east-west traffic control, and QoS classification/marking for VoIP.",
  },
  {
    color: "#22C55E",
    name: 'CCNA Study Module — "Sahabat Superlab"',
    desc: "Authored a comprehensive CCNA study module covering 10 lab scenarios including VLAN, STP, OSPF, EIGRP, EtherChannel, ACL, NAT, and DHCP — used as final-semester academic material.",
    tags: ["VLAN", "STP", "OSPF", "EIGRP", "ACL", "NAT", "DHCP", "Documentation"],
    tool: "Cisco Packet Tracer",
    details:
      "Ten lab chapters with step-by-step configuration, verification commands, and expected outputs. Adopted as final-semester academic material.",
  },
  {
    color: "#F59E0B",
    name: "MTCNA Reference Book",
    desc: 'Wrote a MikroTik reference book titled "Basics of Computer Network Science" containing theory, basic MikroTik configuration guides, and lab exercises.',
    tags: ["MikroTik", "RouterOS", "Documentation", "Technical Writing"],
    tool: "Winbox · Written Material",
    details:
      "Covers OSI/TCP-IP foundations, RouterOS interface, IP addressing, firewall chain fundamentals, wireless, and end-of-chapter lab exercises.",
  },
  {
    color: "#06B6D4",
    name: "CCTV & LAN Infrastructure Deployment",
    desc: "Installed and configured 77 CCTV units and LAN networks for business clients during internship. Handled IP configuration, cable management, and device documentation.",
    tags: ["CCTV Setup", "LAN Installation", "IP Configuration", "Network Cabling"],
    tool: "Real Hardware · IP Camera Systems",
    details:
      "End-to-end deployment: site survey, cable pulling and termination, PoE switch provisioning, NVR configuration, static IP allocation, and per-site documentation binders.",
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
