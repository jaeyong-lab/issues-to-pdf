import * as _ from 'lodash';
import { graphqlClient, queryProjects, queryProjectItems, queryProjectInfo } from './github-api';

const GITHUB_ORG: string = <string>process.env.GITHUB_ORG;
const GITHUB_PROJECT_ID: number = <number>_.toNumber(process.env.GITHUB_PROJECT_ID);
const GITHUB_PROJECT_STATUS: string = <string>process.env.GITHUB_PROJECT_STATUS;
const GITHUB_PROJECT_ITERATION: string = <string>process.env.GITHUB_PROJECT_ITERATION;

export interface GITHUB_PROJECT {
  id: string;
  number: number;
  title: string;
  createdAt: string;
  columns?: string[]; 
  iterations?: any;
}

export interface GITHUB_ISSUE_PROJECT_EST {
  name: string;
  value: number;
};

export interface GITHUB_ISSUE_PROJECT_ITERATION {
  name: string;
  title: string;
  startDate: string;
  duration: number;
}

export interface GITHUB_ISSUE_LABEL {
  name: string;
  color: string;
};

export interface GITHUB_ISSUE {
  status?: string;                  // project status
  est?: GITHUB_ISSUE_PROJECT_EST[]; // project estimation
  iterations?: GITHUB_ISSUE_PROJECT_ITERATION[];  // project iterations
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
    console.log('Request failed:', error.request);
    console.log(error.message);
    console.log(error.data);
  }

  return projects;
};

const getColumns = (): string[] => {
  return _.split(GITHUB_PROJECT_STATUS, ',').map((status) => _.trim(status));
}

// return format:  { "iteration name": "iteration title", ...  }
const getIterations = (): any => {
  let result;
  try {
    if (GITHUB_PROJECT_ITERATION) {
      result = JSON.parse(GITHUB_PROJECT_ITERATION);
    }
  } catch (error) {
    throw new Error('GITHUB_PROJECT_ITERATION is invalid format');
  }
  return result;
}

export const getProjectInfo =async (): Promise<GITHUB_PROJECT> => {
  const orglogin: string = GITHUB_ORG;
  const projectid: number = GITHUB_PROJECT_ID; 
  let project: GITHUB_PROJECT;

  try {
    const projectResult = await graphqlClient(queryProjectInfo(orglogin, projectid));
    project = {
      id: _.get(projectResult, 'organization.projectV2.id'),
      number: _.get(projectResult, 'organization.projectV2.number'),
      title: _.get(projectResult, 'organization.projectV2.title'),
      createdAt: _.get(projectResult, 'organization.projectV2.createdAt'),
      columns: getColumns(),
      iterations: getIterations()
    };

    return project;

  } catch (error: any) {
    console.log('\n[getProjectInfo] Request failed:', error.request);
    console.log(error.message);
    console.log(error.data);
  }
  return project!;
}

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
    console.log('[getProjectItems] Request failed:', error.request);
    console.log(error.message);
    console.log(error.data);
  }
  return issues;
};

const isDateInRange = (startDate: string, duration: number): boolean => {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + duration);
  const today = new Date();
  return today >= start && today <= end;
};

export const getProjectIssues = async (): Promise<GITHUB_ISSUE[]> => {
  const orglogin: string = GITHUB_ORG;
  const projectid: number = GITHUB_PROJECT_ID; 
  const FILTER_COLUMNS: string[] = getColumns();
  const FILTER_ITERATIONS: any = getIterations();

  const items = await getProjectItems(orglogin, projectid);

  // filter with status names
  let issues: GITHUB_ISSUE[] = _.reduce(items, (result: GITHUB_ISSUE[], item) => {
    
    if (item.type === 'ISSUE' && _.includes(FILTER_COLUMNS, item.fieldValueByName?.name)) {
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
        iterations: _.reduce(item?.fieldValues?.nodes, (result: GITHUB_ISSUE_PROJECT_ITERATION[], node) => {
          if (_.isNumber(node.duration) && !_.isEmpty(node.field?.name)) {
            result.push({
              name: node.field.name,
              title: node.title,
              startDate: node.startDate,
              duration: node.duration
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

  // filter with iteration name, title, and date range
  if (FILTER_ITERATIONS && !_.isEmpty(FILTER_ITERATIONS)) {
    issues = _.filter(issues, (issue: GITHUB_ISSUE) => {
      const result = _.find(issue.iterations, (item) => {
        const isCurrent = FILTER_ITERATIONS[item.name] === '@current';
        const matchesTitle = FILTER_ITERATIONS[item.name] === item.title;
        return matchesTitle || (isCurrent && isDateInRange(item.startDate, item.duration));
      });
      return !_.isNil(result);
    });
  }

  // console.log('[getProjectIssues] result:', issues);
  return issues;
};
