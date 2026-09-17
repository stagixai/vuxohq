# ==============================================================================
# 🚀 1-CLICK COMFYUI + SDXL + FLUX CLOUD GPU LAUNCHER (Kaggle & Google Colab)
# Hardware: Select NVIDIA T4 / P100 / A100 GPU (Free on Kaggle & Colab)
# ==============================================================================

import os
import subprocess
import threading
import time

print("⚡ [1/5] Setting up working directory...")
base_dir = '/content' if os.path.exists('/content') else '/kaggle/working'
os.chdir(base_dir)

# Clone ComfyUI repository
if not os.path.exists('ComfyUI'):
    print("Cloning ComfyUI...")
    subprocess.run(['git', 'clone', '--depth', '1', 'https://github.com/comfyanonymous/ComfyUI.git'], check=True)

os.chdir(os.path.join(base_dir, 'ComfyUI'))

print("📦 [2/5] Installing core dependencies and Torch accelerators...")
subprocess.run(['pip', 'install', '-q', 'torch', 'torchvision', 'torchaudio', '--extra-index-url', 'https://download.pytorch.org/whl/cu121'])
subprocess.run(['pip', 'install', '-q', '-r', 'requirements.txt'])
subprocess.run(['pip', 'install', '-q', 'accelerate', 'transformers', 'safetensors', 'aiohttp', 'pycloudflared'])

print("🧩 [3/5] Installing essential ComfyUI Custom Nodes (Manager, ControlNet, IP-Adapter, AnimateDiff)...")
custom_nodes_dir = 'custom_nodes'
os.makedirs(custom_nodes_dir, exist_ok=True)
nodes = [
    'https://github.com/ltdrdata/ComfyUI-Manager.git',
    'https://github.com/Fannovel16/comfyui_controlnet_aux.git',
    'https://github.com/cubiq/ComfyUI_IPAdapter_plus.git',
    'https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved.git'
]

for node in nodes:
    node_name = node.split('/')[-1].replace('.git', '')
    dest = os.path.join(custom_nodes_dir, node_name)
    if not os.path.exists(dest):
        subprocess.run(['git', 'clone', '--depth', '1', node, dest])

print("📥 [4/5] Downloading Photorealistic SDXL Checkpoint (RealVisXL v5.0)...")
checkpoints_dir = 'models/checkpoints'
os.makedirs(checkpoints_dir, exist_ok=True)

model_url = "https://huggingface.co/SG161222/RealVisXL_V5.0/resolve/main/RealVisXL_V5.0.safetensors"
model_path = os.path.join(checkpoints_dir, "RealVisXL_V5.0.safetensors")

if not os.path.exists(model_path):
    print("Downloading RealVisXL v5.0 checkpoint...")
    subprocess.run(['wget', '-c', '-q', '--show-progress', model_url, '-O', model_path])

print("🌐 [5/5] Launching Cloudflare Tunnel & ComfyUI Server...")

def start_comfyui():
    subprocess.run(['python', 'main.py', '--listen', '127.0.0.1', '--port', '8188', '--highvram'])

threading.Thread(target=start_comfyui, daemon=True).start()
time.sleep(5)

from pycloudflared import try_cloudflare
public_url = try_cloudflare(port=8188)

print("\n" + "=" * 60)
print("🎉 COMFYUI IS LIVE ON YOUR FREE CLOUD GPU!")
print("👉 Public WebUI URL:", public_url)
print("=" * 60 + "\n")
