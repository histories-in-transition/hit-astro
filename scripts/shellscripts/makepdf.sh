#!/bin/bash
# scripts/shellscripts/makepdfs.sh
# Generates PDFs from .tex files using XeLaTeX

# Resolve script directory and project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Directories
TEX_DIR="$PROJECT_ROOT/public/tex/manuscripts"
PDF_DIR="$PROJECT_ROOT/public/pdf/manuscripts"

# Create output folder if it doesn't exist
mkdir -p "$PDF_DIR"

echo "Generating PDFs from .tex files in $TEX_DIR..."

# Process each .tex file
for texfile in "$TEX_DIR"/*.tex; do
    [ -e "$texfile" ] || continue  # skip if no files found

    echo "Processing $(basename "$texfile")..."
    # Compile with XeLaTeX
    xelatex -interaction=nonstopmode -output-directory="$PDF_DIR" "$texfile"

    # Clean up auxiliary files in PDF_DIR
    aux_file="$PDF_DIR/$(basename "${texfile%.tex}").aux"
    log_file="$PDF_DIR/$(basename "${texfile%.tex}").log"
    toc_file="$PDF_DIR/$(basename "${texfile%.tex}").toc"
    out_file="$PDF_DIR/$(basename "${texfile%.tex}").out"
    rm -f "$aux_file" "$log_file" "$toc_file"
done

echo "All PDFs generated in $PDF_DIR."
