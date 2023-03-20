"use strict";
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
}

const QUERY_PROJECT_ISSUES = `
  query ($orglogin: String!, $projectnum: Int!, $after: String!, $first: Int!) {
    organization(login: $orglogin) {
      projectV2 (number: $projectnum) {
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
            fieldValues(last: 10) {
              nodes {
                ... on ProjectV2ItemFieldLabelValue {
                  labels(last: 10) {
                    nodes {
                      name
                      color
                    }
                  }
                }
                ... on ProjectV2ItemFieldNumberValue {
                  field {
                    ... on ProjectV2Field {
                      name
                    }
                  }
                  number
                }
              }
            }
            content{              
              ... on DraftIssue {
                title
                body
              }
              ...on Issue {
                title
                url
              }
            }
          }
        }
      }
    }
  }
`;

export const queryProjectIssues = (orglogin: string, projectnum: number, after: string, first: number) => {
  return {
    query: QUERY_PROJECT_ISSUES,
    orglogin: orglogin,
    projectnum: projectnum,
    after: after,
    first: first
  }
}
