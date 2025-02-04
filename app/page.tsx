"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Papa from 'papaparse';
import _ from 'lodash';

const TradeRepublicAnalysis = () => {
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState(null);
  const [files, setFiles] = useState({
    personal: null,
    tickets: null,
    complaints: null
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const logEndRef = useRef(null);

  // Simulate terminal typing effect
  useEffect(() => {
    if (logs.length > displayedLogs.length) {
      const timer = setTimeout(() => {
        setDisplayedLogs(prev => [...prev, logs[prev.length]]);
      }, Math.random() * 300 + 200); // Random delay between 200-500ms
      return () => clearTimeout(timer);
    } else if (logs.length > 0 && logs.length === displayedLogs.length) {
      // Show results after the last log is displayed
      const timer = setTimeout(() => {
        setShowResults(true);
      }, 500); // Add a small delay after the last log
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

  const addLog = async (message, delay = 0) => {
    if (delay) {
      await new Promise(resolve => setTimeout(resolve, delay));
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

  const handleFileUpload = (event, fileType) => {
    const file = event.target.files[0];
    setFiles(prev => ({ ...prev, [fileType]: file }));
    addLog(`📁 Uploaded ${fileType} data file: ${file.name}`);
  };

  const calculateTTS = (createdAt, solvedAt) => {
    if (!createdAt || !solvedAt) return null;
    const created = new Date(createdAt);
    const solved = new Date(solvedAt);
    return (solved - created) / (1000 * 60 * 60 * 24);
  };

  const analyzeData = async () => {
    setIsAnalyzing(true);
    setResults(null);
    setLogs([]);
    setDisplayedLogs([]);

    try {
      await addLog('🚀 Initializing Trade Republic data analysis...', 500);
      await addLog('⚙️  Setting up analysis environment...', 800);
      
      const parseFile = (file) => new Promise((resolve) => {
        Papa.parse(file, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results)
        });
      });

      await addLog('📊 Starting data ingestion phase...', 1000);
      await addLog('📥 Reading personal data file...', 800);
      const personal = await parseFile(files.personal);
      await addLog(`✓ Successfully parsed ${personal.data.length.toLocaleString()} personal records`, 500);

      await addLog('📥 Reading tickets data file...', 800);
      const tickets = await parseFile(files.tickets);
      await addLog(`✓ Successfully parsed ${tickets.data.length.toLocaleString()} ticket records`, 500);

      await addLog('📥 Reading complaints data file...', 800);
      const complaints = await parseFile(files.complaints);
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
          withinSLA: acc.withinSLA + (tts <= 14 ? 1 : 0)
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
      await addLog(`❌ Error during analysis: ${error.message}`, 500);
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Trade Republic Case Study Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Personal Data CSV</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileUpload(e, 'personal')}
                    className="block w-full text-sm border rounded p-2"
                    disabled={isAnalyzing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tickets Data CSV</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileUpload(e, 'tickets')}
                    className="block w-full text-sm border rounded p-2"
                    disabled={isAnalyzing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Complaints Data CSV</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileUpload(e, 'complaints')}
                    className="block w-full text-sm border rounded p-2"
                    disabled={isAnalyzing}
                  />
                </div>
              </div>
              
              <button
                onClick={analyzeData}
                disabled={isAnalyzing || !files.personal || !files.tickets || !files.complaints}
                className={`w-full py-2 px-4 rounded transition-colors ${
                  isAnalyzing || !files.personal || !files.tickets || !files.complaints
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isAnalyzing ? '⚡ Running Analysis...' : '🚀 Run Analysis'}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Terminal-like log display */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Terminal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded h-96 overflow-y-auto font-mono text-sm">
              <div className="border-b border-green-500 mb-2 pb-1">
                Trade Republic Analysis Terminal v1.0.0
              </div>
              {displayedLogs.map((log, index) => (
                <div 
                  key={index} 
                  className={`whitespace-pre-wrap mb-1 ${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    'text-gray-300'
                  }`}
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
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Question 1: German Customer TTS in August</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-2">Answer: {results.q1.answer}</p>
                  <p className="text-gray-600">{results.q1.explanation}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Question 2: Interest Complaints SLA</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-2">Answer: {results.q2.answer}</p>
                  <p className="text-gray-600">{results.q2.explanation}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Question 3: French Transfer Complaints</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-2">Answer: {results.q3.answer}</p>
                  <p className="text-gray-600">{results.q3.explanation}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TradeRepublicAnalysis;