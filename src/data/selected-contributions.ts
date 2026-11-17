export const selectedContributions = [
  {
    name: 'PyTorch',
    repository: 'pytorch/pytorch',
    stars: 103177,
    description: {
      ja: 'Col2imの並列化・メモリ削減',
      en: 'Parallel Col2im, less memory',
    },
    pullRequests: [198123],
  },
  {
    name: 'OpenCV',
    repository: 'opencv/opencv',
    stars: 90990,
    description: {
      ja: 'CPU逆畳み込みの座標計算削減・SIMD化',
      en: 'Reduce coordinate work and add SIMD in CPU transposed convolution',
    },
    pullRequests: [30001],
  },
  {
    name: 'ONNX Runtime',
    repository: 'microsoft/onnxruntime',
    stars: 21943,
    description: {
      ja: 'Col2im・Im2col・Transpose・1次元MaxPoolの最適化',
      en: 'Optimize Col2im, Im2col, Transpose, and 1D MaxPool',
    },
    pullRequests: [32698, 32800, 32817, 32891, 32936],
  },
] as const;
