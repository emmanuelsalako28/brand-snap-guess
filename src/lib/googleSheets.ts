export interface SheetQuestion {
  id: number;
  image: string;
  correctAnswer: string;
  acceptableAnswers: string[];
  date: string;
  questionText: string;
}

const SHEET_ID = "1eD8qXU3MOaNZoM9E6va4_1FHzzbREQ_cdErbSj34ZLY";

export async function fetchQuestionsFromSheet(): Promise<SheetQuestion[]> {
  try {
    // Fetch as CSV (works for public sheets)
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch sheet data");
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    // Skip header row (first row)
    const dataRows = rows.slice(1);

    // Normalize a date string for comparison to YYYY-MM-DD
    const normalizeDate = (d: string) => {
      if (!d) return "";
      // Remove all whitespace and split by common separators
      const parts = d.trim().replace(/\s+/g, '').split(/[-/]/);
      if (parts.length !== 3) return d.trim();

      let day, month, year;
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parts[2];

      // Heuristic to handle both DD/MM/YYYY and MM/DD/YYYY
      if (p0 > 12) {
        // Must be DD/MM/YYYY
        day = p0;
        month = p1;
      } else if (p1 > 12) {
        // Must be MM/DD/YYYY
        day = p1;
        month = p0;
      } else {
        // Ambiguous, assume DD/MM/YYYY based on user's current format
        day = p0;
        month = p1;
      }

      year = p2.length === 2 ? `20${p2}` : p2;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const now = new Date();
    const normalizedToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    console.log("DEBUG: Target Date (Normalized):", `[${normalizedToday}]`);

    const allQuestions: SheetQuestion[] = dataRows
      .map((row, index) => ({
        id: index + 1,
        image: row[0]?.trim() || "",           // Column A: Image URL
        correctAnswer: row[1]?.trim() || "",   // Column B: Correct Answer
        acceptableAnswers: row[2]              // Column C: Acceptable Answers
          ? row[2].split(",").map(a => a.trim().toLowerCase())
          : [row[1]?.trim().toLowerCase() || ""],
        date: row[3]?.trim() || "",             // Column D: Date
        questionText: row[4]?.trim() || "Which brand is this?" // Column E: Custom Question
      }))
      .filter(q => q.image && q.correctAnswer);

    // Filter for today's questions
    const todayQuestions = allQuestions.filter(q => {
      const qDate = normalizeDate(q.date);
      return qDate === normalizedToday;
    });

    console.log(`DEBUG: Total valid questions: ${allQuestions.length}`);
    console.log(`DEBUG: Today's questions: ${todayQuestions.length}`);

    // Return only today's questions
    return todayQuestions;
  } catch (error) {
    console.error("Error fetching questions from Google Sheet:", error);
    return [];
  }
}

function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
    } else if ((char === "\n" || (char === "\r" && nextChar === "\n")) && !insideQuotes) {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      if (char === "\r") i++;
    } else if (char === "\r" && !insideQuotes) {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}
