import { xyzToLab, rgbToXyz, hslToRgb } from './colorConversions.mjs';

class LAB {
  /** d65 standard illuminant in XYZ */
  static d65 = [95.05, 100, 108.9];

  constructor (l, a, b) {
    this.L = l
    this.a = a
    this.b = b
  }

  toString () {
    return 'lab(' + this.L + '% ' + this.a + ' ' + this.b + ')'
  }
}

/* Calculate the difference between two Lab colors */
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

/* Main logic */
const colors = [] // Accumulate our colors as accepted
const deltaEThreshold = 3 // difference threshold allowed between colors
const numColors = 50 // How many colors

function generateColors () {
  let bailout = 0
  while ((colors.length < numColors) && (bailout < 100)) {
    // const L = Math.round(Math.random() * 40 + 60) // skew to pastel
    // const a = Math.round(Math.random() * 200 - 100)
    // const b = Math.round(Math.random() * 200 - 100)
    const hsl = {
      h: Math.random() * 360,
      s: 25 + 20 * Math.random(),
      l: 85 + 10 * Math.random()
    }
    const convertedHSL = xyzToLab(rgbToXyz(hslToRgb(hsl)))
    const lab = new LAB(convertedHSL.l, convertedHSL.a, convertedHSL.b)

    if (colors.some(color => deltaEThreshold > deltaE00(lab, color))) {
      //console.log('rejected') // Too similar to another existing color
      bailout++
    } else {
      colors.push(lab)
      //console.log(lab.toString())
    }
  }
}

function displayColors () {
  colors.map(color => {
    var item = document.createElement('div')
    item.style.cssText = `
            display: inline-block;
            padding: 3em;
            margin: 10px;
            border-radius: 10%;
            background-color: ${color.toString()};
          `
    document.body.appendChild(item);
  })
}

generateColors()
displayColors()
