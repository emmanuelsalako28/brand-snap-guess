interface SheetQuestion {
  image: string;
  correctAnswer: string;
  acceptableAnswers: string[];
}

export async function fetchQuestionsFromSheet(): Promise<SheetQuestion[]> {
  const spreadsheetId = "1NsoiKuJgo1A9LtiDuMdC_YQot4KMxcWdyMoQNQBenv4";
  const gid = "964404709";
  
  try {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
    const response = await fetch(url);
    const text = await response.text();
    
    // Remove the JSON-P wrapper
    const jsonString = text.substring(47).slice(0, -2);
    const data = JSON.parse(jsonString);
    
    // Parse rows (skip header row)
    const rows = data.table.rows.slice(1);
    
    const questions: SheetQuestion[] = rows
      .filter((row: any) => row.c && row.c[0] && row.c[1]) // Ensure row has data
      .map((row: any) => {
        const imageUrl = row.c[0]?.v || "";
        const correctAnswer = row.c[1]?.v || "";
        const acceptableAnswersRaw = row.c[2]?.v || "";
        
        // Parse acceptable answers (comma-separated)
        const acceptableAnswers = acceptableAnswersRaw
          ? acceptableAnswersRaw.split(',').map((ans: string) => ans.trim().toLowerCase())
          : [correctAnswer.toLowerCase()];
        
        return {
          image: imageUrl,
          correctAnswer,
          acceptableAnswers
        };
      });
    
    return questions;
  } catch (error) {
    console.error("Error fetching questions from Google Sheet:", error);
    throw new Error("Failed to load questions. Please try again.");
  }
}
