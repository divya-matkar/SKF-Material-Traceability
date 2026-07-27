import React from "react";
import "./ChannelDashboard.css";

function ChannelDashboard() {
  return (
    <div className="channel-dashboard">

      {/* Header Card */}
      <div className="header-card">
        <div className="dashboard-header">
          <h1>MO Production Tracking System</h1>

          <button className="new-mo-btn">
            + New MO
          </button>
        </div>
      </div>

      {/* MO Entry Form */}
      <div className="form-card">

        <div className="form-grid">

          <div className="form-group">
            <label>Date</label>
            <input type="date" />
          </div>

          <div className="form-group">
            <label>MO Number</label>
            <input
              type="text"
              placeholder="Enter MO Number"
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <input
              type="text"
              placeholder="Type"
            />
          </div>

          <div className="form-group">
            <label>Variant</label>
            <input
              type="text"
              placeholder="Variant"
            />
          </div>

          <div className="form-group">
            <label>Pack Code</label>
            <input
              type="text"
              placeholder="Pack Code"
            />
          </div>

          <div className="form-group">
            <label>Shift</label>
            <select>
              <option>Shift 1</option>
              <option>Shift 2</option>
              <option>Shift 3</option>
            </select>
          </div>

          <div className="form-group">
            <label>Station</label>
            <select>
              <option>QC</option>
              <option>AP</option>
            </select>
          </div>

          <div className="form-group">
            <label>Required Qty</label>
            <input
              type="number"
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label>Produced Qty</label>
            <input
              type="number"
              placeholder="0"
            />
          </div>

        </div>

        <div className="form-actions">
          <button className="save-mo-btn">
            Save MO
          </button>
        </div>

      </div>

      {/* MO Summary */}
      <div className="summary-card">

        <h2>MO Summary</h2>

        <table className="summary-table">

          <thead>
            <tr>
              <th>MO Number</th>
              <th>Variant</th>
              <th>Required Qty</th>
              <th>Produced Qty</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td colSpan="5">
                No Manufacturing Orders Found
              </td>
            </tr>
          </tbody>

        </table>

      </div>

      {/* Selected MO */}
      <div className="selected-card">

        <h2>Selected MO</h2>

        <p>No Manufacturing Order Selected</p>

        <div className="selected-actions">

          <button className="primary-btn">
            + Add Production
          </button>

          <button className="secondary-btn">
            New Entry
          </button>

          <button className="secondary-btn">
            Edit Entry
          </button>

        </div>

      </div>

      {/* Production Entries */}
      <div className="production-card">

        <h2>Production Entries</h2>

        <table className="production-table">

          <thead>
            <tr>
              <th>Variant</th>
              <th>Pack Code</th>
              <th>Required Qty</th>
              <th>Produced Qty</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td colSpan="4">
                No Production Entries
              </td>
            </tr>
          </tbody>

        </table>

      </div>

    </div>
  );
}

export default ChannelDashboard;