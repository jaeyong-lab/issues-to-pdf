'use strict';
import ora from 'ora';
import { getProjectIssues } from './github';
// import GithubMockupJson from './github-mockup.json';
import { generatePdf } from './pdf';

(async () => {
  let spinner = ora('Loading github issues').start();

  const issues = await getProjectIssues();
  spinner.succeed('Load github issues done!')
  // console.log(JSON.stringify(issues));

  spinner = ora('Generating PDF').start();

  const fileName = await generatePdf(issues);
  // await generatePdf(GithubMockupJson);
  spinner.succeed(`Generate PDF : ${fileName}`)
})();
