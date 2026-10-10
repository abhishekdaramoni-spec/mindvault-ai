# Transformer Architecture and Attention Mechanisms in Modern LLMs

## Overview
Transformer models have become the dominant architecture in natural language processing and computer vision. Introduced in 2017 with the 'Attention Is All You Need' paper, the Transformer replaces recurrence and convolutions entirely with self-attention mechanisms.

## Self-Attention Mechanism
The core building block of the Transformer is Scaled Dot-Product Attention. Given queries $Q$, keys $K$, and values $V$:
$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$
Multi-Head Attention enables the model to jointly attend to information from different representation subspaces at different positions.

## Feed-Forward Networks and Normalization
Each layer of the Transformer consists of a multi-head self-attention sub-layer followed by a position-wise fully connected Feed-Forward Network (FFN). Modern architectures such as LLaMA and Mistral use RMSNorm (Root Mean Square Normalization) and SwiGLU activations rather than traditional LayerNorm and ReLU.

## Rotary Positional Embeddings (RoPE)
Modern large language models replace absolute positional embeddings with Rotary Position Embedding (RoPE). RoPE encodes relative positional information by multiplying query and key representations by a complex rotation matrix, providing strong sequence extrapolation capabilities.
