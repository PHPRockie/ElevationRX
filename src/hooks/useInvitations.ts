import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useCoach } from '../contexts/CoachContext'
import type { Invitation } from '../types/database'

interface UseInvitationsResult {
  invitations: Invitation[]
  loading: boolean
  error: string | null
  createInvitation: (email: string, fullName: string) => Promise<Invitation>
  revokeInvitation: (id: string) => Promise<void>
}

export function useInvitations(): UseInvitationsResult {
  const { coach, gym } = useCoach()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvitations = useCallback(async () => {
    if (!gym) { setLoading(false); return }
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('gym_id', gym.id)
      .order('created_at', { ascending: false })
    if (fetchError) {
      setError('Failed to load invitations.')
    } else {
      setInvitations(data ?? [])
    }
    setLoading(false)
  }, [gym])

  useEffect(() => {
    let cancelled = false
    if (!gym) { setLoading(false); return }
    setLoading(true)
    setError(null)
    supabase
      .from('invitations')
      .select('*')
      .eq('gym_id', gym.id)
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) {
          setError('Failed to load invitations.')
        } else {
          setInvitations(data ?? [])
        }
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [gym])

  async function createInvitation(email: string, fullName: string): Promise<Invitation> {
    if (!gym || !coach) throw new Error('Not authenticated')
    const { data, error: insertError } = await supabase
      .from('invitations')
      .insert({ gym_id: gym.id, email, full_name: fullName, invited_by: coach.id })
      .select()
      .single()
    if (insertError) throw insertError
    await fetchInvitations()
    return data
  }

  async function revokeInvitation(id: string): Promise<void> {
    if (!gym) return
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ status: 'revoked' })
      .eq('id', id)
      .eq('gym_id', gym.id)
    if (updateError) throw updateError
    await fetchInvitations()
  }

  return { invitations, loading, error, createInvitation, revokeInvitation }
}
