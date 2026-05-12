import argparse
import subprocess
import json
import os
import sys
import tempfile
import re  # Added for filename pattern matching
from PIL import Image
import numpy as np

# Robust import for MoviePy (works for v1 and v2)
try:
    from moviepy import VideoClip, AudioFileClip
except ImportError:
    from moviepy.editor import VideoClip, AudioFileClip

# Standard mouth shapes used by Rhubarb
MOUTH_SHAPES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'X']

# --- Configuration ---
# Path to the folder where videos will be saved

def check_rhubarb_installed(rhubarb_path):
    """Checks if rhubarb executable is accessible."""
    try:
        subprocess.run([rhubarb_path, "--version"], capture_output=True, check=True)
    except FileNotFoundError:
        print(f"Error: Could not find 'rhubarb' at '{rhubarb_path}'.", file=sys.stderr)
        print("Please provide the correct path using --rhubarb_path argument.", file=sys.stderr)
        sys.exit(1)

def run_rhubarb(audio_path, rhubarb_path):
    """Runs rhubarb lip-sync tool and returns the JSON output."""
    print(f"Analyzing audio with Rhubarb: {audio_path}...", file=sys.stderr)
    
    # Create a temporary file to store the JSON output
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp_file:
        tmp_output_path = tmp_file.name

    try:
        cmd = [
            rhubarb_path,
            audio_path,
            "-o", tmp_output_path,
            "-f", "json"
        ]
        
        # Run rhubarb
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print("Rhubarb Error:", file=sys.stderr)
            print(result.stderr, file=sys.stderr)
            if os.path.exists(tmp_output_path):
                os.remove(tmp_output_path)
            sys.exit(1)
            
        # Read the generated JSON file
        with open(tmp_output_path, 'r') as f:
            data = json.load(f)
            
        return data
        
    except json.JSONDecodeError:
        print("Failed to parse Rhubarb JSON file.", file=sys.stderr)
        sys.exit(1)
    finally:
        # Clean up the temporary file
        if os.path.exists(tmp_output_path):
            os.remove(tmp_output_path)

def load_images(image_dir):
    """Loads mouth images into memory."""
    images = {}
    print(f"Loading images from: {image_dir}", file=sys.stderr)
    
    if not os.path.isdir(image_dir):
        print(f"Error: Image directory '{image_dir}' does not exist.", file=sys.stderr)
        sys.exit(1)

    for shape in MOUTH_SHAPES:
        # Checks for common extensions: .png, .jpg, .jpeg
        found = False
        for ext in ['.png', '.jpg', '.jpeg', '.bmp']:
            path = os.path.join(image_dir, f"{shape}{ext}")
            if os.path.exists(path):
                img = Image.open(path).convert("RGBA")
                images[shape] = np.array(img)
                found = True
                break
        
        if not found:
            print(f"Warning: Image for shape '{shape}' not found. It will be skipped.", file=sys.stderr)

    return images

def get_active_mouth(t, cues):
    """Determines which mouth shape is active at a specific time t."""
    active_shape = 'X' # Default to Rest/X
    
    # cues is a list of dictionaries: {'start': time, 'end': time, 'value': 'A'}
    for cue in cues:
        if cue['start'] <= t < cue['end']:
            active_shape = cue['value']
            break
    return active_shape

def make_frame(t, duration, cues, images_dict, video_size):
    """Generates a single frame with the lip image centered."""
    
    current_t = min(t, duration - 0.001)
    shape = get_active_mouth(current_t, cues)
    
    # Fallback logic
    if shape not in images_dict:
        shape = 'X'
    if shape not in images_dict:
        # Return empty black frame if no image found
        return np.zeros((video_size[1], video_size[0], 3), dtype=np.uint8)

    # Get the current lip image (RGBA)
    lip_img = images_dict[shape]
    h, w = lip_img.shape[0], lip_img.shape[1]
    
    # Create a black background canvas (RGB)
    # video_size is (width, height)
    canvas = np.zeros((video_size[1], video_size[0], 3), dtype=np.uint8)
    
    # Calculate centering offsets
    x_offset = (video_size[0] - w) // 2
    y_offset = (video_size[1] - h) // 2
    
    # Ensure we don't go out of bounds if image is somehow larger than video
    y1, y2 = max(0, y_offset), min(video_size[1], y_offset + h)
    x1, x2 = max(0, x_offset), min(video_size[0], x_offset + w)
    
    # Calculate slice for the source image
    sy1, sy2 = max(0, -y_offset), h - max(0, (y_offset + h) - video_size[1])
    sx1, sx2 = max(0, -x_offset), w - max(0, (x_offset + w) - video_size[0])

    # Paste image onto canvas handling transparency (Alpha Blending)
    # If the image has an alpha channel (RGBA), we use it.
    if lip_img.shape[2] == 4:
        alpha = lip_img[sy1:sy2, sx1:sx2, 3:4] / 255.0
        color = lip_img[sy1:sy2, sx1:sx2, 0:3]
        
        # Blend color with black background
        canvas[y1:y2, x1:x2] = (color * alpha + canvas[y1:y2, x1:x2] * (1 - alpha)).astype(np.uint8)
    else:
        # No alpha, just copy pixels
        canvas[y1:y2, x1:x2] = lip_img[sy1:sy2, sx1:sx2, 0:3]
        
    return canvas

def main():
    parser = argparse.ArgumentParser(description="Generate lip-sync video using Rhubarb.")
    parser.add_argument("--audio", required=True, help="Path to the input audio file.")
    parser.add_argument("--output_filename", required=True, help="A name of the output file.")
    parser.add_argument("--images", required=True, help="Directory containing mouth shape images.")
    parser.add_argument("--output_folder", required=True, help="Destination folder.")
    # Removed --output argument to use internal naming logic
    parser.add_argument("--rhubarb_path", default="rhubarb", help="Path to rhubarb executable.")
    parser.add_argument("--fps", type=int, default=24, help="Frames per second.")
    parser.add_argument("--width", type=int, default=None, help="Video width (optional).")
    parser.add_argument("--height", type=int, default=None, help="Video height (optional).")
    
    args = parser.parse_args()

    # 1. Check Rhubarb
    check_rhubarb_installed(args.rhubarb_path)

    # 2. Run Rhubarb
    lip_sync_data = run_rhubarb(args.audio, args.rhubarb_path)
    mouth_cues = lip_sync_data.get("mouthCues", [])
    
    if not mouth_cues:
        print("No mouth cues found.", file=sys.stderr)
        sys.exit(0)

    # 3. Load Images
    images_dict = load_images(args.images)
    if not images_dict:
        print("Error: No images loaded.", file=sys.stderr)
        sys.exit(1)

    # Determine Video Size
    if args.width and args.height:
        video_size = (args.width, args.height)
    else:
        # Auto-detect size: find the maximum width and height among all images
        max_w, max_h = 0, 0
        for img_array in images_dict.values():
            h, w = img_array.shape[0], img_array.shape[1]
            if w > max_w: max_w = w
            if h > max_h: max_h = h
        video_size = (max_w, max_h)
        print(f"Auto-detected video resolution: {max_w}x{max_h}", file=sys.stderr)
        
    # 4. Load Audio
    print("Loading audio...", file=sys.stderr)
    try:
        audio_clip = AudioFileClip(args.audio)
    except Exception as e:
        print(f"Error loading audio: {e}", file=sys.stderr)
        print("Ensure 'ffmpeg' is installed on your system.", file=sys.stderr)
        sys.exit(1)

    duration = audio_clip.duration
    print(f"Audio Duration: {duration:.2f}s", file=sys.stderr)

    # 5. Create Video
    print("Creating video frames...", file=sys.stderr)
    
    video_clip = VideoClip(
        lambda t: make_frame(t, duration, mouth_cues, images_dict, video_size),
        duration=duration
    )
    
    video_clip = video_clip.with_fps(args.fps)
    
    if audio_clip:
        video_clip = video_clip.with_audio(audio_clip)

    # 6. Determine Output Path
    # Create folder if it doesn't exist
    if not os.path.exists(args.output_folder):
        os.makedirs(args.output_folder)

    output_filename = args.output_filename
    output_path = os.path.join(args.output_folder, output_filename)

    # 7. Write Output
    print(f"Rendering video to {output_path}...", file=sys.stderr)
    try:
        video_clip.write_videofile(
            output_path, 
            codec='libx264', 
            audio_codec='aac',
            threads=4,
            logger=None 
        )
        # Return value: print the path to stdout
        print(output_path)
        
    except Exception as e:
        print(f"\nError during rendering: {e}", file=sys.stderr)
    finally:
        audio_clip.close()
        video_clip.close()

if __name__ == "__main__":
    main()