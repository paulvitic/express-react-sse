import s from 'shelljs';
const config = require('./tsconfig.json');
const outDir = config.compilerOptions.outDir;

s.rm('-rf', outDir);
s.mkdir(outDir);

s.cd('client');
s.exec('npm run build');
s.cd('..');

s.mkdir(`${outDir}/static`);
s.cp('-R', 'client/build/*', `${outDir}/static/`);
s.cp('-R', 'server/public/api-explorer', `${outDir}/static/api-explorer`);

s.cp('.env', `${outDir}/.env`);
s.mkdir('-p', `${outDir}/app/swagger`);
s.cp('server/app/api.yml', `${outDir}/app/api.yml`);
