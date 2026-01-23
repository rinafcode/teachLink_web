'use client';

interface PricingOption {
  id: string;
  title: string;
  price: number;
  features: string[];
  popular?: boolean;
}

interface EnrollmentCTAProps {
  pricingOptions?: PricingOption[];
  onEnroll?: (optionId: string) => void;
}

export default function EnrollmentCTA({
  pricingOptions = [
    {
      id: 'basic',
      title: 'Basic Access',
      price: 49.99,
      features: [
        'Full course access',
        'Basic support',
        'Certificate of completion',
      ],
    },
    {
      id: 'premium',
      title: 'Premium Access',
      price: 99.99,
      features: [
        'Full course access',
        'Priority support',
        'Certificate of completion',
        '1-on-1 mentoring',
        'Project reviews',
      ],
      popular: true,
    },
  ],
  onEnroll = (optionId) => console.log('Enrolling in option:', optionId),
}: EnrollmentCTAProps) {
  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-[#E2E8F0] dark:border-[#334155] p-6 lg:sticky lg:top-6">
      <h2 className="text-2xl font-bold mb-6 text-[#0F172A] dark:text-white">Enroll Now</h2>
      <div className="space-y-4">
        {pricingOptions.map((option) => (
          <div
            key={option.id}
            className={`border rounded-xl p-5 transition-all duration-200 ${
              option.popular
                ? 'border-[#0066FF] dark:border-[#00C2FF] bg-[#F0F9FF] dark:bg-[#1E3A8A]/20 shadow-lg shadow-[#0066FF]/10'
                : 'border-[#E2E8F0] dark:border-[#334155] hover:border-[#CBD5E1] dark:hover:border-[#475569]'
            }`}
          >
            {option.popular && (
              <span className="inline-block bg-[#0066FF] dark:bg-[#00C2FF] text-white text-xs px-3 py-1 rounded-full font-medium mb-3">
                Most Popular
              </span>
            )}
            <h3 className="text-xl font-semibold mt-2 text-[#0F172A] dark:text-white">{option.title}</h3>
            <div className="my-4">
              <span className="text-3xl lg:text-4xl font-bold text-[#0066FF] dark:text-[#00C2FF]">${option.price}</span>
              <span className="text-[#64748B] dark:text-[#94A3B8] text-sm ml-1">/one-time</span>
            </div>
            <ul className="space-y-3 mb-6">
              {option.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#475569] dark:text-[#CBD5E1]">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => onEnroll(option.id)}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                option.popular
                  ? 'bg-[#0066FF] dark:bg-[#00C2FF] text-white hover:bg-[#0052CC] dark:hover:bg-[#00A8E0] shadow-lg shadow-[#0066FF]/20 dark:shadow-[#00C2FF]/20'
                  : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#0F172A] dark:text-white hover:bg-[#E2E8F0] dark:hover:bg-[#475569]'
              }`}
            >
              Enroll Now
            </button>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center text-sm text-[#64748B] dark:text-[#94A3B8] space-y-2">
        <p className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          30-day money-back guarantee
        </p>
        <p>Need help? Contact our support team</p>
      </div>
    </div>
  );
} 