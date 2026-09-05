# One Folk Cafe - Desktop Admin Panel

A native Windows desktop application for managing One Folk Cafe operations locally without internet connectivity.

## Features

- **Fully Offline** - Runs entirely on your local machine with SQLite database
- **Native Windows App** - Built with Tauri v2 for small binary size (~15MB) and excellent performance
- **Complete Admin Panel** - Dashboard, Orders, Products, Analytics, Settings
- **Local Database** - SQLite with automatic migrations
- **Modern UI** - React 18 + TypeScript + Tailwind CSS + shadcn/ui components
- **Real-time Updates** - React Query for efficient data synchronization

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Tauri v2 (Rust), SQLite (sqlx), JWT Authentication
- **State Management**: Zustand, TanStack Query
- **Build**: MSI installer for Windows

## Prerequisites

- Node.js 18+
- Rust 1.70+ (install from https://rustup.rs/)
- Windows 10/11 (for building Windows app)

## Quick Start

### Development

```bash
# Navigate to desktop app directory
cd desktop-app

# Install dependencies
npm install

# Start development server with Tauri
npm run tauri:dev
```

### Building for Production

```bash
# Build the frontend and create Windows MSI installer
npm run tauri:build
```

The installer will be created in `src-tauri/target/release/bundle/msi/`.

## Project Structure

```
desktop-app/
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Base UI components (Button, Input, Card, etc.)
│   │   └── admin/         # Admin-specific components
│   ├── pages/             # Page components
│   │   └── admin/         # Admin pages (Dashboard, Orders, Products, etc.)
│   ├── lib/               # Utilities and API client
│   ├── store/             # Zustand stores (auth, dark mode)
│   ├── types/             # TypeScript types
│   └── hooks/             # Custom React hooks
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── commands/      # Tauri command handlers
│   │   ├── models/        # Data models
│   │   ├── database.rs    # Database connection
│   │   ├── auth.rs        # JWT authentication
│   │   └── error.rs       # Error handling
│   ├── migration/         # SQL migrations
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Database Schema

The app uses SQLite with the following main tables:

- `admins` - Admin users with bcrypt password hashing
- `categories` - Product categories
- `products` - Menu items with full/half plate pricing
- `customers` - Customer records
- `cafe_tables` - Table management
- `orders` - Order headers
- `order_items` - Order line items
- `settings` - Cafe configuration
- `notifications` - System notifications

## Default Login

- **Username**: `admin`
- **Password**: `admin123`

## Key Features

### Dashboard
- Real-time metrics (orders, revenue, customers)
- Top products & categories
- Recent orders overview
- Filterable by time period (daily/weekly/monthly/yearly)

### Orders Management
- Create, view, edit, delete orders
- Order status workflow (Pending → Preparing → Ready → Completed)
- Payment status tracking (Unpaid/Paid/Partial/Refunded)
- Table assignment and management
- Advanced filtering and pagination

### Products Management
- Full CRUD for products and categories
- Full plate / Half plate pricing
- Image upload support
- Availability toggles
- Category management with inline creation

### Analytics
- Revenue trends over time
- Top selling products & categories
- Sales reports with CSV export
- Average order value tracking

### Settings
- Cafe information (name, address, contact)
- Operating hours
- Branding (logo, banner)
- Notification preferences
- Password management
- Session settings

## Data Storage

All data is stored locally in:
- **Database**: `%APPDATA%/one-folk-cafe/cafe.db`
- **Images**: `%APPDATA%/one-folk-cafe/uploads/`
- **Settings**: `%APPDATA%/one-folk-cafe/store.json`

## Customization

### Adding New API Endpoints

1. Add Rust command in `src-tauri/src/commands/`
2. Register in `src-tauri/src/main.rs`
3. Add TypeScript types in `src/types/index.ts`
4. Add API function in `src/lib/api.ts`
5. Use in React components with `useQuery`/`useMutation`

### Database Migrations

Add new SQL migration files in `src-tauri/migration/` with incremental version numbers.

## Troubleshooting

### Database Issues
- Delete `%APPDATA%/one-folk-cafe/cafe.db` to reset database
- Check Tauri logs in `%APPDATA%/one-folk-cafe/logs/`

### Build Issues
- Ensure Rust toolchain is installed: `rustup default stable`
- Clear cache: `cargo clean` in `src-tauri/`
- Reinstall Node modules: `rm -rf node_modules && npm install`

## License

MIT License - Feel free to use for your cafe!