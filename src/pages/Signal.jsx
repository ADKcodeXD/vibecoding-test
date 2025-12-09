import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart, 
  Bar,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  BrainCircuit,
  AlertTriangle,
  Search,
  Settings,
  Flame,
  Sigma,
  Scale,
  Info,
  ToggleLeft,
  ToggleRight,
  MousePointer2,
  Star
} from 'lucide-react';

const POPULAR_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'pepe', symbol: 'PEPE', name: 'Pepe' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
];

const COIN_MAP = {
  'btc': 'bitcoin',
  'eth': 'ethereum',
  'sol': 'solana',
  'doge': 'dogecoin',
  'xrp': 'ripple',
  'pepe': 'pepe',
  'bnb': 'binancecoin',
  'ada': 'cardano',
  'avax': 'avalanche-2',
  'link': 'chainlink',
  'matic': 'matic-network'
};

const DEFAULT_FACTOR_CONFIG = {
  'ALPHA_006': true,
  'ALPHA_012': true,
  'TS_RANK_20': true,
  'STAT_SKEW': true,
  'MATH_VOL_RATIO': true,
  'TECH_ADX': true,
  'REL_BTC_ALPHA': true,
  'TECH_RSI': true,
  'TECH_BOLL': true,
  'ALPHA_009': true,
  'TECH_MACD': true
};

// --- SVG 可视化组件 (用于悬浮窗) ---

const VisualDiagram = ({ type, signal }) => {
  const color = signal === 'BULLISH' ? '#34d399' : signal === 'BEARISH' ? '#f43f5e' : '#94a3b8';
  
  if (type === 'BREAKOUT') {
    return (
      <svg width="100" height="60" viewBox="0 0 100 60" className="opacity-80">
        <line x1="0" y1="30" x2="100" y2="30" stroke="#475569" strokeDasharray="4" />
        <path d="M10 50 L30 40 L50 45 L70 20 L90 10" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="70" cy="20" r="3" fill={color} />
        <text x="5" y="20" fontSize="8" fill="#64748b">Resistance</text>
      </svg>
    );
  }
  if (type === 'REVERSION') {
    return (
      <svg width="100" height="60" viewBox="0 0 100 60" className="opacity-80">
        <path d="M10 30 Q 30 5 50 30 T 90 30" fill="none" stroke="#475569" strokeWidth="1" opacity="0.5" />
        <path d="M10 50 L30 10 L50 30 L90 35" fill="none" stroke={color} strokeWidth="2" />
        <line x1="0" y1="30" x2="100" y2="30" stroke="#64748b" strokeDasharray="2" />
        <text x="5" y="55" fontSize="8" fill="#64748b">Mean</text>
      </svg>
    );
  }
  if (type === 'CORRELATION') {
    return (
      <svg width="100" height="60" viewBox="0 0 100 60" className="opacity-80">
        <path d="M10 40 L40 30 L60 35 L90 20" fill="none" stroke={color} strokeWidth="2" />
        <path d="M10 50 L40 45 L60 55 L90 40" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="3" />
        <text x="5" y="15" fontSize="8" fill="#64748b">Correlation Logic</text>
      </svg>
    );
  }
  if (type === 'TREND') {
    return (
      <svg width="100" height="60" viewBox="0 0 100 60" className="opacity-80">
        <path d="M10 50 C 30 50, 40 40, 90 10" fill="none" stroke={color} strokeWidth="3" />
        <rect x="70" y="30" width="10" height="20" fill="#475569" opacity="0.3" />
        <rect x="82" y="20" width="10" height="30" fill={color} opacity="0.5" />
        <text x="5" y="20" fontSize="8" fill="#64748b">Trend Strength</text>
      </svg>
    );
  }
  // Divergence
  return (
    <svg width="100" height="60" viewBox="0 0 100 60" className="opacity-80">
      <path d="M10 40 L50 20 L90 15" fill="none" stroke={color} strokeWidth="2" />
      <path d="M10 50 L50 55 L90 58" fill="none" stroke="#64748b" strokeWidth="2" />
      <text x="5" y="15" fontSize="8" fill="#64748b">Divergence</text>
    </svg>
  );
}

// --- 高级数学计算核心 (Quant Math Utils) ---

const calculateSMA = (data, period) => {
  if (data.length < period) return 0;
  return data.slice(-period).reduce((a, b) => a + b, 0) / period;
};

const calculateCovariance = (x, y, n) => {
  if (x.length < n || y.length < n) return 0;
  const xSlice = x.slice(-n);
  const ySlice = y.slice(-n);
  const xMean = xSlice.reduce((a, b) => a + b, 0) / n;
  const yMean = ySlice.reduce((a, b) => a + b, 0) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += (xSlice[i] - xMean) * (ySlice[i] - yMean);
  }
  return sum / (n - 1);
};

const calculateStdDev = (data, n) => {
  if (data.length < n) return 0;
  const slice = data.slice(-n);
  const mean = slice.reduce((a, b) => a + b, 0) / n;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
  return Math.sqrt(variance);
};

const calculateCorrelation = (x, y, n) => {
  const cov = calculateCovariance(x, y, n);
  const stdX = calculateStdDev(x, n);
  const stdY = calculateStdDev(y, n);
  if (stdX === 0 || stdY === 0) return 0;
  return cov / (stdX * stdY);
};

const calculateTsRank = (data, n) => {
  if (data.length < n) return 0.5;
  const slice = data.slice(-n);
  const current = slice[slice.length - 1];
  const sorted = [...slice].sort((a, b) => a - b);
  const rank = sorted.indexOf(current) + 1;
  return rank / n;
};

const calculateSkewness = (data, n) => {
  if (data.length < n) return 0;
  const slice = data.slice(-n);
  const mean = slice.reduce((a, b) => a + b, 0) / n;
  const std = calculateStdDev(data, n);
  if (std === 0) return 0;
  
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += Math.pow((slice[i] - mean) / std, 3);
  }
  return sum / n;
};

// ADX Calculation
const calculateADX = (data, period) => {
  if (data.length < period * 2) return { adx: 0, pdi: 0, mdi: 0 };

  let trs = [], pdms = [], mdms = [];
  
  for(let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i-1].price;
    
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trs.push(tr);

    const upMove = high - data[i-1].high;
    const downMove = data[i-1].low - low;

    pdms.push((upMove > downMove && upMove > 0) ? upMove : 0);
    mdms.push((downMove > upMove && downMove > 0) ? downMove : 0);
  }

  // Simplified Smoothed averages for demo (Wilder's Smoothing is recursive)
  const smooth = (arr) => {
    const result = [];
    let sum = 0;
    // Initial SMA
    for(let i=0; i<period; i++) sum += arr[i];
    result.push(sum/period);
    // Smoothing
    for(let i=period; i<arr.length; i++) {
      result.push((result[result.length-1] * (period-1) + arr[i]) / period);
    }
    return result;
  };

  const str = smooth(trs);
  const spdm = smooth(pdms);
  const smdm = smooth(mdms);

  const pdis = [], mdis = [], dxs = [];

  for(let i=0; i<str.length; i++) {
    const pdi = (spdm[i] / str[i]) * 100;
    const mdi = (smdm[i] / str[i]) * 100;
    pdis.push(pdi);
    mdis.push(mdi);
    const dx = (Math.abs(pdi - mdi) / (pdi + mdi)) * 100;
    dxs.push(dx);
  }

  const adx = smooth(dxs);
  
  return {
    adx: adx[adx.length-1],
    pdi: pdis[pdis.length-1],
    mdi: mdis[mdis.length-1]
  };
};

const delta = (data, lag) => {
  if (data.length <= lag) return 0;
  return data[data.length - 1] - data[data.length - 1 - lag];
};

const calculateEMA = (data, period) => {
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
};

const calculateRSI = (data, period) => {
  if (data.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = data[i].price - data[i - 1].price;
    if (change > 0) gains += change;
    else losses -= change;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].price - data[i - 1].price;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateBollingerBands = (data, period, stdDevMultiplier) => {
    if (data.length < period) return null;
    const sma = calculateSMA(data, period);
    const std = calculateStdDev(data, period);
    return {
        upper: sma + std * stdDevMultiplier,
        lower: sma - std * stdDevMultiplier,
        width: (std * stdDevMultiplier * 2) / sma // Normalized width
    };
};

// --- Alpha 因子工厂 ---

const analyzeAlphaFactors = (
  data, 
  btcData, 
  params,
  config
) => {
  if (data.length < 30) return [];

  const closes = data.map(d => d.price);
  const opens = data.map(d => d.open);
  const volumes = data.map(d => d.volume);
  const returns = closes.map((c, i) => i === 0 ? 0 : (c - closes[i-1])/closes[i-1]);

  const factors = [];

  // 1. Alpha #6 (Correlation)
  if (config['ALPHA_006']) {
    const corrOpenVol = calculateCorrelation(opens, volumes, 10);
    const alpha6Value = -1 * corrOpenVol;
    factors.push({
      id: 'ALPHA_006',
      name: 'Alpha #006 (Corr)',
      description: '价格与成交量的负相关性因子',
      mathLogic: 'Corr(Open, Vol) > 0 意味着诱多，信号取反。',
      value: alpha6Value.toFixed(3),
      signal: alpha6Value > 0.2 ? 'BULLISH' : alpha6Value < -0.2 ? 'BEARISH' : 'NEUTRAL',
      score: alpha6Value > 0.2 ? 0.8 : alpha6Value < -0.2 ? -0.8 : 0,
      category: 'ALPHA101',
      confidence: Math.abs(alpha6Value),
      visualType: 'CORRELATION'
    });
  }

  // 2. Alpha #12 (Volume Delta Reversion)
  if (config['ALPHA_012']) {
    const deltaVol = delta(volumes, 1);
    const deltaClose = delta(closes, 1);
    const alpha12Value = Math.sign(deltaVol) * (-1 * deltaClose);
    const alpha12Signal = alpha12Value > 0 ? 'BULLISH' : 'BEARISH';
    factors.push({
      id: 'ALPHA_012',
      name: 'Alpha #012 (Vol-Rev)',
      description: '放量反转因子',
      mathLogic: '当成交量剧增(Delta Vol > 0)时，押注价格反转。',
      value: alpha12Value.toFixed(2),
      signal: Math.abs(deltaVol/volumes[volumes.length-2]) < 0.05 ? 'NEUTRAL' : alpha12Signal,
      score: alpha12Value > 0 ? 0.6 : -0.6,
      category: 'ALPHA101',
      confidence: 0.6,
      visualType: 'REVERSION'
    });
  }

  // 3. TsRank (Price Location)
  if (config['TS_RANK_20']) {
    const priceRank = calculateTsRank(closes, 20);
    let rankSignal = 'NEUTRAL';
    if (priceRank > 0.9) rankSignal = 'BULLISH';
    if (priceRank < 0.1) rankSignal = 'BEARISH';
    factors.push({
      id: 'TS_RANK_20',
      name: 'TsRank (Price, 20)',
      description: '20日价格分位值',
      mathLogic: 'Rank(Price, 20) > 0.9 表示突破历史高位。',
      value: priceRank.toFixed(2),
      signal: rankSignal,
      score: priceRank > 0.8 ? 0.7 : priceRank < 0.2 ? -0.7 : 0,
      category: 'MATH',
      confidence: Math.abs(priceRank - 0.5) * 2,
      visualType: 'BREAKOUT'
    });
  }

  // 4. Skewness
  if (config['STAT_SKEW']) {
    const skew = calculateSkewness(returns, 30);
    factors.push({
      id: 'STAT_SKEW',
      name: 'Return Skewness',
      description: '收益率偏度 (尾部风险)',
      mathLogic: 'Skew < -0.5 意味着近期频繁暴跌，风险积聚。',
      value: skew.toFixed(3),
      signal: skew > 0.5 ? 'BULLISH' : skew < -0.5 ? 'BEARISH' : 'NEUTRAL',
      score: skew > 0.5 ? 0.6 : skew < -0.5 ? -0.9 : 0,
      category: 'STATISTICAL',
      confidence: Math.min(Math.abs(skew), 1),
      visualType: 'REVERSION'
    });
  }

  // 5. Vol Ratio
  if (config['MATH_VOL_RATIO']) {
    const std5 = calculateStdDev(closes, 5);
    const std20 = calculateStdDev(closes, 20);
    const volRatio = std20 === 0 ? 1 : std5 / std20;
    const currentPrice = closes[closes.length-1];
    const ma5 = calculateSMA(closes, 5);
    const isTrendUp = currentPrice > ma5;
    let volSignal = 'NEUTRAL';
    if (volRatio > 1.2) volSignal = isTrendUp ? 'BULLISH' : 'BEARISH';
    
    factors.push({
      id: 'MATH_VOL_RATIO',
      name: 'Vol Ratio (5/20)',
      description: '短长周期波动率比值',
      mathLogic: 'Std(5) / Std(20) > 1.2 意味着变盘在即。',
      value: volRatio.toFixed(2),
      signal: volSignal,
      score: volSignal === 'BULLISH' ? 0.5 : volSignal === 'BEARISH' ? -0.5 : 0,
      category: 'STATISTICAL',
      confidence: Math.min(Math.max(volRatio - 1, 0), 1),
      visualType: 'BREAKOUT'
    });
  }

  // 6. ADX (New)
  if (config['TECH_ADX']) {
    const { adx, pdi, mdi } = calculateADX(data, params.adxPeriod);
    let adxSignal = 'NEUTRAL';
    let conf = 0;
    
    // ADX > 25 意味着有趋势
    if (adx > 25) {
      if (pdi > mdi) {
        adxSignal = 'BULLISH';
        conf = (adx - 20) / 50; // Normalize somewhat
      } else {
        adxSignal = 'BEARISH';
        conf = (adx - 20) / 50;
      }
    }

    factors.push({
      id: 'TECH_ADX',
      name: `ADX Trend (${params.adxPeriod})`,
      description: '平均趋向指数 (趋势强度)',
      mathLogic: 'ADX > 25 且 DI+ > DI- 确认上升趋势成立。',
      value: adx.toFixed(1),
      signal: adxSignal,
      score: adxSignal === 'BULLISH' ? 0.7 : adxSignal === 'BEARISH' ? -0.7 : 0,
      category: 'TREND',
      confidence: Math.min(conf, 1),
      visualType: 'TREND'
    });
  }

  // 7. BTC Relative Strength (New)
  // 7. BTC Relative Strength (New)
  if (config['REL_BTC_ALPHA'] && btcData.length > 20) {
    // 简单的相对强弱：(Token Return - BTC Return) over 5 days
    const tokenRet5d = (closes[closes.length-1] - closes[closes.length-6]) / closes[closes.length-6];
    
    // Ensure we align dates roughly or just take last 5 days of BTC data
    const btcCloses = btcData.map(d => d.price);
    const btcRet5d = (btcCloses[btcCloses.length-1] - btcCloses[btcCloses.length-6]) / btcCloses[btcCloses.length-6];
    
    const alpha = tokenRet5d - btcRet5d;
    let btcSignal = 'NEUTRAL';
    if (alpha > 0.05) btcSignal = 'BULLISH'; // Outperforming BTC by 5%
    else if (alpha < -0.05) btcSignal = 'BEARISH'; // Underperforming

    factors.push({
      id: 'REL_BTC_ALPHA',
      name: 'BTC Relative Alpha',
      description: '相对于BTC的超额收益 (5D)',
      mathLogic: 'Return(Token) - Return(BTC) > 5% 意味着独立走强。',
      value: `${(alpha * 100).toFixed(2)}%`,
      signal: btcSignal,
      score: btcSignal === 'BULLISH' ? 0.9 : btcSignal === 'BEARISH' ? -0.5 : 0,
      category: 'RELATIVE',
      confidence: Math.min(Math.abs(alpha) * 10, 1),
      visualType: 'DIVERGENCE'
    });
  }

  // 8. RSI
  if (config['TECH_RSI']) {
    const rsi = calculateRSI(data, 14);
    let rsiSignal = 'NEUTRAL';
    if (rsi < 30) rsiSignal = 'BULLISH';
    if (rsi > 70) rsiSignal = 'BEARISH';
    
    factors.push({
      id: 'TECH_RSI',
      name: 'RSI (14)',
      description: '相对强弱指数',
      mathLogic: 'RSI < 30 超卖 (看多)，RSI > 70 超买 (看空)。',
      value: rsi.toFixed(1),
      signal: rsiSignal,
      score: rsiSignal === 'BULLISH' ? 0.6 : rsiSignal === 'BEARISH' ? -0.6 : 0,
      category: 'MOMENTUM',
      confidence: Math.abs(rsi - 50) / 50,
      visualType: 'REVERSION'
    });
  }

  // 9. Bollinger Bands Width
  if (config['TECH_BOLL']) {
    const bb = calculateBollingerBands(closes, 20, 2);
    if(bb) {
        const percentB = (closes[closes.length-1] - bb.lower) / (bb.upper - bb.lower);
        let bbSignal = 'NEUTRAL';
        if (percentB < 0) bbSignal = 'BULLISH'; // Price below lower band
        if (percentB > 1) bbSignal = 'BEARISH'; // Price above upper band
        
        factors.push({
          id: 'TECH_BOLL',
          name: 'Bollinger %B',
          description: '布林带位置指标',
          mathLogic: '%B < 0 跌破下轨 (超卖)，%B > 1 突破上轨 (超买)。',
          value: percentB.toFixed(2),
          signal: bbSignal,
          score: bbSignal === 'BULLISH' ? 0.7 : bbSignal === 'BEARISH' ? -0.7 : 0,
          category: 'VOLATILITY',
          confidence: Math.abs(percentB - 0.5) * 2,
          visualType: 'BREAKOUT'
        });
    }
  }

  // 10. Alpha #009 (Min Close 5 days)
  if (config['ALPHA_009']) {
      const close = closes[closes.length-1];
      const min5 = Math.min(...closes.slice(-6, -1)); // Min of previous 5 days
      const alpha9Signal = close < min5 ? 'BULLISH' : 'NEUTRAL';
      const deltaMin = (min5 - close) / close;
      
      factors.push({
          id: 'ALPHA_009',
          name: 'Alpha #009 (Min Reversion)',
          description: '5日新低反转因子',
          mathLogic: 'Close < Min(Close[t-1]...Close[t-5]) 且 DeltaMin > 0 -> 看多。',
          value: deltaMin > 0 ? `-${(deltaMin*100).toFixed(2)}%` : '0%',
          signal: alpha9Signal,
          score: alpha9Signal === 'BULLISH' ? 0.8 : 0,
          category: 'ALPHA101',
          confidence: deltaMin > 0.05 ? 0.9 : 0.4,
          visualType: 'REVERSION'
      });
  }
  
  // 11. MACD Trend
  if (config['TECH_MACD']) {
      const ema12 = calculateEMA(closes, 12);
      const ema26 = calculateEMA(closes, 26);
      const macdLine = ema12 - ema26;
      // Very rough approximation of Signal Line for demo without full series history calculation
      // For proper MACD we need full series EMA. This is simplified 'snapshot' logic.
      const macdSignal = macdLine > 0 ? 'BULLISH' : 'BEARISH';
      
      factors.push({
          id: 'TECH_MACD',
          name: 'MACD Trend (Approx)',
          description: '平滑异同移动平均线',
          mathLogic: 'MACD Line > 0 看多趋势，< 0 看空趋势。',
          value: macdLine.toFixed(2),
          signal: macdSignal,
          score: macdSignal === 'BULLISH' ? 0.5 : -0.5,
          category: 'TREND',
          confidence: 0.5, // Low confidence due to simplified calc
          visualType: 'TREND'
      });
  }

  return factors;
};

// --- Tooltip Component ---

const FactorTooltip = ({ factor, style }) => (
  <div style={style} className="fixed z-50 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
    <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
      {factor.signal === 'BULLISH' ? <TrendingUp className="text-emerald-400" size={16}/> : 
       factor.signal === 'BEARISH' ? <TrendingDown className="text-rose-400" size={16}/> : 
       <Activity className="text-slate-400" size={16}/>}
      <span className="font-bold text-slate-200 text-sm">{factor.name}</span>
    </div>
    
    <div className="flex justify-center my-3 bg-slate-950/50 rounded-lg py-2 border border-slate-800/50">
      <VisualDiagram type={factor.visualType} signal={factor.signal} />
    </div>

    <div className="space-y-2">
      <div>
        <span className="text-[10px] text-slate-500 uppercase font-bold">Logic</span>
        <p className="text-xs text-slate-300 leading-relaxed">{factor.mathLogic}</p>
      </div>
      <div>
        <span className="text-[10px] text-slate-500 uppercase font-bold">Description</span>
        <p className="text-xs text-slate-400 leading-relaxed">{factor.description}</p>
      </div>
      <div className="flex justify-between items-center pt-2 mt-1">
        <span className="text-[10px] text-slate-500">Value: <span className="text-slate-300 font-mono">{factor.value}</span></span>
        <span className="text-[10px] text-slate-500">Conf: <span className="text-indigo-400">{(factor.confidence * 100).toFixed(0)}%</span></span>
      </div>
    </div>
  </div>
);


// --- 主组件 ---

export default function Signal() {
  const [coinId, setCoinId] = useState('bitcoin');
  const [searchVal, setSearchVal] = useState('');
  const [days, setDays] = useState('90');
  const [data, setData] = useState([]);
  const [btcData, setBtcData] = useState([]); // New: Store BTC data for comparison
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredFactor, setHoveredFactor] = useState(null);
  const [hoveredFactorPos, setHoveredFactorPos] = useState({ x: 0, y: 0 });
  
  // Favorites Logic
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('vibe_crypto_favs');
    return saved ? JSON.parse(saved) : ['bitcoin', 'ethereum', 'solana'];
  });

  useEffect(() => {
    localStorage.setItem('vibe_crypto_favs', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  // Config & Params
  const [factorConfig, setFactorConfig] = useState(DEFAULT_FACTOR_CONFIG);
  const [params, setParams] = useState({
    windowShort: 5,
    windowLong: 20,
    volatilityWindow: 14,
    adxPeriod: 14
  });

  // Data Fetching Helper
  const fetchCoinData = async (id, duration) => {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${duration}&interval=daily`
    );
    if (!response.ok) throw new Error(`Fetch failed for ${id}`);
    const raw = await response.json();
    
    // Enhanced Data Processing for OHL
    return raw.prices.map((item, index) => {
      const price = item[1];
      const vol = raw.total_volumes[index] ? raw.total_volumes[index][1] : 0;
      // Synthetic OHL for demo (since free API is limited)
      // We use a pseudo-random seed based on timestamp to keep it consistent across renders if re-fetched
      const seed = item[0] % 10000; 
      const volatility = price * 0.04;
      
      return {
        time: new Date(item[0]).toLocaleDateString(undefined, {month:'numeric', day:'numeric'}),
        timestamp: item[0],
        price: price,
        open: price + (Math.sin(seed) - 0.5) * volatility, 
        high: price + Math.abs(Math.cos(seed)) * volatility,
        low: price - Math.abs(Math.cos(seed)) * volatility,
        volume: vol
      };
    });
  };

  const fetchData = async (overrideId) => {
    const targetId = overrideId || coinId;
    setLoading(true);
    setError(null);
    try {
      // Fetch Target Coin
      const coinPromise = fetchCoinData(targetId, days);
      
      // Fetch BTC for comparison (if target is not BTC)
      const btcPromise = targetId !== 'bitcoin' ? fetchCoinData('bitcoin', days) : Promise.resolve([]);

      const [targetData, btcDataRes] = await Promise.all([coinPromise, btcPromise]);
      
      setData(targetData);
      setBtcData(targetId === 'bitcoin' ? targetData : btcDataRes); // If target is BTC, compare to self (0 alpha) or use ETH logic later

    } catch (err) {
      // Fallback Simulation
      console.warn("API limit, using simulation");
      const mock = [];
      let price = 50000; 
      let ts = Date.now() - parseInt(days) * 86400000;
      for(let i=0; i<parseInt(days); i++) {
        price = price * (1 + (Math.random()-0.48)*0.05);
        mock.push({
          time: new Date(ts).toLocaleDateString(),
          timestamp: ts,
          price,
          open: price * 0.99,
          high: price * 1.02,
          low: price * 0.98,
          volume: Math.random() * 10000000
        });
        ts += 86400000;
      }
      setData(mock);
      setBtcData(mock); // Mock BTC as same
      setError("网络受限 (使用模拟数据)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [coinId, days]);

  const factors = useMemo(() => analyzeAlphaFactors(data, btcData, params, factorConfig), [data, btcData, params, factorConfig]);

  const overallSignal = useMemo(() => {
    const activeFactors = factors.filter(f => f.signal !== 'NEUTRAL');
    const totalScore = factors.reduce((acc, f) => acc + f.score, 0);
    const count = factors.length || 1;
    const ratio = totalScore / count; 
    
    if (ratio > 0.3) return { text: 'Alpha Long (多头)', color: 'text-indigo-400', icon: TrendingUp, desc: `多头因子占比 ${(ratio*100).toFixed(0)}%` };
    if (ratio < -0.3) return { text: 'Alpha Short (空头)', color: 'text-pink-500', icon: TrendingDown, desc: `空头风险极高` };
    return { text: 'Alpha Neutral (中性)', color: 'text-slate-400', icon: Scale, desc: '多空力量均衡' };
  }, [factors]);

  const toggleFactor = (id) => {
    setFactorConfig(prev => ({...prev, [id]: !prev[id]}));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const term = searchVal.trim().toLowerCase();
    if(term) {
        const mapped = COIN_MAP[term] || term;
        setCoinId(mapped);
    }
  };

  const currentPrice = data.length ? data[data.length-1].price : 0;
  const change24h = data.length > 1 ? (data[data.length-1].price - data[data.length-2].price)/data[data.length-2].price * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 p-4 font-mono selection:bg-indigo-500/30">
      <div className="w-full px-4 space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20">
              <Sigma className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                Quant<span className="text-indigo-400">Alpha</span> Pro
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500 text-white font-normal">v2.0</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">高级多因子量化分析终端</p>
            </div>
          </div>
             
          <div className="flex items-center gap-3 w-full md:w-auto">
             <form onSubmit={handleSearchSubmit} className="relative group flex-1 md:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4 group-focus-within:text-indigo-400" />
               <input 
                 type="text" 
                 value={searchVal}
                 onChange={(e) => setSearchVal(e.target.value)}
                 placeholder="Search Symbol (e.g. solana)" 
                 list="coin-suggestions"
                 className="w-full bg-[#151921] border border-slate-800 text-xs rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500/50 transition-all text-slate-300"
               />
               <datalist id="coin-suggestions">
                 {Object.keys(COIN_MAP).map(k => <option key={k} value={k} />)}
                 {POPULAR_COINS.map(c => <option key={c.id} value={c.name} />)}
               </datalist>
             </form>
             <button 
               onClick={() => setShowSettings(!showSettings)}
               className={`p-2.5 rounded-lg border transition-all ${showSettings ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-[#151921] border-slate-800 text-slate-400 hover:text-slate-200'}`}
             >
               <Settings size={18} />
             </button>
          </div>

        </header>
        
        {/* Favorites Bar */}
        {favorites.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {favorites.map(fav => (
                    <button key={fav} onClick={() => setCoinId(fav)} className={`flex-none px-3 py-1 rounded-full text-[10px] border transition-all ${coinId === fav ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-[#151921] border-slate-800 text-slate-400 hover:border-slate-600'}`}>
                        {fav}
                    </button>
                ))}
            </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-[#151921] border border-indigo-500/30 rounded-xl p-5 animate-in slide-in-from-top-2">
             <div className="flex items-center gap-2 mb-4">
               <BrainCircuit size={16} className="text-indigo-400"/>
               <h3 className="text-sm font-bold text-slate-200">因子引擎配置 (Factor Engine)</h3>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {Object.keys(DEFAULT_FACTOR_CONFIG).map(key => (
                 <div key={key} 
                      onClick={() => toggleFactor(key)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        factorConfig[key] 
                        ? 'bg-indigo-500/10 border-indigo-500/30' 
                        : 'bg-slate-900 border-slate-800 opacity-60'
                      }`}>
                   <span className="text-xs font-medium text-slate-300">{key.replace(/_/g, ' ')}</span>
                   {factorConfig[key] ? <ToggleRight className="text-indigo-400" size={20}/> : <ToggleLeft className="text-slate-600" size={20}/>}
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Chart & Summary */}
          <div className="lg:col-span-8 space-y-4">
            {/* Price Card */}
            <div className="flex flex-wrap justify-between items-end bg-[#151921] p-5 rounded-xl border border-slate-800/50">
               <div>
                 <div className="flex items-center gap-3 mb-1">
                   <h2 className="text-2xl font-bold text-white capitalize">{coinId}</h2>
                   {coinId !== 'bitcoin' && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">
                        vs BTC
                      </span>
                   )}
                    <button onClick={() => toggleFavorite(coinId)} className="ml-2 hover:scale-110 transition-transform">
                        <Star size={18} className={favorites.includes(coinId) ? "fill-yellow-400 text-yellow-400" : "text-slate-600 hover:text-yellow-400"} />
                    </button>
                 </div>
                 <div className="text-4xl font-bold tracking-tight text-slate-100 mt-2">
                   ${currentPrice.toLocaleString(undefined, {maximumFractionDigits: 4})}
                 </div>
               </div>
               <div className={`text-right ${change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                 <div className="flex items-center justify-end gap-1">
                   {change24h >= 0 ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                   <span className="text-2xl font-bold">{Math.abs(change24h).toFixed(2)}%</span>
                 </div>
                 <div className="text-[10px] text-slate-500 mt-1 font-medium uppercase tracking-wide">24H Change</div>
               </div>
            </div>

            {/* Chart */}
            <div className="h-[400px] w-full bg-[#151921] rounded-xl border border-slate-800/50 p-1 relative shadow-lg">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.4} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#475569" 
                    tick={{fontSize: 10, fill: '#64748b'}} 
                    tickMargin={10}
                    minTickGap={40}
                    axisLine={false}
                  />
                  <YAxis 
                    orientation="right"
                    domain={['auto', 'auto']} 
                    stroke="#475569" 
                    tick={{fontSize: 10, fill: '#64748b'}}
                    tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val.toFixed(2)}
                    axisLine={false}
                    width={50}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    fill="url(#colorPrice)" 
                  />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="absolute top-4 left-4 flex gap-1 bg-black/40 p-1 rounded-lg backdrop-blur-md border border-white/5">
                {['30', '90', '365'].map(d => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`px-3 py-1 text-[10px] font-medium rounded transition-all ${days === d ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    {d}D
                  </button>
                ))}
              </div>
            </div>

             {/* Signal Summary Card */}
             <div className="bg-[#151921] border border-slate-800/50 p-6 rounded-xl flex items-center justify-between relative overflow-hidden">
               <div className={`absolute left-0 top-0 w-1 h-full ${overallSignal.color.replace('text-', 'bg-')}`}></div>
               <div className="flex items-center gap-5 z-10">
                 <div className={`p-4 rounded-full bg-[#0b0e14] border border-slate-800 ${overallSignal.color} shadow-lg`}>
                   <overallSignal.icon size={32} />
                 </div>
                 <div>
                   <h3 className={`font-bold text-xl ${overallSignal.color}`}>{overallSignal.text}</h3>
                   <p className="text-sm text-slate-400 mt-1">{overallSignal.desc}</p>
                 </div>
               </div>
               <div className="text-right hidden sm:block z-10">
                 <div className="text-3xl font-bold text-slate-200">{factors.filter(f => f.signal !== 'NEUTRAL').length}</div>
                 <div className="text-[10px] uppercase text-slate-500 tracking-wider">Active Signals</div>
               </div>
             </div>
          </div>

          {/* Right: Factors List */}
          <div className="lg:col-span-4 flex flex-col h-full bg-[#151921] rounded-xl border border-slate-800/50 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800/50 flex items-center justify-between bg-[#1a1f29]">
               <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                 <Flame size={16} className="text-orange-400" />
                 Alpha Drivers
               </h3>
               <span className="text-[10px] text-slate-500">{factors.length} metrics</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 relative">
              {factors.length === 0 && (
                <div className="text-center text-slate-500 text-xs py-10">暂无活跃因子或数据不足</div>
              )}
              
              {factors.map((factor, idx) => (
                <div 
                  key={idx} 
                  className="relative p-4 rounded-xl bg-[#0b0e14] border border-slate-800/50 hover:border-indigo-500/40 hover:bg-[#11141d] transition-all cursor-help group"
                  onMouseEnter={(e) => {
                    setHoveredFactor(factor.id);
                    setHoveredFactorPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setHoveredFactor(null)}
                >

                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                       {factor.category === 'RELATIVE' ? <BrainCircuit size={14} className="text-pink-400" /> : <Activity size={14} className="text-slate-500" />}
                       <span className="font-bold text-sm text-slate-200">{factor.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        factor.signal === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-400' : 
                        factor.signal === 'BEARISH' ? 'bg-rose-500/20 text-rose-400' : 
                        'bg-slate-700/50 text-slate-500'
                      }`}>
                        {factor.signal}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-slate-500">{factor.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


      
      {/* Global Tooltip Portal */}
      {hoveredFactor && (
        <FactorTooltip 
            factor={factors.find(f => f.id === hoveredFactor)} 
            style={{ 
                left: Math.min(hoveredFactorPos.x + 20, window.innerWidth - 280), // Prevent overflow right
                top: Math.min(hoveredFactorPos.y - 100, window.innerHeight - 300) > 0 ? Math.min(hoveredFactorPos.y - 100, window.innerHeight - 300) : hoveredFactorPos.y + 20 // Flip if too close to top? Roughly positioning
            }} 
        />
      )}
    </div>
  );
}
