"use client"
import { useState, useCallback, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

export default function Widget() {
  const [grossBasicSalary, setGrossBasicSalary] = useState("")
  const [netSalary, setNetSalary] = useState("")
  const [allowances, setAllowances] = useState("")
  const [monthlyDeductibleRelief, setMonthlyDeductibleRelief] = useState("")
  const [results, setResults] = useState<any>(null)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [mode, setMode] = useState<'basicToNet' | 'netToBasic'>('basicToNet')

  const calculateTax = useCallback((grossRemuneration: number, grossBasicSalary: number, monthlyDeductibleRelief: number): { totalTax: number; breakdown: any; ssnitContribution: number } => {
    const ssnit = 0.055 * grossBasicSalary;
    const taxableIncome = grossRemuneration - ssnit - monthlyDeductibleRelief;

    let tax = 0;
    if (taxableIncome <= 490) tax = 0;
    else if (taxableIncome <= 600) tax = 0.05 * (taxableIncome - 490);
    else if (taxableIncome <= 730) tax = 5.5 + 0.10 * (taxableIncome - 600);
    else if (taxableIncome <= 3896.67) tax = 18.5 + 0.175 * (taxableIncome - 730);
    else if (taxableIncome <= 19896.67) tax = 572.67 + 0.25 * (taxableIncome - 3896.67);
    else if (taxableIncome <= 50416.67) tax = 4572.67 + 0.30 * (taxableIncome - 19896.67);
    else tax = 13728.67 + 0.35 * (taxableIncome - 50416.67);

    return {
      totalTax: tax,
      breakdown: {
        grossRemuneration,
        ssnit,
        taxableIncome,
        tax
      },
      ssnitContribution: ssnit
    };
  }, [])

  const calculateGrossFromNet = useCallback((targetNet: number, allowances: number, monthlyDeductibleRelief: number): number => {
    let low = 0;
    let high = targetNet * 2;

    while (high - low > 0.01) {
      const mid = (low + high) / 2;
      const { totalTax, ssnitContribution } = calculateTax(mid + allowances, mid, monthlyDeductibleRelief);
      const calculatedNet = mid + allowances - totalTax - ssnitContribution;
      
      if (Math.abs(calculatedNet - targetNet) < 0.01) return mid;
      if (calculatedNet > targetNet) {
        high = mid;
      } else {
        low = mid;
      }
    }

    return (low + high) / 2;
  }, [calculateTax]);

  const handleModeChange = (newMode: 'basicToNet' | 'netToBasic') => {
    setMode(newMode)
    setGrossBasicSalary("")
    setNetSalary("")
  }

  useEffect(() => {
    const inputValue = parseFloat((mode === 'basicToNet' ? grossBasicSalary : netSalary).replace(/,/g, '')) || 0;
    const allowancesValue = parseFloat(allowances.replace(/,/g, '')) || 0;
    const monthlyDeductibleReliefValue = parseFloat(monthlyDeductibleRelief.replace(/,/g, '')) || 0;

    let grossBasicSalaryValue, grossRemuneration;

    if (mode === 'netToBasic') {
      grossBasicSalaryValue = calculateGrossFromNet(inputValue, allowancesValue, monthlyDeductibleReliefValue);
      grossRemuneration = grossBasicSalaryValue + allowancesValue;
    } else {
      grossBasicSalaryValue = inputValue;
      grossRemuneration = grossBasicSalaryValue + allowancesValue;
    }

    const { totalTax, breakdown, ssnitContribution } = calculateTax(grossRemuneration, grossBasicSalaryValue, monthlyDeductibleReliefValue);
    const totalDeductions = totalTax + ssnitContribution;
    const netIncomeValue = grossRemuneration - totalDeductions;
    const effectiveTaxRate = grossRemuneration > 0 ? (totalDeductions / grossRemuneration) * 100 : 0;

    setResults({
      grossRemuneration,
      grossBasicSalary: grossBasicSalaryValue,
      allowances: allowancesValue,
      monthlyDeductibleRelief: monthlyDeductibleReliefValue,
      totalTaxPayable: totalTax,
      ssnitContribution,
      totalDeductions,
      netIncome: netIncomeValue,
      effectiveTaxRate,
      breakdown,
    });
  }, [grossBasicSalary, netSalary, allowances, monthlyDeductibleRelief, calculateTax, mode, calculateGrossFromNet]);

  const handleNumberChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, '')
    const parts = value.split('.')
    if (parts[0].length > 3) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }
    setter(parts.join('.'))
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const toggleBreakdown = () => {
    setShowBreakdown(!showBreakdown)
  }

  return (
    <div className='pt-4 sm:pt-4 px-4 pb-4 bg-[#FFFFFF] w-full sm:max-w-[560px] flex-col items-center justify-center sm:rounded-[12px] font-jetbrains shadow-sm'>
      <div className="space-y-6 border border-[#E5E5E5] rounded-[8px] p-4">
        {/* Top dots */}
        <div className="flex justify-between mb-3">
          <div className="w-1 h-1 bg-[#171717] rounded-full"></div>
          <div className="w-1 h-1 bg-[#171717] rounded-full"></div>
        </div>

        {/* Main content */}
        <h1 className='text-lg font-bold'>Monthly Income Tax Calculator</h1>
        
        <div className="flex rounded-full bg-gray-100 p-1">
          {['basicToNet', 'netToBasic'].map((option) => (
            <button
              key={option}
              className={cn(
                "flex-1 text-sm leading-5 font-medium py-2 px-4 rounded-full transition-colors duration-200",
                mode === option ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
              onClick={() => handleModeChange(option as 'basicToNet' | 'netToBasic')}
            >
              {option === 'basicToNet' ? 'Basic to Net' : 'Net to Basic'}
            </button>
          ))}
        </div>
        
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
          <div>
            <label className='block mb-2 text-xs font-[500]'>
              {mode === 'basicToNet' ? 'Basic Salary' : 'Net Salary'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm leading-5 font-[500]">GHS</span>
              <Input 
                type='text' 
                value={mode === 'basicToNet' ? grossBasicSalary : netSalary}
                onChange={handleNumberChange(mode === 'basicToNet' ? setGrossBasicSalary : setNetSalary)}
                className={cn("rounded-[8px] pl-12 placeholder-[#A3A3A3] text-sm leading-5")}
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className='block mb-2 text-xs font-[500]'>Allowances</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm leading-5 font-[500]">GHS</span>
              <Input 
                type='text' 
                value={allowances}
                onChange={handleNumberChange(setAllowances)}
                className={cn("rounded-[8px] pl-12 placeholder-[#A3A3A3]")}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
        
        <div>
          <label className='block mb-2 text-xs font-[500]'>Tax Relief</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm leading-5 font-[500]">GHS</span>
            <Input 
              type='text' 
              value={monthlyDeductibleRelief}
              onChange={handleNumberChange(setMonthlyDeductibleRelief)}
              className={cn("rounded-[8px] pl-12 placeholder-[#A3A3A3]")}
              placeholder="0.00"
            />
          </div>
        </div>
        
        <hr className="border-gray-200" />
        
        {results && (
          <>
            <div>
              <p className='text-gray-500'>Your net salary is...</p>
              <p className='text-4xl font-bold'>GHS {formatNumber(results.netIncome)}</p>
            </div>
            
            <div>
              <p className='text-gray-500'>Your total deduction is ...</p>
              <p className='text-3xl font-bold'>GHS {formatNumber(results.totalDeductions)}</p>
            </div>
            
            <div className='mt-6'>
              <div className='h-4 bg-gray-200 rounded-full mb-6 overflow-hidden'>
                {results && results.grossRemuneration > 0 ? (
                  <div className='h-full flex space-x-[2px]'>
                    <div className='bg-[#3B82F6]' style={{width: `calc(${(results.netIncome / results.grossRemuneration * 100).toFixed(1)}% - 1.33px)`}}></div>
                    <div className='bg-[#FB923C]' style={{width: `calc(${(results.ssnitContribution / results.grossRemuneration * 100).toFixed(1)}% - 1.33px)`}}></div>
                    <div className='bg-[#DC2626]' style={{width: `calc(${(results.totalTaxPayable / results.grossRemuneration * 100).toFixed(1)}% - 1.33px)`}}></div>
                  </div>
                ) : (
                  <div className='h-full bg-gray-300'></div>
                )}
              </div>
              <div className='space-y-2 text-xs'>
                {[
                  { label: 'Gross Salary', value: `GHS ${formatNumber(results.grossRemuneration)}`, percentage: '100%', color: '#525252' },
                  { label: 'SSNIT (5.5% of Basic Salary)', value: `GHS ${formatNumber(results.ssnitContribution)}`, percentage: `${results.grossRemuneration ? (results.ssnitContribution / results.grossRemuneration * 100).toFixed(1) : 0}%`, color: '#FB923C' },
                  { label: 'Employee Payee', value: `GHS ${formatNumber(results.totalTaxPayable)}`, percentage: `${results.grossRemuneration ? (results.totalTaxPayable / results.grossRemuneration * 100).toFixed(1) : 0}%`, color: '#DC2626' },
                  { label: 'Net Salary', value: `GHS ${formatNumber(results.netIncome)}`, percentage: `${results.grossRemuneration ? (results.netIncome / results.grossRemuneration * 100).toFixed(1) : 0}%`, color: '#3B82F6' },
                ].map((item, index) => (
                  <div key={index} className='flex items-center'>
                    <div className='w-3 h-3 rounded-full mr-2' style={{backgroundColor: item.color}}></div>
                    <span className='flex-grow'>{item.label}</span>
                    <span className='mr-4'>{item.value}</span>
                    <span className='w-12 text-right'>{item.percentage}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        <div className='flex justify-center mb-2'>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto px-4 py-2 rounded-full border-[1px] flex items-center justify-center"
            onClick={toggleBreakdown}
          >
            <span className="mr-2">{showBreakdown ? "Hide tax breakdown" : "Show tax breakdown"}</span>
            {showBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        <AnimatePresence>
          {showBreakdown && results && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-[#F7F7F7] rounded-[8px]">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-[#A3A3A3]">
                        <th className="text-left py-2 font-normal">Range</th>
                        <th className="text-right py-2 font-normal">Rate</th>
                        <th className="text-right py-2 font-normal">Tax Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { range: ["GHS 0.00 -", "490.00"], rate: "0.0%", tax: results.breakdown.tax > 0 ? formatNumber(Math.min(490, results.breakdown.taxableIncome) * 0) : "0.00" },
                        { range: ["GHS 490.00 -", "600.00"], rate: "5.0%", tax: results.breakdown.tax > 5.5 ? "5.50" : formatNumber(Math.max(0, Math.min(110, results.breakdown.taxableIncome - 490)) * 0.05) },
                        { range: ["GHS 600.00 -", "730.00"], rate: "10.0%", tax: results.breakdown.tax > 18.5 ? "13.00" : formatNumber(Math.max(0, Math.min(130, results.breakdown.taxableIncome - 600)) * 0.10) },
                        { range: ["GHS 730.00 -", "3,896.67"], rate: "17.5%", tax: results.breakdown.tax > 572.67 ? "554.17" : formatNumber(Math.max(0, Math.min(3166.67, results.breakdown.taxableIncome - 730)) * 0.175) },
                        { range: ["GHS 3,896.67 -", "19,896.67"], rate: "25.0%", tax: results.breakdown.tax > 4572.67 ? "4,000.00" : formatNumber(Math.max(0, Math.min(16000, results.breakdown.taxableIncome - 3896.67)) * 0.25) },
                        { range: ["GHS 19,896.67 -", "50,416.67"], rate: "30.0%", tax: formatNumber(Math.max(0, Math.min(30520, results.breakdown.taxableIncome - 19896.67)) * 0.3) },
                        { range: ["Above", "GHS 50,416.67"], rate: "35.0%", tax: formatNumber(Math.max(0, results.breakdown.taxableIncome - 50416.67) * 0.35) },
                      ]
                      .filter((row, index) => index === 0 || parseFloat(row.tax ?? '0') > 0)
                      .map((row, index) => (
                        <tr key={index} className="border-b last:border-b-0">
                          <td className="py-2">
                            {row.range[0]}<br />{row.range[1]}
                          </td>
                          <td className="text-right py-2">{row.rate}</td>
                          <td className="text-right py-2">GHS {row.tax}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold border-t border-[#E5E5E5] text-black">
                        <td colSpan={2} className="py-2">Total Tax</td>
                        <td className="py-2 text-right">GHS {formatNumber(results.breakdown.tax)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom dots */}
        <div className="flex justify-between mt-3">
          <div className="w-1 h-1 bg-[#171717] rounded-full"></div>
          <div className="w-1 h-1 bg-[#171717] rounded-full"></div>
        </div>
      </div>
    </div>
  )
}
