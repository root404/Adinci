import React, { useState } from 'react';
import { AdZone } from '../types';
import { CreditCard, CheckCircle, ArrowLeft, ShieldCheck, Calendar, Maximize, DollarSign, Lock } from 'lucide-react';

interface PaymentScreenProps {
  zone: AdZone;
  durationMonths: number;
  price: string;
  onConfirm: () => void;
  onCancel: () => void;
  isHighContrast: boolean;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ 
  zone, 
  durationMonths, 
  price, 
  onConfirm, 
  onCancel, 
  isHighContrast 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = () => {
    setIsProcessing(true);
    // Simulate API delay
    setTimeout(() => {
      setIsProcessing(false);
      onConfirm();
    }, 2000);
  };

  const bgClass = isHighContrast ? 'bg-black text-white' : 'bg-gray-50 text-gray-900';
  const cardClass = isHighContrast ? 'bg-gray-900 border-2 border-yellow-400' : 'bg-white shadow-sm border border-gray-200';

  return (
    <div className={`h-full w-full flex flex-col ${bgClass}`}>
      {/* Header - Fixed Top */}
      <div className={`flex-none px-4 py-3 flex items-center gap-3 border-b z-10 ${isHighContrast ? 'bg-gray-900 border-yellow-400' : 'bg-white border-gray-200 shadow-sm'}`}>
        <button onClick={onCancel} className={`p-2 rounded-full transition-colors ${isHighContrast ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 text-center pr-10">
           <h1 className="text-lg font-bold">Secure Checkout</h1>
           <div className={`flex items-center justify-center gap-1 text-[10px] ${isHighContrast ? 'opacity-60' : 'text-gray-600'}`}>
             <Lock size={10} />
             <span>256-bit SSL Encrypted</span>
           </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Order Summary Card */}
          <div className={`${cardClass} rounded-xl overflow-hidden`}>
             <div className={`px-4 py-3 border-b ${isHighContrast ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <h2 className={`text-sm font-bold uppercase tracking-wide ${isHighContrast ? 'opacity-70' : 'text-gray-700'}`}>Order Details</h2>
             </div>
             
             <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isHighContrast ? 'bg-yellow-400 text-black' : 'bg-blue-100 text-blue-600'}`}>
                         <Maximize size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Zone: {zone.name}</p>
                        <p className={`text-xs ${isHighContrast ? 'opacity-60' : 'text-gray-600'}`}>
                           {zone.shape === 'CIRCLE' ? `${Math.round(Math.PI * zone.radius * zone.radius)} m² (Circle)` : `${Math.round(zone.width * zone.height)} m² (Rect)`}
                        </p>
                      </div>
                   </div>
                </div>

                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isHighContrast ? 'bg-yellow-400 text-black' : 'bg-purple-100 text-purple-600'}`}>
                         <Calendar size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Duration</p>
                        <p className={`text-xs ${isHighContrast ? 'opacity-60' : 'text-gray-600'}`}>{durationMonths} Month{durationMonths > 1 ? 's' : ''} Plan</p>
                      </div>
                   </div>
                   <span className="font-bold">{durationMonths} mo</span>
                </div>
             </div>

             <div className={`px-4 py-4 flex justify-between items-center border-t ${isHighContrast ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'}`}>
                <span className="font-bold text-lg">Total Due</span>
                <span className={`text-2xl font-black ${isHighContrast ? 'text-yellow-400' : 'text-blue-600'}`}>${price}</span>
             </div>
          </div>

          {/* Payment Method Card */}
          <div className={`${cardClass} rounded-xl overflow-hidden`}>
             <div className={`px-4 py-3 border-b ${isHighContrast ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <h2 className={`text-sm font-bold uppercase tracking-wide ${isHighContrast ? 'opacity-70' : 'text-gray-700'}`}>Payment Method</h2>
             </div>
             <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="bg-[#1a1f71] text-white px-2 py-1 rounded font-bold italic text-xs">
                      VISA
                   </div>
                   <div>
                      <p className="font-bold text-sm">•••• 4242</p>
                      <p className={`text-xs ${isHighContrast ? 'opacity-60' : 'text-gray-600'}`}>Expires 12/25</p>
                   </div>
                </div>
                <button className="text-blue-500 font-bold text-sm">Change</button>
             </div>
          </div>
          
          <div className={`flex items-center justify-center gap-2 text-xs py-2 ${isHighContrast ? 'opacity-50' : 'text-gray-600'}`}>
             <ShieldCheck size={14} />
             <p>Payment is processed securely. No refund after 24h.</p>
          </div>
      </div>

      {/* Footer - Fixed Bottom */}
      <div className={`flex-none p-4 pb-8 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20 ${isHighContrast ? 'bg-gray-900 border-yellow-400' : 'bg-white border-gray-100'}`}>
         <button 
           onClick={handlePay}
           disabled={isProcessing}
           className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
              isHighContrast 
                ? 'bg-yellow-400 text-black hover:bg-yellow-300' 
                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200'
           }`}
         >
            {isProcessing ? (
               <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
               </div>
            ) : (
               <>
                 <CheckCircle size={20} />
                 Pay & Activate Now
               </>
            )}
         </button>
      </div>
    </div>
  );
};