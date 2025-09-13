"use client"

import { useState, useEffect } from "react"

interface RevenueData {
  revenue?: {
    pipeline_run?: {
      total_revenue?: number
      projections?: {
        total_projected_revenue?: number
      }
    }
  }
  ebitda?: {
    summary?: {
      total_ebit?: number
    }
  }
  loading: boolean
  error?: string
}

export function useRevenueData() {
  const [data, setData] = useState<RevenueData>({
    revenue: null,
    ebitda: null,
    loading: true,
    error: undefined
  })

  const loadData = async () => {
    setData(prev => ({ ...prev, loading: true, error: undefined }))
    
    try {
      // Load revenue data from the same source as admin dashboard
      const revenueResponse = await fetch('/data/revenue_audit_trail.json')
      const revenueData = revenueResponse.ok ? await revenueResponse.json() : null
      
      // Load EBIT data from the same source as admin dashboard
      const ebitdaResponse = await fetch('/data/ebitda_audit_trail.json')
      const ebitdaData = ebitdaResponse.ok ? await ebitdaResponse.json() : null
      
      setData({
        revenue: revenueData,
        ebitda: ebitdaData,
        loading: false,
        error: undefined
      })
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }))
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return {
    ...data,
    refetch: loadData
  }
}
