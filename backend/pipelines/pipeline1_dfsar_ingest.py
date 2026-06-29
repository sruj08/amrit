"""
Pipeline 1: DFSAR ZIP Inspector & Ingestor
===========================================
Run this FIRST on your downloaded file:
    ch2_sar_nrxl_20251106t221014810_d_cp_d18.zip

Usage:
    python backend/pipelines/pipeline1_dfsar_ingest.py --zip path/to/ch2_sar_nrxl_*.zip

What it does:
- Unzips and catalogs all files inside
- Identifies .xml (PDS4 label), .img / .dat / .bin (binary data), .lbl files
- Reads the PDS4 label to extract: dimensions, data type, frequency band (L/S),
  polarization channels (HH, HV, VH, VV), centre lat/lon, pixel spacing
- Loads the first binary array and prints its shape, dtype, min/max
- Tells you EXACTLY which file is your C3/T3 covariance matrix data
- Saves a summary JSON so later steps know what to load

Output: data/interim/c3_t3/dfsar_inventory.json
"""

import os
import sys
import json
import zipfile
import argparse
import numpy as np

# ── argument parsing ──────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(description="Inspect and ingest DFSAR zip")
parser.add_argument("--zip", required=True, help="Path to ch2_sar_nrxl_*_d_cp_d18.zip")
parser.add_argument("--outdir", default="data/raw/dfsar", help="Where to unzip")
args = parser.parse_args()

ZIP_PATH = args.zip
OUT_DIR  = args.outdir
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs("data/interim/c3_t3", exist_ok=True)

print("=" * 70)
print("LRIP Pipeline 1 — DFSAR Inspector")
print("=" * 70)
print(f"ZIP file  : {ZIP_PATH}")
print(f"File size : {os.path.getsize(ZIP_PATH)/1e6:.1f} MB")

# ── unzip ─────────────────────────────────────────────────────────────────────
print("\n[1] Unzipping...")
with zipfile.ZipFile(ZIP_PATH, 'r') as zf:
    all_files = zf.namelist()
    print(f"    Found {len(all_files)} files inside:")
    for f in all_files:
        info = zf.getinfo(f)
        print(f"      {f:60s}  {info.file_size/1e6:8.2f} MB")
    zf.extractall(OUT_DIR)
print(f"    Extracted to: {OUT_DIR}/")

# ── catalog files by extension ────────────────────────────────────────────────
print("\n[2] Cataloging by type...")
inventory = {
    "zip_path"  : ZIP_PATH,
    "extract_dir": OUT_DIR,
    "xml_labels": [],
    "lbl_labels": [],
    "binary_data": [],
    "other": []
}

for root, dirs, files in os.walk(OUT_DIR):
    for fname in files:
        fpath = os.path.join(root, fname)
        ext   = fname.lower().split(".")[-1]
        size  = os.path.getsize(fpath)
        entry = {"path": fpath, "name": fname, "size_mb": size/1e6}
        if ext == "xml":
            inventory["xml_labels"].append(entry)
        elif ext == "lbl":
            inventory["lbl_labels"].append(entry)
        elif ext in ("img", "dat", "bin", "raw", "hdr", "tif", "tiff"):
            inventory["binary_data"].append(entry)
            entry["ext"] = ext
        else:
            inventory["other"].append(entry)

print(f"    XML labels  : {len(inventory['xml_labels'])}")
print(f"    LBL labels  : {len(inventory['lbl_labels'])}")
print(f"    Binary data : {len(inventory['binary_data'])}")
print(f"    Other       : {len(inventory['other'])}")

# ── parse PDS4 XML label ──────────────────────────────────────────────────────
print("\n[3] Parsing PDS4 XML label...")
label_info = {}

if inventory["xml_labels"]:
    xml_path = inventory["xml_labels"][0]["path"]
    print(f"    Reading: {xml_path}")
    try:
        import pds4_tools
        data_store = pds4_tools.read(xml_path, quiet=True)
        label_info["pds4_read"] = "success"
        label_info["structures"] = []

        print(f"    PDS4 structures found: {len(data_store.structures)}")
        for i, struct in enumerate(data_store.structures):
            s_info = {
                "index"  : i,
                "id"     : str(struct.id),
                "type"   : str(type(struct).__name__),
                "shape"  : list(struct.data.shape) if hasattr(struct, 'data') and struct.data is not None else None,
                "dtype"  : str(struct.data.dtype) if hasattr(struct, 'data') and struct.data is not None else None,
            }
            label_info["structures"].append(s_info)
            print(f"      Structure [{i}]: id={s_info['id']}, type={s_info['type']}, shape={s_info['shape']}, dtype={s_info['dtype']}")

        # Try to extract key metadata from label XML text
        with open(xml_path, 'r', errors='ignore') as f:
            xml_text = f.read()

        def extract_xml_tag(text, tag):
            import re
            m = re.search(rf'<{tag}[^>]*>(.*?)</{tag}>', text, re.DOTALL)
            return m.group(1).strip() if m else None

        for tag in ["centre_latitude", "centre_longitude", "frequency_band",
                    "polarization_type", "sample_bits", "lines", "samples",
                    "line_samples", "sample_display_direction",
                    "horizontal_pixel_scale", "vertical_pixel_scale"]:
            val = extract_xml_tag(xml_text, tag)
            if val:
                label_info[tag] = val
                print(f"      {tag}: {val}")

    except Exception as e:
        label_info["pds4_read"] = f"failed: {e}"
        print(f"    ⚠ PDS4 read failed: {e}")
        print("    → Trying raw XML parse...")
        try:
            import xml.etree.ElementTree as ET
            tree = ET.parse(xml_path)
            root_elem = tree.getroot()
            # strip namespace
            def strip_ns(tag):
                return tag.split('}')[-1] if '}' in tag else tag
            def find_all_text(elem, result=None, depth=0):
                if result is None: result = {}
                tag = strip_ns(elem.tag)
                if elem.text and elem.text.strip():
                    result[tag] = elem.text.strip()
                for child in elem:
                    find_all_text(child, result, depth+1)
                return result
            all_tags = find_all_text(root_elem)
            label_info["raw_xml_tags"] = all_tags
            for k, v in all_tags.items():
                print(f"      {k}: {v}")
        except Exception as e2:
            print(f"    ⚠ Raw XML parse also failed: {e2}")

else:
    print("    ⚠ No XML labels found!")
    # Try LBL
    if inventory["lbl_labels"]:
        lbl_path = inventory["lbl_labels"][0]["path"]
        print(f"    Trying LBL: {lbl_path}")
        with open(lbl_path, 'r', errors='ignore') as f:
            lbl_text = f.read()
        print(lbl_text[:2000])
        label_info["lbl_text_preview"] = lbl_text[:2000]

# ── probe binary data ─────────────────────────────────────────────────────────
print("\n[4] Probing binary data files...")
binary_probes = []

for bfile in sorted(inventory["binary_data"], key=lambda x: -x["size_mb"]):
    print(f"\n  File: {bfile['name']}  ({bfile['size_mb']:.1f} MB)")
    fpath = bfile["path"]
    ext   = bfile["ext"]
    probe = {"path": fpath, "name": bfile["name"], "size_mb": bfile["size_mb"]}

    if ext in ("tif", "tiff"):
        try:
            import rasterio
            with rasterio.open(fpath) as src:
                probe["format"]   = "GeoTIFF"
                probe["shape"]    = [src.height, src.width]
                probe["bands"]    = src.count
                probe["dtype"]    = str(src.dtypes[0])
                probe["crs"]      = str(src.crs)
                probe["bounds"]   = list(src.bounds)
                data = src.read(1)
                probe["min"]      = float(np.nanmin(data))
                probe["max"]      = float(np.nanmax(data))
                probe["mean"]     = float(np.nanmean(data))
                print(f"    GeoTIFF: {src.height}×{src.width}, {src.count} bands, dtype={src.dtypes[0]}")
                print(f"    CRS: {src.crs}")
                print(f"    Band 1 stats: min={probe['min']:.4f}, max={probe['max']:.4f}, mean={probe['mean']:.4f}")
        except Exception as e:
            probe["error"] = str(e)
            print(f"    ⚠ GeoTIFF read error: {e}")

    elif ext in ("img", "dat", "bin", "raw"):
        # Try to guess shape from label_info
        try:
            file_size = os.path.getsize(fpath)
            probe["file_size_bytes"] = file_size

            # Common DFSAR dtypes: complex64 (8 bytes/sample), float32 (4), int16 (2)
            for dtype, bytes_per in [("complex64", 8), ("float32", 4), ("int16", 2), ("uint8", 1)]:
                n_samples = file_size // bytes_per
                print(f"    If {dtype} (8 bytes): {n_samples:,} total samples")
                # Try known dimensions from label
                if "lines" in label_info and "line_samples" in label_info:
                    try:
                        lines   = int(label_info["lines"])
                        samples = int(label_info["line_samples"])
                        expected = lines * samples * bytes_per
                        if abs(expected - file_size) / file_size < 0.05:
                            print(f"    ✓ Shape match: {lines} × {samples} as {dtype}")
                            probe["likely_shape"]  = [lines, samples]
                            probe["likely_dtype"]  = dtype
                            # Load a small slice
                            arr = np.fromfile(fpath, dtype=np.dtype(dtype), count=min(1000, n_samples))
                            probe["sample_values"] = arr[:10].tolist() if arr.dtype != complex else [(c.real, c.imag) for c in arr[:10]]
                            print(f"    First 5 values: {arr[:5]}")
                            break
                    except:
                        pass

            # If no label match, try reading as complex64 and show stats
            if "likely_shape" not in probe:
                arr = np.fromfile(fpath, dtype=np.complex64, count=min(10000, file_size//8))
                probe["probe_dtype"]  = "complex64_guess"
                probe["probe_n"]      = len(arr)
                probe["probe_abs_mean"] = float(np.abs(arr).mean())
                probe["probe_abs_max"]  = float(np.abs(arr).max())
                print(f"    Probe as complex64: n={len(arr)}, |mean|={probe['probe_abs_mean']:.4f}, |max|={probe['probe_abs_max']:.4f}")

        except Exception as e:
            probe["error"] = str(e)
            print(f"    ⚠ Binary probe error: {e}")

    binary_probes.append(probe)

# ── save inventory ────────────────────────────────────────────────────────────
print("\n[5] Saving inventory...")
full_inventory = {
    "dfsar_zip"     : ZIP_PATH,
    "extract_dir"   : OUT_DIR,
    "label_info"    : label_info,
    "binary_probes" : binary_probes,
    "file_catalog"  : inventory
}

inv_path = "data/interim/c3_t3/dfsar_inventory.json"
with open(inv_path, 'w') as f:
    json.dump(full_inventory, f, indent=2, default=str)

print(f"    Saved: {inv_path}")
print("\n" + "=" * 70)
print("PIPELINE 1 COMPLETE")
print("Next: Run backend/pipelines/pipeline2_polarimetry.py")
print("=" * 70)
