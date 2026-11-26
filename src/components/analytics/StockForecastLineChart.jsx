import React, { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp } from 'lucide-react';
import './StockForecastLineChart.css';

const StockForecastLineChart = ({
  title,
  forecastData,
  selectedTimeframe,
  onTimeframeChange,
  loading,
  metricKey = 'billing'
}) => {
  const { t, i18n } = useTranslation();
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  const timeframeOptions = [
    { id: '1D', label: t('analytics.charts.tf1D') },
    { id: '5D', label: t('analytics.charts.tf5D') },
    { id: '1M', label: t('analytics.charts.tf1M') },
    { id: '6M', label: t('analytics.charts.tf6M') },
    { id: 'YTD', label: t('analytics.charts.tfYTD') },
    { id: '1Y', label: t('analytics.charts.tf1Y') }
  ];

  const chartGeometry = useMemo(() => {
    const hist = forecastData?.historical_points || [];
    const fcst = forecastData?.forecast_points || [];
    if (hist.length === 0) return null;

    const fcstTail = fcst.length > 1 ? fcst.slice(1) : [];
    const allPoints = [...hist, ...fcstTail];
    const splitIndex = hist.length - 1;

    const values = allPoints.map((p) => p.value);
    const baseline = forecastData?.previous_baseline ?? values[0];
    const allWithBase = [...values, baseline];

    const rawMin = Math.min(...allWithBase);
    const rawMax = Math.max(...allWithBase);
    const span = Math.max(rawMax - rawMin, 1.0);
    const yMin = rawMin - span * 0.14;
    const yMax = rawMax + span * 0.14;
    const yRange = yMax - yMin;

    const width = 620;
    const height = 240;
    const padLeft = 44;
    const padRight = 14;
    const padTop = 26;
    const padBottom = 28;
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    const mapX = (idx) => {
      if (allPoints.length <= 1) return padLeft;
      return padLeft + (idx / (allPoints.length - 1)) * plotWidth;
    };

    const mapY = (val) => {
      return padTop + plotHeight - ((val - yMin) / yRange) * plotHeight;
    };

    const coords = allPoints.map((pt, idx) => ({
      ...pt,
      idx,
      x: mapX(idx),
      y: mapY(pt.value)
    }));

    const histCoords = coords.slice(0, splitIndex + 1);
    const fcstCoords = coords.slice(splitIndex);

    const histPath = histCoords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');

    const histAreaPath =
      histCoords.length > 1
        ? `${histPath} L ${histCoords[histCoords.length - 1].x.toFixed(1)} ${(padTop + plotHeight).toFixed(1)} L ${histCoords[0].x.toFixed(1)} ${(padTop + plotHeight).toFixed(1)} Z`
        : '';

    const fcstPath =
      fcstCoords.length > 1
        ? fcstCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
        : '';

    const baselineY = mapY(baseline);

    const yTicks = [0, 0.33, 0.66, 1].map((ratio) => {
      const val = yMin + ratio * yRange;
      return {
        val: val >= 100 ? Math.round(val) : Number(val.toFixed(1)),
        y: mapY(val)
      };
    });

    const xTickCount = Math.min(6, allPoints.length);
    const xTicks = [];
    for (let i = 0; i < xTickCount; i++) {
      const targetIdx = Math.round((i / Math.max(1, xTickCount - 1)) * (allPoints.length - 1));
      xTicks.push({
        label: allPoints[targetIdx].time,
        x: mapX(targetIdx)
      });
    }

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      plotWidth,
      plotHeight,
      coords,
      splitIndex,
      histPath,
      histAreaPath,
      fcstPath,
      baselineY,
      baseline,
      yTicks,
      xTicks
    };
  }, [forecastData]);

  const handlePointerMove = (clientX) => {
    if (!svgRef.current || !chartGeometry) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * chartGeometry.width;

    let closestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < chartGeometry.coords.length; i++) {
      const dist = Math.abs(chartGeometry.coords[i].x - relX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }
    setHoverIndex(closestIdx);
  };

  if (!forecastData || !chartGeometry) {
    return (
      <div className="sfc-container sfc-skeleton" role="status" aria-live="polite">
        <div className="sfc-loading-pulse">{t('analytics.charts.loading')}</div>
      </div>
    );
  }

  const isPositive = forecastData.change_value >= 0;
  const isForecastPositive = forecastData.after_hours_change >= 0;
  const actualColor = isPositive ? '#047857' : '#e05a52';
  const forecastColor = '#64748b';
  const unitLabel = metricKey === 'patients' ? t('analytics.charts.patientsUnit') : t('analytics.charts.billingUnit');
  const localeCode = i18n.language === 'id' ? 'id-ID' : 'en-US';
  const gradientId = `sfcActualGrad-${metricKey}`;

  const activePoint = hoverIndex !== null ? chartGeometry.coords[hoverIndex] : null;
  const formatNum = (val) => Number(val).toLocaleString(localeCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const statusText = selectedTimeframe === '1D'
    ? t('analytics.charts.updatedDaily')
    : t('analytics.charts.updatedRange', { tf: selectedTimeframe });

  return (
    <div className="sfc-container">
      <div className="sfc-header">
        <div className="sfc-hero-metrics">
          <h2 className="sfc-card-heading">{title}</h2>

          <div className="sfc-primary-row">
            <span className="sfc-big-value">{formatNum(forecastData.current_value)}</span>
            <span className="sfc-unit-label">{unitLabel}</span>
            <span className={`sfc-delta-pill ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? <ArrowUp size={13} aria-hidden="true" /> : <ArrowDown size={13} aria-hidden="true" />}
              <span>{Math.abs(forecastData.change_percent).toFixed(2)}%</span>
            </span>
            <span className={`sfc-delta-text ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}{formatNum(forecastData.change_value)} {t('analytics.charts.thisPeriod')}
            </span>
          </div>

          <div className="sfc-sub-row">
            <span>{statusText}</span>
          </div>

          <div className="sfc-after-hours-row">
            <span className="sfc-ah-label">{t('analytics.charts.aiForecastPrefix')}</span>
            <span className="sfc-ah-val">{formatNum(forecastData.after_hours_forecast)} {unitLabel}</span>
            <span className={`sfc-ah-diff ${isForecastPositive ? 'positive' : 'negative'}`}>
              {isForecastPositive ? '+' : ''}{formatNum(forecastData.after_hours_change)} ({isForecastPositive ? '+' : ''}{forecastData.after_hours_percent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="sfc-timeframe-bar" role="tablist" aria-label={title}>
        {timeframeOptions.map((tf) => (
          <button
            key={tf.id}
            type="button"
            role="tab"
            aria-selected={selectedTimeframe === tf.id}
            className={`sfc-tf-btn ${selectedTimeframe === tf.id ? 'active' : ''}`}
            onClick={() => onTimeframeChange(tf.id)}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <div
        className={`sfc-chart-stage ${loading ? 'is-loading' : ''}`}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
          className="sfc-svg"
          role="img"
          aria-label={title}
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onTouchMove={(e) => {
            if (e.touches && e.touches[0]) handlePointerMove(e.touches[0].clientX);
          }}
          onTouchEnd={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={actualColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={actualColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {chartGeometry.yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={chartGeometry.padLeft}
                y1={tick.y}
                x2={chartGeometry.width - chartGeometry.padRight}
                y2={tick.y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              <text
                x={chartGeometry.padLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="sfc-axis-text"
              >
                {tick.val}
              </text>
            </g>
          ))}

          <line
            x1={chartGeometry.padLeft}
            y1={chartGeometry.baselineY}
            x2={chartGeometry.width - chartGeometry.padRight}
            y2={chartGeometry.baselineY}
            stroke="#cbd5e1"
            strokeWidth="1.2"
            strokeDasharray="2 4"
          />

          <g transform={`translate(${chartGeometry.width - chartGeometry.padRight - 4}, ${Math.max(22, chartGeometry.baselineY - 8)})`}>
            <text textAnchor="end" className="sfc-baseline-text">
              {t('analytics.charts.baseline')} {formatNum(chartGeometry.baseline)}
            </text>
          </g>

          {chartGeometry.histAreaPath && (
            <path d={chartGeometry.histAreaPath} fill={`url(#${gradientId})`} />
          )}
          <path
            d={chartGeometry.histPath}
            fill="none"
            stroke={actualColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {chartGeometry.fcstPath && (
            <path
              d={chartGeometry.fcstPath}
              fill="none"
              stroke={forecastColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {chartGeometry.coords[chartGeometry.splitIndex] && (
            <line
              x1={chartGeometry.coords[chartGeometry.splitIndex].x}
              y1={chartGeometry.padTop}
              x2={chartGeometry.coords[chartGeometry.splitIndex].x}
              y2={chartGeometry.padTop + chartGeometry.plotHeight}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {chartGeometry.xTicks.map((tick, idx) => (
            <text
              key={idx}
              x={tick.x}
              y={chartGeometry.height - 8}
              textAnchor="middle"
              className="sfc-axis-text"
            >
              {tick.label}
            </text>
          ))}

          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={chartGeometry.padTop}
                x2={activePoint.x}
                y2={chartGeometry.padTop + chartGeometry.plotHeight}
                stroke="#475569"
                strokeWidth="1.2"
                strokeDasharray="2 3"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="5"
                fill={activePoint.is_forecast ? forecastColor : actualColor}
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {activePoint && (
          <div
            className="sfc-tooltip"
            style={{
              left: `${Math.min(82, Math.max(18, (activePoint.x / chartGeometry.width) * 100))}%`,
              top: `${Math.max(4, ((activePoint.y - 36) / chartGeometry.height) * 100)}%`
            }}
          >
            <span className="sfc-tt-val">{formatNum(activePoint.value)} {unitLabel}</span>
            <span className="sfc-tt-time">{activePoint.time}</span>
            {activePoint.is_forecast && <span className="sfc-tt-tag">{t('analytics.charts.tooltipTag')}</span>}
          </div>
        )}
      </div>

      <div className="sfc-legend-row">
        <div className="sfc-legend-item">
          <span className="sfc-legend-line" style={{ background: actualColor }} />
          <span>{t('analytics.charts.actualLegend')}</span>
        </div>
        <div className="sfc-legend-item">
          <span className="sfc-legend-line" style={{ background: forecastColor }} />
          <span>{t('analytics.charts.forecastLegend')}</span>
        </div>
      </div>
    </div>
  );
};

export default StockForecastLineChart;
