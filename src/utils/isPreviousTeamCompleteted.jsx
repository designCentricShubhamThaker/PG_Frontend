import { DECORATION_SEQUENCES } from "./sequence.jsx";

export const isPreviousTeamsCompleted = (item, targetTeam, glassItemId, DECORATION_SEQUENCES) => {
  const glassAssignments = item.team_assignments?.glass || [];
  const targetGlass = glassAssignments.find(g => {
    const id = g._id?.toString?.() || g?.toString?.();
    return id === glassItemId?.toString?.();
  });

  if (!targetGlass) return false;

  const decorationType = targetGlass.decoration_details?.type || targetGlass.decoration;
  const sequence = DECORATION_SEQUENCES?.[decorationType] || [];

  const currentTeamIndex = sequence.indexOf(targetTeam);
  const previousTeams = sequence.slice(0, currentTeamIndex);

  for (const team of previousTeams) {
    const teamAssignments = item.team_assignments?.[team] || [];
    const assignment = teamAssignments.find(t => {
      const tGlassId = t.glass_item_id?._id || t.glass_item_id;
      return tGlassId?.toString?.() === glassItemId?.toString?.();
    });

    if (!assignment || (assignment.team_tracking?.total_completed_qty || 0) < assignment.quantity) {
      return false;
    }
  }

  return true;
};
