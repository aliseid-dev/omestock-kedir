import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import App from './App'
import './index.css'

const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://calm-fly-269.eu-west-1.convex.cloud'
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''

const convex = new ConvexReactClient(convexUrl)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <App />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </React.StrictMode>
)
