export const showActivityAndActions = false

export function optionalDashboardHeadings(show = showActivityAndActions): string[] {
  return show ? ['Recent activity', 'Quick actions'] : []
}
