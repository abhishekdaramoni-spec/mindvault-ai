# Model Quantization: INT8, INT4 and Weight-Only Compression

## The Need for Quantization
As Large Language Models scale past 70 billion parameters, GPU memory bandwidth and VRAM constraints become critical bottlenecks. Model quantization reduces the numeric precision of weights and activations from 16-bit floating point (FP16 or BF16) to 8-bit or 4-bit integers.

## Post-Training Quantization (PTQ) vs QAT
- Post-Training Quantization (PTQ): Compresses a pre-trained model directly without retraining, using methods like AWQ (Activation-aware Weight Quantization) or GPTQ.
- Quantization-Aware Training (QAT): Simulates quantization errors during the forward pass of fine-tuning, preserving higher task accuracy for extreme low-bit precisions.

## Memory Footprint Comparison
A 7B parameter model requires approximately 14 GB of VRAM in FP16 precision. When quantized with INT4 precision, the memory requirement drops under 4.5 GB, allowing efficient local inference on consumer hardware and edge devices with minimal perplexity degradation.
