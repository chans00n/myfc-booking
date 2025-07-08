# Massage Therapy Booking System

A professional massage therapy booking and management system built with Next.js 14, TypeScript, Tailwind CSS, and Shadcn UI.

## Features

- **Client Booking System**: Easy-to-use interface for clients to book appointments
- **Admin Dashboard**: Comprehensive dashboard for managing appointments, clients, and services
- **Authentication**: Secure login system for administrators
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Built with Tailwind CSS and Shadcn UI components

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Icons**: Lucide React

## Project Structure

```
├── app/
│   ├── (auth)/         # Authentication pages (login, register)
│   ├── (booking)/      # Client booking flow
│   ├── (dashboard)/    # Admin dashboard pages
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/
│   ├── ui/            # Shadcn UI components
│   └── forms/         # Custom form components
├── lib/
│   └── utils.ts       # Utility functions
├── types/             # TypeScript type definitions
└── public/            # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd massage-booking
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:

- Database connection string
- Authentication secrets
- Email service credentials
- Optional: Payment gateway and other integrations

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Environment Variables

See `.env.example` for all required environment variables. Key variables include:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - Authentication secret key
- `SMTP_*` - Email service configuration

## Development

### Adding Shadcn UI Components

To add new Shadcn UI components:

```bash
npx shadcn@latest add <component-name>
```

### Code Style

This project uses ESLint and Prettier for code formatting. Run `npm run format` before committing changes.

## Deployment

The application can be deployed to any platform that supports Next.js applications:

- Vercel (recommended)
- Netlify
- AWS Amplify
- Self-hosted with Node.js

For production deployment:

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
npm run start
```

## License

[Your License]

## Contributing

[Your contributing guidelines]
