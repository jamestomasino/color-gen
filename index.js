// Generate a list of HSL colors which are not too close together visually

/* Generate a LAB color
 *  L =  0   to 100
 *  A = -100 to 100
 *  B = -100 to 100
*/

class LAB {

  /** d65 standard illuminant in XYZ */
  static d65 = [95.05, 100, 108.9];

  /** Round values smaller than maxZeroTolerance to zero in computations which
  can fluctuate greatly near zero */
  static maxZeroTolerance = Math.pow(10, -12);

  constructor (l, a, b) {
    this.L = l
    this.a = a
    this.b = b
  }

  /* This beast is actually a 3 way conversion. LAB to XYZ, XYZ to RGB, RGB to HSL */
  toHSL() {
    // console.log('lab:', this.L, this.a, this.b)
    // To XYZ
    const eps = 216 / 24389;
    const kap = 24389 / 27;
    const fY = (this.L + 16) / 116;
    const fZ = (fY - this.b / 200);
    const fX = this.a / 500 + fY;
    const xR = Math.pow(fX, 3) > eps ? Math.pow(fX, 3) : (116 * fX - 16) / kap;
    const yR = this.L > kap * eps ? Math.pow((this.L + 16) / 116, 3) : this.L / kap;
    const zR = Math.pow(fZ, 3) > eps ? Math.pow(fZ, 3) : (116 * fZ - 16) / kap;
    // Add zero to prevent signed zeros (force 0 rather than -0)
    const xyz = [xR * LAB.d65[0] + 0, yR * LAB.d65[1] + 0, zR * LAB.d65[2] + 0];

    // console.log('xyz:', xyz)

    // To RGB
    const x = xyz[0] / 100;
    const y = xyz[1] / 100;
    const z = xyz[2] / 100;
    // xyz is multiplied by the reverse transformation matrix to linear rgb
    const invR = 3.2406254773200533 * x - 1.5372079722103187 * y -
      0.4986285986982479 * z;
    const invG = -0.9689307147293197 * x + 1.8757560608852415 * y +
      0.041517523842953964 * z;
    const invB = 0.055710120445510616 * x + -0.2040210505984867 * y +
      1.0569959422543882 * z;
    // Linear rgb must be gamma corrected to normalized srgb. Gamma correction
    // is linear for values <= 0.0031308 to avoid infinite log slope near zero
    const compand = (c) => c <= 0.0031308 ?
      12.92 * c :
      1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    let r = Math.round(compand(invR) * 255);
    let g = Math.round(compand(invG) * 255);
    let b = Math.round(compand(invB) * 255);

    r = (r < 0) ? 0 : (r > 255) ? 255: r
    g = (g < 0) ? 0 : (g > 255) ? 255: g
    b = (b < 0) ? 0 : (b > 255) ? 255: b

    // console.log('rgb:', r, g, b)

    r /= 255
    g /= 255
    b /= 255

    // To HSL
    let cmin = Math.min(r,g,b),
      cmax = Math.max(r,g,b),
      delta = cmax - cmin,
      h = 0,
      s = 0,
      l = 0;

    // Calculate hue
    // No difference
    if (delta == 0)
      h = 0;
    // Red is max
    else if (cmax == r)
      h = ((g - b) / delta) % 6;
    // Green is max
    else if (cmax == g)
      h = (b - r) / delta + 2;
    // Blue is max
    else
      h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    // Make negative hues positive behind 360°
    if (h < 0)
      h += 360;

    // Calculate lightness
    l = (cmax + cmin) / 2;

    // Calculate saturation
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    // Multiply l and s by 100
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    // console.log ('hsl:', h, s, l)
    return [h,s,l];
  }
}

function deltaE00(lab1, lab2) {
  const l1 = lab1.L
  const a1 = lab1.a
  const b1 = lab1.b
  const l2 = lab2.L
  const a2 = lab2.a
  const b2 = lab2.b
  // Utility functions added to Math Object
  Math.rad2deg = function(rad) {
    return 360 * rad / (2 * Math.PI);
  };
  Math.deg2rad = function(deg) {
    return (2 * Math.PI * deg) / 360;
  };
  // Start Equation
  // Equation exist on the following URL http://www.brucelindbloom.com/index.html?Eqn_DeltaE_CIE2000.html
  const avgL = (l1 + l2) / 2;
  const c1 = Math.sqrt(Math.pow(a1, 2) + Math.pow(b1, 2));
  const c2 = Math.sqrt(Math.pow(a2, 2) + Math.pow(b2, 2));
  const avgC = (c1 + c2) / 2;
  const g = (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7)))) / 2;

  const a1p = a1 * (1 + g);
  const a2p = a2 * (1 + g);

  const c1p = Math.sqrt(Math.pow(a1p, 2) + Math.pow(b1, 2));
  const c2p = Math.sqrt(Math.pow(a2p, 2) + Math.pow(b2, 2));

  const avgCp = (c1p + c2p) / 2;

  let h1p = Math.rad2deg(Math.atan2(b1, a1p));
  if (h1p < 0) {
    h1p = h1p + 360;
  }

  let h2p = Math.rad2deg(Math.atan2(b2, a2p));
  if (h2p < 0) {
    h2p = h2p + 360;
  }

  const avghp = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + 360) / 2 : (h1p + h2p) / 2;

  const t = 1 - 0.17 * Math.cos(Math.deg2rad(avghp - 30)) + 0.24 * Math.cos(Math.deg2rad(2 * avghp)) + 0.32 * Math.cos(Math.deg2rad(3 * avghp + 6)) - 0.2 * Math.cos(Math.deg2rad(4 * avghp - 63));

  let deltahp = h2p - h1p;
  if (Math.abs(deltahp) > 180) {
    if (h2p <= h1p) {
      deltahp += 360;
    } else {
      deltahp -= 360;
    }
  }

  const deltalp = l2 - l1;
  const deltacp = c2p - c1p;

  deltahp = 2 * Math.sqrt(c1p * c2p) * Math.sin(Math.deg2rad(deltahp) / 2);

  const sl = 1 + ((0.015 * Math.pow(avgL - 50, 2)) / Math.sqrt(20 + Math.pow(avgL - 50, 2)));
  const sc = 1 + 0.045 * avgCp;
  const sh = 1 + 0.015 * avgCp * t;

  const deltaro = 30 * Math.exp(-(Math.pow((avghp - 275) / 25, 2)));
  const rc = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
  const rt = -rc * Math.sin(2 * Math.deg2rad(deltaro));

  const kl = 1;
  const kc = 1;
  const kh = 1;

  const deltaE = Math.sqrt(Math.pow(deltalp / (kl * sl), 2) + Math.pow(deltacp / (kc * sc), 2) + Math.pow(deltahp / (kh * sh), 2) + rt * (deltacp / (kc * sc)) * (deltahp / (kh * sh)));

  return deltaE;
}

const colors = []
const deltaEThreshold = 10

function generateColors () {
  while (colors.length < 20) {
    const L = Math.round(Math.random() * 100)
    const a = Math.round(Math.random() * 200 - 100)
    const b = Math.round(Math.random() * 200 - 100)
    const lab = new LAB(L,a,b)
    if (colors.some(color => deltaEThreshold > deltaE00(lab, color))) {
      // console.log('rejected')
    } else {
      colors.push(lab)
    }
  }
  colors.map(color => {
    const hsl = color.toHSL()
    console.log (hsl)
  })

}

generateColors()
