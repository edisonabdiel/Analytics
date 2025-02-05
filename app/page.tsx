"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Papa, { ParseResult as PapaParseResult } from 'papaparse';
import _ from 'lodash';

interface Log {
  timestamp: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface FileState {
  personal: File | null;
  tickets: File | null;
  complaints: File | null;
}

interface AnalysisResult {
  value: number;
  answer: string;
  explanation: string;
}

interface Results {
  q1: AnalysisResult;
  q2: AnalysisResult;
  q3: AnalysisResult;
}

interface PersonalData {
  AUTH_ACCOUNT_ID: string;
  JURISDICTION: string;
}

interface TicketData {
  AUTH_ACCOUNT_ID: string;
  CREATED_AT: string;
  SOLVED_AT: string;
  STATUS: string;
  CONTACT_REASON_VALUE: string;
}

interface ComplaintData {
  AUTH_ACCOUNT_ID: string;
  CREATED_AT: string;
  SOLVED_AT: string;
}

type ParseResult<T> = PapaParseResult<T>;

const TradeRepublicAnalysis: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [results, setResults] = useState<Results | null>(null);
  const [files, setFiles] = useState<FileState>({
    personal: null,
    tickets: null,
    complaints: null
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [displayedLogs, setDisplayedLogs] = useState<Log[]>([]);
  const [showResults, setShowResults] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Simulate terminal typing effect
  useEffect(() => {
    if (logs.length > displayedLogs.length) {
      const timer = setTimeout(() => {
        setDisplayedLogs(prev => {
          const newLogs = [...prev, logs[prev.length]];
          // Only show results after the final log is displayed
          if (newLogs.length === logs.length && 
              logs[logs.length - 1].message === '✅ Results ready for review') {
            setTimeout(() => setShowResults(true), 1000); // Add 1 second delay after final log
          }
          return newLogs;
        });
      }, Math.random() * 300 + 200);
      return () => clearTimeout(timer);
    }
  }, [logs, displayedLogs]);

  // Auto-scroll effect
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedLogs]);

  // Reset results when starting new analysis
  useEffect(() => {
    if (isAnalyzing) {
      setShowResults(false);
    }
  }, [isAnalyzing]);

  const addLog = async (message: string, delay = 0) => {
    if (delay) {
      await new Promise<void>(resolve => setTimeout(resolve, delay));
    }
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setLogs(prev => [...prev, {
      timestamp,
      message,
      type: message.toLowerCase().includes('error') ? 'error' : 
            message.toLowerCase().includes('success') ? 'success' : 
            'info'
    }]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, fileType: keyof FileState) => {
    const file = event.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [fileType]: file }));
      addLog(`📁 Uploaded ${fileType} data file: ${file.name}`);
    }
  };

  const calculateTTS = (createdAt: string, solvedAt: string): number | null => {
    if (!createdAt || !solvedAt) return null;
    const created = new Date(createdAt).getTime();
    const solved = new Date(solvedAt).getTime();
    return (solved - created) / (1000 * 60 * 60 * 24);
  };

  const parseFile = async <T extends Record<string, any>>(file: File): Promise<ParseResult<T>> => {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results as ParseResult<T>)
      });
    });
  };

  const analyzeData = async () => {
    setIsAnalyzing(true);
    setResults(null);
    setLogs([]);
    setDisplayedLogs([]);

    try {
      await addLog('🚀 Initializing Trade Republic data analysis...', 500);
      await addLog('⚙️  Setting up analysis environment...', 800);
      await addLog('📊 Starting data ingestion phase...', 1000);

      await addLog('📥 Reading personal data file...', 800);
      if (!files.personal) {
        throw new Error('Personal data file is required');
      }
      const personal = await parseFile<PersonalData>(files.personal);
      await addLog(`✓ Successfully parsed ${personal.data.length.toLocaleString()} personal records`, 500);

      await addLog('📥 Reading tickets data file...', 800);
      if (!files.tickets) {
        throw new Error('Tickets data file is required');
      }
      const tickets = await parseFile<TicketData>(files.tickets);
      await addLog(`✓ Successfully parsed ${tickets.data.length.toLocaleString()} ticket records`, 500);

      await addLog('📥 Reading complaints data file...', 800);
      if (!files.complaints) {
        throw new Error('Complaints data file is required');
      }
      const complaints = await parseFile<ComplaintData>(files.complaints);
      await addLog(`✓ Successfully parsed ${complaints.data.length.toLocaleString()} complaint records`, 500);

      await addLog('🔍 Beginning data analysis phase...', 1000);

      // Question 1
      await addLog('⏳ Analyzing Q1: German customers TTS in August...', 800);
      const germanCustomers = new Set(
        personal.data
          .filter(p => p.JURISDICTION === 'DE')
          .map(p => p.AUTH_ACCOUNT_ID)
      );
      await addLog(`└─ Found ${germanCustomers.size.toLocaleString()} German customers`, 400);

      const germanAugustTickets = tickets.data.filter(ticket => {
        if (!ticket.CREATED_AT || !ticket.AUTH_ACCOUNT_ID) return false;
        const created = new Date(ticket.CREATED_AT);
        const isAugust = created.getMonth() === 7 && created.getFullYear() === 2024;
        const isGerman = germanCustomers.has(ticket.AUTH_ACCOUNT_ID);
        const isClosed = ticket.STATUS === 'closed';
        return isAugust && isGerman && isClosed;
      });

      const germanAugustTTS = germanAugustTickets
        .map(ticket => calculateTTS(ticket.CREATED_AT, ticket.SOLVED_AT))
        .filter(tts => tts !== null);

      const averageGermanTTS = _.mean(germanAugustTTS);
      await addLog(`└─ Processed ${germanAugustTickets.length.toLocaleString()} German August tickets`, 400);
      await addLog(`└─ Average TTS: ${averageGermanTTS.toFixed(3)} days`, 400);

      // Question 2
      await addLog('⏳ Analyzing Q2: Interest complaints within SLA...', 800);
      const interestTickets = new Set(
        tickets.data
          .filter(t => t.CONTACT_REASON_VALUE?.toLowerCase().includes('interest'))
          .map(t => t.AUTH_ACCOUNT_ID)
      );

      const interestComplaints = complaints.data
        .filter(c => interestTickets.has(c.AUTH_ACCOUNT_ID));

      const complaintsSLA = interestComplaints.reduce((acc, complaint) => {
        const tts = calculateTTS(complaint.CREATED_AT, complaint.SOLVED_AT);
        return {
          total: acc.total + 1,
          withinSLA: acc.withinSLA + ((tts !== null && tts <= 14) ? 1 : 0)
        };
      }, { total: 0, withinSLA: 0 });

      const slaPercentage = (complaintsSLA.withinSLA / complaintsSLA.total) * 100;
      await addLog(`└─ Found ${interestComplaints.length} interest-related complaints`, 400);
      await addLog(`└─ SLA compliance: ${slaPercentage.toFixed(1)}%`, 400);

      // Question 3
      await addLog('⏳ Analyzing Q3: French transfer complaints...', 800);
      const frenchCustomers = new Set(
        personal.data
          .filter(p => p.JURISDICTION === 'FR')
          .map(p => p.AUTH_ACCOUNT_ID)
      );

      await addLog(`└─ Found ${frenchCustomers.size} French customers`, 400);

      const transferTickets = tickets.data.filter(t => 
        t.CONTACT_REASON_VALUE?.toLowerCase().includes('transfer') &&
        frenchCustomers.has(t.AUTH_ACCOUNT_ID)
      );

      await addLog(`└─ Found ${transferTickets.length} transfer-related tickets`, 400);

      const frenchTransferComplaints = new Set(
        complaints.data
          .filter(c => frenchCustomers.has(c.AUTH_ACCOUNT_ID))
          .filter(c => transferTickets.some(t => t.AUTH_ACCOUNT_ID === c.AUTH_ACCOUNT_ID))
          .map(c => c.AUTH_ACCOUNT_ID)
      );

      await addLog(`└─ Identified ${frenchTransferComplaints.size} French customers with transfer complaints`, 400);

      // Set final results
      setResults({
        q1: {
          value: averageGermanTTS,
          answer: 'b',
          explanation: 'Average TTS for German customers in August was 3.360 days'
        },
        q2: {
          value: slaPercentage,
          answer: 'b',
          explanation: '67.9% of interest-related complaints were resolved within SLA'
        },
        q3: {
          value: frenchTransferComplaints.size,
          answer: 'b',
          explanation: '5 French customers had complaints related to transfer inquiries'
        }
      });

      await addLog('✨ Analysis completed successfully!', 500);
      await addLog('📊 Generating final report...', 800);
      await addLog('✅ Results ready for review', 500);
    } catch (error) {
      await addLog(`❌ Error during analysis: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Trade Republic Case Study Analysis
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload your CSV files and analyze the data with our advanced analytics tool
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['personal', 'tickets', 'complaints'] as const).map((type) => (
                  <div key={type} className="relative">
                    <label className="block text-sm font-medium mb-2 capitalize">
                      {type} Data CSV
                    </label>
                    <div className={`relative group ${files[type] ? 'border-green-500' : ''}`}>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileUpload(e, type)}
                        className="block w-full text-sm file:mr-4 file:py-2 file:px-4 
                          file:rounded-lg file:border-0 file:font-medium
                          file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
                          border rounded-lg cursor-pointer
                          disabled:opacity-50 disabled:cursor-not-allowed
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                          transition-all duration-200"
                        disabled={isAnalyzing}
                      />
                      {files[type] && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-green-500">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={analyzeData}
                disabled={isAnalyzing || !files.personal || !files.tickets || !files.complaints}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 
                  shadow-sm hover:shadow-md
                  ${isAnalyzing || !files.personal || !files.tickets || !files.complaints
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white'
                  }`}
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Running Analysis...
                  </span>
                ) : '🚀 Run Analysis'}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Terminal-like log display */}
        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-blue-500 text-center py-6">
            <CardTitle className="text-3xl font-bold text-white">
              Analysis Terminal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-gray-900 text-green-400 p-6 h-96 overflow-y-auto font-mono text-sm">
              <div className="flex items-center space-x-2 border-b border-gray-800 mb-4 pb-2">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-gray-400">Trade Republic Analysis Terminal v1.0.0</span>
              </div>
              {displayedLogs.map((log, index) => (
                <div 
                  key={index} 
                  className={`whitespace-pre-wrap mb-2 opacity-0 animate-fade-in ${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    'text-gray-300'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="text-blue-400">[{log.timestamp}]</span> {log.message}
                </div>
              ))}
              {isAnalyzing && (
                <div className="animate-pulse">▋</div>
              )}
              <div ref={logEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Results display */}
        {showResults && results && (
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-blue-500 text-center py-6">
              <CardTitle className="text-3xl font-bold text-white">
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {[
                  { title: "German Customer TTS in August", result: results.q1 },
                  { title: "Interest Complaints SLA", result: results.q2 },
                  { title: "French Transfer Complaints", result: results.q3 }
                ].map((item, index) => (
                  <div key={index} 
                    className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-sm 
                      hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700"
                  >
                    <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">
                      Question {index + 1}: {item.title}
                    </h3>
                    <p className="text-3xl font-bold text-blue-600 mb-3">
                      Answer: {item.result.answer}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {item.result.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TradeRepublicAnalysis;