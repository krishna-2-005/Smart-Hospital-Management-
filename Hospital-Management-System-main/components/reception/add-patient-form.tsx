'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, AlertCircle, CheckCircle, Copy, Printer } from 'lucide-react';
import { toast } from 'sonner';

export function AddPatientForm() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedPatient, setGeneratedPatient] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    age: '',
    gender: '',
    address: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.age || !formData.gender || !formData.address) {
      setError('Please fill in all required fields (name, age, gender, mobile, and address)');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/reception/add-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate patient code');
        return;
      }

      setSuccess(true);
      setGeneratedPatient(data.patient);
      toast.success(`Patient code generated for ${formData.firstName} ${formData.lastName}!`);
    } catch (err) {
      console.error('Error adding patient:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedPatient?.patientId) {
      navigator.clipboard.writeText(generatedPatient.patientId);
      toast.success('Patient ID copied to clipboard!');
    }
  };

  const handlePrint = () => {
    if (generatedPatient) {
      const printWindow = window.open('', '', 'height=400,width=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Patient Registration Card</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
                .card { border: 2px solid #000; padding: 40px; max-width: 400px; margin: 0 auto; }
                .title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
                .label { font-size: 12px; color: #666; margin-top: 20px; }
                .value { font-size: 18px; font-weight: bold; margin: 10px 0; }
                .patient-id { 
                  font-size: 32px; 
                  font-weight: bold; 
                  letter-spacing: 2px; 
                  margin: 30px 0;
                  font-family: 'Courier New', monospace;
                  border: 2px solid #333;
                  padding: 20px;
                  background: #f5f5f5;
                }
                .instructions { font-size: 12px; margin-top: 30px; text-align: left; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="title">Hospital Patient Registration</div>
                <div class="label">Patient Name</div>
                <div class="value">${generatedPatient.firstName} ${generatedPatient.lastName}</div>
                <div class="label">Patient ID</div>
                <div class="patient-id">${generatedPatient.patientId}</div>
                <div class="instructions">
                  <strong>Instructions:</strong>
                  <p>1. Keep this ID safe</p>
                  <p>2. Use this ID to login on patient portal</p>
                  <p>3. Set your password on first login</p>
                  <p>4. Access all patient services</p>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleReset = () => {
    setFormData({ firstName: '', lastName: '', phone: '', email: '', age: '', gender: '', address: '' });
    setSuccess(false);
    setGeneratedPatient(null);
    setError('');
  };

  const handleClose = () => {
    handleReset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <UserPlus className="w-4 h-4 mr-2" />
          Add New Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[96vw] max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Patient ID</DialogTitle>
          <DialogDescription>Register first-visit patient and generate unique login ID</DialogDescription>
        </DialogHeader>

        {success && generatedPatient ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-green-700">ID Generated!</h3>
            </div>

            <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Patient Name</p>
                  <p className="text-lg font-semibold">
                    {generatedPatient.firstName} {generatedPatient.lastName}
                  </p>
                </div>

                <div className="my-6 p-4 bg-white rounded-lg border-2 border-dashed border-primary">
                  <p className="text-xs text-muted-foreground text-center mb-2">Patient ID</p>
                  <p className="text-3xl font-mono font-bold text-center text-primary tracking-wider">
                    {generatedPatient.patientId}
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy ID
                  </Button>
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="w-full"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Card
                  </Button>
                </div>

                <Alert className="mt-4 bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-700 ml-2">
                    Give this ID to the patient. They will use it to login and set their password.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                Generate Another
              </Button>
              <Button
                onClick={handleClose}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                  required
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Mobile Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="9876543210"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="patient@example.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min="1"
                  max="130"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="34"
                  required
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Street, City"
                required
              />
            </div>

            <div className="flex gap-3 pt-2 md:justify-end">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 md:flex-none md:min-w-56"
              >
                {isLoading ? 'Generating ID...' : 'Generate Patient ID'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
