"use strict";
import { readFile } from 'node:fs/promises';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import * as _ from 'lodash';
import PDFMerger from 'pdf-merger-js';
import { GITHUB_ISSUE } from './github';


const TEMPLATE_BASE_PATH = `${__dirname}/../html-templates`;
const TEMPLATES = [
  {
    name: 'primer',
    path: `${TEMPLATE_BASE_PATH}/primer-template.html`
  },
  {
    name: 'alex',
    path: `${TEMPLATE_BASE_PATH}/alex-template.html`
  }
];
const DEFAULT_TEMPLATE: string = 'primer';

const loadTemplate = async (name: string): Promise<string> => {
  const template = _.find(TEMPLATES, {name: name});

  if (!template) {
    console.error('[pdf/compileTemplate] template name is undefined.', name);
    throw new Error('Undefined template name');
  }

  let source: string = '';
  try {
    source = await readFile(template.path, 'utf-8');
    // console.log('[pdf/compileTemplate] read template file : ', template.name)
  } catch (error) {
    console.error('[pdf/compileTemplate] read template failed. error', error);
    throw error;
  }

  return source;
};


export const generatePdf = async (issues: GITHUB_ISSUE[], outputName = 'merged-issues.pdf') => {
  const templateSource = await loadTemplate(DEFAULT_TEMPLATE);
  const template = Handlebars.compile(templateSource);

  const htmlIssues: string[] = issues.map((issue) => {
    const createdDate: string = issue.createdAt ? (new Date(issue.createdAt)).toDateString() : '';
    const repoNames: string[] = issue.repoNameWithOwner ? _.split(issue.repoNameWithOwner, '/') : ['', ''];
    return template({
      ...issue,
      repoOwner: repoNames[0],
      repoName: repoNames[1],
      createdDate: createdDate
    });
  });

  const browser = await puppeteer.launch({
    // headless: false,
    // NOTE: change executeablePath for your system
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: [
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials',
      '--autoplay-policy=user-gesture-required',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-domain-reliability',
      '--disable-extensions',
      '--disable-features=AudioServiceOutOfProcess',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-notifications',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-popup-blocking',
      '--disable-print-preview',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-setuid-sandbox',
      '--disable-speech-api',
      '--disable-sync',
      '--hide-scrollbars',
      '--ignore-gpu-blacklist',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-first-run',
      '--no-pings',
      '--no-sandbox',
      '--no-zygote',
      '--password-store=basic',
      '--use-gl=swiftshader',
      '--use-mock-keychain'
    ]
  });

  const merger = new PDFMerger();
  for (const item of htmlIssues) {
    const page = await browser.newPage();
    await page.setContent(item);

    // generate one page pdf buffer
    const pdf = await page.pdf({format: 'A4', pageRanges: '1' });
    await merger.add(pdf);
  }
  await browser.close();
  await merger.save(outputName);
  
  return outputName;
}
