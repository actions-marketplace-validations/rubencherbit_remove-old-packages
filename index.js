const github = require('@actions/github');
const core = require('@actions/core');
function arrayContainsMultipleValue(neededElements, array) {
    neededElements.forEach(needed => {
        if (array.includes(needed)) {
            return true;
        }
    });
    return false;
}

async function run() {
    // This should be a token with access to your repository scoped in as a secret.
    // The YML workflow will need to set myToken with the GitHub Secret Token
    // myToken: ${{ secrets.GITHUB_TOKEN }}
    // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
    const myToken = core.getInput('myToken');

    const octokit = github.getOctokit(myToken)

    // You can also pass in additional options as a second parameter to getOctokit
    // const octokit = github.getOctokit(myToken, {userAgent: "MyActionVersion1"});
    const nbToKeep = core.getInput('nbToKeep');
    const packagesToKeep = [];
    const tagsToKeep = core.getInput('tagsToKeep');
    const packageType = core.getInput('packageType');
    const packageName = core.getInput('packageName');
    const org = core.getInput('org');

    const packages = await octokit.rest.packages.getAllPackageVersionsForPackageOwnedByOrg({
        package_type: packageType,
        package_name: packageName,
        org: org,
    });
    let i = 0;
    Object.values(packages.data).forEach(package => {
        if (arrayContainsMultipleValue(tagsToKeep, package.metadata.container.tags) || i < nbToKeep) {
            packagesToKeep.push(package.id);
            if (!arrayContainsMultipleValue(tagsToKeep, package.metadata.container.tags))
                i++;
        }
    });

    Object.values(packages.data).forEach(package => {
        if (!packagesToKeep.includes(package.id)) {
            octokit.rest.packages.deletePackageVersionForOrg({
                package_type: packageType,
                package_name: packageName,
                org: org,
                package_version_id: package.id,
            });
        }
    });
}
run();