// ============================================================
//  CampoutPermissionForm.jsx
//  Troop 1910 — Monthly Campout Permission Form
//
//  MONTHLY CONFIG — update the two constants below each month,
//  commit to GitHub, and redeploy.
// ============================================================

// ── Monthly config ───────────────────────────────────────────
const WORKER_URL =
  "https://campout-perms.pages.dev/";
const authenticatedUser = "larry.wiggins.bsa@gmail.com"

// Paste your Cloudflare Worker URL above ↑ (printed after: npx wrangler deploy)

const CAMPOUT_META = {
  title:    "April 2026 Campout",
  theme:    "Pioneering & NT Practice",
  location: "Worth Ranch — Old Man Gillespie\n1518 Worth Ranch Rd, Palo Pinto, TX 76484",
  dates:    "April 10–12, 2026",
  depart:   "Hallelujah Center · Friday April 10, 2026 · 5:45 PM",
  returnEst:"Sunday April 12, 2026 · Est. 2:00 PM at Hallelujah Center",
  formDue:  "Monday, April 6, 2026",
  foodCost: "$15 Scout Cash · $25 Adult Cash (due Monday before campout to patrol's grub master)",
};
// ── End monthly config ───────────────────────────────────────

import { useState } from "react";

const FIELD = ({ label, required, hint, children }) => (
  <div style={{ marginBottom: "1.4rem" }}>
    <label style={{
      display: "block", fontFamily: "'Oswald', sans-serif",
      fontSize: "0.72rem", letterSpacing: "0.12em",
      textTransform: "uppercase", color: "#8fa8c0",
      marginBottom: "0.35rem"
    }}>
      {label}{required && <span style={{ color: "#e8523a", marginLeft: 3 }}>*</span>}
    </label>
    {hint && <p style={{ margin: "0 0 0.4rem", fontSize: "0.78rem", color: "#6a869e" }}>{hint}</p>}
    {children}
  </div>
);

const INPUT = (props) => (
  <input
    {...props}
    style={{
      width: "100%", boxSizing: "border-box",
      background: "#0d2035", border: "1px solid #1e3f5c",
      borderRadius: 6, color: "#e0ecf8", padding: "0.6rem 0.8rem",
      fontSize: "0.92rem", fontFamily: "'Source Sans 3', sans-serif",
      outline: "none", transition: "border-color 0.2s",
      ...(props.style || {})
    }}
    onFocus={e => e.target.style.borderColor = "#4a9eda"}
    onBlur={e  => e.target.style.borderColor = "#1e3f5c"}
  />
);

const SELECT = ({ children, ...props }) => (
  <select
    {...props}
    style={{
      width: "100%", boxSizing: "border-box",
      background: "#0d2035", border: "1px solid #1e3f5c",
      borderRadius: 6, color: "#e0ecf8", padding: "0.6rem 0.8rem",
      fontSize: "0.92rem", fontFamily: "'Source Sans 3', sans-serif",
      outline: "none", appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%234a9eda' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat", backgroundPosition: "right 0.8rem center",
    }}
    onFocus={e => e.target.style.borderColor = "#4a9eda"}
    onBlur={e  => e.target.style.borderColor = "#1e3f5c"}
  >
    {children}
  </select>
);

const DIVIDER = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", margin: "2rem 0 1.4rem" }}>
    <div style={{ flex: 1, height: 1, background: "#1e3f5c" }} />
    <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: "0.7rem", letterSpacing: "0.15em", color: "#4a9eda", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: "#1e3f5c" }} />
  </div>
);

const META_ROW = ({ label, value }) => (
  <div style={{ display: "flex", gap: "0.75rem", padding: "0.55rem 0", borderBottom: "1px solid #1a3450" }}>
    <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#4a9eda", minWidth: 110, paddingTop: 2 }}>{label}</span>
    <span style={{ fontSize: "0.88rem", color: "#c8dff0", whiteSpace: "pre-line", lineHeight: 1.5 }}>{value}</span>
  </div>
);

export default function CampoutPermissionForm() {
  // Simulated authenticated user — replace with your auth system's value
  const authenticatedUser = "parent@example.com";

  const [form, setForm] = useState({
    scoutName: "",
    permissionGranted: false,
    parentSignatureName: "",
    parentPrintedName: "",
    departingFriday: "Yes",
    fridayOther: "",
    returningsSunday: "Yes",
    sundayOther: "",
    adultNames: "",
    adultRole: "Neither",
    scoutsFriday: "",
    scoutsSunday: "",
    emergencyPhone: "",
    yptDate: "",
    trailerType: "None",
    vehicleInfo: "",
    hasInsurance: "Yes",
  });

  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const set = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async () => {
    if (!form.scoutName.trim())         { alert("Scout name is required."); return; }
    if (!form.permissionGranted)        { alert("Permission must be granted to submit."); return; }
    if (!form.parentSignatureName.trim()){ alert("Parent signature name is required."); return; }
    if (!form.parentPrintedName.trim()) { alert("Parent printed name is required."); return; }

    setStatus("submitting");
    try {
      const payload = { ...form, authenticatedUser };
      const resp = await fetch(WORKER_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const json = await resp.json();
      if (json.status === "ok") {
        setStatus("success");
      } else {
        throw new Error(json.message || "Unknown error");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  // ── Shared input style shortcuts ─────────────────────────
  const twoCol = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" };

  if (status === "success") return (
    <div style={{ minHeight: "100vh", background: "#071520", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Source+Sans+3:wght@300;400;600&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🏕️</div>
        <h2 style={{ fontFamily: "'Oswald', sans-serif", color: "#4a9eda", fontSize: "1.8rem", margin: "0 0 0.5rem" }}>Form Submitted!</h2>
        <p style={{ color: "#8fa8c0", fontFamily: "'Source Sans 3', sans-serif", lineHeight: 1.7 }}>
          Permission form for <strong style={{ color: "#e0ecf8" }}>{form.scoutName}</strong> has been recorded for the <strong style={{ color: "#e0ecf8" }}>{CAMPOUT_META.title}</strong> campout.
        </p>
        <p style={{ color: "#5a7a94", fontSize: "0.82rem", fontFamily: "'Source Sans 3', sans-serif" }}>Submitted as: {authenticatedUser}</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#071520", color: "#e0ecf8" }}>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Source+Sans+3:wght@300;400;600&display=swap" rel="stylesheet" />

      {/* Header band */}
      <div style={{ background: "linear-gradient(135deg, #0b2a42 0%, #0d3558 60%, #0e3d68 100%)", borderBottom: "3px solid #1e6ba8", padding: "2rem 2rem 1.6rem" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div style={{ fontSize: "2.4rem", lineHeight: 1 }}>⚜️</div>
            <div>
              <p style={{ margin: 0, fontFamily: "'Oswald', sans-serif", fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#4a9eda" }}>BSA Troop 1910</p>
              <h1 style={{ margin: "0.1rem 0 0.2rem", fontFamily: "'Oswald', sans-serif", fontSize: "clamp(1.4rem, 4vw, 2rem)", fontWeight: 700, color: "#ffffff", letterSpacing: "0.02em" }}>
                {CAMPOUT_META.title} — Permission Form
              </h1>
              <p style={{ margin: 0, fontFamily: "'Source Sans 3', sans-serif", fontSize: "0.85rem", color: "#8fa8c0" }}>
                {CAMPOUT_META.theme}
              </p>
            </div>
          </div>
          <p style={{ margin: "0.8rem 0 0", fontFamily: "'Source Sans 3', sans-serif", fontSize: "0.8rem", color: "#5a7a94" }}>
            Signed in as: <span style={{ color: "#4a9eda" }}>{authenticatedUser}</span>
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        {/* Campout details card */}
        <div style={{ background: "#0a1e30", border: "1px solid #1a3450", borderRadius: 10, padding: "1.2rem 1.4rem", marginBottom: "2.5rem" }}>
          <p style={{ margin: "0 0 0.8rem", fontFamily: "'Oswald', sans-serif", fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#4a9eda" }}>Campout Details</p>
          <META_ROW label="Location"  value={CAMPOUT_META.location} />
          <META_ROW label="Dates"     value={CAMPOUT_META.dates} />
          <META_ROW label="Depart"    value={CAMPOUT_META.depart} />
          <META_ROW label="Return"    value={CAMPOUT_META.returnEst + "\n\nScouts are expected to stay and unload trailers until dismissed by the SPL."} />
          <META_ROW label="Due Date"  value={CAMPOUT_META.formDue + "\n\nTurn in at meetings or to adam.a.caputo@gmail.com"} />
          <META_ROW label="Food"      value={CAMPOUT_META.foodCost} />
        </div>

        {/* ── Section 1: Scout ── */}
        <DIVIDER label="Scout Information" />

        <FIELD label="Scout Full Name" required>
          <INPUT
            type="text" placeholder="First Last"
            value={form.scoutName} onChange={set("scoutName")}
          />
        </FIELD>

        {/* ── Section 2: Permission ── */}
        <DIVIDER label="Parental Permission" />

        <div style={{ background: "#0a1e30", border: "1px solid #1a3450", borderRadius: 8, padding: "1rem 1.2rem", marginBottom: "1.4rem", fontSize: "0.88rem", color: "#8fa8c0", lineHeight: 1.7, fontFamily: "'Source Sans 3', sans-serif" }}>
          I give permission for my Scout to attend the above campout. I also give permission for the Scoutmaster/Asst Scoutmasters to approve emergency care for my Scout if needed. I will inform the Scoutmaster in charge or medical coordinator of all medical concerns per the Troop Policy.
        </div>

        <FIELD label="I grant permission" required>
          <label style={{ display: "flex", alignItems: "center", gap: "0.7rem", cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", fontSize: "0.92rem", color: form.permissionGranted ? "#4adc8a" : "#8fa8c0" }}>
            <input
              type="checkbox" checked={form.permissionGranted} onChange={set("permissionGranted")}
              style={{ width: 18, height: 18, accentColor: "#4a9eda", cursor: "pointer" }}
            />
            Yes, I grant permission for my Scout to attend this campout
          </label>
        </FIELD>

        <div style={twoCol}>
          <FIELD label="Parent Signature Name" required>
            <INPUT type="text" placeholder="Type full name as signature" value={form.parentSignatureName} onChange={set("parentSignatureName")} />
          </FIELD>
          <FIELD label="Parent Printed Name" required>
            <INPUT type="text" placeholder="Print full name" value={form.parentPrintedName} onChange={set("parentPrintedName")} />
          </FIELD>
        </div>

        {/* ── Section 3: Departure / Return ── */}
        <DIVIDER label="Departure & Return" />

        <div style={twoCol}>
          <FIELD label="Departing with Troop — Friday?" required>
            <Select value={form.departingFriday} onChange={set("departingFriday")}>
              <option>Yes</option>
              <option>No</option>
            </Select>
          </FIELD>
          <FIELD label="Friday — other details" hint="If not standard, explain">
            <INPUT type="text" placeholder="e.g. arriving directly at camp" value={form.fridayOther} onChange={set("fridayOther")} />
          </FIELD>
        </div>

        <div style={twoCol}>
          <FIELD label="Returning with Troop — Sunday?" required>
            <Select value={form.returningsSunday} onChange={set("returningsSunday")}>
              <option>Yes</option>
              <option>No</option>
            </Select>
          </FIELD>
          <FIELD label="Sunday — other details" hint="If not standard, explain">
            <INPUT type="text" placeholder="e.g. leaving early at noon" value={form.sundayOther} onChange={set("sundayOther")} />
          </FIELD>
        </div>

        {/* ── Section 4: Adult Info ── */}
        <DIVIDER label="Adult Information" />

        <FIELD label="Name of Adult(s) driving and/or camping">
          <INPUT type="text" placeholder="Full name(s)" value={form.adultNames} onChange={set("adultNames")} />
        </FIELD>

        <FIELD label="Adult role">
          <Select value={form.adultRole} onChange={set("adultRole")}>
            <option>Driving &amp; Camping</option>
            <option>Driving Only</option>
            <option>Neither</option>
          </Select>
        </FIELD>

        <div style={twoCol}>
          <FIELD label="Scouts you can drive — Friday" hint="Including your Scout">
            <INPUT type="number" min="0" max="10" placeholder="0" value={form.scoutsFriday} onChange={set("scoutsFriday")} />
          </FIELD>
          <FIELD label="Scouts you can drive — Sunday" hint="Including your Scout">
            <INPUT type="number" min="0" max="10" placeholder="0" value={form.scoutsSunday} onChange={set("scoutsSunday")} />
          </FIELD>
        </div>

        <div style={twoCol}>
          <FIELD label="Adult cell / Emergency phone">
            <INPUT type="tel" placeholder="(555) 000-0000" value={form.emergencyPhone} onChange={set("emergencyPhone")} />
          </FIELD>
          <FIELD label="Youth Protection Training (YPT) date">
            <INPUT type="date" value={form.yptDate} onChange={set("yptDate")} />
          </FIELD>
        </div>

        {/* ── Section 5: Vehicle ── */}
        <DIVIDER label="Vehicle Information" />

        <div style={twoCol}>
          <FIELD label="Can pull a trailer?">
            <Select value={form.trailerType} onChange={set("trailerType")}>
              <option>None</option>
              <option>Troop Trailer</option>
              <option>Flatbed Trailer</option>
            </Select>
          </FIELD>
          <FIELD label="Vehicle Make / Model / Year">
            <INPUT type="text" placeholder="e.g. 2019 Ford F-150" value={form.vehicleInfo} onChange={set("vehicleInfo")} />
          </FIELD>
        </div>

        <FIELD label="Minimum TX liability insurance?" hint="Per Texas State Law">
          <Select value={form.hasInsurance} onChange={set("hasInsurance")}>
            <option>Yes</option>
            <option>No</option>
          </Select>
        </FIELD>

        {/* ── Submit ── */}
        <div style={{ marginTop: "2.5rem" }}>
          {status === "error" && (
            <div style={{ background: "#2a0e0a", border: "1px solid #8b2a1a", borderRadius: 8, padding: "0.8rem 1rem", marginBottom: "1rem", color: "#f08070", fontSize: "0.85rem", fontFamily: "'Source Sans 3', sans-serif" }}>
              ⚠️ Submission failed: {errorMsg}. Please try again or contact your Scoutmaster.
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={status === "submitting"}
            style={{
              width: "100%", padding: "1rem", borderRadius: 8, border: "none", cursor: status === "submitting" ? "not-allowed" : "pointer",
              background: status === "submitting" ? "#1a3a5c" : "linear-gradient(135deg, #1a6db5, #2387d4)",
              color: "#ffffff", fontFamily: "'Oswald', sans-serif", fontSize: "1rem", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
              transition: "all 0.2s", boxShadow: status === "submitting" ? "none" : "0 4px 20px rgba(42,135,212,0.3)",
            }}
          >
            {status === "submitting" ? "Submitting…" : "Submit Permission Form"}
          </button>
          <p style={{ textAlign: "center", marginTop: "0.75rem", fontSize: "0.78rem", color: "#3a5a74", fontFamily: "'Source Sans 3', sans-serif" }}>
            Submitted as <strong style={{ color: "#4a7a9e" }}>{authenticatedUser}</strong> · responses recorded to the <strong style={{ color: "#4a7a9e" }}>"{CAMPOUT_META.title}"</strong> spreadsheet tab
          </p>
        </div>

      </div>
    </div>
  );
}

// Inline Select to avoid naming collision with native select
function Select({ children, value, onChange }) {
  return (
    <SELECT value={value} onChange={onChange}>
      {children}
    </SELECT>
  );
}
