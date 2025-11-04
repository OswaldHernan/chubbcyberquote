import { useState } from "react";
import * as XLSX from "xlsx";
import "../styles/form.css";

function QuotationForm() {
  const [clientName, setClientName] = useState("");
  const [options, setOptions] = useState(1);
  const [currency, setCurrency] = useState("USD");
  const [currentOption, setCurrentOption] = useState(0);
  const [activeSection, setActiveSection] = useState("TERM");

  const [termData, setTermData] = useState([{}]);
  const [extensions, setExtensions] = useState([{}]);
  const [sublimits, setSublimits] = useState([{}]);

  const formatNumber = (value) => {
    if (!value) return "";
    const clean = value.toString().replace(/[^\d]/g, "");
    return Number(clean).toLocaleString("en-US");
  };
  const parseNumber = (val) => parseFloat(val?.replace(/,/g, "")) || 0;

  const handleTermChange = (field, value, optIndex) => {
    let newValue = value;

    if (["Limit", "Deductible", "Premium", "Benchmark Premium"].includes(field)) {
      const clean = newValue.replace(/[^\d]/g, "");
      newValue = formatNumber(clean);
    } else if (["Chubb share", "Comission"].includes(field)) {
      newValue = newValue.replace(/[^\d.]/g, "");
      if (newValue && !newValue.endsWith("%")) newValue += "%";
    } else if (field === "Waiting period") {
      const clean = newValue.replace(/[^\d]/g, "");
      newValue = clean ? `${clean} Hrs` : "";
    } else if (field === "Indemnity Period") {
      const clean = newValue.replace(/[^\d]/g, "");
      newValue = clean ? `${clean} days` : "";
    }

    setTermData((prev) => {
      const updated = [...prev];
      const obj = { ...updated[optIndex], [field]: newValue };

      const premium = parseNumber(obj["Premium"]);
      const benchmark = parseNumber(obj["Benchmark Premium"]);
      const limit = parseNumber(obj["Limit"]);

      if (premium && benchmark)
        obj["B/Benchmark"] = ((premium / benchmark) * 100).toFixed(1) + "%";
      if (premium && limit)
        obj["GWP Rol"] = ((premium / limit) * 100).toFixed(2) + "%";

      updated[optIndex] = obj;
      return updated;
    });
  };

  const handleCoverageType = (setState, optIndex, cov, type) => {
    setState((prev) => {
      const copy = [...prev];
      const current = copy[optIndex] || {};
      copy[optIndex] = {
        ...current,
        [cov]: { type, value: type === "sub" ? current[cov]?.value || "" : "" },
      };
      return copy;
    });
  };

  const handleCoverageValue = (setState, optIndex, cov, val) => {
    const formatted = formatNumber(val.replace(/[^\d]/g, ""));
    setState((prev) => {
      const copy = [...prev];
      const current = copy[optIndex] || {};
      copy[optIndex] = { ...current, [cov]: { ...current[cov], value: formatted } };
      return copy;
    });
  };

  const generateExcel = () => {
    const wb = XLSX.utils.book_new();
    const headers = ["FIELD", ...Array.from({ length: options }, (_, i) => `Option ${i + 1} (${currency})`)];
    const data = [headers];

    const termFields = [
      "Limit","Leader","Chubb share","Deductible","Waiting period",
      "Indemnity Period","Premium","Benchmark Premium","B/Benchmark",
      "GWP Rol","Comission","MRC"
    ];

    const extensionsList = [
      "Ransomware sublimit","Ransomware coinsurance","Widespread sublimit","Widespread coinsurance",
      "Emergency IR","Rep Loss","Cyber Crime","Reward expenses","Telecom fraud",
      "Consumer redress fund","Payment Card Loss","Regulatory fines","Open System Peryls",
      "Neglected Software","Incident Response Expenses"
    ];

    const sublimitsList = [
      "Privacy","Network security","Media","Cyber extorsion","Data asset",
      "BI","Contingent BI","Preventative Shutdown","Bricking","Betterment cost"
    ];

    data.push(["TERM"]);
    termFields.forEach((field) => {
      const row = [field];
      for (let j = 0; j < options; j++) row.push(termData[j]?.[field] || "");
      data.push(row);
    });

    const writeSection = (title, list, src) => {
      data.push([""]);
      data.push([title]);
      list.forEach((cov) => {
        const row = [cov];
        for (let j = 0; j < options; j++) {
          const c = src[j]?.[cov];
          if (!c) row.push("");
          else if (c.type === "na") row.push("N/A");
          else if (c.type === "sub") row.push(c.value);
          else if (c.type === "full") row.push(termData[j]?.["Limit"] || "Full Limit");
        }
        data.push(row);
      });
    };

    writeSection("EXTENSIONS", extensionsList, extensions);
    writeSection("SUBLIMITS", sublimitsList, sublimits);

    const ws = XLSX.utils.aoa_to_sheet(data);

    // === FORMATEO VISUAL PROFESIONAL ===
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellRef];
        if (!cell || !cell.v) continue;

        // --- Encabezados ---
        if (R === 0) {
          cell.s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { patternType: "solid", fgColor: { rgb: "007BFF" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "CCCCCC" } },
              bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            },
          };
          continue;
        }

        // --- Subrayado rojo para N/A ---
        if (typeof cell.v === "string" && cell.v.toUpperCase() === "N/A") {
          cell.s = {
            font: { color: { rgb: "FF0000" }, underline: true },
            alignment: { horizontal: "center" },
          };
          continue;
        }

        // --- Secciones ---
        if (["TERM", "EXTENSIONS", "SUBLIMITS"].includes(cell.v)) {
          cell.s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { patternType: "solid", fgColor: { rgb: "444C63" } },
            alignment: { horizontal: "left" },
            border: {
              bottom: { style: "medium", color: { rgb: "666666" } },
            },
          };
          continue;
        }

        // --- Números con formato ---
        if (typeof cell.v === "number" || /^[\d,]+$/.test(cell.v)) {
          cell.z = "#,##0";
          cell.s = {
            alignment: { horizontal: "right" },
            font: { color: { rgb: "EAEAEA" } },
          };
          continue;
        }

        // --- Texto normal ---
        cell.s = {
          alignment: { horizontal: "left" },
          font: { color: { rgb: "EAEAEA" } },
        };
      }
    }

    // Ajuste de columnas
    ws["!cols"] = [
      { wch: 28 },
      ...Array.from({ length: options }, () => ({ wch: 18 })),
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Quotation");
    XLSX.writeFile(wb, `T&C_${clientName}_${currency}.xlsx`);
  };

  const renderOptionForm = (optIndex) => (
    <div className="slide" key={optIndex}>
      {activeSection === "TERM" && (
        <div className="term-list">
          <h2>TERM - Option {optIndex + 1}</h2>
          {[
            "Limit","Leader","Chubb share","Deductible","Waiting period",
            "Indemnity Period","Premium","Benchmark Premium","B/Benchmark",
            "GWP Rol","Comission","MRC"
          ].map((field) => (
            <div key={field} className="term-row">
              <div className="term-label">{field}</div>
              <input
                type="text"
                className="term-input"
                placeholder={field}
                value={termData[optIndex]?.[field] || ""}
                onChange={(e) => handleTermChange(field, e.target.value, optIndex)}
                readOnly={["B/Benchmark","GWP Rol"].includes(field)}
              />
            </div>
          ))}
        </div>
      )}

      {activeSection === "EXTENSIONS" && (
        <>
          <h2>EXTENSIONS</h2>
          {[
            "Ransomware sublimit","Ransomware coinsurance","Widespread sublimit",
            "Widespread coinsurance","Emergency IR","Rep Loss","Cyber Crime",
            "Reward expenses","Telecom fraud","Consumer redress fund",
            "Payment Card Loss","Regulatory fines","Open System Peryls",
            "Neglected Software","Incident Response Expenses"
          ].map((cov) => (
            <div key={cov} className="coverage-row">
              <div className="coverage-name">{cov}</div>
              <div className="coverage-controls">
                {["full","sub","na"].map((t) => (
                  <button
                    key={t}
                    className={`option-btn ${t} ${
                      extensions[optIndex]?.[cov]?.type === t ? "active" : ""
                    }`}
                    onClick={() => handleCoverageType(setExtensions, optIndex, cov, t)}
                  >
                    {t === "full" ? "Full Limit" : t === "sub" ? "Sublimit" : "N/A"}
                  </button>
                ))}
                {extensions[optIndex]?.[cov]?.type === "sub" && (
                  <input
                    type="text"
                    className="sublimit-input"
                    placeholder={`Monto ${currency}`}
                    value={extensions[optIndex]?.[cov]?.value || ""}
                    onChange={(e) => handleCoverageValue(setExtensions, optIndex, cov, e.target.value)}
                  />
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {activeSection === "SUBLIMITS" && (
        <>
          <h2>SUBLIMITS</h2>
          {[
            "Privacy","Network security","Media","Cyber extorsion","Data asset",
            "BI","Contingent BI","Preventative Shutdown","Bricking","Betterment cost"
          ].map((cov) => (
            <div key={cov} className="coverage-row">
              <div className="coverage-name">{cov}</div>
              <div className="coverage-controls">
                {["full","sub","na"].map((t) => (
                  <button
                    key={t}
                    className={`option-btn ${t} ${
                      sublimits[optIndex]?.[cov]?.type === t ? "active" : ""
                    }`}
                    onClick={() => handleCoverageType(setSublimits, optIndex, cov, t)}
                  >
                    {t === "full" ? "Full Limit" : t === "sub" ? "Sublimit" : "N/A"}
                  </button>
                ))}
                {sublimits[optIndex]?.[cov]?.type === "sub" && (
                  <input
                    type="text"
                    className="sublimit-input"
                    placeholder={`Monto ${currency}`}
                    value={sublimits[optIndex]?.[cov]?.value || ""}
                    onChange={(e) => handleCoverageValue(setSublimits, optIndex, cov, e.target.value)}
                  />
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <h2>Sections</h2>
        {["TERM", "EXTENSIONS", "SUBLIMITS"].map((sec) => (
          <button
            key={sec}
            className={`sidebar-btn ${activeSection === sec ? "active" : ""}`}
            onClick={() => setActiveSection(sec)}
          >
            {sec}
          </button>
        ))}
      </aside>

      <div className="form-container">
        <div className="quote-box">
          <div className="header-bar">
            <h1>Quotation Generator</h1>
            <button className="logout-btn" onClick={() => (window.location.href = "/login")}>
              Salir
            </button>
          </div>

          <input
            type="text"
            placeholder="Client / Project Name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Number of Options"
            min="1"
            value={options}
            onChange={(e) => {
              const val = Math.max(1, parseInt(e.target.value) || 1);
              setOptions(val);
              setTermData((prev) => Array.from({ length: val }, (_, i) => prev[i] || {}));
              setExtensions((prev) => Array.from({ length: val }, (_, i) => prev[i] || {}));
              setSublimits((prev) => Array.from({ length: val }, (_, i) => prev[i] || {}));
              if (currentOption >= val) setCurrentOption(val - 1);
            }}
          />

          <div className="currency-selector">
            <label>
              <input type="radio" value="USD" checked={currency === "USD"} onChange={(e) => setCurrency(e.target.value)} /> USD
            </label>
            <label>
              <input type="radio" value="MXN" checked={currency === "MXN"} onChange={(e) => setCurrency(e.target.value)} /> MXN
            </label>
          </div>

          <div className="carousel-wrapper">
            <div className="slides" style={{ transform: `translateX(-${currentOption * 100}%)` }}>
              {Array.from({ length: options }, (_, i) => renderOptionForm(i))}
            </div>
          </div>

          <div className="carousel-nav">
            <button disabled={currentOption === 0} onClick={() => setCurrentOption(currentOption - 1)}>← Prev Option</button>
            <span>{`Option ${currentOption + 1} of ${options}`}</span>
            <button disabled={currentOption === options - 1} onClick={() => setCurrentOption(currentOption + 1)}>Next Option →</button>
          </div>

          <button className="download-btn" onClick={generateExcel}>Download Excel</button>
        </div>
      </div>
    </div>
  );
}

export default QuotationForm;
