const sections = document.querySelectorAll("section");
const TRACK_URL = "https://portfolio-ph0w.onrender.com/track";
const HEALTH_URL = "https://portfolio-ph0w.onrender.com/health";

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...basePayload(), ...extra }),
    });
  } catch (error) {
    // Fail silently if the tracker is offline.
  }
};

sendVisit();

const statusBadge = document.querySelector("#tracker-status");
const setStatus = (state, label) => {
  if (!statusBadge) return;
  const params = new URLSearchParams(window.location.search);
  const isAdmin = params.get("admin") === "1";
  statusBadge.dataset.status = state;
  statusBadge.textContent = label;
  statusBadge.style.display = isAdmin ? "inline-flex" : "none";
};

const checkTracker = async () => {
  try {
    const response = await fetch(HEALTH_URL, { method: "GET" });
    if (response.ok) {
      setStatus("online", "Tracker online");
      return;
    }
  } catch (error) {
    // ignore
  }
  setStatus("offline", "Tracker offline");
};

checkTracker();

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
