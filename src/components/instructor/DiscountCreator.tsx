'use client';

import { useState } from 'react';
import { Plus, Trash2, Tag, Calendar, X } from 'lucide-react';
import { Discount } from '@/hooks/useCourseCreation';

interface DiscountCreatorProps {
  discounts: Discount[];
  onAddDiscount: (discount: Omit<Discount, 'id' | 'usedCount'>) => void;
  onUpdateDiscount: (id: string, updates: Partial<Discount>) => void;
  onDeleteDiscount: (id: string) => void;
}

export const DiscountCreator = ({
  discounts,
  onAddDiscount,
  onUpdateDiscount,
  onDeleteDiscount,
}: DiscountCreatorProps) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    code: '',
    isActive: true,
    startDate: '',
    endDate: '',
    maxUses: undefined as number | undefined,
    description: '',
  });

  const resetForm = () => {
    setFormData({
      type: 'percentage',
      value: 0,
      code: '',
      isActive: true,
      startDate: '',
      endDate: '',
      maxUses: undefined,
      description: '',
    });
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!formData.code.trim() || formData.value <= 0) {
      alert('Please enter a discount code and a valid discount value');
      return;
    }
    onAddDiscount(formData);
    resetForm();
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold sm:text-2xl dark:text-white">Discount Management</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Discount
          </button>
        )}
      </div>

      {showForm && (
        <div className="p-6 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-white">Create New Discount</h3>
            <button
              onClick={resetForm}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-5 h-5 dark:text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Discount Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                  className="flex-1 px-4 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={generateRandomCode}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Generate random code"
                >
                  <Tag className="w-5 h-5 dark:text-gray-300" />
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Discount Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })
                }
                className="w-full px-4 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {formData.type === 'percentage' ? 'Discount Percentage' : 'Discount Amount ($)'}
              </label>
              <input
                type="number"
                min="0"
                max={formData.type === 'percentage' ? 100 : undefined}
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                }
                placeholder={formData.type === 'percentage' ? '20' : '50'}
                className="w-full px-4 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Uses (optional)
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxUses || ''}
                onChange={(e) =>
                  setFormData({ ...formData, maxUses: parseInt(e.target.value) || undefined })
                }
                placeholder="Unlimited"
                className="w-full px-4 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Calendar className="inline w-4 h-4 mr-1" /> Start Date (optional)
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Calendar className="inline w-4 h-4 mr-1" /> End Date (optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this discount for your records"
                rows={2}
                className="w-full px-4 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">
                  Activate immediately
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Discount
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {discounts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold dark:text-white">Active Discounts</h3>
          {discounts.map((discount) => (
            <div
              key={discount.id}
              className="p-4 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-semibold rounded-full">
                      {discount.code}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        discount.isActive
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {discount.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() =>
                        onUpdateDiscount(discount.id, { isActive: !discount.isActive })
                      }
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {discount.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {discount.type === 'percentage'
                      ? `${discount.value}% off`
                      : `$${discount.value} off`}
                    {discount.maxUses && ` • ${discount.usedCount}/${discount.maxUses} uses`}
                    {!discount.maxUses && ` • ${discount.usedCount} uses`}
                  </p>
                  {discount.startDate && discount.endDate && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Valid: {new Date(discount.startDate).toLocaleDateString()} -{' '}
                      {new Date(discount.endDate).toLocaleDateString()}
                    </p>
                  )}
                  {discount.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {discount.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onDeleteDiscount(discount.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete discount"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
