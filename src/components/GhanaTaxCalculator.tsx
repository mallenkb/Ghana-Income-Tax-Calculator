"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Image from "next/image"

interface Results {
  grossRemuneration: number;
  grossBasicSalary: number;
  allowances: number;
  benefitInKind: number;
  monthlyDeductibleRelief: number;
  totalTaxPayable: number;
  ssnitContribution: number;
  totalDeductions: number;
  netIncome: number;
  effectiveTaxRate: number;
  breakdown: Array<{
    bracket: string;
    rate: string;
    taxableAmount: string;
    taxForBracket: string;
    cumulativeIncome: string;
    cumulativeTax: string;
  }>;
}

export default function Component() {
  const [grossBasicSalary, setGrossBasicSalary] = useState("")
  const [allowances, setAllowances] = useState("")
  const [benefitInKind, setBenefitInKind] = useState("")
  const [monthlyDeductibleRelief, setMonthlyDeductibleRelief] = useState("")
  const [results, setResults] = useState<Results | null>(null)

  const taxBrackets = [
    { min: 0, max: 490, rate: 0 },
    { min: 490, max: 600, rate: 5 },
    { min: 600, max: 730, rate: 10 },
    { min: 730, max: 3896.67, rate: 17.5 },
    { min: 3896.67, max: 19896.67, rate: 25 },
    { min: 19896.67, max: 50416.67, rate: 30 },
    { min: 50416.67, max: Infinity, rate: 35 },
  ]

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const calculateTax = useCallback((grossRemuneration: number, grossBasicSalary: number, monthlyDeductibleRelief: number) => {
    const taxBrackets = [
      { min: 0, max: 490, rate: 0 },
      { min: 490, max: 600, rate: 5 },
      { min: 600, max: 730, rate: 10 },
      { min: 730, max: 3896.67, rate: 17.5 },
      { min: 3896.67, max: 19896.67, rate: 25 },
      { min: 19896.67, max: 50416.67, rate: 30 },
      { min: 50416.67, max: Infinity, rate: 35 },
    ]

    let remainingIncome = grossRemuneration - monthlyDeductibleRelief
    let totalTax = 0
    let cumulativeIncome = 0
    let cumulativeTax = 0
    const breakdown = []

    // Calculate SSNIT (5.5% of gross basic salary)
    const ssnitContribution = grossBasicSalary * 0.055
    // Do not subtract SSNIT from remainingIncome here

    for (const bracket of taxBrackets) {
      const taxableAmount = Math.min(Math.max(remainingIncome - (bracket.min - cumulativeIncome), 0), bracket.max - bracket.min)
      const taxForBracket = (taxableAmount * bracket.rate) / 100
      totalTax += taxForBracket
      cumulativeIncome += taxableAmount
      cumulativeTax += taxForBracket

      breakdown.push({
        bracket: `GHS ${formatNumber(bracket.min)} - GHS ${bracket.max === Infinity ? formatNumber(bracket.min) + "+" : formatNumber(bracket.max)}`,
        rate: bracket.rate + "%",
        taxableAmount: `GHS ${formatNumber(taxableAmount)}`,
        taxForBracket: `GHS ${formatNumber(taxForBracket)}`,
        cumulativeIncome: `GHS ${formatNumber(cumulativeIncome)}`,
        cumulativeTax: `GHS ${formatNumber(cumulativeTax)}`,
      })

      if (cumulativeIncome >= remainingIncome) break
    }

    return { totalTax, breakdown, ssnitContribution }
  }, [])

  useEffect(() => {
    const grossBasicSalaryValue = parseFloat(grossBasicSalary.replace(/,/g, '')) || 0
    const allowancesValue = parseFloat(allowances.replace(/,/g, '')) || 0
    const benefitInKindValue = parseFloat(benefitInKind.replace(/,/g, '')) || 0
    const monthlyDeductibleReliefValue = parseFloat(monthlyDeductibleRelief.replace(/,/g, '')) || 0

    const grossRemuneration = grossBasicSalaryValue + allowancesValue + benefitInKindValue

    const { totalTax, breakdown, ssnitContribution } = calculateTax(grossRemuneration, grossBasicSalaryValue, monthlyDeductibleReliefValue)
    const totalDeductions = totalTax + ssnitContribution
    const netIncomeValue = grossRemuneration - totalDeductions
    const effectiveTaxRate = grossRemuneration > 0 ? (totalDeductions / grossRemuneration) * 100 : 0

    setResults({
      grossRemuneration,
      grossBasicSalary: grossBasicSalaryValue,
      allowances: allowancesValue,
      benefitInKind: benefitInKindValue,
      monthlyDeductibleRelief: monthlyDeductibleReliefValue,
      totalTaxPayable: totalTax,
      ssnitContribution,
      totalDeductions,
      netIncome: netIncomeValue,
      effectiveTaxRate,
      breakdown,
    })
  }, [grossBasicSalary, allowances, benefitInKind, monthlyDeductibleRelief, calculateTax])

  const handleNumberChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, '')
    const parts = value.split('.')
    if (parts[0].length > 3) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }
    setter(parts.join('.'))
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-0">
      <Card className="w-full max-w-[1024px] mx-auto my-auto">
        <CardHeader className="flex flex-row items-center space-x-4 pb-10 px-4 lg:px-6">
          <div>
            <CardTitle className="text-2xl font-bold text-center text-gray-900">GHANA INCOME TAX CALCULATOR 2024</CardTitle>
            <p className="text-center text-gray-500 mt-2">
              Enter your gross monthly basic salary and other details to calculate your monthly tax and take-home pay.
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="grossBasicSalary" className="block text-sm font-medium text-gray-700 mb-1">Gross Monthly Basic Salary (GHS)</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">GHS</span>
                  <Input
                    id="grossBasicSalary"
                    type="text"
                    value={grossBasicSalary}
                    onChange={handleNumberChange(setGrossBasicSalary)}
                    placeholder="Enter gross monthly basic salary"
                    className="w-full rounded-l-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="allowances" className="block text-sm font-medium text-gray-700 mb-1">Allowances (GHS)</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">GHS</span>
                  <Input
                    id="allowances"
                    type="text"
                    value={allowances}
                    onChange={handleNumberChange(setAllowances)}
                    placeholder="Enter allowances"
                    className="w-full rounded-l-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="benefitInKind" className="block text-sm font-medium text-gray-700 mb-1">Benefit in Kind (GHS)</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">GHS</span>
                  <Input
                    id="benefitInKind"
                    type="text"
                    value={benefitInKind}
                    onChange={handleNumberChange(setBenefitInKind)}
                    placeholder="Enter benefit in kind"
                    className="w-full rounded-l-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="monthlyDeductibleRelief" className="block text-sm font-medium text-gray-700 mb-1">Monthly Deductible Relief (GHS)</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">GHS</span>
                  <Input
                    id="monthlyDeductibleRelief"
                    type="text"
                    value={monthlyDeductibleRelief}
                    onChange={handleNumberChange(setMonthlyDeductibleRelief)}
                    placeholder="Enter monthly deductible relief"
                    className="w-full rounded-l-none"
                  />
                </div>
              </div>
            </div>

            {results && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    Estimated Monthly Take-Home Pay
                  </h3>
                  <span className="text-4xl font-bold text-gray-900">
                    GHS {formatNumber(results.netIncome)}
                  </span>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Gross Remuneration:</span>
                      <span className="font-medium">GHS {formatNumber(results.grossRemuneration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Tax Payable:</span>
                      <span className="font-medium">GHS {formatNumber(results.totalTaxPayable)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SSNIT Contribution (5.5%):</span>
                      <span className="font-medium">GHS {formatNumber(results.ssnitContribution)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Deductions:</span>
                      <span className="font-medium text-red-600">GHS {formatNumber(results.totalDeductions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Effective Tax Rate:</span>
                      <span className="font-medium">{results.effectiveTaxRate.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Show Detailed Breakdown
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Detailed Tax Breakdown</DialogTitle>
                      <DialogDescription>
                        This breakdown shows how your income tax is calculated across different tax brackets.
                      </DialogDescription>
                    </DialogHeader>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bracket</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Taxable Amount</TableHead>
                          <TableHead>Tax for Bracket</TableHead>
                          <TableHead>Cumulative Income</TableHead>
                          <TableHead>Cumulative Tax</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>SSNIT Contribution</TableCell>
                          <TableCell>5.5%</TableCell>
                          <TableCell>GHS {formatNumber(results.grossBasicSalary)}</TableCell>
                          <TableCell>GHS {formatNumber(results.ssnitContribution)}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        {results.breakdown.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.bracket}</TableCell>
                            <TableCell>{item.rate}</TableCell>
                            <TableCell>{item.taxableAmount}</TableCell>
                            <TableCell>{item.taxForBracket}</TableCell>
                            <TableCell>{item.cumulativeIncome}</TableCell>
                            <TableCell>{item.cumulativeTax}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}