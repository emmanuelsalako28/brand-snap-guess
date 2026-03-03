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

    // Normalize a date string for comparison: handle M/D/YYYY and padding
    const normalizeDate = (d: string) => {
      if (!d) return "";
      // Remove all whitespace and split by common separators
      const parts = d.trim().replace(/\s+/g, '').split(/[-/]/);
      if (parts.length !== 3) return d.trim();

      // Ensure M/D/YYYY format with no leading zeros
      const m = parseInt(parts[0], 10);
      const d_part = parseInt(parts[1], 10);
      const y = parts[2];
      return `${m}/${d_part}/${y}`;
    };

    const now = new Date();
    const today = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
    const normalizedToday = normalizeDate(today);

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
    const todayQuestions = allQuestions.filter(q => normalizeDate(q.date) === normalizedToday);

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
