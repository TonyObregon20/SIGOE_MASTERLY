# Project Context & Rules

## Database Configuration
- **Database Engine**: MongoDB Atlas via Mongoose.
- **Connection URI**: Provided through the local `MONGODB_URI` environment variable, targeting database `test`. Never commit credentials.
- **Schema Strictness**: Mongoose schemas use `{ strict: false }` and `mongoose.Schema.Types.Mixed` for dynamic arrays (`items`, `stages`, `installments`) to prevent strict validation filters from hiding or stripping custom fields present in MongoDB collection documents (e.g. `invoices`, `orders`, `productionorders`).
- **Initial Seeding**: Automatic mock seeding is disabled for user data collections to ensure real database records from MongoDB Atlas are directly served to the application.
