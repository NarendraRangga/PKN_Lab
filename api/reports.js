const { google } = require("googleapis");
const { Resend } = require("resend");
const crypto = require("crypto");

const HEADERS = [
  "Id",
  "Tanggal",
  "Nama",
  "Laboratorium",
  "JenisAduan",
  "Uraian",
  "FotoUrl",
  "CreatedAt",
  "UpdatedAt",
];

const COLUMN_INDEX = {
  id: 0,
  tanggal: 1,
  nama: 2,
  laboratorium: 3,
  jenisAduan: 4,
  uraian: 5,
  fotoUrl: 6,
  createdAt: 7,
  updatedAt: 8,
};

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

function getConfig() {
  const clientEmail = getRequiredEnv("GOOGLE_SHEETS_CLIENT_EMAIL");
  const privateKey = getRequiredEnv("GOOGLE_SHEETS_PRIVATE_KEY").replace(
    /\\n/g,
    "\n"
  );
  const spreadsheetId = getRequiredEnv("GOOGLE_SHEETS_SPREADSHEET_ID");
  const sheetName = getRequiredEnv("GOOGLE_SHEETS_SHEET_NAME");
  const resendApiKey = getRequiredEnv("RESEND_API_KEY");
  const emailFrom = getRequiredEnv("REPORT_NOTIFICATION_EMAIL_FROM");
  const emailTo = getRequiredEnv("REPORT_NOTIFICATION_EMAIL_TO")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (emailTo.length === 0) {
    throw new Error("REPORT_NOTIFICATION_EMAIL_TO must contain at least 1 email.");
  }

  return {
    clientEmail,
    privateKey,
    spreadsheetId,
    sheetName,
    resendApiKey,
    emailFrom,
    emailTo,
  };
}

function getSheetsClient(config) {
  const auth = new google.auth.JWT(
    config.clientEmail,
    undefined,
    config.privateKey,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
  return google.sheets({ version: "v4", auth });
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

async function ensureHeaderRow(sheets, spreadsheetId, sheetName) {
  const headerRange = `${sheetName}!A1:I1`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: headerRange,
  });
  const rows = response.data.values || [];
  if (rows.length === 0 || rows[0].length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: headerRange,
      valueInputOption: "RAW",
      requestBody: {
        values: [HEADERS],
      },
    });
    return;
  }

  const existingHeader = rows[0];
  const headerMatches = HEADERS.every(
    (header, index) => existingHeader[index] === header
  );
  if (!headerMatches) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: headerRange,
      valueInputOption: "RAW",
      requestBody: {
        values: [HEADERS],
      },
    });
  }
}

async function getSheetRows(sheets, spreadsheetId, sheetName) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:I`,
  });
  return response.data.values || [];
}

function mapRowToReport(row) {
  return {
    id: row[COLUMN_INDEX.id] || "",
    tanggal: row[COLUMN_INDEX.tanggal] || "",
    nama: row[COLUMN_INDEX.nama] || "",
    laboratorium: row[COLUMN_INDEX.laboratorium] || "",
    jenisAduan: row[COLUMN_INDEX.jenisAduan] || "",
    uraian: row[COLUMN_INDEX.uraian] || "",
    fotoUrl: row[COLUMN_INDEX.fotoUrl] || "",
    createdAt: row[COLUMN_INDEX.createdAt] || "",
    updatedAt: row[COLUMN_INDEX.updatedAt] || "",
  };
}

async function findSheetId(sheets, spreadsheetId, sheetName) {
  const response = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = response.data.sheets.find(
    (item) => item.properties.title === sheetName
  );
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found in spreadsheet.`);
  }
  return sheet.properties.sheetId;
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

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    const config = getConfig();
    const sheets = getSheetsClient(config);
    await ensureHeaderRow(sheets, config.spreadsheetId, config.sheetName);

    if (req.method === "GET") {
      const rows = await getSheetRows(
        sheets,
        config.spreadsheetId,
        config.sheetName
      );
      const reports = rows.slice(1).map(mapRowToReport);
      res.status(200).json({ status: "success", data: reports });
      return;
    }

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
      const report = {
        id: crypto.randomUUID(),
        tanggal,
        nama,
        laboratorium,
        jenisAduan,
        uraian,
        fotoUrl: "",
        createdAt: now,
        updatedAt: now,
      };

      await sheets.spreadsheets.values.append({
        spreadsheetId: config.spreadsheetId,
        range: `${config.sheetName}!A1`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [
            [
              report.id,
              report.tanggal,
              report.nama,
              report.laboratorium,
              report.jenisAduan,
              report.uraian,
              report.fotoUrl,
              report.createdAt,
              report.updatedAt,
            ],
          ],
        },
      });

      await sendNotificationEmail(config, report);

      res.status(201).json({ status: "success", data: report });
      return;
    }

    if (req.method === "PUT") {
      const body = parseBody(req);
      const id = String(body.id || "").trim();
      if (!id) {
        res.status(400).json({ status: "error", message: "ID wajib diisi." });
        return;
      }

      const rows = await getSheetRows(
        sheets,
        config.spreadsheetId,
        config.sheetName
      );
      const rowIndex = rows.findIndex(
        (row, index) => index > 0 && row[COLUMN_INDEX.id] === id
      );
      if (rowIndex === -1) {
        res.status(404).json({ status: "error", message: "Data tidak ditemukan." });
        return;
      }

      const existingRow = rows[rowIndex] || [];
      const updatedRow = HEADERS.map(
        (_, index) => existingRow[index] || ""
      );

      if (body.tanggal !== undefined) {
        updatedRow[COLUMN_INDEX.tanggal] = String(body.tanggal || "").trim();
      }
      if (body.nama !== undefined) {
        updatedRow[COLUMN_INDEX.nama] = String(body.nama || "").trim();
      }
      if (body.laboratorium !== undefined) {
        updatedRow[COLUMN_INDEX.laboratorium] = String(body.laboratorium || "").trim();
      }
      if (body.jenisAduan !== undefined) {
        updatedRow[COLUMN_INDEX.jenisAduan] = String(body.jenisAduan || "").trim();
      }
      if (body.uraian !== undefined) {
        updatedRow[COLUMN_INDEX.uraian] = String(body.uraian || "").trim();
      }

      updatedRow[COLUMN_INDEX.updatedAt] = new Date().toISOString();

      const rowNumber = rowIndex + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.spreadsheetId,
        range: `${config.sheetName}!A${rowNumber}:I${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [updatedRow],
        },
      });

      res.status(200).json({ status: "success" });
      return;
    }

    if (req.method === "DELETE") {
      const body = parseBody(req);
      const id = String(body.id || req.query.id || "").trim();
      if (!id) {
        res.status(400).json({ status: "error", message: "ID wajib diisi." });
        return;
      }

      const rows = await getSheetRows(
        sheets,
        config.spreadsheetId,
        config.sheetName
      );
      const rowIndex = rows.findIndex(
        (row, index) => index > 0 && row[COLUMN_INDEX.id] === id
      );
      if (rowIndex === -1) {
        res.status(404).json({ status: "error", message: "Data tidak ditemukan." });
        return;
      }

      const sheetId = await findSheetId(
        sheets,
        config.spreadsheetId,
        config.sheetName
      );
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: config.spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: "ROWS",
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1,
                },
              },
            },
          ],
        },
      });

      res.status(200).json({ status: "success" });
      return;
    }

    res.status(405).json({ status: "error", message: "Method not allowed." });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Terjadi kesalahan server.",
    });
  }
};
