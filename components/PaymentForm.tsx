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
import { CheckCircle, ChevronLeft, Banknote,ChevronRight, CreditCard, DollarSign, Heart, Info, Lock, Send, Smartphone, User, Wallet } from "lucide-react";

// Predefined suggested donation amounts with descriptions
const SUGGESTED_AMOUNTS = [
  { value: 10, label: "Basic Support", description: "Help us cover basic operational costs" },
  { value: 50, label: "Friend", description: "Join our community of supporters" },
  { value: 100, label: "Supporter", description: "Make a meaningful contribution" },
  { value: 250, label: "Champion", description: "Help us reach our monthly goals" },
  { value: 500, label: "Advocate", description: "Enable sustainable program funding" },
  { value: 1000, label: "Visionary", description: "Fund major initiatives and growth" }
];

// Multi-step donation process with icons
const DONATION_STEPS = [
  { id: 'amount', title: 'Donation Amount', icon: DollarSign, description: 'Choose how much to donate' },
  { id: 'details', title: 'Personal Details', icon: User, description: 'Tell us about yourself' },
  { id: 'confirm', title: 'Confirm', icon: CheckCircle, description: 'Review and complete' }
];

// Payment animation states
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

// Page transition variants
const pageVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 }
};

interface DataFromForm {
  mpesa_phone: string;
  name: string;
  amount: string;
  email: string; // Added email field
  purpose: string; // Added purpose field
}

function PaymentForm() {
  // Enhanced form data
  const [dataFromForm, setDataFromForm] = useState<DataFromForm>({
    mpesa_phone: "",
    name: "",
    amount: "",
    email: "", // New field
    purpose: "general" // New field with default
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [stkQueryLoading, setStkQueryLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [donationPurposes] = useState([
    { id: "general", label: "General Support" },
    { id: "education", label: "Education Programs" },
    { id: "health", label: "Health Initiatives" },
    { id: "community", label: "Community Development" }
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
      
      // Clear feedback after 3 seconds
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

  // Original STK Push query function with enhanced timeout handling
  const stkPushQueryWithIntervals = (CheckoutRequestID: string) => {
    const timer = setInterval(async () => {
      reqcount += 1;
   
      if (reqcount === 15) {
        // Handle long payment
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
    }, 2000);
  };
 
  // Enhanced form submission handler
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
      setLoading(false);
      showFeedback("An unexpected error occurred. Please try again.", "error");
    }
  };

  // Get suggested amount description
  const getAmountDescription = (amount: number) => {
    const found = SUGGESTED_AMOUNTS.find(item => item.value === amount);
    return found ? found.description : "";
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
              <Card className="border-green-500 border shadow-md">
                <CardHeader className="bg-green-50">
                  <div className="flex items-center gap-2">
                    <Heart className="text-green-500 h-5 w-5" />
                    <CardTitle className="text-black">Choose Donation Amount</CardTitle>
                  </div>
                  <CardDescription className="text-gray-600">Select a preset amount or enter a custom value</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    {SUGGESTED_AMOUNTS.map(item => (
                      <motion.div
                        key={item.value}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <Button 
                          variant={parseFloat(dataFromForm.amount) === item.value ? 'default' : 'outline'}
                          onClick={() => setAmount(item.value)}
                          className={`w-full h-auto py-3 px-4 flex flex-col items-center justify-center gap-1 ${
                            parseFloat(dataFromForm.amount) === item.value 
                              ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' 
                              : 'text-black hover:border-green-500 hover:text-green-500'
                          }`}
                        >
                          <span className="font-bold">Ksh {item.value}</span>
                          <span className="text-xs">{item.label}</span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowCustomAmount(!showCustomAmount)}
                      className="text-green-600 hover:text-green-700 w-full mb-2 font-medium"
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
                            <Label className="text-gray-700">Custom Amount (Ksh)</Label>
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
                  </div>
                  
                  {dataFromForm.amount && (
                    <motion.div 
                      className="bg-green-50 p-3 rounded-lg border border-green-100"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-start gap-2">
                        <Info className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-700 font-medium">
                            {parseFloat(dataFromForm.amount) >= 100 
                              ? "Thank you for your generous donation!" 
                              : "Thank you for your support!"}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {getAmountDescription(parseFloat(dataFromForm.amount)) || 
                             "Your contribution helps us make a difference"}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="pt-2">
                    <Label className="text-gray-700 mb-2 block">Donation Purpose</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {donationPurposes.map(purpose => (
                        <Button
                          key={purpose.id}
                          type="button"
                          variant={dataFromForm.purpose === purpose.id ? 'default' : 'outline'}
                          className={`${
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
              <Card className="border-green-500 border shadow-md">
                <CardHeader className="bg-green-50">
                  <div className="flex items-center gap-2">
                    <User className="text-green-500 h-5 w-5" />
                    <CardTitle className="text-black">Your Information</CardTitle>
                  </div>
                  <CardDescription className="text-gray-600">Please provide your details for the donation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Full Name</Label>
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
                    <Label className="text-gray-700">M-Pesa Number</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input 
                        value={dataFromForm.mpesa_phone}
                        onChange={(e) => setDataFromForm({
                          ...dataFromForm,
                          mpesa_phone: e.target.value
                        })}
                        placeholder="Enter your M-Pesa number"
                        className="pl-10 border-gray-300 text-black"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Format: 07XXXXXXXX, 01XXXXXXXX, or 254XXXXXXXXX
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-700">Email Address <span className="text-gray-400">(Optional)</span></Label>
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
                      <p className="text-xs text-gray-500 mt-1">We will send your donation receipt to this email</p>
                    </div>
                  </div>
                  
                  <motion.div 
                    className="bg-green-50 p-3 rounded-lg border border-green-100 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex items-start gap-2">
                      <Lock className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-700 font-medium">Secure Payment Processing</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Your information is encrypted and processed securely through M-Pesa
                        </p>
                      </div>
                    </div>
                  </motion.div>
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
              <Card className="border-green-500 border shadow-md">
                <CardHeader className="bg-green-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-500 h-5 w-5" />
                    <CardTitle className="text-black">Confirm Your Donation</CardTitle>
                  </div>
                  <CardDescription className="text-gray-600">Review your donation details before proceeding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 font-medium">Donation Amount</span>
                        <span className="text-lg font-bold text-green-600">Ksh {parseFloat(dataFromForm.amount).toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Purpose: {donationPurposes.find(p => p.id === dataFromForm.purpose)?.label || 'General Support'}
                      </div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600">Name</span>
                        </div>
                        <span className="font-medium text-black">{dataFromForm.name}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600">M-Pesa Number</span>
                        </div>
                        <span className="font-medium text-black">{dataFromForm.mpesa_phone}</span>
                      </div>
                      
                      {dataFromForm.email && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-green-500" />
                            <span className="text-gray-600">Email</span>
                          </div>
                          <span className="font-medium text-black">{dataFromForm.email}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600">Payment Method</span>
                        </div>
                        <span className="font-medium text-black">M-Pesa</span>
                      </div>
                    </div>
                  </div>
                  
                  <motion.div 
                    className="bg-orange-50 p-3 rounded-lg border border-orange-200 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-700 font-medium">What happens next?</p>
                        <p className="text-xs text-gray-600 mt-1">
                          You will receive an M-Pesa prompt on your phone. Enter your PIN to complete the donation.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        );
    }
  };

  // Custom StepIndicator component
  const StepIndicator = ({ step, index }) => {
    const isActive = index === currentStep;
    const isCompleted = index < currentStep;
    
    return (
      <div 
        className={`
          flex flex-col items-center 
          ${isActive 
            ? 'text-green-500' 
            : isCompleted 
              ? 'text-green-600' 
              : 'text-gray-400'}
        `}
      >
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
          <span className="text-xs font-medium mt-1 hidden md:block">{step.title}</span>
        </div>
        
        {index < DONATION_STEPS.length - 1 && (
          <div 
            className={`
              h-0.5 w-10 mt-4 hidden md:block
              ${index < currentStep
                ? 'bg-green-500'
                : 'bg-gray-300'}
            `}
          />
        )}
      </div>
    );
  };

  return (
    <>
      {stkQueryLoading ? (
        <STKPushQueryLoading number={dataFromForm.mpesa_phone} />
      ) : success ? (
        <PaymentSuccess />
      ) : (
        <div className="max-w-md mx-auto">
          <motion.div 
            className="bg-white rounded-lg shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <Heart className="text-green-500 h-6 w-6" fill="#10b981" />
                <h2 className="text-xl font-bold text-black">Support Our Cause</h2>
              </div>

              {/* Progress Indicator */}
              <div className="flex justify-between mb-6 relative">
                {DONATION_STEPS.map((step, index) => (
                  <React.Fragment key={step.id}>
                    <StepIndicator step={step} index={index} />
                    {index < DONATION_STEPS.length - 1 && (
                      <div className="flex-1 h-0.5 bg-gray-200 self-center mt-4 md:hidden">
                        <div 
                          className="h-full bg-green-500" 
                          style={{ 
                            width: index < currentStep ? '100%' : '0%',
                            transition: 'width 0.5s ease-in-out' 
                          }} 
                        />
                      </div>
                    )}
                  </React.Fragment>
                ))}
                <div className="absolute h-0.5 bg-gray-200 top-4 left-4 right-4 -z-10 hidden md:block">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ 
                      width: `${(currentStep / (DONATION_STEPS.length - 1)) * 100}%`,
                      transition: 'width 0.5s ease-in-out' 
                    }} 
                  />
                </div>
              </div>

              {/* Step Content */}
              <div className="mt-4">
                {renderStepContent()}
              </div>

              {/* Feedback Message */}
              <AnimatePresence>
                {feedback.message && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`mt-4 p-3 rounded-md text-sm ${
                      feedback.type === 'error' 
                        ? 'bg-red-50 text-red-600 border border-red-100' 
                        : 'bg-green-50 text-green-600 border border-green-100'
                    }`}
                  >
                    {feedback.message}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                {currentStep > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={goToPreviousStep}
                    className="text-black border-gray-300 hover:bg-gray-50 hover:text-green-600"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back
                  </Button>
                )}
                
                <div className="flex-1" />
                
                {currentStep < DONATION_STEPS.length - 1 ? (
                  <Button 
                    onClick={goToNextStep}
                    disabled={!isStepValid()}
                    className="bg-green-500 hover:bg-green-600 text-white font-medium"
                  >
                    Continue
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    disabled={loading || !isStepValid()}
                    className="bg-green-500 hover:bg-green-600 text-white font-medium"
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
                        Complete Donation
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center">
                <div className="flex items-center text-xs text-gray-500">
                  <Lock className="h-3 w-3 mr-1" />
                  Secure payment processing via M-Pesa
                </div>
              </div>
            </div>
            </motion.div>
          
          {/* Trust Signals */}
          <motion.div 
            className="mt-4 bg-white rounded-lg p-4 shadow-md border border-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center justify-center">
                <Lock className="h-5 w-5 text-green-500 mb-1" />
                <span className="text-xs text-gray-600">Secure</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <Shield className="h-5 w-5 text-green-500 mb-1" />
                <span className="text-xs text-gray-600">Protected</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500 mb-1" />
                <span className="text-xs text-gray-600">Verified</span>
              </div>
            </div>
          </motion.div>
          
          {/* Donation Impact */}
          {dataFromForm.amount && parseFloat(dataFromForm.amount) > 0 && currentStep === 2 && (
            <motion.div 
              className="mt-4 bg-orange-50 rounded-lg p-4 shadow-sm border border-orange-100"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-sm font-medium text-black mb-2">Your Impact</h3>
              <p className="text-xs text-gray-600">
                {parseFloat(dataFromForm.amount) < 100 && "Your donation will help cover essential operational costs."}
                {parseFloat(dataFromForm.amount) >= 100 && parseFloat(dataFromForm.amount) < 500 && "Your donation will directly support our programs to create lasting change."}
                {parseFloat(dataFromForm.amount) >= 500 && "Your generous contribution will enable us to expand our reach and help more people in need."}
              </p>
            </motion.div>
          )}
        </div>
      )}
    </>
  );
}

// Missing icon imports
const Mail = ({ className }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="16" x="2" y="4" rx="2"></rect>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
    </svg>
  );
};

const Shield = ({ className }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  );
};

const Loader = ({ className }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
    </svg>
  );
};

export default PaymentForm;