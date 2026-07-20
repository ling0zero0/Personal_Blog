import { access, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import projectContract from '../src/config/project-contract.json' with { type: 'json' };

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectsDir = path.join(rootDir, 'src', 'content', 'projects');
const manifestName = 'project.json';
const imageWidth = 1600;
const imageHeight = 1200;
const imageQuality = 84;
const localizedFields = projectContract.localizedFields;
const slugPattern = new RegExp(projectContract.slugPattern);
const yearPattern = new RegExp(projectContract.yearPattern);
const colorPattern = new RegExp(projectContract.colorPattern);
const manifestImagePattern = new RegExp(projectContract.manifestImagePattern, 'i');

function usage() {
  console.log(`
Add a project:
  npm run project:add -- --input <intake.json> --images <image-directory>

Options:
  --position <number>  Override the insertion position from the intake file.
  --dry-run            Validate data and source images without writing files.
  --check              Validate every existing project manifest and image.
  --help               Show this message.
`);
}

function parseArgs(argv) {
  const options = { dryRun: false, check: false };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--dry-run') options.dryRun = true;
    else if (argument === '--check') options.check = true;
    else if (argument === '--help') options.help = true;
    else if (argument === '--input') options.input = argv[++index];
    else if (argument === '--images') options.images = argv[++index];
    else if (argument === '--position') options.position = Number(argv[++index]);
    else throw new Error(`Unknown option: ${argument}`);
  }

  return options;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertKnownKeys(value, allowedKeys, context) {
  const unknown = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  assert(unknown.length === 0, `${context} contains unknown field${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}`);
}

function validateLocalized(value, field) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${field} must contain zh and en text.`);
  assertKnownKeys(value, projectContract.localizedKeys, field);
  assert(typeof value.zh === 'string' && value.zh.trim(), `${field}.zh is required.`);
  assert(typeof value.en === 'string' && value.en.trim(), `${field}.en is required.`);
}

function validateCore(project) {
  assert(project && typeof project === 'object' && !Array.isArray(project), 'The intake file must contain a JSON object.');
  assert(typeof project.slug === 'string' && slugPattern.test(project.slug), 'slug must use lowercase kebab-case.');
  assert(typeof project.year === 'string' && yearPattern.test(project.year), 'year must be a four-digit string.');
  assert(typeof project.color === 'string' && colorPattern.test(project.color), 'color must be a six-digit hex value.');
  assert(Array.isArray(project.tags) && project.tags.length > 0, 'tags must contain at least one item.');
  assert(project.tags.every((tag) => typeof tag === 'string' && tag.trim()), 'Every tag must be a non-empty string.');
  for (const field of localizedFields) validateLocalized(project[field], field);
  if (project.linkLabel !== undefined) validateLocalized(project.linkLabel, 'linkLabel');

  assert(typeof project.href === 'string', 'href is required.');
  const href = new URL(project.href);
  assert(projectContract.allowedLinkProtocols.includes(href.protocol), 'href must use http or https.');
}

function validateIntake(project) {
  assertKnownKeys(project, projectContract.intakeFields, 'The intake file');
  validateCore(project);
  if (project.position !== undefined) {
    assert(Number.isInteger(project.position) && project.position > 0, 'position must be a positive integer.');
  }

  const images = project.images ?? [];
  assert(Array.isArray(images), 'images must be an array.');
  for (const [index, image] of images.entries()) {
    assert(image && typeof image === 'object', `images[${index}] must be an object.`);
    assertKnownKeys(image, projectContract.intakeImageFields, `images[${index}]`);
    assert(typeof image.file === 'string' && image.file.trim(), `images[${index}].file is required.`);
    assert(!path.isAbsolute(image.file) && !image.file.split(/[\\/]/).includes('..'), `images[${index}].file must stay inside the image directory.`);
    validateLocalized(image.alt, `images[${index}].alt`);
  }
}

function validateManifest(project) {
  assertKnownKeys(project, projectContract.manifestFields, 'The project manifest');
  validateCore(project);
  assert(Number.isInteger(project.order) && project.order > 0, 'order must be a positive integer.');
  assert(Array.isArray(project.images), 'images must be an array.');

  for (const [index, image] of project.images.entries()) {
    assert(image && typeof image === 'object', `images[${index}] must be an object.`);
    assertKnownKeys(image, projectContract.manifestImageFields, `images[${index}]`);
    assert(typeof image.src === 'string' && manifestImagePattern.test(image.src), `images[${index}].src must reference a local WebP file.`);
    validateLocalized(image.alt, `images[${index}].alt`);
  }
}

async function readJson(filePath) {
  const source = (await readFile(filePath, 'utf8')).replace(/^\uFEFF/, '');
  return JSON.parse(source);
}

async function writeJson(filePath, data) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readExistingProjects() {
  await mkdir(projectsDir, { recursive: true });
  const directories = await readdir(projectsDir, { withFileTypes: true });
  const projects = [];

  for (const directory of directories) {
    if (!directory.isDirectory() || directory.name.startsWith('.')) continue;
    const manifestPath = path.join(projectsDir, directory.name, manifestName);
    if (!(await pathExists(manifestPath))) continue;
    const data = await readJson(manifestPath);
    validateManifest(data);
    projects.push({
      directory: directory.name,
      manifestPath,
      original: await readFile(manifestPath, 'utf8'),
      data,
    });
  }

  return projects.toSorted((left, right) => left.data.order - right.data.order);
}

function resolveSourceImage(imageDirectory, imageFile) {
  const sourceRoot = path.resolve(imageDirectory);
  const sourcePath = path.resolve(sourceRoot, imageFile);
  const relative = path.relative(sourceRoot, sourcePath);
  assert(relative && !relative.startsWith('..') && !path.isAbsolute(relative), `Image path escapes the source directory: ${imageFile}`);
  return sourcePath;
}

function outputImageName(index) {
  return index === 0 ? 'poster.webp' : `gallery-${String(index + 1).padStart(2, '0')}.webp`;
}

async function inspectSourceImages(images, imageDirectory) {
  const inspected = [];

  for (const [index, image] of images.entries()) {
    const sourcePath = resolveSourceImage(imageDirectory, image.file);
    const metadata = await sharp(sourcePath).metadata();
    assert(metadata.width && metadata.height, `Cannot read image dimensions: ${image.file}`);
    const ratio = metadata.width / metadata.height;
    inspected.push({ ...image, sourcePath, output: outputImageName(index), metadata });
    if (Math.abs(ratio - 4 / 3) > 0.03) {
      console.warn(`Warning: ${image.file} is ${metadata.width}x${metadata.height}; 4:3 is recommended.`);
    }
  }

  return inspected;
}

async function checkProjects() {
  const projects = await readExistingProjects();
  assert(projects.length > 0, 'No project manifests found.');

  const slugs = new Set();
  for (const [index, project] of projects.entries()) {
    assert(project.data.slug === project.directory, `${project.directory}: folder name and slug must match.`);
    assert(!slugs.has(project.data.slug), `Duplicate slug: ${project.data.slug}`);
    assert(project.data.order === index + 1, `${project.data.slug}: expected order ${index + 1}, found ${project.data.order}.`);
    slugs.add(project.data.slug);

    for (const [imageIndex, image] of project.data.images.entries()) {
      const expectedName = outputImageName(imageIndex);
      assert(image.src === `./${expectedName}`, `${project.data.slug}: image ${imageIndex + 1} must be named ${expectedName}.`);
      const imagePath = path.join(path.dirname(project.manifestPath), expectedName);
      const metadata = await sharp(imagePath).metadata();
      assert(metadata.format === 'webp', `${project.data.slug}/${expectedName} must be WebP.`);
      assert(metadata.width && metadata.height, `${project.data.slug}/${expectedName} has no readable dimensions.`);
    }
  }

  console.log(`Validated ${projects.length} project manifests.`);
}

async function addProject(options) {
  assert(options.input, '--input is required.');
  const inputPath = path.resolve(options.input);
  const intake = await readJson(inputPath);
  validateIntake(intake);

  const existing = await readExistingProjects();
  assert(!existing.some((project) => project.data.slug === intake.slug), `Project already exists: ${intake.slug}`);

  const position = options.position ?? intake.position ?? existing.length + 1;
  assert(Number.isInteger(position) && position >= 1 && position <= existing.length + 1, `position must be between 1 and ${existing.length + 1}.`);

  const images = intake.images ?? [];
  if (images.length > 0) assert(options.images, '--images is required when the intake contains images.');
  const inspectedImages = images.length > 0 ? await inspectSourceImages(images, options.images) : [];

  console.log(`Project: ${intake.title.en} (${intake.slug})`);
  console.log(`Position: ${position} of ${existing.length + 1}`);
  console.log(`Images: ${inspectedImages.length}`);
  if (options.dryRun) {
    console.log('Dry run completed. No files were written.');
    return;
  }

  const destination = path.join(projectsDir, intake.slug);
  const temporary = path.join(projectsDir, `.${intake.slug}-${process.pid}`);
  assert(!(await pathExists(destination)), `Destination already exists: ${destination}`);
  await rm(temporary, { recursive: true, force: true });
  await mkdir(temporary, { recursive: true });

  const finalImages = [];
  let destinationCreated = false;

  try {
    for (const image of inspectedImages) {
      await sharp(image.sourcePath)
        .rotate()
        .resize({ width: imageWidth, height: imageHeight, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: imageQuality, effort: 5 })
        .toFile(path.join(temporary, image.output));
      finalImages.push({ src: `./${image.output}`, alt: image.alt });
    }

    const { position: _position, images: _images, ...projectData } = intake;
    const manifest = { ...projectData, order: position, images: finalImages };
    await writeJson(path.join(temporary, manifestName), manifest);
    await rename(temporary, destination);
    destinationCreated = true;

    const ordered = [...existing];
    ordered.splice(position - 1, 0, {
      directory: intake.slug,
      manifestPath: path.join(destination, manifestName),
      data: manifest,
    });

    for (const [index, project] of ordered.entries()) {
      project.data.order = index + 1;
      await writeJson(project.manifestPath, project.data);
    }
  } catch (error) {
    for (const project of existing) await writeFile(project.manifestPath, project.original, 'utf8');
    if (destinationCreated) await rm(destination, { recursive: true, force: true });
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }

  console.log(`Added ${intake.slug} to ${path.relative(rootDir, destination)}.`);
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) usage();
  else if (options.check) await checkProjects();
  else await addProject(options);
} catch (error) {
  console.error(`Project command failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
