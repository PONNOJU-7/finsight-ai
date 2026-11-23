import { Transaction } from '../statement/schemas/statement.schema';

const CATEGORIES = [
  'Food & Dining',
  'Rent & Housing',
  'EMI & Loans',
  'Utilities & Bills',
  'Entertainment',
  'Shopping',
  'Travel & Transport',
  'Healthcare',
  'Transfers & Misc',
] as const;

function categorize(description: string): (typeof CATEGORIES)[number] {
  const d = description.toUpperCase();
  if (/SWIGGY|ZOMATO|FOOD|DMART|GROCERY/.test(d)) return 'Food & Dining';
  if (/RENT/.test(d)) return 'Rent & Housing';
  if (/EMI|LOAN|HDFC.*LOAN/.test(d)) return 'EMI & Loans';
  if (/ELECTRICITY|BILL|UTIL/.test(d)) return 'Utilities & Bills';
  if (/NETFLIX|SUBSCRIPTION/.test(d)) return 'Entertainment';
  if (/AMAZON|SHOP/.test(d)) return 'Shopping';
  if (/UBER|OLA|CAB|TRANSPORT/.test(d)) return 'Travel & Transport';
  if (/HEALTH|HOSPITAL/.test(d)) return 'Healthcare';
  if (/SALARY|MUTUAL|SIP|TRANSFER|CREDIT/.test(d)) return 'Transfers & Misc';
  return 'Transfers & Misc';
}

function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

export function buildMockAnalysis(transactions: Transaction[]) {
  const categoryTotals: Record<string, { amount: number; count: number }> = {};
  for (const c of CATEGORIES) categoryTotals[c] = { amount: 0, count: 0 };

  const monthly: Record<string, { income: number; expenses: number }> = {};
  const merchantSpend: Record<string, number> = {};

  for (const t of transactions) {
    const mk = monthKey(t.date);
    if (!monthly[mk]) monthly[mk] = { income: 0, expenses: 0 };
    monthly[mk].income += t.credit;
    monthly[mk].expenses += t.debit;

    if (t.debit > 0) {
      const cat = categorize(t.description);
      categoryTotals[cat].amount += t.debit;
      categoryTotals[cat].count += 1;
      const merchant = t.description.slice(0, 40).trim();
      merchantSpend[merchant] = (merchantSpend[merchant] ?? 0) + t.debit;
    }
  }

  const totalSpend = Object.values(categoryTotals).reduce((s, x) => s + x.amount, 0);
  const spendingCategories = CATEGORIES.map(category => ({
    category,
    amount: Math.round(categoryTotals[category].amount),
    percentage: totalSpend > 0 ? Math.round((categoryTotals[category].amount / totalSpend) * 1000) / 10 : 0,
    transactionCount: categoryTotals[category].count,
  })).filter(c => c.amount > 0 || c.transactionCount > 0);

  const monthlyData = Object.keys(monthly)
    .sort()
    .map(month => {
      const { income, expenses } = monthly[month];
      const savings = income - expenses;
      const savingsRate = income > 0 ? (savings / income) * 100 : 0;
      return {
        month,
        income: Math.round(income),
        expenses: Math.round(expenses),
        savings: Math.round(savings),
        savingsRate: Math.round(savingsRate * 10) / 10,
      };
    });

  const salaryMonths = monthlyData.filter(m => m.income >= 50000).length;
  const incomeRegularity = Math.min(20, salaryMonths >= 3 ? 18 : salaryMonths >= 2 ? 14 : 8);

  const avgBalance =
    transactions.length > 0
      ? transactions.reduce((s, t) => s + t.balance, 0) / transactions.length
      : 0;
  const avgIncome =
    monthlyData.length > 0
      ? monthlyData.reduce((s, m) => s + m.income, 0) / monthlyData.length
      : 0;
  const averageBalance = Math.min(20, Math.round((avgBalance / Math.max(avgIncome, 1)) * 8));

  const emiSpend = categoryTotals['EMI & Loans'].amount;
  const totalIncome = transactions.reduce((s, t) => s + t.credit, 0);
  const oti = totalIncome > 0 ? emiSpend / totalIncome : 0;
  const obligationToIncomeRatio = Math.min(20, Math.max(4, Math.round(20 - oti * 40)));

  const expenseValues = monthlyData.map(m => m.expenses);
  const avgExp = expenseValues.reduce((a, b) => a + b, 0) / Math.max(expenseValues.length, 1);
  const variance =
    expenseValues.reduce((s, e) => s + (e - avgExp) ** 2, 0) / Math.max(expenseValues.length, 1);
  const cv = avgExp > 0 ? Math.sqrt(variance) / avgExp : 0;
  const spendingVolatility = Math.min(20, Math.max(6, Math.round(18 - cv * 30)));

  const bounceRate = 10;
  const lastSavings = monthlyData[monthlyData.length - 1]?.savingsRate ?? 0;
  const savingsRate = Math.min(10, Math.max(2, Math.round(lastSavings / 3)));

  const overall =
    incomeRegularity + averageBalance + obligationToIncomeRatio + spendingVolatility + bounceRate + savingsRate;

  const topMerchants = Object.entries(merchantSpend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  const latest = monthlyData[monthlyData.length - 1];

  return {
    spendingCategories,
    monthlyData,
    loanReadinessScore: {
      overall,
      incomeRegularity,
      averageBalance,
      obligationToIncomeRatio,
      spendingVolatility,
      bounceRate,
      savingsRate,
      explanation: `Mock analysis from your ${transactions.length} transactions: steady income signals, EMI load, and ~${latest?.savingsRate ?? 0}% recent savings rate. Score is heuristic (dev mode — not Claude).`,
      recommendation:
        lastSavings < 15
          ? 'Trim discretionary spend (food delivery, shopping) and keep EMI below ~40% of income before applying for new loans.'
          : 'You show reasonable savings — maintain 3+ months of EMI in average balance before a larger loan application.',
    },
    topMerchants: topMerchants.length ? topMerchants : ['N/A'],
    insights: {
      summary: `You earned ~₹${Math.round(latest?.income ?? 0)} and spent ~₹${Math.round(latest?.expenses ?? 0)} in the latest month in the statement. Loan readiness (mock): ${overall}/100.`,
      keyObservations: [
        `${salaryMonths} month(s) with strong credit inflows.`,
        `Largest spend bucket: ${spendingCategories.sort((a, b) => b.amount - a.amount)[0]?.category ?? 'N/A'}.`,
        `Average balance ≈ ₹${Math.round(avgBalance)}.`,
      ],
      warnings: oti > 0.15 ? ['EMI and loan debits are a noticeable share of inflows — lenders will scrutinize obligation ratio.'] : [],
      positives: salaryMonths >= 2 ? ['Recurring salary credits detected across multiple months.'] : ['Statement parsed successfully for review.'],
    },
  };
}