import React, { useState, useEffect } from "react";
import './Afterchannel.css';
import ChannelDashboard from "../components/Channel/ChannelDashboard";
import TransitBufferDashboard from "../components/TransitBuffer/TransitBufferDashboard";
import PVSMFlow from "../components/PVSMFlow/PVSMFlow";

const API = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const Afterchannel = () => {
  const userRole = sessionStorage.getItem("role") || "user";

  const defaultTab =
    userRole === "user"
      ? (localStorage.getItem("activeTab") || "transitbuffer")
      : userRole;

  const roleTabs = {
    user: ["transitbuffer", "channel", "summary", "visualFlow", "scrapData"],
    transitbuffer: ["transitbuffer"],
    channel: ["channel"],
  };

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [moCache, setMoCache] = useState({});
  const [ledgers, setLedgers] = useState({
    channel: [], accurate: [], cps: [], rework: [], dismantling: [], autopackaging: [], fps: [], transitbuffer: []
  });

  // Scrap State 
  const [scrapData, setScrapData] = useState([]);
  const [scrapSearchQuery, setScrapSearchQuery] = useState('');
  const [expandedScrapMOs, setExpandedScrapMOs] = useState({});
  const [expandedScrapReasons, setExpandedScrapReasons] = useState({});
  const [productionEntries, setProductionEntries] = useState([]);

  const [moNumber, setMoNumber] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [selectedMO, setSelectedMO] = useState(null);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');

  const [expandedMOs, setExpandedMOs] = useState({});
  const [expandedVariants, setExpandedVariants] = useState({});

  // Transit Buffer States
  const [tbOperator, setTbOperator] = useState('');
  const [tbChannel, setTbChannel] = useState('');
  const [tbShift, setTbShift] = useState('');
  const [tbContainerType, setTbContainerType] = useState('18');
  const [tbPallet, setTbPallet] = useState(false);
  const [tbRingSide, setTbRingSide] = useState('');
  const [tbRingType, setTbRingType] = useState('');
  const [tbSampleWeight, setTbSampleWeight] = useState('');
  const [tbContainerQty, setTbContainerQty] = useState(1);
  const [tbGrossWeight, setTbGrossWeight] = useState(0);
  const [tbStdQty, setTbStdQty] = useState(0);
  const [tbFinalQty, setTbFinalQty] = useState(0);

  useEffect(() => {
    fetchMasterData();
    fetchLedgers();
  }, []);

  useEffect(() => {
    if (activeTab === 'scrapData' && scrapData.length === 0) {
      fetchScrapData();
    }
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  const fetchMasterData = async () => {
    try {
      const res = await fetch(`${API}/api/mo-lookup`);
      const data = await res.json();
      if (data.status === 'success') {
        setMoCache(data.data || {});
      }
    } catch (err) {
      console.error("Master Reference Load Failure:", err);
    }
  };

  const fetchLedgers = async () => {
    try {
      const res = await fetch(`${API}/api/afterchannel/summary_ledgers`);
      const json = await res.json();

      if (json.status === 'success' || json.data) {
        setLedgers({
          channel: json.data?.channel || [],
          accurate: json.data?.accurate || [],
          cps: json.data?.cps || [],
          rework: json.data?.rework || [],
          dismantling: json.data?.dismantling || json.data?.vibration || [],
          autopackaging: json.data?.autopackaging || [],
          fps: json.data?.fps || [],
          transitbuffer: json.data?.transitbuffer || []
        });
      }
    } catch (err) {
      console.error("Ledger Sync Failure:", err);
    }
  };

  const fetchScrapData = async () => {
    try {
      const res = await fetch(`${API}/api/xa-scrap`);
      const json = await res.json();
      if (json.status === 'success') {
        setScrapData(json.data || []);
      }
    } catch (err) {
      console.error("Scrap Fetch Failure:", err);
    }
  };

  const getTypeFromRow = (row) => {
    for (const key in row) {
      const cleanKey = key.toLowerCase().replace(/[^a-z]/g, '');
      if (['type', 'variant', 'model', 'bearing', 'item'].some(w => cleanKey.includes(w))) {
        return String(row[key]).trim();
      }
    }
    return 'UNKNOWN_VARIANT'; 
  };

  const allUniqueVariants = [...new Set(Object.values(moCache).flatMap(rows => rows.map(r => getTypeFromRow(r))))].filter(Boolean);
  const allUniqueMos = Object.keys(moCache);

  const dynamicVariantsList = moNumber.trim() && moCache[moNumber.trim().toUpperCase()]
    ? [...new Set(moCache[moNumber.trim().toUpperCase()].map(r => getTypeFromRow(r)))].filter(Boolean)
    : allUniqueVariants;

  const dynamicMosList = selectedVariant.trim()
    ? allUniqueMos.filter(mo => moCache[mo].some(r => getTypeFromRow(r).toUpperCase() === selectedVariant.trim().toUpperCase()))
    : allUniqueMos;

  const handleMoBlur = () => {
    const key = moNumber.trim().toUpperCase();
    if (moCache[key]) {
      const rawRows = moCache[key];
      const uniqueVariants = [...new Set(rawRows.map(r => getTypeFromRow(r)))].filter(Boolean);
      if (uniqueVariants.length === 1) {
        setSelectedVariant(uniqueVariants[0]);
      }
    }
  };

  const handleVariantChange = (e) => {
    setSelectedVariant(e.target.value.toUpperCase());
  };

  const handleChannelSave = (formData) => {
    const newEntry = {
      id: Date.now(),
      mo: moNumber,
      bearing_type: selectedVariant,
      type: formData.type,
      pack_code: formData.packCode,
      in_date: new Date().toLocaleDateString(),
      material_in_from: "CHANNEL",
      qty_in: Number(formData.requiredQty),
      qty_sent: Number(formData.producedQty),
      next_station: "PENDING",
    };

    setLedgers(prev => ({
      ...prev,
      channel: [newEntry, ...(prev.channel || [])]
    }));

    setProductionEntries(prev => [
      ...prev,
      {
        id: Date.now(),
        mo: moNumber,
        variant: selectedVariant,
        packCode: formData.packCode,
        requiredQty: formData.requiredQty,
        producedQty: formData.producedQty
      }
    ]);

    setSelectedMO(newEntry);
    return newEntry;
  };

  const updateChannelData = (updatedChannel) => {
    setLedgers(prev => ({
      ...prev,
      channel: updatedChannel
    }));
  };

  const handleTransitSave = () => {
    const transitEntry = {
      timestamp: new Date().toLocaleString(),
      operator: tbOperator,
      channel: tbChannel,
      shift: tbShift,
      mo: moNumber,
      containerType: tbContainerType,
      pallet: tbPallet,
      ringSide: tbRingSide,
      ringType: tbRingType,
      sampleWeight: tbSampleWeight,
      containerQty: tbContainerQty,
      grossWeight: tbGrossWeight,
      stdQty: tbStdQty,
      finalQty: tbFinalQty
    };

    setLedgers(prev => ({
      ...prev,
      transitbuffer: [
        transitEntry,
        ...(Array.isArray(prev?.transitbuffer) ? prev.transitbuffer : [])
      ]
    }));
  };

  // ================= SUMMARY HIERARCHY LOGIC =================
  const createEmptyFlowObject = () => ({
    accIn: 0, accOut: 0, cpsIn: 0, cpsOut: 0, rwIn: 0, rwOut: 0,
    disIn: 0, disOut: 0, apIn: 0, apOut: 0, fpsIn: 0, 
    irScrap: 0, orScrap: 0, cageScrap: 0, ballScrap: 0, totalScrap: 0, records: [],
    irSentTot: 0, orSentTot: 0, disOutGeneral: 0
  });

  const isLoopback = (dept, val) => {
    if (!val) return false;
    const s = String(val).toLowerCase();
    return s.includes('rework') || s.includes('dismantling') || s.includes('vibration') || s.includes(dept);
  };

  const addFlowCounts = (node, r) => {
    const dept = r._dept;
    const mFrom = r.material_in_from || r.materialInFrom;
    const nStat = r.next_station || r.nextStation;

    if (dept === 'accurate') { 
      if (r.qty_in && !isLoopback('accurate', mFrom)) node.accIn += Number(r.qty_in); 
      if (r.qty_sent && !isLoopback('accurate', nStat)) node.accOut += Number(r.qty_sent); 
    }
    else if (dept === 'cps') { 
      if (r.qty_in && !isLoopback('cps', mFrom)) node.cpsIn += Number(r.qty_in); 
      if (r.qty_sent && !isLoopback('cps', nStat)) node.cpsOut += Number(r.qty_sent); 
    }
    else if (dept === 'autopackaging') { 
      if (r.qty_in && !isLoopback('autopackaging', mFrom)) node.apIn += Number(r.qty_in); 
      if (r.qty_sent && !isLoopback('autopackaging', nStat)) node.apOut += Number(r.qty_sent); 
    }
    else if (dept === 'fps') { 
      if (r.qty_in && !isLoopback('fps', mFrom)) node.fpsIn += Number(r.qty_in); 
    }
    else if (dept === 'rework') { 
      if (r.qty_in) node.rwIn += Number(r.qty_in); 
      if (r.qty_sent) node.rwOut += Number(r.qty_sent); 
    }
    else if (dept === 'dismantling') {
      if (r.qty_in) node.disIn += Number(r.qty_in);
      if (r.qty_sent) node.disOutGeneral += Number(r.qty_sent);
      if (r.ir_sent) node.irSentTot += Number(r.ir_sent);
      if (r.or_sent) node.orSentTot += Number(r.or_sent);
      node.irScrap += (Number(r.ir_scrap) || 0); node.orScrap += (Number(r.or_scrap) || 0);
      node.cageScrap += (Number(r.cage_scrap) || 0); node.ballScrap += (Number(r.ball_scrap) || 0) + (Number(r.roller_scrap) || 0);
      node.totalScrap = node.irScrap + node.orScrap + node.cageScrap + node.ballScrap;
    }
  };

  const generateSummaryData = () => {
    const safeLedgers = { 
      accurate: ledgers.accurate || [], 
      cps: ledgers.cps || [], 
      rework: ledgers.rework || [], 
      dismantling: ledgers.dismantling || ledgers.vibration || [], 
      autopackaging: ledgers.autopackaging || [], 
      fps: ledgers.fps || [] 
    };

    const allLists = [
      ...safeLedgers.accurate.map(r => ({ ...r, _dept: 'accurate' })),
      ...safeLedgers.cps.map(r => ({ ...r, _dept: 'cps' })),
      ...safeLedgers.rework.map(r => ({ ...r, _dept: 'rework' })),
      ...safeLedgers.dismantling.map(r => ({ ...r, _dept: 'dismantling' })),
      ...safeLedgers.autopackaging.map(r => ({ ...r, _dept: 'autopackaging' })),
      ...safeLedgers.fps.map(r => ({ ...r, _dept: 'fps' }))
    ];
    
    const summaryMap = {};
    allLists.forEach(item => {
      if (!item.mo) return;
      const mo = item.mo.toUpperCase();
      let variant = (item.bearing_type || item.type || item.item_type || '').toUpperCase();
      if (!variant || variant === 'DGBB' || variant === 'TRB') variant = 'FAMILY / OVERALL';

      if (!summaryMap[mo]) summaryMap[mo] = { mo, totals: createEmptyFlowObject(), variants: {} };
      if (!summaryMap[mo].variants[variant]) summaryMap[mo].variants[variant] = createEmptyFlowObject();

      addFlowCounts(summaryMap[mo].variants[variant], item);
      addFlowCounts(summaryMap[mo].totals, item);
      summaryMap[mo].variants[variant].records.push(item);
    });

    Object.values(summaryMap).forEach(moData => {
      moData.totals.disOut = moData.totals.disOutGeneral + Math.min(moData.totals.irSentTot + moData.totals.irScrap, moData.totals.orSentTot + moData.totals.orScrap);
      Object.values(moData.variants).forEach(vData => {
        vData.disOut = vData.disOutGeneral + Math.min(vData.irSentTot + vData.irScrap, vData.orSentTot + vData.orScrap);
      });
    });

    let result = Object.values(summaryMap).sort((a, b) => a.mo.localeCompare(b.mo));
    if (ledgerSearchQuery.trim()) result = result.filter(item => item.mo.includes(ledgerSearchQuery.toUpperCase()));
    return result;
  };

  const renderMoDispatchDetails = (records) => {
    const outRecs = records.filter(r => r.qty_sent > 0 || r.ir_sent > 0 || r.or_sent > 0 || r.cage_sent > 0 || r.roller_sent > 0 || r.ir_scrap > 0 || r.or_scrap > 0 || r.cage_scrap > 0 || r.ball_scrap > 0 || r.roller_scrap > 0);
    if (outRecs.length === 0) return <div className="dispatch-empty-note">No dispatch/scrap events recorded here yet.</div>;
    const grouped = outRecs.reduce((acc, curr) => { if(!acc[curr._dept]) acc[curr._dept] = []; acc[curr._dept].push(curr); return acc; }, {});

    return (
      <div className="dispatch-detail-panel">
        {Object.keys(grouped).map(dept => (
          <div key={dept} className="dispatch-dept-card">
            <h4>{dept} Activity</h4>
            <div className="dispatch-events">
              {grouped[dept].map((r, i) => (
                <div key={i} className="dispatch-event">
                  {r.qty_sent > 0 && <div><strong className="qty-highlight">{r.qty_sent}</strong> sent to <strong>{r.next_station || 'N/A'}</strong></div>}
                  {r.ir_sent > 0 && <div><strong className="qty-highlight">{r.ir_sent} IR</strong> sent to <strong>{r.ir_station || 'N/A'}</strong></div>}
                  {r.or_sent > 0 && <div><strong className="qty-highlight">{r.or_sent} OR</strong> sent to <strong>{r.or_station || 'N/A'}</strong></div>}
                  {r.cage_sent > 0 && <div><strong className="qty-highlight">{r.cage_sent} Cage</strong> sent to <strong>{r.cage_station || 'N/A'}</strong></div>}
                  {r.roller_sent > 0 && <div><strong className="qty-highlight">{r.roller_sent} Roller/Ball</strong> sent to <strong>{r.roller_station || 'N/A'}</strong></div>}
                  {(r.ir_scrap > 0 || r.or_scrap > 0 || r.cage_scrap > 0 || r.ball_scrap > 0 || r.roller_scrap > 0) && (
                    <div className="scrap-line">
                      Scrap: {[r.ir_scrap && `${r.ir_scrap} IR`, r.or_scrap && `${r.or_scrap} OR`, r.cage_scrap && `${r.cage_scrap} Cage`, (r.ball_scrap||r.roller_scrap) && `${r.ball_scrap||r.roller_scrap} Ball/Rollers`].filter(Boolean).join(', ')}
                    </div>
                  )}
                  <span className="meta-line">On: {r.out_date || r.outDate} | Shift: {r.shift_out}</span>
                  {r.remark && <div className="remark-line">"{r.remark}"</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getFilteredScrapData = () => {
    let list = [...scrapData];
    if (scrapSearchQuery.trim()) {
      list = list.filter(s => s.mo.toLowerCase().includes(scrapSearchQuery.toLowerCase()));
    }
    return list.sort((a, b) => a.mo.localeCompare(b.mo));
  };

  return (
    <div className="afterchannel-container">         
      <datalist id="mo-list">
        {dynamicMosList.map(mo => <option key={mo} value={mo} />)}
      </datalist>
      <datalist id="variants-list">
        {dynamicVariantsList.map(v => <option key={v} value={v} />)}
      </datalist>
      
      <div className="ac-header">
        <h1 className="ac-title">Afterchannel Processing</h1>
        <div className="tab-buttons">
          {roleTabs[userRole]?.includes("transitbuffer") && (
            <button
              className={`tab-pill ${activeTab === "transitbuffer" ? "tab-pill-active" : ""}`}
              onClick={() => setActiveTab("transitbuffer")}
            >
              TRANSIT BUFFER
            </button>
          )}

          {roleTabs[userRole]?.includes("channel") && (
            <button
              className={`tab-pill ${activeTab === "channel" ? "tab-pill-active" : ""}`}
              onClick={() => setActiveTab("channel")}
            >
              CHANNEL
            </button>
          )}

          {roleTabs[userRole]?.includes("summary") && (
            <button
              className={`tab-pill ${activeTab === "summary" ? "tab-pill-active" : ""}`}
              onClick={() => setActiveTab("summary")}
            >
              📊 SUMMARY
            </button>
          )}

          {roleTabs[userRole]?.includes("visualFlow") && (
            <button
              className={`tab-pill ${activeTab === "visualFlow" ? "tab-pill-active" : ""}`}
              onClick={() => setActiveTab("visualFlow")}
            >
              📈 VISUAL FLOW
            </button>
          )}

          {roleTabs[userRole]?.includes("scrapData") && (
            <button
              className={`tab-pill ${activeTab === "scrapData" ? "tab-pill-active" : ""}`}
              onClick={() => setActiveTab("scrapData")}
            >
              🗑️ SCRAP DATA
            </button>
          )}
        </div>
      </div>

      <div className="ac-content">
        {activeTab === "channel" && (
          <ChannelDashboard
            moNumber={moNumber}
            setMoNumber={setMoNumber}
            handleMoBlur={handleMoBlur}
            dynamicMosList={dynamicMosList}
            selectedVariant={selectedVariant}
            setSelectedVariant={setSelectedVariant}
            handleVariantChange={handleVariantChange}
            dynamicVariantsList={dynamicVariantsList}
            handleChannelSave={handleChannelSave}
            channelData={ledgers.channel}
            updateChannelData={updateChannelData}
            selectedMO={selectedMO}
            setSelectedMO={setSelectedMO}
            productionEntries={productionEntries}
            setProductionEntries={setProductionEntries}
          />
        )}

        {activeTab === "transitbuffer" && (
          <TransitBufferDashboard
            moNumber={moNumber}
            setMoNumber={setMoNumber}
            handleMoBlur={handleMoBlur}
            dynamicMosList={dynamicMosList}
            tbOperator={tbOperator}
            setTbOperator={setTbOperator}
            tbChannel={tbChannel}
            setTbChannel={setTbChannel}
            tbShift={tbShift}
            setTbShift={setTbShift}
            tbContainerType={tbContainerType}
            setTbContainerType={setTbContainerType}
            tbPallet={tbPallet}
            setTbPallet={setTbPallet}
            tbRingSide={tbRingSide}
            setTbRingSide={setTbRingSide}
            tbRingType={tbRingType}
            setTbRingType={setTbRingType}
            tbSampleWeight={tbSampleWeight}
            setTbSampleWeight={setTbSampleWeight}
            tbContainerQty={tbContainerQty}
            setTbContainerQty={setTbContainerQty}
            tbGrossWeight={tbGrossWeight}
            setTbGrossWeight={setTbGrossWeight}
            tbStdQty={tbStdQty}
            tbFinalQty={tbFinalQty}
            handleTransitSave={handleTransitSave}
          />
        )}

        {activeTab === "visualFlow" && (
          <PVSMFlow
            dynamicMosList={dynamicMosList}
            dynamicVariantsList={dynamicVariantsList}
            ledgers={ledgers}
          />
        )}

        {/* RESTORED FULL HIERARCHY SUMMARY TABLE */}
        {activeTab === 'summary' && (
          <div className="summary-view">
            <div className="summary-view-header">
              <h2 className="summary-view-title">MO Variant Flow Hierarchy</h2>
              <input
                type="text"
                placeholder="Search Master Order (MO)..."
                value={ledgerSearchQuery}
                onChange={(e) => setLedgerSearchQuery(e.target.value)}
                className="summary-search-input"
              />
            </div>

            <div className="table-scroll">
              <table className="summary-table">
                <thead>
                  <tr>
                    <th className="col-mo">Master Order / Variant</th>
                    <th>Rw IN</th><th>Rw OUT</th>
                    <th>Dism IN</th><th>Dism OUT</th>
                    <th>CPS IN</th><th>CPS OUT</th>
                    <th>Acc IN</th><th>Acc OUT</th>
                    <th>Pkg IN</th><th>Pkg OUT</th>
                    <th>FPS IN</th>
                    <th className="col-scrap">IR Scrp</th>
                    <th className="col-scrap">OR Scrp</th>
                    <th className="col-scrap">Cg Scrp</th>
                    <th className="col-scrap">Rl Scrp</th>
                    <th className="col-scrap">Tot Scrp</th>
                  </tr>
                </thead>
                <tbody>
                  {generateSummaryData().map(moData => (
                    <React.Fragment key={moData.mo}>
                      {/* LEVEL 0: MO ROW */}
                      <tr
                        onClick={() => setExpandedMOs(p => ({ ...p, [moData.mo]: !p[moData.mo] }))}
                        className={`row-mo ${expandedMOs[moData.mo] ? 'row-mo-expanded' : ''}`}
                      >
                        <td className="mo-toggle-cell">{expandedMOs[moData.mo] ? '▼' : '▶'} {moData.mo}</td>
                        <td>{moData.totals.rwIn || '-'}</td><td>{moData.totals.rwOut || '-'}</td>
                        <td>{moData.totals.disIn || '-'}</td><td className="cell-dis-out">{moData.totals.disOut || '-'}</td>
                        <td>{moData.totals.cpsIn || '-'}</td><td>{moData.totals.cpsOut || '-'}</td>
                        <td>{moData.totals.accIn || '-'}</td><td>{moData.totals.accOut || '-'}</td>
                        <td>{moData.totals.apIn || '-'}</td><td>{moData.totals.apOut || '-'}</td>
                        <td>{moData.totals.fpsIn || '-'}</td>
                        <td className="cell-scrap-sub">{moData.totals.irScrap || '-'}</td>
                        <td className="cell-scrap-sub">{moData.totals.orScrap || '-'}</td>
                        <td className="cell-scrap-sub">{moData.totals.cageScrap || '-'}</td>
                        <td className="cell-scrap-sub">{moData.totals.ballScrap || '-'}</td>
                        <td className="cell-scrap-total">{moData.totals.totalScrap || '-'}</td>
                      </tr>

                      {expandedMOs[moData.mo] && Object.entries(moData.variants).map(([variant, vData]) => {
                        const vKey = `${moData.mo}-${variant}`;
                        return (
                          <React.Fragment key={variant}>
                            {/* LEVEL 1: VARIANT ROW */}
                            <tr
                              onClick={() => setExpandedVariants(p => ({ ...p, [vKey]: !p[vKey] }))}
                              className="row-variant"
                            >
                              <td className="variant-toggle-cell">{expandedVariants[vKey] ? '▼' : '▶'} {variant}</td>
                              <td>{vData.rwIn || '-'}</td><td>{vData.rwOut || '-'}</td>
                              <td>{vData.disIn || '-'}</td><td className="cell-dis-out">{vData.disOut || '-'}</td>
                              <td>{vData.cpsIn || '-'}</td><td>{vData.cpsOut || '-'}</td>
                              <td>{vData.accIn || '-'}</td><td>{vData.accOut || '-'}</td>
                              <td>{vData.apIn || '-'}</td><td>{vData.apOut || '-'}</td>
                              <td>{vData.fpsIn || '-'}</td>
                              <td className="cell-scrap-sub">{vData.irScrap || '-'}</td>
                              <td className="cell-scrap-sub">{vData.orScrap || '-'}</td>
                              <td className="cell-scrap-sub">{vData.cageScrap || '-'}</td>
                              <td className="cell-scrap-sub">{vData.ballScrap || '-'}</td>
                              <td className="cell-scrap-total">{vData.totalScrap || '-'}</td>
                            </tr>
                                                        
                            {/* LEVEL 2: COMPONENT DISPATCH DETAILS */}
                            {expandedVariants[vKey] && (
                              <tr>
                                <td colSpan="17" style={{ padding: 0 }}>
                                  {renderMoDispatchDetails(vData.records)}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}

                      {/* MO BOTTOM TOTAL ROW */}
                      {expandedMOs[moData.mo] && (
                        <tr className="row-total">
                          <td className="label-cell">TOTAL FOR {moData.mo}:</td>
                          <td>{moData.totals.rwIn || '-'}</td><td>{moData.totals.rwOut || '-'}</td>
                          <td>{moData.totals.disIn || '-'}</td><td className="cell-dis-out">{moData.totals.disOut || '-'}</td>
                          <td>{moData.totals.cpsIn || '-'}</td><td>{moData.totals.cpsOut || '-'}</td>
                          <td>{moData.totals.accIn || '-'}</td><td>{moData.totals.accOut || '-'}</td>
                          <td>{moData.totals.apIn || '-'}</td><td>{moData.totals.apOut || '-'}</td>
                          <td>{moData.totals.fpsIn || '-'}</td>

                          <td colSpan="5" className="scrap-grand-total-cell">
                            Grand Total Scrap: {moData.totals.totalScrap}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'scrapData' && (
          <div className="summary-view scrap-summary-view">
            <div className="summary-view-header">
              <h2 className="summary-view-title" style={{ color: 'var(--ac-red)' }}>Overall Scrap Integration (XA)</h2>
              <input
                type="text"
                placeholder="Search Master Order (MO)..."
                value={scrapSearchQuery}
                onChange={(e) => setScrapSearchQuery(e.target.value)}
                className="summary-search-input"
              />
              <button className="pvsm-btn-load" onClick={fetchScrapData}>🔄 Refresh Scrap</button>
            </div>

            <div className="table-scroll">
              <table className="summary-table scrap-table">
                <thead>
                  <tr>
                    <th className="col-mo">Master Order (MO) / Reason Code</th>
                    <th className="col-scrap">SHO Scrap</th>
                    <th className="col-scrap">Channel Scrap</th>
                    <th className="col-scrap" style={{ color: 'var(--ac-red)' }}>Overall Scrap</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredScrapData().length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No Scrap Data Available.</td></tr>
                  ) : getFilteredScrapData().map(moNode => (
                    <React.Fragment key={moNode.mo}>
                      <tr onClick={() => setExpandedScrapMOs(p => ({ ...p, [moNode.mo]: !p[moNode.mo] }))} className={`row-mo ${expandedScrapMOs[moNode.mo] ? 'row-mo-expanded' : ''}`}>
                        <td className="mo-toggle-cell" style={{ fontWeight: '700', cursor: 'pointer' }}>
                          {expandedScrapMOs[moNode.mo] ? '▼' : '▶'} {moNode.mo}
                        </td>
                        <td className="cell-scrap-sub">{moNode.sho_scrap}</td>
                        <td className="cell-scrap-sub">{moNode.channel_scrap}</td>
                        <td className="cell-scrap-total" style={{ color: 'var(--ac-red)' }}>{moNode.total_scrap}</td>
                      </tr>
                      
                      {expandedScrapMOs[moNode.mo] && Object.values(moNode.breakdown).map(rcNode => {
                        const rcKey = `${moNode.mo}-${rcNode.reason}`;
                        return (
                          <React.Fragment key={rcNode.reason}>
                            <tr onClick={() => setExpandedScrapReasons(p => ({ ...p, [rcKey]: !p[rcKey] }))} className="row-variant" style={{ background: '#fafafa', cursor: 'pointer' }}>
                              <td className="variant-toggle-cell" style={{ paddingLeft: '30px', color: '#0f1b33' }}>
                                {expandedScrapReasons[rcKey] ? '▼' : '▶'} {rcNode.reason}
                              </td>
                              <td>-</td>
                              <td>-</td>
                              <td className="cell-scrap-total">{rcNode.total}</td>
                            </tr>

                            {expandedScrapReasons[rcKey] && Object.entries(rcNode.types).map(([vName, vStats]) => (
                              <tr key={`${rcKey}-${vName}`} style={{ background: '#ffffff' }}>
                                <td style={{ paddingLeft: '50px', fontSize: '11.5px', color: '#5b6478' }}>
                                  <strong>{vName}</strong> (IM: {vStats.IM} | OM: {vStats.OM} | Other: {vStats.other})
                                </td>
                                <td>-</td>
                                <td>-</td>
                                <td className="cell-scrap-sub" style={{ fontWeight: '600' }}>{vStats.total}</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Afterchannel;