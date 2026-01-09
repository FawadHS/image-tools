/**
 * Test setup file for Vitest
 */

// Mock Worker for heic2any
if (typeof Worker === 'undefined') {
  (global as any).Worker = class {
    onmessage: ((event: any) => void) | null = null;
    postMessage() {}
    terminate() {}
  };
}

// Mock canvas and image APIs for testing
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function () {
    return {
      fillStyle: '',
      fillRect: () => {},
      clearRect: () => {},
      getImageData: (x: number, y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
      }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
    } as any;
  };

  HTMLCanvasElement.prototype.toBlob = function (callback) {
    setTimeout(() => {
      callback(new Blob([''], { type: 'image/png' }));
    }, 0);
  };

  HTMLCanvasElement.prototype.toDataURL = function () {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  };
}

// Mock Image
if (typeof Image === 'undefined') {
  (global as any).Image = class {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    src = '';
    width = 100;
    height = 100;

    constructor() {
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
  };
}

// Mock createImageBitmap for Web Worker tests
if (typeof createImageBitmap === 'undefined') {
  (global as any).createImageBitmap = async () => ({
    width: 100,
    height: 100,
    close: () => {},
  });
}

// Mock OffscreenCanvas for Web Worker tests
if (typeof OffscreenCanvas === 'undefined') {
  (global as any).OffscreenCanvas = class {
    width = 0;
    height = 0;

    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
    }

    getContext() {
      return HTMLCanvasElement.prototype.getContext.call(this);
    }

    convertToBlob() {
      return Promise.resolve(new Blob([''], { type: 'image/png' }));
    }
  };
}

// Mock URL.createObjectURL and revokeObjectURL
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = () => 'blob:mock-url';
  URL.revokeObjectURL = () => {};
}
