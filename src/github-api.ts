import * as _ from 'lodash';
import * as dotenv from 'dotenv';
import { graphql } from '@octokit/graphql';
dotenv.config();

const GITHUB_TOKEN: string = <string>process.env.GITHUB_TOKEN;
export const graphqlClient: any = graphql.defaults({
  headers: {
    authorization: `token ${GITHUB_TOKEN}`,
  },
});


const QUERY_PROJECTS = `
  query ($orglogin: String!, $after: String!, $first: Int!) {
    organization(login: $orglogin) {
      projectsV2 (after: $after, first: $first) {
        totalCount
        nodes {
          id
          number
          title
          shortDescription
          url
          updatedAt
          closed
        }
        pageInfo {
          startCursor
          endCursor
          hasPreviousPage
          hasNextPage
        }
      }
      projectsUrl
    }
  }
`;

export const queryProjects = (orglogin: string, after: string, first: number) => {
  return {
    query: QUERY_PROJECTS,
    orglogin: orglogin,
    after: after,
    first: first
  }
};

const QUERY_PROJECT_INFO = `
  query ($orglogin: String!, $projectid: Int!, ) {
    organization(login: $orglogin) {
      projectV2 (number: $projectid) {
        id
        number
        title
        closed
        createdAt
        fields (last: 50) {
          totalCount
          nodes {
            ... on ProjectV2SingleSelectField {
              name
              options {
                name
              }
            }
          }
        }
      }
    }
  }
`;

export const queryProjectInfo = (orglogin: string, projectid: number) => {
  return {
    query: QUERY_PROJECT_INFO,
    orglogin: orglogin,
    projectid: projectid
  }
};


const QUERY_PROJECT_ITEMS = `
  query ($orglogin: String!, $projectid: Int!, $after: String!, $first: Int!) {
    organization(login: $orglogin) {
      projectV2 (number: $projectid) {
        id
        number
        title
        createdAt
        items(after: $after, first: $first) {
          totalCount
          pageInfo {
            startCursor
            endCursor
            hasPreviousPage
            hasNextPage
          }
          nodes{
            id
            type
            fieldValueByName(name: "Status") {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
              }
            }
            fieldValues(last: 20) {
              nodes {
                ... on ProjectV2ItemFieldNumberValue {
                  field {
                    ... on ProjectV2Field {
                      name
                    }
                  }
                  number
                }
                ... on ProjectV2ItemFieldIterationValue {
                  title
                  startDate
                  duration
                  field {
                  ... on ProjectV2IterationField {
                      name
                    }
                  }
                }
              }
            }
            content{
              ...on Issue {
                repository {
                  nameWithOwner
                }
                author {
                  login
                }
                number
                titleHTML
                bodyHTML
                url
                createdAt
                labels(last: 10) {
                  nodes {
                    name
                    color
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const queryProjectItems = (orglogin: string, projectid: number, after: string, first: number) => {
  return {
    query: QUERY_PROJECT_ITEMS,
    orglogin: orglogin,
    projectid: projectid,
    after: after,
    first: first
  }
};
