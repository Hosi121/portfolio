const contributions = [
  {
    name: 'PyTorch',
    icon: 'pytorch',
    repository: 'pytorch/pytorch',
    stars: 103177,
    changes: [
      {
        description: { ja: 'Col2imの並列化・メモリ削減', en: 'Parallel Col2im, less memory' },
        pullRequests: [198123],
      },
    ],
  },
  {
    name: 'OpenCV',
    icon: 'opencv',
    repository: 'opencv/opencv',
    stars: 90990,
    changes: [
      {
        description: { ja: 'CPU逆畳み込みの座標計算削減・SIMD化', en: 'Reduce coordinate work and add SIMD in CPU transposed convolution' },
        pullRequests: [30001],
      },
    ],
  },
  {
    name: 'ONNX Runtime',
    icon: 'onnx',
    repository: 'microsoft/onnxruntime',
    stars: 21943,
    descriptionPrefix: { ja: '', en: 'Optimize ' },
    descriptionSuffix: { ja: 'の最適化', en: '' },
    changes: [
      { description: { ja: 'Col2im', en: 'Col2im' }, pullRequests: [32698, 32800] },
      { description: { ja: 'Im2col', en: 'Im2col' }, pullRequests: [32817] },
      { description: { ja: 'Transpose', en: 'Transpose' }, pullRequests: [32891] },
      { description: { ja: 'MaxPool', en: 'MaxPool' }, pullRequests: [32936] },
    ],
  },
] as const;

export const selectedContributions = contributions.map(contribution => ({
  ...contribution,
  descriptionPrefix: 'descriptionPrefix' in contribution ? contribution.descriptionPrefix : { ja: '', en: '' },
  descriptionSuffix: 'descriptionSuffix' in contribution ? contribution.descriptionSuffix : { ja: '', en: '' },
  pullRequests: contribution.changes.flatMap<number>(change => change.pullRequests),
}));
