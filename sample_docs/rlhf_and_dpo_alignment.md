# Reinforcement Learning from Human Feedback and Direct Preference Optimization

## Aligning Language Models with Human Preferences
Pre-training on raw web text equips language models with linguistic capability but often produces misaligned, unhelpful, or hallucinatory outputs. Alignment techniques optimize model behavior toward helpfulness, honesty, and harmlessness (the 3H criteria).

## The Classic RLHF Pipeline (PPO)
Classic Reinforcement Learning from Human Feedback (RLHF) operates in three sequential phases:
1. Supervised Fine-Tuning (SFT) on curated high-quality prompt-response pairs.
2. Reward Modeling: Training a reward model $r_\theta(x, y)$ on pairwise human preferences using the Bradley-Terry preference model:
$$P(y_w \succ y_l | x) = \sigma(r_\theta(x, y_w) - r_\theta(x, y_l))$$
3. Reinforcement Learning via Proximal Policy Optimization (PPO) to maximize reward while penalizing divergence from the base reference policy via a KL-divergence penalty $\mathbb{D}_{\text{KL}}(\pi_\theta \| \pi_{\text{ref}})$.

## Direct Preference Optimization (DPO)
PPO fine-tuning is notoriously unstable and sensitive to hyperparameters. Direct Preference Optimization (DPO) re-parameterizes the reward model directly through the policy's closed-form implicit solution:
$$L_{\text{DPO}}(\theta; \pi_{\text{ref}}) = -\mathbb{E}_{(x, y_w, y_l)} \left[ \log \sigma \left( \beta \log \frac{\pi_\theta(y_w|x)}{\pi_{\text{ref}}(y_w|x)} - \beta \log \frac{\pi_\theta(y_l|x)}{\pi_{\text{ref}}(y_l|x)} \right) \right]$$
DPO completely eliminates the need for training a separate reward model or sampling actions dynamically during RL optimization.
