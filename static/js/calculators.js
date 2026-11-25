/**
 * StockUnboxed Mathematical Calculation Engine (Module 4.2)
 * Statutory Brokerage, STT, GST, Stamp Duty, SEBI turnover, SIP & Risk Math
 */
(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else {
    root.StockUnboxedMath = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * 1. Multi-Broker Brokerage, STT & Statutory Tax Calculator
   */
  function calculateBrokerageAndTaxes(params) {
    const buyPrice = parseFloat(params.buyPrice) || 0;
    const sellPrice = parseFloat(params.sellPrice) || 0;
    const qty = parseInt(params.qty, 10) || 0;
    const segment = (params.segment || 'delivery').toLowerCase(); // delivery, intraday, futures, options
    const exchange = (params.exchange || 'NSE').toUpperCase(); // NSE, BSE
    const broker = params.broker || {
      broker_name: 'Standard Broker',
      delivery_fee_pct: 0.0,
      delivery_flat_max: 0.0,
      intraday_fee_pct: 0.03,
      intraday_flat_max: 20.0,
      futures_fee_pct: 0.03,
      futures_flat_max: 20.0,
      options_flat_per_order: 20.0,
      dp_charge_per_sell: 15.34,
    };

    const turnover = (buyPrice + sellPrice) * qty;
    const grossPnL = (sellPrice - buyPrice) * qty;

    // Brokerage per segment
    let brokerage = 0;
    if (segment === 'delivery') {
      const buyFee = Math.min(buyPrice * qty * ((broker.delivery_fee_pct || 0) / 100), broker.delivery_flat_max || 0);
      const sellFee = Math.min(sellPrice * qty * ((broker.delivery_fee_pct || 0) / 100), broker.delivery_flat_max || 0);
      brokerage = buyFee + sellFee;
    } else if (segment === 'intraday') {
      const buyFee = Math.min(buyPrice * qty * ((broker.intraday_fee_pct || 0.03) / 100), broker.intraday_flat_max || 20);
      const sellFee = Math.min(sellPrice * qty * ((broker.intraday_fee_pct || 0.03) / 100), broker.intraday_flat_max || 20);
      brokerage = buyFee + sellFee;
    } else if (segment === 'futures') {
      const buyFee = Math.min(buyPrice * qty * ((broker.futures_fee_pct || 0.03) / 100), broker.futures_flat_max || 20);
      const sellFee = Math.min(sellPrice * qty * ((broker.futures_fee_pct || 0.03) / 100), broker.futures_flat_max || 20);
      brokerage = buyFee + sellFee;
    } else if (segment === 'options') {
      brokerage = (broker.options_flat_per_order || 20) * 2;
    }

    // STT (Securities Transaction Tax)
    let stt = 0;
    if (segment === 'delivery') {
      stt = Math.round(turnover * 0.001); // 0.1% on buy & sell
    } else if (segment === 'intraday') {
      stt = Math.round((sellPrice * qty) * 0.00025); // 0.025% on sell
    } else if (segment === 'futures') {
      stt = Math.round((sellPrice * qty) * 0.0002); // 0.02% on sell
    } else if (segment === 'options') {
      stt = Math.round((sellPrice * qty) * 0.001); // 0.1% on sell premium
    }

    // Exchange Transaction Charges
    let exchangeTxnCharge = 0;
    if (segment === 'delivery' || segment === 'intraday') {
      exchangeTxnCharge = turnover * (exchange === 'NSE' ? 0.0000297 : 0.0000375);
    } else if (segment === 'futures') {
      exchangeTxnCharge = turnover * 0.0000173;
    } else if (segment === 'options') {
      exchangeTxnCharge = turnover * 0.0003503;
    }

    // SEBI Turnover Charges (₹10 / Crore = 0.000001)
    const sebiCharge = turnover * 0.000001;

    // Stamp Duty (Buy side only)
    let stampDuty = 0;
    if (segment === 'delivery') {
      stampDuty = Math.round((buyPrice * qty) * 0.00015);
    } else if (segment === 'intraday' || segment === 'options') {
      stampDuty = Math.round((buyPrice * qty) * 0.00003);
    } else if (segment === 'futures') {
      stampDuty = Math.round((buyPrice * qty) * 0.00002);
    }

    // GST (18% on Brokerage + Exchange Txn + SEBI)
    const gst = 0.18 * (brokerage + exchangeTxnCharge + sebiCharge);

    // DP Charges (Delivery sell only)
    const dpCharge = segment === 'delivery' ? (broker.dp_charge_per_sell || 15.34) : 0;

    const totalCharges = brokerage + stt + exchangeTxnCharge + sebiCharge + stampDuty + gst + dpCharge;
    const netPnL = grossPnL - totalCharges;

    // Breakeven price per share
    const breakevenPoints = qty > 0 ? (totalCharges / qty) : 0;

    return {
      turnover: parseFloat(turnover.toFixed(2)),
      grossPnL: parseFloat(grossPnL.toFixed(2)),
      brokerage: parseFloat(brokerage.toFixed(2)),
      stt: parseFloat(stt.toFixed(2)),
      exchangeTxnCharge: parseFloat(exchangeTxnCharge.toFixed(2)),
      sebiCharge: parseFloat(sebiCharge.toFixed(2)),
      stampDuty: parseFloat(stampDuty.toFixed(2)),
      gst: parseFloat(gst.toFixed(2)),
      dpCharge: parseFloat(dpCharge.toFixed(2)),
      totalCharges: parseFloat(totalCharges.toFixed(2)),
      netPnL: parseFloat(netPnL.toFixed(2)),
      breakevenPoints: parseFloat(breakevenPoints.toFixed(2)),
    };
  }

  /**
   * 2. SIP + Annual Step-Up + Inflation Adjustment Calculator
   */
  function calculateSIP(params) {
    let monthlySip = parseFloat(params.monthlySip) || 5000;
    const expectedReturnPct = parseFloat(params.expectedReturnPct) || 12;
    const years = parseInt(params.years, 10) || 10;
    const stepUpPct = parseFloat(params.stepUpPct) || 0;
    const adjustInflation = Boolean(params.adjustInflation);
    const inflationPct = parseFloat(params.inflationPct) || 6;

    const totalMonths = years * 12;
    const monthlyRate = (expectedReturnPct / 100) / 12;

    let totalInvested = 0;
    let nominalCorpus = 0;

    for (let m = 1; m <= totalMonths; m++) {
      if (m > 1 && (m - 1) % 12 === 0 && stepUpPct > 0) {
        monthlySip = monthlySip * (1 + stepUpPct / 100);
      }
      totalInvested += monthlySip;
      nominalCorpus = (nominalCorpus + monthlySip) * (1 + monthlyRate);
    }

    let finalCorpus = nominalCorpus;
    if (adjustInflation && inflationPct > 0) {
      finalCorpus = nominalCorpus / Math.pow(1 + (inflationPct / 100), years);
    }

    const wealthGain = finalCorpus - totalInvested;

    return {
      totalInvested: Math.round(totalInvested),
      nominalCorpus: Math.round(nominalCorpus),
      finalCorpus: Math.round(finalCorpus),
      wealthGain: Math.round(wealthGain),
      isInflationAdjusted: adjustInflation,
    };
  }

  /**
   * 3. Position Size & Capital Risk Calculator
   */
  function calculatePositionSize(params) {
    const accountCapital = parseFloat(params.accountCapital) || 100000;
    const riskPct = parseFloat(params.riskPct) || 1.0;
    const entryPrice = parseFloat(params.entryPrice) || 100;
    const stopLossPrice = parseFloat(params.stopLossPrice) || 95;

    const maxRiskAmount = accountCapital * (riskPct / 100);
    const perShareRisk = Math.abs(entryPrice - stopLossPrice);
    const recommendedShares = perShareRisk > 0 ? Math.floor(maxRiskAmount / perShareRisk) : 0;
    const requiredCapital = recommendedShares * entryPrice;
    const capitalExposurePct = accountCapital > 0 ? (requiredCapital / accountCapital) * 100 : 0;

    return {
      maxRiskAmount: parseFloat(maxRiskAmount.toFixed(2)),
      perShareRisk: parseFloat(perShareRisk.toFixed(2)),
      recommendedShares: recommendedShares,
      requiredCapital: parseFloat(requiredCapital.toFixed(2)),
      capitalExposurePct: parseFloat(capitalExposurePct.toFixed(2)),
    };
  }

  /**
   * 4. Financial Ratio Calculator
   */
  function calculateFinancialRatios(params) {
    const ebit = parseFloat(params.ebit) || 0;
    const capitalEmployed = parseFloat(params.capitalEmployed) || 1;
    const netIncome = parseFloat(params.netIncome) || 0;
    const shareholderEquity = parseFloat(params.shareholderEquity) || 1;
    const totalDebt = parseFloat(params.totalDebt) || 0;

    const roce = capitalEmployed !== 0 ? (ebit / capitalEmployed) * 100 : 0;
    const roe = shareholderEquity !== 0 ? (netIncome / shareholderEquity) * 100 : 0;
    const debtToEquity = shareholderEquity !== 0 ? totalDebt / shareholderEquity : 0;

    return {
      roce: parseFloat(roce.toFixed(2)),
      roe: parseFloat(roe.toFixed(2)),
      debtToEquity: parseFloat(debtToEquity.toFixed(2)),
    };
  }

  return {
    calculateBrokerageAndTaxes: calculateBrokerageAndTaxes,
    calculateSIP: calculateSIP,
    calculatePositionSize: calculatePositionSize,
    calculateFinancialRatios: calculateFinancialRatios,
  };
});
