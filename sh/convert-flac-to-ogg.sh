#!/bin/bash

# 1. Check if an argument was provided
if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_flac_file>"
    exit 1
fi

INPUT_FILE="$1"

# 3. Check if the input file actually exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: File not found: '$INPUT_FILE'"
    exit 1
fi

# 4. Determine the output filename
# ${var%.*} removes the extension; ${var##*/} gets just the filename if a path is provided
FILENAME=$(basename "$INPUT_FILE")              # e.g., audio.flac
EXTENSION="${FILENAME##*.}"                     # e.g., flac
NAME="${FILENAME%.*}"                           # e.g., audio
DIR=$(dirname "$INPUT_FILE")                    # e.g., ./output_audio

# Construct output path (replaces .flac with .ogg)
OUTPUT_FILE="$DIR/$NAME.ogg"

# 5. Perform the conversion
# -y: Overwrite output file if it exists
# -loglevel error: Only show errors (keeps the output clean)
# -c:a libvorbis: Use Vorbis codec for .ogg
# -q:a 5: Quality setting
../bin/ffmpeg/bin/ffmpeg -y -i "$INPUT_FILE" -c:a libvorbis -q:a 5 -loglevel error "$OUTPUT_FILE"

# 6. Check success and return the path
if [ $? -eq 0 ]; then
    # Print the path to the new file
    echo "$OUTPUT_FILE"
else
    echo "Error: Conversion failed."
    exit 1
fi