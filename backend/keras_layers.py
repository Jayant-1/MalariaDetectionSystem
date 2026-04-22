"""
Custom Keras layers for MalariNet architecture
"""

import tensorflow as tf
from tensorflow import keras

class ChannelAttention(keras.layers.Layer):
    """
    Squeeze-and-Excitation (SE) block for channel-wise attention
    
    This layer learns to emphasize important feature channels
    and suppress less useful ones.
    
    Args:
        ratio: Reduction ratio for bottleneck (default: 16)
    """
    def __init__(self, ratio=16, **kwargs):
        super(ChannelAttention, self).__init__(**kwargs)
        self.ratio = ratio

    def build(self, input_shape):
        channels = input_shape[-1]
        self.shared_dense_1 = keras.layers.Dense(
            max(channels // self.ratio, 8),
            activation='relu',
            kernel_initializer='he_normal',
            name='se_dense1'
        )
        self.shared_dense_2 = keras.layers.Dense(
            channels,
            kernel_initializer='he_normal',
            name='se_dense2'
        )
        super(ChannelAttention, self).build(input_shape)

    def call(self, inputs):
        # Global average pooling
        gap = tf.reduce_mean(inputs, axis=[1, 2], keepdims=True)
        
        # Excitation: FC -> ReLU -> FC -> Sigmoid
        attention = self.shared_dense_2(self.shared_dense_1(gap))
        attention = tf.nn.sigmoid(attention)
        
        # Scale input by attention weights
        return inputs * attention

    def get_config(self):
        config = super(ChannelAttention, self).get_config()
        config.update({'ratio': self.ratio})
        return config

def get_custom_objects():
    """
    Get dictionary of custom objects for model loading
    
    Returns:
        Dictionary mapping layer names to classes
    """
    return {
        'ChannelAttention': ChannelAttention
    }
