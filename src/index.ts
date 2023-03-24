"use strict";
import { getProjectIssues } from './github';
import GithubMockupJson from './github-mockup.json';
import { generatePdf } from './pdf';

(async () => {
  // const issues = await getProjectIssues();
  // console.log(JSON.stringify(issues));

  await generatePdf(GithubMockupJson);
})();
