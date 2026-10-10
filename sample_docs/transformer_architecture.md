# Transformer Architecture & Multi-Head Attention

The Transformer model introduced by Vaswani et al. relies entirely on an attention mechanism to draw global dependencies between input and output without using sequence-aligned RNNs or convolution.
The Multi-Head Attention allows the model to jointly attend to information from different representation subspaces at different positions.

## Self-Attention Mechanism
An attention function can be described as mapping a query and a set of key-value pairs to an output.
The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key.
