export const mergeItemAssignmentsSafe = (
  existingItem,
  newItem,
  teamKey, // e.g., 'printing', 'foiling'
  targetGlassItem = null
) => {
  const existingAssignments = existingItem.team_assignments?.[teamKey] || [];
  const newAssignments = newItem.team_assignments?.[teamKey] || [];

  // CRITICAL: Always preserve glass assignments from existing item
  const keepGlassAssignments = existingItem.team_assignments?.glass || [];

  let mergedTeamAssignments = [];

  if (targetGlassItem) {
    // Keep assignments for other glass items
    const existingForOtherGlasses = existingAssignments.filter(a => {
      const gId = a.glass_item_id?._id || a.glass_item_id;
      return gId?.toString() !== targetGlassItem.toString();
    });

    // Add new assignments for target glass
    const newForTargetGlass = newAssignments.filter(a => {
      const gId = a.glass_item_id?._id || a.glass_item_id;
      return gId?.toString() === targetGlassItem.toString();
    });

    mergedTeamAssignments = [...existingForOtherGlasses, ...newForTargetGlass];
  } else {
    // Replace all assignments for this team
    mergedTeamAssignments = newAssignments;
  }

  // CRITICAL: Always preserve glass assignments
  const finalTeamAssignments = {
    ...existingItem.team_assignments,
    glass: keepGlassAssignments, // Force preserve glass assignments
    [teamKey]: mergedTeamAssignments,
  };

  return {
    ...existingItem,
    ...newItem,
    team_assignments: finalTeamAssignments
  };
};
