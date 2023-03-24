"use strict";
import { readFile } from 'node:fs/promises';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import * as _ from 'lodash';
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

const loadTemplate = async (name: string): Promise<string> => {
  const template = _.find(TEMPLATES, {name: name});

  if (!template) {
    console.error('[pdf/compileTemplate] template name is undefined.', name);
    throw new Error('Undefined template name');
  }

  let source: string = '';
  try {
    source = await readFile(template.path, 'utf-8');
    console.log('[pdf/compileTemplate] read template file : ', template.name)
  } catch (error) {
    console.error('[pdf/compileTemplate] read template failed. error', error);
    throw error;
  }

  return source;
};


export const generatePdf = async (issues: GITHUB_ISSUE[]) => {
  const templateSource = await loadTemplate('primer');
  const template = Handlebars.compile(templateSource);

  const htmlIssues: string[] = issues.map((issue) => {
    return template(issue);
  });

  const browser = await puppeteer.launch({
    headless: false,
    // NOTE: change executeablePath for your system
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });

  const page = await browser.newPage();
  await page.setContent(htmlIssues[0]);

  // await page.pdf({ path: 'html.pdf', format: 'A4' })
  // await browser.close();
}
