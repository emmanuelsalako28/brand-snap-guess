export interface SheetQuestion {
  id: number;
  image: string;
  correctAnswer: string;
  acceptableAnswers: string[];
  date: string;
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

    // Get today's date in M/D/YYYY format (e.g., 1/29/2026)
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const today = `${month}/${day}/${year}`;

    // Normalize a date string for comparison
    const normalizeDate = (d: string) => d.trim().replace(/\//g, '-').replace(/\s+/g, '');
    const normalizedToday = normalizeDate(today);

    console.log("DEBUG: Target Date (Normalized):", `[${normalizedToday}]`);
    console.log("DEBUG: Total data rows fetched:", dataRows.length);

    const questions: SheetQuestion[] = dataRows
      .map((row, index) => {
        const q = {
          id: index + 1,
          image: row[0]?.trim() || "",           // Column A: Image URL
          correctAnswer: row[1]?.trim() || "",   // Column B: Correct Answer
          acceptableAnswers: row[2]              // Column C: Acceptable Answers
            ? row[2].split(",").map(a => a.trim().toLowerCase())
            : [row[1]?.trim().toLowerCase() || ""],
          date: row[3]?.trim() || ""             // Column D: Date
        };
        return q;
      })
      .filter(q => {
        const normalizedCardDate = normalizeDate(q.date);
        const isMatch = normalizedCardDate === normalizedToday;

        if (q.image || q.date) {
          console.log(`DEBUG: Row ${q.id} - Date in Sheet: [${q.date}] -> Normalized: [${normalizedCardDate}] vs Target: [${normalizedToday}] | Match: ${isMatch}`);
        }

        return isMatch && q.image && q.correctAnswer;
      });

    console.log("DEBUG: Filtered questions count:", questions.length);
    return questions;
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
