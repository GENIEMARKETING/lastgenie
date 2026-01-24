'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

interface PricingToggleProps {
  singlePrice: number;
  packPrice: number;
  packSize: number;
  onSelectionChange: (option: 'single' | 'pack' | 'subscription') => void;
}

export function PricingToggle({ singlePrice, packPrice, packSize, onSelectionChange }: PricingToggleProps) {
  const [selected, setSelected] = useState<'single' | 'pack' | 'subscription'>('single');

  const handleSelection = (option: 'single' | 'pack' | 'subscription') => {
    setSelected(option);
    onSelectionChange(option);
  };

  const subscriptionPrice = Math.round(packPrice * 0.85); // 15% discount
  const savings = packPrice - subscriptionPrice;

  return (
    <div className="space-y-4">
      {/* Single Bottle */}
      <div 
        className={`border-2 rounded-xl p-4 cursor-pointer transition-colors ${
          selected === 'single' 
            ? 'border-primary bg-primary/5' 
            : 'border-border-default hover:border-border-interactive'
        }`}
        onClick={() => handleSelection('single')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selected === 'single' ? 'border-primary bg-primary' : 'border-border-default'
            }`}>
              {selected === 'single' && <Check className="h-3 w-3 text-white" />}
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Single Bottle</h3>
              <p className="text-sm text-text-secondary">50ML bottle - Try it first</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-text-primary">${singlePrice}</p>
            <p className="text-sm text-text-secondary">One-time purchase</p>
          </div>
        </div>
      </div>

      {/* 12-Pack One-time */}
      <div 
        className={`border-2 rounded-xl p-4 cursor-pointer transition-colors ${
          selected === 'pack' 
            ? 'border-primary bg-primary/5' 
            : 'border-border-default hover:border-border-interactive'
        }`}
        onClick={() => handleSelection('pack')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selected === 'pack' ? 'border-primary bg-primary' : 'border-border-default'
            }`}>
              {selected === 'pack' && <Check className="h-3 w-3 text-white" />}
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">{packSize}-Pack</h3>
              <p className="text-sm text-text-secondary">Stock up and save</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-text-primary">${packPrice}</p>
            <p className="text-sm text-text-secondary">One-time purchase</p>
          </div>
        </div>
      </div>

      {/* Subscribe & Save */}
      <div 
        className={`border-2 rounded-xl p-4 cursor-pointer transition-colors relative overflow-hidden ${
          selected === 'subscription' 
            ? 'border-secondary bg-secondary/5' 
            : 'border-border-default hover:border-border-interactive'
        }`}
        onClick={() => handleSelection('subscription')}
      >
        {/* Popular Badge */}
        <div className="absolute top-0 right-0 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
          MOST POPULAR
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selected === 'subscription' ? 'border-secondary bg-secondary' : 'border-border-default'
            }`}>
              {selected === 'subscription' && <Check className="h-3 w-3 text-white" />}
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Subscribe & Save</h3>
              <p className="text-sm text-text-secondary">{packSize}-pack delivered monthly</p>
              <p className="text-sm text-accent font-medium">Save ${savings} per order • Cancel anytime</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-secondary">${subscriptionPrice}</p>
            <p className="text-sm text-text-secondary line-through">${packPrice}</p>
            <p className="text-sm text-secondary font-medium">15% off</p>
          </div>
        </div>
      </div>
    </div>
  );
}