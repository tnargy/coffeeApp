import { useLiveQuery } from 'dexie-react-hooks'
import { loadState } from '../data/repository.ts'

export function useAppState() {
  return useLiveQuery(() => loadState(), [])
}
