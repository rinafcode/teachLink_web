'use client';

import { useState } from 'react';
import { Tag, X } from 'lucide-react';

interface Discount {
  id: string;
  type: 'percentage' | 'fixed';
  value: number;
  code: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  maxUses?: number;
  usedCount: number;
  description?: string;
}

interface PricingOption {
  id: string;
  title: string;
  price: number;
  features: string[];
  popular?: boolean;
}

interface EnrollmentCTAProps {
  pricingOptions?: PricingOption[];
  discounts?: Discount[];
  onEnroll?: (optionId: string, appliedDiscount?: Discount) => void;
}

// Helper function to calculate discounted price
const calculateDiscountedPrice = (originalPrice: number, courseDiscounts: Discount[]): number => {
  const activeDiscounts = courseDiscounts.filter((d) => {
    if (!d.isActive) return false;
    if (d.startDate && new Date(d.startDate) > new Date()) return false;
    if (d.endDate && new Date(d.endDate) < new Date()) return false;
    if (d.maxUses && d.usedCount >= d.maxUses) return false;
    return true;
  });

  if (activeDiscounts.length === 0) return originalPrice;

  let bestDiscount = 0;
  activeDiscounts.forEach((discount) => {
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = originalPrice * (discount.value / 100);
    } else {
      discountAmount = discount.value;
    }
    if (discountAmount > bestDiscount) {
      bestDiscount = discountAmount;
    }
  });

  return Math.max(0, originalPrice - bestDiscount);
};

// Helper to find discount by code
const findDiscountByCode = (code: string, discounts: Discount[]): Discount | undefined => {
  return discounts.find((d) => d.code.toLowerCase() === code.toLowerCase());
};

export default function EnrollmentCTA({
  pricingOptions = [
    {
      id: 'basic',
      title: 'Basic Access',
      price: 49.99,
      features: ['Full course access', 'Basic support', 'Certificate of completion'],
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
  discounts = [],
  onEnroll = (optionId) => {},
}: EnrollmentCTAProps): JSX.Element {
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [discountError, setDiscountError] = useState('');

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }

    const foundDiscount = findDiscountByCode(discountCode, discounts);
    if (!foundDiscount) {
      setDiscountError('Invalid or expired discount code');
      setAppliedDiscount(null);
      return;
    }

    // Validate discount
    if (!foundDiscount.isActive) {
      setDiscountError('This discount code is no longer active');
      setAppliedDiscount(null);
      return;
    }
    if (foundDiscount.startDate && new Date(foundDiscount.startDate) > new Date()) {
      setDiscountError(
        `This discount will be active from ${new Date(
          foundDiscount.startDate,
        ).toLocaleDateString()}`,
      );
      setAppliedDiscount(null);
      return;
    }
    if (foundDiscount.endDate && new Date(foundDiscount.endDate) < new Date()) {
      setDiscountError('This discount code has expired');
      setAppliedDiscount(null);
      return;
    }
    if (foundDiscount.maxUses && foundDiscount.usedCount >= foundDiscount.maxUses) {
      setDiscountError('This discount code has reached its maximum usage limit');
      setAppliedDiscount(null);
      return;
    }

    // Apply valid discount
    setAppliedDiscount(foundDiscount);
    setDiscountError('');
    setDiscountCode('');
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
  };

  const getDisplayPrice = (originalPrice: number) => {
    if (appliedDiscount) {
      return calculateDiscountedPrice(originalPrice, [appliedDiscount]);
    }
    // If no manually applied discount, check for any active public discounts
    return calculateDiscountedPrice(originalPrice, discounts);
  };

  const getOriginalDisplayPrice = (originalPrice: number) => {
    const discounted = getDisplayPrice(originalPrice);
    return discounted < originalPrice ? originalPrice : null;
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-[#E2E8F0] dark:border-[#334155] p-6 lg:sticky lg:top-6">
      <h2 className="text-2xl font-bold mb-6 text-[#0F172A] dark:text-white">Enroll Now</h2>

      {/* Discount Code Input */}
      <div className="mb-6">
        {!appliedDiscount ? (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Tag className="inline w-4 h-4 mr-1" /> Have a discount code?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value.toUpperCase());
                  if (discountError) setDiscountError('');
                }}
                placeholder="Enter code"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                onClick={handleApplyDiscount}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
              >
                Apply
              </button>
            </div>
            {discountError && (
              <p className="text-sm text-red-600 dark:text-red-400">{discountError}</p>
            )}
          </div>
        ) : (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-green-800 dark:text-green-300">
                  {appliedDiscount.code} applied!
                </span>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {appliedDiscount.type === 'percentage'
                    ? `${appliedDiscount.value}% off your purchase`
                    : `$${appliedDiscount.value} off your purchase`}
                </p>
              </div>
              <button
                onClick={handleRemoveDiscount}
                className="p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded transition-colors"
              >
                <X className="w-4 h-4 text-green-600 dark:text-green-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {pricingOptions.map((option) => {
          const finalPrice = getDisplayPrice(option.price);
          const originalPrice = getOriginalDisplayPrice(option.price);

          return (
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
              <h3 className="text-xl font-semibold mt-2 text-[#0F172A] dark:text-white">
                {option.title}
              </h3>
              <div className="my-4">
                {originalPrice && (
                  <span className="text-xl line-through text-[#94A3B8] mr-2">
                    ${originalPrice.toFixed(2)}
                  </span>
                )}
                <span className="text-3xl lg:text-4xl font-bold text-[#0066FF] dark:text-[#00C2FF]">
                  ${finalPrice.toFixed(2)}
                </span>
                <span className="text-[#64748B] dark:text-[#94A3B8] text-sm ml-1">/one-time</span>
              </div>
              <ul className="mb-6 space-y-3">
                {option.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <svg
                      className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-[#475569] dark:text-[#CBD5E1]">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onEnroll(option.id, appliedDiscount || undefined)}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  option.popular
                    ? 'bg-[#0066FF] dark:bg-[#00C2FF] text-white hover:bg-[#0052CC] dark:hover:bg-[#00A8E0] shadow-lg shadow-[#0066FF]/20 dark:shadow-[#00C2FF]/20'
                    : 'bg-[#F1F5F9] dark:bg-[#334155] text-[#0F172A] dark:text-white hover:bg-[#E2E8F0] dark:hover:bg-[#475569]'
                }`}
              >
                Enroll Now
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-6 text-center text-sm text-[#64748B] dark:text-[#94A3B8] space-y-2">
        <p className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          30-day money-back guarantee
        </p>
        <p>Need help? Contact our support team</p>
      </div>
    </div>
  );
}
