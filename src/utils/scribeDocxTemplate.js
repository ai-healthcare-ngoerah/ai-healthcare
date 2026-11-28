import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} from 'docx';

export const DOCX_FONT_FAMILY = 'Tinos';
const BLACK = '000000';

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_CELL_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
};
const THIN_BLACK_BORDER = { style: BorderStyle.SINGLE, size: 6, color: BLACK };
const THICK_BLACK_BORDER = { style: BorderStyle.SINGLE, size: 12, color: BLACK };
const GRID_CELL_BORDERS = {
  top: THIN_BLACK_BORDER,
  bottom: THIN_BLACK_BORDER,
  left: THIN_BLACK_BORDER,
  right: THIN_BLACK_BORDER,
};

const makeRun = (text, options = {}) =>
  new TextRun({
    text: String(text ?? ''),
    font: DOCX_FONT_FAMILY,
    color: BLACK,
    size: 21,
    ...options,
  });

const makeCell = (children, { widthPct, borders = NO_CELL_BORDERS, margins = { top: 60, bottom: 60, left: 80, right: 80 } } = {}) =>
  new TableCell({
    width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    borders,
    margins,
    children,
  });

const formatPrintTimestamp = (dateInput) => {
  const dt = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(dt.getTime())) return '-';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(dt.getDate())}-${pad(dt.getMonth() + 1)}-${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
};

const parseSoapSectionsFallback = (rawText) => {
  const text = String(rawText || '').trim();
  const sections = { subjective: '', objective: '', assessment: '', plan: '' };
  if (!text) return sections;

  const pattern = /(?:^|\n)\s*(?:(S)(?:ubjective|ubjektif)?|(O)(?:bjective|bjektif)?|(A)(?:ssessment|sesmen)?|(P)(?:lan|lanning|erencanaan|rencana)?)(?:\s*\([^)]*\))?\s*[:-]\s*/gi;
  const matches = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const letter = (match[1] || match[2] || match[3] || match[4] || '').toUpperCase();
    if (letter) {
      matches.push({ letter, end: match.index + match[0].length, index: match.index });
    }
  }

  if (matches.length === 0) {
    sections.subjective = text;
    return sections;
  }

  for (let i = 0; i < matches.length; i += 1) {
    const cur = matches[i];
    const next = matches[i + 1];
    const body = text.slice(cur.end, next ? next.index : text.length).trim();
    if (cur.letter === 'S' && !sections.subjective) sections.subjective = body;
    else if (cur.letter === 'O' && !sections.objective) sections.objective = body;
    else if (cur.letter === 'A' && !sections.assessment) sections.assessment = body;
    else if (cur.letter === 'P' && !sections.plan) sections.plan = body;
  }
  return sections;
};

const textToParagraphs = (text, size = 21) => {
  const lines = String(text || '').split('\n').map((l) => l.trimEnd()).filter(Boolean);
  if (lines.length === 0) {
    return [new Paragraph({ children: [makeRun('-', { size })], spacing: { after: 60 } })];
  }
  return lines.map(
    (line) =>
      new Paragraph({
        children: [makeRun(line, { size })],
        spacing: { after: 70 },
      })
  );
};

const createRuleParagraph = (spacingBefore = 120, spacingAfter = 140) =>
  new Paragraph({
    border: { bottom: THICK_BLACK_BORDER },
    spacing: { before: spacingBefore, after: spacingAfter },
    children: [],
  });

const buildSingleRecordBlocks = (record, { headingTitle = 'RINGKASAN CATATAN KONSULTASI MEDIS' } = {}) => {
  const {
    patientName = 'Pasien Umum',
    medicalRecordNo = '-',
    doctorName = 'dr. Umum',
    poliName = 'Poli Umum',
    createdAt = null,
    soap = null,
    soapNote = '',
    clinical = null,
  } = record || {};

  const parsedSoap = parseSoapSectionsFallback(soapNote);
  const sVal = soap?.subjective?.trim() || parsedSoap.subjective;
  const oVal = soap?.objective?.trim() || parsedSoap.objective;
  const aVal = soap?.assessment?.trim() || parsedSoap.assessment;
  const pVal = soap?.plan?.trim() || parsedSoap.plan;

  const icd10Text = clinical?.icd_10?.trim() || '-';
  const icd9Text = clinical?.icd_9?.trim() || '-';
  const controlStatus = clinical?.must_control
    ? `Wajib Kontrol${clinical?.control_date ? ` (${clinical.control_date})` : ''}`
    : 'Opsional';
  const examDateText = formatPrintTimestamp(createdAt);

  const blocks = [];

  // 1. Hospital/Clinic style top header (italic left + print timestamp right, all black)
  blocks.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_CELL_BORDERS,
      rows: [
        new TableRow({
          children: [
            makeCell(
              [
                new Paragraph({
                  children: [makeRun('USADA AI - Sistem Dokumentasi Klinis', { italics: true, bold: true, size: 19 })],
                  spacing: { after: 30 },
                }),
                new Paragraph({
                  children: [makeRun(`Unit Pelayanan: ${poliName}`, { italics: true, size: 18 })],
                  spacing: { after: 20 },
                }),
              ],
              { widthPct: 58, margins: { top: 0, bottom: 40, left: 0, right: 80 } }
            ),
            makeCell(
              [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [makeRun(`Tgl. cetak : ${formatPrintTimestamp()}`, { italics: true, size: 18 })],
                  spacing: { after: 20 },
                }),
              ],
              { widthPct: 42, margins: { top: 0, bottom: 40, left: 80, right: 0 } }
            ),
          ],
        }),
      ],
    })
  );

  // 2. Centered uppercase document title with full black horizontal line below
  blocks.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 120 },
      border: { bottom: THICK_BLACK_BORDER },
      children: [makeRun(headingTitle, { bold: true, size: 26 })],
    })
  );

  // 3. Borderless 2-column patient metadata grid matching PDF RM 1.01.266
  const metaRows = [
    ['Nama Pasien', patientName || 'Pasien Umum', 'Poliklinik', poliName || '-'],
    ['No. Rekam Medis', medicalRecordNo || '-', 'Dokter', doctorName || '-'],
    ['Tgl. Pemeriksaan', examDateText, 'Status Kontrol', controlStatus],
  ];

  blocks.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_CELL_BORDERS,
      rows: metaRows.map(
        ([lLabel, lVal, rLabel, rVal]) =>
          new TableRow({
            children: [
              makeCell([new Paragraph({ children: [makeRun(lLabel, { size: 20 })] })], {
                widthPct: 18,
                margins: { top: 35, bottom: 35, left: 0, right: 40 },
              }),
              makeCell([new Paragraph({ children: [makeRun(`: ${lVal}`, { size: 20 })] })], {
                widthPct: 34,
                margins: { top: 35, bottom: 35, left: 20, right: 80 },
              }),
              makeCell([new Paragraph({ children: [makeRun(rLabel, { size: 20 })] })], {
                widthPct: 16,
                margins: { top: 35, bottom: 35, left: 40, right: 40 },
              }),
              makeCell([new Paragraph({ children: [makeRun(`: ${rVal}`, { size: 20 })] })], {
                widthPct: 32,
                margins: { top: 35, bottom: 35, left: 20, right: 0 },
              }),
            ],
          })
      ),
    })
  );

  blocks.push(createRuleParagraph(100, 140));

  // 4. Two-column SOAP note block (label left, body right, all black)
  const soapRows = [
    ['Subjektif (Keluhan)', sVal],
    ['Objektif (Pemeriksaan)', oVal],
    ['Asesmen (Diagnosis)', aVal],
    ['Plan (Penatalaksanaan)', pVal],
  ];

  blocks.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_CELL_BORDERS,
      rows: soapRows.map(
        ([label, body]) =>
          new TableRow({
            children: [
              makeCell(
                [
                  new Paragraph({
                    children: [makeRun(label, { bold: true, size: 21 })],
                    spacing: { after: 60 },
                  }),
                ],
                { widthPct: 28, margins: { top: 60, bottom: 80, left: 0, right: 80 } }
              ),
              makeCell(
                [
                  new Paragraph({
                    children: [makeRun(':', { size: 21 })],
                    spacing: { after: 60 },
                  }),
                ],
                { widthPct: 3, margins: { top: 60, bottom: 80, left: 0, right: 40 } }
              ),
              makeCell(textToParagraphs(body, 21), {
                widthPct: 69,
                margins: { top: 60, bottom: 80, left: 20, right: 0 },
              }),
            ],
          })
      ),
    })
  );

  // 5. Bordered black tables for ICD-10 and ICD-9-CM matching PDF pages 14 & 16
  blocks.push(
    new Paragraph({
      spacing: { before: 180, after: 80 },
      children: [makeRun('Klasifikasi Kode Klinis', { bold: true, size: 22 })],
    })
  );

  blocks.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: GRID_CELL_BORDERS,
      rows: [
        new TableRow({
          children: [
            makeCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [makeRun('No.', { bold: true, size: 20 })] })], {
              widthPct: 8,
              borders: GRID_CELL_BORDERS,
            }),
            makeCell([new Paragraph({ children: [makeRun('Kategori', { bold: true, size: 20 })] })], {
              widthPct: 26,
              borders: GRID_CELL_BORDERS,
            }),
            makeCell([new Paragraph({ children: [makeRun('Kode & Deskripsi', { bold: true, size: 20 })] })], {
              widthPct: 66,
              borders: GRID_CELL_BORDERS,
            }),
          ],
        }),
        new TableRow({
          children: [
            makeCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [makeRun('1.', { size: 20 })] })], {
              widthPct: 8,
              borders: GRID_CELL_BORDERS,
            }),
            makeCell([new Paragraph({ children: [makeRun('Diagnosis Utama (ICD-10)', { size: 20 })] })], {
              widthPct: 26,
              borders: GRID_CELL_BORDERS,
            }),
            makeCell([new Paragraph({ children: [makeRun(icd10Text, { size: 20 })] })], {
              widthPct: 66,
              borders: GRID_CELL_BORDERS,
            }),
          ],
        }),
        new TableRow({
          children: [
            makeCell([new Paragraph({ alignment: AlignmentType.CENTER, children: [makeRun('2.', { size: 20 })] })], {
              widthPct: 8,
              borders: GRID_CELL_BORDERS,
            }),
            makeCell([new Paragraph({ children: [makeRun('Tindakan / Prosedur (ICD-9-CM)', { size: 20 })] })], {
              widthPct: 26,
              borders: GRID_CELL_BORDERS,
            }),
            makeCell([new Paragraph({ children: [makeRun(icd9Text, { size: 20 })] })], {
              widthPct: 66,
              borders: GRID_CELL_BORDERS,
            }),
          ],
        }),
      ],
    })
  );

  // 6. Right-aligned signature block and bottom rule footer (matching PDF pages 14-15)
  blocks.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_CELL_BORDERS,
      rows: [
        new TableRow({
          children: [
            makeCell([new Paragraph({ children: [] })], { widthPct: 58 }),
            makeCell(
              [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 260, after: 420 },
                  children: [makeRun('Dokter Pemeriksa,', { size: 20 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 60 },
                  children: [makeRun(`( ${doctorName || 'Dokter Penanggung Jawab'} )`, { bold: true, size: 20 })],
                }),
              ],
              { widthPct: 42 }
            ),
          ],
        }),
      ],
    })
  );

  blocks.push(
    new Paragraph({
      border: { top: THIN_BLACK_BORDER },
      spacing: { before: 160, after: 40 },
      children: [
        makeRun('Lembar 1: Untuk Rekam Medis   |   Dokumen Rekam Medis Elektronik', {
          italics: true,
          size: 17,
        }),
      ],
    })
  );

  return blocks;
};

const createStyledDocument = (children) =>
  new Document({
    styles: {
      default: {
        document: {
          run: {
            font: DOCX_FONT_FAMILY,
            color: BLACK,
            size: 21,
          },
        },
        heading1: {
          run: {
            font: DOCX_FONT_FAMILY,
            color: BLACK,
            bold: true,
            size: 26,
          },
        },
        heading2: {
          run: {
            font: DOCX_FONT_FAMILY,
            color: BLACK,
            bold: true,
            size: 22,
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            font: DOCX_FONT_FAMILY,
            color: BLACK,
            bold: true,
            size: 26,
          },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            font: DOCX_FONT_FAMILY,
            color: BLACK,
            bold: true,
            size: 22,
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 900,
              right: 950,
              bottom: 900,
              left: 950,
            },
          },
        },
        children,
      },
    ],
  });

export const buildSoapDocxBlob = async (record) => {
  const doc = createStyledDocument(buildSingleRecordBlocks(record));
  return Packer.toBlob(doc);
};

export const buildBatchSoapDocxBlob = async (records = []) => {
  const children = [];
  records.forEach((record, index) => {
    children.push(
      ...buildSingleRecordBlocks(record, {
        headingTitle: `RINGKASAN CATATAN KONSULTASI MEDIS (${index + 1}/${records.length})`,
      })
    );
    if (index < records.length - 1) {
      children.push(
        new Paragraph({
          pageBreakBefore: true,
          children: [],
        })
      );
    }
  });
  const doc = createStyledDocument(children);
  return Packer.toBlob(doc);
};
