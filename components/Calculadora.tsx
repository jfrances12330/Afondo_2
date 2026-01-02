
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { GoogleGenAI } from "@google/genai";

interface CalculadoraProps {
  onBack: () => void;
}

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6; 
type HoodType = 'mural' | 'central';
type TurbineSize = 'pequeña' | 'estándar' | 'industrial';
type Accessibility = 'fácil' | 'media' | 'difícil';
type FoodType = 'ligera' | 'mixta' | 'frituras';
type CleaningState = 'normal' | 'critica';

const Calculadora: React.FC<CalculadoraProps> = ({ onBack }) => {
  const [step, setStep] = useState<Step>(0);
  const [cookingHours, setCookingHours] = useState(8);
  const [foodType, setFoodType] = useState<FoodType>('mixta');
  const [lastCleaningMonths, setLastCleaningMonths] = useState(6);
  const [riskScore, setRiskScore] = useState(0);
  const [type, setType] = useState<HoodType>('mural');
  const [filters, setFilters] = useState(3);
  const [ductsVertical, setDuctsVertical] = useState(2);
  const [ductsHorizontal, setDuctsHorizontal] = useState(3);
  const [registers, setRegisters] = useState(0);
  const [turbineSize, setTurbineSize] = useState<TurbineSize>('estándar');
  const [accessibility, setAccessibility] = useState<Accessibility>('fácil');
  const [cleaningState, setCleaningState] = useState<CleaningState>('normal');
  const [recurring, setRecurring] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [total, setTotal] = useState(0);

  const budgetRef = useMemo(() => 
    `AFO-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`, 
  []);

  useEffect(() => {
    let score = (cookingHours * 4.5);
    if (foodType === 'frituras') score += 35;
    if (foodType === 'mixta') score += 15;
    score += (lastCleaningMonths * 5);
    setRiskScore(Math.min(Math.round(score), 100));
  }, [cookingHours, foodType, lastCleaningMonths]);

  useEffect(() => {
    let subtotal = 120;
    subtotal += type === 'mural' ? 50 : 100;
    subtotal += filters * 15;
    subtotal += ductsHorizontal * 20;
    subtotal += ductsVertical * 30;
    subtotal += registers * 15;
    const turbinePrices = { pequeña: 110, estándar: 180, industrial: 280 };
    let turbineCost = turbinePrices[turbineSize];
    const accessMultipliers = { fácil: 1, media: 1.25, difícil: 1.5 };
    turbineCost *= accessMultipliers[accessibility];
    subtotal += turbineCost;
    if (cleaningState === 'critica') subtotal *= 1.30;
    if (recurring) subtotal *= 0.85;
    setTotal(Math.round(subtotal));
  }, [type, filters, ductsVertical, ductsHorizontal, registers, turbineSize, accessibility, cleaningState, recurring]);

  const handleNext = () => setStep((s) => Math.min(s + 1, 6) as Step);
  const handlePrev = () => setStep((s) => Math.max(s - 1, 0) as Step);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const analyzeWithAI = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = selectedImage.split(',')[1];
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: "Analiza esta imagen de una campana extractora industrial. Determina nivel de grasa acumulada y riesgos bajo norma UNE 100165. Sé breve y profesional (máximo 40 palabras)." },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        }
      });
      setAiDiagnosis(response.text || "Análisis completado satisfactoriamente.");
      handleNext();
    } catch (error) {
      setAiDiagnosis("Recomendamos una inspección técnica presencial.");
      handleNext();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(10, 10, 50);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("PRESUPUESTO AFONDO", 20, 25);
    doc.text(`REF: ${budgetRef}`, 150, 25, { fontSize: 10 } as any);
    doc.setTextColor(0, 0, 0);
    doc.text(`Inversión Total Estimada: ${total}€`, 20, 60);
    doc.save(`Presupuesto_${budgetRef}.pdf`);
  };

  const shareWhatsApp = () => {
    const msg = `¡Hola Afondo! 👋 He completado mi auditoría online: *${budgetRef}*\n\n💰 *Presupuesto Estimado:* ${total}€`;
    window.open(`https://wa.me/34622064101?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <section className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8 md:py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-primary font-bold mb-6 hover:gap-3 transition-all text-xs uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm">arrow_back</span> Salir
        </button>
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col min-h-[700px]">
          <div className="p-6 md:p-14 flex-1">
            {step === 0 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-4xl font-black dark:text-white mb-2 tracking-tight">Análisis de Riesgo</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-8">
                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Horas cocina/día: {cookingHours}h</label>
                      <input type="range" min="1" max="24" value={cookingHours} onChange={(e) => setCookingHours(parseInt(e.target.value))} className="w-full accent-primary h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Última limpieza: {lastCleaningMonths} meses</label>
                      <input type="range" min="0" max="24" value={lastCleaningMonths} onChange={(e) => setLastCleaningMonths(parseInt(e.target.value))} className="w-full accent-primary h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                    </div>
                  </div>
                  <div className="bg-slate-900 rounded-3xl p-8 text-center text-white flex flex-col justify-center border-b-8 border-primary relative overflow-hidden">
                    <span className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Peligro de Incendio</span>
                    <div className="text-7xl font-black">{riskScore}<span className="text-2xl text-primary ml-1">%</span></div>
                  </div>
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-4xl font-black dark:text-white mb-8 tracking-tight">La Campana</h2>
                <div className="grid grid-cols-2 gap-6 mb-10">
                  <button onClick={() => setType('mural')} className={`p-10 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all ${type === 'mural' ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-800'}`}>
                    <span className="material-symbols-outlined text-4xl text-primary">shelves</span>
                    <span className="font-bold uppercase text-sm tracking-wider">Mural</span>
                  </button>
                  <button onClick={() => setType('central')} className={`p-10 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all ${type === 'central' ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-800'}`}>
                    <span className="material-symbols-outlined text-4xl text-primary">format_overline</span>
                    <span className="font-bold uppercase text-sm tracking-wider">Central</span>
                  </button>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-10 rounded-3xl text-center border border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-4 block tracking-widest">Filtros Totales</label>
                  <div className="flex items-center justify-center gap-8">
                    <button onClick={() => setFilters(Math.max(1, filters-1))} className="w-14 h-14 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-xl dark:text-white">-</button>
                    <span className="text-6xl font-black text-primary min-w-[100px]">{filters}</span>
                    <button onClick={() => setFilters(filters+1)} className="w-14 h-14 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-xl dark:text-white">+</button>
                  </div>
                </div>
              </div>
            )}
            {step === 6 && (
              <div className="animate-in fade-in zoom-in-95 duration-700 h-full flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div className="bg-primary/5 dark:bg-primary/10 p-10 rounded-[2.5rem] border border-primary/20">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Dictamen Técnico AFONDO</h4>
                    <p className="text-sm font-bold dark:text-white leading-relaxed">
                      {aiDiagnosis || `Evaluación técnica completada. Riesgo detectado del ${riskScore}%.`}
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <button onClick={shareWhatsApp} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-[2rem] p-8 flex flex-col items-center justify-center gap-3 transition-all">
                      <span className="material-symbols-outlined text-5xl">near_me</span>
                      <span className="font-black uppercase tracking-widest text-xs">Agendar WhatsApp</span>
                    </button>
                    <button onClick={generatePDF} className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] p-5 flex items-center justify-center gap-4 font-black uppercase text-xs tracking-widest dark:text-white">
                      <span className="material-symbols-outlined text-primary">picture_as_pdf</span> Descargar PDF
                    </button>
                  </div>
                </div>
                <div className="mt-auto bg-slate-950 p-10 rounded-[3rem] text-white flex justify-between items-center shadow-2xl border-t-4 border-primary">
                   <div>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Presupuesto Final</span>
                     <div className="text-6xl font-black tracking-tighter">{total}<span className="text-2xl text-primary ml-1">€</span></div>
                   </div>
                   <div className="text-right">
                     <span className="text-xs font-bold text-primary tracking-widest">{budgetRef}</span>
                   </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            {step < 6 && (
              <>
                <div className="flex flex-col text-center sm:text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inversión Estimada</span>
                  <p className="text-4xl sm:text-5xl font-black text-primary tracking-tighter leading-none">{total}<span className="text-xl ml-0.5 font-bold">€</span></p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button onClick={handlePrev} disabled={step === 0} className="flex-1 sm:flex-none px-6 h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 font-black uppercase text-[10px] tracking-widest dark:text-white disabled:opacity-30">Anterior</button>
                  <button onClick={handleNext} className="flex-[2] sm:flex-none px-10 h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/30 truncate">Continuar</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Calculadora;
