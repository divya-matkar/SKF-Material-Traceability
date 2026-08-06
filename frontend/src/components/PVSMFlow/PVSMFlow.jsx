import React, { useState } from "react";
import Flow from "../Flow/Flow";
import { FaArrowDown, FaArrowUp, FaBoxOpen, FaTrashAlt, FaExclamationTriangle } from "react-icons/fa";
import "./PVSMFlow.css";

const NodeCard = ({
  flowId,
  title,
  subtitle,
  icon,
  mIn,
  mOut,
  mScrap,
  mLeftover,
  mIR,
  mOR,
  visited,
  borderCls
}) => (
  <div className={`process-card-blueprint ${borderCls || ''}`} data-flow-id={flowId}>
    <FaExclamationTriangle className="delta-icon-corner" />

    <div className="card-header-bp">
      <div className="header-top-row">
        <div className="process-icon-box">{icon}</div>
        <div className="title-wrapper">
          <div className="title-row">
            <h4 className="process-title">{title}</h4>
          </div>
          <p className="process-subtitle">{subtitle}</p>
        </div>
      </div>
    </div>

    <div className="divider-bp" />

    <div className="card-body-bp">
      <div className="metrics-grid">
        {mIn !== undefined && (
          <div className="metric-col">
            <FaArrowDown className="metric-icon incoming-icon" />
            <span className="metric-label">Incoming</span>
            <span className="metric-value value-incoming">{mIn}</span>
            <span className="metric-unit">PCS</span>
          </div>
        )}

        {mOut !== undefined && (
          <div className="metric-col">
            <FaArrowUp className="metric-icon outgoing-icon" />
            <span className="metric-label">Outgoing</span>
            <span className="metric-value value-outgoing">{mOut}</span>
            <span className="metric-unit">PCS</span>
          </div>
        )}

        {mIR !== undefined && (
          <div className="metric-col">
            <span className="metric-label">IR</span>
            <span className="metric-value value-outgoing">{mIR}</span>
            <span className="metric-unit">PCS</span>
          </div>
        )}

        {mOR !== undefined && (
          <div className="metric-col">
            <span className="metric-label">OR</span>
            <span className="metric-value value-outgoing">{mOR}</span>
            <span className="metric-unit">PCS</span>
          </div>
        )}

        {mScrap !== undefined && (
          <div className="metric-col">
            <FaTrashAlt className="metric-icon scrap-icon" />
            <span className="metric-label">Scrap</span>
            <span className="metric-value value-scrap">{mScrap}</span>
            <span className="metric-unit">PCS</span>
          </div>
        )}

        {mLeftover !== undefined && (
          <div className="metric-col">
            <FaBoxOpen className="metric-icon leftover-icon" />
            <span className="metric-label">Leftover</span>
            <span className="metric-value value-outgoing">{mLeftover}</span>
            <span className="metric-unit">PCS</span>
          </div>
        )}
      </div>
    </div>

    <div className="card-footer-bp">
      <div className={`status-pill-bp ${visited?.includes("Visited") ? "pill-finished" : "pill-not-visited"}`}>
        {visited || "Not Visited"}
      </div>
    </div>
  </div>
);

const PVSMFlow = ({ dynamicMosList = [], dynamicVariantsList = [], ledgers = {} }) => {
  const [pvsmMo, setPvsmMo] = useState('');
  const [pvsmType, setPvsmType] = useState('');
  const [isFlowLoaded, setIsFlowLoaded] = useState(false);

  const handleLoadFlow = () => {
    if (!pvsmMo) {
      alert("Please select MO");
      return;
    }
    setIsFlowLoaded(true);
  };

  const getFiltered = (deptKey) => {
    let data = ledgers[deptKey] || [];
    if (isFlowLoaded) {
      if (pvsmMo && pvsmMo !== 'Select MO') {
        data = data.filter(r => (r.mo || '').toUpperCase() === pvsmMo.toUpperCase());
      }
      if (pvsmType && pvsmType !== 'Select Type') {
        data = data.filter(r => (r.bearing_type || r.type || r.item_type || '').toUpperCase() === pvsmType.toUpperCase());
      }
    } else {
      return []; 
    }
    return data;
  };

  const dataAccurate = getFiltered('accurate');
  const dataCps = getFiltered('cps');
  const dataRework = getFiltered('rework');
  const dataDismantling = getFiltered('dismantling');
  const dataAutopackaging = getFiltered('autopackaging');
  const dataFps = getFiltered('fps');

  const accIn = dataAccurate.reduce((sum, r) => {
    const from = String(r.material_in_from || r.materialInFrom || '').toLowerCase();
    return (!from.includes('rework') && !from.includes('dismantling')) ? sum + (Number(r.qty_in || r.qtyIn) || 0) : sum;
  }, 0);

  const accOut = dataAccurate.reduce((sum, r) => {
    const to = String(r.next_station || r.nextStation || '').toLowerCase();
    return (!to.includes('rework') && !to.includes('dismantling')) ? sum + (Number(r.qty_sent || r.qtySent) || 0) : sum;
  }, 0);

  const sumSimple = (dataList, field1, field2) => dataList.reduce((sum, r) => sum + (Number(r[field1] || r[field2]) || 0), 0);

  const dismScrap = dataDismantling.reduce((sum, r) => {
    return sum + (Number(r.ir_scrap) || 0) + (Number(r.or_scrap) || 0) + (Number(r.cage_scrap) || 0) + (Number(r.ball_scrap) || 0) + (Number(r.roller_scrap) || 0);
  }, 0);

  const metrics = {
    channel: { in: 0, out: accIn, scrap: 0, visited: isFlowLoaded ? 'Visited' : 'Not Visited' },
    cps: { in: sumSimple(dataCps, 'qty_in', 'qtyIn'), out: sumSimple(dataCps, 'qty_sent', 'qtySent'), scrap: 0, visited: isFlowLoaded ? 'Visited - Channel' : 'Not Visited - Channel' },
    disassembly: { in: sumSimple(dataDismantling, 'qty_in', 'qtyIn'), out: sumSimple(dataDismantling, 'qty_sent', 'qtySent'), scrap: dismScrap, visited: isFlowLoaded ? 'Visited - Channel' : 'Not Visited - Channel' },
    rework: { in: sumSimple(dataRework, 'qty_in', 'qtyIn'), out: sumSimple(dataRework, 'qty_sent', 'qtySent'), scrap: 0, visited: isFlowLoaded ? 'Visited - Channel' : 'Not Visited - Channel' },
    accurate: { in: accIn, out: accOut, scrap: 0, visited: isFlowLoaded ? 'Visited' : 'Not Visited' },
    autoPacking: { in: sumSimple(dataAutopackaging, 'qty_in', 'qtyIn'), out: sumSimple(dataAutopackaging, 'qty_sent', 'qtySent'), scrap: 0, visited: isFlowLoaded ? 'Visited' : 'Not Visited' },
    fps: { in: sumSimple(dataFps, 'qty_in', 'qtyIn'), out: sumSimple(dataFps, 'qty_sent', 'qtySent'), scrap: 0, visited: isFlowLoaded ? 'Finished' : 'Not Visited' },
    commonScrap: { scrap: dismScrap }
  };

  return (
    <div className="pvsm-wrapper">
      <div className="pvsm-top-controls">
        <div className="control-group">
          <label>MO Type</label>
          <select value={pvsmMo} onChange={(e) => setPvsmMo(e.target.value)}>
            <option value="">Select MO</option>
            {dynamicMosList.map(mo => (
              <option key={mo} value={mo}>{mo}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Variant</label>
          <select value={pvsmType} onChange={(e) => setPvsmType(e.target.value)}>
            <option value="">Select Variant</option>
            {dynamicVariantsList.map((variant) => (
              <option key={variant} value={variant}>{variant}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Filter</label>
          <select>
            <option>Select Filter</option>
            <option>IR</option>
            <option>OR</option>
            <option>Bearing</option>
          </select>
        </div>

        <button onClick={handleLoadFlow}>▶ Load Flow</button>
      </div>

      <div className="pvsm-canvas">
        <Flow />
        <div className="pvsm-grid">
          {/* ROW 1 */}
          <div className="node-pos-dmstore">
            <NodeCard flowId="dm-store" title="DM Store" subtitle="Material Storage" icon="🏛" mOut={0} mIR={0} mOR={0} visited="Not Visited" />
          </div>
          <div className="node-pos-sho">
            <NodeCard flowId="sho" title="SHO" subtitle="Shared Handling" icon="📈" mScrap={0} mLeftover={0} visited="Not Visited" />
          </div>
          <div className="node-pos-transit">
            <NodeCard flowId="transit-buffer" title="Transit Buffer" subtitle="Buffer" icon="🚚" mOut={0} visited="Not Visited" />
          </div>
          <div className="node-pos-channel">
            <NodeCard flowId="channel" title="Channel" subtitle="Production" icon="🖧" mOut={metrics.channel.out} visited={metrics.channel.visited} />
          </div>
          <div className="node-pos-bearingstore">
            <NodeCard flowId="bearing-storage" title="Bearing Storage" subtitle="Storage" icon="📦" mIn={0} mOut={0} visited="Not Visited" />
          </div>

          {/* ROW 2 */}
          <div className="node-pos-cps">
            <NodeCard flowId="cps" title="CPS" subtitle="Storage" icon="🏢" mIn={metrics.cps.in} mOut={metrics.cps.out} visited={metrics.cps.visited} borderCls="border-dashed" />
          </div>
          <div className="node-pos-disassembly">
            <NodeCard flowId="disassembly" title="Disassembly Area" subtitle="Rework" icon="🔧" mIn={metrics.disassembly.in} mOut={metrics.disassembly.out} visited={metrics.disassembly.visited} borderCls="border-dashed" />
          </div>
          <div className="node-pos-rework">
            <NodeCard flowId="rework" title="Rework Area" subtitle="Repair" icon="🔄" mIn={metrics.rework.in} mOut={metrics.rework.out} visited={metrics.rework.visited} borderCls="border-dashed" />
          </div>
          <div className="node-pos-accurate">
            <NodeCard flowId="accurate" title="Accurate" subtitle="Inspection" icon="🎯" mOut={metrics.accurate.out} visited={metrics.accurate.visited} borderCls="border-green" />
          </div>
          <div className="node-pos-autopacking">
            <NodeCard flowId="auto-packing" title="Auto Packing" subtitle="Packing" icon="🏭" mOut={metrics.autoPacking.out} visited={metrics.autoPacking.visited} borderCls="border-green" />
          </div>

          {/* ROW 3 */}
          <div className="node-pos-legend">
            <div className="pvsm-legend">
              <h4>Flow Legend</h4>
              <div className="pvsm-legend-item"><div className="pvsm-legend-line line-green"></div> Material Flow</div>
              <div className="pvsm-legend-item"><div className="pvsm-legend-line line-red"></div> Return Flow</div>
              <div className="pvsm-legend-item"><div className="pvsm-legend-line line-orange-dash"></div> Scrap Flow</div>
            </div>
          </div>
          <div className="node-pos-commonscrap">
            <NodeCard flowId="common-scrap" title="Common Scrap" subtitle="Scrap" icon="🗑" mScrap={metrics.commonScrap.scrap} visited="Not Visited" borderCls="border-red" />
          </div>
          <div className="node-pos-fps">
            <NodeCard flowId="fps" title="FPS" subtitle="Finished Product" icon="🛡" mIn={metrics.fps.in} mOut={metrics.fps.out} visited={metrics.fps.visited} borderCls="border-green" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PVSMFlow;