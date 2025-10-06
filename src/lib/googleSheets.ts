interface SheetQuestion {
  image: string;
  correctAnswer: string;
  acceptableAnswers: string[];
}

export async function fetchQuestionsFromSheet(): Promise<SheetQuestion[]> {
  const spreadsheetId = "1NsoiKuJgo1A9LtiDuMdC_YQot4KMxcWdyMoQNQBenv4";
  const gid = "964404709";
  
  try {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    const response = await fetch(url);
    const text = await response.text();
    
    // Parse CSV
    const lines = text.trim().split('\n');
    
    // Skip header row and parse data rows
    const questions: SheetQuestion[] = lines
      .slice(1)
      .filter(line => line.trim())
      .map(line => {
        // Simple CSV parsing (handles quoted fields)
        const columns = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const cleanedColumns = columns.map(col => col.replace(/^"|"$/g, '').trim());
        
        const imageUrl = cleanedColumns[0] || "";
        const correctAnswer = cleanedColumns[1] || "";
        const acceptableAnswersRaw = cleanedColumns[2] || "";
        
        // Parse acceptable answers (comma-separated)
        const acceptableAnswers = acceptableAnswersRaw
          ? acceptableAnswersRaw.split(',').map((ans: string) => ans.trim().toLowerCase())
          : [correctAnswer.toLowerCase()];
        
        return {
          image: imageUrl,
          correctAnswer,
          acceptableAnswers
        };
      })
      .filter(q => q.image && q.correctAnswer);
    
    return questions;
  } catch (error) {
    console.error("Error fetching questions from Google Sheet:", error);
    throw new Error("Failed to load questions. Please try again.");
  }
}
