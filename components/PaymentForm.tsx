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
  DollarSign, 
  Heart, 
  Info, 
  Mail,
  Lock, 
  Send, 
  Smartphone, 
  User, 
  Wallet 
} from "lucide-react";

// Constants
const PLATFORM_FEE_PERCENTAGE = 20;
const DONATION_STEPS = [
  { id: 'amount', title: 'Amount', icon: DollarSign, description: 'Choose amount' },
  { id: 'details', title: 'Details', icon: User, description: 'Your info' },
  { id: 'confirm', title: 'Confirm', icon: CheckCircle, description: 'Review' }
];

const SUGGESTED_AMOUNTS = [
  { value: 10, label: "Basic", description: "Help us cover basic operational costs" },
  { value: 50, label: "Friend", description: "Join our community of supporters" },
  { value: 100, label: "Supporter", description: "Make a meaningful contribution" },
  { value: 250, label: "Champion", description: "Help us reach our monthly goals" },
  { value: 500, label: "Advocate", description: "Enable sustainable program funding" },
  { value: 1000, label: "Visionary", description: "Fund major initiatives and growth" }
];

const DONATION_PURPOSES = [
  { id: "general", label: "General" },
  { id: "education", label: "Education" },
  { id: "health", label: "Health" },
  { id: "community", label: "Community" }
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

function PaymentForm() {
  // State
  const [formData, setFormData] = useState({
    mpesa_phone: "",
    name: "",
    amount: "",
    email: "",
    purpose: "general"
  });
  
  const [currentStep, setCurrentStep] = useState(0);
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [feeOption, setFeeOption] = useState("donor_pays"); // "donor_pays" or "deduct_from_donation"
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stkQueryLoading, setStkQueryLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [animateAmount, setAnimateAmount] = useState(false);
  
  // Derived state
  const baseAmount = parseFloat(formData.amount) || 0;
  const platformFee = (baseAmount * PLATFORM_FEE_PERCENTAGE) / 100;
  const totalWithFee = baseAmount + platformFee;
  const donationAfterFeeDeduction = baseAmount - platformFee;
  
  // Final amount to be charged
  const finalAmount = feeOption === "donor_pays" ? totalWithFee : baseAmount;
  // Final donation amount that goes to cause
  const finalDonationAmount = feeOption === "donor_pays" ? baseAmount : donationAfterFeeDeduction;
  
  // Counter for STK push query
  let reqcount = 0;
  
  useEffect(() => {
    if (animateAmount) {
      const timer = setTimeout(() => setAnimateAmount(false), 500);
      return () => clearTimeout(timer);
    }
  }, [animateAmount]);
  
  // Validate current step
  const isStepValid = () => {
    switch(DONATION_STEPS[currentStep].id) {
      case 'amount':
        return baseAmount > 0;
      case 'details':
        const kenyanPhoneNumberRegex = /^(07\d{8}|01\d{8}|2547\d{8}|2541\d{8}|\+2547\d{8}|\+2541\d{8})$/;
        return (
          formData.name.trim() !== '' && 
          kenyanPhoneNumberRegex.test(formData.mpesa_phone.trim())
        );
      default:
        return true;
    }
  };

  // Helper functions
  const setAmount = (amount: number) => {
    setFormData({...formData, amount: amount.toString()});
    setAnimateAmount(true);
    setShowCustomAmount(false);
  };

  const showFeedback = (message: string, type = 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: "", type: "" }), 5000);
  };

  // Navigation
  const goToNextStep = () => {
    if (isStepValid() && currentStep < DONATION_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else if (!isStepValid()) {
      showFeedback("Please complete all required fields correctly", "error");
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // STK Push query
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
        if (error.response?.data?.errorCode !== "500.001.1001") {
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
          
          // Save transaction details to localStorage before showing success page
          localStorage.setItem('transactionId', data.CheckoutRequestID || CheckoutRequestID);
          localStorage.setItem('donationAmount', finalDonationAmount.toString());
          localStorage.setItem('platformFee', platformFee.toString());
          localStorage.setItem('totalAmount', finalAmount.toString());
          localStorage.setItem('donorName', formData.name);
          localStorage.setItem('donorPhone', formData.mpesa_phone);
          localStorage.setItem('campaignName', formData.purpose);
          
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
 
  // Submit handler
  const handleSubmit = async () => {
    setLoading(true);

    // Validate the amount again
    if (finalAmount <= 0) {
      setLoading(false);
      return showFeedback("Please enter a valid donation amount", "error");
    }

    const requestData = {
      mpesa_number: formData.mpesa_phone.trim(),
      name: formData.name.trim(),
      amount: finalAmount,
      email: formData.email.trim(),
      purpose: formData.purpose
    };

    // Validate phone number
    const kenyanPhoneNumberRegex = /^(07\d{8}|01\d{8}|2547\d{8}|2541\d{8}|\+2547\d{8}|\+2541\d{8})$/;

    if (!kenyanPhoneNumberRegex.test(requestData.mpesa_number)) {
      setLoading(false);
      return showFeedback("Please enter a valid M-Pesa number", "error");
    }

    try {
      const { data: stkData, error: stkError } = await sendStkPush(requestData);

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

  // Step indicator component
 
interface Step {
  id: string;
  title: string;
  icon: React.ComponentType;
  description: string;
}

// Update the StepIndicator component with proper type annotations
const StepIndicator = ({ 
  step, 
  index, 
  currentStepIndex 
}: { 
  step: Step; 
  index: number; 
  currentStepIndex: number 
}) => {
  const isActive = index === currentStepIndex;
  const isCompleted = index < currentStepIndex;

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

  // Dynamic step content renderer
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
                  {/* Amount options */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SUGGESTED_AMOUNTS.map(item => (
                      <motion.div
                        key={item.value}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          variant={baseAmount === item.value ? 'default' : 'outline'}
                          onClick={() => setAmount(item.value)}
                          className={`w-full h-auto py-2 px-2 flex flex-col items-center justify-center gap-1 text-sm ${
                            baseAmount === item.value 
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
                  
                  {/* Custom amount option */}
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
                              value={formData.amount} 
                              onChange={(e) => setFormData({
                                ...formData,
                                amount: e.target.value
                              })}
                              className="pl-10 border-gray-300 text-black"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Platform fee preview */}
                  {baseAmount > 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2"
                    >
                      <h4 className="font-medium text-blue-800 text-sm mb-2">Fee Options</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            id="donor_pays"
                            name="fee_option"
                            checked={feeOption === "donor_pays"}
                            onChange={() => setFeeOption("donor_pays")}
                            className="mt-1"
                          />
                          <div>
                            <label htmlFor="donor_pays" className="text-sm font-medium text-gray-700 block">
                              Pay donation + platform fee
                            </label>
                            <div className="text-xs text-gray-600 mt-1">
                              <div className="flex justify-between">
                                <span>Your donation:</span>
                                <span>Ksh {baseAmount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Platform fee ({PLATFORM_FEE_PERCENTAGE}%):</span>
                                <span>Ksh {platformFee.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between font-medium text-blue-800 mt-1 pt-1 border-t border-blue-200">
                                <span>Total amount:</span>
                                <span>Ksh {totalWithFee.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            id="deduct_from_donation"
                            name="fee_option"
                            checked={feeOption === "deduct_from_donation"}
                            onChange={() => setFeeOption("deduct_from_donation")}
                            className="mt-1"
                          />
                          <div>
                            <label htmlFor="deduct_from_donation" className="text-sm font-medium text-gray-700 block">
                              Deduct fee from donation
                            </label>
                            <div className="text-xs text-gray-600 mt-1">
                              <div className="flex justify-between">
                                <span>You pay:</span>
                                <span>Ksh {baseAmount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Platform fee ({PLATFORM_FEE_PERCENTAGE}%):</span>
                                <span>Ksh {platformFee.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between font-medium text-blue-800 mt-1 pt-1 border-t border-blue-200">
                                <span>Donation to cause:</span>
                                <span>Ksh {donationAfterFeeDeduction.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Donation purpose */}
                  <div className="pt-1">
                    <Label className="text-gray-700 text-sm mb-2 block">Donation Purpose</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {DONATION_PURPOSES.map(purpose => (
                        <Button
                          key={purpose.id}
                          type="button"
                          variant={formData.purpose === purpose.id ? 'default' : 'outline'}
                          className={`py-1 text-sm ${
                            formData.purpose === purpose.id
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : 'text-black hover:border-green-500 hover:text-green-500'
                          }`}
                          onClick={() => setFormData({
                            ...formData,
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
                        value={formData.name}
                        onChange={(e) => setFormData({
                          ...formData,
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
                        value={formData.mpesa_phone}
                        onChange={(e) => setFormData({
                          ...formData,
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
                        value={formData.email}
                        onChange={(e) => setFormData({
                          ...formData,
                          email: e.target.value
                        })}
                        placeholder="Receipt will be sent in this email"
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
                  {/* Payment summary */}
                 
                  
                 
                  
                  {/* User details summary */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600">Name</span>
                      </div>
                      <span className="font-medium text-black">{formData.name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Smartphone className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600">Phone</span>
                      </div>
                      <span className="font-medium text-black">{formData.mpesa_phone}</span>
                    </div>
                    
                    {formData.email && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600">Email</span>
                        </div>
                        <span className="font-medium text-black truncate max-w-32 sm:max-w-48">{formData.email}</span>
                      </div>
                    )}
                  </div>
                  <Separator className="my-2" />
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    {feeOption === "donor_pays" ? (
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium text-sm">Donation</span>
                          <span className="font-medium">Ksh {baseAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-gray-600 font-medium text-sm">Platform Fee ({PLATFORM_FEE_PERCENTAGE}%)</span>
                          <span className="font-medium">Ksh {platformFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between items-center">
                          <span className="text-gray-800 font-bold text-sm">Total</span>
                          <span className="font-bold text-green-600">Ksh {totalWithFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium text-sm">You Pay</span>
                          <span className="font-medium">Ksh {baseAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-gray-600 font-medium text-sm">Platform Fee ({PLATFORM_FEE_PERCENTAGE}%)</span>
                          <span className="font-medium">Ksh {platformFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between items-center">
                          <span className="text-gray-800 font-bold text-sm">Donation to Cause</span>
                          <span className="font-bold text-green-600">Ksh {donationAfterFeeDeduction.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <Separator className="my-2" />
                       
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      Purpose: {DONATION_PURPOSES.find(p => p.id === formData.purpose)?.label || 'General'} Support
                    </div>
                  </div>
                  
                  {/* Payment instructions */}
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mt-1">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600">
                        You will receive an M-Pesa prompt. Enter your PIN to complete the payment.
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

  // Main component render
  return (
    <>
      {stkQueryLoading ? (
        <STKPushQueryLoading number={formData.mpesa_phone} />
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
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <Heart className="text-green-500 h-5 w-5" fill="#10b981" />
                <h2 className="text-lg font-bold text-black">Support Our Cause</h2>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="pt-4 px-4">
              <div className="flex justify-between relative">
                {DONATION_STEPS.map((step, index) => (
                  <StepIndicator key={step.id} step={step} index={index} currentStepIndex={currentStep} />
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
                  className={`mx-4 mb-4 p-3 rounded-md text-sm ${
                    feedback.type === 'error' 
                      ? 'bg-red-50 text-red-800 border border-red-200' 
                      : 'bg-green-50 text-green-800 border border-green-200'
                  }`}
                >
                  {feedback.message}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="p-4 border-t bg-gray-50 flex justify-between">
              {currentStep > 0 ? (
                <Button
                  variant="outline"
                  onClick={goToPreviousStep}
                  className="flex items-center gap-1 text-black border-gray-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              ) : (
                <div></div>
              )}
              
              {currentStep < DONATION_STEPS.length - 1 ? (
                <Button
                  onClick={goToNextStep}
                  disabled={!isStepValid()}
                  className={`flex items-center gap-1 ${
                    isStepValid() 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !isStepValid()}
                  className={`flex items-center gap-1 ${
                    !loading && isStepValid()
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate="animate"
                        variants={loadingVariants}
                        className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay with M-Pesa
                      <Send className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
          
          {/* Footer */}
          <div className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />
            Secured by M-Pesa
          </div>
        </div>
      )}
    </>
  );
}

export default PaymentForm;