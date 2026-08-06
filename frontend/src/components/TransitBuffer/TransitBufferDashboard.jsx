import React from 'react';
import './TransitBufferDashboard.css';

const TransitBufferDashboard = ({
  moNumber,
  setMoNumber,
  handleMoBlur,
  dynamicMosList,
  tbOperator,
  setTbOperator,
  tbChannel,
  setTbChannel,
  tbShift,
  setTbShift,
  tbContainerType,
  setTbContainerType,
  tbPallet,
  setTbPallet,
  tbRingSide,
  setTbRingSide,
  tbRingType,
  setTbRingType,
  tbSampleWeight,
  setTbSampleWeight,
  tbContainerQty,
  setTbContainerQty,
  tbGrossWeight,
  setTbGrossWeight,
  tbStdQty,
  tbFinalQty,
  handleTransitSave
}) => {
  return (
    <div className="transit-container">
      <div className="form-card-title-wrapper">
        <h1 className="form-card-title">TRANSIT BUFFER ENTRY</h1>
      </div>

      <div className="transit-layout">
        <div className="transit-left">
          <div className="channel-section-card">
            <h3 className="channel-section-title">STATION INFO</h3>
            <div className="channel-grid">
              <div className="field-group">
                <label className="field-label">Operator Name</label>
                <input
                  value={tbOperator}
                  onChange={(e) => setTbOperator(e.target.value)}
                  className="field-input"
                  placeholder="Operator Name"
                />
              </div>

              <div className="field-group">
                <label className="field-label">Channel</label>
                <select
                  value={tbChannel}
                  onChange={(e) => setTbChannel(e.target.value)}
                  className="field-input"
                >
                  <option value="">Select Channel</option>
                  <option value="CH02">CH02</option>
                  <option value="CH03">CH03</option>
                  <option value="CH04">CH04</option>
                  <option value="CH05">CH05</option>
                  <option value="T3">T3</option>
                  <option value="T4">T4</option>
                  <option value="T5">T5</option>
                  <option value="T6">T6</option>
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Shift</label>
                <select
                  value={tbShift}
                  onChange={(e) => setTbShift(e.target.value)}
                  className="field-input"
                >
                  <option value="">Select Shift</option>
                  <option value="1">Shift 1</option>
                  <option value="2">Shift 2</option>
                  <option value="3">Shift 3</option>
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">MO Number</label>
                <input
                  list="mo-list"
                  value={moNumber}
                  onChange={(e) => setMoNumber(e.target.value)}
                  onBlur={handleMoBlur}
                  placeholder="Select or Type MO..."
                  className="field-input"
                  required
                />
              </div>
            </div>
          </div>

          <div className="channel-section-card">
            <h3 className="channel-section-title">CALCULATION SETTINGS</h3>
            <div className="channel-grid">
              <div className="field-group">
                <label className="field-label">Container Type</label>
                <select
                  value={tbContainerType}
                  onChange={(e) => setTbContainerType(e.target.value)}
                  className="field-input"
                >
                  <option value="7.8">Tote Box (7.8kg)</option>
                  <option value="22.2">Blue Bin (22.2kg)</option>
                  <option value="18">Single Collar GSP(18kg)</option>
                  <option value="21.6">Two Collar GSP(21.6kg)</option>
                  <option value="31">Three Collar GSP(31kg)</option>
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Include Pallet (7.1 kg)</label>
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={tbPallet}
                    onChange={(e) => setTbPallet(e.target.checked)}
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">IM / OM Type</label>
                <select
                  value={tbRingSide}
                  onChange={(e) => setTbRingSide(e.target.value)}
                  className="field-input"
                >
                  <option value="">Select Type</option>
                  <option value="IM">IM</option>
                  <option value="OM">OM</option>
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Ring Type</label>
                <input
                  value={tbRingType}
                  onChange={(e) => setTbRingType(e.target.value)}
                  className="field-input"
                  placeholder="Type..."
                />
              </div>

              <div className="field-group">
                <label className="field-label">Sample Weight</label>
                <input
                  value={tbSampleWeight}
                  onChange={(e) => setTbSampleWeight(e.target.value)}
                  className="field-input"
                  placeholder="0"
                />
              </div>

              <div className="field-group">
                <label className="field-label">No. Containers</label>
                <input
                  type="number"
                  value={tbContainerQty}
                  onChange={(e) => setTbContainerQty(e.target.value)}
                  className="field-input"
                />
              </div>
            </div>

            <button
              type="button"
              className="submit-btn submit-btn-in"
              style={{ marginTop: '20px' }}
              onClick={handleTransitSave}
            >
              FINALIZE & SAVE
            </button>
          </div>
        </div>

        <div className="transit-right">
          <div className="live-scale-card">
            <div className="qty-title">LIVE SCALE</div>
            <div className="live-weight-badge">{tbGrossWeight || '0'} kg</div>
            <button
              type="button"
              className="capture-btn"
              onClick={() => setTbGrossWeight(280)}
            >
              CAPTURE GROSS
            </button>
            <hr />

            <div className="qty-title">STANDARD BOX QTY</div>
            <div className="qty-number">{tbStdQty}</div>

            <div className="qty-title">FINAL QTY</div>
            <div className="qty-number big">{tbFinalQty}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransitBufferDashboard;