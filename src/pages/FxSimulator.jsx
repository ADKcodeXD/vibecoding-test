import React, { useEffect, useRef, useState } from 'react';
import './FxSimulator.css';

// --- Constants & Config ---
const TRANSLATIONS = {
    ja: {
        reset: "リセット",
        leverage_label: "レバレッジ",
        equity_label: "有効証拠金 (Equity)",
        next_label: "次足",
        hint_label: "ヒント: スクロールで拡大/縮小 • スライダーで価格操作",
        ob_title: "板情報 (BOOK)",
        ob_vol: "Vol",
        control_label: "操作",
        reset_view: "最新へ戻る",
        lot_label: "ロット",
        avg_price_label: "平均建値",
        pl_label: "含み損益 (P/L)",
        btn_sell: "売 (SELL)",
        btn_buy: "買 (BUY)",
        market_open: "MARKET OPEN",
        entry_short: "建値",
        current_short: "現在",
        settings_title: "設定 (Settings)",
        language_label: "言語 (Language)",
        initial_balance: "初期証拠金",
        market_regime: "市場トレンド",
        regime_auto: "AUTO (ランダム)",
        regime_bull: "BULL (上昇)",
        regime_range: "RANGE (レンジ)",
        regime_bear: "BEAR (下降)",
        control_range: "操作幅",
        volatility_label: "変動率 (Volatility)",
        vol_low: "低 (0.1)",
        vol_normal: "中 (0.2)",
        vol_high: "高 (0.8)",
        vol_extreme: "極大 (2.0)",
        btn_cancel: "キャンセル",
        btn_apply: "適用 & リセット",
        alert_margin: "証拠金不足です！",
        alert_liquidation: "ロスカット執行！口座残高がゼロになりました。",
        trend_range: "RANGE (レンジ)",
        trend_bull: "UP TREND (上昇)",
        trend_bear: "DOWN TREND (下降)",
        pos_none: "ポジションなし",
        alert_liq_msg: "ロスカット執行！(爆倉)\n口座残高がゼロになりました。\n左上の「RESET」ボタンで再開してください。",
        confirm_reset: "シミュレーションをリセットしますか？"
    },
    en: {
        reset: "RESET",
        leverage_label: "Leverage",
        equity_label: "Equity",
        next_label: "Next",
        hint_label: "Hint: Scroll to zoom • Slider to control price",
        ob_title: "ORDER BOOK",
        ob_vol: "Vol",
        control_label: "Control",
        reset_view: "Reset View",
        lot_label: "Lots",
        avg_price_label: "Avg Price",
        pl_label: "Profit/Loss",
        btn_sell: "SELL",
        btn_buy: "BUY",
        market_open: "MARKET OPEN",
        entry_short: "Entry",
        current_short: "Curr",
        settings_title: "Settings",
        language_label: "Language",
        initial_balance: "Initial Balance",
        market_regime: "Market Regime",
        regime_auto: "AUTO",
        regime_bull: "BULL (Up)",
        regime_range: "RANGE (Flat)",
        regime_bear: "BEAR (Down)",
        control_range: "Control Range",
        volatility_label: "Volatility",
        vol_low: "Low (0.1)",
        vol_normal: "Normal (0.2)",
        vol_high: "High (0.8)",
        vol_extreme: "Extreme (2.0)",
        btn_cancel: "Cancel",
        btn_apply: "Apply & Reset",
        alert_margin: "Insufficient Margin!",
        alert_liquidation: "Liquidation triggered! Balance is zero.",
        trend_range: "RANGE",
        trend_bull: "UP TREND",
        trend_bear: "DOWN TREND",
        pos_none: "NO POSITION",
        alert_liq_msg: "Liquidation Triggered!\nBalance is zero.\nPlease click 'RESET' to restart.",
        confirm_reset: "Are you sure you want to reset the simulation?"
    },
    zh: {
        reset: "重置",
        leverage_label: "杠杆",
        equity_label: "净值 (Equity)",
        next_label: "下根K线",
        hint_label: "提示: 滚轮缩放 • 拖动滑块控制价格",
        ob_title: "订单薄 (BOOK)",
        ob_vol: "量",
        control_label: "控制",
        reset_view: "回看最新",
        lot_label: "手数",
        avg_price_label: "持仓成本",
        pl_label: "浮动盈亏",
        btn_sell: "做空 (SELL)",
        btn_buy: "做多 (BUY)",
        market_open: "市场开启",
        entry_short: "成本",
        current_short: "现价",
        settings_title: "设置",
        language_label: "语言 (Language)",
        initial_balance: "初始资金",
        market_regime: "市场走势",
        regime_auto: "AUTO (随机)",
        regime_bull: "BULL (震荡上行)",
        regime_range: "RANGE (震荡)",
        regime_bear: "BEAR (震荡下行)",
        control_range: "控制幅度",
        volatility_label: "波动幅度",
        vol_low: "低 (0.1)",
        vol_normal: "标准 (0.2)",
        vol_high: "高 (0.8)",
        vol_extreme: "极高 (2.0)",
        btn_cancel: "取消",
        btn_apply: "应用并重置",
        alert_margin: "保证金不足！",
        alert_liquidation: "爆仓！余额归零。",
        trend_range: "震荡 (RANGE)",
        trend_bull: "多头趋势 (UP)",
        trend_bear: "空头趋势 (DOWN)",
        pos_none: "无持仓",
        alert_liq_msg: "爆仓警告！\n账户余额已归零。\n请点击左上角「重置」按钮重新开始。",
        confirm_reset: "确定要重置模拟器吗？"
    }
};

const LEVERAGE_STEPS = [1, 10, 20, 25, 50, 100, 200, 500, 1000];

export default function FxSimulator() {
  // Use Refs for heavy simulation state to avoid re-renders
  const state = useRef({
    price: 97.450,
    initialBalance: 1000000, 
    balance: 1000000,
    equity: 1000000,
    leverage: 20, 
    position: null, 
    candles: [],
    lastCandleTime: 0,
    offsetX: 0,
    regime: 'auto',
    regimeTimer: 0,
    trendStrength: 0,
    momentum: 0,
    isUserInteracting: false,
    dragStartPrice: null,
    userTargetPrice: null, 
    language: 'zh',
    // Config part that can change
    symbol: 'AUDJPY', 
    lotSize: 100000,
    spread: 0.015,
    marketTickRate: 100, 
    candleInterval: 3000,
    visibleCandles: 30,
    paddingTopBottom: 0.3,
    rightGutter: 50,
    sliderRange: 2.5, 
    volatilityMultiplier: 0.2, 
    maPeriod: 14,
    symbols: {
        'AUDJPY': { base: 97.450, vol: 0.015 },
        'USDJPY': { base: 150.000, vol: 0.025 }
    }
  });

  // UI Refs used for direct manipulation (Canvas, Inputs)
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const chartContainerRef = useRef(null);
  
  // React State for UI strings/values that updates less frequently or needs re-render
  // To avoid lag, we might manually update DOM for high-freq items like price ticker
  // But for this port we use some React State.
  const [lang, setLang] = useState('zh');
  const [uiState, setUiState] = useState({
      equity: 1000000,
      pl: 0,
      price: 0,
      btnBuyPrice: 0,
      btnSellPrice: 0,
      topLeverage: "1:20",
      lots: 1.0,
      cost: "0.000",
      lotPercent: 0,
      posInfo: null, // { type, size, entry, current }
      marketStatus: { text: "RANGE", class: "bg-slate-800 text-slate-500" },
      timer: 0,
      settingsOpen: false,
      obAsks: [],
      obBids: [],
      obCurrent: 0,
      obCurrentClass: "text-slate-400"
  });

  const [settingsForm, setSettingsForm] = useState({
      language: 'zh',
      balance: 10000,
      volatility: 0.2,
      range: 2.5,
      regime: 'auto'
  });

  const requestRef = useRef();

  // Helpers
  const t = (key) => TRANSLATIONS[lang][key] || key;

  // Initialization
  useEffect(() => {
    initSystem();
    const loop = () => {
        updateLoop();
        draw();
        requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);

    window.addEventListener('resize', handleResize);
    
    return () => {
        cancelAnimationFrame(requestRef.current);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  const initSystem = (isFullReset = false) => {
      const s = state.current;
      const currentSymbol = s.symbol;
      const currentLev = s.leverage;
      const configBalance = s.initialBalance || 10000;
      const configRegime = s.regime || 'auto';
      const currentLang = s.language || 'zh';

      // Reset state properties
      s.balance = configBalance;
      s.equity = configBalance;
      s.position = null;
      s.candles = [];
      s.offsetX = 0;
      s.trendStrength = 0;
      s.momentum = 0;
      s.regimeTimer = 0;

      const symConfig = s.symbols[currentSymbol];
      let p = symConfig.base + (Math.random() - 0.5) * 5.0; 
      
      let time = Date.now() - 50 * s.candleInterval;
      for(let i=0; i<50; i++) {
          const change = (Math.random() - 0.5) * (symConfig.vol * 2);
          const o = p;
          const c = p + change;
          const h = Math.max(o, c) + Math.random() * (symConfig.vol);
          const l = Math.min(o, c) - Math.random() * (symConfig.vol);
          const v = Math.random() * 100;
          s.candles.push({ time, open: o, high: h, low: l, close: c, volume: v });
          p = c;
          time += s.candleInterval;
      }
      s.price = p;
      s.lastCandleTime = Date.now();
      startNewCandle(p);

      updateUI();
      updateOrderBook(p);
  };

  const startNewCandle = (p) => {
      const s = state.current;
      const now = Date.now();
      s.lastCandleTime = now;
      s.candles.push({ time: now, open: p, high: p, low: p, close: p, volume: 0 });
      if(s.candles.length > 300) s.candles.shift();
  };

  const updateLoop = () => {
      const s = state.current;
      const now = Date.now();
      
      // Market Tick
      if (now - (s.lastTickTime || 0) > s.marketTickRate) {
          s.lastTickTime = now;
          const newPrice = updateMarketLogic();
          setPrice(newPrice);
      }
  };

  const updateMarketLogic = () => {
      const s = state.current;
      // Regime Logic
      if (s.regime === 'auto') {
          s.regimeTimer--;
          if(s.regimeTimer <= 0) {
              const rand = Math.random();
              if(rand < 0.5) switchRegimeInternal('range');
              else if (rand < 0.75) switchRegimeInternal('bull');
              else switchRegimeInternal('bear');
              s.regimeTimer = 50 + Math.floor(Math.random() * 100); 
          }
      } else {
          if (s.trendStrength === 0 && s.regime !== 'range' && s.regime !== 'auto') {
              switchRegimeInternal(s.regime);
          }
      }

      let change = 0;
      const symConfig = s.symbols[s.symbol];
      const noise = (Math.random() - 0.5) * (symConfig.vol * s.volatilityMultiplier);

      if(s.trendStrength === 0) { 
          change = noise * 1.5;
      } else {
          s.momentum = s.momentum * 0.95 + s.trendStrength * 0.05;
          change = s.momentum + noise;
      }
      
      let baseP = s.isUserInteracting && s.userTargetPrice !== null ? s.userTargetPrice : s.price;
      
      // Volume
      const volBase = Math.random() * 5;
      const volMultiplier = s.isUserInteracting ? 15 : 1; 
      const tickVol = volBase * volMultiplier;
      
      const currentCandle = s.candles[s.candles.length - 1];
      if (currentCandle) {
          currentCandle.volume = (currentCandle.volume || 0) + tickVol;
      }

      return baseP + change;
  };

  const switchRegimeInternal = (type) => {
      const s = state.current;
      if (type === 'range') s.trendStrength = 0;
      else if (type === 'bull') s.trendStrength = 0.0002 + Math.random() * 0.0002;
      else if (type === 'bear') s.trendStrength = -0.0002 - Math.random() * 0.0002;
      
      // Update status text in UIState
      let key = 'trend_range';
      let style = 'bg-slate-800 text-slate-500';
      if (type === 'bull') { key = 'trend_bull'; style = 'bg-green-900/30 text-green-400 border border-green-900/50'; }
      else if (type === 'bear') { key = 'trend_bear'; style = 'bg-red-900/30 text-red-400 border border-red-900/50'; }
      
      // We'll update this in the main updateUI throttling or direct
      // For now let's just mutating a ref for status might be better if we want avoiding renders
      // But status doesn't change 60fps, so setState is fine.
      setUiState(prev => ({...prev, marketStatus: { text: TRANSLATIONS[lang][key] || key, class: style }}));
  };

  const setPrice = (p) => {
      const s = state.current;
      s.price = p;
      const c = s.candles[s.candles.length - 1];
      if(c) {
          c.close = p;
          if(p > c.high) c.high = p;
          if(p < c.low) c.low = p;
      }
      
      const now = Date.now();
      if(now - s.lastCandleTime >= s.candleInterval) {
          startNewCandle(p);
          if(!s.isDraggingChart && s.offsetX > 0) s.offsetX = 0;
      }
      
      const remaining = Math.max(0, s.candleInterval - (now - s.lastCandleTime));
      
      // We need to update UI frequently. 
      // Instead of setState every frame, let's limit it or use refs.
      updateUI(); // usage of setState inside might be heavy. 
      
      if(Math.random() < 0.3) updateOrderBook(p);
  };

  const updateUI = () => {
     const s = state.current;
     
     // Calculate PL
     let pl = 0;
     if(s.position) {
         const diff = s.position.type === 'buy' ? s.price - s.position.price : s.position.price - s.price;
         pl = diff * s.position.lots * s.lotSize;
     }
     const equity = s.balance + pl;
     s.equity = equity;

     // Check Liquidation
     if(equity <= 0 && s.position) {
         alert(t('alert_liq_msg'));
         initSystem();
         return;
     }

     // Prepare State Updates
     const newUiState = {
         equity: Math.floor(equity),
         pl,
         price: s.price,
         btnBuyPrice: s.price + s.spread,
         btnSellPrice: s.price,
         topLeverage: "1:" + s.leverage,
         lots: uiState.lots, // Keep current user input
         cost: s.position ? s.position.price.toFixed(3) : "0.000",
         lotPercent: uiState.lotPercent,
         posInfo: s.position ? {
             type: s.position.type === 'buy' ? t('btn_buy') : t('btn_sell'),
             typeClass: s.position.type === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white',
             size: s.position.lots.toFixed(1) + " Lot",
             entry: s.position.price.toFixed(3),
             current: s.price.toFixed(3)
         } : null,
         timer: (Math.max(0, s.candleInterval - (Date.now() - s.lastCandleTime)) / 1000).toFixed(1),
         marketStatus: uiState.marketStatus // Preserve current unless changed
     };
     
     // Optimization: Only set state if significantly changed or every X frames
     // For this version, we will just setState. React 18 batching should help.
     setUiState(prev => ({ ...prev, ...newUiState }));
  };

  const updateOrderBook = (price) => {
     // Generate fake OB data
     const generate = (type, count) => {
         const arr = [];
         for(let i=1; i<=count; i++) {
             const spread = i * 0.005 + (Math.random() * 0.005);
             const p = type === 'ask' ? price + spread : price - spread;
             const vol = (Math.random() * 5 + 0.5).toFixed(2);
             arr.push({ p, vol, widthPct: Math.min(100, (vol/5)*100) });
         }
         return type === 'ask' ? arr.reverse() : arr; // Asks stored bottom-up visually? No, usually top-down. 
         // HTML implementation: Asks prepend (so reverse order of generation in loop)
         // Let's just return array and render correctly map.
     };
     const currentCandle = state.current.candles[state.current.candles.length-2];
     const prevClose = currentCandle ? currentCandle.close : price;
     const colorClass = price >= prevClose ? 'text-green-400' : 'text-red-400';

     setUiState(prev => ({
         ...prev,
         obAsks: generate('ask', 8),
         obBids: generate('bid', 8),
         obCurrent: price.toFixed(3),
         obCurrentClass: colorClass
     }));
  };

  const draw = () => {
     const cvs = canvasRef.current;
     if (!cvs || !cvs.getContext) return;
     const ctx = cvs.getContext('2d');
     const width = cvs.width;
     const height = cvs.height;
     const s = state.current;

     ctx.clearRect(0, 0, width, height);
     
     const priceHeight = height * 0.8;
     const volHeight = height * 0.2;
     const chartW = width - s.rightGutter;
     const candleW = chartW / s.visibleCandles;
     const offsetCount = Math.floor(s.offsetX / candleW);
     const endIndex = s.candles.length - 1 - offsetCount;
     const startIndex = endIndex - s.visibleCandles - 2;

     let maxP = -Infinity, minP = Infinity;
     let maxVol = 0;

     for(let i=Math.max(0, startIndex); i<=Math.min(s.candles.length-1, endIndex); i++) {
         const c = s.candles[i];
         if(c.high > maxP) maxP = c.high;
         if(c.low < minP) minP = c.low;
         if(c.volume > maxVol) maxVol = c.volume;
     }
     
     if(s.position) {
         if(s.position.price > maxP) maxP = s.position.price;
         if(s.position.price < minP) minP = s.position.price;
     }

     if(maxP === -Infinity) { maxP = s.price + 0.1; minP = s.price - 0.1; }
     if(maxVol === 0) maxVol = 100;

     const range = Math.max(maxP - minP, 0.05);
     const padding = range * s.paddingTopBottom;
     const drawMax = maxP + padding;
     const drawMin = minP - padding;

     const getPriceY = p => priceHeight - ((p - drawMin) / (drawMax - drawMin)) * priceHeight;
     const getVolHeight = v => (v / maxVol) * (volHeight * 0.9);

     // Grid
     ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1; ctx.beginPath();
     for(let i=1; i<5; i++) {
         const p = drawMin + (drawMax - drawMin)/5 * i;
         const y = getPriceY(p);
         ctx.moveTo(0, y); ctx.lineTo(width, y);
         ctx.fillStyle = '#64748b'; ctx.font = '11px JetBrains Mono';
         ctx.fillText(p.toFixed(3), chartW + 5, y + 4);
     }
     ctx.stroke();

     // Separator
     ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.beginPath();
     ctx.moveTo(0, priceHeight); ctx.lineTo(width, priceHeight);
     ctx.stroke();

     // Helper Lines (Cost / Liq)
     ctx.save(); ctx.beginPath(); ctx.rect(0, 0, chartW, priceHeight); ctx.clip();
     if(s.position) {
         const yc = getPriceY(s.position.price);
         if(yc > -20 && yc < priceHeight+20) {
             ctx.beginPath(); ctx.strokeStyle='#3b82f6'; ctx.setLineDash([5,3]); ctx.lineWidth=1;
             ctx.moveTo(0, yc); ctx.lineTo(chartW, yc); ctx.stroke();
             ctx.fillStyle='#3b82f6'; ctx.font='bold 10px JetBrains Mono';
             ctx.fillText('AVG', 5, yc - 4);
         }
         const yl = getPriceY(s.position.liquidationPrice);
         if(yl > -20 && yl < priceHeight+20) {
             ctx.beginPath(); ctx.strokeStyle='#f97316'; ctx.setLineDash([2,2]); ctx.lineWidth=1;
             ctx.moveTo(0, yl); ctx.lineTo(chartW, yl); ctx.stroke();
             ctx.fillStyle='#f97316'; ctx.font='bold 10px JetBrains Mono';
             ctx.fillText('LIQ', 5, yl - 4);
         }
     }
     ctx.setLineDash([]);

     // Candles
     for(let i=0; i<s.candles.length; i++) {
         const idxFromEnd = s.candles.length - 1 - i;
         const x = chartW + s.offsetX - (idxFromEnd * candleW) - candleW;
         
         if(x > chartW + 50 || x < -50) continue;

         const c = s.candles[i];
         const isBull = c.close >= c.open;
         const color = isBull ? '#22c55e' : '#ef4444';
         
         // Candle
         const yO = getPriceY(c.open);
         const yC = getPriceY(c.close);
         const yH = getPriceY(c.high);
         const yL = getPriceY(c.low);

         ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 1;
         ctx.beginPath(); ctx.moveTo(x + candleW/2, yH); ctx.lineTo(x + candleW/2, yL); ctx.stroke();
         const hBody = Math.max(1, Math.abs(yC - yO));
         ctx.fillRect(x+1, Math.min(yO, yC), candleW-2, hBody);

         // Volume
         const vH = getVolHeight(c.volume);
         const vY = height - vH; 
         ctx.globalAlpha = 0.5;
         ctx.fillRect(x+1, vY, candleW-2, vH);
         ctx.globalAlpha = 1.0;
     }

     // MA
     ctx.beginPath();
     ctx.strokeStyle = '#fbbf24'; 
     ctx.lineWidth = 2;
     let firstPoint = true;
     for(let i=0; i<s.candles.length; i++) {
         const idxFromEnd = s.candles.length - 1 - i;
         const x = chartW + s.offsetX - (idxFromEnd * candleW) - candleW/2; 
         if(x > chartW + 100 || x < -100) continue;
         if (i < s.maPeriod - 1) continue; 
         
         let sum = 0;
         for (let k = 0; k < s.maPeriod; k++) {
             sum += s.candles[i - k].close;
         }
         const maVal = sum / s.maPeriod;
         const maY = getPriceY(maVal);

         if (firstPoint) { ctx.moveTo(x, maY); firstPoint = false; } 
         else { ctx.lineTo(x, maY); }
     }
     ctx.stroke();
     ctx.restore();

     // Cur Price Line
     const yCur = getPriceY(s.price);
     if(yCur > -20 && yCur < priceHeight + 20) {
         ctx.beginPath(); ctx.strokeStyle='#94a3b8'; ctx.setLineDash([2,2]); ctx.lineWidth=1;
         ctx.moveTo(0, yCur); ctx.lineTo(chartW, yCur); ctx.stroke(); ctx.setLineDash([]);
         
         ctx.fillStyle = s.price >= (s.candles[s.candles.length-2]?.close||0) ? '#22c55e' : '#ef4444';
         ctx.fillRect(chartW, yCur-10, s.rightGutter, 20);
         ctx.fillStyle = '#fff'; ctx.font='bold 11px JetBrains Mono';
         ctx.fillText(s.price.toFixed(3), chartW+5, yCur+4);
     }
  };

  const handleResize = () => {
      if(containerRef.current && canvasRef.current) {
          canvasRef.current.width = containerRef.current.offsetWidth;
          canvasRef.current.height = containerRef.current.offsetHeight;
      }
  };

  // Interactions
  const onTrade = (type) => {
      const s = state.current;
      const tradeLots = uiState.lots;
      const currentPrice = s.price;
      const tradePrice = type === 'buy' ? currentPrice + s.spread : currentPrice;
      const requiredMargin = (tradePrice * tradeLots * s.lotSize) / s.leverage;

      // Logic check
      if(s.position && s.position.type !== type && tradeLots > s.position.lots) {
          // Flip position
      } 
      
      let isOpeningOrAdding = true;
      if (s.position && s.position.type !== type && tradeLots <= s.position.lots) isOpeningOrAdding = false; 

      if (isOpeningOrAdding && s.equity < requiredMargin) {
          alert(`${t('alert_margin')}`);
          return;
      }

      const calculateLiquidationPrice = (entry, lots, type, bal) => {
            const move = bal / (lots * s.lotSize);
            return type === 'buy' ? entry - move : entry + move;
      };

      if (!s.position) {
            const liq = calculateLiquidationPrice(tradePrice, tradeLots, type, s.balance);
            s.position = { type, lots: tradeLots, price: tradePrice, liquidationPrice: liq, leverage: s.leverage };
      } else {
            if (s.position.type === type) {
                const totalLots = s.position.lots + tradeLots;
                const avgPrice = ((s.position.price * s.position.lots) + (tradePrice * tradeLots)) / totalLots;
                s.position.lots = totalLots;
                s.position.price = avgPrice;
                s.position.liquidationPrice = calculateLiquidationPrice(avgPrice, totalLots, type, s.balance);
            } else {
                const closeLots = Math.min(s.position.lots, tradeLots);
                const diff = s.position.type === 'buy' ? tradePrice - s.position.price : s.position.price - tradePrice;
                s.balance += diff * closeLots * s.lotSize;
                if (tradeLots < s.position.lots) {
                    s.position.lots -= tradeLots;
                    s.position.liquidationPrice = calculateLiquidationPrice(s.position.price, s.position.lots, s.position.type, s.balance);
                } else if (tradeLots === s.position.lots) {
                    s.position = null;
                } else {
                    const remainingLots = tradeLots - s.position.lots;
                    const liq = calculateLiquidationPrice(tradePrice, remainingLots, type, s.balance);
                    s.position = { type, lots: remainingLots, price: tradePrice, liquidationPrice: liq, leverage: s.leverage };
                }
            }
      }
      // Force UI update
      updateUI();
  };

  const handleSliderInput = (e) => {
      const s = state.current;
      if (!s.isUserInteracting) {
          s.isUserInteracting = true;
          s.dragStartPrice = s.price;
          s.offsetX = 0;
      }
      const percent = parseFloat(e.target.value); 
      const factor = 1 + (percent / 100);
      s.userTargetPrice = s.dragStartPrice * factor;
      if (percent === 0) s.userTargetPrice = null;
  };

  const handleSliderEnd = () => {
      const s = state.current;
      s.isUserInteracting = false;
      s.userTargetPrice = null;
      s.dragStartPrice = null;
      // Note: we can't easily reset uncontrolled slider value to 0 without ref or controlled state.
      // We'll use a controlled input for slider eventually or just key hack.
      // For now, let's make it controlled in the JSX return.
  };

  return (
    <div className="fx-simulator-page flex flex-col h-full">
        {/* Header */}
        <header className="flex-none flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 bg-slate-900 border-b border-slate-800 z-20">
            <div className="flex items-center gap-2 sm:gap-3">
                <button onClick={() => setUiState(p => ({...p, settingsOpen: true}))} className="text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-slate-800 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>

                <button onClick={() => {if(confirm(t('confirm_reset'))) initSystem();}} className="text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded px-2 py-1 text-xs transition flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    <span className="hidden sm:inline">{t('reset')}</span>
                </button>

                <div className="h-5 w-px bg-slate-700 mx-0.5 sm:mx-1"></div>

                <div className="bg-slate-800/80 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-700 flex items-center gap-2 sm:gap-3">
                    <div className="flex flex-col">
                        <select className="dark-select bg-transparent text-slate-300 text-xs font-bold outline-none border-none p-0 pr-3 cursor-pointer"
                            value={state.current.symbol} 
                            onChange={(e) => { state.current.symbol = e.target.value; initSystem(); }}>
                            <option value="AUDJPY">AUD/JPY</option>
                            <option value="USDJPY">USD/JPY</option>
                        </select>
                        <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
                            <span className="opacity-70 hidden sm:inline">{t('leverage_label')}:</span>
                            <span className="text-slate-200 font-bold">{uiState.topLeverage}</span>
                        </div>
                    </div>
                    <input type="number" readOnly className={`price-input text-right ${uiState.price >= (state.current.candles[state.current.candles.length-2]?.close||0) ? 'text-green-400' : 'text-red-400'}`} value={uiState.price.toFixed(3)} />
                </div>
                
                <div className={`hidden md:flex text-[10px] px-2 py-1 rounded font-mono uppercase tracking-wide cursor-help ${uiState.marketStatus.class}`}>
                    {uiState.marketStatus.text}
                </div>
            </div>

            <div className="text-right flex flex-col items-end justify-center">
                <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{t('equity_label')}</div>
                <div className="mono text-base sm:text-xl font-bold text-white">¥{uiState.equity.toLocaleString()}</div>
            </div>
        </header>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden bg-[#0b1221]">
             <div className="relative flex-1 bg-[#0b1221] overflow-hidden cursor-ew-resize" ref={containerRef}>
                <canvas ref={canvasRef} className="block w-full h-full" />
                
                <div className="absolute top-2 right-2 sm:top-3 sm:right-4 flex flex-col items-end gap-1 sm:gap-2 z-10" style={{ right: 60 }}>
                    <div className="pointer-events-auto">
                        <select onChange={(e) => {state.current.candleInterval = parseInt(e.target.value);}} defaultValue="3000" className="dark-select bg-slate-800/90 text-[9px] sm:text-[10px] text-slate-300 border border-slate-700 rounded-md px-2 py-0.5 sm:px-3 sm:py-1 outline-none cursor-pointer hover:border-slate-500 transition shadow-lg font-mono">
                            <option value="500">0.5s</option>
                            <option value="1000">1.0s</option>
                            <option value="3000">3.0s (Def)</option>
                            <option value="5000">5.0s</option>
                        </select>
                    </div>
                    <div className="pointer-events-none select-none text-[9px] sm:text-[10px] text-slate-600 font-mono bg-slate-900/50 px-2 py-0.5 rounded text-right w-full">
                        <span>{t('next_label')}</span>: <span className="text-slate-400">{uiState.timer}</span>s
                    </div>
                </div>
                
                <div className="absolute top-3 left-4 pointer-events-none select-none opacity-40 text-[10px] text-slate-500 hidden sm:block">
                    {t('hint_label')}
                </div>
             </div>

             {/* Order Book Panel */}
             <div className="w-40 bg-[#111827] border-l border-slate-800 flex flex-col z-20 hidden sm:flex">
                 <div className="p-2 text-[10px] text-slate-500 font-bold border-b border-slate-800 flex justify-between">
                     <span>{t('ob_title')}</span>
                     <span className="text-slate-600">{t('ob_vol')}</span>
                 </div>
                 <div className="flex-1 flex flex-col justify-end overflow-hidden pb-1">
                     {uiState.obAsks.map((ask, i) => (
                         <div key={i} className="relative order-book-row cursor-pointer hover:bg-slate-800">
                             <div className="order-book-bar bg-red-500" style={{ width: `${ask.widthPct}%` }}></div>
                             <span className="text-red-400 z-10">{ask.p.toFixed(3)}</span><span className="text-slate-400 z-10">{ask.vol}M</span>
                         </div>
                     ))}
                 </div>
                 <div className={`py-1 bg-slate-800 text-center mono text-sm font-bold border-y border-slate-700 ${uiState.obCurrentClass}`}>{uiState.obCurrent}</div>
                 <div className="flex-1 flex flex-col justify-start overflow-hidden pt-1">
                     {uiState.obBids.map((bid, i) => (
                         <div key={i} className="relative order-book-row cursor-pointer hover:bg-slate-800">
                             <div className="order-book-bar bg-green-500" style={{ width: `${bid.widthPct}%` }}></div>
                             <span className="text-green-400 z-10">{bid.p.toFixed(3)}</span><span className="text-slate-400 z-10">{bid.vol}M</span>
                         </div>
                     ))}
                 </div>
             </div>
        </div>

        {/* Bottom Panel */}
        <div className="flex-none bg-slate-900 border-t border-slate-800 p-3 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
            <div className="mb-3 flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                <span className="text-xs text-slate-400 font-bold whitespace-nowrap">{t('control_label')} (±{state.current.sliderRange}%)</span>
                <input type="range" className="price-slider flex-1" min={-state.current.sliderRange} max={state.current.sliderRange} step="0.01" 
                    onInput={handleSliderInput} 
                    onMouseUp={handleSliderEnd}
                    onTouchEnd={handleSliderEnd}
                    defaultValue="0"
                    // We need to reset this value to 0 on release. Ref access needed.
                    ref={r => { if(r && !state.current.isUserInteracting) r.value = 0; }}
                />
                <button onClick={() => state.current.offsetX = 0} className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-1 sm:px-3 sm:py-1 rounded text-slate-300 transition whitespace-nowrap">{t('reset_view')}</button>
            </div>

            <div className="grid grid-cols-12 gap-2 mb-2 sm:flex sm:gap-2">
                <div className="col-span-3 sm:w-24 flex flex-col gap-1">
                    <div className="flex justify-between items-baseline">
                        <label className="text-[9px] sm:text-[10px] text-slate-500">{t('leverage_label')}</label>
                        <span className="text-[9px] text-blue-400 font-mono">{uiState.topLeverage}</span>
                    </div>
                    <input type="range" min="0" max="8" step="1" defaultValue="2" className="mini-slider mt-1" 
                        onInput={(e) => {
                            const idx = parseInt(e.target.value);
                            state.current.leverage = LEVERAGE_STEPS[idx];
                            // Update UI immediately for responsiveness
                            setUiState(p => ({...p, topLeverage: "1:"+LEVERAGE_STEPS[idx]}));
                        }} />
                </div>
                
                <div className="col-span-5 sm:w-28 flex flex-col gap-1">
                    <div className="flex justify-between items-baseline">
                        <label className="text-[9px] sm:text-[10px] text-slate-500">{t('lot_label')}</label>
                        <span className="text-[9px] text-blue-400 font-mono">{uiState.lotPercent > 0 ? uiState.lotPercent + '%' : 'Custom'}</span>
                    </div>
                    <input type="number" className="stealth-input mono font-bold" value={uiState.lots} step="0.1" onChange={(e) => setUiState(p => ({...p, lots: parseFloat(e.target.value)}))} />
                    <input type="range" min="0" max="100" step="1" defaultValue="0" className="mini-slider mt-1" 
                        onInput={(e) => {
                            const pct = parseInt(e.target.value);
                            const s = state.current;
                            if (pct === 0) { setUiState(p => ({...p, lotPercent: 0})); return; }
                            const maxBuyingPower = s.equity * s.leverage;
                            const contractValue = s.price * s.lotSize; 
                            const maxLots = maxBuyingPower / contractValue;
                            const selectedLots = Math.floor(maxLots * (pct / 100) * 10) / 10;
                            setUiState(p => ({...p, lotPercent: pct, lots: Math.max(0.1, selectedLots)}));
                        }} />
                </div>

                <div className="col-span-4 sm:w-24 flex flex-col gap-1">
                    <label className="text-[9px] sm:text-[10px] text-slate-500 truncate">{t('avg_price_label')}</label>
                    <input type="text" disabled className={`stealth-input mono font-bold text-slate-400 h-[26px] ${uiState.posInfo ? 'text-white' : ''}`} value={uiState.cost} />
                </div>

                <div className="col-span-12 sm:flex-1 flex flex-col items-center sm:items-end justify-center sm:pr-1 bg-slate-800/30 sm:bg-transparent rounded py-1 sm:py-0">
                    <label className="text-[9px] sm:text-[10px] text-slate-500 sm:block hidden">{t('pl_label')}</label>
                    <div className={`mono text-lg font-bold ${uiState.pl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {uiState.pl >= 0 ? '+' : ''}¥{Math.floor(uiState.pl).toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Position Infobar */}
            {uiState.posInfo && (
                <div className="mb-2 p-2 rounded bg-slate-800 border border-slate-700 flex items-center justify-between min-h-[40px]">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${uiState.posInfo.typeClass}`}>{uiState.posInfo.type}</span>
                        <span className="text-base sm:text-lg font-bold text-white font-mono">{uiState.posInfo.size}</span>
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-400 font-mono flex items-center gap-2">
                        <span>{t('entry_short')}: <span className="text-slate-300">{uiState.posInfo.entry}</span></span>
                        <span className="hidden sm:inline">|</span>
                        <span>{t('current_short')}: <span className="text-slate-300">{uiState.posInfo.current}</span></span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 h-12">
                <button onClick={() => onTrade('sell')} className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-md shadow-lg flex flex-col items-center justify-center leading-none transition active:scale-[0.98] active:shadow-none">
                    <span className="font-bold text-lg">{t('btn_sell')}</span>
                    <span className="mono text-[10px] opacity-80">{uiState.btnSellPrice.toFixed(3)}</span>
                </button>
                <button onClick={() => onTrade('buy')} className="bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-md shadow-lg flex flex-col items-center justify-center leading-none transition active:scale-[0.98] active:shadow-none">
                    <span className="font-bold text-lg">{t('btn_buy')}</span>
                    <span className="mono text-[10px] opacity-80">{uiState.btnBuyPrice.toFixed(3)}</span>
                </button>
            </div>
        </div>

        {/* Settings Modal */}
        {uiState.settingsOpen && (
             <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                 <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg w-full max-w-xs shadow-2xl relative">
                     <h2 className="text-white font-bold mb-4 text-lg flex items-center gap-2">{t('settings_title')}</h2>
                     
                     <div className="mb-4">
                         <label className="block text-slate-400 text-xs mb-1">{t('language_label')}</label>
                         <select className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white focus:border-blue-500 outline-none"
                            value={settingsForm.language} onChange={e => setSettingsForm(p => ({...p, language: e.target.value}))}>
                             <option value="zh">中文 (Chinese)</option>
                             <option value="en">English</option>
                             <option value="ja">日本語 (Japanese)</option>
                         </select>
                     </div>

                     <div className="mb-4">
                         <label className="block text-slate-400 text-xs mb-1">{t('initial_balance')}</label>
                         <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono focus:border-blue-500 outline-none"
                            value={settingsForm.balance} onChange={e => setSettingsForm(p => ({...p, balance: e.target.value}))} />
                     </div>

                     <div className="flex gap-2 justify-end mt-6">
                         <button onClick={() => setUiState(p => ({...p, settingsOpen: false}))} className="px-3 py-1 text-slate-400 hover:text-white text-sm transition">{t('btn_cancel')}</button>
                         <button onClick={() => {
                             state.current.initialBalance = parseFloat(settingsForm.balance) || 10000;
                             state.current.language = settingsForm.language;
                             setLang(settingsForm.language);
                             setUiState(p => ({...p, settingsOpen: false}));
                             initSystem();
                         }} className="px-4 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold transition shadow-lg">{t('btn_apply')}</button>
                     </div>
                 </div>
             </div>
        )}
    </div>
  );
}
