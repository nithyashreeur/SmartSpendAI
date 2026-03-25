import React, { useState, useRef } from 'react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { Upload, FileText, Send, Loader2, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
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
    setAnalysisResult(null);

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
Your role is to analyze user expenses, detect overspending patterns, and provide intelligent, personalized financial advice in a simple, friendly, and non-judgmental tone.

INPUT FORMAT (AFTER PROCESSING):
Convert all inputs into this format before analysis:
Date | Category | Item | Amount

IF INPUT IS RAW OCR TEXT (UNSTRUCTURED):
1. Extract items and prices
2. Assign suitable categories (Grocery, Snacks, Medical, Shopping, etc.)
3. Add current date if not available
4. Convert into structured format

YOUR TASKS:
1. EXPENSE CATEGORIZATION:
- Classify each expense as: NEED (essential) or WANT (non-essential)
- Display clearly in a table-like format

2. SPENDING SUMMARY:
- Calculate total spending
- Show category-wise spending
- Identify highest spending category

3. OVERSPENDING ANALYSIS:
- Detect unusual or excessive spending
- Identify patterns like impulse buying, discount-driven purchases, repeated small expenses
- Highlight with ⚠️ warnings

4. BEHAVIOR INSIGHTS:
- Explain WHY the user might be overspending
- Use simple real-life reasoning (psychological + practical)

5. SMART SUGGESTIONS:
- Give 3–5 personalized tips to reduce spending
- Suggest budget control strategies
- Suggest better alternatives

6. CREDIT RISK WARNING:
- Predict if the user may depend on credit cards
- Warn if spending seems higher than reasonable

7. SAVINGS ADVICE:
- Suggest how much the user can save
- Provide a simple and practical savings plan

OUTPUT FORMAT:
Use clean sections with emojis exactly as follows:
## 📊 Spending Summary
## 🧾 Category Breakdown
## ⚠️ Overspending Alerts
## 🧠 Behavior Insight
## 💡 Smart Suggestions
## 💳 Credit Risk Warning
## 💰 Savings Plan

TONE: Friendly and supportive, simple language, practical and realistic advice.
IMPORTANT RULES: Be accurate with calculations, do not assume missing data unless instructed (for OCR case only), keep output neat and structured, focus on helping user improve spending habits.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts },
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        },
      });

      if (response.text) {
        setAnalysisResult(response.text);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">SmartSpend AI</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Input Section */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Input Expenses</CardTitle>
                <CardDescription>
                  Paste your expenses or upload a bill image for analysis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Expense Text
                  </label>
                  <Textarea
                    placeholder="e.g.&#10;12-03-2026 | Grocery | Vegetables | 500&#10;12-03-2026 | Snacks | Chips | 200"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="min-h-[150px] resize-y font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Bill Image
                  </label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      ref={fileInputRef}
                      className="cursor-pointer"
                    />
                  </div>
                  {imagePreview && (
                    <div className="relative mt-4 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={imagePreview} alt="Bill Preview" className="w-full h-auto max-h-48 object-contain" />
                      <button
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-slate-900/70 text-white p-1 rounded-full hover:bg-slate-900 transition-colors"
                        title="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <Button 
                  onClick={analyzeExpenses} 
                  disabled={isAnalyzing || (!inputText.trim() && !selectedImage)}
                  className="w-full gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Analyze Expenses
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-7">
            <Card className="h-full min-h-[500px] flex flex-col">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  AI Analysis
                </CardTitle>
                <CardDescription>
                  Your personalized financial insights will appear here.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                {isAnalyzing ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-sm font-medium animate-pulse">Processing your expenses...</p>
                  </div>
                ) : analysisResult ? (
                  <div className="p-6 prose prose-slate max-w-none prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-100 first:prose-h2:mt-0 prose-p:text-slate-600 prose-li:text-slate-600 prose-table:w-full prose-th:bg-slate-50 prose-th:p-2 prose-th:text-left prose-td:p-2 prose-td:border-t prose-td:border-slate-100">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {analysisResult}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm">Upload a bill or paste your expenses to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
