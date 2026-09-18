/* ==========================================================================
   FINANCIAL BLOG ENGINE & AD TASK CONTROLLER - js/blog.js
   10-Page Educational Financial Article Curriculum + 50 Direct-Link Ads
   ========================================================================== */

// 10-PAGE ORIGINAL FINANCIAL EDUCATION CURRICULUM
const DEFAULT_FINANCIAL_PAGES = {
  page1: {
    order: 1,
    title: "Introduction to Personal Finance & Financial Health",
    subtitle: "Understanding cash flow, building your net worth baseline, and mastering financial hygiene",
    reward: 100,
    enabled: true,
    sections: [
      {
        heading: "1. The True Definition of Personal Finance",
        content: `Personal finance is not merely about accumulating currency; it is the comprehensive architecture of managing your income, spending, savings, investments, and protective hedges over your entire lifespan. At its foundation, financial independence begins with clarity. Many individuals mistakenly believe their wealth is measured by their gross salary. In reality, wealth is determined entirely by what you retain, how effectively that surplus capital is deployed, and how resilient your household balance sheet remains during unforeseen macroeconomic shocks.

To achieve meaningful control over your financial trajectory, you must first master the distinction between assets and liabilities. An asset is any resource that generates predictable positive economic value, cash yield, or long-term appreciation—such as productive equity holdings, high-yield deposit instruments, or rental properties. A liability, conversely, is an obligation that consistently siphons liquidity out of your pocket through interest rates, maintenance depreciation, and servicing fees. Distinguishing between productive debt and destructive lifestyle debt is the fundamental cornerstone of financial literacy.`
      },
      {
        heading: "2. Calculating Your Household Net Worth",
        content: `Before you can plot an effective course to financial autonomy, you must calculate an unvarnished audit of your current Net Worth. Net worth represents the absolute mathematical reality of your financial standing at any single snapshot in time. The formula is universal:

<strong>Net Worth = Total Assets − Total Liabilities</strong>

Begin by cataloging your liquid assets (checking, savings, money market balances), your invested capital (index funds, retirement accounts, company equity), and tangible physical assets at realistic market liquidation value. Next, subtract every outstanding debt obligation: credit card revolving balances, auto loans, student loans, personal notes, and residential mortgages. 

Tracking this metric quarterly rather than obsessing over day-to-day fluctuations provides a high-altitude diagnostic of whether your financial strategies are compounding or contracting.`
      },
      {
        heading: "3. The Three Pillars of Financial Hygiene",
        content: `Sustainable wealth creation relies upon three disciplined operational behaviors:

1. <strong>Cash Flow Discipline:</strong> Systematically orchestrating a surplus where your operational expenses remain strictly beneath your net take-home earnings every single calendar month.
2. <strong>Capital Preservation:</strong> Insulating your baseline lifestyle from emergency disruptions through liquidity buffers, adequate liability coverage, and risk mitigation.
3. <strong>Long-Term Productive Allocation:</strong> Channelling consistent monthly surplus into compounding assets that outpace the silent purchasing power erosion of monetary inflation.

Mastering these initial three pillars creates an impenetrable foundation upon which all sophisticated investing, tax planning, and wealth acceleration can subsequently be erected.`
      },
      {
        heading: "4. Financial Psychology & Behavioral Biases",
        content: `Financial success is rarely a pure function of mathematics; it is predominantly a discipline of behavioral psychology. Human beings are hardwired with cognitive biases that directly sabotage long-term accumulation. The most pervasive of these is 'present bias'—the irrational tendency to overvalue immediate gratification (such as purchasing a luxury gadget today) at the direct expense of exponentially greater security thirty years into the future.

Another psychological pitfall is the 'hedonic treadmill' or lifestyle inflation. As an individual's earnings escalate from $40,000 to $120,000, their baseline definition of 'necessity' subconsciously inflates to match. Premium vehicles, luxury apartments, and constant dining out quietly consume the surplus that should have purchased their freedom. Recognizing these psychological traps early empowers you to automate your investments before your willpower is even tested.`
      }
    ]
  },
  page2: {
    order: 2,
    title: "Budgeting Frameworks & Expense Optimization",
    subtitle: "Deploying the 50/30/20 model, zero-based accounting, and eliminating silent wealth leaks",
    reward: 100,
    enabled: true,
    sections: [
      {
        heading: "1. The 50/30/20 Budgeting Rule",
        content: `A budget is not a restrictive prison; it is a tactical blueprint directing every dollar where to work before the month begins. One of the most effective and time-tested operational frameworks is Senator Elizabeth Warren's 50/30/20 principle:

• <strong>50% Needs:</strong> Non-negotiable survival obligations including rent or mortgage, essential groceries, utilities, basic insurance, and baseline transportation to work.
• <strong>30% Wants:</strong> Discretionary lifestyle expenditures such as dining out, recreational travel, streaming entertainment, and hobbies.
• <strong>20% Savings & Debt Acceleration:</strong> Siphoned directly into emergency liquidity reserves, retirement vehicles, index funds, or paying down high-interest liabilities.

If your non-negotiable living costs exceed 50% due to soaring housing costs in metropolitan hubs, you must temporarily constrict the 'Wants' category down to 15% or 20% to safeguard your 20% future wealth allocation at all costs.`
      },
      {
        heading: "2. Zero-Based Budgeting: Giving Every Dollar a Job",
        content: `For individuals who require surgical control over volatile cash flows, Zero-Based Budgeting (ZBB) provides an uncompromising methodology. Under ZBB, the equation at the conclusion of each budgeting cycle must equal zero:

<strong>Income − (Expenses + Investments + Debt Paydown) = $0</strong>

This does not mean your bank account balance drops to zero. Rather, it means that every single penny of net income is deliberately allocated to a designated bucket—whether that bucket is groceries, health insurance, emergency reserves, or an S&P 500 index fund. When surplus money is left unassigned in a checking account, it inevitably evaporates on frictionless impulse spending.`
      },
      {
        heading: "3. Auditing the 'Subscription Creep' and Silent Cash Drains",
        content: `Modern consumer economies are specifically engineered to extract frictionless micro-payments through recurring digital subscriptions. Cloud software, streaming libraries, gym memberships, and meal kits silently chip away at disposable capital. A quarterly 'Subscription Audit' is mandatory.

Print your last 90 days of bank and credit card statements with a highlighter. Categorize every transaction that recurs on an automated schedule. Inquire: 'Have I actively derived tangible utility from this service in the last 30 days?' Canceling just $120 per month in dormant subscriptions and investing that exact figure into a low-cost total market index yielding 8% historically compounds into over $178,000 across 30 years.`
      },
      {
        heading: "4. The 72-Hour Rule for Discretionary Purchases",
        content: `Friction is the ultimate antidote to impulse shopping. Digital checkout mechanisms—one-click ordering, saved credit cards, and contactless pay—deliberately strip away the psychological friction of parting with money. To regain intentionality, adopt the mandatory 72-Hour Rule.

Whenever you experience the impulse to make a non-essential purchase exceeding $50, enforce an immutable 72-hour delay. Add the item to a digital wishlist, close the tab, and step away. In over 70% of instances, the acute dopamine surge that motivated the desire dissipates entirely within three days, preserving your capital for productive allocation.`
      }
    ]
  },
  page3: {
    order: 3,
    title: "Saving Strategies & Emergency Liquidity Reserves",
    subtitle: "Establishing an impenetrable 3-6 month fortress, high-yield cash vehicles, and sinking funds",
    reward: 100,
    enabled: true,
    sections: [
      {
        heading: "1. The Emergency Fund: Your Financial Immune System",
        content: `An Emergency Fund is not an investment designed to maximize capital gains; it is an emotional and financial insurance policy against catastrophic life events. Without an emergency reserve, any inevitable hiccup—a medical emergency, sudden job severance, or urgent vehicular repair—immediately converts into high-interest credit card debt or forces you to liquidate investments at the bottom of a market downturn.

A baseline emergency reserve should encompass 3 to 6 months of essential living costs. If you work in a volatile commission-based industry or run an independent consultancy, expanding that cushion to 9 or 12 months provides indispensable psychological composure during macroeconomic contractions.`
      },
      {
        heading: "2. Where to House Your Emergency Capital",
        content: `Never leave substantial emergency capital languishing in a traditional brick-and-mortar checking account earning 0.01% APY. Traditional commercial banks utilize your deposits to issue consumer loans at 15% to 25% while returning virtually zero yield to the depositor.

Instead, house your liquid buffer in an FDIC-insured High-Yield Savings Account (HYSA), a Treasury Bill ladder, or a government Money Market Fund (MMF). These instruments offer daily liquidity and maximum capital safety while generating annualized yields that dramatically blunt the corrosive impact of consumer inflation.`
      },
      {
        heading: "3. Sinking Funds: Eliminating Predictable Emergencies",
        content: `A common error in personal finance is categorizing predictable, irregular expenses as 'emergencies'. Auto insurance premiums billed semi-annually, annual property taxes, vehicle tire replacements, and holiday gifting are not emergencies—they are mathematical certainties that simply do not recur on a 30-day cadence.

Sinking Funds solve this vulnerability. Calculate the anticipated annual cost of each irregular obligation and divide by 12. Transfer that monthly quotient automatically into separate sub-accounts or earmarked buckets. When the $1,200 annual insurance invoice arrives, you execute payment painlessly from its dedicated sinking fund without disrupting your primary operating budget.`
      },
      {
        heading: "4. Automating the Savings Engine",
        content: `The golden maxim of personal wealth was coined by George S. Clason over a century ago: <em>'Pay yourself first.'</em> The fatal flaw in human psychology is attempting to save whatever scraps happen to remain at the conclusion of the month. In practice, expenses consistently expand to match whatever liquid funds remain visible in checking.

To guarantee success, automate the entire architecture. On the very morning your paycheck lands, schedule automated transfers that instantaneously route your savings and investment portions into their respective high-yield accounts and brokerage portfolios before you ever see or touch the money. If you never see the surplus in your day-to-day spending account, you effortlessly adapt to living on the remainder.`
      }
    ]
  },
  page4: {
    order: 4,
    title: "Bank Accounts, APY & The Mechanics of Interest",
    subtitle: "Simple vs compound interest, inflation erosion, and choosing optimal depository partners",
    reward: 100,
    enabled: true,
    sections: [
      {
        heading: "1. The Mathematical Miracle of Compound Interest",
        content: `Albert Einstein famously described compound interest as the eighth wonder of the world: <em>'He who understands it, earns it; he who doesn't, pays it.'</em> Simple interest calculates yield solely on the original principal balance. Compound interest, however, calculates yield on both the original principal PLUS all previously accumulated interest.

The compound growth formula governs all wealth accumulation:

<strong>A = P (1 + r/n)^(nt)</strong>

Where <em>P</em> is principal, <em>r</em> is annual nominal interest rate, <em>n</em> is compounding frequency, and <em>t</em> is time in years. Because time is positioned in the exponent, duration is the most disproportionately potent variable in the equation. Starting ten years earlier with modest sums exponentially outperforms starting a decade later with massive deposits.`
      },
      {
        heading: "2. APY vs APR: Decoding Financial Jargon",
        content: `Financial institutions intentionally toggle between two metrics depending on whether they are paying you or charging you:

• <strong>APY (Annual Percentage Yield):</strong> Reflects the actual total yield you earn on deposits across one full calendar year, including the compounding frequency. A 5% nominal rate compounded daily yields a higher APY (approx 5.13%).
• <strong>APR (Annual Percentage Rate):</strong> The simple annualized interest rate charged on borrowing, typically excluding the compounding effect or factoring in closing points and origination fees.

Always insist on comparing APY when evaluating savings yields and CD yields, and scrutinize APR along with daily periodic rates when evaluating loan instruments.`
      },
      {
        heading: "3. The Silent Thief: Real vs Nominal Returns",
        content: `If your savings account yields 4% APY but the prevailing Consumer Price Index (CPI) inflation rate is running at 3.5%, your real economic purchasing power expansion is only 0.5% before taxes. If your funds sit in a legacy checking account yielding 0.05% during a 3% inflationary epoch, you are guaranteed to lose roughly 2.95% of your purchasing capacity annually.

Cash is vital for immediate liquidity and short-term resilience, but holding excessive cash balances over decades guarantees wealth destruction. Cash is an asset that is guaranteed to depreciate against real goods, services, and productive enterprises.`
      },
      {
        heading: "4. The Rule of 72: Quick Mental Compounding",
        content: `The Rule of 72 is an indispensable mental shortcut to ascertain how many years it will take for any sum of money to double at a given annual rate of return:

<strong>Years to Double ≈ 72 ÷ Annual Rate of Return</strong>

For instance, at an 8% historical return in a broad-market index fund, your invested capital doubles approximately every 9 years (72 ÷ 8 = 9). Conversely, if you carry a credit card balance at a usurious 24% APR, the debt balance will double every 3 years (72 ÷ 24 = 3) if left compounding. The rule illustrates with visceral clarity why compounding is an ally in investing and a catastrophic adversary in consumer debt.`
      }
    ]
  },
  page5: {
    order: 5,
    title: "Understanding Loans, Credit Scores & Debt Elimination",
    subtitle: "Credit scoring algorithms, good vs bad debt, and deploying avalanche vs snowball strategies",
    reward: 100,
    enabled: true,
    sections: [
      {
        heading: "1. The Architecture of Your Credit Score",
        content: `Your credit score (typically FICO or VantageScore, ranging from 300 to 850) is the financial world's metric of your creditworthiness. A prime score (760+) saves tens or hundreds of thousands of dollars in interest over a lifetime on mortgages, commercial lines of credit, and insurance rates. The standard FICO calculation is broken down into five distinct weightings:

• <strong>Payment History (35%):</strong> Your record of on-time debt servicing. Even a single 30-day delinquency can devastate an excellent score by 80 to 100 points.
• <strong>Credit Utilization Ratio (30%):</strong> The percentage of revolving credit limits currently in use. Keep your utilization beneath 10% across all lines.
• <strong>Length of Credit History (15%):</strong> The average age of your active tradelines. Never close your oldest credit cards without a compelling fee-based reason.
• <strong>Credit Mix (10%):</strong> A healthy blend of revolving accounts (credit cards) and installment loans (mortgages, auto loans).
• <strong>New Credit & Inquiries (10%):</strong> Hard inquiries triggered when applying for financing within short windows.`
      },
      {
        heading: "2. Strategic Debt: Good Debt vs Destructive Debt",
        content: `Not all debt is inherently villainous. Debt can be classified into two distinct categories:

1. <strong>Productive / Good Debt:</strong> Low-cost, tax-deductible, or fixed-rate leverage utilized to acquire appreciating assets or enhance earning velocity—such as a conservative residential mortgage or low-interest financing for specialized professional licensing.
2. <strong>Destructive / Bad Debt:</strong> High-interest revolving debt utilized to fund depreciating lifestyle consumption. Credit card balances carrying 22% to 30% APR and payday loans are mathematical wealth destroyers that must be eradicated immediately.`
      },
      {
        heading: "3. Eradication Tactics: Avalanche vs Snowball",
        content: `If you are carrying multiple consumer liabilities, choose between two mathematically proven attack strategies:

• <strong>The Debt Avalanche Method:</strong> List all debts in descending order of interest rate (APR). Pay minimums on everything, but channel every single surplus dollar into the balance carrying the highest interest rate. Mathematically, this minimizes total interest paid and accelerates debt-freedom quickest.
• <strong>The Debt Snowball Method:</strong> List all debts in ascending order of balance size, irrespective of APR. Attack the smallest balance first until obliterated, then roll that freed-up payment into the next smallest. While slightly costlier in theoretical interest, the psychological victories of extinguishing accounts provide immense behavioral momentum.`
      },
      {
        heading: "4. Escaping the Minimum Payment Trap",
        content: `Credit card issuers deliberately set minimum monthly payments at approximately 1% to 2% of the principal balance plus accrued finance charges. This ensures the borrower remains ensnared in perpetual interest obligations. On a $7,000 balance at 22% APR, making solely the minimum monthly payment requires over 25 years to pay off and results in paying more than $14,000 in pure interest charges—double the original purchase price. Minimum payments are designed to maximize bank profit, not your financial health.`
      }
    ]
  },
  page6: {
    order: 6,
    title: "Investing Fundamentals & The Compounding Engine",
    subtitle: "Risk-adjusted returns, time horizon, dollar-cost averaging, and defeating inflation",
    reward: 100,
    enabled: true,
    sections: [
      {
        heading: "1. The Imperative of Investing",
        content: `Saving money preserves your current labor; investing money forces your stored capital to labor on your behalf. Because fiat currencies naturally experience inflationary decay as central bank money supplies expand, leaving cash idle guarantees a perpetual loss of living standards. Investing is the deliberate exchange of immediate liquidity for fractional ownership in productive economic enterprises that grow revenue, adapt to inflation, and distribute cash dividends.`
      },
      {
        heading: "2. The Risk-Return Spectrum",
        content: `In modern finance, there is no such phenomenon as high return with zero risk. Risk and expected return are inextricably linked:

• <strong>Cash & Treasury Bills:</strong> Near-zero principal volatility; minimal return; susceptible to purchasing power decay.
• <strong>Investment-Grade Corporate Bonds:</strong> Moderate yield; sensitivity to interest rate cycles.
• <strong>Equities (Public Stocks):</strong> High long-term growth potential; substantial short-term volatility and market drawdown cycles.
• <strong>Speculative Assets (Crypto, Early Venture, Derivatives):</strong> Uncapped upside potential paired with the realistic hazard of permanent capital destruction.

Your allocation across this spectrum should be dictated strictly by your time horizon and psychological risk tolerance.`
      },
      {
        heading: "3. Dollar-Cost Averaging (DCA): Removing Market Timing",
        content: `Amateur investors continually attempt to 'time the market'—hoping to sell at the apex and buy at the absolute trough. Academic empirical research repeatedly demonstrates that market timing is a statistical fool's errand. Missing just the 10 best trading days in the S&P 500 across a 20-year span cuts your total annualized return by more than half.

The superior institutional approach is Dollar-Cost Averaging (DCA). By investing a fixed, unvarying dollar amount at regular cadences (e.g. $500 on the 1st and 15th of every month), you automatically acquire fewer shares when prices are inflated and more shares when prices are discounted, eliminating emotional friction.`
      },
      {
        heading: "4. The Horizon Advantage",
        content: `In the stock market, volatility diminishes as your holding period expands. Over any given 1-day period, the stock market is roughly a 50/50 coin flip. Over a 1-year period, the market has been positive roughly 73% of the time historically. Over a rolling 20-year horizon, the broad US stock market has never produced a negative total return in historical recorded history. Time horizon transforms equity investing from a speculative gamble into a reliable wealth compounding machine.`
      }
    ]
  },
  page7: {
    order: 7,
    title: "Stocks, Mutual Funds, ETFs & Index Investing",
    subtitle: "Demystifying equities, broad-market index funds, expense ratios, and passive supremacy",
    reward: 100,
    enabled: true,
    sections: [
      {
        heading: "1. What is a Share of Stock?",
        content: `When you acquire a share of stock, you are not buying a casino betting slip or an abstract digital ticker; you are acquiring a legally binding fractional ownership stake in an actual operating corporation. You own a proportionate claim on that business's underlying assets, intellectual property, future earnings, and distributed dividend payments. When Apple sells a device, or Microsoft licenses cloud infrastructure, a fractional share of those operating profits accrues directly to you as an equity shareholder.`
      },
      {
        heading: "2. The Superiority of Low-Cost Index Funds",
        content: `In 1976, legendary Vanguard founder John C. Bogle revolutionized investing by introducing the first index mutual fund tracking the S&P 500. Instead of paying exorbitant salaries to Wall Street portfolio managers attempting to predict which individual stocks will outperform, an index fund buys fractional shares in all companies within an index proportionally.

The SPIVA (S&P Indices Versus Active) scorecard reveals year after year that over 90% of actively managed mutual funds fail to beat their passive benchmark over a 15-year period after fees. By purchasing a broad total-market index fund, you instantly secure guaranteed market-matching returns while outperforming 9 out of 10 Wall Street professionals.`
      },
      {
        heading: "3. Scrutinizing Expense Ratios: The Cost of Management",
        content: `An Expense Ratio is the annual management fee deducted directly from a fund's net asset value. While a 1.25% fee on an active mutual fund may sound trivial on paper, its compounding effect over an investor's lifetime is devastating. 

Assume an initial investment compounding at 8% before fees over 35 years:

• A fund with a 0.03% expense ratio (modern passive ETF) leaves you with over 98% of your gross compounding gains.
• A fund with a 1.25% fee siphons away over 35% of your total potential portfolio value purely in intermediary friction.

Always inspect the expense ratio and favor low-cost index ETFs or mutual funds.`
      },
      {
        heading: "4. ETFs vs Traditional Mutual Funds",
        content: `Exchange-Traded Funds (ETFs) and Mutual Funds both offer instant diversification by pooling hundreds or thousands of securities into a single vehicle. However, their mechanics differ:

• <strong>ETFs:</strong> Trade on public stock exchanges throughout the market day just like individual shares. They generally boast higher tax efficiency due to institutional 'in-kind' creation/redemption mechanisms.
• <strong>Mutual Funds:</strong> Transact once per day after market close at the calculated Net Asset Value (NAV). They allow automated fractional-share investments easily directly from checking accounts. Both are excellent vehicles when low-cost and passively indexed.`
      }
    ]
  },
  page8: {
    order: 8,
    title: "Risk Management, Asset Allocation & Diversification",
    subtitle: "Modern portfolio theory, uncorrelated assets, and insulating your wealth from drawdown shocks",
    reward: 100,
    enabled: true,
    sections: [
      {
        heading: "1. The Free Lunch of Diversification",
        content: `Nobel laureate Harry Markowitz famously proclaimed that diversification is the only 'free lunch' in finance. Diversification is the mathematical practice of allocating capital across uncorrelated or weakly correlated asset classes—such as domestic equities, international developed markets, emerging markets, government debt, real estate (REITs), and commodities.

When one specific economic sector encounters headwinds (e.g., technology during a rate-hiking cycle), other non-correlated assets (e.g., commodities, energy, or treasury bonds) frequently experience tailwinds, smoothing out overall portfolio volatility without sacrificing long-term compounding.`
      },
      {
        heading: "2. Age-Based Asset Allocation",
        content: `Your strategic asset allocation should reflect your proximity to the date you intend to start drawing on your capital:

• <strong>Accumulation Phase (Ages 20–45):</strong> Your primary asset is human capital—decades of future earning power. Your portfolio can tolerate 85%–100% equities because you have decades to ride out market corrections and buy discounted shares.
• <strong>Consolidation Phase (Ages 45–60):</strong> As your timeline shrinks, gradually introduce stabilizing fixed-income allocations (e.g., 20%–30% short-to-intermediate government bonds) to defend against a severe bear market right before retirement.
• <strong>Distribution Phase (Retirement):</strong> Capital preservation and steady cash-flow generation take precedence over hyper-growth, necessitating a balanced multi-asset portfolio.`
      },
      {
        heading: "3. The Psychological Reality of Drawdowns",
        content: `Every investor considers themselves aggressive during an extended bull market. True risk tolerance, however, is revealed during a brutal 35% market crash like 2008 or March 2020. If seeing a $100,000 balance drop to $65,000 prompts you to panic-sell your holdings into cash, your asset allocation was improperly calibrated. 

Selling at the trough crystallizes paper fluctuations into permanent capital loss. Having an adequate emergency fund and a balanced asset allocation ensures you never find yourself forced into being a forced seller during a macroeconomic panic.`
      },
      {
        heading: "4. Annual Portfolio Rebalancing",
        content: `Left unattended, a portfolio naturally drifts away from its target asset allocation. If equities have a stellar year, an initial 80/20 stock/bond split can easily drift to 90/10, leaving you unknowingly overexposed to downside risk. 

Enacting an annual rebalancing protocol—selling a small slice of what has outgrown its target and reallocating the proceeds into underperforming asset classes—forces you to adhere to the foundational investment axiom: systematically selling high and buying low.`
      }
    ]
  },
  page9: {
    order: 9,
    title: "Long-Term Wealth Planning & Retirement Architecture",
    subtitle: "Tax-advantaged compounding, safe withdrawal rate theory, and wealth preservation",
    reward: 100,
    enabled: true,
    sections: [
      {
        heading: "1. Tax-Advantaged Investment Vehicles",
        content: `Taxes represent the single largest lifetime expense for high-earning individuals. Deploying tax-advantaged investment wrappers allows your investments to compound dramatically faster:

• <strong>Pre-Tax Accounts (Traditional 401k / IRA):</strong> Contributions reduce your taxable income in the current year; investments compound tax-deferred; distributions are taxed as ordinary income upon retirement withdrawal.
• <strong>Post-Tax Accounts (Roth 401k / Roth IRA):</strong> Contributions are funded with after-tax earnings; investments compound entirely tax-free; qualified withdrawals in retirement are 100% exempt from federal and state income taxes.
• <strong>Health Savings Account (HSA):</strong> The rare 'triple tax-advantaged' unicorn: contributions are tax-deductible, growth is tax-free, and distributions for qualified medical expenses are completely tax-free.`
      },
      {
        heading: "2. The 4% Rule & Safe Withdrawal Rates",
        content: `How much capital do you need to accumulate before you can comfortably live off your investments without fear of running out of money? The Trinity Study, conducted by finance professors at Trinity University, analyzed historical market data to formulate the famous 4% Safe Withdrawal Rate rule.

To calculate your target Financial Independence (FI) number:

<strong>Target Portfolio = Annual Desired Living Expenses × 25</strong>

For example, if your household requires $60,000 annually to sustain a comfortable lifestyle, your target nest egg is $1,500,000 ($60,000 × 25). In retirement, withdrawing 4% ($60,000) in year one and adjusting subsequent annual distributions for inflation historically provided a 95%+ probability of portfolio survival over a 30-year span.`
      },
      {
        heading: "3. The Danger of Sequence of Returns Risk (SRR)",
        content: `When you are withdrawing funds in retirement rather than accumulating, the sequence of annual returns matters immensely. Experiencing a severe bear market during the first three years of retirement while simultaneously withdrawing living expenses can permanently impair the longevity of your portfolio. 

To hedge against Sequence of Returns Risk, seasoned financial planners recommend maintaining a 2-to-3-year 'cash buffer' or short-term bond tent, enabling retirees to draw living expenses from safe cash without liquidating battered equity shares during bear markets.`
      },
      {
        heading: "4. Estate Planning & Beneficiary Designations",
        content: `Building wealth without an estate plan leaves your lifetime accomplishments vulnerable to expensive probate courts, state statutory default distributions, and intra-family conflict. At minimum, every adult should maintain:

1. A clear Last Will and Testament.
2. An updated Financial and Medical Power of Attorney.
3. Explicitly assigned primary and contingent Beneficiary Designations on every bank, retirement, and brokerage account (beneficiary designations legally supersede wills and bypass probate altogether).`
      }
    ]
  },
  page10: {
    order: 10,
    title: "Common Financial Pitfalls & The Master Wealth Blueprint",
    subtitle: "Avoiding predatory traps, conquering lifestyle inflation, and executing your lifelong financial roadmap",
    reward: 100,
    enabled: true,
    sections: [
      {
        heading: "1. The Top Five Wealth-Destroying Traps",
        content: `Throughout decades of financial history, human missteps repeat with astonishing regularity. Avoid these five critical traps:

1. <strong>Financing Rapidly Depreciating Luxury Vehicles:</strong> Taking out 72-to-84-month auto loans on high-depreciation vehicles is one of the most common drains on middle-class wealth building.
2. <strong>Speculative Greed & FOMO:</strong> Chasing parabolic speculative manias (meme stocks, speculative pump-and-dump tokens, unvetted private placements) without intrinsic cash flow analysis.
3. <strong>Lack of Adequate Term Life & Disability Insurance:</strong> Failing to protect your greatest income-earning asset—yourself—against catastrophic injury or untimely death.
4. <strong>Carrying High-Interest Revolving Debt:</strong> Allowing credit card interest to compound at 25%+ destroys all other investing gains.
5. <strong>Failing to Negotiate Compensation:</strong> Over a 40-year career, failing to routinely negotiate base salary and equity compensation can cost over $1,000,000 in cumulative lifetime income.`
      },
      {
        heading: "2. The Actionable Lifelong Financial Order of Operations",
        content: `When new income arrives, execute your allocations in this disciplined, prioritized hierarchy:

1. <strong>Step 1: Emergency Starter Cushion:</strong> Secure $1,000 to $2,000 in immediate cash to break the paycheck-to-paycheck debt trap.
2. <strong>Step 2: Employer Match (Free Money):</strong> Contribute to your employer retirement plan up to the exact percentage required to harvest 100% of employer matching funds.
3. <strong>Step 3: High-Interest Debt Eradication:</strong> Aggressively eliminate all liabilities carrying interest rates exceeding 7% using the Avalanche or Snowball method.
4. <strong>Step 4: Full Emergency Fortress:</strong> Expand your liquid high-yield savings to cover 3 to 6 months of living expenses.
5. <strong>Step 5: Maximize Tax-Advantaged Accounts:</strong> Max out HSA, Roth IRA, and remaining employer 401(k) limits in low-cost index funds.
6. <strong>Step 6: Taxable Brokerage & Real Estate:</strong> Channel all residual surplus into broad-market taxable brokerage portfolios, productive real estate, or entrepreneurial ventures.`
      },
      {
        heading: "3. Final Celebration & Your Path Forward",
        content: `Congratulations on completing all 10 modules of this comprehensive Financial Education Curriculum. Financial autonomy is not a sprint conquered overnight; it is an enduring marathon fueled by consistent discipline, automated habits, and psychological temperament. 

You now possess the core principles of cash flow control, debt eradication, risk management, and exponential compounding. Click the Final Completion button below to claim your grand finale reward and cement your website task completion!`
      }
    ]
  }
};

// 50 DEFAULT DIRECT-LINK ADVERTISEMENTS (5 SLOTS PER PAGE)
function generateDefaultAds() {
  const ads = {};
  const sponsors = [
    { name: "Apex Financial Terminal", desc: "Access real-time institutional market intelligence & ETF analysis.", url: "https://finance.yahoo.com" },
    { name: "Vault Wealth Advisory", desc: "Compare top-tier FDIC-insured high-yield savings & Treasury yields.", url: "https://www.bankrate.com/banking/savings/rates/" },
    { name: "Crypto & Blockchain Insights", desc: "Explore deep-dive technical research on digital asset infrastructure.", url: "https://coinmarketcap.com" },
    { name: "Equities Direct Exchange", desc: "Discover low-cost index ETFs, dividend Aristocrats, and market trends.", url: "https://www.investopedia.com" },
    { name: "Credit Guard Protocol", desc: "Monitor your credit score & learn automated debt avalanche techniques.", url: "https://www.nerdwallet.com" }
  ];

  for (let p = 1; p <= 10; p++) {
    for (let slot = 1; slot <= 5; slot++) {
      const adId = `page${p}_ad${slot}`;
      const sp = sponsors[slot - 1];
      ads[adId] = {
        id: adId,
        pageId: `page${p}`,
        position: slot,
        title: `${sp.name} [Slot #${slot}]`,
        description: sp.desc,
        url: sp.url,
        reward: 50,
        timer: 15,
        enabled: true,
        dailyLimit: 1
      };
    }
  }
  return ads;
}

const DEFAULT_FINANCIAL_ADS = generateDefaultAds();

// Global Default Configuration Bundle for Firebase seeding
window.DEFAULT_FINANCIAL_BLOG_CONFIG = {
  enabled: true,
  title: "Financial Knowledge Task",
  totalPages: 10,
  rewardPerPage: 100,
  completionReward: 500,
  pages: DEFAULT_FINANCIAL_PAGES,
  ads: DEFAULT_FINANCIAL_ADS
};

// BLOG APPLICATION CONTROLLER
class BlogController {
  constructor() {
    this.currentPage = 1;
    this.pagesData = DEFAULT_FINANCIAL_PAGES;
    this.adsData = DEFAULT_FINANCIAL_ADS;
    this.activeTimers = {};
    this.scrollReachedBottom = false;

    this.init();
  }

  init() {
    // Listen for custom Firebase events
    window.addEventListener('websiteTaskConfigUpdated', e => {
      const config = e.detail;
      if (config) {
        if (config.pages) this.pagesData = config.pages;
        if (config.ads) this.adsData = config.ads;
        this.renderPage(this.currentPage);
      }
    });

    window.addEventListener('userProgressUpdated', e => {
      this.updateNavigationStates();
      this.updateAdCardsState();
    });

    // Check URL hash for page e.g. #page3
    const hash = window.location.hash;
    if (hash && hash.startsWith('#page')) {
      const pNum = parseInt(hash.replace('#page', ''), 10);
      if (pNum >= 1 && pNum <= 10) {
        this.currentPage = pNum;
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      this.setupReadingProgressBar();
      this.renderPageChips();
      this.renderPage(this.currentPage);
    });
  }

  setupReadingProgressBar() {
    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      const bar = document.getElementById('readingProgressBar');
      if (bar) bar.style.width = scrolled + '%';

      if (scrolled >= 85) {
        this.scrollReachedBottom = true;
      }
    });
  }

  renderPageChips() {
    const list = document.getElementById('pagesChipList');
    if (!list) return;
    list.innerHTML = '';

    for (let i = 1; i <= 10; i++) {
      const chip = document.createElement('div');
      chip.className = 'page-chip';
      chip.id = `pageChip${i}`;
      chip.innerText = i;
      chip.onclick = () => this.openPage(i);
      list.appendChild(chip);
    }
    this.updateNavigationStates();
  }

  updateNavigationStates() {
    const userProgress = window.firebaseService ? window.firebaseService.userProgress : { currentPage: 1, completedPages: {} };
    const unlockedMax = Math.max(userProgress.currentPage || 1, 1);

    for (let i = 1; i <= 10; i++) {
      const chip = document.getElementById(`pageChip${i}`);
      if (!chip) continue;
      chip.classList.toggle('active', i === this.currentPage);
      
      const isCompleted = !!userProgress.completedPages[`page${i}`];
      chip.classList.toggle('completed', isCompleted);

      const isLocked = i > unlockedMax && !isCompleted;
      chip.classList.toggle('locked', isLocked);
      if (isLocked) {
        chip.title = `Complete Page ${i - 1} to unlock Page ${i}`;
      } else {
        chip.title = `Page ${i}`;
      }
    }

    // Previous / Next button controls
    const prevBtn = document.getElementById('btnPrevPage');
    const nextBtn = document.getElementById('btnNextPage');
    if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
    if (nextBtn) {
      const isNextLocked = (this.currentPage + 1) > unlockedMax && !userProgress.completedPages[`page${this.currentPage + 1}`];
      nextBtn.disabled = this.currentPage >= 10 || isNextLocked;
    }

    // Update bottom page completion box
    this.updateBottomActionBox();
  }

  openPage(pageNum) {
    if (pageNum < 1 || pageNum > 10) return;
    const userProgress = window.firebaseService ? window.firebaseService.userProgress : { currentPage: 1, completedPages: {} };
    const unlockedMax = Math.max(userProgress.currentPage || 1, 1);

    if (pageNum > unlockedMax && !userProgress.completedPages[`page${pageNum}`]) {
      this.showToast(`Page ${pageNum} is locked! Complete Page ${pageNum - 1} first.`, 'error');
      return;
    }

    this.currentPage = pageNum;
    window.location.hash = `#page${pageNum}`;
    this.scrollReachedBottom = false;
    this.renderPage(pageNum);
    this.updateNavigationStates();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderPage(pageNum) {
    const pageKey = `page${pageNum}`;
    const pageData = this.pagesData[pageKey] || DEFAULT_FINANCIAL_PAGES[pageKey];
    if (!pageData) return;

    // Set page headers
    const pageTag = document.getElementById('articlePageTag');
    const titleEl = document.getElementById('articleTitle');
    const subtitleEl = document.getElementById('blogSubtitle');
    const indicatorEl = document.getElementById('activePageIndicator');

    if (pageTag) pageTag.innerText = `ARTICLE CHAPTER 0${pageNum} / 10`;
    if (titleEl) titleEl.innerText = pageData.title;
    if (subtitleEl) subtitleEl.innerText = pageData.subtitle || '';
    if (indicatorEl) indicatorEl.innerHTML = `Page <span>${pageNum}</span> of 10`;

    // Render Article Sections with Interleaved 5 Direct-Link Ads
    const contentContainer = document.getElementById('articleContentContainer');
    if (!contentContainer) return;
    contentContainer.innerHTML = '';

    const sections = pageData.sections || [];
    sections.forEach((sec, idx) => {
      // 1. Article Section Block
      const secDiv = document.createElement('div');
      secDiv.className = 'article-section-block';
      secDiv.innerHTML = `
        <h3>${sec.heading}</h3>
        <p>${sec.content}</p>
      `;
      contentContainer.appendChild(secDiv);

      // 2. Interleaved Direct-Link Ad Placement
      const adSlotNumber = idx + 1;
      if (adSlotNumber <= 5) {
        const adCard = this.createAdTaskCard(pageNum, adSlotNumber);
        contentContainer.appendChild(adCard);
      }
    });

    // If fewer than 5 sections existed, append remaining ads
    for (let slot = sections.length + 1; slot <= 5; slot++) {
      const adCard = this.createAdTaskCard(pageNum, slot);
      contentContainer.appendChild(adCard);
    }

    this.updateAdCardsState();
    this.updateBottomActionBox();
  }

  createAdTaskCard(pageNum, slotNum) {
    const adId = `page${pageNum}_ad${slotNum}`;
    const adConfig = (this.adsData && this.adsData[adId]) ? this.adsData[adId] : DEFAULT_FINANCIAL_ADS[adId];

    const container = document.createElement('div');
    container.className = 'ad-task-container';
    container.id = `container_${adId}`;

    if (!adConfig || adConfig.enabled === false) {
      container.style.display = 'none';
      return container;
    }

    container.innerHTML = `
      <div class="ad-task-card" id="card_${adId}">
        <div class="ad-header-row">
          <span class="ad-tag-badge">⚡ SPONSORED AD TASK #${slotNum}</span>
          <span class="ad-reward-pill">💎 +${adConfig.reward || 50} Blue Coins</span>
        </div>
        <h4 class="ad-title">${adConfig.title || 'Official Sponsor Task'}</h4>
        <p class="ad-desc">${adConfig.description || 'Visit direct sponsor link and view destination to earn your reward.'}</p>
        
        <div class="ad-action-bar">
          <div class="ad-timer-display">
            <span>Required Duration:</span>
            <span class="timer-countdown" id="timer_${adId}">${adConfig.timer || 15}s</span>
          </div>
          <button class="btn btn-primary btn-sm" id="btn_${adId}" onclick="window.blogController.handleAdClick('${adId}')">
            🔗 Visit Link & Start Timer
          </button>
        </div>
      </div>
    `;

    return container;
  }

  handleAdClick(adId) {
    const adConfig = (this.adsData && this.adsData[adId]) ? this.adsData[adId] : DEFAULT_FINANCIAL_ADS[adId];
    if (!adConfig) return;

    const userProgress = window.firebaseService ? window.firebaseService.userProgress : {};
    if (userProgress.completedAds && userProgress.completedAds[adId]) {
      this.showToast('You have already claimed this advertisement task.', 'info');
      return;
    }

    // Open direct link in a new tab safely
    window.open(adConfig.url || 'https://finance.yahoo.com', '_blank', 'noopener,noreferrer');

    // Start verification countdown timer
    this.startAdTimer(adId, adConfig.timer || 15, adConfig.reward || 50);
  }

  startAdTimer(adId, durationSeconds, rewardAmount) {
    if (this.activeTimers[adId]) return;

    const timerEl = document.getElementById(`timer_${adId}`);
    const btnEl = document.getElementById(`btn_${adId}`);
    if (timerEl) timerEl.classList.add('active');
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.innerText = '⏳ Verifying View...';
    }

    let remaining = durationSeconds;
    this.activeTimers[adId] = setInterval(async () => {
      remaining--;
      if (timerEl) timerEl.innerText = `${remaining}s`;

      if (remaining <= 0) {
        clearInterval(this.activeTimers[adId]);
        delete this.activeTimers[adId];

        if (timerEl) {
          timerEl.classList.remove('active');
          timerEl.innerText = '0s ✓';
        }

        if (btnEl) {
          btnEl.disabled = false;
          btnEl.className = 'btn btn-gold btn-sm';
          btnEl.innerText = `🎁 Claim +${rewardAmount} Blue Coins`;
          btnEl.onclick = () => this.claimAdReward(adId, rewardAmount);
        }

        this.showToast('Ad task requirement met! You can now claim your Blue Coins.', 'success');
      }
    }, 1000);
  }

  async claimAdReward(adId, amount) {
    const btnEl = document.getElementById(`btn_${adId}`);
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.innerText = 'Claiming...';
    }

    try {
      if (window.firebaseService) {
        await window.firebaseService.claimRewardAtomic('ad', adId, amount);
      }
      this.showToast(`🎉 Claimed +${amount} Blue Coins successfully!`, 'success');
      this.updateAdCardsState();
    } catch (err) {
      this.showToast(err.message || 'Error claiming ad reward', 'error');
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.innerText = `🎁 Claim +${amount} Blue Coins`;
      }
    }
  }

  updateAdCardsState() {
    const userProgress = window.firebaseService ? window.firebaseService.userProgress : {};
    const completedAds = userProgress.completedAds || {};

    for (let slot = 1; slot <= 5; slot++) {
      const adId = `page${this.currentPage}_ad${slot}`;
      const card = document.getElementById(`card_${adId}`);
      const btn = document.getElementById(`btn_${adId}`);
      const timer = document.getElementById(`timer_${adId}`);

      if (completedAds[adId]) {
        if (card) card.classList.add('claimed');
        if (timer) timer.innerText = 'Claimed ✓';
        if (btn) {
          btn.className = 'btn btn-outline btn-sm';
          btn.disabled = true;
          btn.innerText = '✅ Reward Claimed';
        }
      }
    }
  }

  updateBottomActionBox() {
    const box = document.getElementById('pageBottomActionBox');
    if (!box) return;

    const pageKey = `page${this.currentPage}`;
    const pageData = this.pagesData[pageKey] || DEFAULT_FINANCIAL_PAGES[pageKey];
    const userProgress = window.firebaseService ? window.firebaseService.userProgress : {};
    const isCompleted = !!(userProgress.completedPages && userProgress.completedPages[pageKey]);

    const infoTitle = document.getElementById('bottomActionTitle');
    const infoDesc = document.getElementById('bottomActionDesc');
    const actionBtn = document.getElementById('btnCompletePage');

    if (infoTitle) {
      infoTitle.innerText = isCompleted ? `Page ${this.currentPage} Completed!` : `Finish Page ${this.currentPage} Knowledge Chapter`;
    }

    if (infoDesc) {
      infoDesc.innerText = isCompleted
        ? `You have already collected the +${pageData.reward || 100} Blue Coins completion reward for this chapter.`
        : `Read the material and claim your +${pageData.reward || 100} Blue Coins to unlock Chapter ${this.currentPage + 1}.`;
    }

    if (actionBtn) {
      if (isCompleted) {
        actionBtn.className = 'btn btn-outline';
        actionBtn.disabled = true;
        actionBtn.innerText = '✅ Chapter Completed';
      } else {
        actionBtn.className = 'btn btn-gold';
        actionBtn.disabled = false;
        actionBtn.innerText = `🎁 Complete Page & Claim +${pageData.reward || 100} Blue Coins`;
        actionBtn.onclick = () => this.completeCurrentPage();
      }
    }
  }

  async completeCurrentPage() {
    const pageKey = `page${this.currentPage}`;
    const pageData = this.pagesData[pageKey] || DEFAULT_FINANCIAL_PAGES[pageKey];
    const amount = pageData.reward || 100;

    const btn = document.getElementById('btnCompletePage');
    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Processing Completion...';
    }

    try {
      if (window.firebaseService) {
        await window.firebaseService.claimRewardAtomic('page', pageKey, amount);
      }

      this.showToast(`🎉 Chapter ${this.currentPage} Completed! +${amount} Blue Coins awarded!`, 'success');
      this.updateNavigationStates();

      // If finished Page 10, trigger Grand Celebration Finale
      if (this.currentPage === 10) {
        this.triggerGrandFinale();
      } else {
        // Auto-advance to next unlocked page after short celebration delay
        setTimeout(() => {
          this.openPage(this.currentPage + 1);
        }, 1200);
      }
    } catch (err) {
      this.showToast(err.message || 'Error completing page', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerText = `🎁 Complete Page & Claim +${amount} Blue Coins`;
      }
    }
  }

  async triggerGrandFinale() {
    const modal = document.getElementById('celebrationModal');
    if (modal) modal.classList.add('active');

    // Claim final completion reward if not already claimed
    const userProgress = window.firebaseService ? window.firebaseService.userProgress : {};
    if (!userProgress.finalRewardClaimed) {
      try {
        await window.firebaseService.claimRewardAtomic('final', 'grand_completion', 500);
        this.showToast('🌟 GRAND FINALE BONUS: +500 Blue Coins awarded!', 'success');
      } catch (err) {
        console.warn('Final reward claim notice:', err.message);
      }
    }
  }

  closeCelebrationModal() {
    const modal = document.getElementById('celebrationModal');
    if (modal) modal.classList.remove('active');
  }

  showToast(msg, type = 'info') {
    if (window.websiteApp) {
      window.websiteApp.showToast(msg, type);
    } else {
      alert(msg);
    }
  }
}

// Instantiate Global Controller
window.blogController = new BlogController();
