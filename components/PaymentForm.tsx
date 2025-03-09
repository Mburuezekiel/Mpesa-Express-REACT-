"use client";
import React, { useState, useEffect } from "react";
import { sendStkPush } from "@/actions/stkPush";
import { stkPushQuery } from "@/actions/stkPushQuery";
import PaymentSuccess from "./Success";
import STKPushQueryLoading from "./StkQueryLoading";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  ChevronLeft, 
  Banknote,
  ChevronRight, 
  CreditCard, 
  DollarSign, 
  Heart, 
  Info, 
  Lock, 
  Send, 
  Smartphone, 
  User, 
  Wallet 
} from "lucide-react";

// Define step interface
interface Step {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
}

// Predefined suggested donation amounts with descriptions
const SUGGESTED_AMOUNTS = [
  { value: 10, label: "Basic", description: "Help us cover basic operational costs" },
  { value: 50, label: "Friend", description: "Join our community of supporters" },
  { value: 100, label: "Supporter", description: "Make a meaningful contribution" },
  { value: 250, label: "Champion", description: "Help us reach our monthly goals" },
  { value: 500, label: "Advocate", description: "Enable sustainable program funding" },
  { value: 1000, label: "Visionary", description: "Fund major initiatives and growth" }
];

// Multi-step donation process with icons
const DONATION_STEPS: Step[] = [
  { id: 'amount', title: 'Amount', icon: DollarSign, description: 'Choose amount' },
  { id: 'details', title: 'Details', icon: User, description: 'Your info' },
  { id: 'confirm', title: 'Confirm', icon: CheckCircle, description: 'Review' }
];

// Animation variants
const pageVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

const loadingVariants = {
  animate: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 1,
      ease: "linear"
    }
  }
};

interface DataFromForm {
  mpesa_phone: string;
  name: string;
  amount: string;
  email: string;
  purpose: string;
}

interface StepIndicatorProps {
  step: Step;
  index: number;
  currentStep: number;
}

function PaymentForm() {
  const [dataFromForm, setDataFromForm] = useState<DataFromForm>({
    mpesa_phone: "",
    name: "",
    amount: "",
    email: "",
    purpose: "general"
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [stkQueryLoading, setStkQueryLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [donationPurposes] = useState([
    { id: "general", label: "General" },
    { id: "education", label: "Education" },
    { id: "health", label: "Health" },
    { id: "community", label: "Community" }
  ]);
  
  // Feedback state
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  
  // Counter for STK push query
  var reqcount = 0;
  
  // Animation trigger for amount selection
  const [animateAmount, setAnimateAmount] = useState(false);
  
  useEffect(() => {
    if (animateAmount) {
      const timer = setTimeout(() => setAnimateAmount(false), 500);
      return () => clearTimeout(timer);
    }
  }, [animateAmount]);
  
  // Validation function for steps
  const isStepValid = () => {
    switch(DONATION_STEPS[currentStep].id) {
      case 'amount':
        return dataFromForm.amount !== "" && parseFloat(dataFromForm.amount) > 0;
      case 'details':
        // Basic validation for phone numbers
        const kenyanPhoneNumberRegex = /^(07\d{8}|01\d{8}|2547\d{8}|2541\d{8}|\+2547\d{8}|\+2541\d{8})$/;
        return (
          dataFromForm.name.trim() !== '' && 
          kenyanPhoneNumberRegex.test(dataFromForm.mpesa_phone.trim())
        );
      default:
        return true;
    }
  };

  // Navigation handlers
  const goToNextStep = () => {
    if (isStepValid() && currentStep < DONATION_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else if (!isStepValid()) {
      setFeedback({
        message: "Please complete all required fields correctly",
        type: "error"
      });
      
      setTimeout(() => setFeedback({ message: "", type: "" }), 3000);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  // Set amount helper with animation
  const setAmount = (amount: number) => {
    setDataFromForm({
      ...dataFromForm,
      amount: amount.toString()
    });
    setAnimateAmount(true);
    setShowCustomAmount(false);
  };

  // Custom feedback function
  const showFeedback = (message: string, type: 'error' | 'success' = 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: "", type: "" }), 5000);
  };

  // STK Push query function with enhanced timeout handling
  const stkPushQueryWithIntervals = (CheckoutRequestID: string) => {
    const timer = setInterval(async () => {
      reqcount += 1;
   
      if (reqcount === 15) {
        clearInterval(timer);
        setStkQueryLoading(false);
        setLoading(false);
        showFeedback("The payment request has timed out. Please try again.", "error");
      }
   
      const { data, error } = await stkPushQuery(CheckoutRequestID);
   
      if (error) {
        if (error.response.data.errorCode !== "500.001.1001") {
          clearInterval(timer);
          setStkQueryLoading(false);
          setLoading(false);
          showFeedback(error?.response?.data?.errorMessage || "Payment processing failed", "error");
        }
      }
   
      if (data) {
        if (data.ResultCode === "0") {
          clearInterval(timer);
          setStkQueryLoading(false);
          setLoading(false);
          setSuccess(true);
        } else {
          clearInterval(timer);
          setStkQueryLoading(false);
          setLoading(false);
          showFeedback(data?.ResultDesc || "Payment processing failed", "error");
        }
      }
    }, 10000);
  };
 
  // Form submission handler
  const handleSubmit = async () => {
    setLoading(true);

    // Convert amount to number for the API call
    const amount = parseFloat(dataFromForm.amount);
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      setLoading(false);
      return showFeedback("Please enter a valid donation amount", "error");
    }

    const formData = {
      mpesa_number: dataFromForm.mpesa_phone.trim(),
      name: dataFromForm.name.trim(),
      amount: amount,
      email: dataFromForm.email.trim(),
      purpose: dataFromForm.purpose
    };

    // Validate phone number
    const kenyanPhoneNumberRegex = /^(07\d{8}|01\d{8}|2547\d{8}|2541\d{8}|\+2547\d{8}|\+2541\d{8})$/;

    if (!kenyanPhoneNumberRegex.test(formData.mpesa_number)) {
      setLoading(false);
      return showFeedback("Please enter a valid M-Pesa number", "error");
    }

    try {
      const { data: stkData, error: stkError } = await sendStkPush(formData);

      if (stkError) {
        setLoading(false);
        return showFeedback(stkError, "error");
      }

      const checkoutRequestId = stkData.CheckoutRequestID;

      setStkQueryLoading(true);
      stkPushQueryWithIntervals(checkoutRequestId);
    } catch (err) {
      console.error("Detailed error:", err); 
      setLoading(false);
      showFeedback("An unexpected error occurred. Please try again.", "error");
    }
  };

  // Get suggested amount description
  const getAmountDescription = (amount: number) => {
    const found = SUGGESTED_AMOUNTS.find(item => item.value === amount);
    return found ? found.description : "";
  };

  // Step Indicator Component - Simplified for better responsiveness
  const StepIndicator = ({ step, index, currentStep }: StepIndicatorProps) => {
    const isActive = index === currentStep;
    const isCompleted = index < currentStep;

    return (
      <div className="flex flex-col items-center">
        <div 
          className={`
            w-8 h-8 flex items-center justify-center rounded-full border-2
            ${isActive 
              ? 'border-green-500 bg-green-50'
              : isCompleted
                ? 'border-green-500 bg-green-500 text-white'
                : 'border-gray-300 bg-gray-50'
            }
          `}
        >
          {isCompleted ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <span className="text-sm font-medium">{index + 1}</span>
          )}
        </div>
        <span className="text-xs font-medium mt-1 hidden sm:block">{step.title}</span>
      </div>
    );
  };

  // Render step content dynamically with animations
  const renderStepContent = () => {
    switch(DONATION_STEPS[currentStep].id) {
      case 'amount':
        return (
          <AnimatePresence mode="wait">
            <motion.div
              key="amount-step"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={pageVariants}
            >
              <Card className="border-green-500 border shadow-sm">
                <CardHeader className="bg-green-50 px-4 py-3 sm:px-6">
                  <div className="flex items-center gap-2">
                    <Heart className="text-green-500 h-4 w-4 sm:h-5 sm:w-5" />
                    <CardTitle className="text-black text-lg">Choose Amount</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-3 sm:p-4">
                  {/* Grid for larger screens, single column for mobile */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SUGGESTED_AMOUNTS.map(item => (
                      <motion.div
                        key={item.value}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          variant={parseFloat(dataFromForm.amount) === item.value ? 'default' : 'outline'}
                          onClick={() => setAmount(item.value)}
                          className={`w-full h-auto py-2 px-2 flex flex-col items-center justify-center gap-1 text-sm ${
                            parseFloat(dataFromForm.amount) === item.value 
                              ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' 
                              : 'text-black hover:border-green-500 hover:text-green-500'
                          }`}
                        >
                          <span className="font-bold">Ksh {item.value}</span>
                          <span className="text-xs hidden sm:inline">{item.label}</span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowCustomAmount(!showCustomAmount)}
                    className="text-green-600 hover:text-green-700 w-full text-sm font-medium py-1"
                  >
                    {showCustomAmount ? "Hide Custom Amount" : "Enter Custom Amount"}
                  </Button>
                  
                  <AnimatePresence>
                    {showCustomAmount && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="relative">
                          <Label className="text-gray-700 text-sm">Custom Amount (Ksh)</Label>
                          <div className="relative mt-1">
                            <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input 
                              type="number" 
                              placeholder="Enter amount" 
                              value={dataFromForm.amount} 
                              onChange={(e) => setDataFromForm({
                                ...dataFromForm,
                                amount: e.target.value
                              })}
                              className="pl-10 border-gray-300 text-black"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="pt-1">
                    <Label className="text-gray-700 text-sm mb-2 block">Donation Purpose</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {donationPurposes.map(purpose => (
                        <Button
                          key={purpose.id}
                          type="button"
                          variant={dataFromForm.purpose === purpose.id ? 'default' : 'outline'}
                          className={`py-1 text-sm ${
                            dataFromForm.purpose === purpose.id
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : 'text-black hover:border-green-500 hover:text-green-500'
                          }`}
                          onClick={() => setDataFromForm({
                            ...dataFromForm,
                            purpose: purpose.id
                          })}
                        >
                          {purpose.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        );

      case 'details':
        return (
          <AnimatePresence mode="wait">
            <motion.div
              key="details-step"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={pageVariants}
            >
              <Card className="border-green-500 border shadow-sm">
                <CardHeader className="bg-green-50 px-4 py-3 sm:px-6">
                  <div className="flex items-center gap-2">
                    <User className="text-green-500 h-4 w-4 sm:h-5 sm:w-5" />
                    <CardTitle className="text-black text-lg">Your Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-3 sm:p-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 text-sm">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input 
                        value={dataFromForm.name}
                        onChange={(e) => setDataFromForm({
                          ...dataFromForm,
                          name: e.target.value
                        })}
                        placeholder="Enter your full name"
                        className="pl-10 border-gray-300 text-black"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-700 text-sm">M-Pesa Number</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input 
                        value={dataFromForm.mpesa_phone}
                        onChange={(e) => setDataFromForm({
                          ...dataFromForm,
                          mpesa_phone: e.target.value
                        })}
                        placeholder="e.g. 07XXXXXXXX"
                        className="pl-10 border-gray-300 text-black"
                      />
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Format: 07XXXXXXXX or 254XXXXXXXXX
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-700 text-sm">Email <span className="text-gray-400">(Optional)</span></Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input 
                        value={dataFromForm.email}
                        onChange={(e) => setDataFromForm({
                          ...dataFromForm,
                          email: e.target.value
                        })}
                        placeholder="Enter your email"
                        className="pl-10 border-gray-300 text-black"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center text-xs text-gray-500 mt-2">
                    <Lock className="h-3 w-3 mr-1" />
                    Your information is securely processed
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        );

      case 'confirm':
        return (
          <AnimatePresence mode="wait">
            <motion.div
              key="confirm-step"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={pageVariants}
            >
              <Card className="border-green-500 border shadow-sm">
                <CardHeader className="bg-green-50 px-4 py-3 sm:px-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-500 h-4 w-4 sm:h-5 sm:w-5" />
                    <CardTitle className="text-black text-lg">Confirm Donation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-3 sm:p-4">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium text-sm">Amount</span>
                      <span className="font-bold text-green-600">Ksh {parseFloat(dataFromForm.amount).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Purpose: {donationPurposes.find(p => p.id === dataFromForm.purpose)?.label || 'General Support'}
                    </div>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600">Name</span>
                      </div>
                      <span className="font-medium text-black">{dataFromForm.name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Smartphone className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600">Phone</span>
                      </div>
                      <span className="font-medium text-black">{dataFromForm.mpesa_phone}</span>
                    </div>
                    
                    {dataFromForm.email && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600">Email</span>
                        </div>
                        <span className="font-medium text-black truncate max-w-32 sm:max-w-48">{dataFromForm.email}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mt-1">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600">
                        You'll receive an M-Pesa prompt. Enter your PIN to complete the donation.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        );
    }
  };

  return (
    <>
      {stkQueryLoading ? (
        <STKPushQueryLoading number={dataFromForm.mpesa_phone} />
      ) : success ? (
        <PaymentSuccess />
      ) : (
        <div className="w-full max-w-md mx-auto px-4">
          <motion.div 
            className="bg-white rounded-lg shadow overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header - Simplified */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <Heart className="text-green-500 h-5 w-5" fill="#10b981" />
                <h2 className="text-lg font-bold text-black">Support Our Cause</h2>
              </div>
            </div>

            {/* Progress Indicator - More compact */}
            <div className="pt-4 px-4">
              <div className="flex justify-between relative">
                {DONATION_STEPS.map((step, index) => (
                  <React.Fragment key={step.id}>
                    <StepIndicator step={step} index={index} currentStep={currentStep} />
                  </React.Fragment>
                ))}
                {/* Progress bar */}
                <div className="absolute h-0.5 bg-gray-200 top-4 left-4 right-4 -z-10">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ 
                      width: `${(currentStep / (DONATION_STEPS.length - 1)) * 100}%`,
                      transition: 'width 0.5s ease-in-out' 
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="p-4">
              {renderStepContent()}
            </div>

            {/* Feedback Message */}
            <AnimatePresence>
              {feedback.message && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className={`mx-4 mb-4 p-2 rounded-md text-sm ${
                    feedback.type === 'error' 
                      ? 'bg-red-50 text-red-600 border border-red-100' 
                      : 'bg-green-50 text-green-600 border border-green-100'
                  }`}
                >
                  {feedback.message}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons - Made more compact */}
            <div className="flex justify-between p-4 border-t bg-gray-50">
              {currentStep > 0 ? (
                <Button 
                  variant="outline" 
                  onClick={goToPreviousStep}
                  className="text-black border-gray-300 hover:bg-gray-50 hover:text-green-600"
                  size="sm"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div></div> // Empty div for spacing
              )}
              
              {currentStep < DONATION_STEPS.length - 1 ? (
                <Button 
                  onClick={goToNextStep}
                  disabled={!isStepValid()}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  size="sm"
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={loading || !isStepValid()}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  size="sm"
                >
                  {loading ? (
                    <>
                      <motion.div
                        variants={loadingVariants}
                        animate="animate"
                        className="mr-2"
                      >
                        <Loader className="h-4 w-4" />
                      </motion.div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Complete
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Security Badge - Made more compact */}
            <div className="text-center py-2 px-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-center text-xs text-gray-500">
                <Lock className="h-3 w-3 mr-1" />
                Secure payment via M-Pesa
              </div>
            </div>
          </motion.div>
          
          {/* Trust Signals - Simplified */}
          <motion.div 
            className="mt-3 bg-white rounded-lg p-3 shadow-sm border border-gray-200 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex gap-6 text-center">
              <div className="flex flex-col items-center">
                <Lock className="h-4 w-4 text-green-500 mb-1" />
                <span className="text-xs text-gray-600">Secure</span>
              </div>
              <div className="flex flex-col items-center">
                <Shield className="h-4 w-4 text-green-500 mb-1" />
                <span className="text-xs text-gray-600">Protected</span>
              </div>
              <div className="flex flex-col items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mb-1" />
                <span className="text-xs text-gray-600">Verified</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

// Utility icons that were missing
const Mail = ({ className }: { className?: string }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="16" x="2" y="4" rx="2"></rect>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
    </svg>
  );
};

const Shield = ({ className }: { className?: string }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  );
};

const Loader = ({ className }: { className?: string }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
    </svg>
  );
};

export default function Payment() {
  return (
    <div className="container mx-auto py-6">
      <PaymentForm />
    </div>
  );
}