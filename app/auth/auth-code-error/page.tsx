import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Authentication Error
          </CardTitle>
          <CardDescription className="text-base">
            Sorry, we couldn't complete your sign-in. This might be due to:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• The authentication code has expired</li>
            <li>• The request was cancelled or interrupted</li>
            <li>• There was a temporary server issue</li>
          </ul>
          
          <div className="space-y-3">
            <Button asChild className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Link href="/">
                Try Again
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full h-12 text-base">
              <Link href="/">
                Return to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}