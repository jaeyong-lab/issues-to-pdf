# issues-to-pdf
: Github의 Project에서 사용자가 선택한 Status 필드의 모든 issue를 출력물 형태로 제공


### Prerequisites
- GitHub GraphQL API
  - [docs](https://docs.github.com/ko/graphql)
  - [apis exploerer](https://docs.github.com/ko/graphql/overview/explorer)
  - [graphql client](https://github.com/octokit/graphql.js)
  - [manage projects apis](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects)
  - [understand projects fields](https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-text-and-number-fields)


- Github Token
  - [create personal access token](https://docs.github.com/ko/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
  - permission
    - `repo: all`
    - `admin:org : read:org`
    - `project: all`


    > GraphQL API에 인증하려면 personal access token (classic), GitHub App 또는 OAuth App을 만들어야 합니다. GraphQL API는 fine-grained personal access tokens의 인증을 지원하지 않습니다.

- [pnpm](https://pnpm.io/): node package manager

### Development
: set github token in `.env`

- `.env`
  - create
  ```bash
  touch .env
  ```
  
  - set github env values
  ```yml
  GITHUB_TOKEN={my github token}
  GITHUB_ORG={my organization}
  GITHUB_PROJECT_ID={target project id}
  ```

- Installation
  ```bash
  $ pnpm install
  ```
- Run
  ```bash
  $ pnpm start  
  ```

### Test
- [VSCode REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
- apis test file: `test/github-graphql.rest`



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.


<!-- CONTACT -->
## Contact

jaeyong - bluette7@gmail.com