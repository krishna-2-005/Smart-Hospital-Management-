'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Pill, AlertCircle, PrinterIcon } from 'lucide-react';

interface Discharge {
  id: number;
  admissionId: number;
  patientName: string;
  admissionDate: string;
  dischargeDate?: string;
  status: string;
  reason?: string;
  principalDiagnosis: string;
  procedures: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  followUpInstructions?: string;
  doctorName: string;
}

export default function PatientDischargePage() {
  const [discharges, setDischarges] = useState<Discharge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDischarge, setSelectedDischarge] = useState<Discharge | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDischarges = async () => {
      try {
        const res = await fetch('/api/discharge', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setDischarges(data.discharges || []);
        }
      } catch (error) {
        console.error('Error fetching discharges:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDischarges();
  }, []);

  const handlePrint = () => {
    if (!selectedDischarge) return;

    const printContent = `
      <html>
        <head>
          <title>Discharge Summary</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; font-size: 14px; margin-bottom: 10px; background: #f5f5f5; padding: 5px; }
            .medication { margin-left: 20px; margin-bottom: 10px; }
            .instruction { margin-left: 20px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Hospital Discharge Summary</h1>
            <p>This is an official discharge document</p>
          </div>
          
          <div class="section">
            <div class="section-title">Patient Information</div>
            <p><strong>Name:</strong> ${selectedDischarge.patientName}</p>
            <p><strong>Admission Date:</strong> ${new Date(selectedDischarge.admissionDate).toLocaleDateString()}</p>
            <p><strong>Discharge Date:</strong> ${
              selectedDischarge.dischargeDate
                ? new Date(selectedDischarge.dischargeDate).toLocaleDateString()
                : 'Pending'
            }</p>
            <p><strong>Attending Physician:</strong> ${selectedDischarge.doctorName}</p>
          </div>

          <div class="section">
            <div class="section-title">Clinical Summary</div>
            <p><strong>Principal Diagnosis:</strong> ${selectedDischarge.principalDiagnosis}</p>
            <p><strong>Discharge Reason:</strong> ${selectedDischarge.reason || 'N/A'}</p>
          </div>

          ${
            selectedDischarge.procedures.length > 0
              ? `
          <div class="section">
            <div class="section-title">Procedures & Treatments</div>
            ${selectedDischarge.procedures.map(p => `<div class="instruction">• ${p}</div>`).join('')}
          </div>
            `
              : ''
          }

          ${
            selectedDischarge.medications.length > 0
              ? `
          <div class="section">
            <div class="section-title">Discharge Medications</div>
            ${selectedDischarge.medications
              .map(
                m => `
              <div class="medication">
                <strong>${m.name}</strong> - ${m.dosage}<br/>
                <small>${m.frequency} for ${m.duration}</small>
              </div>
            `
              )
              .join('')}
          </div>
            `
              : ''
          }

          ${
            selectedDischarge.followUpInstructions
              ? `
          <div class="section">
            <div class="section-title">Follow-up Instructions</div>
            <div class="instruction">${selectedDischarge.followUpInstructions.replace(/\n/g, '<br/>')}</div>
          </div>
            `
              : ''
          }

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666;">
            <p>This document is generated on ${new Date().toLocaleDateString()}</p>
            <p>Please follow all post-discharge care instructions and schedule follow-up appointments as recommended.</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  const completedDischarges = discharges.filter(d => d.status === 'completed');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Discharge Records</h1>
            <p className="text-xs text-muted-foreground">View your hospital discharge documents</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {isLoading ? (
          <Card className="border-secondary/20">
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading discharge records...
            </CardContent>
          </Card>
        ) : completedDischarges.length === 0 ? (
          <Card className="border-secondary/20">
            <CardContent className="py-12 text-center">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No discharge records available</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {completedDischarges.map((discharge) => (
              <Card
                key={discharge.id}
                className="border-secondary/20 cursor-pointer hover:border-secondary/40 transition-all"
                onClick={() => setSelectedDischarge(discharge)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Discharge Summary
                      </CardTitle>
                      <CardDescription>
                        {discharge.principalDiagnosis}
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">ADMITTED</p>
                      <p className="font-medium">
                        {new Date(discharge.admissionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">DISCHARGED</p>
                      <p className="font-medium">
                        {discharge.dischargeDate
                          ? new Date(discharge.dischargeDate).toLocaleDateString()
                          : 'Pending'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">PHYSICIAN</p>
                      <p className="font-medium">{discharge.doctorName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">LENGTH OF STAY</p>
                      <p className="font-medium">
                        {Math.ceil(
                          (new Date(discharge.dischargeDate || new Date()).getTime() -
                            new Date(discharge.admissionDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{' '}
                        days
                      </p>
                    </div>
                  </div>

                  {discharge.medications.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                        <Pill className="w-4 h-4" />
                        {discharge.medications.length} Discharge Medications
                      </p>
                    </div>
                  )}

                  {discharge.followUpInstructions && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <p className="text-sm font-medium text-amber-900 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Follow-up Care Instructions Provided
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {selectedDischarge && (
          <Card className="border-secondary/20 bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Discharge Summary Details</CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    size="sm"
                  >
                    <PrinterIcon className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    onClick={() => setSelectedDischarge(null)}
                    variant="ghost"
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Clinical Summary */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Clinical Summary</h3>
                <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/20 space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">PRINCIPAL DIAGNOSIS</p>
                    <p className="text-foreground">{selectedDischarge.principalDiagnosis}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">DISCHARGE REASON</p>
                    <p className="text-foreground">{selectedDischarge.reason || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">ATTENDING PHYSICIAN</p>
                    <p className="text-foreground">{selectedDischarge.doctorName}</p>
                  </div>
                </div>
              </div>

              {/* Procedures */}
              {selectedDischarge.procedures.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Procedures & Treatments</h3>
                  <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/20 space-y-2">
                    {selectedDischarge.procedures.map((proc, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{proc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications */}
              {selectedDischarge.medications.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    Discharge Medications
                  </h3>
                  <div className="space-y-2">
                    {selectedDischarge.medications.map((med, idx) => (
                      <div key={idx} className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="font-medium text-green-900">{med.name}</p>
                        <div className="text-sm text-green-800 mt-1 space-y-1">
                          <p>
                            <strong>Dosage:</strong> {med.dosage}
                          </p>
                          <p>
                            <strong>Frequency:</strong> {med.frequency}
                          </p>
                          <p>
                            <strong>Duration:</strong> {med.duration}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Instructions */}
              {selectedDischarge.followUpInstructions && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Follow-up Care Instructions
                  </h3>
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="whitespace-pre-wrap text-sm text-amber-900">
                      {selectedDischarge.followUpInstructions}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
