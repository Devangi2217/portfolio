const LOG_URL = "/logs";

const statusEl = document.querySelector("#status");
const tbody = document.querySelector("#log-body");
const limitSelect = document.querySelector("#limit");
const refreshBtn = document.querySelector("#refresh");

const formatLocation = (geo) => {
  if (!geo) return "Unknown";
  return [geo.city, geo.region, geo.country].filter(Boolean).join(", ");
};

const formatDevice = (entry) => {
  const parts = [entry.platform, entry.language].filter(Boolean);
  return `${entry.userAgent || "Unknown"}${parts.length ? ` (${parts.join(", ")})` : ""}`;
};

const renderRows = (entries) => {
  if (!entries.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="muted">No logs yet.</td></tr>';
    return;
  }
  tbody.innerHTML = entries
    .map((entry) => {
      const time = entry.time ? new Date(entry.time).toLocaleString() : "Unknown";
      const name = entry.name || "—";
      const location = formatLocation(entry.geo);
      const device = formatDevice(entry);
      const page = entry.page || "—";
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
  try {
    const response = await fetch(`${LOG_URL}?limit=${limit}`);
    const data = await response.json();
    if (!data.ok) {
      throw new Error("Bad response");
    }
    renderRows(data.entries);
    statusEl.textContent = `Showing ${data.entries.length} entries.`;
  } catch (error) {
    statusEl.textContent = "Failed to load logs. Make sure the tracker server is running.";
    renderRows([]);
  }
};

refreshBtn.addEventListener("click", loadLogs);
limitSelect.addEventListener("change", loadLogs);

loadLogs();
