import { renderEditsToCanvas } from '../../src/utils/imageTransform';
import { ImageTransform } from '../../src/types';

const makeImage = (width: number, height: number): HTMLImageElement => {
  const img = new Image();
  img.naturalWidth = width;
  img.naturalHeight = height;
  img.width = width;
  img.height = height;
  return img;
};

describe('renderEditsToCanvas', () => {
  const makeCtx = () => ({
    fillStyle: '',
    globalAlpha: 1,
    font: '',
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    filter: 'none',
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
    measureText: jest.fn(() => ({ width: 100 })),
    fillText: jest.fn(),
  });

  beforeEach(() => {
    const ctx = makeCtx();
    (HTMLCanvasElement.prototype.getContext as jest.Mock).mockReturnValue(ctx);
  });

  it('swaps dimensions on 90 deg rotation', () => {
    const img = makeImage(800, 600);
    const transform: ImageTransform = {
      rotation: 90,
      flipHorizontal: false,
      flipVertical: false,
    };

    const canvas = renderEditsToCanvas(img, transform, false);
    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(800);
  });

  it('applies crop dimensions to output canvas', () => {
    const img = makeImage(1000, 800);
    const transform: ImageTransform = {
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
      crop: { x: 10, y: 20, width: 200, height: 100, shape: 'rectangle' },
    };

    const canvas = renderEditsToCanvas(img, transform, false);
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(100);
  });

  it('renders all text overlays when enabled', () => {
    const img = makeImage(500, 400);
    const transform: ImageTransform = {
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
      textOverlays: [
        { text: 'One', x: 10, y: 20, fontSize: 20, fontFamily: 'Arial', color: '#000000', opacity: 1 },
        { text: 'Two', x: 50, y: 70, fontSize: 24, fontFamily: 'Arial', color: '#ff0000', opacity: 0.8 },
      ],
    };

    const canvas = renderEditsToCanvas(img, transform, true);
    const ctx = canvas.getContext('2d') as any;
    expect(ctx.fillText).toHaveBeenCalledTimes(2);
    expect(ctx.fillText).toHaveBeenCalledWith('One', 10, 20);
    expect(ctx.fillText).toHaveBeenCalledWith('Two', 50, 70);
  });
});
