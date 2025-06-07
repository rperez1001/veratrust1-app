import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Heart, MessageCircle, User, Settings } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Don't show navbar on public pages
  if (!user || pathname === '/' || pathname === '/login' || pathname === '/signup') {
    return null
  }

  const navItems = [
    {
      href: '/discover',
      icon: Heart,
      label: 'Discover'
    },
    {
      href: '/messages',
      icon: MessageCircle,
      label: 'Messages'
    },
    {
      href: '/profile',
      icon: User,
      label: 'Profile'
    },
    {
      href: '/settings',
      icon: Settings,
      label: 'Settings'
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t dark:bg-gray-900 dark:border-gray-800 z-50">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-3 px-3 text-sm ${
                  isActive
                    ? 'text-primary'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="mt-1">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
} 