export function buildMockChatReply(userMessage: string, financialContext: string): string {
  const q = userMessage.toLowerCase();
  const prefix =
    '[Mock advisor — set AI_PROVIDER=anthropic and ANTHROPIC_API_KEY for real Claude replies.]\n\n';

  if (/loan|emi|lakh|eligible|eligibility/.test(q)) {
    return `${prefix}From your statement summary:\n${financialContext}\n\nRule of thumb: keep total EMIs under ~40% of stable monthly income and hold at least 3× monthly EMI as average balance. Compare your Loan Readiness Score on the analysis page before applying.`;
  }

  if (/spend|overspend|unnecessary|where/.test(q)) {
    return `${prefix}Check the spending breakdown chart — food delivery and shopping often dominate discretionary outflows. ${financialContext.split('\n').find(l => l.includes('Top Spending')) ?? ''}\n\nPick one category to cut 10–15% next month and re-upload to track progress.`;
  }

  if (/saving|savings/.test(q)) {
    return `${prefix}${financialContext}\n\nA savings rate above 20% is strong for loan applications; 10–15% is workable if obligations are low.`;
  }

  return `${prefix}Here's what we know from your data:\n${financialContext}\n\nAsk about loans, spending, or savings — or switch off mock mode for detailed Claude advice.`;
}