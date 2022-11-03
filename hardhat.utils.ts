import fs from 'fs';
import path from 'path';
import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import { additions } from './abi-additions';

/**
 * Overwrites build artifacts to inject generated bytecode
 *
 * @param hre - hardhat runtime environment
 * @param contractName - contract name to overwrite
 * @param bytecode - bytecode to inject
 * @returns promise for completion
 */
async function overwriteArtifact(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  bytecode: string,
): Promise<void> {
  const artifact = await hre.artifacts.readArtifact(contractName);
  artifact.bytecode = bytecode;
  await hre.artifacts.saveArtifactAndDebugFile(artifact);
}

/**
 * Exports ABIs to file
 *
 * @param hre - hardhat runtime environment
 * @param contracts - contracts to export abis for
 * @returns promise for completion
 */
async function exportABIs(hre: HardhatRuntimeEnvironment, contracts: string[]): Promise<void> {
  // Get output directory and ensure it exists
  const outputDirectory = path.resolve(hre.config.paths.root, './abi-exports');
  if (!fs.existsSync(outputDirectory)) fs.mkdirSync(outputDirectory);

  // Loop through each artifact we need to export
  await Promise.all(
    contracts.map(async (contractName) => {
      // Get the artifact
      const artifact = await hre.artifacts.readArtifact(contractName);

      // Get the ABI
      let abi = artifact.abi;

      // Check if we have any ABI merging to do
      if (Array.isArray(additions[artifact.contractName])) {
        abi = abi.concat(additions[artifact.contractName]);
      }

      if (Array.isArray(additions[`${artifact.sourceName}:${artifact.contractName}`])) {
        abi = abi.concat(additions[`${artifact.sourceName}:${artifact.contractName}`]);
      }

      // Write to destination
      const destination = path.resolve(outputDirectory, artifact.contractName) + '.json';
      await fs.promises.mkdir(path.dirname(destination), { recursive: true });
      await fs.promises.writeFile(destination, `${JSON.stringify(abi, null, 2)}\n`, { flag: 'w' });
    }),
  );
}

/**
 * Deletes exported ABIs folder
 *
 * @param hre - hardhat runtime environment
 * @returns promise for completion
 */
function cleanExportedAbis(hre: HardhatRuntimeEnvironment) {
  const outputDirectory = path.resolve(hre.config.paths.root, './abi-exports');
  if (!fs.existsSync(outputDirectory)) return null;
  fs.rmSync(outputDirectory, { recursive: true, force: true });
  return null;
}

export { overwriteArtifact, exportABIs, cleanExportedAbis };