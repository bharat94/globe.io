import React, { useEffect, useState } from 'react';
import type { PopulationDataPoint, CountryDetailedData } from '../../types/population';

interface PopulationPanelProps {
  country: PopulationDataPoint;
  currentYear: number;
  onClose: () => void;
  getCountryDetails: (code: string, year: number) => Promise<CountryDetailedData | null>;
}

const PopulationPanel: React.FC<PopulationPanelProps> = ({
  country,
  currentYear,
  onClose,
  getCountryDetails
}) => {
  const [details, setDetails] = useState<CountryDetailedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const data = await getCountryDetails(country.countryCode, currentYear);
      setDetails(data);
      setLoading(false);
    };
    fetchDetails();
  }, [country.countryCode, currentYear, getCountryDetails]);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.9)',
    backdropFilter: 'blur(10px)',
    padding: '20px',
    borderRadius: '12px',
    color: 'white',
    width: '320px',
    maxHeight: '85vh',
    overflowY: 'auto',
    zIndex: 1000,
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px'
  };

  const sectionStyle: React.CSSProperties = {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px'
  };

  const barStyle = (percent: number, color: string): React.CSSProperties => ({
    height: '8px',
    borderRadius: '4px',
    background: `linear-gradient(90deg, ${color} ${percent}%, rgba(255,255,255,0.1) ${percent}%)`,
    marginBottom: '4px'
  });

  const d = details?.demographics;

  return (
    <div style={panelStyle}>
      <button
        style={closeButtonStyle}
        onClick={onClose}
        onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
      >
        &#10005;
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ fontSize: '40px' }}>{getCountryFlag(country.countryCode)}</span>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '600' }}>{country.name}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            {country.countryCode} / {country.countryCode3}
          </div>
        </div>
      </div>

      {/* Population */}
      <div style={{ marginTop: '16px' }}>
        <div style={labelStyle}>Population ({currentYear})</div>
        <div style={{ fontSize: '32px', fontWeight: '700', color: '#4FC3F7' }}>
          {country.populationFormatted}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          {country.population?.toLocaleString()} people
        </div>
      </div>

      {loading ? (
        <div style={{ ...sectionStyle, textAlign: 'center', padding: '20px' }}>
          <div style={{ opacity: 0.6 }}>Loading demographics...</div>
        </div>
      ) : d ? (
        <>
          {/* Gender Distribution */}
          {d.malePercent !== undefined && d.femalePercent !== undefined && (
            <div style={sectionStyle}>
              <div style={labelStyle}>Gender Distribution</div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px' }}>Male</span>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{d.malePercent.toFixed(1)}%</span>
                  </div>
                  <div style={barStyle(d.malePercent, '#42A5F5')} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px' }}>Female</span>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{d.femalePercent.toFixed(1)}%</span>
                  </div>
                  <div style={barStyle(d.femalePercent, '#EC407A')} />
                </div>
              </div>
            </div>
          )}

          {/* Age Distribution */}
          {(d.ages0to14 !== undefined || d.ages15to64 !== undefined || d.ages65plus !== undefined) && (
            <div style={sectionStyle}>
              <div style={labelStyle}>Age Distribution</div>
              <div style={{ display: 'flex', height: '24px', borderRadius: '4px', overflow: 'hidden' }}>
                {d.ages0to14 !== undefined && (
                  <div style={{ width: `${d.ages0to14}%`, background: '#66BB6A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: '600' }}>{d.ages0to14.toFixed(0)}%</span>
                  </div>
                )}
                {d.ages15to64 !== undefined && (
                  <div style={{ width: `${d.ages15to64}%`, background: '#FFA726', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: '600' }}>{d.ages15to64.toFixed(0)}%</span>
                  </div>
                )}
                {d.ages65plus !== undefined && (
                  <div style={{ width: `${d.ages65plus}%`, background: '#AB47BC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: '600' }}>{d.ages65plus.toFixed(0)}%</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px' }}>
                <span><span style={{ color: '#66BB6A' }}>&#9632;</span> 0-14 yrs</span>
                <span><span style={{ color: '#FFA726' }}>&#9632;</span> 15-64 yrs</span>
                <span><span style={{ color: '#AB47BC' }}>&#9632;</span> 65+ yrs</span>
              </div>
            </div>
          )}

          {/* Urban vs Rural */}
          {d.urbanPercent !== undefined && d.ruralPercent !== undefined && (
            <div style={sectionStyle}>
              <div style={labelStyle}>Urban vs Rural</div>
              <div style={{ display: 'flex', height: '24px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${d.urbanPercent}%`, background: '#5C6BC0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600' }}>{d.urbanPercent.toFixed(0)}%</span>
                </div>
                <div style={{ width: `${d.ruralPercent}%`, background: '#8D6E63', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600' }}>{d.ruralPercent.toFixed(0)}%</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px' }}>
                <span><span style={{ color: '#5C6BC0' }}>&#9632;</span> Urban</span>
                <span><span style={{ color: '#8D6E63' }}>&#9632;</span> Rural</span>
              </div>
            </div>
          )}

          {/* Key Statistics */}
          <div style={sectionStyle}>
            <div style={labelStyle}>Key Statistics</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {d.lifeExpectancy !== undefined && (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Life Expectancy</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#4FC3F7' }}>
                    {d.lifeExpectancy.toFixed(1)} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>yrs</span>
                  </div>
                </div>
              )}
              {d.growthRate !== undefined && (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Growth Rate</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: d.growthRate >= 0 ? '#66BB6A' : '#EF5350' }}>
                    {d.growthRate >= 0 ? '+' : ''}{d.growthRate.toFixed(2)}%
                  </div>
                </div>
              )}
              {d.fertilityRate !== undefined && (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Fertility Rate</div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>
                    {d.fertilityRate.toFixed(2)} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>births</span>
                  </div>
                </div>
              )}
              {d.density !== undefined && (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Density</div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>
                    {d.density.toFixed(0)} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>/km²</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Population History Sparkline */}
          {details?.history && details.history.length > 0 && (
            <div style={sectionStyle}>
              <div style={labelStyle}>Population Trend (1960-2023)</div>
              <Sparkline data={details.history} currentYear={currentYear} />
            </div>
          )}
        </>
      ) : (
        <div style={{ ...sectionStyle, textAlign: 'center', padding: '20px' }}>
          <div style={{ opacity: 0.6 }}>Demographics unavailable</div>
        </div>
      )}
    </div>
  );
};

// Simple sparkline component
const Sparkline: React.FC<{ data: { year: number; population: number }[]; currentYear: number }> = ({ data, currentYear }) => {
  const width = 280;
  const height = 60;
  const padding = 4;

  const minPop = Math.min(...data.map(d => d.population));
  const maxPop = Math.max(...data.map(d => d.population));
  const range = maxPop - minPop || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.population - minPop) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const currentIndex = data.findIndex(d => d.year === currentYear);
  const currentX = currentIndex >= 0
    ? padding + (currentIndex / (data.length - 1)) * (width - padding * 2)
    : null;
  const currentY = currentIndex >= 0
    ? height - padding - ((data[currentIndex].population - minPop) / range) * (height - padding * 2)
    : null;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke="rgba(79, 195, 247, 0.5)"
        strokeWidth="2"
      />
      {currentX !== null && currentY !== null && (
        <>
          <line x1={currentX} y1={0} x2={currentX} y2={height} stroke="rgba(79, 195, 247, 0.3)" strokeWidth="1" strokeDasharray="2,2" />
          <circle cx={currentX} cy={currentY} r="4" fill="#4FC3F7" />
        </>
      )}
    </svg>
  );
};

function getCountryFlag(countryCode: string): string {
  if (!countryCode) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default PopulationPanel;
