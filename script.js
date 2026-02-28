const sections = document.querySelectorAll("section");
// Paste your Google Apps Script Web App URL here.
const TRACK_URL = "https://script.google.com/macros/s/AKfycbzi8SEecLP6C7C44JMjMlnAUavkaETJxr7g1xbE_uWidpUUOh3WObfBHtWLlUxp0euF/exec";

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      }
    });
  },
  { threshold: 0.2 }
);

sections.forEach((section) => observer.observe(section));

const basePayload = () => ({
  page: location.href,
  referrer: document.referrer || "direct",
  userAgent: navigator.userAgent,
  language: navigator.language,
  platform: navigator.platform,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});

const sendVisit = async (extra = {}) => {
  try {
    await fetch(TRACK_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({ ...basePayload(), ...extra }),
    });
    setStatus("online", "Tracker enabled");
  } catch (error) {
    // Fail silently if the tracker is offline.
    setStatus("offline", "Tracker offline");
  }
};

const statusBadge = document.querySelector("#tracker-status");
const setStatus = (state, label) => {
  if (!statusBadge) return;
  const params = new URLSearchParams(window.location.search);
  const isAdmin = params.get("admin") === "1";
  statusBadge.dataset.status = state;
  statusBadge.textContent = label;
  statusBadge.style.display = isAdmin ? "inline-flex" : "none";
};

setStatus("offline", "Tracker offline");
sendVisit();

const visitorForm = document.querySelector("#visitor-form");
if (visitorForm) {
  visitorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const nameInput = document.querySelector("#visitor-name");
    const name = nameInput?.value?.trim();
    if (name) {
      sendVisit({ name });
      nameInput.value = "";
    }
  });
}

const adminButton = document.querySelector(".admin-only");
if (adminButton) {
  const params = new URLSearchParams(window.location.search);
  if (params.get("admin") === "1") {
    adminButton.style.display = "inline-flex";
  }
}

const canvas = document.querySelector("#bg-canvas");
if (canvas instanceof HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    width: 0,
    height: 0,
    particles: [],
    mouse: { x: 0, y: 0 },
  };

  const resize = () => {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    canvas.width = state.width;
    canvas.height = state.height;
    const count = Math.floor(Math.min(120, Math.max(50, state.width / 12)));
    state.particles = Array.from({ length: count }, () => ({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.6,
    }));
  };

  const draw = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, state.width, state.height);
    ctx.fillStyle = "rgba(120, 200, 255, 0.9)";
    ctx.strokeStyle = "rgba(120, 200, 255, 0.15)";

    for (const p of state.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > state.width) p.vx *= -1;
      if (p.y < 0 || p.y > state.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < state.particles.length; i++) {
      for (let j = i + 1; j < state.particles.length; j++) {
        const a = state.particles[i];
        const b = state.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120) {
          ctx.globalAlpha = 1 - dist / 120;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    if (!prefersReducedMotion) {
      requestAnimationFrame(draw);
    }
  };

  resize();
  window.addEventListener("resize", resize);
  if (!prefersReducedMotion) {
    requestAnimationFrame(draw);
  } else {
    draw();
  }
}
