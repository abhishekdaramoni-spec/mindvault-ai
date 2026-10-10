# Diffusion Models and Latent Generative Architectures

## Foundations of Diffusion Probabilistic Models
Denoising Diffusion Probabilistic Models (DDPM) formulate image generation as a parameterized Markov chain that learns to reverse a gradual forward diffusion process. In the forward process $q(x_t | x_{t-1})$, Gaussian noise is incrementally added to data over $T$ timesteps according to a pre-defined variance schedule $\beta_1, \dots, \beta_T$.

## Reverse Denoising Process
The neural network, typically parameterized by a Time-Conditioned U-Net or Diffusion Transformer (DiT), is trained using a simple mean squared error loss to predict the added noise $\epsilon$:
$$L_{\text{simple}}(\theta) = \mathbb{E}_{t, x_0, \epsilon} \left[ \|\epsilon - \epsilon_\theta(x_t, t)\|^2 \right]$$

## Latent Diffusion Models (Stable Diffusion)
Pixel-space diffusion suffers from prohibitive computational complexity. Latent Diffusion Models (LDM) resolve this bottleneck by operating within the lower-dimensional latent space of a pre-trained Variational Autoencoder (VAE). Cross-attention mechanisms within the U-Net inject conditioning signals, such as text embeddings produced by CLIP or T5 text encoders.

## Classifier-Free Guidance (CFG)
Classifier-Free Guidance balances sample fidelity and prompt adherence during generation. The final noise prediction combines conditioned and unconditioned trajectories scaled by a guidance weight $w$:
$$\tilde{\epsilon}_\theta(x_t, c) = (1 + w)\epsilon_\theta(x_t, c) - w\epsilon_\theta(x_t, \emptyset)$$
Higher guidance values improve semantic alignment with the prompt while reducing output diversity.
