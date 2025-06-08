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
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
      <h2 className="text-2xl font-bold mb-6">Enroll Now</h2>
      <div className="space-y-4">
        {pricingOptions.map((option) => (
          <div
            key={option.id}
            className={`border rounded-lg p-4 ${
              option.popular ? 'border-blue-500' : 'border-gray-200'
            }`}
          >
            {option.popular && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                Most Popular
              </span>
            )}
            <h3 className="text-xl font-semibold mt-2">{option.title}</h3>
            <div className="my-4">
              <span className="text-3xl font-bold">${option.price}</span>
              <span className="text-gray-500">/one-time</span>
            </div>
            <ul className="space-y-2 mb-4">
              {option.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onEnroll(option.id)}
              className={`w-full py-2 px-4 rounded-lg font-semibold ${
                option.popular
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Enroll Now
            </button>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>30-day money-back guarantee</p>
        <p className="mt-2">Need help? Contact our support team</p>
      </div>
    </div>
  );
} 