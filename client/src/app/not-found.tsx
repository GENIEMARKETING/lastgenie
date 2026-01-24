import Link from 'next/link';

/**
 * Custom 404 Not Found page
 * This page is shown when a user navigates to a non-existent route
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-purple-600 mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for. 
            The page may have been moved or doesn't exist.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Go Home
            </Link>
            <Link 
              href="/shop"
              className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium text-purple-600 bg-transparent border-2 border-purple-600 hover:bg-purple-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Shop Products
            </Link>
          </div>
          
          <div className="mt-8">
            <p className="text-sm text-gray-500">
              Need help? <Link href="/contact" className="text-purple-600 hover:underline">Contact us</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}