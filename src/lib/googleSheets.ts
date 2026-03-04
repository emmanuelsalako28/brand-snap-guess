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
    // Fetch as CSV (works for public sheets) with cache-buster
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&t=${Date.now()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch sheet data");
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    // Skip header row (first row)
    const dataRows = rows.slice(1);

    const now = new Date();
    const tDay = now.getDate();
    const tMonth = now.getMonth() + 1;
    const tYear = now.getFullYear();

    // Flexible date matcher for "today"
    const isToday = (dateStr: string) => {
      if (!dateStr) return false;
      // Split by common separators: / - .
      const parts = dateStr.trim().replace(/\s+/g, '').split(/[-/.]/);
      if (parts.length !== 3) return false;

      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parseInt(parts[2], 10);
      const y = p2 < 100 ? 2000 + p2 : p2;

      if (y !== tYear) return false;

      // Check if p0/p1 matches either Month/Day or Day/Month
      const matchDMY = (p0 === tDay && p1 === tMonth);
      const matchMDY = (p0 === tMonth && p1 === tDay);

      return matchDMY || matchMDY;
    };

    console.log(`DEBUG: Today is ${tYear}-${tMonth}-${tDay}`);

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

    // Filter for today's questions using robust matcher
    const todayQuestions = allQuestions.filter(q => isToday(q.date));

    console.log(`DEBUG: Total valid rows: ${allQuestions.length}`);
    console.log(`DEBUG: Today's matches: ${todayQuestions.length}`);

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
