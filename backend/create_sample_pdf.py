import fitz  # PyMuPDF
from pathlib import Path

output_pdf = Path(__file__).resolve().parent.parent / "sample_test_report.pdf"

doc = fitz.open()
page = doc.new_page()

text = """
METROPOLITAN DIAGNOSTIC PATHOLOGY LABORATORY
Clinical Laboratory Report — Synthetic Patient Test Record

Patient Name: Sarah Jenkins
Patient ID: PT-9824
Specimen: Venous Blood
Collection Date: 2026-11-20
Reporting Date: 2026-11-21

TEST DESCRIPTION                    RESULT       UNITS      REFERENCE INTERVAL
------------------------------------------------------------------------------
Fasting Blood Glucose               96.0         mg/dL      70.0 - 99.0
Hemoglobin A1c (HbA1c)              5.3          %          4.0 - 5.6
Total Cholesterol                   182.0        mg/dL      125.0 - 200.0
Hemoglobin (Hb)                     14.3         g/dL       12.0 - 16.0
Platelet Count                      260.0        10^3/uL    150.0 - 450.0
White Blood Cell Count (WBC)        6.8          10^3/uL    4.5 - 11.0
Serum Creatinine                    0.95         mg/dL      0.6 - 1.2

COMMENTS / INTERPRETATION:
Specimen examined by standard automated spectrophotometry and flow cytometry.
All recorded parameters align with published laboratory reference ranges.

Laboratory Director: Dr. Alan Turing, MD, FCAP
Notice: Synthetic test data for validation purposes.
"""

# Insert text onto page
page.insert_text((50, 60), text, fontsize=10, fontname="helv", color=(0.1, 0.1, 0.15))

doc.save(str(output_pdf))
doc.close()
print(f"Sample test PDF created at: {output_pdf}")

