import { selectedContributions } from './selected-contributions';

export const systemProjects = [
  ...selectedContributions.map(({ name, repository, icon }) => ({ name, repository, icon })),
  { name: 'ncnn', repository: 'Tencent/ncnn', icon: 'ncnn' },
  { name: 'MNN', repository: 'alibaba/MNN', icon: 'mnn' },
  { name: 'Burn', repository: 'tracel-ai/burn', icon: 'burn' },
  { name: 'tract', repository: 'sonos/tract', icon: 'tract' },
  { name: 'ESP-DL', repository: 'espressif/esp-dl', icon: 'espressif' },
] as const;
