"use strict";
import * as _ from 'lodash';
import { graphqlClient, queryProjects, queryProjectItems } from './github-api';

const GITHUB_ORG: string = <string>process.env.GITHUB_ORG;
const GITHUB_PROJECT_ID: number = <number>_.toNumber(process.env.GITHUB_PROJECT_ID);
const GITHUB_PROJECT_STATUS: string = <string>process.env.GITHUB_PROJECT_STATUS;

export interface GITHUB_ISSUE_PROJECT_EST {
  name: string;
  value: number;
};

export interface GITHUB_ISSUE_LABEL {
  name: string;
  color: string;
};

export interface GITHUB_ISSUE {
  status?: string;                  // project status
  est?: GITHUB_ISSUE_PROJECT_EST[]  // project estimation
  num: number;                      // issue number
  title: string;                    // issue title
  body: string;                     // issue body
  labels?: GITHUB_ISSUE_LABEL[]     // issue lables
  url?: string;
  repoNameWithOwner?: string;
  author?: string;
  createdAt?: string;
};

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
const getProjectItems = async (orglogin: string, projectid: number): Promise<any> => {
  const STEP: number = 50;
  let total: number = 0;
  let issues: any = [];
  let hasNextPage: boolean = true;
  let afterCursor: string = '';

  try {
    while(hasNextPage) {
      const result = await graphqlClient(queryProjectItems(orglogin, projectid, afterCursor, STEP));
      const items: any = _.get(result, 'organization.projectV2.items');
      const pageInfo: any = items.pageInfo;
      total = <number>items.totalCount;
      afterCursor = pageInfo.endCursor;
      hasNextPage = pageInfo.hasNextPage
      issues = _.concat(issues, items.nodes);
    }
    // console.log(`[getIssues] total:${total}, issues count: ${_.size(issues)}`);
    
  } catch (error: any) {
    console.log('Request failed:', error.request); // { query, variables: {}, headers: { authorization: 'token secret123' } }
    console.log(error.message); // `invalid cursor` does not appear to be a valid cursor.
    console.log(error.data); // { repository: { name: 'probot', ref: null } }
  }
  return issues;
};

export const getProjectIssues = async (): Promise<GITHUB_ISSUE[]> => {
  const orglogin: string = GITHUB_ORG;
  // 19: dev-mercury
  // 39: dev-saturn
  const projectid: number = GITHUB_PROJECT_ID; 
  const status: string = GITHUB_PROJECT_STATUS;

  // const projects = await getProjects(orglogin);
  const items = await getProjectItems(orglogin, projectid);

  const issues: GITHUB_ISSUE[] = _.reduce(items, (result: GITHUB_ISSUE[], item) => {
    
    if (item.type === 'ISSUE' && item.fieldValueByName?.name === status) {
      const issue: GITHUB_ISSUE = {
        status: item.fieldValueByName?.name,
        est: _.reduce(item?.fieldValues?.nodes, (result: GITHUB_ISSUE_PROJECT_EST[], node) => {
          if (_.isNumber(node.number) && !_.isEmpty(node.field?.name)) {
            result.push({
              name: node.field.name,
              value: node.number
            });
          }
          return result;
        }, []),
        num: item.content?.number,
        title: item.content?.titleHTML,
        body: item.content?.bodyHTML,
        labels: item.content?.labels?.nodes,
        url: item.content?.url,
        repoNameWithOwner: item.content?.repository?.nameWithOwner,
        author: item.content?.author?.login,
        createdAt: item.content?.createdAt
      }
      result.push(issue);
    }
    return result;
  }, []);

  // console.log('[getProjectIssues] result:', issues);
  return issues;
};
