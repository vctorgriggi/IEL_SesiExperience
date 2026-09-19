import { execSync } from 'child_process';

function checkBunVersion() {
  const requiredBunVersion = '>=1.2.4';
  const currentBunVersion = execSync('bun --version').toString().trim();
  const [major, minor] = currentBunVersion.split('.').map(Number);

  if (!currentBunVersion) {
    console.error(
      `\x1b[31m%s\x1b[0m`,
      `Você está executando a aplicação de uma pasta que não possui o bun instalado. Por favor, instale o bun e execute "bun install" no diretório do seu projeto.`,
    );

    process.exit(1);
  }

  if (major < 1) {
    console.error(
      `\x1b[31m%s\x1b[0m`,
      `Você está executando bun ${currentBunVersion}. A aplicação requer bun ${requiredBunVersion}.`,
    );

    process.exit(1);
  }

  if (major === 1 && minor < 2) {
    console.warn(
      `\x1b[33m%s\x1b[0m`,
      `Você está executando bun ${currentBunVersion}. A recomendação é bun 1.2.4 ou superior.`,
    );
  } else {
    console.log(
      `\x1b[32m%s\x1b[0m`,
      `Você está executando bun ${currentBunVersion}.`,
    );
  }
}

function checkNodeVersion() {
  const requiredNodeVersion = '>=v20';
  const currentNodeVersion = process.versions.node;
  const [major] = currentNodeVersion.split('.').map(Number);

  if (major < 20) {
    console.error(
      `\x1b[31m%s\x1b[0m`,
      `Você está executando Node ${currentNodeVersion}. A aplicação requer Node ${requiredNodeVersion}.`,
    );

    process.exit(1);
  } else {
    console.log(
      `\x1b[32m%s\x1b[0m`,
      `Você está executando Node ${currentNodeVersion}.`,
    );
  }
}

function checkPathNotOneDrive() {
  const path = process.cwd();

  if (path.includes('OneDrive')) {
    console.error(
      `\x1b[31m%s\x1b[0m`,
      `Você está executando a aplicação do OneDrive. Por favor, mova seu projeto para uma pasta local.`,
    );

    process.exit(1);
  }
}

function checkRequirements() {
  checkNodeVersion();
  checkPathNotOneDrive();
  checkBunVersion();
}

void checkRequirements();
