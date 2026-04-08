/**
 * Troop 1910 — Campout Permission Form Worker
 * Cloudflare Workers runtime
 *
 * Environment variables (set in Cloudflare dashboard or wrangler.toml secrets):
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL   — service account client_email
 *   GOOGLE_PRIVATE_KEY             — service account private_key (PEM, with \n as actual newlines)
 *   SPREADSHEET_ID                 — Google Sheet ID from the URL
 *   SHEET_TAB_NAME                 — e.g. "April 2026"  ← update this each month
 *   ALLOWED_ORIGIN                 — your frontend origin, e.g. https://troop1910.org
 */

// ─── Column headers ───────────────────────────────────────────────────────────
const HEADERS = [
  "Timestamp",
  "Submitted By (Auth User)",
  "Campout Month/Tab",
  "Scout Full Name",
  "Permission Granted",
  "Parent Signature Name",
  "Parent Printed Name",
  "Departing with Troop (Friday)",
  "Friday Other Details",
  "Returning with Troop (Sunday)",
  "Sunday Other Details",
  "Adult Driver/Camper Name(s)",
  "Adult Role",
  "Scouts Driver Can Transport (Friday)",
  "Scouts Driver Can Transport (Sunday)",
  "Adult Cell / Emergency Phone",
  "YPT Date",
  "Can Pull Trailer",
  "Vehicle Make/Model/Year",
  "Has Minimum TX Liability Insurance",
];

// ─── Main handler ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "*";

    // CORS preflight
    if (request.method === "OPTIONS") {
      return corsResponse(null, 204, allowedOrigin);
    }

    // Health check
    if (request.method === "GET") {
      return corsResponse(
        JSON.stringify({ status: "ok", tab: env.SHEET_TAB_NAME }),
        200,
        allowedOrigin
      );
    }

    if (request.method !== "POST") {
      return corsResponse(JSON.stringify({ error: "Method not allowed" }), 405, allowedOrigin);
    }

    try {
      const payload = await request.json();
      validatePayload(payload);

      const accessToken = await getAccessToken(env);
      const sheetsBase = `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}`;

      // Ensure the tab exists — create it if not
      await ensureSheet(sheetsBase, env.SHEET_TAB_NAME, accessToken);

      // Append the row
      const row = buildRow(payload, env.SHEET_TAB_NAME);
      await appendRow(sheetsBase, env.SHEET_TAB_NAME, row, accessToken);

      return corsResponse(
        JSON.stringify({ status: "ok", tab: env.SHEET_TAB_NAME }),
        200,
        allowedOrigin
      );
    } catch (err) {
      console.error(err);
      const status = err.status || 500;
      return corsResponse(
        JSON.stringify({ status: "error", message: err.message }),
        status,
        allowedOrigin
      );
    }
  },
};

// ─── Validation ───────────────────────────────────────────────────────────────
function validatePayload(p) {
  const required = ["scoutName", "permissionGranted", "parentSignatureName", "parentPrintedName"];
  for (const key of required) {
    if (!p[key] && p[key] !== false) {
      const e = new Error(`Missing required field: ${key}`);
      e.status = 400;
      throw e;
    }
  }
  if (!p.permissionGranted) {
    const e = new Error("Permission was not granted");
    e.status = 400;
    throw e;
  }
}

// ─── Row builder ──────────────────────────────────────────────────────────────
function buildRow(p, tabName) {
  return [
    new Date().toISOString(),
    p.authenticatedUser || "unknown",
    tabName,
    p.scoutName,
    p.permissionGranted ? "YES" : "NO",
    p.parentSignatureName,
    p.parentPrintedName,
    p.departingFriday     || "",
    p.fridayOther         || "",
    p.returningsSunday    || "",
    p.sundayOther         || "",
    p.adultNames          || "",
    p.adultRole           || "",
    p.scoutsFriday        || "",
    p.scoutsSunday        || "",
    p.emergencyPhone      || "",
    p.yptDate             || "",
    p.trailerType         || "",
    p.vehicleInfo         || "",
    p.hasInsurance        || "",
  ];
}

// ─── Google Sheets helpers ────────────────────────────────────────────────────

/**
 * Ensure the named sheet tab exists. If not, create it and write the header row.
 * Uses the batchUpdate endpoint to add the sheet, then values.append for the header.
 */
async function ensureSheet(base, tabName, token) {
  // Fetch spreadsheet metadata to check existing sheets
  const metaResp = await gFetch(`${base}?fields=sheets.properties.title`, token);
  const meta = await metaResp.json();

  const exists = (meta.sheets || []).some(
    (s) => s.properties.title === tabName
  );

  if (!exists) {
    // Add the sheet
    await gFetch(`${base}:batchUpdate`, token, {
      method: "POST",
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: tabName } } }],
      }),
    });

    // Write header row
    await gFetch(
      `${base}/values/${encodeURIComponent(tabName + "!A1")}:append?valueInputOption=USER_ENTERED`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ values: [HEADERS] }),
      }
    );

    // Bold + color the header row (columns A through T = 20 cols)
    await gFetch(`${base}:batchUpdate`, token, {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: await getSheetId(base, tabName, token),
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: HEADERS.length,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  backgroundColor: { red: 0.1, green: 0.23, blue: 0.36 },
                },
              },
              fields: "userEnteredFormat(textFormat,backgroundColor)",
            },
          },
          {
            updateSheetProperties: {
              properties: {
                sheetId: await getSheetId(base, tabName, token),
                gridProperties: { frozenRowCount: 1 },
              },
              fields: "gridProperties.frozenRowCount",
            },
          },
        ],
      }),
    });
  }
}

async function getSheetId(base, tabName, token) {
  const resp = await gFetch(`${base}?fields=sheets.properties`, token);
  const data = await resp.json();
  const sheet = data.sheets.find((s) => s.properties.title === tabName);
  return sheet ? sheet.properties.sheetId : 0;
}

async function appendRow(base, tabName, row, token) {
  const range = encodeURIComponent(`${tabName}!A1`);
  await gFetch(
    `${base}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ values: [row] }),
    }
  );
}

async function gFetch(url, token, options = {}) {
  const resp = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    const e = new Error(`Google Sheets API error ${resp.status}: ${text}`);
    e.status = resp.status;
    throw e;
  }
  return resp;
}

// ─── Google Service Account JWT → Access Token ────────────────────────────────
/**
 * Cloudflare Workers has the Web Crypto API available.
 * We sign a JWT with the service account's RSA private key (RS256)
 * and exchange it for a short-lived OAuth2 access token.
 */
async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body   = b64url(JSON.stringify(claim));
  const signingInput = `${header}.${body}`;

  const privateKey = await importPrivateKey(env.GOOGLE_PRIVATE_KEY);
  const signature  = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  const jwt = `${signingInput}.${arrayBufferToBase64url(signature)}`;

  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResp.ok) {
    const txt = await tokenResp.text();
    throw new Error(`Failed to get access token: ${txt}`);
  }

  const { access_token } = await tokenResp.json();
  return access_token;
}

async function importPrivateKey(pem) {
  // PEM stored in env var with literal \n — convert to real newlines
  const pemNormalized = pem.replace(/\\n/g, "\n");
  const pemBody = pemNormalized
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function b64url(str) {
  return arrayBufferToBase64url(new TextEncoder().encode(str));
}

function arrayBufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// ─── CORS helper ──────────────────────────────────────────────────────────────
function corsResponse(body, status, origin) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
