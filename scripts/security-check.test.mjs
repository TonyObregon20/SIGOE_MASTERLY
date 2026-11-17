import test from 'node:test';
import assert from 'node:assert/strict';
import { scanText } from './security-check.mjs';
import { randomBytes } from 'node:crypto';

process.env.DOTENV_CONFIG_QUIET = 'true';
process.env.JWT_SECRET = randomBytes(32).toString('hex');
process.env.BOOTSTRAP_ADMIN_EMAIL = '';
process.env.BOOTSTRAP_ADMIN_PASSWORD = '';
const auth = await import('../backend/utils/authUtils.js');
const { login, createUser } = await import('../backend/controllers/authController.js');
const { default: UserModel } = await import('../backend/models/User.js');

test('detecta credenciales sin revelar su valor', () => {
  const credential = ['mongodb+srv://', 'example:private-value', '@example.invalid/test'].join('');
  const findings = scanText('config.js', `// config\nconst uri = "${credential}";`);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].line, 2);
  assert.equal(JSON.stringify(findings).includes('private-value'), false);
});

test('detecta claves privadas, tokens y secretos literales', () => {
  const examples = [
    ['-----BEGIN ', 'PRIVATE KEY-----'].join(''),
    'ghp_' + 'a'.repeat(36),
    ['JWT_SECRET', ' = ', '"', 'x'.repeat(40), '"'].join(''),
  ];
  for (const example of examples) assert.ok(scanText('config.js', example).length);
});

test('rechaza entornos privados y permite plantillas vacías', () => {
  assert.equal(scanText('backend/.env.production', '').length, 1);
  assert.equal(scanText('backend/.env.example', 'MONGODB_URI=\nJWT_SECRET=').length, 0);
  assert.equal(scanText('config.js', 'const secret = process.env.JWT_SECRET;').length, 0);
});

test('firma tokens, rechaza tokens inválidos y verifica contraseñas', async () => {
  const user = { id: 'test-only', email: 'test@example.invalid', role: 'customer' };
  assert.equal(auth.verifyJwtToken(auth.generateToken(user)).id, user.id);
  assert.equal(auth.verifyJwtToken('invalid'), null);
  const password = randomBytes(20).toString('hex');
  const hash = await auth.hashPassword(password);
  assert.equal(await auth.comparePassword(password, hash), true);
  assert.equal(await auth.comparePassword('incorrect', hash), false);
});

test('credenciales predeterminadas no crean ni recuperan usuarios; crear exige contraseña', async () => {
  const originals = { findOne: UserModel.findOne, create: UserModel.create, findOneAndUpdate: UserModel.findOneAndUpdate };
  const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
  const fail = err => { throw err; };
  try {
    UserModel.create = UserModel.findOneAndUpdate = () => { throw new Error('No debe escribir datos'); };
    UserModel.findOne = async () => null;
    const missing = response();
    const credentials = { email: ['admin', '@masterly.com'].join(''), password: ['ad', 'min'].join('') };
    await login({ body: credentials }, missing, fail);
    assert.equal(missing.code, 401);
    UserModel.findOne = async () => ({ id: 'test-only', password: 'different-value', isActive: true });
    const existing = response();
    await login({ body: credentials }, existing, fail);
    assert.equal(existing.code, 401);
    UserModel.findOne = async () => null;
    const creation = response();
    await createUser({ body: { email: 'test@example.invalid' } }, creation, fail);
    assert.equal(creation.code, 400);
  } finally {
    Object.assign(UserModel, originals);
  }
});
