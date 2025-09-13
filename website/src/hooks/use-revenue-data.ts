"use client"

import { useState, useEffect, useCallback, useRef } from "react"

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

  const mountedRef = useRef(true)

  const loadData = useCallback(async (signal: AbortSignal) => {
    setData(prev => ({ ...prev, loading: true, error: undefined }))
    
    try {
      // Load both data sources in parallel
      const [revenueResponse, ebitdaResponse] = await Promise.all([
        fetch('/data/revenue_audit_trail.json', { 
          signal, 
          cache: 'no-store' 
        }),
        fetch('/data/ebitda_audit_trail.json', { 
          signal, 
          cache: 'no-store' 
        })
      ])
      
      // Check if responses are ok
      if (!revenueResponse.ok || !ebitdaResponse.ok) {
        throw new Error('Failed to fetch data from server')
      }
      
      const [revenueData, ebitdaData] = await Promise.all([
        revenueResponse.json(),
        ebitdaResponse.json()
      ])
      
      // Only update state if component is still mounted and not aborted
      if (mountedRef.current && !signal.aborted) {
        setData({
          revenue: revenueData,
          ebitda: ebitdaData,
          loading: false,
          error: undefined
        })
      }
    } catch (error: unknown) {
      // Only update state if component is still mounted and not aborted
      if (mountedRef.current && !signal.aborted) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load data'
        }))
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    
    loadData(signal)
    
    return () => {
      mountedRef.current = false
      controller.abort()
    }
  }, [loadData])

  const refetch = useCallback(() => {
    const controller = new AbortController()
    loadData(controller.signal)
    return () => controller.abort()
  }, [loadData])

  return {
    ...data,
    refetch
  }
}
