"use client";

import { useState } from "react";

export default function Dashboard() {
    const [docId, setDocId] = useState("");
    const [status, setStatus] = useState("Idle");
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const startProcessing = async () => {
        if (!docId) return;
        setStatus("Processing");
        addLog(`Starting processing for Doc ID: ${docId}`);

        // In a real app, this would call a tRPC mutation
        setTimeout(() => {
            addLog("Article extracted.");
            addLog("SEO metadata fetched.");
            addLog("Content synthesized with Ollama.");
            addLog("Images uploaded to WordPress.");
            addLog("Draft created via Playwright.");
            setStatus("Completed");
        }, 3000);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <header className="mb-12">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Agent SEO Dashboard
                </h1>
                <p className="text-slate-400 mt-2">Autonomous WordPress Orchestration</p>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                    <h2 className="text-xl font-semibold mb-4">New Publication</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Google Doc ID</label>
                            <input
                                type="text"
                                value={docId}
                                onChange={(e) => setDocId(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter ID..."
                            />
                        </div>
                        <button
                            onClick={startProcessing}
                            disabled={status === "Processing"}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-lg transition-all"
                        >
                            {status === "Processing" ? "Processing..." : "Start Pipeline"}
                        </button>
                    </div>
                </section>

                <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl h-[400px] flex flex-col">
                    <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
                    <div className="flex-1 overflow-y-auto bg-slate-900 rounded-lg p-4 font-mono text-sm space-y-2">
                        {logs.length === 0 ? (
                            <p className="text-slate-600 italic">No activity yet...</p>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="text-blue-400 border-l-2 border-blue-500 pl-2">
                                    {log}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
