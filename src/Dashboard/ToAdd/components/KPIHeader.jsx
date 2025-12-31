import React from 'react';
import { getProgress, getFinal, subscribeScoreStore } from '../ui/scoreStore';
import checkGreen from '../../Icons/check_green.svg';
import checkOrange from '../../Icons/check_orange.svg';
import cross from '../../Icons/not_check.svg';

function Mark({ v }) {
    if (v === 1)   return <img src={checkGreen}  alt="" style={{width:14,height:14}}/>;
    if (v === 0.5) return <img src={checkOrange} alt="" style={{width:14,height:14}}/>;
    return <img src={cross} alt="" style={{width:14,height:14}}/>;
}
function GreyDot() {
    return <span style={{width:12,height:12,borderRadius:'50%',display:'inline-block',background:'#e5e7eb',border:'1px solid #d1d5db'}} />;
}

export default function KPIHeader({
                                      personaInfo,
                                      headerKPI,
                                      prevPreset,
                                      nextPreset,
                                      activeCategory,
                                      currentPreset, // not used, but okay to keep
                                  }) {
    const [, force] = React.useState(0);
    React.useEffect(() => subscribeScoreStore(() => force(x => x + 1)), []);

    const { earned, denom, marks } = getProgress(activeCategory);
    const { total } = getFinal(activeCategory);
    const remaining = Math.max(0, (total || 0) - marks.length);

    const statusWord =
        headerKPI.status === 'green' ? 'goed' :
            headerKPI.status === 'orange' ? 'ok'   : 'niet in balans';

    return (
        <div
            className="section-header"
            style={{
                display: 'grid',
                gridTemplateColumns: '30% 40% 30%',
                gap: 24,
                alignItems: 'center',
                marginBottom: 8,
                paddingBottom: 8,
                borderBottom: '1px solid rgba(0,0,0,0.08)',
            }}
        >
            {/* LEFT: category cumulative */}
            <div style={{ color: '#000', fontSize: 14, lineHeight: 1.25 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    Category score{' '}
                    <span style={{ fontWeight: 800 }}>
            {Math.round(earned * 10) / 10}/{denom}
          </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {marks.map((v, i) => <Mark key={`m-${i}`} v={v} />)}
                    {Array.from({ length: remaining }).map((_, i) => <GreyDot key={`g-${i}`} />)}
                </div>
            </div>

            {/* MIDDLE: fixed width column with round arrows */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    alignItems: 'center',
                    gap: 10,
                    justifyItems: 'center',
                    borderRadius: 12,
                    padding: 12,
                    background: headerKPI.bg,
                }}
            >
                <button
                    onClick={prevPreset}
                    aria-label="Previous view"
                    style={{width:36,height:36,borderRadius:'50%',border:'1px solid #e5e7eb',background:'#fff',cursor:'pointer'}}
                >
                    &lt;
                </button>

                <div style={{textAlign: 'center'}}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}}>
                          <span style={{whiteSpace: 'nowrap'}}>
                            {personaInfo.line1} <strong>{headerKPI.total}</strong> {personaInfo.line2} {statusWord}
                          </span>
                        <img
                            src={headerKPI.icon}
                            alt=""
                            style={{
                                marginTop: 3,
                                marginLeft: 5,
                                width: 20,
                                height: 20,
                                flex: '0 0 auto',
                                verticalAlign: 'middle'
                            }}
                        />
                    </div>

                    <div className="total-count--large" style={{marginTop: 6}}>

                    </div>
                </div>

                <button
                    onClick={nextPreset}
                    aria-label="Next view"
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: '1px solid #e5e7eb',
                        background: '#fff',
                        cursor: 'pointer'
                    }}
                >
                    &gt;
                </button>
            </div>

            {/* RIGHT: keep info2 */}
            <div style={{color: '#000', fontSize: 14, lineHeight: 1.25 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}></div>
                {personaInfo.title}
            </div>
        </div>
    );
}
