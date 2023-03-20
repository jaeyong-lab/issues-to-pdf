"use strict";
import * as _ from 'lodash';
import { graphqlClient, queryProjects, queryProjectIssues } from './github-api';


const GITHUB_ORG: string = <string>process.env.GITHUB_ORG;
const GITHUB_PROJECT_ID: number = <number>_.toNumber(process.env.GITHUB_PROJECT_ID)

/**
 * get all projects
 * @param orglogin  : org name
 * @returns         : org's project list
 */
const getProjects = async (orglogin: string): Promise<any> => {
  const STEP: number = 10;
  let total: number = 0;
  let projects: any = [];
  let hasNextPage: boolean = true;
  let afterCursor: string = '';

  try {
    while(hasNextPage) {
      const result = await graphqlClient(queryProjects(orglogin, afterCursor, STEP));
      const projectsV2: any = _.get(result, 'organization.projectsV2');
      const pageInfo: any = projectsV2.pageInfo;
      total = <number>projectsV2.totalCount;
      afterCursor = pageInfo.endCursor;
      hasNextPage = pageInfo.hasNextPage
      projects = _.concat(projects, projectsV2.nodes);
    }
    console.log(`[getProjects] total:${total}, issues count: ${_.size(projects)}`);    
  } catch (error: any) {
    console.log('Request failed:', error.request); // { query, variables: {}, headers: { authorization: 'token secret123' } }
    console.log(error.message); // `invalid cursor` does not appear to be a valid cursor.
    console.log(error.data); // { repository: { name: 'probot', ref: null } }
  }

  return projects;
};

/**
 * get all issues in project
 * @param orglogin    : org name
 * @param projectid   : project id
 * @returns           : issue list
 */
const getIssues = async (orglogin: string, projectid: number): Promise<any> => {
  const STEP: number = 50;
  let total: number = 0;
  let issues: any = [];
  let hasNextPage: boolean = true;
  let afterCursor: string = '';

  try {
    while(hasNextPage) {
      const result = await graphqlClient(queryProjectIssues(orglogin, projectid, afterCursor, STEP));
      const items: any = _.get(result, 'organization.projectV2.items');
      const pageInfo: any = items.pageInfo;
      total = <number>items.totalCount;
      afterCursor = pageInfo.endCursor;
      hasNextPage = pageInfo.hasNextPage
      issues = _.concat(issues, items.nodes);
    }
    console.log(`[getIssues] total:${total}, issues count: ${_.size(issues)}`);
    
  } catch (error: any) {
    console.log('Request failed:', error.request); // { query, variables: {}, headers: { authorization: 'token secret123' } }
    console.log(error.message); // `invalid cursor` does not appear to be a valid cursor.
    console.log(error.data); // { repository: { name: 'probot', ref: null } }
  }
  return issues;
}

const runTest = async () => {
  const orglogin: string = GITHUB_ORG;
  // 19: dev-mercury
  // 39: dev-saturn
  const projectid: number = GITHUB_PROJECT_ID; 
  const status: string = 'In progress';

  // const projects = await getProjects(orglogin);
  const issues = await getIssues(orglogin, projectid);
  const inProgressIssues = _.filter(issues, (item) => {
    return item.fieldValueByName?.name === status;
  });

  console.log('[runTest] result:', inProgressIssues);
};

runTest();
