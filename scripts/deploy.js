/**
 * scripts/deploy.js
 * test -> bundle -> clasp push -> clasp deploy to the EXISTING deployment (Web App URL unchanged).
 *
 * Deployment ID: env CLASP_DEPLOYMENT_ID, or the only non-@HEAD deployment returned by `clasp deployments`.
 */

const { spawnSync } = require('child_process');

function run(cmd, args, opts, attempts) {
  const maxAttempts = attempts || 1;
  let res;
  for (let i = 1; i <= maxAttempts; i++) {
    res = spawnSync(cmd, args, Object.assign({ shell: true, encoding: 'utf8', stdio: 'inherit' }, opts));
    if (res.status === 0) return res;
    if (i < maxAttempts) console.error(`\nRetrying (${i}/${maxAttempts - 1}): ${cmd} ${args.join(' ')}`);
  }
  console.error(`\nFailed: ${cmd} ${args.join(' ')}`);
  process.exit(res.status || 1);
}

function resolveDeploymentId() {
  if (process.env.CLASP_DEPLOYMENT_ID) return process.env.CLASP_DEPLOYMENT_ID.trim();

  const res = spawnSync('npx', ['@google/clasp', 'deployments'], { shell: true, encoding: 'utf8' });
  if (res.status !== 0) {
    console.error(res.stdout || '', res.stderr || '');
    console.error('\nCannot list deployments. Run "npx @google/clasp login" first.');
    process.exit(res.status || 1);
  }

  const ids = (res.stdout || '')
    .split(/\r?\n/)
    .map(line => line.match(/^\s*-\s*(\S+)\s+@(\S+)/))
    .filter(m => m && m[2].toUpperCase() !== 'HEAD')
    .map(m => m[1]);

  if (ids.length !== 1) {
    console.error(`Found ${ids.length} versioned deployments. Set CLASP_DEPLOYMENT_ID to choose one:\n${res.stdout}`);
    process.exit(1);
  }
  return ids[0];
}

run('npm', ['test']);
run('npm', ['run', 'bundle']);
const deploymentId = resolveDeploymentId();
run('npx', ['@google/clasp', 'push', '-f'], undefined, 3);
run('npx', ['@google/clasp', 'deploy', '--deploymentId', deploymentId, '--description', `"auto ${new Date().toISOString()}"`], undefined, 3);
console.log(`\nDeployed to existing deployment ${deploymentId} (URL unchanged).`);
