const LOG_URL =
  "https://script.google.com/macros/s/AKfycbzi8SEecLP6C7C44JMjMlnAUavkaETJxr7g1xbE_uWidpUUOh3WObfBHtWLlUxp0euF/exec";

const statusEl = document.querySelector("#status");
const tbody = document.querySelector("#log-body");
const limitSelect = document.querySelector("#limit");
const refreshBtn = document.querySelector("#refresh");

const formatLocation = (geo) => {
  if (!geo) return "Unknown";
  return [geo.city, geo.region, geo.country].filter(Boolean).join(", ");
};

const detectDeviceType = (entry) => {
  const ua = (entry.userAgent || "").toLowerCase();
  const platform = (entry.platform || "").toLowerCase();

  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iOS";
  if (ua.includes("mac") || platform.includes("mac")) return "Mac";
  if (ua.includes("windows") || platform.includes("win")) return "Windows";
  if (ua.includes("linux") || platform.includes("linux")) return "Linux";
  if (ua.includes("mobile")) return "Mobile";
  return "Unknown";
};

const formatDevice = (entry) => {
  const deviceType = detectDeviceType(entry);
  const parts = [entry.platform, entry.language].filter(Boolean);
  return `${deviceType}${parts.length ? ` (${parts.join(", ")})` : ""}`;
};

const renderRows = (entries) => {
  if (!entries.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="muted">No logs yet.</td></tr>';
    return;
  }
  tbody.innerHTML = entries
    .map((entry) => {
      const parsed = entry.time ? new Date(entry.time) : null;
      const time =
        parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleString() : "-";
      const name = entry.name || "-";
      const location = formatLocation(entry.geo);
      const device = formatDevice(entry);
      const page = entry.page || "-";
      return `
        <tr>
          <td>${time}</td>
          <td>${name}</td>
          <td>${location}</td>
          <td>${device}</td>
          <td>${page}</td>
        </tr>
      `;
    })
    .join("");
};

const loadLogs = async () => {
  const limit = limitSelect.value;
  statusEl.textContent = "Loading...";
  const callbackName = `handleLogs_${Date.now()}`;
  const script = document.createElement("script");
  let timeoutId;

  const cleanup = () => {
    if (timeoutId) clearTimeout(timeoutId);
    delete window[callbackName];
    script.remove();
  };

  const fail = () => {
    statusEl.textContent =
      "Failed to load logs. Make sure the Apps Script is deployed.";
    renderRows([]);
  };

  window[callbackName] = (data) => {
    cleanup();
    if (!data || !data.ok) {
      fail();
      return;
    }
    renderRows(data.entries || []);
    statusEl.textContent = `Showing ${data.entries.length} entries.`;
  };

  script.onerror = () => {
    cleanup();
    fail();
  };

  timeoutId = setTimeout(() => {
    cleanup();
    fail();
  }, 8000);

  script.src = `${LOG_URL}?limit=${encodeURIComponent(limit)}&callback=${callbackName}`;
  document.body.appendChild(script);
};

refreshBtn.addEventListener("click", loadLogs);
limitSelect.addEventListener("change", loadLogs);

loadLogs();
