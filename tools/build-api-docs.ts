(function () {
  const { readFileSync, readdirSync } = require('fs');

  const getDirectories = (source) =>
    readdirSync(source, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

  getDirectories('./packages').forEach((s) => generateDocs('packages', s));
  getDirectories('./modules').forEach((s) => generateDocs('modules', s));
})();

function generateDocs(prefix: string, name: string) {
  const { exec, echo } = require('shelljs');

  echo('Building docs for', name);
  exec(`mkdir docs/${prefix}/${name}`);
  exec(`rimraf docs/${prefix}/${name}/api`);
  exec(`mkdir docs/${prefix}/${name}/api`);
  exec(`typedoc --out docs/${prefix}/${name}/api --name @uprtcl/${name}`);
  exec(`mv docs/.vuepress/api-sidebar.json docs/${prefix}/${name}/api/sidebar.json`);
}
