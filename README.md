# LastGenie - Ecommerce Website

A modern ecommerce platform for Genie sexual enhancer drinks, built with Next.js and Express.

## Project Structure

```
/
├── client/          # Next.js frontend (React, Tailwind, shadcn/ui)
├── server/          # Express backend (TypeScript, Prisma, PostgreSQL)
├── shared/          # Shared types and utilities
└── docs/            # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- SQLite (for development) or PostgreSQL (for production)

### Development Setup

1. **Clone and install dependencies:**
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies  
cd ../server
npm install
```

2. **Database setup:**
```bash
cd server
cp env.example .env
# Edit .env with your database URL and API keys
npx prisma migrate dev
npx prisma db seed
```

3. **Run development servers:**

**Option 1: Using root-level scripts (recommended)**
```bash
# Terminal 1: Start client (http://localhost:3000)
npm run dev:client

# Terminal 2: Start server (http://localhost:3001 or port from .env)
npm run dev:server

# Terminal 3: Start Prisma Studio (http://localhost:5555)
npm run db:studio
```

**Option 2: Direct commands**
```bash
# Terminal 1: Start client (http://localhost:3000)
cd client
npm install  # Only needed first time or after dependency changes
npm run dev

# Terminal 2: Start server (http://localhost:3001 or port from .env)
cd server
npm run dev

# Terminal 3: Start Prisma Studio (http://localhost:5555)
cd server
npm run db:studio
```

### Accessing the Application

- **Frontend**: Open your browser and navigate to [http://localhost:3000](http://localhost:3000)
- **Backend API**: Available at `http://localhost:3001` (or the port specified in your server `.env` file)
- **Prisma Studio**: Database GUI available at [http://localhost:5555](http://localhost:5555)

The Next.js development server includes:
- Hot module replacement (HMR) for instant updates
- Fast refresh for React components
- Error overlay in the browser
- TypeScript type checking

### Troubleshooting

**Port conflicts:**
- If port 3000 is already in use, Next.js will automatically try the next available port (3001, 3002, etc.) and display the actual URL in the terminal
- Check the terminal output for the exact URL where the server started

**Dependencies:**
- If you encounter module errors, ensure dependencies are installed: `npm install` in the respective directory (`client` or `server`)
- Use `npm run install:all` from the root to install dependencies for both client and server

**TypeScript/Compilation errors:**
- Check the terminal output for detailed error messages
- Ensure all TypeScript types are properly defined
- Verify that environment variables are set correctly (see `env.example` files)

**Prisma Studio port conflicts:**
- If port 5555 is already in use, you have two options:
  1. **Kill the existing process** (recommended if it's a leftover Prisma Studio instance):
     ```bash
     npm run db:studio:kill
     npm run db:studio
     ```
  2. **Use an alternative port**:
     ```bash
     npm run db:studio:alt  # Uses port 5556 instead
     ```
     Then access Prisma Studio at [http://localhost:5556](http://localhost:5556)
- You can also set a custom port using an environment variable:
  ```bash
  PRISMA_STUDIO_PORT=5557 npm run db:studio
  ```

## Key Features

- **Product Catalog**: Male and female sexual enhancer drinks (single bottles + 12-packs)
- **Subscribe & Save**: Recurring subscription model for 12-packs
- **Age Verification**: Third-party age verification via Veriff
- **Payment Processing**: Stripe integration for secure payments
- **Shipping**: Real-time rates via Shippo
- **Marketing**: Klaviyo email automation, Meta/TikTok pixels
- **Content**: Blog, testimonials, scientific information

## Tech Stack

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Zustand (state management)

### Backend
- Express.js
- TypeScript
- Prisma ORM
- SQLite (development) / PostgreSQL (production)
- Zod validation

### Integrations
- Stripe (payments)
- Veriff (age verification)
- Shippo (shipping rates)
- ShipStation (fulfillment)
- Klaviyo (email marketing)
- Meta/TikTok Conversion APIs

## Environment Variables

See `server/env.example` and `client/env.example` for required environment variables.

## Documentation

Comprehensive documentation is available in the `/docs` folder:
- Architecture overview
- API contracts
- Design system
- Security & authentication
- Testing strategy

## License

Private - All rights reserved