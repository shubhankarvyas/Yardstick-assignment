# Multi-Tenant SaaS Notes Application

A secure, multi-tenant SaaS application for managing notes with role-based access control and subscription feature gating.

## Architecture

### Multi-Tenancy Approach

This application uses a **shared schema with tenant ID** approach for multi-tenancy:

- **Single Database**: All tenants share the same database instance
- **Tenant Isolation**: Every table includes a `tenantId` column for strict data isolation
- **Benefits**: 
  - Cost-effective resource utilization
  - Easier maintenance and upgrades
  - Simplified backup and monitoring
- **Security**: Row-level security through application-level tenant filtering

### Database Schema

```sql
-- Tenants table
tenants {
  id: String (Primary Key)
  slug: String (Unique) -- e.g., "acme", "globex"
  name: String -- e.g., "Acme Corporation"
  subscriptionPlan: Enum (FREE, PRO)
  createdAt: DateTime
  updatedAt: DateTime
}

-- Users table
users {
  id: String (Primary Key)
  email: String
  password: String (bcrypt hashed)
  role: Enum (ADMIN, MEMBER)
  tenantId: String (Foreign Key)
  createdAt: DateTime
  updatedAt: DateTime
  
  UNIQUE(email, tenantId) -- Email unique per tenant
}

-- Notes table
notes {
  id: String (Primary Key)
  title: String
  content: String
  userId: String (Foreign Key)
  tenantId: String (Foreign Key, denormalized)
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Features

### Authentication & Authorization

- **JWT-based authentication** with 7-day token expiry
- **Role-based access control**:
  - **Admin**: Can invite users, upgrade subscriptions, manage all notes
  - **Member**: Can only create, view, edit, and delete their own notes
- **Tenant isolation**: Users can only access data from their own tenant

### Subscription Feature Gating

- **Free Plan**: Limited to 3 notes maximum
- **Pro Plan**: Unlimited notes
- **Upgrade functionality**: Admin users can upgrade their tenant to Pro plan
- **Real-time enforcement**: Note limits are checked on creation

### Notes Management

Complete CRUD operations with proper access control:
- **Create**: POST /api/notes
- **Read All**: GET /api/notes
- **Read One**: GET /api/notes/:id
- **Update**: PUT /api/notes/:id
- **Delete**: DELETE /api/notes/:id

## API Documentation

### Authentication

#### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "admin@acme.test",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "admin@acme.test",
    "role": "ADMIN",
    "tenant": {
      "id": "tenant_id",
      "slug": "acme",
      "name": "Acme Corporation",
      "subscriptionPlan": "FREE"
    }
  }
}
```

### Notes API

All endpoints require `Authorization: Bearer <token>` header.

#### POST /api/notes
Create a new note.

**Request:**
```json
{
  "title": "My Note",
  "content": "Note content here"
}
```

#### GET /api/notes
List all notes for the current tenant.

#### GET /api/notes/:id
Get a specific note.

#### PUT /api/notes/:id
Update a note (owner or admin only).

#### DELETE /api/notes/:id
Delete a note (owner or admin only).

### Tenant Management

#### POST /api/tenants/:slug/upgrade
Upgrade tenant to Pro plan (Admin only).

### Health Check

#### GET /api/health
Returns `{"status": "ok"}` for monitoring.

## Test Accounts

All test accounts use password: `password`

| Email | Role | Tenant | Subscription |
|-------|------|---------|-------------|
| admin@acme.test | Admin | Acme | Free |
| user@acme.test | Member | Acme | Free |
| admin@globex.test | Admin | Globex | Free |
| user@globex.test | Member | Globex | Free |

## Local Development

### Prerequisites

- Node.js 18+ 
- npm

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with:
   ```
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-super-secure-jwt-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret-key"
   ```

4. Set up the database:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel Deployment

1. Fork this repository
2. Connect your GitHub repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`: SQLite file URL (Vercel will handle this)
   - `JWT_SECRET`: Secure random string
   - `NEXTAUTH_URL`: Your deployed app URL
   - `NEXTAUTH_SECRET`: Secure random string

4. Deploy - Vercel will automatically:
   - Install dependencies
   - Generate Prisma client
   - Set up the database
   - Seed test data
   - Build and deploy the application

### Manual Deployment

```bash
npm run vercel-build
npm start
```

## Security Features

### Tenant Isolation

- **Database Level**: All queries include tenant ID filtering
- **API Level**: Authentication middleware extracts and validates tenant context
- **Frontend Level**: User can only see their tenant's data

### Authentication Security

- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: Signed tokens with expiration
- **CORS Configuration**: Properly configured for cross-origin requests

### Authorization

- **Route Protection**: All API routes require valid JWT
- **Role Checking**: Admin-only operations are properly guarded
- **Resource Ownership**: Users can only modify their own notes (unless admin)

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT tokens
- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Architecture Decisions

### Why Shared Schema with Tenant ID?

1. **Cost Efficiency**: Single database instance reduces operational costs
2. **Maintenance**: Easier to apply schema changes and updates
3. **Resource Utilization**: Better resource sharing and efficiency
4. **Backup & Recovery**: Simplified data management
5. **Scalability**: Can handle many tenants with proper indexing

### Why SQLite?

1. **Vercel Compatibility**: Works seamlessly with Vercel's file system
2. **Development Simplicity**: No external database setup required
3. **Performance**: Excellent for small to medium workloads
4. **Zero Configuration**: Ready to deploy without database provisioning

### Why JWT for Authentication?

1. **Stateless**: No server-side session storage required
2. **Scalability**: Works well with serverless deployments
3. **Flexibility**: Can include custom claims (tenant info, roles)
4. **Standards Compliant**: Industry standard approach

## Testing

The application can be tested using the provided test accounts. All functionality including tenant isolation, role-based access, and subscription limits can be verified through the web interface or direct API calls.

### Automated Testing Scenarios

1. **Health Check**: `GET /api/health` returns `{"status": "ok"}`
2. **Authentication**: All test accounts can successfully log in
3. **Tenant Isolation**: Users can only see notes from their tenant
4. **Role Restrictions**: Members cannot access admin functionality
5. **Subscription Limits**: Free plan enforces 3-note limit
6. **Upgrade Functionality**: Admin can upgrade tenant to Pro plan
7. **CRUD Operations**: All note operations work correctly with proper permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
