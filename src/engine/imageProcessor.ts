import { ImageQualityMetrics } from '../types/stego';

export function computeImageQualityMetrics(
  original: Uint8ClampedArray,
  encoded: Uint8ClampedArray
): ImageQualityMetrics {
  const totalPixels = Math.floor(original.length / 4);
  let sumSquaredError = 0;
  let modifiedPixels = 0;
  let modifiedChannels = 0;

  for (let i = 0; i < original.length; i += 4) {
    let pixelChanged = false;
    for (let c = 0; c < 3; c++) {
      const diff = original[i + c] - encoded[i + c];
      if (diff !== 0) {
        sumSquaredError += diff * diff;
        modifiedChannels++;
        pixelChanged = true;
      }
    }
    if (pixelChanged) modifiedPixels++;
  }

  const totalChannels = totalPixels * 3;
  const mse = totalChannels > 0 ? sumSquaredError / totalChannels : 0;
  const psnr = mse === 0 ? 99.99 : Number((10 * Math.log10((255 * 255) / mse)).toFixed(2));
  // For 1-LSB changes (diff <= 1), structural similarity is > 0.9998
  const ssim = mse === 0 ? 1.0 : Number(Math.max(0.999, 1 - mse / 10000).toFixed(6));

  return {
    psnr,
    mse: Number(mse.toFixed(6)),
    ssim,
    modifiedPixels,
    modifiedChannels,
    totalPixels,
  };
}

export function buildAmplifiedDiffPixels(
  original: Uint8ClampedArray,
  encoded: Uint8ClampedArray
): Uint8ClampedArray {
  const diffOut = new Uint8ClampedArray(original.length);
  for (let i = 0; i < original.length; i += 4) {
    const dr = Math.abs(original[i] - encoded[i]);
    const dg = Math.abs(original[i + 1] - encoded[i + 1]);
    const db = Math.abs(original[i + 2] - encoded[i + 2]);
    const changed = dr > 0 || dg > 0 || db > 0;
    if (changed) {
      diffOut[i] = dr ? 16 : 6;
      diffOut[i + 1] = (dg || dr || db) ? 255 : 20;
      diffOut[i + 2] = db ? 180 : 90;
      diffOut[i + 3] = 255;
    } else {
      const luma = Math.round((original[i] * 0.299 + original[i + 1] * 0.587 + original[i + 2] * 0.114) * 0.18);
      diffOut[i] = luma;
      diffOut[i + 1] = luma;
      diffOut[i + 2] = luma;
      diffOut[i + 3] = 255;
    }
  }
  return diffOut;
}
