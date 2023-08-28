import ora from 'ora';
import { consola } from "consola";
import { GITHUB_PROJECT, getProjectIssues, getProjectInfo } from './github';
// import GithubMockupJson from '../github-response-mockup/multiple-status-issues.json';
import { generatePdf } from './pdf';

(async () => {

  consola.box("Github issues To PDF");

  let spinner = ora('Loading project').start();
  const projectInfo: GITHUB_PROJECT = await getProjectInfo();
  spinner.succeed('Load project done!');

  if (!projectInfo || !projectInfo.number) {
    consola.warn("Invalid github information. Check .env file");
    return;
  }

  consola.info(`Github Project: "${projectInfo.title}"`);
  consola.info(`Columns: ${projectInfo.columns?.map((column) => `"${column}"`)}`);
  if (projectInfo.iterations) {
    consola.info(`Interations: ${JSON.stringify(projectInfo.iterations)}`);
  }
  
  const answer = await consola.prompt("Do you want to proceed?", {
    type: "confirm",
  });

  if (answer) {
    spinner.start('Loading github issues');
    const issues = await getProjectIssues();
    spinner.succeed('Load github issues done!');
    // console.log(JSON.stringify(issues));
  
    spinner.start('Generating PDF');
    const results: string[] = await generatePdf(projectInfo, issues);
    // const results: string[] = await generatePdf(projectInfo, GithubMockupJson);
    spinner.succeed(`Generated PDF!`);

    for (const item of results) {
      consola.info(item);
    }
  }
})();
