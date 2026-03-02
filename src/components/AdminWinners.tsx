import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Search,
    RefreshCw,
    Trophy,
    FileText,
    Calendar
} from "lucide-react";
import { toast } from "sonner";

interface Winner {
    id: string;
    name: string;
    email: string;
    score: number;
    maxScore: number;
    date: string;
    timestamp: string;
}

export const AdminWinners = () => {
    const [winners, setWinners] = useState<Winner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState(""); // Default to empty string to show all results

    const fetchWinners = async () => {
        setIsLoading(true);
        try {
            // Fetch scores without complex ordering to avoid index requirements
            const q = query(collection(db, "scores"));

            const querySnapshot = await getDocs(q);
            const allWinners: Winner[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                allWinners.push({
                    id: doc.id,
                    name: data.name || "Anonymous",
                    email: data.email || "No Email",
                    score: data.score,
                    maxScore: data.maxScore,
                    date: data.date,
                    timestamp: data.timestamp
                });
            });

            // Sort in memory by score (desc) and then timestamp (desc)
            allWinners.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });

            setWinners(allWinners);
        } catch (error: unknown) {
            console.error("Error fetching winners:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch winners list";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWinners();
    }, []);

    const filteredWinners = winners.filter(w => {
        const matchesSearch =
            w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = !dateFilter || w.date === dateFilter;
        return matchesSearch && matchesDate;
    });

    const extractToGoogleDocFormat = () => {
        if (filteredWinners.length === 0) {
            toast.info("No winners to extract");
            return;
        }

        const header = "Name\tEmail\tScore\tDate\n";
        const body = filteredWinners.map(w =>
            `${w.name}\t${w.email}\t${w.score}/${w.maxScore}\t${w.date}`
        ).join("\n");

        const textToCopy = header + body;

        navigator.clipboard.writeText(textToCopy).then(() => {
            toast.success("Winners copied to clipboard in Google Doc format!");
        }).catch(err => {
            console.error("Failed to copy:", err);
            toast.error("Failed to copy to clipboard");
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        <Trophy className="w-8 h-8 text-jumia" />
                        Winners Dashboard
                    </h1>
                    <p className="text-muted-foreground">Manage and extract game winners for rewards</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button
                        variant="outline"
                        onClick={fetchWinners}
                        disabled={isLoading}
                        className="flex-1 md:flex-none"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={extractToGoogleDocFormat}
                        disabled={filteredWinners.length === 0}
                        className="flex-1 md:flex-none bg-jumia hover:bg-jumia/90"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Extract to Google Doc
                    </Button>
                </div>
            </div>

            <Card className="border-jumia/10 shadow-lg">
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <CardTitle className="text-xl">Winners List ({filteredWinners.length})</CardTitle>
                        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <div className="relative min-w-[200px]">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search name or email..."
                                    className="pl-10 h-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="relative min-w-[170px]">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    className="pl-10 h-10"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-jumia/10">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[80px] text-center">Rank</TableHead>
                                    <TableHead className="w-[200px]">Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-center">Score</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <RefreshCw className="h-8 w-8 animate-spin text-jumia" />
                                                <span className="text-muted-foreground">Fetching players...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredWinners.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center text-muted-foreground font-medium">
                                            No players found for the selected criteria.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredWinners.map((winner, index) => (
                                        <TableRow key={winner.id} className={`hover:bg-jumia/5 transition-colors ${winner.score === winner.maxScore ? 'bg-jumia/5 font-medium' : ''}`}>
                                            <TableCell className="text-center font-bold text-muted-foreground">
                                                #{index + 1}
                                            </TableCell>
                                            <TableCell className="font-semibold flex items-center gap-2">
                                                {winner.name}
                                                {winner.score === winner.maxScore && (
                                                    <Trophy className="w-4 h-4 text-yellow-500" />
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">{winner.email}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full font-bold ${winner.score === winner.maxScore ? 'bg-jumia text-white' : 'bg-jumia/10 text-jumia'}`}>
                                                    {winner.score}/{winner.maxScore}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">{winner.date}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
