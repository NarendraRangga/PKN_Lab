const { Resend } = require("resend");

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value.trim();
}

function getConfig() {
  const sheetyApiUrl = getRequiredEnv("SHEETY_API_URL");
  const sheetyBearerToken = (process.env["SHEETY_BEARER_TOKEN"] || "").trim();
  const resendApiKey = getRequiredEnv("RESEND_API_KEY");
  const emailFrom = getRequiredEnv("REPORT_NOTIFICATION_EMAIL_FROM");
  const emailTo = getRequiredEnv("REPORT_NOTIFICATION_EMAIL_TO")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (emailTo.length === 0) {
    throw new Error("REPORT_NOTIFICATION_EMAIL_TO must contain at least 1 email.");
  }

  // Extract sheet name (root property) from Sheety URL (last segment)
  const urlParts = sheetyApiUrl.replace(/\/$/, "").split("/");
  const sheetName = urlParts[urlParts.length - 1];

  return {
    sheetyApiUrl,
    sheetyBearerToken,
    resendApiKey,
    emailFrom,
    emailTo,
    sheetName
  };
}

function getSheetyHeaders(config) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (config.sheetyBearerToken) {
    headers["Authorization"] = `Bearer ${config.sheetyBearerToken}`;
  }
  return headers;
}

function parseBody(req) {
  if (!req.body) {
    return {};
  }
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      throw new Error("Invalid JSON body.");
    }
  }
  return req.body;
}

async function sendNotificationEmail(config, report) {
  const resend = new Resend(config.resendApiKey);
  const subject = "Aduan Baru Masuk";
  const text = [
    "Ada aduan baru yang masuk:",
    `Nama: ${report.nama}`,
    `Laboratorium: ${report.laboratorium}`,
    `Tanggal: ${report.tanggal}`,
    `Jenis Aduan: ${report.jenisAduan}`,
    `Uraian: ${report.uraian}`,
  ].join("\n");

  await resend.emails.send({
    from: config.emailFrom,
    to: config.emailTo,
    subject,
    text,
  });
}

function getSheetyRootKey(sheetName) {
  // Sheety requires the root JSON property to be the singular name of the endpoint
  let singularName = sheetName;
  if (singularName.endsWith('s')) {
     singularName = singularName.slice(0, -1);
  }
  return singularName;
}

module.exports = async (req, res) => {
  // CORS Headers for preflight
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    const config = getConfig();

    // =====================================
    // GET (Read Reports)
    // =====================================
    if (req.method === "GET") {
      const response = await fetch(config.sheetyApiUrl, {
        headers: getSheetyHeaders(config),
      });
      if (!response.ok) throw new Error("Failed to fetch from Sheety.");
      
      const data = await response.json();
      const reports = data[config.sheetName] || Object.values(data)[0] || [];
      
      res.status(200).json({ status: "success", data: reports });
      return;
    }

    // =====================================
    // POST (Create Report)
    // =====================================
    if (req.method === "POST") {
      const body = parseBody(req);
      const nama = String(body.nama || "").trim();
      const laboratorium = String(body.laboratorium || "").trim();
      const tanggal = String(body.tanggal || "").trim();
      const jenisAduan = String(body.jenisAduan || "").trim();
      const uraian = String(body.uraian || "").trim();

      if (!nama || !laboratorium || !tanggal || !jenisAduan || !uraian) {
        res.status(400).json({
          status: "error",
          message: "Nama, laboratorium, tanggal, jenis aduan, dan uraian wajib diisi.",
        });
        return;
      }

      const now = new Date().toISOString();
      const reportData = {
        tanggal,
        nama,
        laboratorium,
        jenisAduan,
        uraian,
        fotoUrl: "",
        createdAt: now,
        updatedAt: now,
      };

      const sheetyPayload = {};
      sheetyPayload[getSheetyRootKey(config.sheetName)] = reportData;

      const response = await fetch(config.sheetyApiUrl, {
        method: "POST",
        headers: getSheetyHeaders(config),
        body: JSON.stringify(sheetyPayload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to save to Sheety: ${errText}`);
      }
      
      const responseData = await response.json();
      const savedReport = responseData[getSheetyRootKey(config.sheetName)] || Object.values(responseData)[0] || reportData;

      // Send email notification after successful save
      await sendNotificationEmail(config, savedReport);

      res.status(201).json({ status: "success", data: savedReport });
      return;
    }

    // =====================================
    // PUT (Update Report)
    // =====================================
    if (req.method === "PUT") {
      const body = parseBody(req);
      const id = body.id;
      
      if (!id) {
        res.status(400).json({ status: "error", message: "ID wajib diisi." });
        return;
      }

      const updateData = {};
      if (body.tanggal !== undefined) updateData.tanggal = String(body.tanggal || "").trim();
      if (body.nama !== undefined) updateData.nama = String(body.nama || "").trim();
      if (body.laboratorium !== undefined) updateData.laboratorium = String(body.laboratorium || "").trim();
      if (body.jenisAduan !== undefined) updateData.jenisAduan = String(body.jenisAduan || "").trim();
      if (body.uraian !== undefined) updateData.uraian = String(body.uraian || "").trim();
      
      updateData.updatedAt = new Date().toISOString();

      const sheetyPayload = {};
      sheetyPayload[getSheetyRootKey(config.sheetName)] = updateData;

      const response = await fetch(`${config.sheetyApiUrl}/${id}`, {
        method: "PUT",
        headers: getSheetyHeaders(config),
        body: JSON.stringify(sheetyPayload),
      });

      if (!response.ok) throw new Error("Failed to update in Sheety.");

      res.status(200).json({ status: "success" });
      return;
    }

    // =====================================
    // DELETE (Remove Report)
    // =====================================
    if (req.method === "DELETE") {
      const body = parseBody(req);
      const id = body.id || req.query.id;
      
      if (!id) {
        res.status(400).json({ status: "error", message: "ID wajib diisi." });
        return;
      }

      const response = await fetch(`${config.sheetyApiUrl}/${id}`, {
        method: "DELETE",
        headers: getSheetyHeaders(config),
      });

      if (!response.ok) throw new Error("Failed to delete in Sheety.");

      res.status(200).json({ status: "success" });
      return;
    }

    res.status(405).json({ status: "error", message: "Method not allowed." });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Terjadi kesalahan server.",
    });
  }
};
