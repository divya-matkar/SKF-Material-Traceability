import React, { useState , useEffect} from "react";
import "./ChannelDashboard.css";

function ChannelDashboard({
    moNumber,
    setMoNumber,
    handleMoBlur,
    dynamicMosList,
    selectedVariant,
    setSelectedVariant,
    handleVariantChange,
    dynamicVariantsList,
    handleChannelSave,
    productionEntries,
    setProductionEntries,
    channelData,
    updateChannelData,
    selectedMO,
    setSelectedMO,
  }) {

  const [formData, setFormData] = useState({
    date: "",
    moNumber: "",
    type: "",
    variant: "", 
    packCode: "",
    shift: "1",
    station: "QC",
    requiredQty: "",
    producedQty: ""
  });

  const handleNewMO = () => {
    setFormData({
      date: "",
      type: "",
      packCode: "",
      shift: "1",
      station: "QC",
      requiredQty: "",
      producedQty: "",
    });

    setMoNumber("");
    setSelectedVariant("");
    setSelectedMO(null);
  };

  const handleNewEntry = () => {
    setFormData({
      ...formData,
      packCode: "",
      producedQty: "",
    });
  };

  const handleEditEntry = () => {
    if (!selectedMO) return;

    setFormData({
      date: selectedMO.in_date || "",
      type: "",
      packCode: "",
      shift: "1",
      station: "QC",
      requiredQty: selectedMO.qty_in || "",
      producedQty: selectedMO.qty_sent || "",
    });

    setMoNumber(selectedMO.mo);
    setSelectedVariant(selectedMO.bearing_type);
  };

  const updateMOSummary = (entries) => {

    const totalReq = entries.reduce(
        (sum, item) => sum + Number(item.requiredQty || 0),
        0
    );

    const totalProduced = entries.reduce(
        (sum, item) => sum + Number(item.producedQty || 0),
        0
    );

    const updatedSummary = channelData.map(item => {

        if (item.mo !== selectedMO.mo) return item;

        return {
            ...item,
            qty_in: totalReq,
            qty_sent: totalProduced
        };

    });

    updateChannelData(updatedSummary);

};

  const [mos, setMos] = useState([]);

  useEffect(() => {
    updateMOSummary(productionEntries);
}, [productionEntries]);

  const [editMode, setEditMode] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);

  const [productionQty, setProductionQty] = useState("");
  const [selectedProduction, setSelectedProduction] = useState("");
  const handleAddProduction = () => {
    if (!selectedMO) {
      alert("Please select an MO first.");
      return;
    }

    const newEntry = {
      id: Date.now(),
      mo: selectedMO.mo,  
      variant: selectedVariant,
      packCode: formData.packCode,
      requiredQty: formData.requiredQty,
      producedQty: formData.producedQty,
    };

    setProductionEntries((prev) => [...prev, newEntry]);
  };

  return (
     <>
   
    <div className="channel-dashboard">
      {/* MO Entry Form */}
       <div className="channel-page-header">
          <h1>CHANNEL ENTRY</h1>

          <button
            className="new-mo-btn"
            onClick={handleNewMO}
          >
            + New MO
          </button>
        </div>
      <div className="form-card">

        <div className="form-grid">

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  date: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>MO Number</label>

            <input
              list="mo-list"
              value={moNumber}
              onChange={(e) => setMoNumber(e.target.value)}
              onBlur={handleMoBlur}
              placeholder="Select or Type MO..."
            />

            <datalist id="mo-list">
              {dynamicMosList.map((mo) => (
                <option key={mo} value={mo} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label>Type</label>
           <input
              type="text"
              placeholder="Type"
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value,
                })
              }
            />
          </div>

        <div className="field-group">
          <label className="field-label">Variant</label>

          <input
            list="variants-list"
            value={selectedVariant}
            onChange={handleVariantChange}
            placeholder="Select or Type Variant..."
            className="field-input"
            required
          />

          <datalist id="variants-list">
            {dynamicVariantsList.map((variant) => (
              <option key={variant} value={variant} />
            ))}
          </datalist>
        </div>

          <div className="form-group">
            <label>Pack Code</label>
            <input
              type="text"
              placeholder="Pack Code"
              value={formData.packCode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  packCode: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Shift</label>
            <select
              value={formData.shift}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  shift: e.target.value,
                })
              }
            >
              <option value="1">Shift 1</option>
              <option value="2">Shift 2</option>
              <option value="3">Shift 3</option>
            </select>
          </div>

          <div className="form-group">
            <label>Station</label>
            <select
              value={formData.station}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  station: e.target.value,
                })
              }
            >
              <option value="QC">QC</option>
              <option value="AP">AP</option>
            </select>
          </div>

          <div className="form-group">
            <label>Required Qty</label>
            <input
              type="number"
              placeholder="0"
              value={formData.requiredQty}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requiredQty: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Produced Qty</label>
            <input
              type="number"
              placeholder="0"
              value={formData.producedQty}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  producedQty: e.target.value,
                })
              }
            />
          </div>

        </div>

        <div className="form-actions">
          <button
            className="save-mo-btn"
            onClick={() => {

              const savedMO = handleChannelSave(formData);

              if (!savedMO) return;

              setSelectedMO(savedMO);

            }}
          >
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
              <th>% Complete</th>
            </tr>
          </thead>

          <tbody>
            {channelData && channelData.length > 0 ? (
              channelData.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => {

                  setSelectedMO(item);
                  }}
                  style={{
                    cursor: "pointer",
                    backgroundColor:
                      selectedMO?.id === item.id ? "#E8F0FE" : "transparent",
                  }}
                >
                  <td>{item.mo}</td>
                  <td>{item.bearing_type}</td>
                  <td>{item.qty_in}</td>
                  <td>{item.qty_sent}</td>
                  <td>
                    {item.qty_in > 0
                      ? `${((item.qty_sent / item.qty_in) * 100).toFixed(1)}%`
                      : "0%"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No Manufacturing Orders Found</td>
              </tr>
            )}
          </tbody>

        </table>

      </div>

      <div className="selected-card">

      <h2>
        Selected MO : {selectedMO ? selectedMO.mo : "--"}
      </h2>

      <div className="selected-actions">

        <button
          className="add-production-btn"
          onClick={() => {
            if (!selectedMO) return;

            setSelectedProduction(
              productionEntries.find(
              entry => entry.mo === selectedMO?.mo
          )?.packCode
            );

            setProductionQty("");

            setShowProductionModal(true);
          }}
        >
          Add Production
        </button>

        <button
          className="new-entry-btn"
          onClick={() => {

          const updatedEntries = [
         ...productionEntries,
    {
        id: Date.now(),

        mo: selectedMO.mo,

        variant: selectedMO.bearing_type,

        packCode: "",

        requiredQty: "",

        producedQty: ""
    }
];

            setProductionEntries(updatedEntries);
            updateMOSummary(updatedEntries);
          }}
        >
          New Entry
        </button>

       <button
          className="edit-entry-btn"
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? "Done Editing" : "Edit Entry"}
        </button>

      </div>

      <table className="production-table">

        <thead>
          <tr>
            <th>Variant</th>
            <th>Pack Code</th>
            <th>Req Qty</th>
            <th>Produced Qty</th>
            <th></th>
          </tr>
        </thead>
        <tbody>

          {productionEntries.length === 0 ? (

          <tr>
              <td colSpan="5">
                  Click an MO row in the summary table above to see its variants here.
              </td>
          </tr>

          ) : (

          productionEntries
          .filter(entry => entry.mo === selectedMO?.mo)
          .map((entry,index)=>(
          <tr key={entry.id || index}>

              <td>
                <input
                  value={entry.variant}
                  readOnly={!editMode}
                  onChange={(e) => {
                    const updated = [...productionEntries];
                      updated[index].variant = e.target.value;
                      setProductionEntries(updated);
                      updateMOSummary(updated);
                  }}
                />
              </td>

              <td>
                <input
                  value={entry.packCode}
                  onChange={(e) => {
                    const updated = [...productionEntries];
                      updated[index].packCode = e.target.value;
                      setProductionEntries(updated);
                      updateMOSummary(updated);
                  }}
                />
              </td>

             <td>
                <input
                  type="number"
                  value={entry.requiredQty}
                  onChange={(e) => {
                    const updated = [...productionEntries];
                      updated[index].requiredQty = e.target.value;
                      setProductionEntries(updated);
                      updateMOSummary(updated);
                  }}
                />
              </td>

             <td>
                <input
                  type="number"
                  value={entry.producedQty}
                  onChange={(e) => {
                    const updated = [...productionEntries];
                    updated[index].producedQty = e.target.value;
                      setProductionEntries(updated);
                      updateMOSummary(updated);
                  }}
                />
              </td>

              <td>
                <button
                  className="remove-btn"
                  onClick={() => {

                    const updated =
                        productionEntries.filter((_, i) => i !== index);

                    setProductionEntries(updated);

                    updateMOSummary(updated);

                }}
                >
                  Remove
                </button>
              </td>

          </tr>
          ))
          )}
          </tbody>

      </table>
    </div>
    </div>
    {showProductionModal && (
      <div className="production-modal-overlay">

        <div className="production-modal">

          <h3>Add Production</h3>

          <label>Variant</label>

          <select
            value={selectedProduction}
            onChange={(e) => setSelectedProduction(e.target.value)}
          >
            <option value={selectedProduction}>
              {selectedProduction}
            </option>
          </select>

          <label>Qty produced now</label>

          <input
            type="number"
            value={productionQty}
            onChange={(e) => setProductionQty(e.target.value)}
          />

          <div className="modal-buttons">

            <button
              onClick={() => setShowProductionModal(false)}
            >
              Cancel
            </button>

            <button
              onClick={() => {

                const updated = [...productionEntries];

                updated[0] = {
                  ...updated[0],
                  producedQty:
                    Number(updated[0].producedQty) + Number(productionQty)
                };

                setProductionEntries(updated);

               const updatedSummary = channelData.map((item) => {

                if (item.id !== selectedMO.id) return item;

                return {
                  ...item,
                  qty_sent: updated[0].producedQty
                };

              });
                updateChannelData(updatedSummary);
                setSelectedMO(
                  updatedSummary.find(item => item.id === selectedMO.id)
                );

                setShowProductionModal(false);
                setProductionQty("");

              }}
            >
              Add
            </button>

          </div>

        </div>

      </div>
    )}
    </>
  );
}

export default ChannelDashboard;