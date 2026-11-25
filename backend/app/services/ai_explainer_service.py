import re
from typing import List, Dict, Any, Optional

DISCLAIMER_TEXT = (
    "MediBridge AI provides educational explanations grounded strictly in the values and reference "
    "ranges printed on your uploaded laboratory report. This summary does not constitute medical advice, "
    "clinical diagnosis, or treatment recommendations. Always consult your licensed physician or "
    "qualified healthcare team to interpret your results in the context of your overall health."
)

BIOMARKER_DICTIONARY = {
    "glucose": {
        "standard_name": "Fasting Blood Glucose",
        "description": "Measures the concentration of sugar (glucose) in your bloodstream after an overnight fast, reflecting how effectively your body manages energy.",
        "default_unit": "mg/dL",
        "typical_min": 70.0,
        "typical_max": 99.0
    },
    "hba1c": {
        "standard_name": "Hemoglobin A1c (HbA1c)",
        "description": "Reflects your average blood sugar levels over the past 2 to 3 months by measuring the percentage of hemoglobin bound to glucose.",
        "default_unit": "%",
        "typical_min": 4.0,
        "typical_max": 5.6
    },
    "hemoglobin": {
        "standard_name": "Hemoglobin (Hb)",
        "description": "An essential iron-rich protein in red blood cells that transports oxygen from your lungs to the tissues throughout your body.",
        "default_unit": "g/dL",
        "typical_min": 12.0,
        "typical_max": 16.5
    },
    "wbc": {
        "standard_name": "White Blood Cell Count (WBC)",
        "description": "Measures immune cells responsible for helping your body defend against infections and participate in immune responses.",
        "default_unit": "10^3/uL",
        "typical_min": 4.5,
        "typical_max": 11.0
    },
    "platelets": {
        "standard_name": "Platelet Count",
        "description": "Tiny specialized cell fragments in your blood that play a vital role in natural blood clotting and wound healing.",
        "default_unit": "10^3/uL",
        "typical_min": 150.0,
        "typical_max": 450.0
    },
    "cholesterol": {
        "standard_name": "Total Cholesterol",
        "description": "A comprehensive measure of lipid fats in your bloodstream, including high-density and low-density lipoproteins.",
        "default_unit": "mg/dL",
        "typical_min": 125.0,
        "typical_max": 200.0
    },
    "hdl": {
        "standard_name": "HDL Cholesterol (High-Density)",
        "description": "Often referred to as beneficial cholesterol; it aids in transporting excess cholesterol back to the liver for clearance.",
        "default_unit": "mg/dL",
        "typical_min": 40.0,
        "typical_max": 60.0
    },
    "ldl": {
        "standard_name": "LDL Cholesterol (Low-Density)",
        "description": "Transports lipids to tissues; monitoring helps clinical teams evaluate cardiovascular lipid balance.",
        "default_unit": "mg/dL",
        "typical_min": 0.0,
        "typical_max": 100.0
    },
    "triglycerides": {
        "standard_name": "Triglycerides",
        "description": "The most common form of fat found in your body, derived from calories consumed that are not immediately used.",
        "default_unit": "mg/dL",
        "typical_min": 0.0,
        "typical_max": 150.0
    },
    "creatinine": {
        "standard_name": "Serum Creatinine",
        "description": "A natural metabolic byproduct of normal muscle wear and tear that healthy kidneys filter out of the blood.",
        "default_unit": "mg/dL",
        "typical_min": 0.6,
        "typical_max": 1.2
    },
    "sodium": {
        "standard_name": "Sodium (Na)",
        "description": "An essential electrolyte that helps regulate water balance, nerve signals, and muscle function throughout the body.",
        "default_unit": "mmol/L",
        "typical_min": 136.0,
        "typical_max": 145.0
    },
    "potassium": {
        "standard_name": "Potassium (K)",
        "description": "A vital electrolyte that supports proper heart rhythm, nerve impulses, and muscle contractions.",
        "default_unit": "mmol/L",
        "typical_min": 3.5,
        "typical_max": 5.1
    },
    "chloride": {
        "standard_name": "Chloride (Cl)",
        "description": "An electrolyte that works with sodium and potassium to maintain fluid balance and acid-base equilibrium.",
        "default_unit": "mmol/L",
        "typical_min": 98.0,
        "typical_max": 106.0
    },
    "bicarbonate": {
        "standard_name": "CO2 / Bicarbonate",
        "description": "Reflects the buffering capacity of your blood and helps your body maintain a healthy acid-base balance.",
        "default_unit": "mmol/L",
        "typical_min": 23.0,
        "typical_max": 29.0
    },
    "urea": {
        "standard_name": "Blood Urea Nitrogen (BUN)",
        "description": "A waste product formed when protein is broken down; healthy kidneys filter it from the blood efficiently.",
        "default_unit": "mg/dL",
        "typical_min": 7.0,
        "typical_max": 20.0
    },
    "calcium": {
        "standard_name": "Calcium (Ca)",
        "description": "Essential for strong bones, proper muscle function, nerve signalling, and blood clotting processes.",
        "default_unit": "mg/dL",
        "typical_min": 8.5,
        "typical_max": 10.5
    },
    "total protein": {
        "standard_name": "Total Protein",
        "description": "Measures all proteins in the blood, including albumin and globulin, reflecting nutritional status and organ function.",
        "default_unit": "g/dL",
        "typical_min": 6.0,
        "typical_max": 8.3
    },
    "albumin": {
        "standard_name": "Albumin",
        "description": "The most abundant protein in blood plasma, important for maintaining fluid balance and transporting substances.",
        "default_unit": "g/dL",
        "typical_min": 3.5,
        "typical_max": 5.5
    },
    "bilirubin": {
        "standard_name": "Total Bilirubin",
        "description": "A yellowish pigment formed during normal red blood cell breakdown, processed and cleared by the liver.",
        "default_unit": "mg/dL",
        "typical_min": 0.1,
        "typical_max": 1.2
    },
    "alkaline": {
        "standard_name": "Alkaline Phosphatase (ALP)",
        "description": "An enzyme found mainly in the liver and bones; levels help assess liver and bone health.",
        "default_unit": "U/L",
        "typical_min": 44.0,
        "typical_max": 147.0
    },
    "alt": {
        "standard_name": "ALT (Alanine Aminotransferase)",
        "description": "A liver enzyme that enters the bloodstream when liver cells are damaged; used to monitor liver health.",
        "default_unit": "U/L",
        "typical_min": 7.0,
        "typical_max": 56.0
    },
    "ast": {
        "standard_name": "AST (Aspartate Aminotransferase)",
        "description": "An enzyme found in the liver and heart; elevated levels may indicate tissue damage in those organs.",
        "default_unit": "U/L",
        "typical_min": 10.0,
        "typical_max": 40.0
    }
}

def _is_biomarker_line(text_lower, exclude_key=None):
    """Check whether a line contains any biomarker keyword (word-boundary match)."""
    for k in BIOMARKER_DICTIONARY:
        if k == exclude_key:
            continue
        if re.search(r'\b' + re.escape(k) + r'\b', text_lower):
            return True
    return False


def parse_report_text(raw_text: str) -> List[Dict[str, Any]]:
    """
    Extract test names, measured values, units, and printed reference ranges from report text.
    Supports both single-line layouts (name + value + unit + range on one line)
    and multi-line/table layouts where those fields are on separate lines.
    Strictly follows printed numbers without hallucinating.
    """
    found_metrics = []
    lines = raw_text.splitlines()
    consumed = set()  # line indices already used by a previous match

    for i, line in enumerate(lines):
        if i in consumed:
            continue
        cleaned = line.strip()
        if not cleaned:
            continue

        lower_line = cleaned.lower()
        for key, info in BIOMARKER_DICTIONARY.items():
            if not re.search(r'\b' + re.escape(key) + r'\b', lower_line):
                continue

            # --- Gather numbers, looking ahead if the keyword line has none ---
            numbers = re.findall(r"[-+]?\d*\.\d+|\d+", cleaned)
            combined = cleaned
            lookahead_end = i

            if not numbers:
                # Multi-line layout: collect the next few lines until we
                # either find enough numbers or hit another biomarker name.
                for j in range(i + 1, min(i + 5, len(lines))):
                    next_stripped = lines[j].strip()
                    if not next_stripped:
                        continue
                    if _is_biomarker_line(next_stripped.lower(), exclude_key=key):
                        break  # belongs to the next biomarker
                    combined += " " + next_stripped
                    lookahead_end = j

                numbers = re.findall(r"[-+]?\d*\.\d+|\d+", combined)

            if not numbers:
                continue  # no usable data for this biomarker

            val = float(numbers[0])
            ref_min = None
            ref_max = None
            if len(numbers) >= 3:
                ref_min = float(numbers[1])
                ref_max = float(numbers[2])
            elif len(numbers) == 2:
                ref_max = float(numbers[1])

            # Determine unit from combined text or fall back to default
            combined_lower = combined.lower()
            unit = info["default_unit"]
            for u in ["mg/dL", "g/dL", "%", "10^3/uL", "mmol/L", "mcg/dL", "U/L"]:
                if u.lower() in combined_lower:
                    unit = u
                    break

            # Evaluate status strictly by report range if available
            status = "normal"
            if ref_min is not None and ref_max is not None:
                if val > ref_max:
                    status = "high"
                elif val < ref_min:
                    status = "low"
                else:
                    status = "normal"
            else:
                status = "unspecified_range"

            found_metrics.append({
                "test_name": info["standard_name"],
                "value": val,
                "unit": unit,
                "reference_min": ref_min if ref_min is not None else info["typical_min"],
                "reference_max": ref_max if ref_max is not None else info["typical_max"],
                "status": status,
                "notes": info["description"]
            })

            # Mark all consumed lines so they are not re-processed
            for idx in range(i, lookahead_end + 1):
                consumed.add(idx)
            break

    return found_metrics

def generate_plain_language_summary(metrics: List[Dict[str, Any]], report_type: str) -> str:
    """
    Synthesize an objective, patient-friendly summary.
    Does NOT diagnose or label abnormal without report-printed range support.
    """
    if not metrics:
        return (
            f"This {report_type} document has been securely indexed. No standard numeric laboratory biomarkers "
            "could be extracted automatically. Please review the original PDF document with your physician."
        )

    summary_parts = [
        f"This summary explains the biomarkers identified in your {report_type}. "
        "Each measure is compared against the specific reference intervals printed by your testing laboratory:"
    ]

    for m in metrics:
        name = m["test_name"]
        val = m["value"]
        unit = m["unit"]
        rmin = m.get("reference_min")
        rmax = m.get("reference_max")
        status = m.get("status", "normal")

        if rmin is not None and rmax is not None:
            range_desc = f"{rmin} to {rmax} {unit}"
            if status == "normal":
                interp = f"is within the laboratory's reference range ({range_desc})."
            elif status == "high":
                interp = f"is recorded at {val} {unit}, which is above the laboratory's printed reference range ({range_desc})."
            elif status == "low":
                interp = f"is recorded at {val} {unit}, which is below the laboratory's printed reference range ({range_desc})."
            else:
                interp = f"is {val} {unit}."
        else:
            interp = f"is recorded as {val} {unit} (no reference range was printed on the document for this specific test)."

        summary_parts.append(f"• {name}: Your value of {val} {unit} {interp}")

    summary_parts.append(
        "\nQuestions to ask your doctor: Review any values outside your laboratory's printed intervals with your clinical provider to determine if any lifestyle adjustments, dietary follow-ups, or re-testing are appropriate for you."
    )

    return "\n\n".join(summary_parts)

def compare_historical_reports(report_a: Dict[str, Any], report_b: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compare previous vs current reports.
    RULE: Compare values ONLY when the same test and compatible units are available.
    """
    metrics_a = {m["test_name"].lower().strip(): m for m in report_a.get("metrics", [])}
    metrics_b = {m["test_name"].lower().strip(): m for m in report_b.get("metrics", [])}

    comparisons = []
    skipped_items = []

    for test_key, ma in metrics_a.items():
        if test_key in metrics_b:
            mb = metrics_b[test_key]
            # Check unit compatibility
            unit_a = ma.get("unit", "").strip().lower()
            unit_b = mb.get("unit", "").strip().lower()

            if unit_a == unit_b:
                val_a = float(ma["value"])
                val_b = float(mb["value"])
                delta = round(val_b - val_a, 3)
                pct_change = round((delta / val_a * 100), 1) if val_a != 0 else 0.0

                if abs(delta) < 0.001:
                    trend = "stable"
                elif delta > 0:
                    trend = "increased"
                else:
                    trend = "decreased"

                comparisons.append({
                    "test_name": mb["test_name"],
                    "unit": mb["unit"],
                    "previous_date": report_a.get("report_date"),
                    "previous_value": val_a,
                    "previous_status": ma.get("status"),
                    "current_date": report_b.get("report_date"),
                    "current_value": val_b,
                    "current_status": mb.get("status"),
                    "delta": delta,
                    "percentage_change": pct_change,
                    "trend": trend,
                    "reference_range": f"{mb.get('reference_min')} - {mb.get('reference_max')} {mb.get('unit')}"
                })
            else:
                skipped_items.append({
                    "test_name": ma["test_name"],
                    "reason": f"Unit mismatch: Previous report uses '{ma.get('unit')}', current uses '{mb.get('unit')}'. Direct mathematical comparison skipped for accuracy."
                })

    return {
        "report_previous": {
            "id": report_a.get("id"),
            "title": report_a.get("title"),
            "report_date": report_a.get("report_date")
        },
        "report_current": {
            "id": report_b.get("id"),
            "title": report_b.get("title"),
            "report_date": report_b.get("report_date")
        },
        "comparisons": comparisons,
        "skipped_items": skipped_items,
        "disclaimer": DISCLAIMER_TEXT
    }

