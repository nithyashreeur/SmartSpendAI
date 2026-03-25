import React, { useState, useRef } from 'react';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { 
  Upload, FileText, Send, Loader2, Sparkles, AlertTriangle, 
  Wallet, TrendingDown, TrendingUp, Minus, Lightbulb, 
  PieChart, PiggyBank, Receipt, ArrowRight, CheckCircle2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface AnalysisData {
  totalSpending: number;
  currency: string;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  overspendingAlerts: { title: string; description: string; severity: 'high' | 'medium' }[];
  aiInsights: {
    weeklySummary: string;
    highestCategory: string;
    spendingTrend: 'increase' | 'decrease' | 'stable';
    keyInsights: string[];
  };
  smartSuggestions: string[];
  savingsPlan: string;
}

export default function App() {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeExpenses = async () => {
    if (!inputText.trim() && !selectedImage) {
      setError('Please provide some text or upload a bill image to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisData(null);

    try {
      const parts: any[] = [];

      if (selectedImage) {
        const base64Data = imagePreview?.split(',')[1];
        if (base64Data) {
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: selectedImage.type,
            },
          });
        }
      }

      if (inputText.trim()) {
        parts.push({ text: inputText });
      }

      const systemInstruction = `You are an AI Financial Assistant inside an application called "SmartSpend AI".
Your role is to analyze user expenses, detect overspending patterns, and provide intelligent, personalized financial advice.

INPUT FORMAT (AFTER PROCESSING):
Convert all inputs into this format before analysis: Date | Category | Item | Amount
If input is raw OCR text, extract items/prices, assign categories, and structure it.

YOUR TASKS:
1. Calculate total spending and determine the currency.
2. Create a category breakdown with amounts and percentages.
3. Detect overspending (impulse buying, repeated small expenses) and create alerts with severity ('high' or 'medium').
4. Generate AI Insights: A brief weekly summary, the highest spending category, the spending trend ('increase', 'decrease', or 'stable' based on context), and 2-3 key behavioral insights.
5. Provide 3-5 smart, actionable suggestions to reduce spending.
6. Create a practical savings plan.

TONE: Friendly, supportive, simple language, practical.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          totalSpending: { type: Type.NUMBER },
          currency: { type: Type.STRING, description: "Currency symbol, e.g., $, €, ₹" },
          categoryBreakdown: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                percentage: { type: Type.NUMBER }
              },
              required: ["category", "amount", "percentage"]
            }
          },
          overspendingAlerts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                severity: { type: Type.STRING, description: "'high' or 'medium'" }
              },
              required: ["title", "description", "severity"]
            }
          },
          aiInsights: {
            type: Type.OBJECT,
            properties: {
              weeklySummary: { type: Type.STRING },
              highestCategory: { type: Type.STRING },
              spendingTrend: { type: Type.STRING, description: "'increase', 'decrease', or 'stable'" },
              keyInsights: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["weeklySummary", "highestCategory", "spendingTrend", "keyInsights"]
          },
          smartSuggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          savingsPlan: { type: Type.STRING }
        },
        required: ["totalSpending", "currency", "categoryBreakdown", "overspendingAlerts", "aiInsights", "smartSuggestions", "savingsPlan"]
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts },
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      if (response.text) {
        const parsedData = JSON.parse(response.text) as AnalysisData;
        setAnalysisData(parsedData);
      } else {
        setError('No analysis could be generated. Please try again.');
      }
    } catch (err: any) {
      console.error('Error analyzing expenses:', err);
      setError(err.message || 'An error occurred while analyzing your expenses.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'increase') return <TrendingUp className="w-5 h-5 text-red-500" />;
    if (trend === 'decrease') return <TrendingDown className="w-5 h-5 text-emerald-500" />;
    return <Minus className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden font-sans text-slate-900 selection:bg-violet-500/30">
      {/* Subtle Gradient Background */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] opacity-40 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-300/40 to-transparent blur-[100px] rounded-full mix-blend-multiply" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-blue-300/30 to-purple-300/30 blur-[80px] rounded-full mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        
        {/* Header */}
        <header className="pt-20 pb-12 text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center justify-center p-3.5 bg-white rounded-2xl mb-6 text-violet-600 shadow-sm border border-slate-200/60"
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4"
          >
            SmartSpend AI
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-500 font-medium"
          >
            Your intelligent financial companion. Analyze expenses, detect patterns, and optimize your budget.
          </motion.p>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Input Column */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-4 space-y-6 sticky top-8"
          >
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
                  <Receipt className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">Input Expenses</h2>
              </div>
              
              <div className="space-y-5">
                {/* Text Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 pt-4 pointer-events-none">
                    <FileText className="h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                  </div>
                  <textarea
                    placeholder="Paste your expenses here...&#10;e.g. Grocery 500&#10;Snacks 200"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 bg-slate-50/50 focus:bg-white resize-y min-h-[140px] text-sm text-slate-700 placeholder:text-slate-400 outline-none"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  {!imagePreview ? (
                    <div className="relative group cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        ref={fileInputRef}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 group-hover:bg-violet-50/50 group-hover:border-violet-300 transition-colors">
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-violet-500 group-hover:-translate-y-1 transition-all duration-300 mb-2" />
                        <p className="text-sm font-medium text-slate-600 group-hover:text-violet-600">Upload bill image</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm group">
                      <img src={imagePreview} alt="Bill Preview" className="w-full h-32 object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-white/90 text-slate-700 p-1.5 rounded-full hover:bg-red-50 hover:text-red-600 hover:scale-110 transition-all shadow-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Error State */}
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2.5"
                    >
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <p className="leading-relaxed">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <button 
                  onClick={analyzeExpenses} 
                  disabled={isAnalyzing || (!inputText.trim() && !selectedImage)}
                  className="w-full h-12 flex items-center justify-center gap-2 text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze Expenses
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Output Column */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-8"
          >
            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[500px] flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[24px] border border-slate-200/50 shadow-sm"
                >
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-violet-400 rounded-full blur-xl animate-pulse opacity-40" />
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10">
                      <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Analyzing your finances</h3>
                  <p className="text-slate-500">Extracting data and generating smart insights...</p>
                </motion.div>
              ) : analysisData ? (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Top Row: Total & Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Total Spending Card */}
                    <div className="bg-white rounded-[24px] shadow-sm border border-slate-200/60 p-6 hover:-translate-y-1 transition-transform duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                          <Wallet className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-slate-700">Total Spending</h3>
                      </div>
                      <div className="text-4xl font-extrabold text-slate-900 mb-2">
                        {analysisData.currency}{analysisData.totalSpending.toLocaleString()}
                      </div>
                      <p className="text-sm text-slate-500">Analyzed from your provided data</p>
                    </div>

                    {/* AI Insights Card */}
                    <div className="bg-white rounded-[24px] shadow-sm border border-slate-200/60 p-6 hover:-translate-y-1 transition-transform duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <h3 className="font-semibold text-slate-700">AI Insights</h3>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full border border-slate-100">
                          <TrendIcon trend={analysisData.aiInsights.spendingTrend} />
                          <span className="text-xs font-medium text-slate-600 capitalize">{analysisData.aiInsights.spendingTrend} Trend</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        {analysisData.aiInsights.weeklySummary}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {analysisData.aiInsights.keyInsights.map((insight, idx) => (
                          <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md bg-violet-50 text-violet-700 text-xs font-medium border border-violet-100">
                            {insight}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: Breakdown & Alerts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category Breakdown */}
                    <div className="bg-white rounded-[24px] shadow-sm border border-slate-200/60 p-6 hover:-translate-y-1 transition-transform duration-300">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                          <PieChart className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-slate-700">Category Breakdown</h3>
                      </div>
                      <div className="space-y-4">
                        {analysisData.categoryBreakdown.map((cat, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1.5">
                              <span className="font-medium text-slate-700">{cat.category}</span>
                              <span className="text-slate-500">{analysisData.currency}{cat.amount} ({cat.percentage}%)</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${cat.percentage}%` }}
                                transition={{ duration: 1, delay: 0.2 + (idx * 0.1) }}
                                className={`h-full rounded-full ${
                                  cat.category === analysisData.aiInsights.highestCategory 
                                    ? 'bg-indigo-500' 
                                    : 'bg-slate-300'
                                }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Overspending Alerts */}
                    <div className="bg-white rounded-[24px] shadow-sm border border-slate-200/60 p-6 hover:-translate-y-1 transition-transform duration-300">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-slate-700">Overspending Alerts</h3>
                      </div>
                      <div className="space-y-3">
                        {analysisData.overspendingAlerts.length > 0 ? (
                          analysisData.overspendingAlerts.map((alert, idx) => (
                            <div 
                              key={idx} 
                              className={`p-4 rounded-xl border ${
                                alert.severity === 'high' 
                                  ? 'bg-red-50/50 border-red-100' 
                                  : 'bg-orange-50/50 border-orange-100'
                              }`}
                            >
                              <h4 className={`text-sm font-semibold mb-1 ${
                                alert.severity === 'high' ? 'text-red-700' : 'text-orange-700'
                              }`}>
                                {alert.title}
                              </h4>
                              <p className={`text-sm leading-relaxed ${
                                alert.severity === 'high' ? 'text-red-600/80' : 'text-orange-600/80'
                              }`}>
                                {alert.description}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-5 h-5" />
                            <p className="text-sm font-medium">No overspending detected. Great job!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Suggestions & Savings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Smart Suggestions */}
                    <div className="bg-white rounded-[24px] shadow-sm border border-slate-200/60 p-6 hover:-translate-y-1 transition-transform duration-300">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                          <Lightbulb className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-slate-700">Smart Suggestions</h3>
                      </div>
                      <ul className="space-y-3">
                        {analysisData.smartSuggestions.map((suggestion, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <p className="text-sm text-slate-600 leading-relaxed">{suggestion}</p>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Savings Plan */}
                    <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[24px] shadow-md border border-violet-500 p-6 text-white hover:-translate-y-1 transition-transform duration-300">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          <PiggyBank className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-white">Savings Plan</h3>
                      </div>
                      <p className="text-sm text-violet-100 leading-relaxed">
                        {analysisData.savingsPlan}
                      </p>
                    </div>
                  </div>

                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-[500px] flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[24px] border border-slate-200/50 border-dashed"
                >
                  <div className="w-20 h-20 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                    <PieChart className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">No expenses yet</h3>
                  <p className="text-slate-500 max-w-sm text-center">
                    Add your data on the left to get personalized AI insights and a smart savings plan.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
