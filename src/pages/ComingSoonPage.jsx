import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, Boxes, Users, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export function ComingSoonPage({ title, description }) {
  const location = useLocation()

  // Derive feature name from route if title not explicitly provided
  const getFeatureName = () => {
    if (title) return title
    const path = location.pathname.replace('/', '')
    switch (path) {
      case 'dashboard':
        return 'Executive Analytics Dashboard'
      case 'unpaid-sales':
        return 'Credit & Unpaid Sales Recovery'
      case 'audit-trail':
        return 'Compliance & Audit Trail'
      case 'profile':
        return 'User & Organization Profile'
      case 'org-hub':
        return 'Multi-Branch Organization Hub'
      case 'reports':
        return 'Advanced Financial Reports'
      default:
        return 'Feature Module'
    }
  }

  const featureTitle = getFeatureName()

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <Card className="max-w-2xl w-full p-10 bg-white border border-slate-200 shadow-xl rounded-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <Badge variant="blue" className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            Coming Soon
          </Badge>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
            {featureTitle}
          </h1>

          <p className="text-slate-600 max-w-md text-base leading-relaxed mb-8">
            {description ||
              'We are currently focusing all power on core Sales Recording, Point of Sale, and Stock Management. This module is undergoing fine-tuning and will be available soon.'}
          </p>

          {/* Quick Access to Active Core Features */}
          <div className="w-full pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Explore Active Operational Modules
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link to="/pos" className="w-full">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-3 text-slate-700 hover:text-blue-600 hover:border-blue-300">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm">POS Terminal</span>
                </Button>
              </Link>

              <Link to="/inventory" className="w-full">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-3 text-slate-700 hover:text-blue-600 hover:border-blue-300">
                  <Boxes className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-sm">Stock & Warehouses</span>
                </Button>
              </Link>

              <Link to="/staff" className="w-full">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-3 text-slate-700 hover:text-blue-600 hover:border-blue-300">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span className="font-medium text-sm">Staff Team</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
export default ComingSoonPage
