import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { Flock } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Download, ChevronDown, CheckCircle, Filter } from 'lucide-react';

interface Props {
  selectedFlockId: string;
}

type ReportType = 'ALL' | 'FEED' | 'MEDICINE' | 'EXPENSE' | 'SALES' | 'MORTALITY';

export default function ReportsManager({ selectedFlockId }: Props) {
  const [currentFlock, setCurrentFlock] = useState(selectedFlockId || '');
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [reportType, setReportType] = useState<ReportType>('ALL');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
      setFlocks(db.getFlocks());
  }, []);

  useEffect(() => {
      if(selectedFlockId) setCurrentFlock(selectedFlockId);
  }, [selectedFlockId]);

  const generatePDF = () => {
    if(!currentFlock) return;
    setIsGenerating(true);
    
    // Allow UI to update before heavy work
    setTimeout(() => {
        try {
            const flock = flocks.find(f => f.id === currentFlock);
            if(!flock) return;

            const feeds = db.getFeeds(currentFlock);
            const medicines = db.getMedicines(currentFlock);
            const expenses = db.getExpenses(currentFlock);
            const sales = db.getSales(currentFlock);
            const mortality = db.getMortality(currentFlock);

            // Calculations
            const totalFeedCost = feeds.reduce((s, x) => s + x.total, 0);
            const totalMedCost = medicines.reduce((s, x) => s + x.total, 0);
            const totalExpCost = expenses.reduce((s, x) => s + x.total, 0);
            const totalSales = sales.reduce((s, x) => s + x.total, 0);
            const totalDeath = mortality.reduce((s, x) => s + x.count, 0);
            const totalSalesQty = sales.reduce((s, x) => s + x.quantity, 0);
            
            const totalCost = totalFeedCost + totalMedCost + totalExpCost;
            const netProfit = totalSales - totalCost;
            const currentBirds = flock.totalBirds - totalDeath - totalSalesQty;

            const doc = new jsPDF();

            // Determine Title based on Type
            let titleText = "Comprehensive Flock Report";
            if (reportType === 'FEED') titleText = "Feed Consumption Report";
            if (reportType === 'MEDICINE') titleText = "Medicine & Vaccine Report";
            if (reportType === 'EXPENSE') titleText = "General Expenses Report";
            if (reportType === 'SALES') titleText = "Sales & Revenue Report";
            if (reportType === 'MORTALITY') titleText = "Mortality & Analytics Report";

            // -- Header --
            doc.setFontSize(22);
            doc.setTextColor(40);
            doc.text(titleText, 105, 20, { align: "center" });
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleDateString()} | App by PMP Nepal`, 105, 26, { align: "center" });

            // -- Flock Details Box (Always visible for context) --
            doc.setDrawColor(200);
            doc.setFillColor(248, 250, 252);
            doc.rect(14, 35, 182, 30, 'F');
            doc.setDrawColor(0);
            
            doc.setFontSize(16);
            doc.setTextColor(0);
            doc.text(flock.name, 20, 48);
            
            doc.setFontSize(10);
            doc.setTextColor(80);
            doc.text(`Start Date: ${flock.startDate}`, 20, 56);
            doc.text(`Status: ${flock.status.toUpperCase()}`, 70, 56);

            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text(`Initial Stock: ${flock.totalBirds}`, 130, 46);
            doc.text(`Current Stock: ${currentBirds}`, 130, 52);
            doc.text(`Mortality: ${totalDeath} (${((totalDeath/flock.totalBirds)*100).toFixed(1)}%)`, 130, 58);

            let currentY = 75;

            // -- Financial Summary Table (Only show for ALL) --
            if (reportType === 'ALL') {
                doc.setFontSize(14);
                doc.text("Financial Analytics", 14, currentY);
                
                const summaryData = [
                    ['Total Sales Revenue', `Rs. ${totalSales.toLocaleString()}`],
                    ['Total Feed Cost', `Rs. ${totalFeedCost.toLocaleString()}`],
                    ['Medicine & Vaccines', `Rs. ${totalMedCost.toLocaleString()}`],
                    ['Other Expenses', `Rs. ${totalExpCost.toLocaleString()}`],
                    ['NET PROFIT / LOSS', `Rs. ${netProfit.toLocaleString()}`]
                ];

                autoTable(doc, {
                    startY: currentY + 5,
                    head: [['Category', 'Amount']],
                    body: summaryData,
                    theme: 'grid',
                    headStyles: { fillColor: [55, 65, 81], textColor: 255, fontStyle: 'bold' },
                    columnStyles: { 
                        0: { cellWidth: 110 },
                        1: { cellWidth: 70, fontStyle: 'bold', halign: 'right' } 
                    },
                    didParseCell: (data) => {
                        // Highlight Net Profit Row
                        if (data.row.index === 4 && data.section === 'body') {
                            const isProfit = netProfit >= 0;
                            data.cell.styles.fillColor = isProfit ? [220, 252, 231] : [254, 226, 226];
                            data.cell.styles.textColor = isProfit ? [21, 128, 61] : [185, 28, 28];
                        }
                    }
                });

                currentY = (doc as any).lastAutoTable.finalY + 15;
            }

            // Helper to add sections
            const addSection = (title: string, head: string[], body: any[], color: [number, number, number]) => {
                if (currentY > 260) {
                    doc.addPage();
                    currentY = 20;
                }

                doc.setFontSize(12);
                doc.setTextColor(0);
                doc.text(title, 14, currentY);
                
                if (body.length === 0) {
                    doc.setFontSize(10);
                    doc.setTextColor(150);
                    doc.text("(No records found)", 14, currentY + 6);
                    currentY += 15;
                    return;
                }

                autoTable(doc, {
                    startY: currentY + 3,
                    head: [head],
                    body: body,
                    theme: 'striped',
                    headStyles: { fillColor: color },
                    styles: { fontSize: 9, cellPadding: 2 },
                });
                
                currentY = (doc as any).lastAutoTable.finalY + 10;
            };

            // 1. Feed Records
            if (reportType === 'ALL' || reportType === 'FEED') {
                addSection(
                    "Feed Records", 
                    ['Date', 'Bill No', 'Type', 'Qty', 'Rate', 'Total'], 
                    feeds.map(f => [f.date, f.billNo, f.type, f.quantity, f.rate, f.total.toLocaleString()]),
                    [37, 99, 235] // Blue
                );
            }

            // 2. Medicine Records
            if (reportType === 'ALL' || reportType === 'MEDICINE') {
                addSection(
                    "Medicine & Vaccines", 
                    ['Date', 'Name / Description', 'Qty', 'Rate', 'Total'], 
                    medicines.map(m => [m.date, m.name, m.quantity, m.rate, m.total.toLocaleString()]),
                    [16, 185, 129] // Green
                );
            }

            // 3. Expenses Records
            if (reportType === 'ALL' || reportType === 'EXPENSE') {
                addSection(
                    "Miscellaneous Expenses", 
                    ['Date', 'Description', 'Qty', 'Rate', 'Total'], 
                    expenses.map(e => [e.date, e.name, e.quantity, e.rate, e.total.toLocaleString()]),
                    [245, 158, 11] // Orange
                );
            }

            // 4. Sales Records
            if (reportType === 'ALL' || reportType === 'SALES') {
                addSection(
                    "Sales Records", 
                    ['Date', 'Qty (Birds)', 'Weight (Kg)', 'Rate', 'Total'], 
                    sales.map(s => [s.date, s.quantity, s.weightKg, s.rate, s.total.toLocaleString()]),
                    [124, 58, 237] // Purple
                );
            }

            // 5. Mortality Analytics
            if (reportType === 'ALL' || reportType === 'MORTALITY') {
                addSection(
                    "Mortality / Death Log", 
                    ['Date', 'Count', 'Cause / Remarks'], 
                    mortality.map(m => [m.date, m.count, m.remarks || '-']),
                    [239, 68, 68] // Red
                );
            }

            // Save File using Blob for Mobile Compatibility
            const prefix = reportType === 'ALL' ? 'Full' : reportType.charAt(0) + reportType.slice(1).toLowerCase();
            const filename = `${prefix}_Report_${flock.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            
            const pdfBlob = doc.output('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

        } catch (e) {
            console.error(e);
            alert("Error generating PDF. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    }, 100);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="bg-blue-50 p-6 rounded-full mb-6 relative">
            <FileText size={48} className="text-blue-600" />
            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white">
                <CheckCircle size={16} />
            </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Export Flock Report</h2>
        <p className="text-gray-500 text-center max-w-md mb-8">
            Generate detailed PDF reports for your flocks. Choose a full comprehensive report or select specific data categories.
        </p>
        
        <div className="w-full max-w-xs space-y-4">
            {/* Flock Selection */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Select Flock</label>
                <div className="relative">
                    <select 
                        value={currentFlock} 
                        onChange={e => setCurrentFlock(e.target.value)}
                        className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-700 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10 cursor-pointer transition-all shadow-sm"
                    >
                        <option value="">-- Select Flock --</option>
                        {flocks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <ChevronDown size={20} />
                    </div>
                </div>
            </div>

            {/* Report Type Selection */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Report Type</label>
                <div className="relative">
                    <select 
                        value={reportType} 
                        onChange={e => setReportType(e.target.value as ReportType)}
                        className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-700 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10 cursor-pointer transition-all shadow-sm pl-10"
                    >
                        <option value="ALL">Full Comprehensive Report</option>
                        <option value="FEED">Feed Records Only</option>
                        <option value="MEDICINE">Medicine & Vaccines Only</option>
                        <option value="EXPENSE">Expenses Only</option>
                        <option value="SALES">Sales & Revenue Only</option>
                        <option value="MORTALITY">Mortality / Analytics Only</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-500">
                        <Filter size={18} />
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <ChevronDown size={20} />
                    </div>
                </div>
            </div>
            
            <button 
                onClick={generatePDF}
                disabled={!currentFlock || isGenerating}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 font-semibold mt-2"
            >
                {isGenerating ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                    <Download size={20} />
                )}
                {isGenerating ? 'Generating...' : `Download ${reportType === 'ALL' ? 'Full' : 'Selected'} Report`}
            </button>
        </div>
    </div>
  );
}