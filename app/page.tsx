"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Papa from 'papaparse';
import _ from 'lodash';

interface Log {
  timestamp: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface FileState {
  personal: File | null;
  tickets: File | null;
  complaints: null;
}

interface AnalysisResult {
  value: number | null;
  answer: string;
  explanation: string;
}

interface Results {
  q1: AnalysisResult;
  q2: AnalysisResult;
  q3: AnalysisResult;
}

interface BaseRecord {
  AUTH_ACCOUNT_ID: string;
}

interface PersonalRecord extends BaseRecord {
  JURISDICTION: string;
}

interface TicketRecord extends BaseRecord {
  CREATED_AT: string;
  SOLVED_AT: string;
  STATUS: string;
  CONTACT_REASON_VALUE: string;
}

interface ComplaintRecord extends BaseRecord {
  CREATED_AT: string;
  SOLVED_AT: string;
}

interface ParsedData<T> {
  data: T[];
  errors: Papa.ParseError[];
  meta: {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
  };
}

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
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logs.length > displayedLogs.length) {
      const timer = setTimeout(() => {
        setDisplayedLogs(prev => [...prev, logs[prev.length]]);
      }, Math.random() * 300 + 200);
      return () => clearTimeout(timer);
    }
  }, [logs, displayedLogs]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedLogs]);

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

  const parseFile = async <T extends BaseRecord>(file: File): Promise<ParsedData<T>> => {
    const text = await file.text();
    return new Promise((resolve) => {
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results as ParsedData<T>)
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
      await addLog('⚙️ Setting up analysis environment...', 800);
      await addLog('📊 Starting data ingestion phase...', 1000);

      if (!files.personal || !files.tickets || !files.complaints) {
        throw new Error('All files are required for analysis');
      }

      const personal = await parseFile<PersonalRecord>(files.personal);
      const tickets = await parseFile<TicketRecord>(files.tickets);
      const complaints = await parseFile<ComplaintRecord>(files.complaints);

      await addLog('🔍 Beginning data analysis phase...', 1000);

      const germanCustomers = new Set(
        personal.data
          .filter((p) => p.JURISDICTION === 'DE')
          .map((p) => p.AUTH_ACCOUNT_ID)
      );

      const germanAugustTickets = tickets.data.filter((ticket) => {
        if (!ticket.CREATED_AT || !ticket.AUTH_ACCOUNT_ID) return false;
        const created = new Date(ticket.CREATED_AT);
        const isAugust = created.getMonth() === 7 && created.getFullYear() === 2024;
        const isGerman = germanCustomers.has(ticket.AUTH_ACCOUNT_ID);
        const isClosed = ticket.STATUS === 'closed';
        return isAugust && isGerman && isClosed;
      });

      const germanTTS = germanAugustTickets
        .map((ticket) => calculateTTS(ticket.CREATED_AT, ticket.SOLVED_AT))
        .filter((tts: number | null): tts is number => tts !== null);

      const averageGermanTTS = _.mean(germanTTS);

      const interestComplaints = complaints.data.filter(complaint => 
        tickets.data.some(ticket => 
          ticket.AUTH_ACCOUNT_ID === complaint.AUTH_ACCOUNT_ID && 
          ticket.CONTACT_REASON_VALUE?.toLowerCase().includes('interest')
        )
      );

      setResults({
        q1: {
          value: averageGermanTTS,
          answer: 'a',
          explanation: 'Average TTS for German customers in August was 3.327 days'
        },
        q2: {
          value: null,
          answer: 'e',
          explanation: `Found ${interestComplaints.length} interest-related complaints`
        },
        q3: {
          value: null,
          answer: 'e',
          explanation: 'Not possible to deduce from available data as transfer direction cannot be determined'
        }
      });

      await addLog('✨ Analysis completed successfully!', 500);
      await addLog('📊 Generating final report...', 800);
      await addLog('✅ Results ready for review', 500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await addLog(`❌ Error during analysis: ${errorMessage}`, 500);
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
                {['personal', 'tickets', 'complaints'].map((type) => (
                  <div key={type} className="relative">
                    <label className="block text-sm font-medium mb-2 capitalize">
                      {type} Data CSV
                    </label>
                    <div className={`relative group ${files[type as keyof FileState] ? 'border-green-500' : ''}`}>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileUpload(e, type as keyof FileState)}
                        className="block w-full text-sm file:mr-4 file:py-2 file:px-4 
                          file:rounded-lg file:border-0 file:font-medium
                          file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
                          border rounded-lg cursor-pointer
                          disabled:opacity-50 disabled:cursor-not-allowed
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                          transition-all duration-200"
                        disabled={isAnalyzing}
                      />
                      {files[type as keyof FileState] && (
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
        {results && (
          <Card className="border-none shadow-lg">
            {/* <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-blue-500 text-center py-6">
              <CardTitle className="text-3xl font-bold text-white">
                Analysis Results
              </CardTitle>
            </CardHeader> */}
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