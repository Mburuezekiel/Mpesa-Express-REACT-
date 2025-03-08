import React from 'react';
import { Smartphone, Lock, Loader2 } from 'lucide-react';

export default function STKPushQueryLoading({ number }: { number: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header with brand */}
        <div className="bg-green-600 p-4 flex justify-center">
          <div className="relative h-12 w-32">
            {/* Replace with your actual logo or use text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-white">INUA FUND</span>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="p-6 space-y-6">
          {/* Loading animation */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Loader2 className="h-10 w-10 text-green-600 animate-spin" />
              </div>
              <svg className="h-24 w-24" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="#e2e8f0" 
                  strokeWidth="6"
                />
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  strokeDasharray="251.2" 
                  strokeDashoffset="125.6"
                  className="animate-dash"
                />
              </svg>
            </div>
          </div>
          
          {/* Status text */}
          <div className="text-center space-y-3">
            <h1 className="text-xl font-bold text-gray-800 animate-pulse">
              PROCESSING PAYMENT
            </h1>
            
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <Smartphone className="h-5 w-5" />
              <p>STK Push sent to <span className="font-medium">{number}</span></p>
            </div>
            
            <div className="mt-4 flex items-center justify-center space-x-2 text-gray-700">
              <Lock className="h-5 w-5" />
              <p>Enter M-PESA PIN to confirm payment</p>
            </div>
          </div>
          
          {/* Progress steps */}
          <div className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex flex-col items-center">
                <div className="rounded-full h-8 w-8 flex items-center justify-center bg-green-600 text-white">
                  <span className="text-xs">1</span>
                </div>
                <span className="text-xs mt-1 text-green-600">Initiated</span>
              </div>
              
              <div className="flex-1 h-1 mx-2 bg-green-200">
                <div className="h-full bg-green-600 w-1/2 animate-pulse"></div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="rounded-full h-8 w-8 flex items-center justify-center bg-gray-200 text-gray-500">
                  <span className="text-xs">2</span>
                </div>
                <span className="text-xs mt-1 text-gray-500">Confirming</span>
              </div>
              
              <div className="flex-1 h-1 mx-2 bg-gray-200"></div>
              
              <div className="flex flex-col items-center">
                <div className="rounded-full h-8 w-8 flex items-center justify-center bg-gray-200 text-gray-500">
                  <span className="text-xs">3</span>
                </div>
                <span className="text-xs mt-1 text-gray-500">Completed</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center text-sm text-gray-500 border-t border-gray-100">
          <p>Please do not close this window while processing</p>
          <p className="mt-1 text-xs">Transaction typically takes 30-60 seconds</p>
        </div>
      </div>
      
      {/* Add global styles for animations */}
      <style jsx global>{`
        @keyframes dash {
          0% {
            stroke-dashoffset: 251.2;
          }
          50% {
            stroke-dashoffset: 125.6;
          }
          100% {
            stroke-dashoffset: 251.2;
          }
        }
        .animate-dash {
          animation: dash 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}