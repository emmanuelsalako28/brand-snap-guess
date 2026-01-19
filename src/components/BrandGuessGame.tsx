import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trophy, RotateCcw, Play, Send, Medal, Crown, Loader2 } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { fetchQuestionsFromSheet, SheetQuestion } from "@/lib/googleSheets";

interface Question {
  id: number;
  image: string;
  correctAnswer: string;
  acceptableAnswers: string[];
}

type GameState = "login" | "start" | "playing" | "finished";

interface User {
  name: string;
  email: string;
}

interface LeaderboardEntry {
  id: number;
  name: string;
  score: number;
  maxScore: number;
  date: string;
}

export const BrandGuessGame = () => {
  const [gameState, setGameState] = useState<GameState>("login");
  const [user, setUser] = useState<User | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  // Load questions from Google Sheet
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const sheetQuestions = await fetchQuestionsFromSheet();
        setQuestions(sheetQuestions);
      } catch (error) {
        console.error("Error loading questions:", error);
        toast.error("Failed to load questions");
      } finally {
        setIsLoadingQuestions(false);
      }
    };
    loadQuestions();
  }, []);

  // Load leaderboard
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const q = query(
          collection(db, "scores"),
          orderBy("score", "desc"),
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        const scores: LeaderboardEntry[] = querySnapshot.docs.map((doc, index) => ({
          id: index + 1,
          name: doc.data().name,
          score: doc.data().score,
          maxScore: doc.data().maxScore,
          date: doc.data().date
        }));
        setLeaderboard(scores);
      } catch (error) {
        console.error("Error loading leaderboard:", error);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };

    loadLeaderboard();
  }, [gameState]);

  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleAnswer();
    }
  }, [timeLeft, gameState, isAnswered]);

  const handleLogin = (name: string, email: string) => {
    setUser({ name, email });
    setGameState("start");
    toast.success(`Welcome ${name}! 🎉`);
  };

  const startGame = () => {
    setGameState("playing");
    setCurrentQuestion(0);
    setScore(0);
    setUserAnswer("");
    setIsAnswered(false);
    setTimeLeft(30);
  };

  const handleAnswer = () => {
    if (isAnswered) return;

    setIsAnswered(true);

    const userAnswerLower = userAnswer.toLowerCase().trim();
    const isCorrect = questions[currentQuestion].acceptableAnswers.some(
      acceptableAnswer => acceptableAnswer.toLowerCase() === userAnswerLower
    );

    if (isCorrect) {
      setScore(score + 1);
      toast.success("Correct! 🎉");
    } else {
      toast.error(`Wrong! The answer was ${questions[currentQuestion].correctAnswer}`);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setUserAnswer("");
        setIsAnswered(false);
        setTimeLeft(30);
      } else {
        // Save score to Firebase
        saveScore();
        setGameState("finished");
      }
    }, 2000);
  };

  const saveScore = async () => {
    if (!user) return;
    
    try {
      await addDoc(collection(db, "scores"), {
        name: user.name,
        email: user.email,
        score: score,
        maxScore: questions.length,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      });
      toast.success("Score saved to leaderboard!");
    } catch (error) {
      console.error("Error saving score:", error);
      toast.error("Failed to save score");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userAnswer.trim() && !isAnswered) {
      handleAnswer();
    }
  };

  const resetGame = () => {
    setGameState("start");
    setCurrentQuestion(0);
    setScore(0);
    setUserAnswer("");
    setIsAnswered(false);
    setTimeLeft(30);
  };

  const getScoreMessage = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage === 100) return "Perfect! Brand Master! 🏆";
    if (percentage >= 80) return "Excellent! Brand Expert! 🌟";
    if (percentage >= 60) return "Great job! Brand Enthusiast! 👏";
    if (percentage >= 40) return "Not bad! Keep practicing! 💪";
    return "Better luck next time! 🎯";
  };

  if (gameState === "login") {
    return <LoginForm onLogin={handleLogin} />;
  }

  const renderGameContent = () => {
    if (isLoadingQuestions) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md p-8 text-center space-y-6 bg-gradient-to-br from-card to-card/80 border-jumia/20">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-jumia" />
            <p className="text-muted-foreground">Loading questions...</p>
          </Card>
        </div>
      );
    }

    if (questions.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md p-8 text-center space-y-6 bg-gradient-to-br from-card to-card/80 border-jumia/20">
            <p className="text-destructive">No questions found. Please check your Google Sheet.</p>
          </Card>
        </div>
      );
    }

    if (gameState === "start") {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md p-8 text-center space-y-6 bg-gradient-to-br from-card to-card/80 border-jumia/20">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-jumia to-jumia-light rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-jumia to-jumia-light bg-clip-text text-transparent">
                Jumia Brand Guess
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.name}! Ready to test your brand knowledge?
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• {questions.length} questions</p>
                <p>• 30 seconds per question</p>
                <p>• Type your answer</p>
              </div>
              <Button 
                onClick={startGame} 
                className="w-full bg-gradient-to-r from-jumia to-jumia-light hover:from-jumia-dark hover:to-jumia text-white"
                size="lg"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Game
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    if (gameState === "finished") {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md p-8 text-center space-y-6 bg-gradient-to-br from-card to-card/80 border-jumia/20">
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-success to-success/80 rounded-full flex items-center justify-center">
                <Trophy className="w-10 h-10 text-success-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Game Complete!</h2>
              <p className="text-lg">{getScoreMessage()}</p>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-jumia to-jumia-light bg-clip-text text-transparent">
                  {score}/{questions.length}
                </div>
                <p className="text-muted-foreground">Final Score</p>
              </div>
              <Button 
                onClick={resetGame} 
                className="w-full bg-gradient-to-r from-jumia to-jumia-light hover:from-jumia-dark hover:to-jumia text-white"
                size="lg"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    // Playing state
    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              Score: {score}/{questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-center">
            <div className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-destructive' : 'text-foreground'}`}>
              {timeLeft}s
            </div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-card to-card/80 border-jumia/20">
          <div className="text-center space-y-6">
            <h2 className="text-xl font-semibold">Which brand is this?</h2>
            <div className="relative w-64 h-64 mx-auto bg-white rounded-lg p-4 shadow-lg">
              <img 
                src={question.image} 
                alt="Brand product" 
                className="w-full h-full object-contain rounded"
              />
            </div>
          </div>
        </Card>

        {/* Answer Input */}
        <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-jumia/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="answer" className="text-sm font-medium">
                Type your answer:
              </label>
              <Input
                id="answer"
                type="text"
                placeholder="Enter the brand name..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={isAnswered}
                className="text-lg h-12"
              />
            </div>
            <Button 
              type="submit" 
              disabled={!userAnswer.trim() || isAnswered}
              className="w-full bg-gradient-to-r from-jumia to-jumia-light hover:from-jumia-dark hover:to-jumia text-white"
              size="lg"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Answer
            </Button>
          </form>
          
          {isAnswered && (
            <div className="mt-4 p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                {userAnswer.toLowerCase().trim() && questions[currentQuestion].acceptableAnswers.some(
                  acceptableAnswer => acceptableAnswer.toLowerCase() === userAnswer.toLowerCase().trim()
                ) 
                  ? "✅ Correct! Well done!" 
                  : `❌ The correct answer was: ${questions[currentQuestion].correctAnswer}`
                }
              </p>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderLeaderboard = () => {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gradient-to-br from-card to-card/80 border-jumia/20">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-jumia to-jumia-light rounded-full flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-jumia to-jumia-light bg-clip-text text-transparent">
                Leaderboard
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>REFRESH: 9m : 52s</span>
                <span>SCORE DATE</span>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow className="border-jumia/10">
                    <TableHead className="text-left font-medium">Name</TableHead>
                    <TableHead className="text-center font-medium">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLeaderboard ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8">
                        Loading leaderboard...
                      </TableCell>
                    </TableRow>
                  ) : leaderboard.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                        No scores yet. Be the first to play!
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaderboard.map((entry, index) => (
                      <TableRow key={entry.id} className="border-jumia/10 hover:bg-jumia/5">
                        <TableCell className="font-medium flex items-center gap-3">
                          {index === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                          {index === 1 && <Medal className="w-4 h-4 text-gray-400" />}
                          {index === 2 && <Medal className="w-4 h-4 text-amber-600" />}
                          <span className={index < 3 ? "font-bold" : ""}>{entry.name}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-jumia">
                            {entry.score} out of {entry.maxScore}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-jumia to-jumia-light bg-clip-text text-transparent mb-2">
            Jumia Brand Guess
          </h1>
          <p className="text-muted-foreground">
            Welcome {user?.name}! Test your brand knowledge
          </p>
        </div>

        <Tabs defaultValue="game" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted">
            <TabsTrigger 
              value="game" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-jumia data-[state=active]:to-jumia-light data-[state=active]:text-white"
            >
              Game
            </TabsTrigger>
            <TabsTrigger 
              value="leaderboard"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-jumia data-[state=active]:to-jumia-light data-[state=active]:text-white"
            >
              Leaderboard
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="game" className="mt-0">
            {renderGameContent()}
          </TabsContent>
          
          <TabsContent value="leaderboard" className="mt-0">
            {renderLeaderboard()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};