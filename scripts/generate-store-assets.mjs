import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outputRoot = path.join(root, 'marketing', 'app-store');

const palette = {
  background: '#040A0A',
  backgroundSoft: '#071211',
  cream: '#F7F3E8',
  muted: '#C8D4CE',
  green: '#1F9B7A',
  greenDeep: '#08231F',
  gold: '#D6A84E',
};

const assets = {
  icon: path.join(root, 'assets', 'icon.png'),
  home: path.join(root, 'marketing', 'raw-screenshots', '01-home.png'),
  prayer: path.join(root, 'marketing', 'raw-screenshots', '02-prayer.png'),
  infos: path.join(root, 'marketing', 'raw-screenshots', '03-infos.png'),
  quran: path.join(root, 'marketing', 'raw-screenshots', '04-quran.png'),
  services: path.join(root, 'marketing', 'raw-screenshots', '05-services.png'),
  settings: path.join(root, 'marketing', 'raw-screenshots', '06-settings.png'),
};

const slides = [
  {
    key: 'accueil',
    title: 'Toute la communauté locale',
    subtitle: "Prières, infos, Quran et services utiles pour Tours et ses alentours.",
    chips: ['Horaires', 'Infos', 'Services'],
    footerLabel: "Muslim'in",
    footerText: 'Une app claire, locale et sans publicité',
    screenshot: 'home',
  },
  {
    key: 'prieres',
    title: 'Prières et qiblah en direct',
    subtitle: "Consulte les horaires, l'iqama, la prochaine prière et la direction de La Mecque.",
    chips: ['Qiblah', 'Notifications', 'Mosquées'],
    footerLabel: 'Prières',
    footerText: 'Horaires fiables pour la communauté',
    screenshot: 'prayer',
  },
  {
    key: 'infos',
    title: 'Infos locales vérifiées',
    subtitle: "Retrouve les annonces importantes et propose une info à valider par l'équipe.",
    chips: ['Annonces', 'Validation', 'Photos'],
    footerLabel: 'Infos',
    footerText: 'Un fil clair pour les annonces utiles',
    screenshot: 'infos',
  },
  {
    key: 'quran',
    title: 'Quran en lecture et écoute',
    subtitle: 'Accède aux sourates, favoris, navigation par juz et récitations téléchargeables.',
    chips: ['Lecture', 'Écoute', 'Favoris'],
    footerLabel: 'Quran',
    footerText: 'Un espace simple pour lire et écouter',
    screenshot: 'quran',
  },
  {
    key: 'services',
    title: 'Services complémentaires',
    subtitle: "Contacte l'équipe, soutiens le projet et retrouve les liens utiles en un seul endroit.",
    chips: ['Contact', 'Soutien', 'Annuaire'],
    footerLabel: 'Services',
    footerText: 'Tout ce qui aide la vie locale',
    screenshot: 'services',
  },
  {
    key: 'parametres',
    title: 'Réglages personnalisés',
    subtitle: 'Mode nuit, mode jour, auto, notifications locales et préférences essentielles.',
    chips: ['Mode nuit', 'Auto', 'Notifications'],
    footerLabel: 'Paramètres',
    footerText: 'Une expérience adaptée à chacun',
    screenshot: 'settings',
  },
];

const formats = [
  {
    key: 'iphone-6-7',
    height: 2796,
    width: 1290,
    phoneWidthRatio: 0.59,
    phoneTopRatio: 0.352,
    titleSizeRatio: 0.077,
    titleTopRatio: 0.15,
    subtitleSizeRatio: 0.033,
    maxTitleChars: 25,
    maxSubtitleChars: 40,
  },
  {
    key: 'play-store',
    height: 1920,
    width: 1080,
    phoneWidthRatio: 0.49,
    phoneTopRatio: 0.326,
    titleSizeRatio: 0.072,
    titleTopRatio: 0.155,
    subtitleSizeRatio: 0.032,
    maxTitleChars: 24,
    maxSubtitleChars: 38,
  },
];

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let line = '';

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
      return;
    }
    line = next;
  });

  if (line) {
    lines.push(line);
  }

  return lines;
}

async function dataUri(filePath) {
  const extension = path.extname(filePath).replace('.', '') || 'png';
  const bytes = await readFile(filePath);
  return `data:image/${extension};base64,${bytes.toString('base64')}`;
}

function arabesquePattern() {
  return `
    <pattern id="arabesque" height="104" patternUnits="userSpaceOnUse" width="124">
      <g fill="none" stroke="${palette.cream}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.7" opacity="0.2" transform="translate(0 -10)">
        <path d="M62 8 C86 24 96 44 124 62 C96 80 86 100 62 116 C38 100 28 80 0 62 C28 44 38 24 62 8Z" />
        <path d="M62 28 C78 40 84 52 102 62 C84 72 78 84 62 96 C46 84 40 72 22 62 C40 52 46 40 62 28Z" opacity="0.72" />
        <path d="M62 62 C34 50 22 28 36 16 C50 4 70 16 66 34 C62 50 42 48 48 34 C52 26 60 30 58 38" />
        <g transform="rotate(90 62 62)">
          <path d="M62 62 C34 50 22 28 36 16 C50 4 70 16 66 34 C62 50 42 48 48 34 C52 26 60 30 58 38" />
        </g>
        <g transform="rotate(180 62 62)">
          <path d="M62 62 C34 50 22 28 36 16 C50 4 70 16 66 34 C62 50 42 48 48 34 C52 26 60 30 58 38" />
        </g>
        <g transform="rotate(270 62 62)">
          <path d="M62 62 C34 50 22 28 36 16 C50 4 70 16 66 34 C62 50 42 48 48 34 C52 26 60 30 58 38" />
        </g>
        <circle cx="62" cy="62" r="2.9" opacity="0.68" />
        <circle cx="62" cy="16" r="2" opacity="0.48" />
        <circle cx="16" cy="62" r="2" opacity="0.48" />
      </g>
    </pattern>
  `;
}

function textLines(lines, x, y, size, options = {}) {
  const {
    color = palette.cream,
    weight = 900,
    lineHeight = size * 1.08,
    anchor = 'start',
    family = 'Avenir Next, Arial, sans-serif',
  } = options;

  return `
    <text x="${x}" y="${y}" fill="${color}" font-family="${family}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">
      ${lines
        .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
        .join('')}
    </text>
  `;
}

function chip(label, x, y, size) {
  const width = label.length * size * 0.58 + size * 2.6;
  const height = size * 1.7;

  return `
    <g transform="translate(${x} ${y})">
      <rect width="${width}" height="${height}" rx="${height / 2}" fill="rgba(247,243,232,0.08)" stroke="rgba(247,243,232,0.14)" />
      <circle cx="${size * 0.9}" cy="${height / 2}" r="${size * 0.16}" fill="${palette.gold}" />
      <text x="${size * 1.45}" y="${height * 0.65}" fill="${palette.cream}" font-family="Avenir Next, Arial, sans-serif" font-size="${size}" font-weight="900">${escapeXml(label)}</text>
    </g>
  `;
}

function getPhonePlacement({ format, slide }) {
  const phoneWidth = format.width * format.phoneWidthRatio;
  const phoneHeight = phoneWidth * (844 / 390);
  const x = (format.width - phoneWidth) / 2;
  const y = format.height * format.phoneTopRatio;
  const border = phoneWidth * 0.018;
  const radius = phoneWidth * 0.09;

  return {
    border,
    innerHeight: phoneHeight - border * 2,
    innerRadius: radius * 0.78,
    innerWidth: phoneWidth - border * 2,
    innerX: x + border,
    innerY: y + border,
    key: slide.screenshot,
    phoneHeight,
    phoneWidth,
    radius,
    x,
    y,
  };
}

function phoneBase({ phoneHeight, phoneWidth, radius, x, y }) {
  const border = phoneWidth * 0.018;

  return `
    <g filter="url(#phoneShadow)">
      <rect x="${x}" y="${y}" width="${phoneWidth}" height="${phoneHeight}" rx="${radius}" fill="#020403" stroke="rgba(247,243,232,0.2)" stroke-width="${border}" />
    </g>
  `;
}

function phoneOverlay({ border, phoneHeight, phoneWidth, radius, x, y }) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${phoneWidth}" height="${phoneHeight}" rx="${radius}" fill="none" stroke="rgba(247,243,232,0.32)" stroke-width="${border}" />
      <rect x="${x + phoneWidth * 0.39}" y="${y + phoneWidth * 0.045}" width="${phoneWidth * 0.22}" height="${phoneWidth * 0.04}" rx="${phoneWidth * 0.02}" fill="#020403" />
      <rect x="${x + border * 0.6}" y="${y + border * 0.6}" width="${phoneWidth - border * 1.2}" height="${phoneHeight - border * 1.2}" rx="${radius * 0.92}" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="2" />
    </g>
  `;
}

function footer({ format, slide }) {
  const x = format.width * 0.065;
  const width = format.width * 0.87;
  const y = format.height - format.height * 0.055 - format.width * 0.082;
  const height = format.width * 0.082;
  const labelSize = format.width * 0.025;
  const textSize = format.width * 0.025;

  return `
    <g transform="translate(${x} ${y})">
      <rect width="${width}" height="${height}" rx="${format.width * 0.028}" fill="rgba(16,28,27,0.76)" stroke="rgba(247,243,232,0.12)" />
      <text x="${format.width * 0.028}" y="${height * 0.62}" fill="${palette.gold}" font-family="Avenir Next, Arial, sans-serif" font-size="${labelSize}" font-weight="900">${escapeXml(slide.footerLabel.toUpperCase())}</text>
      <text x="${width - format.width * 0.028}" y="${height * 0.62}" fill="${palette.cream}" font-family="Avenir Next, Arial, sans-serif" font-size="${textSize}" font-weight="850" text-anchor="end">${escapeXml(slide.footerText)}</text>
    </g>
  `;
}

function renderSlideBase({ format, iconUri, slide }) {
  const { height, width } = format;
  const padX = width * 0.065;
  const iconSize = width * 0.11;
  const brandY = height * 0.056;
  const titleY = height * format.titleTopRatio;
  const titleSize = width * format.titleSizeRatio;
  const titleLines = wrapText(slide.title, format.maxTitleChars);
  const titleLineHeight = titleSize * 1.05;
  const subtitleY = titleY + titleLineHeight * titleLines.length + width * 0.034;
  const subtitleSize = width * format.subtitleSizeRatio;
  const subtitleLines = wrapText(slide.subtitle, format.maxSubtitleChars);
  const chipSize = width * 0.022;
  const chipY = subtitleY + subtitleSize * 1.25 * subtitleLines.length + width * 0.035;
  const chipGap = width * 0.014;
  const phone = getPhonePlacement({ format, slide });
  let chipX = padX;
  const chips = slide.chips
    .map((label) => {
      const currentX = chipX;
      chipX += label.length * chipSize * 0.58 + chipSize * 2.6 + chipGap;
      return chip(label, currentX, chipY, chipSize);
    })
    .join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#0A1C19" />
          <stop offset="0.5" stop-color="${palette.background}" />
          <stop offset="1" stop-color="#020706" />
        </linearGradient>
        <radialGradient id="greenGlow" cx="28%" cy="9%" r="42%">
          <stop offset="0" stop-color="${palette.green}" stop-opacity="0.42" />
          <stop offset="1" stop-color="${palette.green}" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="goldGlow" cx="81%" cy="18%" r="35%">
          <stop offset="0" stop-color="${palette.gold}" stop-opacity="0.22" />
          <stop offset="1" stop-color="${palette.gold}" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="phoneGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="${palette.green}" stop-opacity="0.5" />
          <stop offset="0.55" stop-color="${palette.gold}" stop-opacity="0.22" />
          <stop offset="1" stop-color="${palette.green}" stop-opacity="0" />
        </radialGradient>
        <filter id="phoneShadow" x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="${width * 0.04}" stdDeviation="${width * 0.04}" flood-color="#000000" flood-opacity="0.56" />
        </filter>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="${width * 0.015}" stdDeviation="${width * 0.018}" flood-color="#000000" flood-opacity="0.35" />
        </filter>
        ${arabesquePattern()}
      </defs>

      <rect width="${width}" height="${height}" fill="url(#bg)" />
      <rect width="${width}" height="${height}" fill="url(#greenGlow)" />
      <rect width="${width}" height="${height}" fill="url(#goldGlow)" />
      <rect x="-80" y="-80" width="${width + 160}" height="${height + 160}" fill="url(#arabesque)" opacity="0.2" transform="rotate(-5 ${width / 2} ${height / 2})" />
      <rect width="${width}" height="${height}" fill="rgba(4,10,10,0.36)" />
      <rect width="${width}" height="${height}" fill="url(#phoneGlow)" opacity="0.42" transform="translate(${width * 0.1} ${height * 0.42}) scale(0.85)" />

      <g transform="translate(${padX} ${brandY})">
        <image href="${iconUri}" width="${iconSize}" height="${iconSize}" preserveAspectRatio="xMidYMid slice" filter="url(#softShadow)" />
        <text x="${iconSize + width * 0.026}" y="${iconSize * 0.42}" fill="${palette.cream}" font-family="Avenir Next, Arial, sans-serif" font-size="${width * 0.052}" font-weight="950">Muslim'in</text>
        <g transform="translate(${iconSize + width * 0.026} ${iconSize * 0.62})">
          <rect width="${width * 0.31}" height="${width * 0.047}" rx="${width * 0.024}" fill="rgba(247,243,232,0.08)" stroke="rgba(247,243,232,0.14)" />
          <circle cx="${width * 0.019}" cy="${width * 0.0235}" r="${width * 0.0048}" fill="${palette.gold}" />
          <text x="${width * 0.034}" y="${width * 0.031}" fill="${palette.gold}" font-family="Avenir Next, Arial, sans-serif" font-size="${width * 0.017}" font-weight="900">TOURS ET ALENTOURS</text>
        </g>
      </g>

      ${textLines(titleLines, padX, titleY, titleSize, { lineHeight: titleLineHeight, weight: 950 })}
      ${textLines(subtitleLines, padX, subtitleY, subtitleSize, {
        color: palette.muted,
        lineHeight: subtitleSize * 1.3,
        weight: 760,
      })}
      ${chips}

      ${phoneBase(phone)}
    </svg>
  `;
}

function renderOverlay({ format, slide }) {
  const phone = getPhonePlacement({ format, slide });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${format.width}" height="${format.height}" viewBox="0 0 ${format.width} ${format.height}">
      ${phoneOverlay(phone)}
      ${footer({ format, slide })}
    </svg>
  `;
}

async function prepareScreenshot({ filePath, placement }) {
  const width = Math.round(placement.innerWidth);
  const height = Math.round(placement.innerHeight);
  const radius = Math.round(placement.innerRadius);
  const roundedMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="#fff" /></svg>`,
  );

  const resized = await sharp(filePath).resize(width, height, { fit: 'cover' }).png().toBuffer();
  return sharp(resized).composite([{ input: roundedMask, blend: 'dest-in' }]).png().toBuffer();
}

async function main() {
  await mkdir(outputRoot, { recursive: true });

  const iconUri = await dataUri(assets.icon);

  for (const format of formats) {
    const outputDir = path.join(outputRoot, format.key);
    await mkdir(outputDir, { recursive: true });

    for (const [index, slide] of slides.entries()) {
      const svg = renderSlideBase({ format, iconUri, slide });
      const placement = getPhonePlacement({ format, slide });
      const screenshot = await prepareScreenshot({
        filePath: assets[placement.key],
        placement,
      });
      const overlay = Buffer.from(renderOverlay({ format, slide }));
      const baseName = `${String(index + 1).padStart(2, '0')}-${slide.key}`;
      await sharp(Buffer.from(svg))
        .png()
        .composite([
          {
            input: screenshot,
            left: Math.round(placement.innerX),
            top: Math.round(placement.innerY),
          },
          { input: overlay, left: 0, top: 0 },
        ])
        .png()
        .toFile(path.join(outputDir, `${baseName}.png`));
      console.log(`Generated ${format.key}/${baseName}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
