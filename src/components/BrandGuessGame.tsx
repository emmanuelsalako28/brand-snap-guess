import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Trophy, RotateCcw, Play } from "lucide-react";
import { LoginForm } from "./LoginForm";

// Import Jumia brand product images
import tecnoImage from "@/assets/tecno-phone.jpg";
import infinixImage from "@/assets/infinix-phone.jpg";
import oraimoImage from "@/assets/oraimo-powerbank.jpg";
import adidasImage from "@/assets/adidas-shoes.jpg";
import samsungImage from "@/assets/samsung-galaxy.jpg";
import iphoneImage from "@/assets/iphone.jpg";

interface Question {
  id: number;
  image: string;
  correctAnswer: string;
  options: string[];
}

const questions: Question[] = [
  {
    id: 1,
    image: tecnoImage,
    correctAnswer: "Tecno",
    options: ["Tecno", "Infinix", "Samsung", "Redmi"]
  },
  {
    id: 2,
    image: infinixImage,
    correctAnswer: "Infinix",
    options: ["Infinix", "Tecno", "Oppo", "Realme"]
  },
  {
    id: 3,
    image: oraimoImage,
    correctAnswer: "Oraimo",
    options: ["Oraimo", "Anker", "Romoss", "New Age"]
  },
  {
    id: 4,
    image: adidasImage,
    correctAnswer: "Adidas",
    options: ["Adidas", "Nike", "Puma", "Reebok"]
  },
  {
    id: 5,
    image: samsungImage,
    correctAnswer: "Samsung",
    options: ["Samsung", "Apple", "Huawei", "Xiaomi"]
  },
  {
    id: 6,
    image: iphoneImage,
    correctAnswer: "Apple",
    options: ["Apple", "Samsung", "Google", "OnePlus"]
  }
];

type GameState = "login" | "start" | "playing" | "finished";

interface User {
  name: string;
  email: string;
}

export const BrandGuessGame = () => {
  const [gameState, setGameState] = useState<GameState>("login");
  const [user, setUser] = useState<User | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleAnswer("");
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
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeLeft(15);
  };

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);

    const isCorrect = answer === questions[currentQuestion].correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
      toast.success("Correct! 🎉");
    } else {
      toast.error(`Wrong! The answer was ${questions[currentQuestion].correctAnswer}`);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setTimeLeft(15);
      } else {
        setGameState("finished");
      }
    }, 2000);
  };

  const resetGame = () => {
    setGameState("start");
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeLeft(15);
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

  if (gameState === "start") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-6 bg-gradient-to-br from-card to-card/80 border-primary/20">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Brand Snap Guess
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name}! Ready to test your brand knowledge?
            </p>
          </div>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• {questions.length} questions</p>
              <p>• 15 seconds per question</p>
              <p>• Multiple choice answers</p>
            </div>
            <Button 
              onClick={startGame} 
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-6 bg-gradient-to-br from-card to-card/80 border-primary/20">
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-success to-success/80 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-success-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Game Complete!</h2>
            <p className="text-lg">{getScoreMessage()}</p>
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {score}/{questions.length}
              </div>
              <p className="text-muted-foreground">Final Score</p>
            </div>
            <Button 
              onClick={resetGame} 
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
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

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background p-4">
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
        <Card className="p-6 mb-6 bg-gradient-to-br from-card to-card/80 border-primary/20">
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

        {/* Answer Options */}
        <div className="grid grid-cols-2 gap-4">
          {question.options.map((option) => {
            let buttonClass = "h-16 text-lg font-medium transition-all duration-200 ";
            
            if (isAnswered) {
              if (option === question.correctAnswer) {
                buttonClass += "bg-gradient-to-r from-success to-success/80 border-success text-success-foreground";
              } else if (option === selectedAnswer) {
                buttonClass += "bg-gradient-to-r from-destructive to-destructive/80 border-destructive text-destructive-foreground";
              } else {
                buttonClass += "bg-muted text-muted-foreground cursor-not-allowed";
              }
            } else {
              buttonClass += "bg-gradient-to-r from-secondary to-secondary/80 hover:from-primary hover:to-accent hover:text-primary-foreground border-border";
            }

            return (
              <Button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={isAnswered}
                className={buttonClass}
                variant="outline"
              >
                {option}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};