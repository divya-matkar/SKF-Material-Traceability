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
      ? (localStorage.getItem("activeTab") || "accurate")
      : userRole;

  const roleTabs = {
    user: [
      "transitbuffer", "channel", "accurate", "autopackaging", 
      "cps", "fps", "rework", "dismantling", 
      "summary", "visualFlow", "scrapData"
    ],
    transitbuffer: ["transitbuffer"],
    channel: ["channel"],
    accurate: ["accurate"],
    cps: ["cps"],
    rework: ["rework"],
    dismantling: ["dismantling"],
    autopackaging: ["autopackaging"],
    fps: ["fps"],
  };

  const mainStationTabs = [
    { id: "accurate", label: "Accurate" },
    { id: "autopackaging", label: "Auto Packaging" },
    { id: "cps", label: "CPS" },
    { id: "fps", label: "FPS" },
    { id: "rework", label: "Rework" },
    { id: "dismantling", label: "Dismantling" }
  ];

  const stationOptions = [
     "Channel", "Accurate", "Auto Packaging", "CPS", "FPS", "Rework", "Dismantling"
  ];

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [subView, setSubView] = useState('IN'); // 'IN' or 'OUT'

  const [moCache, setMoCache] = useState({});
  const [ledgers, setLedgers] = useState({
    channel: [], accurate: [], cps: [], rework: [], dismantling: [], autopackaging: [], fps: [], transitbuffer: []
  });

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

  // Form States for Station IN View with QTY RECEIVED
  const [inFormData, setInFormData] = useState({
    date: new Date().toISOString().split('T')[0], 
    moNumber: '', 
    type: '', 
    variant: '', 
    packCode: '', 
    shift: '', 
    station: '',
    qtyReceived: ''
  });

  // Form States for Station OUT View
  const [outFormData, setOutFormData] = useState({
    moNumber: '', 
    type: '', 
    variant: '', 
    packCode: '', 
    shiftOut: '', 
    nextStation: '', 
    qtySent: '', 
    outDate: new Date().toISOString().split('T')[0]
  });

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

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSubView('IN');
  };

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

  const handleInInputChange = (e) => {
    const { name, value } = e.target;
    setInFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOutInputChange = (e) => {
    const { name, value } = e.target;
    setOutFormData(prev => ({ ...prev, [name]: value }));
  };

  // ================= CORE ROUTING & AUTOMATED HANDOVER ENGINE =================
  const handleStationFormSubmit = async (e) => {
    e.preventDefault();
    const sourceStation = activeTab;

    if (subView === 'IN') {
      const inEntry = {
        id: Date.now(),
        moNumber: inFormData.moNumber,
        mo: inFormData.moNumber,
        type: inFormData.type,
        variant: inFormData.variant,
        packCode: inFormData.packCode,
        shift: inFormData.shift,
        station: inFormData.station || sourceStation,
        date: inFormData.date,
        in_date: inFormData.date,
        qty_in: Number(inFormData.qtyReceived) || 0,
        qtyReceived: Number(inFormData.qtyReceived) || 0,
        material_in_from: inFormData.station || "MANUAL_ENTRY",
        viewMode: 'IN'
      };

      setLedgers(prev => ({
        ...prev,
        [sourceStation]: [inEntry, ...(prev[sourceStation] || [])]
      }));

      alert(`"IN" Record saved successfully for ${sourceStation.toUpperCase()}`);
      setInFormData({ date: new Date().toISOString().split('T')[0], moNumber: '', type: '', variant: '', packCode: '', shift: '', station: '', qtyReceived: '' });

    } else {
      const targetStation = outFormData.nextStation.toLowerCase().replace(/\s+/g, '');

      const outEntry = {
        id: Date.now(),
        moNumber: outFormData.moNumber,
        mo: outFormData.moNumber,
        type: outFormData.type,
        variant: outFormData.variant,
        packCode: outFormData.packCode,
        shift_out: outFormData.shiftOut,
        next_station: outFormData.nextStation,
        qty_sent: Number(outFormData.qtySent) || 0,
        out_date: outFormData.outDate,
        viewMode: 'OUT'
      };

      const handoverInEntry = {
        id: Date.now() + 1,
        moNumber: outFormData.moNumber,
        mo: outFormData.moNumber,
        type: outFormData.type,
        variant: outFormData.variant,
        packCode: outFormData.packCode,
        shift: outFormData.shiftOut,
        station: targetStation,
        date: outFormData.outDate,
        in_date: outFormData.outDate,
        qty_in: Number(outFormData.qtySent) || 0,
        qtyReceived: Number(outFormData.qtySent) || 0,
        material_in_from: sourceStation.toUpperCase(),
        viewMode: 'IN'
      };

      setLedgers(prev => {
        const updatedSource = [outEntry, ...(prev[sourceStation] || [])];
        const updatedTarget = prev[targetStation] 
          ? [handoverInEntry, ...(prev[targetStation])]
          : (prev[targetStation] || []);

        return {
          ...prev,
          [sourceStation]: updatedSource,
          ...(prev[targetStation] !== undefined && { [targetStation]: updatedTarget })
        };
      });

      alert(`"OUT" Record logged at ${sourceStation.toUpperCase()} & auto-transferred as "IN" record to ${outFormData.nextStation.toUpperCase()}!`);
      setOutFormData({ moNumber: '', type: '', variant: '', packCode: '', shiftOut: '', nextStation: '', qtySent: '', outDate: new Date().toISOString().split('T')[0] });
    }
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

  const isStationTab = mainStationTabs.some(t => t.id === activeTab);
  const currentTabLabel = mainStationTabs.find(t => t.id === activeTab)?.label || activeTab.toUpperCase();

  const currentStationRecords = (ledgers[activeTab] || []).filter(r => {
    if (subView === 'IN') {
      return r.viewMode === 'IN' || r.qty_in > 0 || (!r.qty_sent && !r.viewMode);
    } else {
      return r.viewMode === 'OUT' || r.qty_sent > 0;
    }
  });

  return (
    <div className="afterchannel-container">         
      <datalist id="mo-list">
        {dynamicMosList.map(mo => <option key={mo} value={mo} />)}
      </datalist>
      <datalist id="variants-list">
        {dynamicVariantsList.map(v => <option key={v} value={v} />)}
      </datalist>
      
      {/* HEADER & TAB NAVIGATION */}
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

        {roleTabs[userRole]?.includes("accurate") && (
          <button
            className={`tab-pill ${activeTab === "accurate" ? "tab-pill-active" : ""}`}
            onClick={() => setActiveTab("accurate")}
          >
            ACCURATE
          </button>
        )}

        {roleTabs[userRole]?.includes("cps") && (
          <button
            className={`tab-pill ${activeTab === "cps" ? "tab-pill-active" : ""}`}
            onClick={() => setActiveTab("cps")}
          >
            CPS
          </button>
        )}

        {roleTabs[userRole]?.includes("rework") && (
          <button
            className={`tab-pill ${activeTab === "rework" ? "tab-pill-active" : ""}`}
            onClick={() => setActiveTab("rework")}
          >
            REWORK
          </button>
        )}

        {roleTabs[userRole]?.includes("dismantling") && (
          <button
            className={`tab-pill ${activeTab === "dismantling" ? "tab-pill-active" : ""}`}
            onClick={() => setActiveTab("dismantling")}
          >
            DISMANTLING
          </button>
        )}

        {roleTabs[userRole]?.includes("autopackaging") && (
          <button
            className={`tab-pill ${activeTab === "autopackaging" ? "tab-pill-active" : ""}`}
            onClick={() => setActiveTab("autopackaging")}
          >
            AUTOPACKAGING
          </button>
        )}

        {roleTabs[userRole]?.includes("fps") && (
          <button
            className={`tab-pill ${activeTab === "fps" ? "tab-pill-active" : ""}`}
            onClick={() => setActiveTab("fps")}
          >
            FPS
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
        {/* CHANNEL TAB */}
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

        {/* TRANSIT BUFFER TAB */}
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

        {/* STATION VIEWS (Accurate, Auto Packaging, CPS, FPS, Rework, Dismantling) */}
        {isStationTab && (
          <div>
            <form onSubmit={handleStationFormSubmit}>
              <fieldset className={`form-fieldset ${subView === 'OUT' ? 'form-fieldset-out' : ''}`}>
                <div className="form-card-header-bar">
                  <div className="form-card-title">
                    {currentTabLabel.toUpperCase()} — {subView === 'IN' ? 'IN (RECEIVING)' : 'OUT (DISPATCH)'}
                  </div>
                  <div className="sub-nav-toggle">
                    <button
                      type="button"
                      className={`sub-nav-btn ${subView === 'IN' ? 'sub-nav-btn-active btn-in' : ''}`}
                      onClick={() => setSubView('IN')}
                    >
                      In
                    </button>
                    <button
                      type="button"
                      className={`sub-nav-btn ${subView === 'OUT' ? 'sub-nav-btn-active btn-out' : ''}`}
                      onClick={() => setSubView('OUT')}
                    >
                      Out
                    </button>
                  </div>
                </div>

                <div className="form-card-body">
                  {subView === 'IN' ? (
                    /* IN (RECEIVING) VIEW WITH DROPDOWNS & QTY RECEIVED */
                    <div className="form-grid-3">
                      <div className="field-group">
                        <label className="field-label">Date</label>
                        <input 
                          type="date" 
                          name="date" 
                          value={inFormData.date} 
                          onChange={handleInInputChange} 
                          className="field-input" 
                          required 
                        />
                      </div>

                      <div className="field-group">
                        <label className="field-label">MO Number</label>
                        <select 
                          name="moNumber" 
                          value={inFormData.moNumber} 
                          onChange={handleInInputChange} 
                          className="field-input" 
                          required
                        >
                          <option value="">Select MO Number</option>
                          {dynamicMosList.map(mo => (
                            <option key={mo} value={mo}>{mo}</option>
                          ))}
                        </select>
                      </div>

                      <div className="field-group">
                        <label className="field-label">Type</label>
                        <select 
                          name="type" 
                          value={inFormData.type} 
                          onChange={handleInInputChange} 
                          className="field-input"
                        >
                          <option value="">Select Type</option>
                          <option value="Ring WT">Ring WT</option>
                          <option value="MO Data">MO Data</option>
                          <option value="Standard">Standard</option>
                        </select>
                      </div>

                      <div className="field-group">
                        <label className="field-label">Variant</label>
                        <select 
                          name="variant" 
                          value={inFormData.variant} 
                          onChange={handleInInputChange} 
                          className="field-input"
                        >
                          <option value="">Select Variant</option>
                          {dynamicVariantsList.map(variant => (
                            <option key={variant} value={variant}>{variant}</option>
                          ))}
                        </select>
                      </div>

                      <div className="field-group">
                        <label className="field-label">Pack Code</label>
                        <select 
                          name="packCode" 
                          value={inFormData.packCode} 
                          onChange={handleInInputChange} 
                          className="field-input"
                        >
                          <option value="">Select Pack Code</option>
                          <option value="PC001">PC001 - Standard Box</option>
                          <option value="PC002">PC002 - Pallet Box</option>
                          <option value="PC003">PC003 - Custom Packing</option>
                        </select>
                      </div>

                      <div className="field-group">
                        <label className="field-label">Shift</label>
                        <select 
                          name="shift" 
                          value={inFormData.shift} 
                          onChange={handleInInputChange} 
                          className="field-input"
                        >
                          <option value="">Select Shift</option>
                          <option value="1">Shift 1</option>
                          <option value="2">Shift 2</option>
                          <option value="3">Shift 3</option>
                        </select>
                      </div>

                      <div className="field-group">
                        <label className="field-label">Station</label>
                        <select 
                          name="station" 
                          value={inFormData.station} 
                          onChange={handleInInputChange} 
                          className="field-input"
                        >
                          <option value="">Select Station</option>
                          {stationOptions.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      <div className="field-group">
                        <label className="field-label">Qty Received</label>
                        <input 
                          type="number" 
                          name="qtyReceived" 
                          value={inFormData.qtyReceived} 
                          onChange={handleInInputChange} 
                          placeholder="Enter Quantity Received..." 
                          className="field-input" 
                          required 
                        />
                      </div>
                    </div>
                  ) : (
                    /* OUT (DISPATCH) VIEW WITH DROPDOWNS */
                    <div className="form-grid-3">
                      <div className="field-group">
                        <label className="field-label">Date</label>
                        <input 
                          type="date" 
                          name="outDate" 
                          value={outFormData.outDate} 
                          onChange={handleOutInputChange} 
                          className="field-input" 
                          required 
                        />
                      </div>
                      <div className="field-group">
                        <label className="field-label">MO Number</label>
                        <select 
                          name="moNumber" 
                          value={outFormData.moNumber} 
                          onChange={handleOutInputChange} 
                          className="field-input" 
                          required
                        >
                          <option value="">Select MO Number</option>
                          {dynamicMosList.map(mo => (
                            <option key={mo} value={mo}>{mo}</option>
                          ))}
                        </select>
                      </div>

                      <div className="field-group">
                        <label className="field-label">Type</label>
                        <select 
                          name="type" 
                          value={outFormData.type} 
                          onChange={handleOutInputChange} 
                          className="field-input"
                        >
                          <option value="">Select Type</option>
                          <option value="Ring WT">Ring WT</option>
                          <option value="MO Data">MO Data</option>
                          <option value="Standard">Standard</option>
                        </select>
                      </div>

                      <div className="field-group">
                        <label className="field-label">Variant</label>
                        <select 
                          name="variant" 
                          value={outFormData.variant} 
                          onChange={handleOutInputChange} 
                          className="field-input"
                        >
                          <option value="">Select Variant</option>
                          {dynamicVariantsList.map(variant => (
                            <option key={variant} value={variant}>{variant}</option>
                          ))}
                        </select>
                      </div>

                      <div className="field-group">
                        <label className="field-label">Pack Code</label>
                        <select 
                          name="packCode" 
                          value={outFormData.packCode} 
                          onChange={handleOutInputChange} 
                          className="field-input"
                        >
                          <option value="">Select Pack Code</option>
                          <option value="PC001">PC001 - Standard Box</option>
                          <option value="PC002">PC002 - Pallet Box</option>
                          <option value="PC003">PC003 - Custom Packing</option>
                        </select>
                      </div>

                       <div className="field-group">
                        <label className="field-label">Shift</label>
                        <select 
                          name="shiftOut" 
                          value={outFormData.shiftOut} 
                          onChange={handleOutInputChange} 
                          className="field-input"
                        >
                          <option value="">Select Shift Out</option>
                          <option value="1">Shift 1</option>
                          <option value="2">Shift 2</option>
                          <option value="3">Shift 3</option>
                        </select>
                      </div>

                     <div className="field-group">
                      <label className="field-label">Next Station</label>
                      <select 
                        name="nextStation" 
                        value={outFormData.nextStation} 
                        onChange={handleOutInputChange} 
                        className="field-input" 
                        required
                      >
                        <option value="">Select Target Station</option>
                        {stationOptions.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                      <div className="field-group">
                        <label className="field-label">Qty Sent</label>
                        <input 
                          type="number" 
                          name="qtySent" 
                          value={outFormData.qtySent} 
                          onChange={handleOutInputChange} 
                          placeholder="Enter Quantity Sent..." 
                          className="field-input" 
                          required 
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className={`submit-btn ${subView === 'IN' ? 'submit-btn-in' : 'submit-btn-out'}`}
                    >
                      {subView === 'IN' ? 'Submit "In" Record' : 'Submit "Out" Handover Record'}
                    </button>
                  </div>
                </div>
              </fieldset>
            </form>

            {/* OPERATIONAL LEDGER LOG FOR ACTIVE VIEW (IN / OUT Isolated) */}
            <div className="ledger-card">
              <div className="ledger-card-header">
                <span>{currentTabLabel.toUpperCase()} — {subView === 'IN' ? 'Inbound Receiving Log' : 'Outbound Dispatch Log'}</span>
                <input 
                  type="text" 
                  placeholder="Search Log..." 
                  value={ledgerSearchQuery} 
                  onChange={(e) => setLedgerSearchQuery(e.target.value)} 
                  className="field-input" 
                  style={{ width: '260px', height: '36px' }} 
                />
              </div>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    {subView === 'IN' ? (
                      <tr>
                        <th>MO Number</th>
                        <th>Type / Variant</th>
                        <th>Pack Code</th>
                        <th>Origin Station</th>
                        <th>Shift</th>
                        <th>In Date</th>
                        <th>Qty Received</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>MO Number</th>
                        <th>Type / Variant</th>
                        <th>Pack Code</th>
                        <th>Target Station</th>
                        <th>Shift Out</th>
                        <th>Out Date</th>
                        <th>Qty Sent</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {currentStationRecords.length > 0 ? (
                      currentStationRecords
                        .filter(r => !ledgerSearchQuery || JSON.stringify(r).toLowerCase().includes(ledgerSearchQuery.toLowerCase()))
                        .map((row, idx) => (
                          <tr key={idx}>
                            <td>{row.moNumber || row.mo || '-'}</td>
                            <td>{row.type || row.variant || '-'}</td>
                            <td>{row.packCode || row.pack_code || '-'}</td>
                            <td>{subView === 'IN' ? (row.material_in_from || row.station || '-') : (row.next_station || row.nextStation || '-')}</td>
                            <td>{subView === 'IN' ? (row.shift || row.shift_in || '-') : (row.shift_out || row.shiftOut || '-')}</td>
                            <td>{subView === 'IN' ? (row.date || row.in_date || '-') : (row.outDate || row.out_date || '-')}</td>
                            <td><strong>{subView === 'IN' ? (row.qtyReceived || row.qty_in || row.qtyIn || '-') : (row.qty_sent || row.qtySent || '-')}</strong></td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                          No {subView === 'IN' ? 'Inbound' : 'Outbound'} records logged for {currentTabLabel}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VISUAL FLOW TAB */}
        {activeTab === "visualFlow" && (
          <PVSMFlow
            dynamicMosList={dynamicMosList}
            dynamicVariantsList={dynamicVariantsList}
            ledgers={ledgers}
          />
        )}

        {/* SUMMARY TAB */}
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

        {/* SCRAP DATA TAB */}
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