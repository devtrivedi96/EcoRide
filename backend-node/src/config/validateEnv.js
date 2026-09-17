const Joi = require('joi');

const schema = Joi.object({
  NODE_ENV:   Joi.string().valid('development', 'production', 'test').default('development'),
  PORT:       Joi.number().port().default(8081),
  LOG_LEVEL:  Joi.string().valid('error','warn','info','http','verbose','debug','silly').default('info'),

  // Firebase — one of the two credential modes is required
  FIREBASE_SERVICE_ACCOUNT_PATH: Joi.string().optional(),
  FIREBASE_PROJECT_ID:    Joi.string().when('FIREBASE_SERVICE_ACCOUNT_PATH', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
  FIREBASE_CLIENT_EMAIL:  Joi.string().email().when('FIREBASE_SERVICE_ACCOUNT_PATH', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
  FIREBASE_PRIVATE_KEY:   Joi.string().when('FIREBASE_SERVICE_ACCOUNT_PATH', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),

  // JWT
  JWT_SECRET:     Joi.string().min(32).required().messages({ 'string.min': 'JWT_SECRET must be at least 32 characters' }),
  JWT_EXPIRATION: Joi.number().default(86400000),

  // Razorpay
  RAZORPAY_KEY_ID:     Joi.string().required(),
  RAZORPAY_KEY_SECRET: Joi.string().required(),

  // CORS
  CORS_ORIGIN: Joi.string().default('*'),
}).unknown(true);

function validateEnv() {
  const { error } = schema.validate(process.env, { abortEarly: false });
  if (error) {
    const details = error.details.map(d => `  ❌  ${d.message}`).join('\n');
    console.error(`\n🚨  Invalid environment configuration:\n${details}\n`);
    process.exit(1);
  }
}

module.exports = { validateEnv };
