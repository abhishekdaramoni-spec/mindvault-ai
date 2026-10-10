# Parameter-Efficient Fine-Tuning: LoRA, QLoRA and Adapter Modules

## The Efficiency Challenge in Foundation Model Adaptation
Full-parameter fine-tuning of 70B+ parameter models requires storing full optimizer states, gradients, and model checkpoints, requiring hundreds of gigabytes of distributed GPU memory. Parameter-Efficient Fine-Tuning (PEFT) methods freeze the pre-trained model weights and train a tiny subset of task-specific parameters.

## Low-Rank Adaptation (LoRA)
LoRA decomposes the weight update matrix $\Delta W \in \mathbb{R}^{d \times k}$ into two low-rank matrices $B \in \mathbb{R}^{d \times r}$ and $A \in \mathbb{R}^{r \times k}$, where the rank $r \ll \min(d, k)$:
$$W' = W_0 + \Delta W = W_0 + \frac{\alpha}{r} (B \cdot A)$$
Matrix $A$ is initialized from a Gaussian distribution and $B$ is initialized to zero, ensuring $\Delta W = 0$ at the onset of training. LoRA introduces zero inference latency because the learned adapter weights can be folded directly back into the base weights during deployment.

## QLoRA: Quantized Low-Rank Adaptation
QLoRA advances PEFT by quantizing the base model into a novel 4-bit NormalFloat (NF4) data type and applying Double Quantization to compress quantization constants. Page-aware memory management mitigates memory spikes during checkpointing, enabling fine-tuning of a 65B model on a single 48GB GPU without performance degradation.
