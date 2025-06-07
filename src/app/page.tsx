import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold text-primary mb-6">
          Welcome to VeraTrust
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Find meaningful connections with people who share your values
        </p>
        
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row justify-center">
          <Link
            href="/login"
            className="inline-block px-8 py-3 bg-primary text-white rounded-full hover:bg-opacity-90 transition-all text-lg font-semibold"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-secondary text-white rounded-full hover:bg-opacity-90 transition-all text-lg font-semibold"
          >
            Sign Up
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-primary mb-3">Verified Profiles</h3>
            <p className="text-gray-600">Connect with genuine people who have been verified by our trust system.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-primary mb-3">Value Matching</h3>
            <p className="text-gray-600">Find people who share your core values and life goals.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-primary mb-3">Safe Dating</h3>
            <p className="text-gray-600">Your safety is our priority with our comprehensive verification system.</p>
          </div>
        </div>
      </div>
    </main>
  )
} 