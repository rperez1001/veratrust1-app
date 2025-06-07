# VeraTrust - Verified Dating App

A modern dating app built with trust and verification at its core. Connect with genuine people who share your values.

## Features

- 🔒 Multi-layer verification (ID, Photo, Video)
- 💯 Trust Score System
- 💝 Swipe-based Match Discovery
- 💬 Real-time Chat
- 🎯 Smart Match Filtering
- 🎉 Match Milestones
- 👮‍♂️ Admin Dashboard
- 🛡️ Comprehensive Security

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Real-time**: Supabase Realtime
- **UI Components**: Radix UI
- **Deployment**: Vercel/Netlify

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git

## Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/veratrust.git
   cd veratrust
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_SYSTEM_USER_ID=your_system_user_id
   ```

4. Set up Supabase:
   - Create a new Supabase project
   - Run migrations from `supabase/migrations`
   - Enable required extensions (PostGIS, etc.)
   - Set up storage buckets with proper policies

5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Netlify Deployment

1. Push your code to GitHub
2. Import project in Netlify
3. Add environment variables
4. Deploy

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `NEXT_PUBLIC_SYSTEM_USER_ID`: System user ID for automated messages

## Database Setup

1. Enable PostGIS extension:
   ```sql
   create extension postgis;
   ```

2. Run migrations:
   ```bash
   supabase migration up
   ```

## Security Considerations

- All database access is protected by Row Level Security (RLS)
- File uploads are restricted by type and size
- Trust score calculations happen server-side
- Admin routes are protected
- All user actions are logged

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details 