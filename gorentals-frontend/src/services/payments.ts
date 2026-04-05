import api from '@/lib/axios';

export interface PaymentInitiateRequest {
    bookingId: string;
    amount: number;
    currency: string;
}

export interface PaymentResponse {
    id: string; // Internal payment ID
    orderId: string; // Razorpay order ID
    amount: number;
    currency: string;
    status: string;
    razorpayKey?: string;
}

export interface PaymentVerificationRequest {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
}

export const payments = {
    initiate: async (request: PaymentInitiateRequest): Promise<PaymentResponse> => {
        const response = await api.post('/payments/initiate', request);
        return response.data;
    },
    
    verify: async (request: PaymentVerificationRequest): Promise<void> => {
        await api.post('/payments/verify', request);
    }
};

export const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};
